import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFeedPostSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ImageIcon, ImagePlus, Upload, X, Check, CalendarClock, Pin } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { RichTextEditor } from "./rich-text-editor";
import { format, addDays, addHours } from "date-fns";

interface CreatePostFormProps {
  challengeId: number;
  onSuccess?: () => void;
}

export function CreatePostForm({ challengeId, onSuccess }: CreatePostFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    resolver: zodResolver(insertFeedPostSchema),
    defaultValues: {
      content: "",
      imageUrl: "", // We'll set this to empty string
      isPinned: false,
      isScheduled: false,
      scheduledFor: "",
      challengeId,
    },
  });
  
  const handleImageChange = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    // We're still using imageUrl in the form, but it will be replaced with the file in mutation
    form.setValue("imageUrl", "file-upload-pending", { shouldValidate: true });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    form.setValue("imageUrl", "", { shouldValidate: true });
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Submitting post data:", data);
      console.log("Challenge ID:", challengeId);
      
      // Only allow host to pin posts
      if (data.isPinned && (!user || !user.isHost)) {
        throw new Error("Only hosts can pin posts");
      }

      try {
        // Prepare the post data
        const postData = {
          content: data.content,
          challengeId: challengeId,
          isPinned: data.isPinned || false,
          isScheduled: data.isScheduled || false,
          scheduledFor: data.isScheduled ? data.scheduledFor : null,
        };
        
        console.log("Sending post data:", postData);
        
        // Use apiRequest helper from queryClient
        const res = await apiRequest(
          'POST', 
          `/api/challenges/${challengeId}/posts/simple`,
          postData
        );
        
        console.log("Response status:", res.status);
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error("API error:", errorData);
          throw new Error(errorData.error || 'Failed to create post');
        }
        
        const result = await res.json();
        console.log("Post created successfully:", result);
        return result;
      } catch (error) {
        console.error("Error in mutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Post creation success, invalidating queries");
      // Force refresh cache
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/posts`] });
      // Force refetch immediately
      queryClient.refetchQueries({ queryKey: [`/api/challenges/${challengeId}/posts`] });
      
      toast({
        title: "Success",
        description: "Post created successfully.",
      });
      
      form.reset();
      setSelectedImage(null);
      setPreviewUrl(null);
      
      // Run onSuccess callback after a slight delay to ensure dialog is closed
      setTimeout(() => {
        onSuccess?.();
      }, 300);
    },
    onError: (error: Error) => {
      console.error("Post creation error in handler:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Listen for changes to isScheduled
  useEffect(() => {
    // When isScheduled changes to true, set a default future date if empty
    const isScheduled = form.watch("isScheduled");
    const currentScheduledFor = form.watch("scheduledFor");
    
    if (isScheduled && !currentScheduledFor) {
      // Set default to 24 hours from now
      const futureDate = addHours(new Date(), 24);
      // Format as yyyy-MM-ddThh:mm (compatible with datetime-local input)
      const formattedDate = futureDate.toISOString().slice(0, 16);
      form.setValue("scheduledFor", formattedDate, { shouldValidate: true });
    }
  }, [form.watch("isScheduled")]);
  
  const isHost = user?.isHost;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <RichTextEditor 
                  content={field.value} 
                  onChange={field.onChange}
                  placeholder="Write your post here... You can format text, add links, and more!"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Temporarily disabled image upload to fix the form issue */}
        <div className="rounded-lg border p-4 bg-muted/10">
          <p className="text-sm text-muted-foreground">
            Image upload is temporarily disabled to improve stability.
          </p>
        </div>
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <input 
              type="hidden" 
              {...field}
            />
          )}
        />

        {isHost && (
          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="isPinned"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Pin this post</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isScheduled"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Schedule post</FormLabel>
                </FormItem>
              )}
            />
          </div>
        )}

        {form.watch("isScheduled") && (
          <FormField
            control={form.control}
            name="scheduledFor"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Schedule for
                </FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormDescription>
                  Your post will automatically be published at the selected date and time.
                  (Default is 24 hours from now)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button 
          type="button" 
          className="w-full" 
          disabled={mutation.isPending || !form.getValues("content") || (form.watch("isScheduled") && !form.watch("scheduledFor"))}
          onClick={() => {
            console.log("Post submit button clicked directly");
            
            // Get the form data manually
            const formData = form.getValues();
            
            // Validate content is present
            if (!formData.content) {
              toast({
                title: "Error",
                description: "Please enter a message for your post",
                variant: "destructive",
              });
              return;
            }
            
            // Validate scheduledFor if isScheduled is true
            if (formData.isScheduled && !formData.scheduledFor) {
              toast({
                title: "Error",
                description: "Please select a date and time for your scheduled post",
                variant: "destructive",
              });
              return;
            }
            
            // Manually call the mutation
            console.log("Manually submitting post with data:", formData);
            mutation.mutate(formData);
            
            // Provide feedback
            toast({
              title: "Processing...",
              description: "Your post is being created. Please wait.",
            });
          }}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {form.watch("isScheduled") ? (
                <>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Schedule Post
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Create Post
                </>
              )}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
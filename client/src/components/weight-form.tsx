import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWeightRecordSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ImagePlus, Upload, X, Check } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface WeightFormProps {
  challengeId: number;
  onSuccess?: () => void;
  className?: string;
}

export function WeightForm({ challengeId, onSuccess, className }: WeightFormProps) {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    resolver: zodResolver(insertWeightRecordSchema),
    defaultValues: {
      challengeId,
      weight: "",
      imageUrl: "",
    },
    mode: "onChange", // Enable validation on change
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
    form.setValue("imageUrl", url, { shouldValidate: true });
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
    mutationFn: async (data: { weight: string; imageUrl?: string }) => {
      console.log("Submitting weight data:", data);
      
      const formData = new FormData();
      formData.append('weight', data.weight);
      formData.append('challengeId', challengeId.toString());

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const res = await fetch('/api/weight-records', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit weight record');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/weight-records`] });
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/users/${challengeId}/weight-records`] });

      toast({
        title: "Success!",
        description: "Your weight has been recorded. Keep up the great work! 💪",
      });

      form.reset({
        challengeId,
        weight: "",
        imageUrl: "",
      });
      setSelectedImage(null);
      setPreviewUrl(null);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    console.log("Form submitted with data:", data);
    if (!data.weight) {
      toast({
        title: "Error",
        description: "Please enter your weight",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(data);
  });

  // Weight is required for submission
  const weightValue = form.watch("weight");
  const isSubmitDisabled = !weightValue || mutation.isPending;

  return (
    <Form {...form}>
      <form 
        onSubmit={onSubmit} 
        className={cn("space-y-4", className)}
      >
        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Weight (lbs)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.1" 
                  placeholder="Enter your current weight"
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    form.trigger("weight");
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Verification Photo</FormLabel>
          <FormControl>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-4 transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted",
                "cursor-pointer"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              {!previewUrl ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImagePlus className="h-8 w-8" />
                  <p className="text-sm font-medium">
                    Drag and drop your photo here or click to browse
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageChange(file);
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Browse Files
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Weight verification preview"
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  {selectedImage && (
                    <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </FormControl>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a photo of your scale for verification (max 5MB)
          </p>
        </FormItem>

        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitDisabled}
          aria-disabled={isSubmitDisabled}
        >
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Weight
        </Button>
      </form>
    </Form>
  );
}
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWeightRecordSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ImagePlus, Upload, X, Check, Info, Clock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWebSocket } from "@/hooks/use-websocket";

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
    // Log the incoming file details
    console.log("Image being processed:", {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
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

    // First clean up any previous image
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Then set the new image
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Set a placeholder value to indicate file is ready
    form.setValue("imageUrl", "file-upload-pending", { shouldValidate: true });
    
    // Log the confirmation of image set
    console.log("Image has been set:", {
      fileName: file.name,
      fileType: file.type,
      previewUrl: url,
      selectedImageSet: true
    });
    
    // Display confirmation to the user
    toast({
      title: "Photo added",
      description: "Your verification photo has been added. Click Submit Weight when ready.",
      duration: 3000,
    });
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
    // Clear the image data
    setSelectedImage(null);
    
    // Release the object URL to avoid memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setPreviewUrl(null);
    
    // Reset the form value
    form.setValue("imageUrl", "", { shouldValidate: true });
    
    // Inform the user
    toast({
      title: "Photo removed",
      description: "Please upload a new verification photo before submitting",
      duration: 3000,
    });
  };

  const mutation = useMutation({
    mutationFn: async (data: { weight: string; imageUrl?: string }) => {
      console.log("Submitting weight data:", data);
      
      // Validate weight before submission
      const weightNum = parseFloat(data.weight);
      if (isNaN(weightNum) || weightNum <= 0) {
        throw new Error("Please enter a valid weight");
      }
      
      // Validate that we have an image if required
      if (!selectedImage) {
        throw new Error("Please upload a verification photo");
      }
      
      const formData = new FormData();
      formData.append('weight', data.weight);
      formData.append('challengeId', challengeId.toString());

      if (selectedImage) {
        formData.append('image', selectedImage);
        console.log('Image added to form data:', selectedImage.name, selectedImage.type, selectedImage.size);
      }

      console.log('Submitting form data to server');
      const res = await fetch('/api/weight-records', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        console.error('Weight submission error:', res.status, res.statusText);
        let errorMessage = 'Failed to submit weight record';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }

      return res.json();
    },
    onSuccess: (data) => {
      console.log('Weight record submitted successfully:', data);
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/weight-records`] });
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/users/${challengeId}/weight-records`] });

      toast({
        title: "Success!",
        description: "Your weight has been recorded. Keep up the great work! 💪",
      });

      // Clean up form
      form.reset({
        challengeId,
        weight: "",
        imageUrl: "",
      });
      
      // Release any object URLs to avoid memory leaks
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      setSelectedImage(null);
      setPreviewUrl(null);
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Weight form submission error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    console.log("Form submitted with data:", data);
    
    // Get the weight value directly from the form input
    const weightValue = form.getValues("weight");
    console.log("Weight value from form:", weightValue);
    
    if (!weightValue) {
      toast({
        title: "Error",
        description: "Please enter your weight",
        variant: "destructive",
      });
      return;
    }
    
    // Verify we have the selected image object
    console.log("Selected image at submission:", selectedImage);
    if (!selectedImage) {
      toast({
        title: "Error",
        description: "Please upload a verification photo",
        variant: "destructive",
      });
      return;
    }
    
    // Call mutation explicitly with current values
    mutation.mutate({
      weight: weightValue,
      imageUrl: form.getValues("imageUrl")
    });
    
    // Show toast to confirm submission is in progress
    toast({
      title: "Processing...",
      description: "Your weight submission is being processed. Please wait.",
    });
  });

  // Watch the weight value
  const weightValue = form.watch("weight");
  
  // Debug logging to help troubleshoot
  console.log("Form state:", { 
    weightValue, 
    hasImage: !!selectedImage, 
    isPending: mutation.isPending,
    isSubmitDisabled: !weightValue || !selectedImage || mutation.isPending
  });
  
  // Disable button if no weight, no image, or during pending state
  const isSubmitDisabled = !weightValue || !selectedImage || mutation.isPending;

  return (
    <Form {...form}>
      <form 
        onSubmit={onSubmit} 
        className={cn("space-y-4", className)}
      >
        <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
          <h4 className="text-sm font-medium text-blue-700 mb-1 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
            How to Submit Your Weight
          </h4>
          <ol className="text-xs text-blue-600 pl-5 space-y-1 list-decimal">
            <li>Enter your current weight in pounds below</li>
            <li>Upload a clear photo of your scale showing the weight</li>
            <li>Click "Submit Weight" to record your progress</li>
          </ol>
          <p className="text-xs text-blue-600 mt-2 font-medium border-t border-blue-100 pt-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            All weight submissions are permanently stored and viewable throughout the challenge in your progress history and on the leaderboard.
          </p>
        </div>

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
            Upload a photo of your scale showing your weight for verification (max 5MB)
          </p>
          <p className="text-xs text-muted-foreground italic mt-1">
            <span className="flex items-center text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              For verification, make sure the weight on scale matches what you entered above!
            </span>
          </p>
        </FormItem>

        <div className="relative">
          {/* Status indicator for debugging */}
          <div className="absolute -top-6 left-0 right-0 text-xs text-center text-muted-foreground">
            {weightValue && selectedImage ? 
              <span className="text-green-500">Ready to submit</span> : 
              <span className="text-amber-500">
                {!weightValue ? "Need weight" : ""}{!weightValue && !selectedImage ? " and " : ""}{!selectedImage ? "Need photo" : ""}
              </span>
            }
          </div>
          
          <Button 
            type="button" 
            className="w-full"
            disabled={isSubmitDisabled}
            onClick={() => {
              // Manual submit handler as a fallback - ensures the form submits even if the regular form submission doesn't work
              console.log("Submit button clicked directly with state:", {
                weightValue,
                selectedImage,
                isPending: mutation.isPending
              });
              
              // Only proceed if we have both values and not already submitting
              if (weightValue && selectedImage && !mutation.isPending) {
                // Call mutation explicitly with current values
                mutation.mutate({
                  weight: form.getValues("weight"),
                  imageUrl: form.getValues("imageUrl")
                });
                
                // Show toast to confirm submission is in progress
                toast({
                  title: "Processing...",
                  description: "Your weight submission is being processed. Please wait.",
                });
              }
            }}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Submit Weight
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
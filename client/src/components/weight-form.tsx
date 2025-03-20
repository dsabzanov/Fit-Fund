import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWeightRecordSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ImageIcon, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

interface WeightFormProps {
  challengeId: number;
  onSuccess?: () => void;
}

export function WeightForm({ challengeId, onSuccess }: WeightFormProps) {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(insertWeightRecordSchema),
    defaultValues: {
      challengeId,
      weight: "",
      imageUrl: "",
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
      form.setValue("imageUrl", url);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: { weight: string; imageUrl?: string }) => {
      const formData = new FormData();
      formData.append('weight', data.weight);
      formData.append('challengeId', challengeId.toString());

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const res = await fetch('/api/weight-records', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to submit weight record');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}`] });
      toast({
        title: "Weight Updated",
        description: "Your weight has been recorded successfully.",
      });
      form.reset();
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Weight (lbs)</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Verification Photo
          </FormLabel>
          <FormControl>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
          </FormControl>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a photo of your scale for verification (max 5MB)
          </p>
        </FormItem>

        {previewUrl && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <img
                src={previewUrl}
                alt="Weight verification preview"
                className="w-full h-48 object-cover"
              />
            </CardContent>
          </Card>
        )}

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Weight
        </Button>
      </form>
    </Form>
  );
}
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWeightRecordSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WeightFormProps {
  challengeId: number;
  onSuccess?: () => void;
}

export function WeightForm({ challengeId, onSuccess }: WeightFormProps) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertWeightRecordSchema),
    defaultValues: {
      challengeId,
      weight: "",
      imageUrl: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: { weight: string; imageUrl?: string }) => {
      const res = await apiRequest("POST", "/api/weight-records", {
        ...data,
        challengeId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}`] });
      toast({
        title: "Weight Updated",
        description: "Your weight has been recorded successfully.",
      });
      form.reset();
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

  const imageUrl = form.watch("imageUrl");

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

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Verification Photo URL
              </FormLabel>
              <FormControl>
                <Input 
                  type="url" 
                  placeholder="https://example.com/your-weight-photo.jpg"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {imageUrl && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <img
                src={imageUrl}
                alt="Weight verification"
                className="w-full h-48 object-cover"
                onError={() => {
                  toast({
                    title: "Image Error",
                    description: "Failed to load the image. Please check the URL.",
                    variant: "destructive",
                  });
                }}
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFeedPostSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ImageIcon } from "lucide-react";

interface CreatePostFormProps {
  challengeId: number;
  onSuccess?: () => void;
}

export function CreatePostForm({ challengeId, onSuccess }: CreatePostFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm({
    resolver: zodResolver(insertFeedPostSchema),
    defaultValues: {
      content: "",
      imageUrl: "",
      isPinned: false,
      isScheduled: false,
      scheduledFor: "",
      challengeId,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Only allow host to pin posts
      if (data.isPinned && (!user || !user.isHost)) {
        throw new Error("Only hosts can pin posts");
      }

      const res = await apiRequest("POST", `/api/challenges/${challengeId}/posts`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/posts`] });
      toast({
        title: "Success",
        description: "Post created successfully.",
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
                <Textarea {...field} />
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
                Image URL
              </FormLabel>
              <FormControl>
                <Input {...field} type="url" placeholder="https://example.com/image.jpg" />
              </FormControl>
              <FormMessage />
            </FormItem>
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
                <FormLabel>Schedule for</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Post
        </Button>
      </form>
    </Form>
  );
}
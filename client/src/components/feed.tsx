import { FeedPost as FeedPostType } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreatePostForm } from "./create-post-form";
import { FeedPostCard } from "./feed-post";
import { Plus, Loader2 } from "lucide-react";

interface FeedProps {
  challengeId: number;
}

export function Feed({ challengeId }: FeedProps) {
  const { data: posts = [], isLoading } = useQuery<FeedPostType[]>({
    queryKey: [`/api/challenges/${challengeId}/posts`],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Feed</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
            </DialogHeader>
            <CreatePostForm challengeId={challengeId} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
        {posts.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No posts yet. Be the first to post!
          </p>
        )}
      </div>
    </div>
  );
}
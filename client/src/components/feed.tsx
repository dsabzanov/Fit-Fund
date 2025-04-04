import { FeedPost as FeedPostType } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreatePostForm } from "./create-post-form";
import { FeedPostCard } from "./feed-post";
import { Plus, Loader2 } from "lucide-react";

interface FeedProps {
  challengeId: number;
}

export function Feed({ challengeId }: FeedProps) {
  const { data: posts = [], isLoading, isError, refetch } = useQuery<FeedPostType[]>({
    queryKey: [`/api/challenges/${challengeId}/posts`],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // This is a hack to force refetch when the dialog closes
  const handlePostCreated = () => {
    console.log("Post created, refetching feed...");
    setTimeout(() => refetch(), 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8" role="status" aria-label="Loading feed posts">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }
  
  if (isError) {
    console.error("Error loading posts");
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>Failed to load posts. Please try again.</p>
        <Button onClick={() => refetch()} className="mt-2">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold" id="feed-title">Community Feed</h2>
          <Badge variant="outline" className="bg-primary/5">
            Participant View
          </Badge>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" aria-label="Create new post">
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
            </DialogHeader>
            <CreatePostForm challengeId={challengeId} onSuccess={handlePostCreated} />
          </DialogContent>
        </Dialog>
      </div>

      <div 
        className="space-y-4" 
        role="feed" 
        aria-labelledby="feed-title"
        aria-busy={isLoading}
      >
        {posts.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
        {posts.length === 0 && (
          <p 
            className="text-center text-muted-foreground py-8"
            role="status"
            aria-label="No posts available"
          >
            No posts yet. Be the first to post!
          </p>
        )}
      </div>
    </div>
  );
}
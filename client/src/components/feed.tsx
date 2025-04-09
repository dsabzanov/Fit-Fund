import { FeedPost as FeedPostType, Challenge } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreatePostForm } from "./create-post-form";
import { FeedPostCard } from "./feed-post";
import { Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface FeedProps {
  challengeId: number;
}

export function Feed({ challengeId }: FeedProps) {
  const { user } = useAuth();
  
  // Fetch the challenge to determine if the current user is the host
  const { data: challenge } = useQuery<Challenge>({
    queryKey: [`/api/challenges/${challengeId}`],
  });
  
  // Determine if the current user is the host of this challenge
  const isHost = challenge ? challenge.userId === user?.id : false;
  
  const { data: posts = [], isLoading, isError, refetch } = useQuery<FeedPostType[]>({
    queryKey: [`/api/challenges/${challengeId}/posts`],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  // This is a more robust approach to force refetch when the dialog closes
  const handlePostCreated = () => {
    console.log("Post created, refetching feed immediately...");
    // Execute multiple refetches to ensure we get the latest data
    refetch().then(() => {
      console.log("First refetch complete, trying again in 500ms");
      setTimeout(() => {
        refetch().then(() => {
          console.log("Second refetch complete");
        });
      }, 500);
    });
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
          <Badge variant="outline" className={isHost ? "bg-primary/20" : "bg-primary/5"}>
            {isHost ? "Host View" : "Participant View"}
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
        {/* Sort posts so pinned posts appear first */}
        {posts
          .sort((a, b) => {
            // Sort by pinned status (pinned first)
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            // Then sort by date (newest first)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
          .map((post) => (
            <FeedPostCard 
              key={post.id} 
              post={post} 
              challenge={challenge}
              isHost={isHost} 
            />
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
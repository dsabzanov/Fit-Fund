import { useState } from "react";
import { FeedPost as FeedPostType, Comment, InsertComment } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Pin } from "lucide-react";

interface FeedPostProps {
  post: FeedPostType;
}

export function FeedPostCard({ post }: FeedPostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: [`/api/posts/${post.id}/comments`],
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/posts/${post.id}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      setNewComment("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-x-4">
        <Avatar>
          <AvatarFallback>
            {post.userId.toString().slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">User {post.userId}</span>
            {post.isPinned && (
              <Pin className="h-4 w-4 text-primary" />
            )}
          </div>
          <time className="text-sm text-muted-foreground">
            {format(new Date(post.createdAt), "PPp")}
          </time>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>{post.content}</p>
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt="Post attachment"
            className="rounded-lg max-h-96 w-full object-cover"
          />
        )}

        <div className="space-y-4 mt-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {comment.userId.toString().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">User {comment.userId}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), "Pp")}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))}

          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={commentMutation.isPending}
            >
              {commentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Post"
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
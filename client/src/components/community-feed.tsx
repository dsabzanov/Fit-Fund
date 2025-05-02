import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { getWebSocket, sendMessage } from "@/lib/websocket";
import { ChatMessage } from "@shared/schema";
import { format } from "date-fns";
import { 
  MoreHorizontal, 
  Pin, 
  Trash2,
  AlertCircle
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CommunityFeedProps {
  challengeId: number;
  initialMessages: ChatMessage[];
}

export function CommunityFeed({ challengeId, initialMessages }: CommunityFeedProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
  
  // Sort messages to show pinned messages at the top
  const sortedMessages = [...messages].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
  });

  useEffect(() => {
    const ws = getWebSocket();
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chat" && data.challengeId === challengeId) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    return () => {
      ws.close();
    };
  }, [challengeId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newMessage,
          challengeId,
          userId: user.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const message = await response.json();
      sendMessage("chat", { ...message, challengeId });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  // Admin functions for message moderation
  const handlePinMessage = async (messageId: number, isPinned: boolean) => {
    if (!user?.isAdmin) return;
    
    try {
      const res = await apiRequest("PATCH", `/api/admin/chat/${messageId}/pin`, { pinned: !isPinned });
      
      if (res.ok) {
        // Update the message in the local state
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isPinned: !isPinned } : msg
        ));
        
        toast({
          title: !isPinned ? "Message pinned" : "Message unpinned",
          description: !isPinned 
            ? "The message will now appear at the top of the feed" 
            : "The message is no longer pinned",
        });
      } else {
        throw new Error("Failed to update pin status");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update message pin status",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteMessage = async () => {
    if (!messageToDelete || !user?.isAdmin) return;
    
    try {
      const res = await apiRequest("DELETE", `/api/admin/chat/${messageToDelete}`);
      
      if (res.ok) {
        // Remove the message from the local state
        setMessages(prev => prev.filter(msg => msg.id !== messageToDelete));
        
        toast({
          title: "Message deleted",
          description: "The message has been removed from the feed",
        });
      } else {
        throw new Error("Failed to delete message");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    } finally {
      setMessageToDelete(null);
    }
  };

  return (
    <>
      <AlertDialog open={!!messageToDelete} onOpenChange={() => setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the message from the community feed.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessage}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Community Feed
            {user?.isAdmin && (
              <Badge variant="outline" className="ml-2 text-xs bg-purple-100 text-purple-800 border-purple-300">
                Admin Mode
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          <ScrollArea className="flex-grow mb-4">
            <div className="space-y-4">
              {sortedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.userId === user?.id ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.userId !== user?.id && (
                    <Avatar>
                      <AvatarFallback>
                        {message.userId.toString().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg p-3 max-w-[80%] ${
                      message.userId === user?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    } ${message.isPinned ? "border-2 border-yellow-400" : ""}`}
                  >
                    {/* Admin dropdown menu for message actions */}
                    {user?.isAdmin && (
                      <div className="relative float-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Admin menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handlePinMessage(message.id, message.isPinned)}
                              className="cursor-pointer"
                            >
                              <Pin className="mr-2 h-4 w-4" />
                              {message.isPinned ? "Unpin message" : "Pin message"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setMessageToDelete(message.id)}
                              className="text-red-600 cursor-pointer focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete message
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                    
                    {/* Display pin indicator for all users */}
                    {message.isPinned && (
                      <Badge className="mb-1 bg-yellow-500 text-white border-0">
                        <Pin className="mr-1 h-3 w-3" /> Pinned
                      </Badge>
                    )}
                    
                    <p>{message.message}</p>
                    <p className="text-xs opacity-70">
                      {format(new Date(message.sentAt), "HH:mm")}
                    </p>
                  </div>
                  {message.userId === user?.id && (
                    <Avatar>
                      <AvatarFallback>
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
            />
            <Button type="submit">Send</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ChatMessage } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { getWebSocket, sendMessage } from "@/lib/websocket";

interface ChallengeFeedProps {
  challengeId: number;
  initialMessages: ChatMessage[];
}

export function ChallengeFeed({ challengeId, initialMessages }: ChallengeFeedProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = getWebSocket();
    
    ws?.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chat" && data.challengeId === challengeId) {
        setMessages(prev => [...prev, data.message]);
      }
    });

    return () => {
      ws?.close();
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

  return (
    <div className="flex flex-col h-[400px]">
      <ScrollArea className="flex-grow mb-4">
        <div className="space-y-4 p-1">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet. Be the first to post!</p>
            </div>
          ) : (
            messages.map((message) => (
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
                  }`}
                >
                  <p>{message.message}</p>
                  <p className="text-xs opacity-70">
                    {format(new Date(message.sentAt), "HH:mm")}
                  </p>
                </div>
                {message.userId === user?.id && (
                  <Avatar>
                    <AvatarFallback>
                      {user.username?.slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message here..."
          className="min-h-[60px]"
        />
        <Button type="submit" disabled={!newMessage.trim() || !user}>
          Send
        </Button>
      </form>
    </div>
  );
}
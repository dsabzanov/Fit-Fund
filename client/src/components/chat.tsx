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

interface ChatProps {
  challengeId: number;
  initialMessages: ChatMessage[];
}

export function Chat({ challengeId, initialMessages }: ChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <ScrollArea className="flex-grow mb-4">
          <div className="space-y-4">
            {messages.map((message) => (
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
  );
}

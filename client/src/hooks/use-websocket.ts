import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

type WebSocketMessage = {
  type: string;
  data?: any;
  action?: string;
  status?: string;
  recordId?: number;
  messageId?: number;
  isPinned?: boolean;
  challengeId?: number;
  userId?: number;
};

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const { toast } = useToast();

  // Initialize WebSocket connection
  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws-chat`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        setSocket(null);
      }, 5000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        console.log('WebSocket message received:', message);
        setLastMessage(message);
        
        // Handle specific message types
        if (message.type === 'admin-action') {
          // Handle admin actions
          if (message.action === 'weight-verification') {
            // Show a toast notification about weight verification
            if (message.status === 'approved') {
              toast({
                title: 'Weight Verified',
                description: 'Your weight submission has been approved!',
                variant: 'default',
              });
            } else if (message.status === 'rejected') {
              toast({
                title: 'Weight Rejected',
                description: 'Your weight submission was rejected. Check feedback for details.',
                variant: 'destructive',
              });
            }
          } else if (message.action === 'pin-message') {
            toast({
              title: message.isPinned ? 'Message Pinned' : 'Message Unpinned',
              description: 'An admin has updated a message in this challenge.',
              variant: 'default',
            });
          } else if (message.action === 'delete-message') {
            toast({
              title: 'Message Deleted',
              description: 'An admin has removed a message from this challenge.',
              variant: 'default',
            });
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    setSocket(ws);
    
    // Clean up on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [toast]);
  
  // Function to send messages
  const sendMessage = useCallback((message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }, [socket]);
  
  return {
    socket,
    isConnected,
    lastMessage,
    sendMessage
  };
}
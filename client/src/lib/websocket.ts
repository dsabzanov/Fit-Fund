let ws: WebSocket | null = null;
let reconnectAttempt = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 seconds

export function connectWebSocket() {
  if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max reconnection attempts reached');
    return null;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws-chat`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('WebSocket connected');
    reconnectAttempt = 0; // Reset counter on successful connection
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    ws = null;

    // Attempt to reconnect with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
    reconnectAttempt++;

    setTimeout(() => {
      if (!ws) connectWebSocket();
    }, delay);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
}

export function getWebSocket(): WebSocket | null {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    ws = connectWebSocket();
  }
  return ws;
}

export function sendMessage(type: string, data: any) {
  const socket = getWebSocket();
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, data }));
  } else {
    console.warn('WebSocket is not connected, message not sent');
  }
}
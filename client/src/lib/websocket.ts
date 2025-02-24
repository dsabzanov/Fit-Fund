let ws: WebSocket | null = null;

export function connectWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    // Attempt to reconnect after 5 seconds
    setTimeout(connectWebSocket, 5000);
  };

  return ws;
}

export function getWebSocket(): WebSocket {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    ws = connectWebSocket();
  }
  return ws;
}

export function sendMessage(type: string, data: any) {
  const socket = getWebSocket();
  socket.send(JSON.stringify({ type, data }));
}

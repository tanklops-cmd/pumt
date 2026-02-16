import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer | null = null;
const clients: Set<WebSocket> = new Set();

export function initWebSocket(server: any) {
  wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  console.log('WebSocket server initialized');
}

export function broadcastUpdate(data: any) {
  if (!wss) return;
  
  const message = JSON.stringify({
    type: 'data-update',
    data,
    timestamp: new Date().toISOString(),
  });
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

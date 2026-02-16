// WebSocket client for real-time sync
let ws: WebSocket | null = null;
let reconnectTimer: number | null = null;
const listeners: Set<(data: any) => void> = new Set();

const WS_URL = `ws://localhost:3001`;

export function connectWebSocket() {
  if (ws?.readyState === WebSocket.OPEN) return;
  
  try {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'data-update') {
          // Notify all listeners
          listeners.forEach((listener) => listener(message.data));
        }
      } catch (e) {
        console.error('WebSocket message error:', e);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      scheduleReconnect();
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  } catch (e) {
    console.error('WebSocket connection failed:', e);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connectWebSocket();
  }, 3000);
}

export function subscribeToUpdates(callback: (data: any) => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function disconnectWebSocket() {
  if (ws) {
    ws.close();
    ws = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

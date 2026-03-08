import { io, Socket } from 'socket.io-client';
import { WebSocketMessage } from '@/types';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string, onMessage: (message: WebSocketMessage) => void, onConnect: () => void, onDisconnect: () => void) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      onConnect();
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      onDisconnect();
    });

    this.socket.on('capacity_update', (data) => {
      onMessage({
        type: 'capacity_update',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    this.socket.on('alert', (data) => {
      onMessage({
        type: 'alert',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    this.socket.on('forecast_update', (data) => {
      onMessage({
        type: 'forecast_update',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    this.socket.on('metrics_update', (data) => {
      onMessage({
        type: 'metrics_update',
        data,
        timestamp: new Date().toISOString(),
      });
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();

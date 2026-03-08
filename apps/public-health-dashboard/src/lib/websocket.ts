import { io, Socket } from 'socket.io-client';
import { WSMessage } from '@/types';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Subscribe to public health channels
      this.socket?.emit('subscribe', {
        channels: [
          'outbreak_alerts',
          'capacity_updates',
          'rrt_deployments',
          'media_events',
          'syndromic_trends',
        ],
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.socket) {
      console.warn('WebSocket not connected. Call connect() first.');
      return;
    }
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected. Cannot emit event:', event);
      return;
    }
    this.socket.emit(event, data);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Typed event listeners for public health events
  onOutbreakAlert(callback: (alert: any) => void): void {
    this.on('outbreak_alert', callback);
  }

  onCapacityUpdate(callback: (update: any) => void): void {
    this.on('capacity_update', callback);
  }

  onRRTDeployment(callback: (deployment: any) => void): void {
    this.on('rrt_deployment', callback);
  }

  onMediaEvent(callback: (event: any) => void): void {
    this.on('media_event', callback);
  }

  onSyndromicTrend(callback: (trend: any) => void): void {
    this.on('syndromic_trend', callback);
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService;

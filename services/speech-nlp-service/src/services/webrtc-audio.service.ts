import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

/**
 * WebRTC Audio Streaming Service
 * Handles real-time audio streaming for voice interfaces
 */
export class WebRTCAudioService extends EventEmitter {
  private connections: Map<string, WebSocket>;
  private audioBuffers: Map<string, Buffer[]>;

  constructor() {
    super();
    this.connections = new Map();
    this.audioBuffers = new Map();
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws: WebSocket, connectionId: string): void {
    this.connections.set(connectionId, ws);
    this.audioBuffers.set(connectionId, []);

    ws.on('message', (data: Buffer) => {
      this.handleAudioChunk(connectionId, data);
    });

    ws.on('close', () => {
      this.handleDisconnection(connectionId);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${connectionId}:`, error);
      this.handleDisconnection(connectionId);
    });

    // Send connection confirmation
    ws.send(
      JSON.stringify({
        type: 'connected',
        connectionId,
        timestamp: Date.now(),
      })
    );
  }

  /**
   * Handle incoming audio chunk
   */
  private handleAudioChunk(connectionId: string, data: Buffer): void {
    try {
      // Check if it's a control message
      const message = this.tryParseJSON(data.toString());
      if (message) {
        this.handleControlMessage(connectionId, message);
        return;
      }

      // It's audio data
      const buffers = this.audioBuffers.get(connectionId);
      if (buffers) {
        buffers.push(data);

        // Emit event for real-time processing
        this.emit('audioChunk', {
          connectionId,
          chunk: data,
          totalChunks: buffers.length,
        });
      }
    } catch (error) {
      console.error(`Error handling audio chunk for ${connectionId}:`, error);
    }
  }

  /**
   * Handle control messages
   */
  private handleControlMessage(connectionId: string, message: any): void {
    switch (message.type) {
      case 'start':
        this.emit('recordingStart', { connectionId });
        this.sendToClient(connectionId, {
          type: 'recordingStarted',
          timestamp: Date.now(),
        });
        break;

      case 'stop':
        const audioBuffer = this.getCompleteAudioBuffer(connectionId);
        this.emit('recordingStop', { connectionId, audioBuffer });
        this.sendToClient(connectionId, {
          type: 'recordingStopped',
          timestamp: Date.now(),
          duration: this.calculateDuration(audioBuffer),
        });
        // Clear buffer
        this.audioBuffers.set(connectionId, []);
        break;

      case 'pause':
        this.emit('recordingPause', { connectionId });
        this.sendToClient(connectionId, {
          type: 'recordingPaused',
          timestamp: Date.now(),
        });
        break;

      case 'resume':
        this.emit('recordingResume', { connectionId });
        this.sendToClient(connectionId, {
          type: 'recordingResumed',
          timestamp: Date.now(),
        });
        break;

      case 'ping':
        this.sendToClient(connectionId, {
          type: 'pong',
          timestamp: Date.now(),
        });
        break;

      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(connectionId: string): void {
    this.connections.delete(connectionId);
    this.audioBuffers.delete(connectionId);
    this.emit('disconnected', { connectionId });
  }

  /**
   * Get complete audio buffer for a connection
   */
  getCompleteAudioBuffer(connectionId: string): Buffer {
    const buffers = this.audioBuffers.get(connectionId);
    if (!buffers || buffers.length === 0) {
      return Buffer.alloc(0);
    }
    return Buffer.concat(buffers);
  }

  /**
   * Send message to client
   */
  sendToClient(connectionId: string, message: any): void {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: any): void {
    for (const [connectionId, ws] of this.connections.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Send audio data to client (for TTS playback)
   */
  sendAudioToClient(connectionId: string, audioData: Buffer): void {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      // Send metadata first
      ws.send(
        JSON.stringify({
          type: 'audioData',
          size: audioData.length,
          timestamp: Date.now(),
        })
      );
      // Then send audio data
      ws.send(audioData);
    }
  }

  /**
   * Get active connections count
   */
  getActiveConnectionsCount(): number {
    return this.connections.size;
  }

  /**
   * Get connection info
   */
  getConnectionInfo(connectionId: string): any {
    const ws = this.connections.get(connectionId);
    const buffers = this.audioBuffers.get(connectionId);

    return {
      connected: ws !== undefined && ws.readyState === WebSocket.OPEN,
      bufferedChunks: buffers?.length || 0,
      bufferedSize: buffers ? Buffer.concat(buffers).length : 0,
    };
  }

  /**
   * Close connection
   */
  closeConnection(connectionId: string): void {
    const ws = this.connections.get(connectionId);
    if (ws) {
      ws.close();
      this.handleDisconnection(connectionId);
    }
  }

  /**
   * Close all connections
   */
  closeAllConnections(): void {
    for (const [connectionId, ws] of this.connections.entries()) {
      ws.close();
    }
    this.connections.clear();
    this.audioBuffers.clear();
  }

  // Helper methods

  private tryParseJSON(str: string): any {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  private calculateDuration(audioBuffer: Buffer): number {
    // Assuming 16kHz sample rate, 16-bit PCM, mono
    const sampleRate = 16000;
    const bytesPerSample = 2;
    const channels = 1;
    const samples = audioBuffer.length / (bytesPerSample * channels);
    return samples / sampleRate;
  }
}

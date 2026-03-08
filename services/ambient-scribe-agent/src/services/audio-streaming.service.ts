import { EventEmitter } from 'events';
import { AudioStreamMetadata } from '../types';
import { config } from '../config';

export class AudioStreamingService extends EventEmitter {
  private activeStreams: Map<string, AudioStreamMetadata>;
  private audioBuffers: Map<string, Buffer[]>;

  constructor() {
    super();
    this.activeStreams = new Map();
    this.audioBuffers = new Map();
  }

  /**
   * Initialize a new audio stream session
   */
  public initializeStream(
    sessionId: string,
    metadata: Omit<AudioStreamMetadata, 'startTime'>
  ): AudioStreamMetadata {
    const streamMetadata: AudioStreamMetadata = {
      ...metadata,
      startTime: new Date(),
    };

    this.activeStreams.set(sessionId, streamMetadata);
    this.audioBuffers.set(sessionId, []);

    this.emit('stream:initialized', { sessionId, metadata: streamMetadata });

    return streamMetadata;
  }

  /**
   * Process incoming audio chunk
   */
  public processAudioChunk(sessionId: string, audioData: Buffer): void {
    const metadata = this.activeStreams.get(sessionId);
    
    if (!metadata) {
      throw new Error(`No active stream found for session: ${sessionId}`);
    }

    // Store audio chunk
    const buffers = this.audioBuffers.get(sessionId);
    if (buffers) {
      buffers.push(audioData);
    }

    // Emit event for real-time processing
    this.emit('audio:chunk', {
      sessionId,
      audioData,
      timestamp: new Date(),
    });
  }

  /**
   * Get complete audio buffer for a session
   */
  public getAudioBuffer(sessionId: string): Buffer | null {
    const buffers = this.audioBuffers.get(sessionId);
    
    if (!buffers || buffers.length === 0) {
      return null;
    }

    return Buffer.concat(buffers);
  }

  /**
   * Stop and finalize audio stream
   */
  public stopStream(sessionId: string): void {
    const metadata = this.activeStreams.get(sessionId);
    
    if (!metadata) {
      throw new Error(`No active stream found for session: ${sessionId}`);
    }

    const audioBuffer = this.getAudioBuffer(sessionId);
    const duration = audioBuffer ? audioBuffer.length / (metadata.sampleRate * 2) : 0;

    this.emit('stream:stopped', {
      sessionId,
      metadata,
      duration,
      audioBuffer,
    });

    // Cleanup
    this.activeStreams.delete(sessionId);
    // Keep buffer for a short time for processing
    setTimeout(() => {
      this.audioBuffers.delete(sessionId);
    }, 60000); // 1 minute
  }

  /**
   * Pause audio stream
   */
  public pauseStream(sessionId: string): void {
    const metadata = this.activeStreams.get(sessionId);
    
    if (!metadata) {
      throw new Error(`No active stream found for session: ${sessionId}`);
    }

    this.emit('stream:paused', { sessionId, metadata });
  }

  /**
   * Resume audio stream
   */
  public resumeStream(sessionId: string): void {
    const metadata = this.activeStreams.get(sessionId);
    
    if (!metadata) {
      throw new Error(`No active stream found for session: ${sessionId}`);
    }

    this.emit('stream:resumed', { sessionId, metadata });
  }

  /**
   * Get active stream metadata
   */
  public getStreamMetadata(sessionId: string): AudioStreamMetadata | null {
    return this.activeStreams.get(sessionId) || null;
  }

  /**
   * Check if stream is active
   */
  public isStreamActive(sessionId: string): boolean {
    return this.activeStreams.has(sessionId);
  }

  /**
   * Get all active sessions
   */
  public getActiveSessions(): string[] {
    return Array.from(this.activeStreams.keys());
  }

  /**
   * Validate audio format
   */
  public validateAudioFormat(audioData: Buffer, expectedSampleRate: number): boolean {
    // Basic validation - check if buffer is not empty and has reasonable size
    if (!audioData || audioData.length === 0) {
      return false;
    }

    // Check if audio data size is reasonable (not too small, not exceeding max duration)
    const maxSize = expectedSampleRate * 2 * config.audio.maxDurationSeconds;
    if (audioData.length > maxSize) {
      return false;
    }

    return true;
  }
}

export const audioStreamingService = new AudioStreamingService();

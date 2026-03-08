import { EventEmitter } from 'events';
import { BhashiniService } from './bhashini.service';

export interface TranscriptionSegment {
  text: string;
  speaker: 'doctor' | 'patient' | 'unknown';
  startTime: number;
  endTime: number;
  confidence: number;
  language: string;
}

export interface SpeakerDiarizationResult {
  segments: TranscriptionSegment[];
  speakerCount: number;
  totalDuration: number;
}

/**
 * Real-time Transcription Service with Speaker Diarization
 * Processes audio streams and provides live transcription with speaker identification
 */
export class RealtimeTranscriptionService extends EventEmitter {
  private bhashini: BhashiniService;
  private activeTranscriptions: Map<string, TranscriptionSession>;

  constructor() {
    super();
    this.bhashini = new BhashiniService();
    this.activeTranscriptions = new Map();
  }

  /**
   * Start real-time transcription session
   */
  startSession(
    sessionId: string,
    options: {
      language: string;
      enableDiarization?: boolean;
      interimResults?: boolean;
    }
  ): void {
    const session: TranscriptionSession = {
      sessionId,
      language: options.language,
      enableDiarization: options.enableDiarization ?? true,
      interimResults: options.interimResults ?? true,
      segments: [],
      audioBuffer: [],
      startTime: Date.now(),
      lastProcessedTime: Date.now(),
    };

    this.activeTranscriptions.set(sessionId, session);

    this.emit('sessionStarted', {
      sessionId,
      timestamp: Date.now(),
    });
  }

  /**
   * Process audio chunk for real-time transcription
   */
  async processAudioChunk(sessionId: string, audioChunk: Buffer): Promise<void> {
    const session = this.activeTranscriptions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Add chunk to buffer
    session.audioBuffer.push(audioChunk);

    // Process if buffer is large enough (e.g., 2 seconds of audio)
    const bufferSize = session.audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0);
    const minBufferSize = 16000 * 2 * 2; // 2 seconds at 16kHz, 16-bit

    if (bufferSize >= minBufferSize) {
      await this.processBuffer(session);
    }
  }

  /**
   * Process accumulated audio buffer
   */
  private async processBuffer(session: TranscriptionSession): Promise<void> {
    try {
      const audioBuffer = Buffer.concat(session.audioBuffer);

      // Transcribe audio
      const transcription = await this.bhashini.speechToText({
        audioData: audioBuffer,
        sourceLanguage: session.language,
        audioFormat: 'wav',
        sampleRate: 16000,
      });

      // Perform speaker diarization if enabled
      let speaker: 'doctor' | 'patient' | 'unknown' = 'unknown';
      if (session.enableDiarization) {
        speaker = this.identifySpeaker(transcription.transcription, session);
      }

      // Create segment
      const segment: TranscriptionSegment = {
        text: transcription.transcription,
        speaker,
        startTime: session.lastProcessedTime - session.startTime,
        endTime: Date.now() - session.startTime,
        confidence: transcription.confidence,
        language: session.language,
      };

      session.segments.push(segment);
      session.lastProcessedTime = Date.now();

      // Clear processed buffer
      session.audioBuffer = [];

      // Emit transcription event
      this.emit('transcription', {
        sessionId: session.sessionId,
        segment,
        isInterim: false,
      });

      // Emit full transcript update
      this.emit('transcriptUpdate', {
        sessionId: session.sessionId,
        segments: session.segments,
        fullText: this.getFullTranscript(session.segments),
      });
    } catch (error) {
      console.error('Error processing audio buffer:', error);
      this.emit('error', {
        sessionId: session.sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Identify speaker using simple heuristics
   * In production, use proper speaker diarization models
   */
  private identifySpeaker(
    text: string,
    session: TranscriptionSession
  ): 'doctor' | 'patient' | 'unknown' {
    const lowerText = text.toLowerCase();

    // Doctor indicators
    const doctorKeywords = [
      'examine',
      'diagnosis',
      'prescribe',
      'recommend',
      'test',
      'blood pressure',
      'heart rate',
      'let me check',
      'i will prescribe',
    ];

    // Patient indicators
    const patientKeywords = [
      'i feel',
      'i have',
      'my pain',
      'hurts',
      'since',
      'started',
      'i am experiencing',
      'i cannot',
    ];

    let doctorScore = 0;
    let patientScore = 0;

    for (const keyword of doctorKeywords) {
      if (lowerText.includes(keyword)) {
        doctorScore++;
      }
    }

    for (const keyword of patientKeywords) {
      if (lowerText.includes(keyword)) {
        patientScore++;
      }
    }

    // Use previous speaker as tiebreaker
    if (doctorScore === patientScore && session.segments.length > 0) {
      return session.segments[session.segments.length - 1].speaker;
    }

    if (doctorScore > patientScore) {
      return 'doctor';
    } else if (patientScore > doctorScore) {
      return 'patient';
    }

    return 'unknown';
  }

  /**
   * Stop transcription session
   */
  async stopSession(sessionId: string): Promise<SpeakerDiarizationResult> {
    const session = this.activeTranscriptions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Process any remaining audio in buffer
    if (session.audioBuffer.length > 0) {
      await this.processBuffer(session);
    }

    const result: SpeakerDiarizationResult = {
      segments: session.segments,
      speakerCount: this.countUniqueSpeakers(session.segments),
      totalDuration: (Date.now() - session.startTime) / 1000,
    };

    this.activeTranscriptions.delete(sessionId);

    this.emit('sessionStopped', {
      sessionId,
      result,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Get current transcript for a session
   */
  getCurrentTranscript(sessionId: string): {
    segments: TranscriptionSegment[];
    fullText: string;
  } {
    const session = this.activeTranscriptions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return {
      segments: session.segments,
      fullText: this.getFullTranscript(session.segments),
    };
  }

  /**
   * Get formatted conversation
   */
  getFormattedConversation(sessionId: string): string {
    const session = this.activeTranscriptions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return session.segments
      .map((segment) => {
        const speaker = segment.speaker.charAt(0).toUpperCase() + segment.speaker.slice(1);
        return `${speaker}: ${segment.text}`;
      })
      .join('\n');
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): {
    duration: number;
    segmentCount: number;
    speakerCount: number;
    averageConfidence: number;
  } {
    const session = this.activeTranscriptions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const duration = (Date.now() - session.startTime) / 1000;
    const segmentCount = session.segments.length;
    const speakerCount = this.countUniqueSpeakers(session.segments);
    const averageConfidence =
      session.segments.reduce((sum, seg) => sum + seg.confidence, 0) / segmentCount || 0;

    return {
      duration,
      segmentCount,
      speakerCount,
      averageConfidence,
    };
  }

  // Helper methods

  private getFullTranscript(segments: TranscriptionSegment[]): string {
    return segments.map((seg) => seg.text).join(' ');
  }

  private countUniqueSpeakers(segments: TranscriptionSegment[]): number {
    const speakers = new Set(segments.map((seg) => seg.speaker));
    speakers.delete('unknown');
    return speakers.size;
  }
}

interface TranscriptionSession {
  sessionId: string;
  language: string;
  enableDiarization: boolean;
  interimResults: boolean;
  segments: TranscriptionSegment[];
  audioBuffer: Buffer[];
  startTime: number;
  lastProcessedTime: number;
}

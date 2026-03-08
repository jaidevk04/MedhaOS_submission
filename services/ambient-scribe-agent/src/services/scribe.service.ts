import { EventEmitter } from 'events';
import { ScribeSession, AudioProcessingOptions, SOAPNote } from '../types';
import { audioStreamingService } from './audio-streaming.service';
import { speakerDiarizationService } from './speaker-diarization.service';
import { realtimeTranscriptionService } from './realtime-transcription.service';
import { clinicalNERService } from './clinical-ner.service';
import { temporalExtractionService } from './temporal-extraction.service';
import { soapNoteService } from './soap-note.service';

export class ScribeService extends EventEmitter {
  private activeSessions: Map<string, ScribeSession>;

  constructor() {
    super();
    this.activeSessions = new Map();
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for audio processing pipeline
   */
  private setupEventListeners(): void {
    // Listen to audio chunks and process them
    audioStreamingService.on('audio:chunk', async (data) => {
      const { sessionId, audioData, timestamp } = data;
      
      try {
        // Real-time transcription
        const transcription = await realtimeTranscriptionService.transcribeAudioChunk(
          sessionId,
          audioData,
          timestamp.getTime() / 1000
        );
        
        if (transcription) {
          this.emit('transcription:update', {
            sessionId,
            transcription,
          });
        }
      } catch (error) {
        console.error('Error processing audio chunk:', error);
      }
    });

    // Listen to transcription segments
    realtimeTranscriptionService.on('transcription:segment', async (data) => {
      const { sessionId, segment } = data;
      const session = this.activeSessions.get(sessionId);
      
      if (session) {
        session.transcriptionSegments.push(segment);
        
        // Extract facts from new segment
        const facts = await clinicalNERService.extractFromText(
          segment.text,
          session.transcriptionSegments.length * 100
        );
        
        session.extractedFacts.push(...facts);
        
        this.emit('facts:update', {
          sessionId,
          facts,
        });
      }
    });
  }

  /**
   * Start a new scribe session
   */
  public async startSession(
    sessionId: string,
    encounterId: string,
    clinicianId: string,
    patientId: string,
    _options: AudioProcessingOptions
  ): Promise<ScribeSession> {
    // Initialize audio stream
    const metadata = audioStreamingService.initializeStream(sessionId, {
      sessionId,
      encounterId,
      clinicianId,
      patientId,
      sampleRate: 16000,
      channels: 1,
    });

    // Start transcription
    await realtimeTranscriptionService.startTranscription(sessionId);

    // Create session
    const session: ScribeSession = {
      sessionId,
      encounterId,
      status: 'active',
      transcriptionSegments: [],
      extractedFacts: [],
      startTime: new Date(),
    };

    this.activeSessions.set(sessionId, session);

    this.emit('session:started', { sessionId, metadata });

    return session;
  }

  /**
   * Process audio chunk
   */
  public processAudio(sessionId: string, audioData: Buffer): void {
    audioStreamingService.processAudioChunk(sessionId, audioData);
  }

  /**
   * Pause session
   */
  public pauseSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'paused';
    audioStreamingService.pauseStream(sessionId);

    this.emit('session:paused', { sessionId });
  }

  /**
   * Resume session
   */
  public resumeSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'active';
    audioStreamingService.resumeStream(sessionId);

    this.emit('session:resumed', { sessionId });
  }

  /**
   * Stop session and generate final SOAP note
   */
  public async stopSession(sessionId: string): Promise<ScribeSession> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Stop audio stream
    audioStreamingService.stopStream(sessionId);

    // Stop transcription
    const finalTranscription = realtimeTranscriptionService.stopTranscription(sessionId);

    // Get complete audio buffer
    const audioBuffer = audioStreamingService.getAudioBuffer(sessionId);

    if (audioBuffer) {
      // Perform speaker diarization on complete audio
      const diarizationResult = await speakerDiarizationService.diarizeAudio(
        audioBuffer,
        16000
      );

      // Map speakers to roles
      const speakerRoleMap = speakerDiarizationService.mapSpeakersToRoles(
        diarizationResult
      );

      // Align transcription with speakers
      const alignedSegments = speakerDiarizationService.alignTranscriptionWithSpeakers(
        finalTranscription,
        diarizationResult,
        speakerRoleMap
      );

      // Merge consecutive segments from same speaker
      session.transcriptionSegments = speakerDiarizationService.mergeConsecutiveSpeakerSegments(
        alignedSegments
      );
    }

    // Extract all clinical facts
    session.extractedFacts = await clinicalNERService.extractClinicalFacts(
      session.transcriptionSegments
    );

    // Filter by confidence threshold
    session.extractedFacts = clinicalNERService.filterByConfidence(
      session.extractedFacts,
      0.75
    );

    // Extract temporal relations
    const fullText = session.transcriptionSegments.map(s => s.text).join(' ');
    const temporalRelations = temporalExtractionService.extractTemporalRelations(
      fullText,
      session.extractedFacts
    );

    // Generate SOAP note
    session.soapNote = await soapNoteService.generateSOAPNote(
      session.transcriptionSegments,
      session.extractedFacts,
      temporalRelations
    );

    // Update session
    session.status = 'completed';
    session.endTime = new Date();
    session.duration = (session.endTime.getTime() - session.startTime.getTime()) / 1000;

    this.emit('session:completed', {
      sessionId,
      session,
    });

    // Cleanup
    realtimeTranscriptionService.clearSession(sessionId);

    return session;
  }

  /**
   * Get session status
   */
  public getSession(sessionId: string): ScribeSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get current transcription
   */
  public getCurrentTranscription(sessionId: string): string {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return '';
    }

    return session.transcriptionSegments.map(s => `[${s.speaker}]: ${s.text}`).join('\n');
  }

  /**
   * Get extracted facts
   */
  public getExtractedFacts(sessionId: string) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return [];
    }

    return clinicalNERService.groupFactsByType(session.extractedFacts);
  }

  /**
   * Get SOAP note preview
   */
  public async getSOAPNotePreview(sessionId: string): Promise<SOAPNote | null> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session || session.transcriptionSegments.length === 0) {
      return null;
    }

    // Generate preview SOAP note from current data
    const fullText = session.transcriptionSegments.map(s => s.text).join(' ');
    const temporalRelations = temporalExtractionService.extractTemporalRelations(
      fullText,
      session.extractedFacts
    );

    return await soapNoteService.generateSOAPNote(
      session.transcriptionSegments,
      session.extractedFacts,
      temporalRelations
    );
  }

  /**
   * Update speaker label
   */
  public updateSpeakerLabel(
    sessionId: string,
    segmentIndex: number,
    speaker: 'doctor' | 'patient'
  ): void {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.transcriptionSegments[segmentIndex]) {
      session.transcriptionSegments[segmentIndex].speaker = speaker;
      
      this.emit('speaker:updated', {
        sessionId,
        segmentIndex,
        speaker,
      });
    }
  }

  /**
   * Get session statistics
   */
  public getSessionStatistics(sessionId: string) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    const transcriptionStats = realtimeTranscriptionService.getTranscriptionStatistics(sessionId);
    const speakerStats = speakerDiarizationService.getSpeakerStatistics(
      session.transcriptionSegments
    );
    const factsByType = clinicalNERService.groupFactsByType(session.extractedFacts);

    return {
      duration: session.duration || 0,
      transcription: transcriptionStats,
      speakers: speakerStats,
      facts: {
        total: session.extractedFacts.length,
        byType: Object.fromEntries(
          Array.from(factsByType.entries()).map(([type, facts]) => [type, facts.length])
        ),
      },
    };
  }

  /**
   * Export session data
   */
  public exportSession(sessionId: string): ScribeSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Delete session
   */
  public deleteSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
    realtimeTranscriptionService.clearSession(sessionId);
  }
}

export const scribeService = new ScribeService();

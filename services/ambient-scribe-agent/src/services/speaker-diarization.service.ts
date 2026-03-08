import { SpeakerDiarizationResult, TranscriptionSegment } from '../types';

export class SpeakerDiarizationService {
  /**
   * Perform speaker diarization on audio buffer
   * In production, this would integrate with AWS Transcribe or Pyannote
   */
  public async diarizeAudio(
    audioBuffer: Buffer,
    sampleRate: number
  ): Promise<SpeakerDiarizationResult> {
    // Simulated speaker diarization
    // In production, integrate with AWS Transcribe Medical or Pyannote.audio
    
    const duration = audioBuffer.length / (sampleRate * 2); // 16-bit audio
    
    // Simulate speaker segments
    const segments = this.simulateSpeakerSegments(duration);
    
    return {
      segments,
      speakerCount: 2, // Typically doctor and patient
    };
  }

  /**
   * Map speaker labels to roles (doctor/patient)
   */
  public mapSpeakersToRoles(
    diarizationResult: SpeakerDiarizationResult,
    speakerLabels?: { doctor: string; patient: string }
  ): Map<string, 'doctor' | 'patient'> {
    const speakerRoleMap = new Map<string, 'doctor' | 'patient'>();
    
    if (speakerLabels) {
      speakerRoleMap.set(speakerLabels.doctor, 'doctor');
      speakerRoleMap.set(speakerLabels.patient, 'patient');
    } else {
      // Default mapping: assume first speaker is doctor
      const uniqueSpeakers = Array.from(
        new Set(diarizationResult.segments.map(s => s.speaker))
      );
      
      if (uniqueSpeakers.length >= 1) {
        speakerRoleMap.set(uniqueSpeakers[0], 'doctor');
      }
      if (uniqueSpeakers.length >= 2) {
        speakerRoleMap.set(uniqueSpeakers[1], 'patient');
      }
    }
    
    return speakerRoleMap;
  }

  /**
   * Align transcription with speaker segments
   */
  public alignTranscriptionWithSpeakers(
    transcriptionSegments: Array<{ text: string; startTime: number; endTime: number }>,
    diarizationResult: SpeakerDiarizationResult,
    speakerRoleMap: Map<string, 'doctor' | 'patient'>
  ): TranscriptionSegment[] {
    const alignedSegments: TranscriptionSegment[] = [];
    
    for (const transcription of transcriptionSegments) {
      // Find overlapping speaker segment
      const speakerSegment = this.findOverlappingSpeakerSegment(
        transcription.startTime,
        transcription.endTime,
        diarizationResult.segments
      );
      
      const speaker = speakerSegment
        ? speakerRoleMap.get(speakerSegment.speaker) || 'unknown'
        : 'unknown';
      
      alignedSegments.push({
        speaker,
        text: transcription.text,
        startTime: transcription.startTime,
        endTime: transcription.endTime,
        confidence: 0.85, // Default confidence
      });
    }
    
    return alignedSegments;
  }

  /**
   * Find speaker segment that overlaps with given time range
   */
  private findOverlappingSpeakerSegment(
    startTime: number,
    endTime: number,
    speakerSegments: Array<{ speaker: string; startTime: number; endTime: number }>
  ): { speaker: string; startTime: number; endTime: number } | null {
    for (const segment of speakerSegments) {
      // Check for overlap
      if (
        (startTime >= segment.startTime && startTime < segment.endTime) ||
        (endTime > segment.startTime && endTime <= segment.endTime) ||
        (startTime <= segment.startTime && endTime >= segment.endTime)
      ) {
        return segment;
      }
    }
    
    return null;
  }

  /**
   * Simulate speaker segments for development
   * In production, this would be replaced with actual diarization
   */
  private simulateSpeakerSegments(
    duration: number
  ): Array<{ speaker: string; startTime: number; endTime: number }> {
    const segments: Array<{ speaker: string; startTime: number; endTime: number }> = [];
    let currentTime = 0;
    let currentSpeaker = 'spk_0'; // Doctor
    
    // Simulate alternating speakers with varying segment lengths
    while (currentTime < duration) {
      const segmentDuration = Math.random() * 10 + 5; // 5-15 seconds
      const endTime = Math.min(currentTime + segmentDuration, duration);
      
      segments.push({
        speaker: currentSpeaker,
        startTime: currentTime,
        endTime,
      });
      
      currentTime = endTime;
      currentSpeaker = currentSpeaker === 'spk_0' ? 'spk_1' : 'spk_0'; // Alternate
    }
    
    return segments;
  }

  /**
   * Merge consecutive segments from same speaker
   */
  public mergeConsecutiveSpeakerSegments(
    segments: TranscriptionSegment[]
  ): TranscriptionSegment[] {
    if (segments.length === 0) {
      return [];
    }
    
    const merged: TranscriptionSegment[] = [];
    let current = { ...segments[0] };
    
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      
      if (segment.speaker === current.speaker && segment.startTime - current.endTime < 2) {
        // Merge if same speaker and gap is less than 2 seconds
        current.text += ' ' + segment.text;
        current.endTime = segment.endTime;
        current.confidence = (current.confidence + segment.confidence) / 2;
      } else {
        merged.push(current);
        current = { ...segment };
      }
    }
    
    merged.push(current);
    return merged;
  }

  /**
   * Get speaker statistics
   */
  public getSpeakerStatistics(segments: TranscriptionSegment[]): {
    doctor: { duration: number; wordCount: number; turnCount: number };
    patient: { duration: number; wordCount: number; turnCount: number };
  } {
    const stats = {
      doctor: { duration: 0, wordCount: 0, turnCount: 0 },
      patient: { duration: 0, wordCount: 0, turnCount: 0 },
    };
    
    for (const segment of segments) {
      if (segment.speaker === 'doctor' || segment.speaker === 'patient') {
        const duration = segment.endTime - segment.startTime;
        const wordCount = segment.text.split(/\s+/).length;
        
        stats[segment.speaker].duration += duration;
        stats[segment.speaker].wordCount += wordCount;
        stats[segment.speaker].turnCount += 1;
      }
    }
    
    return stats;
  }
}

export const speakerDiarizationService = new SpeakerDiarizationService();

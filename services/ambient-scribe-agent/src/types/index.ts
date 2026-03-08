export interface AudioStreamMetadata {
  sessionId: string;
  encounterId: string;
  clinicianId: string;
  patientId: string;
  startTime: Date;
  sampleRate: number;
  channels: number;
}

export interface TranscriptionSegment {
  speaker: 'doctor' | 'patient' | 'unknown';
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  language?: string;
}

export interface SpeakerDiarizationResult {
  segments: Array<{
    speaker: string;
    startTime: number;
    endTime: number;
  }>;
  speakerCount: number;
}

export interface ClinicalFact {
  type: 'symptom' | 'diagnosis' | 'medication' | 'allergy' | 'vital' | 'procedure' | 'temporal';
  value: string;
  normalizedValue?: string;
  confidence: number;
  context?: string;
  startOffset: number;
  endOffset: number;
  metadata?: Record<string, any>;
}

export interface MedicationFact extends ClinicalFact {
  type: 'medication';
  metadata: {
    dosage?: string;
    frequency?: string;
    route?: string;
    duration?: string;
  };
}

export interface TemporalRelation {
  event: string;
  timeExpression: string;
  relationType: 'before' | 'after' | 'during' | 'overlap';
  confidence: number;
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  extractedFacts: ClinicalFact[];
  confidence: number;
  generatedAt: Date;
}

export interface ScribeSession {
  sessionId: string;
  encounterId: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  transcriptionSegments: TranscriptionSegment[];
  extractedFacts: ClinicalFact[];
  soapNote?: SOAPNote;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

export interface AudioProcessingOptions {
  enableSpeakerDiarization: boolean;
  enableRealTimeTranscription: boolean;
  targetLanguage?: string;
  speakerLabels?: {
    doctor: string;
    patient: string;
  };
}

export interface WebSocketMessage {
  type: 'audio' | 'control' | 'transcription' | 'facts' | 'soap' | 'error';
  payload: any;
  timestamp: Date;
}

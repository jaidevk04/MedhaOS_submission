export interface ClinicalEntity {
  text: string;
  type: 'symptom' | 'diagnosis' | 'medication' | 'procedure' | 'anatomy' | 'test' | 'dosage' | 'frequency';
  startIndex: number;
  endIndex: number;
  confidence: number;
  normalizedForm?: string;
  code?: string; // ICD-10, SNOMED CT, etc.
}

export interface SymptomExtractionRequest {
  text: string;
  language?: string;
}

export interface SymptomExtractionResponse {
  symptoms: Array<{
    symptom: string;
    normalizedForm: string;
    severity?: 'mild' | 'moderate' | 'severe';
    duration?: string;
    location?: string;
    confidence: number;
  }>;
  processingTime: number;
}

export interface ClinicalFactExtractionRequest {
  conversationText: string;
  speakerLabels?: Array<{
    speaker: 'doctor' | 'patient';
    text: string;
    timestamp?: number;
  }>;
}

export interface ClinicalFactExtractionResponse {
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  severity: string;
  associatedSymptoms: string[];
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  vitalSigns: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  physicalExamFindings: string[];
  processingTime: number;
}

export interface SOAPNote {
  subjective: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    reviewOfSystems: string;
    pastMedicalHistory: string;
    medications: string[];
    allergies: string[];
    socialHistory: string;
    familyHistory: string;
  };
  objective: {
    vitalSigns: {
      bloodPressure?: string;
      heartRate?: number;
      temperature?: number;
      respiratoryRate?: number;
      oxygenSaturation?: number;
      weight?: number;
      height?: number;
    };
    physicalExam: string;
    labResults?: string;
    imagingResults?: string;
  };
  assessment: {
    diagnoses: Array<{
      diagnosis: string;
      icdCode?: string;
      confidence: number;
    }>;
    differentialDiagnoses: string[];
    clinicalImpression: string;
  };
  plan: {
    diagnosticTests: string[];
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
    }>;
    procedures: string[];
    followUp: string;
    patientEducation: string;
    referrals: string[];
  };
}

export interface SOAPNoteGenerationRequest {
  conversationText: string;
  extractedFacts?: ClinicalFactExtractionResponse;
  patientContext?: {
    age: number;
    gender: string;
    medicalHistory: string[];
    currentMedications: string[];
    allergies: string[];
  };
}

export interface SOAPNoteGenerationResponse {
  soapNote: SOAPNote;
  confidence: number;
  processingTime: number;
  requiresReview: boolean;
  reviewReasons: string[];
}

export interface MedicationEntity {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  route?: string;
  instructions?: string;
  confidence: number;
}

export interface DiagnosisEntity {
  diagnosis: string;
  icdCode?: string;
  snomedCode?: string;
  confidence: number;
  supportingEvidence: string[];
}

export const SYMPTOM_CATEGORIES = {
  cardiovascular: ['chest pain', 'palpitations', 'shortness of breath', 'edema', 'syncope'],
  respiratory: ['cough', 'dyspnea', 'wheezing', 'hemoptysis', 'chest tightness'],
  gastrointestinal: ['nausea', 'vomiting', 'diarrhea', 'abdominal pain', 'constipation', 'heartburn'],
  neurological: ['headache', 'dizziness', 'seizure', 'weakness', 'numbness', 'confusion'],
  musculoskeletal: ['joint pain', 'muscle pain', 'back pain', 'stiffness', 'swelling'],
  dermatological: ['rash', 'itching', 'lesion', 'discoloration', 'bruising'],
  general: ['fever', 'fatigue', 'weight loss', 'night sweats', 'chills', 'malaise'],
};

export const SEVERITY_INDICATORS = {
  mild: ['slight', 'minor', 'mild', 'little', 'occasional'],
  moderate: ['moderate', 'noticeable', 'frequent', 'regular'],
  severe: ['severe', 'intense', 'extreme', 'unbearable', 'constant', 'persistent'],
};

export const DURATION_PATTERNS = [
  /(\d+)\s*(hour|hr|h)/i,
  /(\d+)\s*(day|d)/i,
  /(\d+)\s*(week|wk|w)/i,
  /(\d+)\s*(month|mo|m)/i,
  /(\d+)\s*(year|yr|y)/i,
];

// Triage Session Types
export interface TriageSession {
  sessionId: string;
  patientId: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  currentQuestionIndex: number;
  responses: TriageResponse[];
  symptoms: string[];
  vitals?: VitalsData;
  urgencyScore?: number;
  recommendation?: TriageRecommendation;
  createdAt: Date;
  updatedAt: Date;
}

export interface TriageResponse {
  questionId: string;
  question: string;
  answer: string | string[];
  answeredAt: Date;
}

// Vitals Data
export interface VitalsData {
  temperature?: number; // Celsius
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number; // bpm
  respiratoryRate?: number; // breaths per minute
  spo2?: number; // percentage
  weight?: number; // kg
  height?: number; // cm
  bmi?: number;
}

// Symptom Types
export interface Symptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  onset: string;
  location?: string;
  character?: string;
  radiation?: string;
  associatedSymptoms?: string[];
}

// Questionnaire Types
export interface Question {
  id: string;
  text: string;
  type: 'single_choice' | 'multiple_choice' | 'text' | 'numeric' | 'boolean';
  options?: QuestionOption[];
  required: boolean;
  category: 'symptom' | 'history' | 'vitals' | 'demographics';
  followUpQuestions?: string[]; // IDs of follow-up questions
  condition?: QuestionCondition;
}

export interface QuestionOption {
  value: string;
  label: string;
  severity?: number; // 1-10 scale for urgency calculation
}

export interface QuestionCondition {
  dependsOn: string; // Question ID
  expectedAnswer: string | string[];
}

// Triage Recommendation
export interface TriageRecommendation {
  urgencyLevel: 'critical' | 'urgent' | 'semi_urgent' | 'non_urgent';
  urgencyScore: number; // 0-100
  recommendedAction: 'emergency_department' | 'urgent_care' | 'opd_appointment' | 'telemedicine' | 'self_care';
  specialty?: string;
  estimatedWaitTime?: number; // minutes
  reasoning: string[];
  possibleConditions: string[];
  redFlags: string[];
}

// Patient History
export interface PatientHistory {
  patientId: string;
  medicalHistory: MedicalCondition[];
  surgicalHistory: Surgery[];
  allergies: Allergy[];
  currentMedications: Medication[];
  familyHistory: FamilyHistory[];
  socialHistory?: SocialHistory;
}

export interface MedicalCondition {
  condition: string;
  diagnosedDate: Date;
  status: 'active' | 'resolved' | 'chronic';
  notes?: string;
}

export interface Surgery {
  procedure: string;
  date: Date;
  hospital?: string;
  complications?: string;
}

export interface Allergy {
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy?: string;
}

export interface FamilyHistory {
  relation: string;
  condition: string;
  ageAtDiagnosis?: number;
}

export interface SocialHistory {
  smokingStatus?: 'never' | 'former' | 'current';
  alcoholUse?: 'never' | 'occasional' | 'moderate' | 'heavy';
  occupation?: string;
  exerciseFrequency?: string;
}

// API Request/Response Types
export interface StartTriageRequest {
  patientId: string;
  language?: string;
  initialSymptoms?: string[];
}

export interface StartTriageResponse {
  sessionId: string;
  firstQuestion: Question;
  patientHistory?: PatientHistory;
}

export interface SubmitAnswerRequest {
  sessionId: string;
  questionId: string;
  answer: string | string[];
}

export interface SubmitAnswerResponse {
  nextQuestion?: Question;
  completed: boolean;
  recommendation?: TriageRecommendation;
}

export interface SubmitVitalsRequest {
  sessionId: string;
  vitals: VitalsData;
}

export interface GetTriageResultRequest {
  sessionId: string;
}

export interface GetTriageResultResponse {
  sessionId: string;
  urgencyScore: number;
  recommendation: TriageRecommendation;
  symptoms: Symptom[];
  vitals?: VitalsData;
  patientHistory?: PatientHistory;
}

// Urgency Scoring Types
export interface UrgencyFactors {
  symptomSeverity: number; // 0-100
  vitalsSeverity: number; // 0-100
  riskFactors: number; // 0-100
  duration: number; // 0-100
  ageRisk: number; // 0-100
}

export interface ScoringWeights {
  symptomSeverity: number;
  vitalsSeverity: number;
  riskFactors: number;
  duration: number;
  ageRisk: number;
}

// Specialty Routing Types
export interface SpecialtyClassification {
  primarySpecialty: string;
  alternativeSpecialties: string[];
  confidence: number;
  reasoning: string[];
}

export interface FacilityMatch {
  facilityId: string;
  facilityName: string;
  distance: number; // kilometers
  estimatedTravelTime: number; // minutes
  hasSpecialty: boolean;
  availabilityStatus: 'available' | 'limited' | 'full';
  currentWaitTime: number; // minutes
  matchScore: number; // 0-100
}

export interface RoutingRecommendation {
  classification: SpecialtyClassification;
  recommendedFacilities: FacilityMatch[];
  urgencyLevel: 'critical' | 'urgent' | 'semi_urgent' | 'non_urgent';
}

export interface GetRoutingRecommendationRequest {
  sessionId: string;
  patientLocation: {
    latitude: number;
    longitude: number;
  };
}

export interface GetRoutingRecommendationResponse extends RoutingRecommendation {
  sessionId: string;
}

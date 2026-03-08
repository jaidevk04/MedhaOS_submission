export interface Patient {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  language: string;
  abhaId?: string;
}

export interface DischargeData {
  patientId: string;
  encounterId: string;
  dischargeDate: Date;
  diagnosis: string[];
  procedures: string[];
  restrictions: string[];
  followupDate?: Date;
}

export interface RecoveryPlan {
  id: string;
  patientId: string;
  dischargeDate: Date;
  medications: MedicationSchedule[];
  activityRestrictions: ActivityRestriction[];
  dietaryGuidelines: string[];
  followupAppointments: FollowupAppointment[];
  warningSymptoms: string[];
  emergencyContacts: EmergencyContact[];
  educationalContent: EducationalContent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationSchedule {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string; // e.g., "twice daily", "every 8 hours"
  timing: string[]; // e.g., ["08:00", "20:00"]
  duration: string; // e.g., "7 days", "2 weeks"
  instructions: string;
  startDate: Date;
  endDate: Date;
  imageUrl?: string;
}

export interface ActivityRestriction {
  activity: string;
  restriction: 'avoid' | 'limit' | 'modify';
  duration: string;
  details: string;
}

export interface FollowupAppointment {
  id: string;
  date: Date;
  doctorName: string;
  specialty: string;
  facility: string;
  purpose: string;
  confirmed: boolean;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface EducationalContent {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'article' | 'infographic';
  url: string;
  language: string;
  duration?: string; // for videos
  thumbnailUrl?: string;
  category: string;
}

export interface MedicationReminder {
  id: string;
  patientId: string;
  medicationScheduleId: string;
  scheduledTime: Date;
  status: 'pending' | 'sent' | 'acknowledged' | 'missed';
  attempts: number;
  sentAt?: Date;
  acknowledgedAt?: Date;
  method: 'sms' | 'whatsapp' | 'voice' | 'push';
}

export interface AdherenceRecord {
  id: string;
  patientId: string;
  medicationScheduleId: string;
  scheduledTime: Date;
  takenTime?: Date;
  status: 'taken' | 'missed' | 'late' | 'skipped';
  verificationMethod?: 'manual' | 'image' | 'barcode';
  imageUrl?: string;
  notes?: string;
  createdAt: Date;
}

export interface FollowupCall {
  id: string;
  patientId: string;
  scheduledDate: Date;
  daysSinceDischarge: number;
  status: 'scheduled' | 'completed' | 'failed' | 'escalated';
  attempts: number;
  completedAt?: Date;
  duration?: number; // in seconds
  responses: FollowupResponse[];
  escalated: boolean;
  escalationReason?: string;
  notes?: string;
}

export interface FollowupResponse {
  question: string;
  answer: string;
  concernLevel: 'none' | 'low' | 'medium' | 'high';
}

export interface SymptomReport {
  id: string;
  patientId: string;
  reportedAt: Date;
  symptoms: string[];
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  escalated: boolean;
  escalationReason?: string;
  actionTaken?: string;
}

export interface MedicationVerification {
  id: string;
  patientId: string;
  medicationScheduleId: string;
  imageUrl: string;
  verificationStatus: 'pending' | 'verified' | 'failed' | 'mismatch';
  confidence: number;
  detectedMedication?: string;
  matchResult?: boolean;
  verifiedAt?: Date;
  notes?: string;
}

export interface ContentRecommendation {
  patientId: string;
  diagnosis: string[];
  language: string;
  recommendedContent: EducationalContent[];
  personalizedMessage?: string;
}

export interface NotificationPayload {
  patientId: string;
  type: 'medication_reminder' | 'followup_call' | 'appointment_reminder' | 'symptom_alert';
  method: 'sms' | 'whatsapp' | 'voice' | 'push' | 'email';
  message: string;
  language: string;
  audioUrl?: string; // for voice calls
  metadata?: Record<string, any>;
}

export interface TTSRequest {
  text: string;
  language: string;
  voiceId?: string;
}

export interface TTSResponse {
  audioUrl: string;
  duration: number;
  format: string;
}

export interface AdherenceMetrics {
  patientId: string;
  period: 'week' | 'month' | 'all';
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  lateDoses: number;
  adherenceRate: number; // percentage
  medications: MedicationAdherence[];
}

export interface MedicationAdherence {
  medicationName: string;
  totalDoses: number;
  takenDoses: number;
  adherenceRate: number;
}

export interface EscalationAlert {
  id: string;
  patientId: string;
  type: 'symptom' | 'adherence' | 'followup';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  actionTaken?: string;
  resolved: boolean;
  resolvedAt?: Date;
}

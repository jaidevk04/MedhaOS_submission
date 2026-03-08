// ABDM Types
export interface ABHAVerificationRequest {
  abhaId: string;
  purpose: string;
}

export interface ABHAVerificationResponse {
  verified: boolean;
  abhaId: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  address?: string;
  mobile?: string;
  email?: string;
}

export interface HealthRecordRequest {
  abhaId: string;
  consentId: string;
  dateRange: {
    from: string;
    to: string;
  };
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  type: string;
  entry: FHIRBundleEntry[];
}

export interface FHIRBundleEntry {
  resource: any;
  fullUrl?: string;
}

// EHR Types
export interface PatientSyncRequest {
  patientId: string;
  includeHistory: boolean;
}

export interface HL7Message {
  messageType: string;
  messageControlId: string;
  sendingApplication: string;
  sendingFacility: string;
  receivingApplication: string;
  receivingFacility: string;
  timestamp: string;
  segments: HL7Segment[];
}

export interface HL7Segment {
  segmentType: string;
  fields: string[];
}

// LIS Types
export interface LabOrderRequest {
  patientId: string;
  encounterId: string;
  tests: LabTest[];
  urgency: 'STAT' | 'ROUTINE' | 'URGENT';
  clinicalNotes?: string;
}

export interface LabTest {
  testCode: string;
  testName: string;
  specimenType: string;
}

export interface LabResult {
  orderId: string;
  patientId: string;
  testCode: string;
  testName: string;
  result: string;
  unit: string;
  referenceRange: string;
  abnormalFlag?: string;
  status: 'PRELIMINARY' | 'FINAL' | 'CORRECTED';
  performedAt: string;
}

// PACS Types
export interface DICOMStudy {
  studyInstanceUID: string;
  patientId: string;
  patientName: string;
  studyDate: string;
  studyDescription: string;
  modality: string;
  numberOfSeries: number;
  numberOfInstances: number;
}

export interface DICOMImage {
  sopInstanceUID: string;
  studyInstanceUID: string;
  seriesInstanceUID: string;
  imageUrl: string;
  metadata: Record<string, any>;
}

export interface DICOMQueryRequest {
  patientId?: string;
  studyDate?: string;
  modality?: string;
  studyInstanceUID?: string;
}

// Notification Types
export interface NotificationRequest {
  recipient: string;
  channel: 'SMS' | 'EMAIL' | 'WHATSAPP' | 'PUSH';
  template: string;
  data: Record<string, any>;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
}

export interface NotificationResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface SMSMessage {
  to: string;
  body: string;
}

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components: any[];
  };
}

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
}

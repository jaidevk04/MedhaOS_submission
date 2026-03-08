export interface MedicalImage {
  imageId: string;
  patientId: string;
  encounterId?: string;
  modality: ImageModality;
  bodyPart: string;
  studyDate: Date;
  imageUrl: string;
  thumbnailUrl?: string;
  metadata: ImageMetadata;
  dicomTags?: Record<string, any>;
  uploadedAt: Date;
}

export type ImageModality = 
  | 'X-ray' 
  | 'CT' 
  | 'MRI' 
  | 'Ultrasound' 
  | 'Mammography' 
  | 'PET' 
  | 'Nuclear Medicine'
  | 'Other';

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
  colorSpace?: string;
  bitDepth?: number;
}

export interface ImagePreprocessingResult {
  processedImageUrl: string;
  normalizedImageUrl: string;
  thumbnailUrl: string;
  metadata: ImageMetadata;
  preprocessingTime: number;
}

export interface VisionModelInput {
  imageUrl: string;
  modality: ImageModality;
  bodyPart: string;
  clinicalContext?: ClinicalContext;
}

export interface ClinicalContext {
  patientAge?: number;
  patientGender?: 'male' | 'female' | 'other';
  symptoms?: string[];
  medicalHistory?: string[];
  clinicalQuestion?: string;
}

export interface AnomalyDetection {
  type: string;
  location: string;
  boundingBox?: BoundingBox;
  confidence: number;
  severity: 'critical' | 'moderate' | 'minor';
  description: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SegmentationResult {
  segmentationType: string;
  maskUrl: string;
  area: number;
  volume?: number;
  confidence: number;
}

export interface VisionAnalysisResult {
  imageId: string;
  modality: ImageModality;
  findings: string[];
  anomalies: AnomalyDetection[];
  segmentation?: SegmentationResult[];
  normalFindings: string[];
  confidence: number;
  processingTimeSeconds: number;
  modelVersions: {
    llava?: string;
    biomedclip?: string;
    medsam?: string;
  };
}

export interface RadiologyReport {
  reportId: string;
  imageId: string;
  patientId: string;
  encounterId?: string;
  modality: ImageModality;
  bodyPart: string;
  studyDate: Date;
  
  // Report sections
  clinicalIndication: string;
  technique: string;
  findings: string;
  impression: string;
  recommendations: string[];
  
  // AI-generated content
  aiGeneratedFindings: string[];
  aiConfidence: number;
  criticalFindings: CriticalFinding[];
  
  // Status
  status: 'draft' | 'ai_completed' | 'under_review' | 'verified' | 'finalized';
  draftGeneratedAt?: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CriticalFinding {
  finding: string;
  severity: 'critical' | 'urgent';
  confidence: number;
  requiresImmediateAction: boolean;
  suggestedActions: string[];
  flaggedAt: Date;
}

export interface DicomMetadata {
  studyInstanceUID: string;
  seriesInstanceUID: string;
  sopInstanceUID: string;
  patientName?: string;
  patientID?: string;
  patientBirthDate?: string;
  patientSex?: string;
  studyDate?: string;
  studyTime?: string;
  modality?: string;
  manufacturer?: string;
  institutionName?: string;
  bodyPartExamined?: string;
  studyDescription?: string;
  seriesDescription?: string;
}

export interface ImageUploadRequest {
  patientId: string;
  encounterId?: string;
  modality: ImageModality;
  bodyPart: string;
  studyDate?: Date;
  clinicalContext?: ClinicalContext;
}

export interface ImageAnalysisRequest {
  imageId: string;
  clinicalContext?: ClinicalContext;
  generateReport?: boolean;
  urgency?: 'stat' | 'urgent' | 'routine';
}

export interface ImageAnalysisResponse {
  imageId: string;
  analysis: VisionAnalysisResult;
  report?: RadiologyReport;
  processingTimeSeconds: number;
  timestamp: Date;
}

export interface DicomServerConfig {
  host: string;
  port: number;
  aeTitle: string;
  callingAETitle?: string;
}

export interface S3UploadResult {
  key: string;
  url: string;
  bucket: string;
  etag: string;
}

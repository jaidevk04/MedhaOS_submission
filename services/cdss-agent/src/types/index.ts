// Medical Knowledge Base Types
export interface MedicalDocument {
  id: string;
  title: string;
  content: string;
  source: 'pubmed' | 'guideline' | 'textbook' | 'clinical_trial';
  metadata: {
    authors?: string[];
    publicationDate?: string;
    journal?: string;
    doi?: string;
    pmid?: string;
    specialty?: string;
    keywords?: string[];
  };
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  document: MedicalDocument;
}

export interface RAGQuery {
  query: string;
  topK?: number;
  filter?: {
    source?: string[];
    specialty?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
  };
}

export interface RAGResponse {
  query: string;
  results: VectorSearchResult[];
  summary: string;
  sources: string[];
  confidence: number;
}

// Differential Diagnosis Types
export interface Symptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  onset: string;
  characteristics?: string[];
}

export interface PatientContext {
  patientId: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  symptoms: Symptom[];
  vitals?: {
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  medicalHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
  labResults?: Record<string, any>;
}

export interface Diagnosis {
  condition: string;
  icdCode: string;
  probability: number;
  reasoning: string;
  supportingEvidence: string[];
  recommendedTests?: string[];
  urgency: 'immediate' | 'urgent' | 'routine';
}

export interface DifferentialDiagnosisResponse {
  patientId: string;
  diagnoses: Diagnosis[];
  recommendations: string[];
  confidence: number;
  timestamp: Date;
}

// Clinical Trial Matching Types
export interface ClinicalTrial {
  nctId: string;
  title: string;
  status: string;
  phase: string;
  conditions: string[];
  interventions: string[];
  eligibilityCriteria: {
    inclusionCriteria: string[];
    exclusionCriteria: string[];
    minAge?: number;
    maxAge?: number;
    gender?: string[];
  };
  locations: {
    facility: string;
    city: string;
    state: string;
    country: string;
  }[];
  contactInfo?: {
    name: string;
    phone?: string;
    email?: string;
  };
  studyUrl: string;
}

export interface PatientProfile {
  patientId: string;
  age: number;
  gender: string;
  diagnoses: string[];
  geneticProfile?: {
    mutations?: string[];
    biomarkers?: Record<string, any>;
  };
  comorbidities?: string[];
  previousTreatments?: string[];
  location: {
    city: string;
    state: string;
    country: string;
  };
}

export interface TrialMatchResult {
  trial: ClinicalTrial;
  matchScore: number;
  matchReasons: string[];
  eligibilityStatus: 'eligible' | 'potentially_eligible' | 'not_eligible';
  missingInformation?: string[];
}

export interface TrialMatchingResponse {
  patientId: string;
  matches: TrialMatchResult[];
  totalTrialsEvaluated: number;
  timestamp: Date;
}

// Compliance Checking Types
export interface GuidelineReference {
  id: string;
  title: string;
  organization: 'NMC' | 'ICMR' | 'WHO' | 'AHA' | 'ESC' | 'other';
  version: string;
  url: string;
  lastUpdated: Date;
}

export interface ComplianceCheck {
  checkType: 'documentation' | 'prescription' | 'procedure' | 'authorization';
  status: 'compliant' | 'non_compliant' | 'warning';
  message: string;
  guidelineReference?: GuidelineReference;
  recommendation?: string;
}

export interface DocumentationCompleteness {
  encounterId: string;
  requiredFields: {
    field: string;
    present: boolean;
    importance: 'critical' | 'required' | 'optional';
  }[];
  completenessScore: number;
  missingCriticalFields: string[];
  suggestions: string[];
}

export interface PriorAuthorizationRequest {
  patientId: string;
  encounterId: string;
  requestType: 'medication' | 'procedure' | 'diagnostic_test' | 'hospitalization';
  details: {
    name: string;
    code: string;
    justification: string;
    clinicalEvidence: string[];
    alternativesConsidered?: string[];
  };
  insuranceInfo: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  urgency: 'emergency' | 'urgent' | 'routine';
}

export interface PriorAuthorizationResponse {
  requestId: string;
  generatedDocument: string;
  supportingDocuments: string[];
  estimatedApprovalTime: string;
  submissionInstructions: string;
  timestamp: Date;
}

export interface ComplianceValidationResponse {
  encounterId: string;
  overallCompliance: 'compliant' | 'non_compliant' | 'needs_review';
  checks: ComplianceCheck[];
  documentationCompleteness: DocumentationCompleteness;
  recommendations: string[];
  timestamp: Date;
}

// CDSS Request/Response Types
export interface CDSSRequest {
  requestType: 'diagnosis' | 'literature_search' | 'trial_matching' | 'compliance_check' | 'prior_auth';
  patientContext?: PatientContext;
  patientProfile?: PatientProfile;
  query?: string;
  encounterId?: string;
  authorizationRequest?: PriorAuthorizationRequest;
}

export interface CDSSResponse {
  requestId: string;
  requestType: string;
  data: any;
  confidence: number;
  processingTime: number;
  timestamp: Date;
}

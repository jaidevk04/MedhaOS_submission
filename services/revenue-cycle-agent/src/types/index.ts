// Revenue Cycle Agent Types

export interface ClinicalNote {
  encounter_id: string;
  patient_id: string;
  clinician_id: string;
  encounter_date: string;
  encounter_type: 'ED' | 'OPD' | 'IPD' | 'Telemedicine';
  chief_complaint: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  diagnoses?: string[];
  procedures?: string[];
  medications?: Medication[];
  vitals?: VitalSigns;
}

export interface VitalSigns {
  temperature?: number;
  blood_pressure?: string;
  heart_rate?: number;
  respiratory_rate?: number;
  spo2?: number;
  weight?: number;
  height?: number;
}

export interface Medication {
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route?: string;
}

export interface ICD10Code {
  code: string;
  description: string;
  confidence: number;
  category: string;
  is_primary: boolean;
}

export interface CPTCode {
  code: string;
  description: string;
  confidence: number;
  modifier?: string;
  units: number;
}

export interface MedicalCoding {
  encounter_id: string;
  icd10_codes: ICD10Code[];
  cpt_codes: CPTCode[];
  coding_date: string;
  coder_type: 'AI' | 'Human' | 'AI_Verified';
  overall_confidence: number;
  requires_review: boolean;
  review_reason?: string;
}

export interface InsurancePolicy {
  policy_id: string;
  payer_name: string;
  payer_id: string;
  policy_number: string;
  group_number?: string;
  coverage_type: 'Primary' | 'Secondary' | 'Tertiary';
  effective_date: string;
  expiration_date?: string;
  copay_amount?: number;
  deductible_amount?: number;
  deductible_met?: number;
}

export interface Claim {
  claim_id: string;
  encounter_id: string;
  patient_id: string;
  insurance_policy: InsurancePolicy;
  medical_coding: MedicalCoding;
  claim_type: 'Professional' | 'Institutional' | 'Dental' | 'Pharmacy';
  service_date: string;
  total_charges: number;
  claim_status: 'Draft' | 'Submitted' | 'Pending' | 'Approved' | 'Denied' | 'Partially_Approved';
  submission_date?: string;
  response_date?: string;
  denial_reason?: string;
  approved_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface ClaimValidationResult {
  is_valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  rejection_risk_score: number;
  recommendations: string[];
}

export interface ValidationError {
  field: string;
  error_code: string;
  message: string;
  severity: 'Critical' | 'High' | 'Medium';
}

export interface ValidationWarning {
  field: string;
  warning_code: string;
  message: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface PriorAuthorizationRequest {
  auth_request_id: string;
  encounter_id: string;
  patient_id: string;
  insurance_policy: InsurancePolicy;
  requested_service: string;
  icd10_codes: string[];
  cpt_codes: string[];
  clinical_justification: string;
  supporting_documents: string[];
  urgency: 'Emergent' | 'Urgent' | 'Routine';
  status: 'Draft' | 'Submitted' | 'Pending' | 'Approved' | 'Denied' | 'More_Info_Needed';
  submission_date?: string;
  response_date?: string;
  approval_number?: string;
  denial_reason?: string;
  valid_until?: string;
}

export interface BillingError {
  error_id: string;
  claim_id: string;
  error_type: 'Coding_Error' | 'Missing_Information' | 'Invalid_Code' | 'Duplicate_Claim' | 'Coverage_Issue';
  description: string;
  detected_by: 'AI' | 'Payer' | 'Human_Review';
  detected_at: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  suggested_correction?: string;
  corrected: boolean;
}

export interface CodingRequest {
  clinical_note: ClinicalNote;
  encounter_context?: {
    facility_type?: string;
    specialty?: string;
    visit_duration_minutes?: number;
  };
}

export interface CodingResponse {
  medical_coding: MedicalCoding;
  processing_time_ms: number;
  model_used: string;
}

export interface ClaimGenerationRequest {
  encounter_id: string;
  patient_id: string;
  insurance_policy_id: string;
  medical_coding?: MedicalCoding;
  auto_submit?: boolean;
}

export interface ClaimGenerationResponse {
  claim: Claim;
  validation_result: ClaimValidationResult;
  submitted: boolean;
  submission_id?: string;
}

export interface PriorAuthRequest {
  encounter_id: string;
  patient_id: string;
  insurance_policy_id: string;
  requested_service: string;
  clinical_justification?: string;
  urgency?: 'Emergent' | 'Urgent' | 'Routine';
}

export interface PriorAuthResponse {
  authorization_request: PriorAuthorizationRequest;
  auto_generated_justification: string;
  supporting_evidence: string[];
  submission_ready: boolean;
}

export interface ErrorCorrectionRequest {
  claim_id: string;
  error_id: string;
  error_details: BillingError;
}

export interface ErrorCorrectionResponse {
  corrected_claim: Claim;
  corrections_applied: string[];
  confidence: number;
  requires_human_review: boolean;
}

export interface RejectionPrediction {
  claim_id: string;
  rejection_probability: number;
  risk_factors: RiskFactor[];
  preventive_actions: string[];
}

export interface RiskFactor {
  factor: string;
  impact_score: number;
  description: string;
  mitigation: string;
}

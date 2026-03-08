import { MedicalCodingService } from './medical-coding.service';
import { ClaimGenerationService } from './claim-generation.service';
import { ErrorMinimizationService } from './error-minimization.service';
import { PriorAuthorizationService } from './prior-authorization.service';
import {
  CodingRequest,
  CodingResponse,
  ClaimGenerationRequest,
  ClaimGenerationResponse,
  Claim,
  BillingError,
  RejectionPrediction,
  PriorAuthRequest,
  PriorAuthResponse,
} from '../types';

/**
 * Revenue Cycle Service
 * 
 * Main orchestration service for revenue cycle management
 * Coordinates medical coding, claim generation, error minimization,
 * and prior authorization
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 13.5
 */
export class RevenueCycleService {
  private medicalCodingService: MedicalCodingService;
  private claimGenerationService: ClaimGenerationService;
  private errorMinimizationService: ErrorMinimizationService;
  private priorAuthorizationService: PriorAuthorizationService;

  constructor() {
    this.medicalCodingService = new MedicalCodingService();
    this.claimGenerationService = new ClaimGenerationService();
    this.errorMinimizationService = new ErrorMinimizationService();
    this.priorAuthorizationService = new PriorAuthorizationService();
  }

  /**
   * Generate medical codes from clinical notes
   */
  async generateMedicalCodes(request: CodingRequest): Promise<CodingResponse> {
    return this.medicalCodingService.generateCodes(request);
  }

  /**
   * Generate insurance claim
   */
  async generateClaim(request: ClaimGenerationRequest): Promise<ClaimGenerationResponse> {
    return this.claimGenerationService.generateClaim(request);
  }

  /**
   * Detect billing errors in a claim
   */
  async detectBillingErrors(claim: Claim): Promise<BillingError[]> {
    return this.errorMinimizationService.detectBillingErrors(claim);
  }

  /**
   * Predict claim rejection probability
   */
  async predictRejection(claim: Claim): Promise<RejectionPrediction> {
    return this.errorMinimizationService.predictRejection(claim);
  }

  /**
   * Generate prior authorization request
   */
  async generatePriorAuthorization(request: PriorAuthRequest): Promise<PriorAuthResponse> {
    return this.priorAuthorizationService.generateAuthorizationRequest(request);
  }

  /**
   * Complete revenue cycle workflow: coding + claim generation + validation
   */
  async processEncounter(request: {
    coding_request: CodingRequest;
    insurance_policy_id: string;
    auto_submit?: boolean;
  }): Promise<{
    coding_response: CodingResponse;
    claim_response: ClaimGenerationResponse;
    billing_errors: BillingError[];
    rejection_prediction: RejectionPrediction;
  }> {
    // Step 1: Generate medical codes
    const codingResponse = await this.generateMedicalCodes(request.coding_request);

    // Step 2: Generate claim using the codes
    const claimRequest: ClaimGenerationRequest = {
      encounter_id: request.coding_request.clinical_note.encounter_id,
      patient_id: request.coding_request.clinical_note.patient_id,
      insurance_policy_id: request.insurance_policy_id,
      medical_coding: codingResponse.medical_coding,
      auto_submit: request.auto_submit,
    };

    const claimResponse = await this.generateClaim(claimRequest);

    // Step 3: Detect billing errors
    const billingErrors = await this.detectBillingErrors(claimResponse.claim);

    // Step 4: Predict rejection probability
    const rejectionPrediction = await this.predictRejection(claimResponse.claim);

    return {
      coding_response: codingResponse,
      claim_response: claimResponse,
      billing_errors: billingErrors,
      rejection_prediction: rejectionPrediction,
    };
  }

  /**
   * Get service health status
   */
  getHealthStatus(): { status: string; services: Record<string, string> } {
    return {
      status: 'healthy',
      services: {
        medical_coding: 'operational',
        claim_generation: 'operational',
        error_minimization: 'operational',
        prior_authorization: 'operational',
      },
    };
  }
}

import { config } from '../config';
import {
  Claim,
  ClaimGenerationRequest,
  ClaimGenerationResponse,
  ClaimValidationResult,
  ValidationError,
  ValidationWarning,
  MedicalCoding,
  InsurancePolicy,
} from '../types';

/**
 * Claim Generation Service
 * 
 * Implements automated insurance claim generation and submission
 * 
 * Requirements: 8.1, 8.2, 8.3
 */
export class ClaimGenerationService {
  /**
   * Generate insurance claim from encounter and coding data
   */
  async generateClaim(request: ClaimGenerationRequest): Promise<ClaimGenerationResponse> {
    const {
      encounter_id,
      patient_id,
      insurance_policy_id,
      medical_coding,
      auto_submit = false,
    } = request;

    try {
      // In a real implementation, fetch insurance policy from database
      const insurancePolicy = await this.fetchInsurancePolicy(insurance_policy_id);

      // If medical coding not provided, it should be generated first
      if (!medical_coding) {
        throw new Error('Medical coding is required for claim generation');
      }

      // Calculate total charges based on CPT codes
      const totalCharges = this.calculateTotalCharges(medical_coding);

      // Create claim object
      const claim: Claim = {
        claim_id: this.generateClaimId(),
        encounter_id,
        patient_id,
        insurance_policy: insurancePolicy,
        medical_coding,
        claim_type: 'Professional', // Default, could be determined by encounter type
        service_date: new Date().toISOString().split('T')[0],
        total_charges: totalCharges,
        claim_status: 'Draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Validate claim before submission
      const validationResult = await this.validateClaim(claim);

      // Submit claim if auto_submit is true and validation passes
      let submitted = false;
      let submission_id: string | undefined;

      if (auto_submit && validationResult.is_valid) {
        const submissionResult = await this.submitClaim(claim);
        submitted = submissionResult.success;
        submission_id = submissionResult.submission_id;

        if (submitted) {
          claim.claim_status = 'Submitted';
          claim.submission_date = new Date().toISOString();
        }
      }

      return {
        claim,
        validation_result: validationResult,
        submitted,
        submission_id,
      };
    } catch (error) {
      console.error('Error generating claim:', error);
      throw new Error(`Claim generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate claim for submission
   */
  async validateClaim(claim: Claim): Promise<ClaimValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate required fields
    if (!claim.patient_id) {
      errors.push({
        field: 'patient_id',
        error_code: 'MISSING_PATIENT_ID',
        message: 'Patient ID is required',
        severity: 'Critical',
      });
    }

    if (!claim.insurance_policy) {
      errors.push({
        field: 'insurance_policy',
        error_code: 'MISSING_INSURANCE',
        message: 'Insurance policy information is required',
        severity: 'Critical',
      });
    }

    // Validate medical coding
    if (!claim.medical_coding || claim.medical_coding.icd10_codes.length === 0) {
      errors.push({
        field: 'medical_coding.icd10_codes',
        error_code: 'MISSING_DIAGNOSIS_CODES',
        message: 'At least one ICD-10 diagnosis code is required',
        severity: 'Critical',
      });
    }

    if (!claim.medical_coding || claim.medical_coding.cpt_codes.length === 0) {
      errors.push({
        field: 'medical_coding.cpt_codes',
        error_code: 'MISSING_PROCEDURE_CODES',
        message: 'At least one CPT procedure code is required',
        severity: 'Critical',
      });
    }

    // Validate primary diagnosis
    if (claim.medical_coding) {
      const hasPrimaryDiagnosis = claim.medical_coding.icd10_codes.some(c => c.is_primary);
      if (!hasPrimaryDiagnosis) {
        errors.push({
          field: 'medical_coding.icd10_codes',
          error_code: 'MISSING_PRIMARY_DIAGNOSIS',
          message: 'A primary diagnosis must be identified',
          severity: 'High',
        });
      }
    }

    // Validate insurance policy dates
    if (claim.insurance_policy) {
      const serviceDate = new Date(claim.service_date);
      const effectiveDate = new Date(claim.insurance_policy.effective_date);

      if (serviceDate < effectiveDate) {
        errors.push({
          field: 'service_date',
          error_code: 'SERVICE_BEFORE_COVERAGE',
          message: 'Service date is before insurance coverage effective date',
          severity: 'Critical',
        });
      }

      if (claim.insurance_policy.expiration_date) {
        const expirationDate = new Date(claim.insurance_policy.expiration_date);
        if (serviceDate > expirationDate) {
          errors.push({
            field: 'service_date',
            error_code: 'SERVICE_AFTER_COVERAGE',
            message: 'Service date is after insurance coverage expiration date',
            severity: 'Critical',
          });
        }
      }
    }

    // Check for potential duplicate claims
    const isDuplicate = await this.checkDuplicateClaim(claim);
    if (isDuplicate) {
      warnings.push({
        field: 'claim',
        warning_code: 'POTENTIAL_DUPLICATE',
        message: 'A similar claim may have already been submitted for this encounter',
        impact: 'High',
      });
    }

    // Check for coding confidence
    if (claim.medical_coding && claim.medical_coding.overall_confidence < 0.85) {
      warnings.push({
        field: 'medical_coding',
        warning_code: 'LOW_CODING_CONFIDENCE',
        message: `Medical coding confidence is ${(claim.medical_coding.overall_confidence * 100).toFixed(1)}%`,
        impact: 'Medium',
      });
    }

    // Calculate rejection risk score
    const rejectionRiskScore = this.calculateRejectionRisk(claim, errors, warnings);

    // Generate recommendations
    const recommendations = this.generateRecommendations(errors, warnings, claim);

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      rejection_risk_score: rejectionRiskScore,
      recommendations,
    };
  }

  /**
   * Submit claim to insurance payer
   */
  private async submitClaim(claim: Claim): Promise<{ success: boolean; submission_id?: string }> {
    try {
      // In a real implementation, this would call the insurance payer API
      // For now, simulate submission
      console.log('Submitting claim to insurance payer:', claim.claim_id);

      // Simulate API call
      const submissionId = `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        submission_id: submissionId,
      };
    } catch (error) {
      console.error('Error submitting claim:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Calculate total charges based on CPT codes
   */
  private calculateTotalCharges(medicalCoding: MedicalCoding): number {
    // In a real implementation, this would look up fee schedules
    // For now, use simplified calculation
    let total = 0;

    for (const cptCode of medicalCoding.cpt_codes) {
      // Simplified fee schedule (in real system, would query database)
      const baseCharge = this.getBaseCPTCharge(cptCode.code);
      total += baseCharge * cptCode.units;
    }

    return Math.round(total * 100) / 100;
  }

  /**
   * Get base charge for CPT code (simplified)
   */
  private getBaseCPTCharge(cptCode: string): number {
    // Simplified fee schedule
    const feeSchedule: Record<string, number> = {
      '99281': 150.0, // ED visit, minimal
      '99282': 250.0, // ED visit, low complexity
      '99283': 400.0, // ED visit, moderate complexity
      '99284': 600.0, // ED visit, high complexity
      '99285': 850.0, // ED visit, very high complexity
      '99211': 75.0, // Office visit, minimal
      '99212': 125.0, // Office visit, low complexity
      '99213': 175.0, // Office visit, moderate complexity
      '99214': 250.0, // Office visit, high complexity
      '99215': 350.0, // Office visit, very high complexity
    };

    return feeSchedule[cptCode] || 200.0; // Default charge
  }

  /**
   * Check for duplicate claims
   */
  private async checkDuplicateClaim(claim: Claim): Promise<boolean> {
    // In a real implementation, query database for similar claims
    // For now, return false
    return false;
  }

  /**
   * Calculate rejection risk score (0-100)
   */
  private calculateRejectionRisk(
    claim: Claim,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): number {
    let riskScore = 0;

    // Critical errors add significant risk
    riskScore += errors.filter(e => e.severity === 'Critical').length * 30;
    riskScore += errors.filter(e => e.severity === 'High').length * 20;
    riskScore += errors.filter(e => e.severity === 'Medium').length * 10;

    // Warnings add moderate risk
    riskScore += warnings.filter(w => w.impact === 'High').length * 15;
    riskScore += warnings.filter(w => w.impact === 'Medium').length * 8;
    riskScore += warnings.filter(w => w.impact === 'Low').length * 3;

    // Low coding confidence adds risk
    if (claim.medical_coding && claim.medical_coding.overall_confidence < 0.85) {
      riskScore += 15;
    }

    return Math.min(riskScore, 100);
  }

  /**
   * Generate recommendations for claim improvement
   */
  private generateRecommendations(
    errors: ValidationError[],
    warnings: ValidationWarning[],
    claim: Claim
  ): string[] {
    const recommendations: string[] = [];

    if (errors.length > 0) {
      recommendations.push('Resolve all critical errors before submission');
    }

    if (warnings.some(w => w.warning_code === 'LOW_CODING_CONFIDENCE')) {
      recommendations.push('Consider human review of medical coding due to low confidence');
    }

    if (warnings.some(w => w.warning_code === 'POTENTIAL_DUPLICATE')) {
      recommendations.push('Verify this is not a duplicate claim before submission');
    }

    if (claim.medical_coding && claim.medical_coding.requires_review) {
      recommendations.push('Medical coding flagged for human review');
    }

    if (recommendations.length === 0) {
      recommendations.push('Claim is ready for submission');
    }

    return recommendations;
  }

  /**
   * Fetch insurance policy (mock implementation)
   */
  private async fetchInsurancePolicy(policyId: string): Promise<InsurancePolicy> {
    // In a real implementation, fetch from database
    return {
      policy_id: policyId,
      payer_name: 'Example Insurance Company',
      payer_id: 'INS001',
      policy_number: 'POL-123456',
      coverage_type: 'Primary',
      effective_date: '2024-01-01',
      copay_amount: 500,
      deductible_amount: 5000,
      deductible_met: 2000,
    };
  }

  /**
   * Generate unique claim ID
   */
  private generateClaimId(): string {
    return `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
}

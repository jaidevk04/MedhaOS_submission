import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import {
  Claim,
  BillingError,
  ErrorCorrectionRequest,
  ErrorCorrectionResponse,
  RejectionPrediction,
  RiskFactor,
  ClaimValidationResult,
} from '../types';

/**
 * Error Minimization Service
 * 
 * Implements anomaly detection for billing errors, rule engine for claim validation,
 * rejection prediction, and error correction suggestions
 * 
 * Requirements: 8.2, 8.4
 */
export class ErrorMinimizationService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: config.ai.anthropicApiKey,
    });
  }

  /**
   * Detect billing errors using anomaly detection
   */
  async detectBillingErrors(claim: Claim): Promise<BillingError[]> {
    const errors: BillingError[] = [];

    // Rule-based error detection
    errors.push(...this.detectCodingErrors(claim));
    errors.push(...this.detectMissingInformation(claim));
    errors.push(...this.detectInvalidCodes(claim));
    errors.push(...this.detectCoverageIssues(claim));

    // AI-based anomaly detection
    const aiDetectedErrors = await this.detectAnomaliesWithAI(claim);
    errors.push(...aiDetectedErrors);

    return errors;
  }

  /**
   * Predict claim rejection probability
   */
  async predictRejection(claim: Claim): Promise<RejectionPrediction> {
    const riskFactors: RiskFactor[] = [];

    // Analyze coding quality
    if (claim.medical_coding.overall_confidence < 0.85) {
      riskFactors.push({
        factor: 'Low Coding Confidence',
        impact_score: 25,
        description: `Medical coding confidence is ${(claim.medical_coding.overall_confidence * 100).toFixed(1)}%`,
        mitigation: 'Request human review of medical codes before submission',
      });
    }

    // Check for missing primary diagnosis
    const hasPrimaryDiagnosis = claim.medical_coding.icd10_codes.some(c => c.is_primary);
    if (!hasPrimaryDiagnosis) {
      riskFactors.push({
        factor: 'Missing Primary Diagnosis',
        impact_score: 30,
        description: 'No primary diagnosis code identified',
        mitigation: 'Identify and mark the primary diagnosis code',
      });
    }

    // Check for code-procedure mismatch
    const mismatchRisk = await this.detectCodeProcedureMismatch(claim);
    if (mismatchRisk) {
      riskFactors.push(mismatchRisk);
    }

    // Check insurance coverage dates
    const serviceDate = new Date(claim.service_date);
    const effectiveDate = new Date(claim.insurance_policy.effective_date);
    if (serviceDate < effectiveDate) {
      riskFactors.push({
        factor: 'Service Before Coverage',
        impact_score: 40,
        description: 'Service date is before insurance coverage effective date',
        mitigation: 'Verify service date or insurance policy dates',
      });
    }

    // Check for duplicate claim risk
    const duplicateRisk = await this.assessDuplicateRisk(claim);
    if (duplicateRisk > 0.5) {
      riskFactors.push({
        factor: 'Potential Duplicate Claim',
        impact_score: 35,
        description: 'Similar claim may have been submitted recently',
        mitigation: 'Verify this is not a duplicate submission',
      });
    }

    // Calculate total rejection probability
    const totalImpact = riskFactors.reduce((sum, rf) => sum + rf.impact_score, 0);
    const rejectionProbability = Math.min(totalImpact / 100, 0.95);

    // Generate preventive actions
    const preventiveActions = this.generatePreventiveActions(riskFactors);

    return {
      claim_id: claim.claim_id,
      rejection_probability: rejectionProbability,
      risk_factors: riskFactors,
      preventive_actions: preventiveActions,
    };
  }

  /**
   * Correct billing errors
   */
  async correctError(request: ErrorCorrectionRequest): Promise<ErrorCorrectionResponse> {
    const { claim_id, error_id, error_details } = request;

    // Use AI to suggest corrections
    const corrections = await this.generateCorrectionsWithAI(error_details);

    // Apply corrections (in real implementation, would update database)
    const correctedClaim = await this.applyCorrections(claim_id, corrections);

    return {
      corrected_claim: correctedClaim,
      corrections_applied: corrections,
      confidence: 0.88,
      requires_human_review: error_details.severity === 'Critical',
    };
  }

  /**
   * Validate claim using rule engine
   */
  validateClaimWithRules(claim: Claim): ClaimValidationResult {
    const errors = [];
    const warnings = [];

    // Rule 1: Primary diagnosis required
    if (!claim.medical_coding.icd10_codes.some(c => c.is_primary)) {
      errors.push({
        field: 'medical_coding.icd10_codes',
        error_code: 'RULE_001',
        message: 'Primary diagnosis code is required',
        severity: 'Critical' as const,
      });
    }

    // Rule 2: At least one procedure code
    if (claim.medical_coding.cpt_codes.length === 0) {
      errors.push({
        field: 'medical_coding.cpt_codes',
        error_code: 'RULE_002',
        message: 'At least one procedure code is required',
        severity: 'Critical' as const,
      });
    }

    // Rule 3: Service date within coverage period
    const serviceDate = new Date(claim.service_date);
    const effectiveDate = new Date(claim.insurance_policy.effective_date);
    if (serviceDate < effectiveDate) {
      errors.push({
        field: 'service_date',
        error_code: 'RULE_003',
        message: 'Service date must be within insurance coverage period',
        severity: 'Critical' as const,
      });
    }

    // Rule 4: Total charges must be positive
    if (claim.total_charges <= 0) {
      errors.push({
        field: 'total_charges',
        error_code: 'RULE_004',
        message: 'Total charges must be greater than zero',
        severity: 'High' as const,
      });
    }

    // Rule 5: Coding confidence threshold
    if (claim.medical_coding.overall_confidence < config.coding.confidenceThreshold) {
      warnings.push({
        field: 'medical_coding',
        warning_code: 'RULE_W001',
        message: 'Medical coding confidence below recommended threshold',
        impact: 'Medium' as const,
      });
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      rejection_risk_score: this.calculateRiskScore(errors, warnings),
      recommendations: this.generateRuleRecommendations(errors, warnings),
    };
  }

  // Private helper methods

  private detectCodingErrors(claim: Claim): BillingError[] {
    const errors: BillingError[] = [];

    // Check for invalid ICD-10 codes
    for (const icd10 of claim.medical_coding.icd10_codes) {
      if (!this.isValidICD10Format(icd10.code)) {
        errors.push({
          error_id: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          claim_id: claim.claim_id,
          error_type: 'Invalid_Code',
          description: `Invalid ICD-10 code format: ${icd10.code}`,
          detected_by: 'AI',
          detected_at: new Date().toISOString(),
          severity: 'High',
          suggested_correction: 'Verify ICD-10 code format (e.g., A00.0)',
          corrected: false,
        });
      }
    }

    // Check for invalid CPT codes
    for (const cpt of claim.medical_coding.cpt_codes) {
      if (!this.isValidCPTFormat(cpt.code)) {
        errors.push({
          error_id: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          claim_id: claim.claim_id,
          error_type: 'Invalid_Code',
          description: `Invalid CPT code format: ${cpt.code}`,
          detected_by: 'AI',
          detected_at: new Date().toISOString(),
          severity: 'High',
          suggested_correction: 'Verify CPT code format (5 digits)',
          corrected: false,
        });
      }
    }

    return errors;
  }

  private detectMissingInformation(claim: Claim): BillingError[] {
    const errors: BillingError[] = [];

    if (!claim.patient_id) {
      errors.push({
        error_id: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        claim_id: claim.claim_id,
        error_type: 'Missing_Information',
        description: 'Patient ID is missing',
        detected_by: 'AI',
        detected_at: new Date().toISOString(),
        severity: 'Critical',
        suggested_correction: 'Add patient ID to claim',
        corrected: false,
      });
    }

    if (!claim.insurance_policy) {
      errors.push({
        error_id: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        claim_id: claim.claim_id,
        error_type: 'Missing_Information',
        description: 'Insurance policy information is missing',
        detected_by: 'AI',
        detected_at: new Date().toISOString(),
        severity: 'Critical',
        suggested_correction: 'Add insurance policy details',
        corrected: false,
      });
    }

    return errors;
  }

  private detectInvalidCodes(claim: Claim): BillingError[] {
    // Already handled in detectCodingErrors
    return [];
  }

  private detectCoverageIssues(claim: Claim): BillingError[] {
    const errors: BillingError[] = [];

    const serviceDate = new Date(claim.service_date);
    const effectiveDate = new Date(claim.insurance_policy.effective_date);

    if (serviceDate < effectiveDate) {
      errors.push({
        error_id: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        claim_id: claim.claim_id,
        error_type: 'Coverage_Issue',
        description: 'Service date is before insurance coverage effective date',
        detected_by: 'AI',
        detected_at: new Date().toISOString(),
        severity: 'Critical',
        suggested_correction: 'Verify service date or update insurance policy information',
        corrected: false,
      });
    }

    return errors;
  }

  private async detectAnomaliesWithAI(claim: Claim): Promise<BillingError[]> {
    try {
      const prompt = `Analyze this insurance claim for potential billing errors or anomalies:

Claim ID: ${claim.claim_id}
Service Date: ${claim.service_date}
Total Charges: $${claim.total_charges}

ICD-10 Codes:
${claim.medical_coding.icd10_codes.map(c => `- ${c.code}: ${c.description} (confidence: ${c.confidence})`).join('\n')}

CPT Codes:
${claim.medical_coding.cpt_codes.map(c => `- ${c.code}: ${c.description} (confidence: ${c.confidence})`).join('\n')}

Identify any potential issues such as:
1. Code-procedure mismatches
2. Unusual code combinations
3. Charges that seem inconsistent with procedures
4. Missing or incomplete information

Respond with a JSON array of errors (empty array if none found):
[
  {
    "error_type": "Coding_Error",
    "description": "Description of the issue",
    "severity": "High",
    "suggested_correction": "How to fix it"
  }
]`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        return [];
      }

      let jsonStr = content.text.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      }

      const aiErrors = JSON.parse(jsonStr);

      return aiErrors.map((err: any) => ({
        error_id: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        claim_id: claim.claim_id,
        error_type: err.error_type,
        description: err.description,
        detected_by: 'AI' as const,
        detected_at: new Date().toISOString(),
        severity: err.severity,
        suggested_correction: err.suggested_correction,
        corrected: false,
      }));
    } catch (error) {
      console.error('Error detecting anomalies with AI:', error);
      return [];
    }
  }

  private async detectCodeProcedureMismatch(claim: Claim): Promise<RiskFactor | null> {
    // Simplified check - in real implementation would use more sophisticated logic
    const diagnosisCodes = claim.medical_coding.icd10_codes.map(c => c.code);
    const procedureCodes = claim.medical_coding.cpt_codes.map(c => c.code);

    // Example: Check if cardiac procedure codes are present without cardiac diagnosis
    const hasCardiacProcedure = procedureCodes.some(c => c.startsWith('92') || c.startsWith('93'));
    const hasCardiacDiagnosis = diagnosisCodes.some(c => c.startsWith('I'));

    if (hasCardiacProcedure && !hasCardiacDiagnosis) {
      return {
        factor: 'Code-Procedure Mismatch',
        impact_score: 20,
        description: 'Cardiac procedure codes present without cardiac diagnosis',
        mitigation: 'Verify diagnosis codes match the procedures performed',
      };
    }

    return null;
  }

  private async assessDuplicateRisk(claim: Claim): Promise<number> {
    // In real implementation, would query database for similar claims
    // For now, return low risk
    return 0.1;
  }

  private generatePreventiveActions(riskFactors: RiskFactor[]): string[] {
    const actions: string[] = [];

    for (const factor of riskFactors) {
      actions.push(factor.mitigation);
    }

    if (actions.length === 0) {
      actions.push('No preventive actions needed - claim appears valid');
    }

    return actions;
  }

  private async generateCorrectionsWithAI(error: BillingError): Promise<string[]> {
    // In real implementation, would use AI to generate specific corrections
    return [error.suggested_correction || 'Manual review required'];
  }

  private async applyCorrections(claimId: string, corrections: string[]): Promise<Claim> {
    // In real implementation, would fetch and update claim in database
    // For now, return mock corrected claim
    throw new Error('Not implemented - would update claim in database');
  }

  private isValidICD10Format(code: string): boolean {
    const icd10Regex = /^[A-Z]\d{2}(\.\d{1,4})?$/;
    return icd10Regex.test(code);
  }

  private isValidCPTFormat(code: string): boolean {
    const cptRegex = /^\d{5}$/;
    return cptRegex.test(code);
  }

  private calculateRiskScore(errors: any[], warnings: any[]): number {
    let score = 0;
    score += errors.filter((e: any) => e.severity === 'Critical').length * 30;
    score += errors.filter((e: any) => e.severity === 'High').length * 20;
    score += warnings.filter((w: any) => w.impact === 'High').length * 15;
    score += warnings.filter((w: any) => w.impact === 'Medium').length * 8;
    return Math.min(score, 100);
  }

  private generateRuleRecommendations(errors: any[], warnings: any[]): string[] {
    const recommendations: string[] = [];

    if (errors.length > 0) {
      recommendations.push('Resolve all critical errors before claim submission');
    }

    if (warnings.length > 0) {
      recommendations.push('Review warnings to improve claim acceptance rate');
    }

    if (recommendations.length === 0) {
      recommendations.push('Claim passes all validation rules');
    }

    return recommendations;
  }
}

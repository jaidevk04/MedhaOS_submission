import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import {
  PriorAuthorizationRequest,
  PriorAuthRequest,
  PriorAuthResponse,
  ClinicalNote,
  InsurancePolicy,
} from '../types';

/**
 * Prior Authorization Service
 * 
 * Implements automated prior authorization request generation
 * including requirement detection, justification generation,
 * and supporting documentation assembly
 * 
 * Requirements: 8.5, 13.5
 */
export class PriorAuthorizationService {
  private anthropic: Anthropic;

  // Services that commonly require prior authorization
  private readonly PRIOR_AUTH_REQUIRED_SERVICES = [
    'MRI',
    'CT Scan',
    'PET Scan',
    'Genetic Testing',
    'Specialty Medications',
    'Durable Medical Equipment',
    'Home Health Services',
    'Inpatient Rehabilitation',
    'Bariatric Surgery',
    'Cosmetic Procedures',
    'Experimental Treatments',
  ];

  // CPT codes that typically require prior authorization
  private readonly PRIOR_AUTH_CPT_CODES = [
    '70450', '70460', '70470', // CT Head
    '70551', '70552', '70553', // MRI Brain
    '71250', '71260', '71270', // CT Chest
    '72141', '72146', '72147', // MRI Spine
    '78608', '78609', // PET Scan
    '81200', '81201', '81202', // Genetic Testing
    'J0178', // Injection codes (specialty drugs)
  ];

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: config.ai.anthropicApiKey,
    });
  }

  /**
   * Detect if prior authorization is required
   */
  async detectAuthorizationRequirement(
    requestedService: string,
    cptCodes: string[],
    insurancePolicy: InsurancePolicy
  ): Promise<{ required: boolean; reason?: string }> {
    // Check if service name matches known requirements
    const serviceRequiresAuth = this.PRIOR_AUTH_REQUIRED_SERVICES.some(service =>
      requestedService.toLowerCase().includes(service.toLowerCase())
    );

    if (serviceRequiresAuth) {
      return {
        required: true,
        reason: `Service "${requestedService}" typically requires prior authorization`,
      };
    }

    // Check if any CPT codes require authorization
    const authRequiredCodes = cptCodes.filter(code =>
      this.PRIOR_AUTH_CPT_CODES.includes(code)
    );

    if (authRequiredCodes.length > 0) {
      return {
        required: true,
        reason: `CPT codes require prior authorization: ${authRequiredCodes.join(', ')}`,
      };
    }

    // Use AI to check for additional requirements
    const aiCheck = await this.checkAuthRequirementWithAI(requestedService, cptCodes, insurancePolicy);
    return aiCheck;
  }

  /**
   * Generate prior authorization request
   */
  async generateAuthorizationRequest(request: PriorAuthRequest): Promise<PriorAuthResponse> {
    const {
      encounter_id,
      patient_id,
      insurance_policy_id,
      requested_service,
      clinical_justification,
      urgency = 'Routine',
    } = request;

    try {
      // Fetch insurance policy (in real implementation, from database)
      const insurancePolicy = await this.fetchInsurancePolicy(insurance_policy_id);

      // Fetch clinical context (in real implementation, from database)
      const clinicalContext = await this.fetchClinicalContext(encounter_id);

      // Generate clinical justification if not provided
      const justification = clinical_justification ||
        await this.generateClinicalJustification(requested_service, clinicalContext);

      // Assemble supporting evidence
      const supportingEvidence = await this.assembleSupportingEvidence(
        requested_service,
        clinicalContext
      );

      // Create authorization request
      const authRequest: PriorAuthorizationRequest = {
        auth_request_id: this.generateAuthRequestId(),
        encounter_id,
        patient_id,
        insurance_policy: insurancePolicy,
        requested_service,
        icd10_codes: clinicalContext.icd10_codes || [],
        cpt_codes: clinicalContext.cpt_codes || [],
        clinical_justification: justification,
        supporting_documents: supportingEvidence,
        urgency,
        status: 'Draft',
      };

      return {
        authorization_request: authRequest,
        auto_generated_justification: justification,
        supporting_evidence: supportingEvidence,
        submission_ready: true,
      };
    } catch (error) {
      console.error('Error generating authorization request:', error);
      throw new Error(`Prior authorization generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit prior authorization request
   */
  async submitAuthorizationRequest(
    authRequest: PriorAuthorizationRequest
  ): Promise<{ success: boolean; submission_id?: string; message?: string }> {
    try {
      // Validate request before submission
      const validation = this.validateAuthRequest(authRequest);
      if (!validation.isValid) {
        return {
          success: false,
          message: `Validation failed: ${validation.errors.join(', ')}`,
        };
      }

      // In real implementation, submit to insurance payer API
      console.log('Submitting prior authorization request:', authRequest.auth_request_id);

      // Simulate API call
      const submissionId = `AUTH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Update request status
      authRequest.status = 'Submitted';
      authRequest.submission_date = new Date().toISOString();

      return {
        success: true,
        submission_id: submissionId,
        message: 'Prior authorization request submitted successfully',
      };
    } catch (error) {
      console.error('Error submitting authorization request:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Submission failed',
      };
    }
  }

  /**
   * Generate clinical justification using AI
   */
  private async generateClinicalJustification(
    requestedService: string,
    clinicalContext: any
  ): Promise<string> {
    const prompt = `Generate a clinical justification for prior authorization of the following medical service:

**Requested Service:** ${requestedService}

**Patient Clinical Context:**
- Chief Complaint: ${clinicalContext.chief_complaint || 'Not provided'}
- Diagnoses (ICD-10): ${clinicalContext.icd10_codes?.join(', ') || 'Not provided'}
- Medical History: ${clinicalContext.medical_history || 'Not provided'}
- Current Symptoms: ${clinicalContext.symptoms || 'Not provided'}
- Previous Treatments: ${clinicalContext.previous_treatments || 'Not provided'}

**Instructions:**
Write a clear, concise clinical justification that:
1. Explains the medical necessity of the requested service
2. References relevant clinical guidelines
3. Describes why alternative treatments are insufficient
4. Includes specific clinical findings that support the request
5. Uses professional medical terminology
6. Is 200-300 words

Provide only the justification text, no additional formatting.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return content.text.trim();
    } catch (error) {
      console.error('Error generating clinical justification:', error);
      return `Medical necessity for ${requestedService} based on patient's clinical presentation and diagnosis.`;
    }
  }

  /**
   * Assemble supporting evidence and documentation
   */
  private async assembleSupportingEvidence(
    requestedService: string,
    clinicalContext: any
  ): Promise<string[]> {
    const evidence: string[] = [];

    // Add relevant clinical notes
    if (clinicalContext.clinical_notes) {
      evidence.push('Clinical encounter notes');
    }

    // Add diagnostic reports
    if (clinicalContext.diagnostic_reports) {
      evidence.push('Diagnostic test results');
    }

    // Add imaging studies
    if (clinicalContext.imaging_studies) {
      evidence.push('Previous imaging studies');
    }

    // Add lab results
    if (clinicalContext.lab_results) {
      evidence.push('Laboratory test results');
    }

    // Add treatment history
    if (clinicalContext.treatment_history) {
      evidence.push('Previous treatment records');
    }

    // Add specialist consultation notes
    if (clinicalContext.specialist_notes) {
      evidence.push('Specialist consultation notes');
    }

    // Add relevant clinical guidelines
    evidence.push(`Clinical guidelines for ${requestedService}`);

    // Add peer-reviewed literature references
    evidence.push('Peer-reviewed medical literature supporting treatment');

    return evidence;
  }

  /**
   * Check authorization requirement using AI
   */
  private async checkAuthRequirementWithAI(
    requestedService: string,
    cptCodes: string[],
    insurancePolicy: InsurancePolicy
  ): Promise<{ required: boolean; reason?: string }> {
    const prompt = `Determine if prior authorization is required for this medical service:

Service: ${requestedService}
CPT Codes: ${cptCodes.join(', ')}
Insurance Payer: ${insurancePolicy.payer_name}
Coverage Type: ${insurancePolicy.coverage_type}

Based on typical insurance requirements, does this service require prior authorization?

Respond with JSON:
{
  "required": true/false,
  "reason": "Brief explanation"
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 256,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        return { required: false };
      }

      let jsonStr = content.text.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      }

      const result = JSON.parse(jsonStr);
      return result;
    } catch (error) {
      console.error('Error checking auth requirement with AI:', error);
      return { required: false };
    }
  }

  /**
   * Validate authorization request
   */
  private validateAuthRequest(authRequest: PriorAuthorizationRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!authRequest.patient_id) {
      errors.push('Patient ID is required');
    }

    if (!authRequest.requested_service) {
      errors.push('Requested service is required');
    }

    if (!authRequest.clinical_justification || authRequest.clinical_justification.length < 50) {
      errors.push('Clinical justification must be at least 50 characters');
    }

    if (authRequest.icd10_codes.length === 0) {
      errors.push('At least one diagnosis code is required');
    }

    if (!authRequest.insurance_policy) {
      errors.push('Insurance policy information is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Fetch insurance policy (mock implementation)
   */
  private async fetchInsurancePolicy(policyId: string): Promise<InsurancePolicy> {
    // In real implementation, fetch from database
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
   * Fetch clinical context (mock implementation)
   */
  private async fetchClinicalContext(encounterId: string): Promise<any> {
    // In real implementation, fetch from database
    return {
      encounter_id: encounterId,
      chief_complaint: 'Chronic back pain',
      icd10_codes: ['M54.5'],
      cpt_codes: ['72148'],
      medical_history: 'History of degenerative disc disease',
      symptoms: 'Persistent lower back pain radiating to left leg',
      previous_treatments: 'Physical therapy, NSAIDs, epidural steroid injections',
      clinical_notes: 'Patient has failed conservative management',
      diagnostic_reports: ['X-ray lumbar spine', 'Previous MRI from 2 years ago'],
    };
  }

  /**
   * Generate unique authorization request ID
   */
  private generateAuthRequestId(): string {
    return `AUTH-REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
}

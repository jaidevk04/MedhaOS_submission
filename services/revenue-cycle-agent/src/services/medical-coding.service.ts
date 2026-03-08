import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import {
  ClinicalNote,
  MedicalCoding,
  ICD10Code,
  CPTCode,
  CodingRequest,
  CodingResponse,
} from '../types';

/**
 * Medical Coding Service
 * 
 * Implements automated ICD-10 and CPT code mapping from clinical notes
 * using NLP and LLM-based medical coding.
 * 
 * Requirements: 8.1, 8.2, 8.3
 */
export class MedicalCodingService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: config.ai.anthropicApiKey,
    });
  }

  /**
   * Generate ICD-10 and CPT codes from clinical notes
   * Target accuracy: 92%
   */
  async generateCodes(request: CodingRequest): Promise<CodingResponse> {
    const startTime = Date.now();
    const { clinical_note, encounter_context } = request;

    try {
      // Build comprehensive prompt for medical coding
      const prompt = this.buildCodingPrompt(clinical_note, encounter_context);

      // Call Claude for medical coding
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.1, // Low temperature for consistent coding
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Parse the response
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const codingResult = this.parseCodingResponse(content.text);

      // Build medical coding object
      const medicalCoding: MedicalCoding = {
        encounter_id: clinical_note.encounter_id,
        icd10_codes: codingResult.icd10_codes,
        cpt_codes: codingResult.cpt_codes,
        coding_date: new Date().toISOString(),
        coder_type: 'AI',
        overall_confidence: this.calculateOverallConfidence(
          codingResult.icd10_codes,
          codingResult.cpt_codes
        ),
        requires_review: this.requiresHumanReview(
          codingResult.icd10_codes,
          codingResult.cpt_codes
        ),
        review_reason: this.getReviewReason(
          codingResult.icd10_codes,
          codingResult.cpt_codes
        ),
      };

      const processingTime = Date.now() - startTime;

      return {
        medical_coding: medicalCoding,
        processing_time_ms: processingTime,
        model_used: 'claude-3-5-sonnet-20241022',
      };
    } catch (error) {
      console.error('Error generating medical codes:', error);
      throw new Error(`Medical coding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build comprehensive prompt for medical coding
   */
  private buildCodingPrompt(
    note: ClinicalNote,
    context?: { facility_type?: string; specialty?: string; visit_duration_minutes?: number }
  ): string {
    return `You are an expert medical coder specializing in ICD-10 and CPT coding. Your task is to analyze the following clinical encounter and assign appropriate medical codes.

**Clinical Encounter Details:**
- Encounter Type: ${note.encounter_type}
- Date: ${note.encounter_date}
- Chief Complaint: ${note.chief_complaint}
${context?.specialty ? `- Specialty: ${context.specialty}` : ''}
${context?.facility_type ? `- Facility Type: ${context.facility_type}` : ''}
${context?.visit_duration_minutes ? `- Visit Duration: ${context.visit_duration_minutes} minutes` : ''}

**SOAP Note:**

**Subjective:**
${note.subjective}

**Objective:**
${note.objective}

**Assessment:**
${note.assessment}

**Plan:**
${note.plan}

${note.diagnoses && note.diagnoses.length > 0 ? `**Documented Diagnoses:**\n${note.diagnoses.map(d => `- ${d}`).join('\n')}` : ''}

${note.procedures && note.procedures.length > 0 ? `**Documented Procedures:**\n${note.procedures.map(p => `- ${p}`).join('\n')}` : ''}

**Instructions:**
1. Assign ICD-10-CM diagnosis codes based on the assessment and clinical findings
2. Assign CPT procedure codes based on the services provided
3. Identify the primary diagnosis (most significant condition)
4. Include all relevant secondary diagnoses
5. Consider the encounter type and specialty when selecting codes
6. Provide confidence scores (0.0-1.0) for each code
7. Follow ICD-10-CM and CPT coding guidelines for ${config.coding.icd10Version}

**Output Format (JSON):**
{
  "icd10_codes": [
    {
      "code": "I21.09",
      "description": "ST elevation myocardial infarction involving other coronary artery",
      "confidence": 0.95,
      "category": "Cardiovascular",
      "is_primary": true
    }
  ],
  "cpt_codes": [
    {
      "code": "99285",
      "description": "Emergency department visit, high complexity",
      "confidence": 0.92,
      "modifier": null,
      "units": 1
    }
  ]
}

Provide ONLY the JSON output, no additional text.`;
  }

  /**
   * Parse coding response from LLM
   */
  private parseCodingResponse(response: string): {
    icd10_codes: ICD10Code[];
    cpt_codes: CPTCode[];
  } {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '').replace(/```\n?$/g, '');
      }

      const parsed = JSON.parse(jsonStr);

      return {
        icd10_codes: parsed.icd10_codes || [],
        cpt_codes: parsed.cpt_codes || [],
      };
    } catch (error) {
      console.error('Error parsing coding response:', error);
      console.error('Response:', response);
      throw new Error('Failed to parse medical coding response');
    }
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(icd10Codes: ICD10Code[], cptCodes: CPTCode[]): number {
    const allCodes = [
      ...icd10Codes.map(c => c.confidence),
      ...cptCodes.map(c => c.confidence),
    ];

    if (allCodes.length === 0) return 0;

    const avgConfidence = allCodes.reduce((sum, conf) => sum + conf, 0) / allCodes.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  /**
   * Determine if human review is required
   */
  private requiresHumanReview(icd10Codes: ICD10Code[], cptCodes: CPTCode[]): boolean {
    const overallConfidence = this.calculateOverallConfidence(icd10Codes, cptCodes);

    // Require review if overall confidence is below threshold
    if (overallConfidence < config.coding.confidenceThreshold) {
      return true;
    }

    // Require review if any individual code has low confidence
    const hasLowConfidenceCode = [
      ...icd10Codes.map(c => c.confidence),
      ...cptCodes.map(c => c.confidence),
    ].some(conf => conf < 0.75);

    if (hasLowConfidenceCode) {
      return true;
    }

    // Require review if no primary diagnosis is identified
    const hasPrimaryDiagnosis = icd10Codes.some(c => c.is_primary);
    if (!hasPrimaryDiagnosis && icd10Codes.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Get reason for human review
   */
  private getReviewReason(icd10Codes: ICD10Code[], cptCodes: CPTCode[]): string | undefined {
    if (!this.requiresHumanReview(icd10Codes, cptCodes)) {
      return undefined;
    }

    const reasons: string[] = [];

    const overallConfidence = this.calculateOverallConfidence(icd10Codes, cptCodes);
    if (overallConfidence < config.coding.confidenceThreshold) {
      reasons.push(`Overall confidence ${(overallConfidence * 100).toFixed(1)}% below threshold`);
    }

    const lowConfidenceCodes = [
      ...icd10Codes.filter(c => c.confidence < 0.75).map(c => `ICD-10: ${c.code}`),
      ...cptCodes.filter(c => c.confidence < 0.75).map(c => `CPT: ${c.code}`),
    ];

    if (lowConfidenceCodes.length > 0) {
      reasons.push(`Low confidence codes: ${lowConfidenceCodes.join(', ')}`);
    }

    const hasPrimaryDiagnosis = icd10Codes.some(c => c.is_primary);
    if (!hasPrimaryDiagnosis && icd10Codes.length > 0) {
      reasons.push('No primary diagnosis identified');
    }

    return reasons.join('; ');
  }

  /**
   * Validate ICD-10 code format
   */
  validateICD10Code(code: string): boolean {
    // ICD-10 format: Letter followed by 2 digits, optional decimal and 1-4 more digits
    const icd10Regex = /^[A-Z]\d{2}(\.\d{1,4})?$/;
    return icd10Regex.test(code);
  }

  /**
   * Validate CPT code format
   */
  validateCPTCode(code: string): boolean {
    // CPT format: 5 digits
    const cptRegex = /^\d{5}$/;
    return cptRegex.test(code);
  }
}

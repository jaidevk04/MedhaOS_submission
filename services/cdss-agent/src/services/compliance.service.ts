import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config';
import {
  ComplianceCheck,
  DocumentationCompleteness,
  PriorAuthorizationRequest,
  PriorAuthorizationResponse,
  ComplianceValidationResponse,
  GuidelineReference
} from '../types';

/**
 * Compliance Checking Service
 * Validates clinical documentation, prescriptions, and procedures against guidelines
 * Generates prior authorization requests
 */
export class ComplianceService {
  private bedrockClient: BedrockRuntimeClient;
  private guidelines: Map<string, GuidelineReference>;

  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({
      region: config.aws.region,
      credentials: config.aws.accessKeyId && config.aws.secretAccessKey ? {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey
      } : undefined
    });
    this.initializeGuidelines();
  }

  /**
   * Initialize medical guidelines database
   */
  private initializeGuidelines(): void {
    this.guidelines = new Map([
      ['nmc_documentation', {
        id: 'nmc_doc_2023',
        title: 'NMC Clinical Documentation Standards',
        organization: 'NMC',
        version: '2023.1',
        url: 'https://nmc.org.in/guidelines/documentation',
        lastUpdated: new Date('2023-01-01')
      }],
      ['nmc_prescription', {
        id: 'nmc_rx_2023',
        title: 'NMC Prescription Guidelines',
        organization: 'NMC',
        version: '2023.1',
        url: 'https://nmc.org.in/guidelines/prescription',
        lastUpdated: new Date('2023-01-01')
      }],
      ['icmr_cardiac', {
        id: 'icmr_cardiac_2022',
        title: 'ICMR Guidelines for Cardiac Care',
        organization: 'ICMR',
        version: '2022.2',
        url: 'https://icmr.gov.in/guidelines/cardiac',
        lastUpdated: new Date('2022-06-01')
      }],
      ['who_infection_control', {
        id: 'who_ic_2021',
        title: 'WHO Infection Prevention and Control Guidelines',
        organization: 'WHO',
        version: '2021.1',
        url: 'https://who.int/guidelines/infection-control',
        lastUpdated: new Date('2021-01-01')
      }]
    ]);
  }

  /**
   * Validate clinical encounter documentation for completeness
   */
  async validateDocumentation(encounterData: any): Promise<ComplianceValidationResponse> {
    try {
      const checks: ComplianceCheck[] = [];
      
      // Check 1: Documentation completeness
      const completeness = this.checkDocumentationCompleteness(encounterData);
      
      if (completeness.completenessScore < 0.8) {
        checks.push({
          checkType: 'documentation',
          status: 'non_compliant',
          message: `Documentation is ${(completeness.completenessScore * 100).toFixed(0)}% complete. Missing critical fields.`,
          guidelineReference: this.guidelines.get('nmc_documentation'),
          recommendation: 'Complete all required fields before finalizing the encounter'
        });
      } else if (completeness.completenessScore < 1.0) {
        checks.push({
          checkType: 'documentation',
          status: 'warning',
          message: `Documentation is ${(completeness.completenessScore * 100).toFixed(0)}% complete. Some optional fields missing.`,
          guidelineReference: this.guidelines.get('nmc_documentation'),
          recommendation: 'Consider completing optional fields for comprehensive documentation'
        });
      } else {
        checks.push({
          checkType: 'documentation',
          status: 'compliant',
          message: 'Documentation is complete and meets NMC standards',
          guidelineReference: this.guidelines.get('nmc_documentation')
        });
      }

      // Check 2: Prescription compliance
      if (encounterData.prescriptions && encounterData.prescriptions.length > 0) {
        const prescriptionCheck = this.checkPrescriptionCompliance(encounterData.prescriptions);
        checks.push(prescriptionCheck);
      }

      // Check 3: Procedure documentation
      if (encounterData.procedures && encounterData.procedures.length > 0) {
        const procedureCheck = this.checkProcedureDocumentation(encounterData.procedures);
        checks.push(procedureCheck);
      }

      // Check 4: Informed consent
      if (encounterData.procedures || encounterData.surgeries) {
        const consentCheck = this.checkInformedConsent(encounterData);
        checks.push(consentCheck);
      }

      // Determine overall compliance
      const nonCompliantChecks = checks.filter(c => c.status === 'non_compliant');
      const warningChecks = checks.filter(c => c.status === 'warning');
      
      let overallCompliance: 'compliant' | 'non_compliant' | 'needs_review';
      if (nonCompliantChecks.length > 0) {
        overallCompliance = 'non_compliant';
      } else if (warningChecks.length > 0) {
        overallCompliance = 'needs_review';
      } else {
        overallCompliance = 'compliant';
      }

      // Generate recommendations
      const recommendations = this.generateComplianceRecommendations(checks, completeness);

      return {
        encounterId: encounterData.encounterId || encounterData.id,
        overallCompliance,
        checks,
        documentationCompleteness: completeness,
        recommendations,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error validating documentation:', error);
      throw error;
    }
  }

  /**
   * Check documentation completeness
   */
  private checkDocumentationCompleteness(encounterData: any): DocumentationCompleteness {
    const requiredFields = [
      { field: 'patientId', importance: 'critical' as const },
      { field: 'chiefComplaint', importance: 'critical' as const },
      { field: 'presentingSymptoms', importance: 'critical' as const },
      { field: 'vitalSigns', importance: 'critical' as const },
      { field: 'physicalExamination', importance: 'required' as const },
      { field: 'assessment', importance: 'critical' as const },
      { field: 'diagnosis', importance: 'critical' as const },
      { field: 'treatmentPlan', importance: 'critical' as const },
      { field: 'clinicianSignature', importance: 'critical' as const },
      { field: 'medicalHistory', importance: 'required' as const },
      { field: 'allergies', importance: 'required' as const },
      { field: 'currentMedications', importance: 'required' as const },
      { field: 'socialHistory', importance: 'optional' as const },
      { field: 'familyHistory', importance: 'optional' as const },
      { field: 'reviewOfSystems', importance: 'optional' as const }
    ];

    const fieldStatus = requiredFields.map(({ field, importance }) => ({
      field,
      present: this.isFieldPresent(encounterData, field),
      importance
    }));

    const missingCriticalFields = fieldStatus
      .filter(f => f.importance === 'critical' && !f.present)
      .map(f => f.field);

    const missingRequiredFields = fieldStatus
      .filter(f => f.importance === 'required' && !f.present)
      .map(f => f.field);

    // Calculate completeness score
    const criticalWeight = 0.7;
    const requiredWeight = 0.2;
    const optionalWeight = 0.1;

    const criticalFields = fieldStatus.filter(f => f.importance === 'critical');
    const requiredFieldsList = fieldStatus.filter(f => f.importance === 'required');
    const optionalFields = fieldStatus.filter(f => f.importance === 'optional');

    const criticalScore = criticalFields.filter(f => f.present).length / criticalFields.length;
    const requiredScore = requiredFieldsList.filter(f => f.present).length / requiredFieldsList.length;
    const optionalScore = optionalFields.filter(f => f.present).length / optionalFields.length;

    const completenessScore = (criticalScore * criticalWeight) + 
                             (requiredScore * requiredWeight) + 
                             (optionalScore * optionalWeight);

    // Generate suggestions
    const suggestions: string[] = [];
    if (missingCriticalFields.length > 0) {
      suggestions.push(`Complete critical fields: ${missingCriticalFields.join(', ')}`);
    }
    if (missingRequiredFields.length > 0) {
      suggestions.push(`Complete required fields: ${missingRequiredFields.join(', ')}`);
    }
    if (completenessScore === 1.0) {
      suggestions.push('Documentation is complete and comprehensive');
    }

    return {
      encounterId: encounterData.encounterId || encounterData.id,
      requiredFields: fieldStatus,
      completenessScore,
      missingCriticalFields,
      suggestions
    };
  }

  /**
   * Check if a field is present and has meaningful content
   */
  private isFieldPresent(data: any, field: string): boolean {
    const value = data[field];
    if (value === undefined || value === null) return false;
    if (typeof value === 'string' && value.trim().length === 0) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
    return true;
  }

  /**
   * Check prescription compliance with NMC guidelines
   */
  private checkPrescriptionCompliance(prescriptions: any[]): ComplianceCheck {
    const issues: string[] = [];

    for (const rx of prescriptions) {
      // Check required fields
      if (!rx.drugName) issues.push('Missing drug name');
      if (!rx.dosage) issues.push('Missing dosage');
      if (!rx.frequency) issues.push('Missing frequency');
      if (!rx.duration) issues.push('Missing duration');
      if (!rx.instructions) issues.push('Missing patient instructions');

      // Check for generic name usage (NMC guideline)
      if (rx.drugName && this.isBrandName(rx.drugName)) {
        issues.push(`Consider using generic name instead of brand name: ${rx.drugName}`);
      }

      // Check for controlled substances documentation
      if (rx.drugName && this.isControlledSubstance(rx.drugName)) {
        if (!rx.controlledSubstanceJustification) {
          issues.push(`Controlled substance ${rx.drugName} requires justification`);
        }
      }
    }

    if (issues.length === 0) {
      return {
        checkType: 'prescription',
        status: 'compliant',
        message: 'All prescriptions comply with NMC guidelines',
        guidelineReference: this.guidelines.get('nmc_prescription')
      };
    } else if (issues.length <= 2) {
      return {
        checkType: 'prescription',
        status: 'warning',
        message: `Prescription has minor issues: ${issues.join('; ')}`,
        guidelineReference: this.guidelines.get('nmc_prescription'),
        recommendation: 'Address the identified issues to ensure full compliance'
      };
    } else {
      return {
        checkType: 'prescription',
        status: 'non_compliant',
        message: `Prescription has multiple compliance issues: ${issues.join('; ')}`,
        guidelineReference: this.guidelines.get('nmc_prescription'),
        recommendation: 'Review and correct all prescription fields according to NMC guidelines'
      };
    }
  }

  /**
   * Check if drug name is a brand name (simplified check)
   */
  private isBrandName(drugName: string): boolean {
    // In production, check against a comprehensive database
    const commonBrands = ['Crocin', 'Dolo', 'Combiflam', 'Augmentin', 'Calpol'];
    return commonBrands.some(brand => drugName.toLowerCase().includes(brand.toLowerCase()));
  }

  /**
   * Check if drug is a controlled substance
   */
  private isControlledSubstance(drugName: string): boolean {
    // In production, check against NDPS Act schedule
    const controlledSubstances = ['morphine', 'fentanyl', 'tramadol', 'codeine', 'alprazolam', 'diazepam'];
    return controlledSubstances.some(cs => drugName.toLowerCase().includes(cs));
  }

  /**
   * Check procedure documentation
   */
  private checkProcedureDocumentation(procedures: any[]): ComplianceCheck {
    const issues: string[] = [];

    for (const procedure of procedures) {
      if (!procedure.procedureName) issues.push('Missing procedure name');
      if (!procedure.indication) issues.push('Missing indication');
      if (!procedure.performedBy) issues.push('Missing performer information');
      if (!procedure.procedureNotes) issues.push('Missing procedure notes');
      if (!procedure.complications) issues.push('Missing complications documentation');
    }

    if (issues.length === 0) {
      return {
        checkType: 'procedure',
        status: 'compliant',
        message: 'Procedure documentation is complete',
        guidelineReference: this.guidelines.get('nmc_documentation')
      };
    } else {
      return {
        checkType: 'procedure',
        status: 'non_compliant',
        message: `Procedure documentation incomplete: ${issues.join('; ')}`,
        guidelineReference: this.guidelines.get('nmc_documentation'),
        recommendation: 'Complete all required procedure documentation fields'
      };
    }
  }

  /**
   * Check informed consent documentation
   */
  private checkInformedConsent(encounterData: any): ComplianceCheck {
    if (!encounterData.informedConsent) {
      return {
        checkType: 'procedure',
        status: 'non_compliant',
        message: 'Informed consent not documented',
        guidelineReference: this.guidelines.get('nmc_documentation'),
        recommendation: 'Obtain and document informed consent before procedures'
      };
    }

    const consent = encounterData.informedConsent;
    const issues: string[] = [];

    if (!consent.patientSignature) issues.push('Missing patient signature');
    if (!consent.witnessSignature) issues.push('Missing witness signature');
    if (!consent.risksExplained) issues.push('Risks not documented as explained');
    if (!consent.alternativesDiscussed) issues.push('Alternatives not documented as discussed');

    if (issues.length === 0) {
      return {
        checkType: 'procedure',
        status: 'compliant',
        message: 'Informed consent properly documented',
        guidelineReference: this.guidelines.get('nmc_documentation')
      };
    } else {
      return {
        checkType: 'procedure',
        status: 'non_compliant',
        message: `Informed consent incomplete: ${issues.join('; ')}`,
        guidelineReference: this.guidelines.get('nmc_documentation'),
        recommendation: 'Complete all required informed consent elements'
      };
    }
  }

  /**
   * Generate compliance recommendations
   */
  private generateComplianceRecommendations(
    checks: ComplianceCheck[],
    completeness: DocumentationCompleteness
  ): string[] {
    const recommendations: string[] = [];

    // Critical issues first
    const criticalChecks = checks.filter(c => c.status === 'non_compliant');
    if (criticalChecks.length > 0) {
      recommendations.push('CRITICAL: Address non-compliant items before finalizing documentation');
      criticalChecks.forEach(check => {
        if (check.recommendation) {
          recommendations.push(`- ${check.recommendation}`);
        }
      });
    }

    // Completeness recommendations
    if (completeness.missingCriticalFields.length > 0) {
      recommendations.push(`Complete critical fields: ${completeness.missingCriticalFields.join(', ')}`);
    }

    // Warning items
    const warningChecks = checks.filter(c => c.status === 'warning');
    if (warningChecks.length > 0) {
      recommendations.push('Review and address warning items for best practices');
    }

    // Best practices
    if (checks.every(c => c.status === 'compliant') && completeness.completenessScore === 1.0) {
      recommendations.push('Documentation meets all compliance requirements');
    }

    return recommendations;
  }

  /**
   * Generate prior authorization request
   */
  async generatePriorAuthorizationRequest(request: PriorAuthorizationRequest): Promise<PriorAuthorizationResponse> {
    try {
      const startTime = Date.now();

      // Generate authorization document using LLM
      const document = await this.generateAuthorizationDocument(request);

      // Identify supporting documents needed
      const supportingDocs = this.identifySupportingDocuments(request);

      // Estimate approval time based on urgency and request type
      const estimatedTime = this.estimateApprovalTime(request);

      // Generate submission instructions
      const instructions = this.generateSubmissionInstructions(request);

      const processingTime = Date.now() - startTime;
      console.log(`Prior authorization request generated in ${processingTime}ms`);

      return {
        requestId: `PA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        generatedDocument: document,
        supportingDocuments: supportingDocs,
        estimatedApprovalTime: estimatedTime,
        submissionInstructions: instructions,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error generating prior authorization:', error);
      throw error;
    }
  }

  /**
   * Generate authorization document using LLM
   */
  private async generateAuthorizationDocument(request: PriorAuthorizationRequest): Promise<string> {
    try {
      const prompt = `Generate a prior authorization request letter for insurance approval.

Patient ID: ${request.patientId}
Encounter ID: ${request.encounterId}
Request Type: ${request.requestType}

Details:
- Name: ${request.details.name}
- Code: ${request.details.code}
- Justification: ${request.details.justification}

Clinical Evidence:
${request.details.clinicalEvidence.map((e, i) => `${i + 1}. ${e}`).join('\n')}

${request.details.alternativesConsidered ? `Alternatives Considered:\n${request.details.alternativesConsidered.join('\n')}` : ''}

Insurance Information:
- Provider: ${request.insuranceInfo.provider}
- Policy Number: ${request.insuranceInfo.policyNumber}
${request.insuranceInfo.groupNumber ? `- Group Number: ${request.insuranceInfo.groupNumber}` : ''}

Urgency: ${request.urgency}

Generate a professional, comprehensive prior authorization request letter that includes:
1. Patient information
2. Requested service/medication details
3. Medical necessity justification
4. Supporting clinical evidence
5. Alternatives considered and why they are not suitable
6. Urgency justification
7. Provider information and signature block

Format the letter professionally for submission to the insurance company.`;

      const input = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        top_p: 0.9
      };

      const command = new InvokeModelCommand({
        modelId: config.bedrock.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(input)
      });

      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return responseBody.content[0].text;
    } catch (error) {
      console.error('Error generating authorization document:', error);
      return 'Error generating document. Please create manually.';
    }
  }

  /**
   * Identify required supporting documents
   */
  private identifySupportingDocuments(request: PriorAuthorizationRequest): string[] {
    const docs: string[] = [
      'Patient demographics and insurance information',
      'Clinical notes from recent encounters',
      'Relevant diagnostic test results'
    ];

    if (request.requestType === 'medication') {
      docs.push('Prescription with dosage and duration');
      docs.push('Documentation of failed alternative treatments (if applicable)');
    } else if (request.requestType === 'procedure') {
      docs.push('Procedure details and CPT codes');
      docs.push('Imaging or diagnostic reports supporting medical necessity');
    } else if (request.requestType === 'diagnostic_test') {
      docs.push('Clinical indication for the test');
      docs.push('Previous test results (if applicable)');
    } else if (request.requestType === 'hospitalization') {
      docs.push('Admission orders and treatment plan');
      docs.push('Severity of illness documentation');
    }

    if (request.urgency === 'emergency') {
      docs.push('Emergency department notes');
      docs.push('Documentation of life-threatening condition');
    }

    return docs;
  }

  /**
   * Estimate approval time
   */
  private estimateApprovalTime(request: PriorAuthorizationRequest): string {
    if (request.urgency === 'emergency') {
      return '24-48 hours (expedited review)';
    } else if (request.urgency === 'urgent') {
      return '3-5 business days';
    } else {
      return '7-14 business days';
    }
  }

  /**
   * Generate submission instructions
   */
  private generateSubmissionInstructions(request: PriorAuthorizationRequest): string {
    return `
Prior Authorization Submission Instructions:

1. Review the generated authorization request letter for accuracy
2. Attach all required supporting documents
3. Submit via one of the following methods:
   - Online portal: ${request.insuranceInfo.provider} provider portal
   - Fax: Check with ${request.insuranceInfo.provider} for fax number
   - Email: Check with ${request.insuranceInfo.provider} for email address

4. Document the submission:
   - Date and time of submission
   - Method of submission
   - Confirmation number (if provided)

5. Follow up:
   - ${request.urgency === 'emergency' ? 'Follow up within 24 hours' : 'Follow up within 3-5 business days'}
   - Check authorization status regularly
   - Be prepared to provide additional information if requested

6. Keep copies:
   - Save all submitted documents
   - Document all communications with the insurance company
   - Note any reference numbers provided

For urgent cases, consider calling the insurance company directly after submission to expedite the review process.
    `.trim();
  }
}

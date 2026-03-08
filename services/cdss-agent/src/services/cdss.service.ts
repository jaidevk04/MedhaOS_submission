import { CDSSRequest, CDSSResponse } from '../types';
import { RAGService } from './rag.service';
import { DifferentialDiagnosisService } from './differential-diagnosis.service';
import { ClinicalTrialMatchingService } from './clinical-trial-matching.service';
import { ComplianceService } from './compliance.service';

/**
 * Main CDSS Service
 * Orchestrates all clinical decision support functionalities
 */
export class CDSSService {
  private ragService: RAGService;
  private diagnosisService: DifferentialDiagnosisService;
  private trialMatchingService: ClinicalTrialMatchingService;
  private complianceService: ComplianceService;

  constructor() {
    this.ragService = new RAGService();
    this.diagnosisService = new DifferentialDiagnosisService();
    this.trialMatchingService = new ClinicalTrialMatchingService();
    this.complianceService = new ComplianceService();
  }

  /**
   * Process CDSS request
   */
  async processRequest(request: CDSSRequest): Promise<CDSSResponse> {
    const startTime = Date.now();
    const requestId = `CDSS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      let data: any;
      let confidence: number;

      switch (request.requestType) {
        case 'diagnosis':
          if (!request.patientContext) {
            throw new Error('Patient context required for diagnosis request');
          }
          const diagnosisResult = await this.diagnosisService.generateDifferentialDiagnosis(request.patientContext);
          data = diagnosisResult;
          confidence = diagnosisResult.confidence;
          break;

        case 'literature_search':
          if (!request.query) {
            throw new Error('Query required for literature search');
          }
          const literatureResult = await this.ragService.searchLiterature(request.query);
          data = literatureResult;
          confidence = literatureResult.confidence;
          break;

        case 'trial_matching':
          if (!request.patientProfile) {
            throw new Error('Patient profile required for trial matching');
          }
          const trialResult = await this.trialMatchingService.matchPatientToTrials(request.patientProfile);
          data = trialResult;
          confidence = this.calculateTrialMatchConfidence(trialResult);
          break;

        case 'compliance_check':
          if (!request.encounterId) {
            throw new Error('Encounter ID required for compliance check');
          }
          const complianceResult = await this.complianceService.validateDocumentation(request);
          data = complianceResult;
          confidence = this.calculateComplianceConfidence(complianceResult);
          break;

        case 'prior_auth':
          if (!request.authorizationRequest) {
            throw new Error('Authorization request required for prior auth');
          }
          const authResult = await this.complianceService.generatePriorAuthorizationRequest(request.authorizationRequest);
          data = authResult;
          confidence = 0.95; // High confidence for document generation
          break;

        default:
          throw new Error(`Unknown request type: ${request.requestType}`);
      }

      const processingTime = Date.now() - startTime;

      return {
        requestId,
        requestType: request.requestType,
        data,
        confidence,
        processingTime,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error processing CDSS request:', error);
      throw error;
    }
  }

  /**
   * Get clinical recommendations for a condition
   */
  async getClinicalRecommendations(condition: string, patientContext?: string): Promise<CDSSResponse> {
    return this.processRequest({
      requestType: 'literature_search',
      query: patientContext
        ? `Clinical management recommendations for ${condition} in a patient with: ${patientContext}`
        : `Evidence-based clinical management recommendations for ${condition}`
    });
  }

  /**
   * Get drug information
   */
  async getDrugInformation(drugName: string, indication?: string): Promise<CDSSResponse> {
    return this.processRequest({
      requestType: 'literature_search',
      query: indication
        ? `${drugName} for ${indication}: efficacy, safety, dosing, and clinical evidence`
        : `${drugName}: mechanism of action, indications, contraindications, and clinical evidence`
    });
  }

  /**
   * Calculate trial match confidence
   */
  private calculateTrialMatchConfidence(result: any): number {
    if (!result.matches || result.matches.length === 0) {
      return 0;
    }

    const eligibleMatches = result.matches.filter((m: any) => m.eligibilityStatus === 'eligible');
    const potentialMatches = result.matches.filter((m: any) => m.eligibilityStatus === 'potentially_eligible');

    if (eligibleMatches.length > 0) {
      return 0.9;
    } else if (potentialMatches.length > 0) {
      return 0.7;
    } else {
      return 0.3;
    }
  }

  /**
   * Calculate compliance confidence
   */
  private calculateComplianceConfidence(result: any): number {
    if (result.overallCompliance === 'compliant') {
      return 0.95;
    } else if (result.overallCompliance === 'needs_review') {
      return 0.75;
    } else {
      return 0.5;
    }
  }
}

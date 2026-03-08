import { VisionModelInput, VisionAnalysisResult, AnomalyDetection, ImageModality } from '../types';
import { SageMakerInferenceService } from './sagemaker-inference.service';
import { config } from '../config';

export class VisionAnalysisService {
  private sagemakerService: SageMakerInferenceService;

  constructor() {
    this.sagemakerService = new SageMakerInferenceService();
  }

  /**
   * Perform comprehensive vision analysis on medical image
   */
  async analyzeImage(input: VisionModelInput): Promise<VisionAnalysisResult> {
    const startTime = Date.now();

    try {
      // Run models in parallel for faster processing
      const [llavaResult, biomedclipResult, medsamResult] = await Promise.allSettled([
        this.sagemakerService.invokeLLaVA(input),
        this.sagemakerService.invokeBiomedCLIP(input),
        this.sagemakerService.invokeMedSAM(input.imageUrl)
      ]);

      // Parse results
      const llavaData = llavaResult.status === 'fulfilled' 
        ? this.sagemakerService.parseLLaVAResponse(llavaResult.value)
        : { findings: [], anomalies: [], normalFindings: [], confidence: 0 };

      const biomedclipLabels = biomedclipResult.status === 'fulfilled'
        ? this.sagemakerService.parseBiomedCLIPResponse(biomedclipResult.value)
        : [];

      const segmentation = medsamResult.status === 'fulfilled'
        ? this.sagemakerService.parseMedSAMResponse(medsamResult.value)
        : null;

      // Combine and enhance findings
      const combinedFindings = this.combineFindings(
        llavaData.findings || [],
        biomedclipLabels
      );

      // Enhance anomalies with additional context
      const enhancedAnomalies = this.enhanceAnomalies(
        llavaData.anomalies || [],
        input.modality,
        input.clinicalContext
      );

      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(
        llavaData.confidence || 0,
        biomedclipLabels.length,
        segmentation?.confidence
      );

      const processingTime = (Date.now() - startTime) / 1000;

      const result: VisionAnalysisResult = {
        imageId: input.imageUrl.split('/').pop() || 'unknown',
        modality: input.modality,
        findings: combinedFindings,
        anomalies: enhancedAnomalies,
        segmentation: segmentation ? [segmentation] : undefined,
        normalFindings: llavaData.normalFindings || [],
        confidence: overallConfidence,
        processingTimeSeconds: processingTime,
        modelVersions: {
          llava: 'v1.5',
          biomedclip: 'v1.0',
          medsam: 'v1.0'
        }
      };

      return result;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze medical image');
    }
  }

  /**
   * Combine findings from multiple models
   */
  private combineFindings(llavaFindings: string[], biomedclipLabels: string[]): string[] {
    const findings = new Set<string>();

    // Add LLaVA findings
    llavaFindings.forEach(f => findings.add(f));

    // Add BiomedCLIP labels as findings
    biomedclipLabels.forEach(label => {
      if (label !== 'normal') {
        findings.add(`Detected: ${label}`);
      }
    });

    return Array.from(findings);
  }

  /**
   * Enhance anomalies with clinical context
   */
  private enhanceAnomalies(
    anomalies: AnomalyDetection[],
    modality: ImageModality,
    clinicalContext?: any
  ): AnomalyDetection[] {
    return anomalies.map(anomaly => {
      // Adjust severity based on clinical context
      let adjustedSeverity = anomaly.severity;

      if (clinicalContext?.symptoms) {
        // If symptoms match the anomaly type, increase severity
        const symptomMatch = this.checkSymptomMatch(
          anomaly.type,
          clinicalContext.symptoms
        );
        
        if (symptomMatch && anomaly.severity === 'moderate') {
          adjustedSeverity = 'critical';
        }
      }

      // Add modality-specific context
      const enhancedDescription = this.addModalityContext(
        anomaly.description,
        modality,
        anomaly.type
      );

      return {
        ...anomaly,
        severity: adjustedSeverity,
        description: enhancedDescription
      };
    });
  }

  /**
   * Check if symptoms match anomaly type
   */
  private checkSymptomMatch(anomalyType: string, symptoms: string[]): boolean {
    const symptomMap: Record<string, string[]> = {
      'pneumonia': ['cough', 'fever', 'shortness of breath', 'chest pain'],
      'fracture': ['pain', 'swelling', 'deformity', 'inability to move'],
      'hemorrhage': ['headache', 'confusion', 'weakness', 'seizure'],
      'mass': ['pain', 'swelling', 'lump', 'weight loss'],
      'effusion': ['shortness of breath', 'chest pain', 'cough']
    };

    const relatedSymptoms = symptomMap[anomalyType.toLowerCase()] || [];
    
    return symptoms.some(symptom => 
      relatedSymptoms.some(related => 
        symptom.toLowerCase().includes(related.toLowerCase())
      )
    );
  }

  /**
   * Add modality-specific context to description
   */
  private addModalityContext(
    description: string,
    modality: ImageModality,
    anomalyType: string
  ): string {
    const contextMap: Record<string, Record<string, string>> = {
      'X-ray': {
        'pneumonia': 'Consolidation pattern consistent with pneumonia',
        'fracture': 'Cortical discontinuity indicating fracture',
        'effusion': 'Blunting of costophrenic angle suggesting effusion'
      },
      'CT': {
        'hemorrhage': 'Hyperdense area consistent with acute hemorrhage',
        'mass': 'Soft tissue mass with contrast enhancement',
        'infarction': 'Hypodense area in vascular territory'
      },
      'MRI': {
        'tumor': 'Mass with T2 hyperintensity and enhancement',
        'edema': 'T2/FLAIR hyperintense signal indicating edema',
        'hemorrhage': 'Signal characteristics consistent with hemorrhage'
      }
    };

    const modalityContext = contextMap[modality]?.[anomalyType.toLowerCase()];
    
    if (modalityContext) {
      return `${description}. ${modalityContext}`;
    }

    return description;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    llavaConfidence: number,
    biomedclipMatchCount: number,
    segmentationConfidence?: number
  ): number {
    let totalConfidence = llavaConfidence * 0.6; // LLaVA weight: 60%

    // BiomedCLIP contribution (20%)
    const biomedclipScore = Math.min(biomedclipMatchCount / 3, 1.0);
    totalConfidence += biomedclipScore * 0.2;

    // Segmentation contribution (20%)
    if (segmentationConfidence !== undefined) {
      totalConfidence += segmentationConfidence * 0.2;
    } else {
      // If no segmentation, redistribute weight to LLaVA
      totalConfidence += llavaConfidence * 0.2;
    }

    return Math.min(totalConfidence, 1.0);
  }

  /**
   * Identify critical findings that require immediate attention
   */
  identifyCriticalFindings(analysis: VisionAnalysisResult): AnomalyDetection[] {
    return analysis.anomalies.filter(anomaly => {
      // Critical if severity is critical
      if (anomaly.severity === 'critical') {
        return true;
      }

      // Critical if confidence is very high and severity is moderate
      if (anomaly.confidence >= config.model.criticalFindingThreshold && 
          anomaly.severity === 'moderate') {
        return true;
      }

      // Critical based on anomaly type
      const criticalTypes = [
        'hemorrhage',
        'pneumothorax',
        'aortic dissection',
        'pulmonary embolism',
        'acute infarction',
        'fracture with displacement'
      ];

      return criticalTypes.some(type => 
        anomaly.type.toLowerCase().includes(type.toLowerCase())
      );
    });
  }

  /**
   * Determine if analysis requires human review
   */
  requiresHumanReview(analysis: VisionAnalysisResult): boolean {
    // Low confidence requires review
    if (analysis.confidence < config.model.confidenceThreshold) {
      return true;
    }

    // Critical findings always require review
    const criticalFindings = this.identifyCriticalFindings(analysis);
    if (criticalFindings.length > 0) {
      return true;
    }

    // Complex cases with multiple anomalies require review
    if (analysis.anomalies.length >= 3) {
      return true;
    }

    return false;
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(analysis: VisionAnalysisResult): string[] {
    const recommendations: string[] = [];

    // Check for critical findings
    const criticalFindings = this.identifyCriticalFindings(analysis);
    if (criticalFindings.length > 0) {
      recommendations.push('Immediate clinical correlation recommended');
      recommendations.push('Consider urgent specialist consultation');
    }

    // Modality-specific recommendations
    if (analysis.modality === 'X-ray' && analysis.anomalies.length > 0) {
      recommendations.push('Consider CT scan for further evaluation');
    }

    if (analysis.modality === 'CT' && 
        analysis.anomalies.some(a => a.type.includes('mass'))) {
      recommendations.push('Consider MRI for better soft tissue characterization');
      recommendations.push('Biopsy may be indicated for tissue diagnosis');
    }

    // Low confidence recommendations
    if (analysis.confidence < config.model.confidenceThreshold) {
      recommendations.push('Radiologist review recommended due to low confidence');
    }

    // Follow-up recommendations
    if (analysis.anomalies.some(a => a.severity === 'minor')) {
      recommendations.push('Follow-up imaging in 3-6 months');
    }

    return recommendations;
  }
}

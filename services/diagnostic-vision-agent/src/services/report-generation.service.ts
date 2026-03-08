import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config';
import { VisionAnalysisResult, RadiologyReport, CriticalFinding, ImageModality } from '../types';

export class ReportGenerationService {
  private bedrockClient: BedrockRuntimeClient;

  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({
      region: config.aws.region,
      credentials: config.aws.accessKeyId && config.aws.secretAccessKey ? {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey
      } : undefined
    });
  }

  /**
   * Generate comprehensive radiology report from vision analysis
   */
  async generateReport(
    imageId: string,
    patientId: string,
    analysis: VisionAnalysisResult,
    clinicalContext?: any,
    encounterId?: string
  ): Promise<RadiologyReport> {
    try {
      // Generate report sections using LLM
      const reportSections = await this.generateReportSections(analysis, clinicalContext);

      // Identify critical findings
      const criticalFindings = this.identifyCriticalFindings(analysis);

      // Determine report status
      const status = this.determineReportStatus(analysis, criticalFindings);

      const report: RadiologyReport = {
        reportId: this.generateReportId(),
        imageId,
        patientId,
        encounterId,
        modality: analysis.modality,
        bodyPart: this.extractBodyPart(imageId),
        studyDate: new Date(),
        
        // Report sections
        clinicalIndication: reportSections.clinicalIndication,
        technique: reportSections.technique,
        findings: reportSections.findings,
        impression: reportSections.impression,
        recommendations: reportSections.recommendations,
        
        // AI-generated content
        aiGeneratedFindings: analysis.findings,
        aiConfidence: analysis.confidence,
        criticalFindings,
        
        // Status
        status,
        draftGeneratedAt: new Date(),
        
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate radiology report');
    }
  }

  /**
   * Generate report sections using LLM
   */
  private async generateReportSections(
    analysis: VisionAnalysisResult,
    clinicalContext?: any
  ): Promise<{
    clinicalIndication: string;
    technique: string;
    findings: string;
    impression: string;
    recommendations: string[];
  }> {
    const prompt = this.buildReportPrompt(analysis, clinicalContext);

    try {
      const command = new InvokeModelCommand({
        modelId: config.bedrock.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 2000,
          temperature: 0.1,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const reportText = responseBody.content[0].text;

      return this.parseReportSections(reportText);
    } catch (error) {
      console.error('Error calling Bedrock:', error);
      // Fallback to template-based report
      return this.generateTemplateReport(analysis, clinicalContext);
    }
  }

  /**
   * Build prompt for report generation
   */
  private buildReportPrompt(analysis: VisionAnalysisResult, clinicalContext?: any): string {
    let prompt = `You are an expert radiologist. Generate a professional radiology report based on the following AI analysis of a ${analysis.modality} image.\n\n`;

    if (clinicalContext) {
      prompt += 'CLINICAL CONTEXT:\n';
      if (clinicalContext.patientAge) {
        prompt += `- Patient Age: ${clinicalContext.patientAge} years\n`;
      }
      if (clinicalContext.patientGender) {
        prompt += `- Gender: ${clinicalContext.patientGender}\n`;
      }
      if (clinicalContext.symptoms) {
        prompt += `- Symptoms: ${clinicalContext.symptoms.join(', ')}\n`;
      }
      if (clinicalContext.clinicalQuestion) {
        prompt += `- Clinical Question: ${clinicalContext.clinicalQuestion}\n`;
      }
      prompt += '\n';
    }

    prompt += 'AI ANALYSIS RESULTS:\n';
    prompt += `- Modality: ${analysis.modality}\n`;
    prompt += `- AI Confidence: ${(analysis.confidence * 100).toFixed(1)}%\n\n`;

    if (analysis.findings.length > 0) {
      prompt += 'Findings:\n';
      analysis.findings.forEach(f => prompt += `- ${f}\n`);
      prompt += '\n';
    }

    if (analysis.anomalies.length > 0) {
      prompt += 'Detected Anomalies:\n';
      analysis.anomalies.forEach(a => {
        prompt += `- ${a.type} at ${a.location} (${a.severity}, confidence: ${(a.confidence * 100).toFixed(1)}%)\n`;
        prompt += `  ${a.description}\n`;
      });
      prompt += '\n';
    }

    if (analysis.normalFindings.length > 0) {
      prompt += 'Normal Findings:\n';
      analysis.normalFindings.forEach(f => prompt += `- ${f}\n`);
      prompt += '\n';
    }

    prompt += `Please generate a structured radiology report with the following sections:

1. CLINICAL INDICATION: Brief statement of why the study was ordered
2. TECHNIQUE: Description of the imaging technique used
3. FINDINGS: Detailed description of all findings (both normal and abnormal)
4. IMPRESSION: Concise summary and interpretation
5. RECOMMENDATIONS: Suggested follow-up or additional studies

Format your response as JSON with these exact keys: clinicalIndication, technique, findings, impression, recommendations (array).

Important guidelines:
- Use professional medical terminology
- Be precise and objective
- Highlight critical findings
- Provide actionable recommendations
- Maintain appropriate clinical tone`;

    return prompt;
  }

  /**
   * Parse report sections from LLM response
   */
  private parseReportSections(reportText: string): any {
    try {
      // Try to extract JSON from response
      const jsonMatch = reportText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          clinicalIndication: parsed.clinicalIndication || '',
          technique: parsed.technique || '',
          findings: parsed.findings || '',
          impression: parsed.impression || '',
          recommendations: Array.isArray(parsed.recommendations) 
            ? parsed.recommendations 
            : [parsed.recommendations || '']
        };
      }

      // Fallback: parse structured text
      return this.parseStructuredText(reportText);
    } catch (error) {
      console.error('Error parsing report sections:', error);
      return {
        clinicalIndication: 'Not specified',
        technique: 'Standard imaging protocol',
        findings: reportText,
        impression: 'See findings above',
        recommendations: ['Clinical correlation recommended']
      };
    }
  }

  /**
   * Parse structured text format
   */
  private parseStructuredText(text: string): any {
    const sections = {
      clinicalIndication: '',
      technique: '',
      findings: '',
      impression: '',
      recommendations: [] as string[]
    };

    const lines = text.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.match(/^CLINICAL INDICATION:/i)) {
        currentSection = 'clinicalIndication';
        sections.clinicalIndication = trimmed.replace(/^CLINICAL INDICATION:/i, '').trim();
      } else if (trimmed.match(/^TECHNIQUE:/i)) {
        currentSection = 'technique';
        sections.technique = trimmed.replace(/^TECHNIQUE:/i, '').trim();
      } else if (trimmed.match(/^FINDINGS:/i)) {
        currentSection = 'findings';
        sections.findings = trimmed.replace(/^FINDINGS:/i, '').trim();
      } else if (trimmed.match(/^IMPRESSION:/i)) {
        currentSection = 'impression';
        sections.impression = trimmed.replace(/^IMPRESSION:/i, '').trim();
      } else if (trimmed.match(/^RECOMMENDATIONS:/i)) {
        currentSection = 'recommendations';
      } else if (trimmed && currentSection) {
        if (currentSection === 'recommendations') {
          sections.recommendations.push(trimmed.replace(/^[-•]\s*/, ''));
        } else {
          sections[currentSection as keyof typeof sections] += ' ' + trimmed;
        }
      }
    }

    return sections;
  }

  /**
   * Generate template-based report (fallback)
   */
  private generateTemplateReport(analysis: VisionAnalysisResult, clinicalContext?: any): any {
    const clinicalIndication = clinicalContext?.clinicalQuestion || 
      `Evaluation of ${analysis.modality} findings`;

    const technique = this.getTechniqueDescription(analysis.modality);

    let findings = '';
    if (analysis.normalFindings.length > 0) {
      findings += analysis.normalFindings.join('. ') + '. ';
    }
    if (analysis.findings.length > 0) {
      findings += analysis.findings.join('. ') + '. ';
    }
    if (analysis.anomalies.length > 0) {
      findings += analysis.anomalies.map(a => 
        `${a.type} identified at ${a.location} (${a.severity})`
      ).join('. ') + '.';
    }

    const impression = this.generateImpression(analysis);

    const recommendations = this.generateRecommendations(analysis);

    return {
      clinicalIndication,
      technique,
      findings: findings || 'No significant abnormalities detected.',
      impression,
      recommendations
    };
  }

  /**
   * Get technique description for modality
   */
  private getTechniqueDescription(modality: ImageModality): string {
    const techniques: Record<string, string> = {
      'X-ray': 'Standard radiographic imaging performed',
      'CT': 'Computed tomography performed with standard protocol',
      'MRI': 'Magnetic resonance imaging performed with standard sequences',
      'Ultrasound': 'Ultrasound examination performed with standard technique',
      'Mammography': 'Digital mammography performed with standard views',
      'PET': 'PET imaging performed with standard protocol',
      'Nuclear Medicine': 'Nuclear medicine study performed per protocol'
    };

    return techniques[modality] || 'Standard imaging protocol performed';
  }

  /**
   * Generate impression from analysis
   */
  private generateImpression(analysis: VisionAnalysisResult): string {
    if (analysis.anomalies.length === 0) {
      return 'No acute abnormalities identified.';
    }

    const criticalAnomalies = analysis.anomalies.filter(a => a.severity === 'critical');
    const moderateAnomalies = analysis.anomalies.filter(a => a.severity === 'moderate');

    let impression = '';

    if (criticalAnomalies.length > 0) {
      impression += `Critical findings: ${criticalAnomalies.map(a => a.type).join(', ')}. `;
    }

    if (moderateAnomalies.length > 0) {
      impression += `Additional findings: ${moderateAnomalies.map(a => a.type).join(', ')}. `;
    }

    impression += 'Clinical correlation recommended.';

    return impression;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(analysis: VisionAnalysisResult): string[] {
    const recommendations: string[] = [];

    const criticalAnomalies = analysis.anomalies.filter(a => a.severity === 'critical');
    if (criticalAnomalies.length > 0) {
      recommendations.push('Immediate clinical correlation and specialist consultation recommended');
    }

    if (analysis.confidence < config.model.confidenceThreshold) {
      recommendations.push('Radiologist review recommended for confirmation');
    }

    if (analysis.anomalies.some(a => a.type.includes('mass') || a.type.includes('lesion'))) {
      recommendations.push('Consider additional imaging or biopsy for further characterization');
    }

    if (recommendations.length === 0) {
      recommendations.push('Routine follow-up as clinically indicated');
    }

    return recommendations;
  }

  /**
   * Identify critical findings
   */
  private identifyCriticalFindings(analysis: VisionAnalysisResult): CriticalFinding[] {
    return analysis.anomalies
      .filter(a => a.severity === 'critical' || 
                   (a.confidence >= config.model.criticalFindingThreshold && a.severity === 'moderate'))
      .map(a => ({
        finding: `${a.type} at ${a.location}`,
        severity: a.severity === 'critical' ? 'critical' : 'urgent',
        confidence: a.confidence,
        requiresImmediateAction: a.severity === 'critical',
        suggestedActions: this.getSuggestedActions(a.type, a.severity),
        flaggedAt: new Date()
      }));
  }

  /**
   * Get suggested actions for critical findings
   */
  private getSuggestedActions(anomalyType: string, severity: string): string[] {
    const actionMap: Record<string, string[]> = {
      'hemorrhage': [
        'Immediate neurosurgical consultation',
        'Monitor vital signs',
        'Prepare for possible intervention'
      ],
      'pneumothorax': [
        'Immediate thoracic surgery consultation',
        'Consider chest tube placement',
        'Monitor respiratory status'
      ],
      'fracture': [
        'Orthopedic consultation',
        'Immobilize affected area',
        'Pain management'
      ],
      'mass': [
        'Oncology consultation',
        'Consider biopsy',
        'Additional imaging studies'
      ]
    };

    return actionMap[anomalyType.toLowerCase()] || [
      'Clinical correlation recommended',
      'Specialist consultation as appropriate'
    ];
  }

  /**
   * Determine report status
   */
  private determineReportStatus(
    analysis: VisionAnalysisResult,
    criticalFindings: CriticalFinding[]
  ): 'draft' | 'ai_completed' | 'under_review' | 'verified' | 'finalized' {
    // Critical findings always require review
    if (criticalFindings.length > 0) {
      return 'under_review';
    }

    // Low confidence requires review
    if (analysis.confidence < config.model.confidenceThreshold) {
      return 'under_review';
    }

    // High confidence can be marked as AI completed
    if (analysis.confidence >= 0.85) {
      return 'ai_completed';
    }

    return 'draft';
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `RPT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Extract body part from image ID (placeholder)
   */
  private extractBodyPart(imageId: string): string {
    // This would be extracted from metadata in real implementation
    return 'unspecified';
  }
}

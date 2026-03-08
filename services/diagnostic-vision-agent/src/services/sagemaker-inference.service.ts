import { SageMakerRuntimeClient, InvokeEndpointCommand } from '@aws-sdk/client-sagemaker-runtime';
import { config } from '../config';
import { VisionModelInput, VisionAnalysisResult, AnomalyDetection, SegmentationResult } from '../types';

export class SageMakerInferenceService {
  private sagemakerClient: SageMakerRuntimeClient;

  constructor() {
    this.sagemakerClient = new SageMakerRuntimeClient({
      region: config.aws.region,
      credentials: config.aws.accessKeyId && config.aws.secretAccessKey ? {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey
      } : undefined
    });
  }

  /**
   * Invoke LLaVA model for general medical image understanding
   */
  async invokeLLaVA(input: VisionModelInput): Promise<any> {
    try {
      const payload = {
        image_url: input.imageUrl,
        prompt: this.buildLLaVAPrompt(input),
        max_tokens: 512,
        temperature: 0.1
      };

      const command = new InvokeEndpointCommand({
        EndpointName: config.sagemaker.llavaEndpoint,
        ContentType: 'application/json',
        Body: JSON.stringify(payload)
      });

      const response = await this.sagemakerClient.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.Body));

      return result;
    } catch (error) {
      console.error('Error invoking LLaVA model:', error);
      throw new Error('Failed to invoke LLaVA model');
    }
  }

  /**
   * Invoke BiomedCLIP for medical image classification
   */
  async invokeBiomedCLIP(input: VisionModelInput): Promise<any> {
    try {
      const payload = {
        image_url: input.imageUrl,
        modality: input.modality,
        body_part: input.bodyPart,
        candidate_labels: this.getCandidateLabels(input.modality)
      };

      const command = new InvokeEndpointCommand({
        EndpointName: config.sagemaker.biomedclipEndpoint,
        ContentType: 'application/json',
        Body: JSON.stringify(payload)
      });

      const response = await this.sagemakerClient.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.Body));

      return result;
    } catch (error) {
      console.error('Error invoking BiomedCLIP model:', error);
      throw new Error('Failed to invoke BiomedCLIP model');
    }
  }

  /**
   * Invoke MedSAM for medical image segmentation
   */
  async invokeMedSAM(imageUrl: string, promptPoints?: number[][]): Promise<any> {
    try {
      const payload = {
        image_url: imageUrl,
        prompt_points: promptPoints || [],
        return_mask: true
      };

      const command = new InvokeEndpointCommand({
        EndpointName: config.sagemaker.medsamEndpoint,
        ContentType: 'application/json',
        Body: JSON.stringify(payload)
      });

      const response = await this.sagemakerClient.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.Body));

      return result;
    } catch (error) {
      console.error('Error invoking MedSAM model:', error);
      throw new Error('Failed to invoke MedSAM model');
    }
  }

  /**
   * Build prompt for LLaVA model
   */
  private buildLLaVAPrompt(input: VisionModelInput): string {
    let prompt = `You are an expert radiologist analyzing a ${input.modality} image of the ${input.bodyPart}.\n\n`;

    if (input.clinicalContext) {
      prompt += 'Clinical Context:\n';
      
      if (input.clinicalContext.patientAge) {
        prompt += `- Patient Age: ${input.clinicalContext.patientAge} years\n`;
      }
      
      if (input.clinicalContext.patientGender) {
        prompt += `- Gender: ${input.clinicalContext.patientGender}\n`;
      }
      
      if (input.clinicalContext.symptoms && input.clinicalContext.symptoms.length > 0) {
        prompt += `- Symptoms: ${input.clinicalContext.symptoms.join(', ')}\n`;
      }
      
      if (input.clinicalContext.medicalHistory && input.clinicalContext.medicalHistory.length > 0) {
        prompt += `- Medical History: ${input.clinicalContext.medicalHistory.join(', ')}\n`;
      }
      
      if (input.clinicalContext.clinicalQuestion) {
        prompt += `- Clinical Question: ${input.clinicalContext.clinicalQuestion}\n`;
      }
      
      prompt += '\n';
    }

    prompt += `Please analyze this medical image and provide:
1. Detailed findings (normal and abnormal)
2. Any anomalies detected with their locations
3. Severity assessment (critical, moderate, minor)
4. Confidence level for each finding
5. Recommendations for further evaluation if needed

Format your response as structured JSON with the following fields:
- findings: array of finding descriptions
- anomalies: array of {type, location, severity, confidence, description}
- normalFindings: array of normal finding descriptions
- overallConfidence: number between 0 and 1
- recommendations: array of recommendation strings`;

    return prompt;
  }

  /**
   * Get candidate labels for BiomedCLIP based on modality
   */
  private getCandidateLabels(modality: string): string[] {
    const commonLabels = [
      'normal',
      'abnormal',
      'fracture',
      'mass',
      'lesion',
      'inflammation',
      'infection'
    ];

    const modalitySpecificLabels: Record<string, string[]> = {
      'X-ray': [
        'pneumonia',
        'pleural effusion',
        'cardiomegaly',
        'atelectasis',
        'consolidation',
        'pneumothorax',
        'bone fracture',
        'dislocation'
      ],
      'CT': [
        'tumor',
        'hemorrhage',
        'infarction',
        'abscess',
        'lymphadenopathy',
        'calcification',
        'cyst'
      ],
      'MRI': [
        'tumor',
        'edema',
        'hemorrhage',
        'infarction',
        'demyelination',
        'herniation',
        'stenosis'
      ],
      'Ultrasound': [
        'cyst',
        'solid mass',
        'fluid collection',
        'calculus',
        'thickening',
        'dilation'
      ],
      'Mammography': [
        'mass',
        'calcifications',
        'architectural distortion',
        'asymmetry',
        'benign',
        'malignant'
      ]
    };

    return [
      ...commonLabels,
      ...(modalitySpecificLabels[modality] || [])
    ];
  }

  /**
   * Parse LLaVA response into structured format
   */
  parseLLaVAResponse(response: any): Partial<VisionAnalysisResult> {
    try {
      // Extract JSON from response text if needed
      let parsedData = response;
      
      if (typeof response === 'string') {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[1]);
        } else {
          parsedData = JSON.parse(response);
        }
      }

      const anomalies: AnomalyDetection[] = (parsedData.anomalies || []).map((a: any) => ({
        type: a.type || 'unknown',
        location: a.location || 'unspecified',
        confidence: a.confidence || 0,
        severity: a.severity || 'minor',
        description: a.description || ''
      }));

      return {
        findings: parsedData.findings || [],
        anomalies,
        normalFindings: parsedData.normalFindings || [],
        confidence: parsedData.overallConfidence || 0
      };
    } catch (error) {
      console.error('Error parsing LLaVA response:', error);
      return {
        findings: [],
        anomalies: [],
        normalFindings: [],
        confidence: 0
      };
    }
  }

  /**
   * Parse BiomedCLIP response
   */
  parseBiomedCLIPResponse(response: any): string[] {
    try {
      // Extract top predictions
      const predictions = response.predictions || [];
      return predictions
        .filter((p: any) => p.confidence > 0.5)
        .map((p: any) => p.label);
    } catch (error) {
      console.error('Error parsing BiomedCLIP response:', error);
      return [];
    }
  }

  /**
   * Parse MedSAM response
   */
  parseMedSAMResponse(response: any): SegmentationResult | null {
    try {
      if (!response.mask_url) {
        return null;
      }

      return {
        segmentationType: response.segmentation_type || 'general',
        maskUrl: response.mask_url,
        area: response.area || 0,
        volume: response.volume,
        confidence: response.confidence || 0
      };
    } catch (error) {
      console.error('Error parsing MedSAM response:', error);
      return null;
    }
  }

  /**
   * Check if model endpoint is available
   */
  async checkEndpointHealth(endpointName: string): Promise<boolean> {
    try {
      const command = new InvokeEndpointCommand({
        EndpointName: endpointName,
        ContentType: 'application/json',
        Body: JSON.stringify({ health_check: true })
      });

      await this.sagemakerClient.send(command);
      return true;
    } catch (error) {
      console.error(`Endpoint ${endpointName} health check failed:`, error);
      return false;
    }
  }
}

import * as ort from 'onnxruntime-node';
import * as fs from 'fs';
import { config } from '../config';
import { InferenceRequest, InferenceResponse, EdgeModel } from '../types';
import { logger } from '../utils/logger';

export class InferenceEngineService {
  private triageSession: ort.InferenceSession | null = null;
  private documentationSession: ort.InferenceSession | null = null;
  private modelCache: Map<string, ort.InferenceSession> = new Map();

  constructor() {
    this.initializeModels();
  }

  /**
   * Initialize ONNX models for offline inference
   */
  private async initializeModels(): Promise<void> {
    try {
      logger.info('Initializing inference models...');

      // Load triage model
      if (fs.existsSync(config.models.triageModelPath)) {
        logger.info(`Loading triage model from ${config.models.triageModelPath}`);
        this.triageSession = await ort.InferenceSession.create(config.models.triageModelPath, {
          executionProviders: ['cpu'],
          graphOptimizationLevel: 'all',
        });
        logger.info('Triage model loaded successfully');
      } else {
        logger.warn(`Triage model not found at ${config.models.triageModelPath}`);
      }

      // Load documentation model
      if (fs.existsSync(config.models.documentationModelPath)) {
        logger.info(`Loading documentation model from ${config.models.documentationModelPath}`);
        this.documentationSession = await ort.InferenceSession.create(
          config.models.documentationModelPath,
          {
            executionProviders: ['cpu'],
            graphOptimizationLevel: 'all',
          }
        );
        logger.info('Documentation model loaded successfully');
      } else {
        logger.warn(`Documentation model not found at ${config.models.documentationModelPath}`);
      }

      logger.info('Inference engine initialized');
    } catch (error) {
      logger.error('Failed to initialize inference models:', error);
      throw error;
    }
  }

  /**
   * Run triage inference on patient symptoms
   */
  async runTriageInference(request: InferenceRequest): Promise<InferenceResponse> {
    const startTime = Date.now();

    try {
      if (!this.triageSession) {
        throw new Error('Triage model not loaded');
      }

      logger.info(`Running triage inference for request ${request.requestId}`);

      // Prepare input tensor
      const inputTensor = this.prepareTriageInput(request.input);

      // Run inference
      const results = await this.triageSession.run({
        input: inputTensor,
      });

      // Process output
      const output = this.processTriageOutput(results);
      const processingTimeMs = Date.now() - startTime;

      logger.info(`Triage inference completed in ${processingTimeMs}ms`);

      return {
        requestId: request.requestId,
        modelType: 'triage',
        output,
        confidence: output.confidence || 0.85,
        processingTimeMs,
        timestamp: new Date(),
        offline: request.offline,
      };
    } catch (error) {
      logger.error('Triage inference failed:', error);
      throw error;
    }
  }

  /**
   * Run documentation inference for clinical notes
   */
  async runDocumentationInference(request: InferenceRequest): Promise<InferenceResponse> {
    const startTime = Date.now();

    try {
      if (!this.documentationSession) {
        throw new Error('Documentation model not loaded');
      }

      logger.info(`Running documentation inference for request ${request.requestId}`);

      // Prepare input tensor
      const inputTensor = this.prepareDocumentationInput(request.input);

      // Run inference
      const results = await this.documentationSession.run({
        input: inputTensor,
      });

      // Process output
      const output = this.processDocumentationOutput(results);
      const processingTimeMs = Date.now() - startTime;

      logger.info(`Documentation inference completed in ${processingTimeMs}ms`);

      return {
        requestId: request.requestId,
        modelType: 'documentation',
        output,
        confidence: output.confidence || 0.80,
        processingTimeMs,
        timestamp: new Date(),
        offline: request.offline,
      };
    } catch (error) {
      logger.error('Documentation inference failed:', error);
      throw error;
    }
  }

  /**
   * Prepare triage input tensor from patient data
   */
  private prepareTriageInput(input: any): ort.Tensor {
    // Extract features from input
    const features = [
      input.age || 0,
      input.gender === 'male' ? 1 : 0,
      input.temperature || 98.6,
      input.bloodPressureSystolic || 120,
      input.bloodPressureDiastolic || 80,
      input.heartRate || 70,
      input.respiratoryRate || 16,
      input.spo2 || 98,
      // Symptom encoding (simplified)
      input.symptoms?.includes('chest_pain') ? 1 : 0,
      input.symptoms?.includes('shortness_of_breath') ? 1 : 0,
      input.symptoms?.includes('fever') ? 1 : 0,
      input.symptoms?.includes('headache') ? 1 : 0,
      // Medical history flags
      input.medicalHistory?.includes('diabetes') ? 1 : 0,
      input.medicalHistory?.includes('hypertension') ? 1 : 0,
      input.medicalHistory?.includes('heart_disease') ? 1 : 0,
    ];

    // Create tensor (shape: [1, features.length])
    const tensorData = new Float32Array(features);
    return new ort.Tensor('float32', tensorData, [1, features.length]);
  }

  /**
   * Process triage output tensor
   */
  private processTriageOutput(results: ort.InferenceSession.OnnxValueMapType): any {
    const outputTensor = results.output as ort.Tensor;
    const data = outputTensor.data as Float32Array;

    // Assuming output is [urgency_score, confidence]
    const urgencyScore = Math.round(data[0] * 100); // Scale to 0-100
    const confidence = data[1] || 0.85;

    // Determine urgency level
    let urgencyLevel: 'CRITICAL' | 'URGENT' | 'ROUTINE';
    if (urgencyScore >= 70) urgencyLevel = 'CRITICAL';
    else if (urgencyScore >= 40) urgencyLevel = 'URGENT';
    else urgencyLevel = 'ROUTINE';

    return {
      urgencyScore,
      urgencyLevel,
      confidence,
      recommendation: this.getTriageRecommendation(urgencyLevel),
    };
  }

  /**
   * Prepare documentation input tensor from conversation
   */
  private prepareDocumentationInput(input: any): ort.Tensor {
    // Simplified tokenization (in production, use proper tokenizer)
    const text = input.conversation || '';
    const tokens = this.simpleTokenize(text);
    
    // Pad or truncate to fixed length (e.g., 512 tokens)
    const maxLength = 512;
    const paddedTokens = new Float32Array(maxLength);
    for (let i = 0; i < Math.min(tokens.length, maxLength); i++) {
      paddedTokens[i] = tokens[i];
    }

    return new ort.Tensor('float32', paddedTokens, [1, maxLength]);
  }

  /**
   * Process documentation output tensor
   */
  private processDocumentationOutput(results: ort.InferenceSession.OnnxValueMapType): any {
    const outputTensor = results.output as ort.Tensor;
    const data = outputTensor.data as Float32Array;

    // Simplified output processing
    // In production, this would decode tokens back to text
    return {
      soapNote: {
        subjective: 'Patient reports symptoms...',
        objective: 'Vital signs recorded...',
        assessment: 'Clinical assessment...',
        plan: 'Treatment plan...',
      },
      confidence: 0.80,
      extractedFacts: [],
    };
  }

  /**
   * Simple tokenization (placeholder for production tokenizer)
   */
  private simpleTokenize(text: string): number[] {
    // This is a simplified tokenizer
    // In production, use a proper tokenizer like tiktoken or sentencepiece
    return text.split(' ').map((word) => word.charCodeAt(0) % 1000);
  }

  /**
   * Get triage recommendation based on urgency level
   */
  private getTriageRecommendation(urgencyLevel: string): string {
    switch (urgencyLevel) {
      case 'CRITICAL':
        return 'Immediate Emergency Department evaluation required';
      case 'URGENT':
        return 'OPD appointment recommended within 24 hours';
      case 'ROUTINE':
        return 'Schedule routine OPD appointment';
      default:
        return 'Consult with healthcare provider';
    }
  }

  /**
   * Load a custom model
   */
  async loadModel(modelPath: string, modelId: string): Promise<void> {
    try {
      logger.info(`Loading custom model ${modelId} from ${modelPath}`);
      const session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ['cpu'],
        graphOptimizationLevel: 'all',
      });
      this.modelCache.set(modelId, session);
      logger.info(`Custom model ${modelId} loaded successfully`);
    } catch (error) {
      logger.error(`Failed to load custom model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Unload a model to free memory
   */
  async unloadModel(modelId: string): Promise<void> {
    if (this.modelCache.has(modelId)) {
      this.modelCache.delete(modelId);
      logger.info(`Model ${modelId} unloaded`);
    }
  }

  /**
   * Get model information
   */
  getModelInfo(modelType: 'triage' | 'documentation'): any {
    const session = modelType === 'triage' ? this.triageSession : this.documentationSession;
    
    if (!session) {
      return null;
    }

    return {
      inputNames: session.inputNames,
      outputNames: session.outputNames,
      loaded: true,
    };
  }

  /**
   * Check if models are ready
   */
  isReady(): boolean {
    return this.triageSession !== null || this.documentationSession !== null;
  }
}

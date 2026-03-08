import AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { config } from '../config';
import { EdgeModel, ModelDeployment } from '../types';
import { logger } from '../utils/logger';

export class ModelDeploymentService {
  private s3: AWS.S3;
  private modelBucket: string;

  constructor() {
    AWS.config.update({ region: config.aws.region });
    this.s3 = new AWS.S3();
    this.modelBucket = `medhaos-edge-models-${config.aws.region}`;
  }

  /**
   * Deploy model to S3 for edge devices to download
   */
  async deployModelToS3(modelId: string, localPath: string): Promise<EdgeModel> {
    try {
      logger.info(`Deploying model ${modelId} to S3...`);

      // Read model file
      if (!fs.existsSync(localPath)) {
        throw new Error(`Model file not found: ${localPath}`);
      }

      const modelBuffer = fs.readFileSync(localPath);
      const fileSize = modelBuffer.length;
      const checksum = this.calculateChecksum(modelBuffer);

      // Upload to S3
      const s3Key = `models/${modelId}/${path.basename(localPath)}`;
      await this.s3
        .putObject({
          Bucket: this.modelBucket,
          Key: s3Key,
          Body: modelBuffer,
          ContentType: 'application/octet-stream',
          Metadata: {
            modelId,
            checksum,
            deployedAt: new Date().toISOString(),
          },
        })
        .promise();

      logger.info(`Model uploaded to S3: s3://${this.modelBucket}/${s3Key}`);

      const model: EdgeModel = {
        modelId,
        modelName: path.basename(localPath, path.extname(localPath)),
        modelType: this.inferModelType(localPath),
        version: '1.0.0',
        format: this.inferModelFormat(localPath),
        filePath: s3Key,
        fileSize,
        checksum,
        deployedAt: new Date(),
      };

      return model;
    } catch (error) {
      logger.error('Failed to deploy model to S3:', error);
      throw error;
    }
  }

  /**
   * Download model from S3 to edge device
   */
  async downloadModelFromS3(modelId: string, s3Key: string, localPath: string): Promise<void> {
    try {
      logger.info(`Downloading model ${modelId} from S3...`);

      const response = await this.s3
        .getObject({
          Bucket: this.modelBucket,
          Key: s3Key,
        })
        .promise();

      // Ensure directory exists
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write model file
      fs.writeFileSync(localPath, response.Body as Buffer);

      logger.info(`Model downloaded to: ${localPath}`);
    } catch (error) {
      logger.error('Failed to download model from S3:', error);
      throw error;
    }
  }

  /**
   * Get model metadata from S3
   */
  async getModelMetadata(modelId: string, s3Key: string): Promise<any> {
    try {
      const response = await this.s3
        .headObject({
          Bucket: this.modelBucket,
          Key: s3Key,
        })
        .promise();

      return response.Metadata;
    } catch (error) {
      logger.error('Failed to get model metadata:', error);
      throw error;
    }
  }

  /**
   * List available models in S3
   */
  async listAvailableModels(): Promise<EdgeModel[]> {
    try {
      const response = await this.s3
        .listObjectsV2({
          Bucket: this.modelBucket,
          Prefix: 'models/',
        })
        .promise();

      const models: EdgeModel[] = [];

      for (const obj of response.Contents || []) {
        if (obj.Key && obj.Size) {
          const metadata = await this.getModelMetadata('', obj.Key);
          models.push({
            modelId: metadata.modelId || 'unknown',
            modelName: path.basename(obj.Key, path.extname(obj.Key)),
            modelType: this.inferModelType(obj.Key),
            version: '1.0.0',
            format: this.inferModelFormat(obj.Key),
            filePath: obj.Key,
            fileSize: obj.Size,
            checksum: metadata.checksum || '',
            deployedAt: obj.LastModified || new Date(),
          });
        }
      }

      return models;
    } catch (error) {
      logger.error('Failed to list available models:', error);
      throw error;
    }
  }

  /**
   * Verify model integrity using checksum
   */
  verifyModelIntegrity(modelPath: string, expectedChecksum: string): boolean {
    try {
      const modelBuffer = fs.readFileSync(modelPath);
      const actualChecksum = this.calculateChecksum(modelBuffer);
      return actualChecksum === expectedChecksum;
    } catch (error) {
      logger.error('Failed to verify model integrity:', error);
      return false;
    }
  }

  /**
   * Calculate SHA-256 checksum of model file
   */
  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Infer model type from file path
   */
  private inferModelType(filePath: string): 'triage' | 'documentation' | 'nlp' {
    const fileName = path.basename(filePath).toLowerCase();
    if (fileName.includes('triage')) return 'triage';
    if (fileName.includes('documentation') || fileName.includes('doc')) return 'documentation';
    return 'nlp';
  }

  /**
   * Infer model format from file extension
   */
  private inferModelFormat(filePath: string): 'onnx' | 'tflite' | 'pytorch' {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.onnx') return 'onnx';
    if (ext === '.tflite') return 'tflite';
    if (ext === '.pt' || ext === '.pth') return 'pytorch';
    return 'onnx'; // default
  }
}

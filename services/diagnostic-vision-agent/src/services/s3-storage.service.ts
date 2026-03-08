import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { S3UploadResult } from '../types';
import { createHash } from 'crypto';

export class S3StorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: config.s3.bucketRegion,
      credentials: config.aws.accessKeyId && config.aws.secretAccessKey ? {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey
      } : undefined
    });
    this.bucketName = config.s3.bucketName;
  }

  /**
   * Upload medical image to S3
   */
  async uploadImage(
    buffer: Buffer,
    patientId: string,
    imageId: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<S3UploadResult> {
    try {
      const key = this.generateImageKey(patientId, imageId);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          ...metadata,
          patientId,
          imageId,
          uploadedAt: new Date().toISOString()
        },
        ServerSideEncryption: 'AES256',
        StorageClass: 'STANDARD_IA' // Infrequent Access for cost optimization
      });

      const response = await this.s3Client.send(command);

      return {
        key,
        url: `https://${this.bucketName}.s3.${config.s3.bucketRegion}.amazonaws.com/${key}`,
        bucket: this.bucketName,
        etag: response.ETag || ''
      };
    } catch (error) {
      console.error('Error uploading image to S3:', error);
      throw new Error('Failed to upload image to S3');
    }
  }

  /**
   * Upload thumbnail image to S3
   */
  async uploadThumbnail(
    buffer: Buffer,
    patientId: string,
    imageId: string,
    contentType: string
  ): Promise<S3UploadResult> {
    try {
      const key = this.generateThumbnailKey(patientId, imageId);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          patientId,
          imageId,
          type: 'thumbnail',
          uploadedAt: new Date().toISOString()
        },
        ServerSideEncryption: 'AES256',
        StorageClass: 'STANDARD'
      });

      const response = await this.s3Client.send(command);

      return {
        key,
        url: `https://${this.bucketName}.s3.${config.s3.bucketRegion}.amazonaws.com/${key}`,
        bucket: this.bucketName,
        etag: response.ETag || ''
      };
    } catch (error) {
      console.error('Error uploading thumbnail to S3:', error);
      throw new Error('Failed to upload thumbnail to S3');
    }
  }

  /**
   * Get presigned URL for secure image access
   */
  async getPresignedUrl(key: string, expiresIn?: number): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const url = await getSignedUrl(
        this.s3Client,
        command,
        { expiresIn: expiresIn || config.s3.presignedUrlExpiry }
      );

      return url;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  /**
   * Download image from S3
   */
  async downloadImage(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('No image data received');
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error downloading image from S3:', error);
      throw new Error('Failed to download image from S3');
    }
  }

  /**
   * Delete image from S3
   */
  async deleteImage(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error deleting image from S3:', error);
      throw new Error('Failed to delete image from S3');
    }
  }

  /**
   * Check if image exists in S3
   */
  async imageExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Generate S3 key for medical image
   */
  private generateImageKey(patientId: string, imageId: string): string {
    const hashedPatientId = this.hashPatientId(patientId);
    const date = new Date().toISOString().split('T')[0];
    return `medical-images/${hashedPatientId}/${date}/${imageId}.jpg`;
  }

  /**
   * Generate S3 key for thumbnail
   */
  private generateThumbnailKey(patientId: string, imageId: string): string {
    const hashedPatientId = this.hashPatientId(patientId);
    const date = new Date().toISOString().split('T')[0];
    return `medical-images/${hashedPatientId}/${date}/thumbnails/${imageId}_thumb.jpg`;
  }

  /**
   * Hash patient ID for privacy
   */
  private hashPatientId(patientId: string): string {
    return createHash('sha256').update(patientId).digest('hex').substring(0, 16);
  }

  /**
   * Get image metadata from S3
   */
  async getImageMetadata(key: string): Promise<Record<string, string>> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.s3Client.send(command);
      return response.Metadata || {};
    } catch (error) {
      console.error('Error getting image metadata:', error);
      throw new Error('Failed to get image metadata');
    }
  }
}

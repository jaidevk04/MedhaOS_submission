/**
 * AWS KMS Encryption Service
 * Handles encryption at rest using AWS KMS
 */

import {
  KMSClient,
  EncryptCommand,
  DecryptCommand,
  GenerateDataKeyCommand,
  CreateKeyCommand,
  DescribeKeyCommand,
  EnableKeyRotationCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import { securityConfig } from '../config';
import { EncryptedData, DecryptedData } from '../types';

export class KMSService {
  private client: KMSClient;
  private keyId: string;

  constructor() {
    this.client = new KMSClient({ region: securityConfig.aws.region });
    this.keyId = securityConfig.kms.keyId;
  }

  /**
   * Encrypt data using AWS KMS
   */
  async encrypt(plaintext: string): Promise<EncryptedData> {
    try {
      const command = new EncryptCommand({
        KeyId: this.keyId,
        Plaintext: Buffer.from(plaintext, 'utf-8'),
      });

      const response = await this.client.send(command);

      if (!response.CiphertextBlob) {
        throw new Error('Encryption failed: No ciphertext returned');
      }

      return {
        ciphertext: Buffer.from(response.CiphertextBlob).toString('base64'),
        iv: '', // KMS handles IV internally
        authTag: '', // KMS handles auth tag internally
        keyId: response.KeyId || this.keyId,
        algorithm: 'AWS_KMS',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('KMS encryption error:', error);
      throw new Error(`Failed to encrypt data: ${error}`);
    }
  }

  /**
   * Decrypt data using AWS KMS
   */
  async decrypt(encryptedData: EncryptedData): Promise<DecryptedData> {
    try {
      const command = new DecryptCommand({
        CiphertextBlob: Buffer.from(encryptedData.ciphertext, 'base64'),
        KeyId: encryptedData.keyId,
      });

      const response = await this.client.send(command);

      if (!response.Plaintext) {
        throw new Error('Decryption failed: No plaintext returned');
      }

      return {
        plaintext: Buffer.from(response.Plaintext).toString('utf-8'),
        keyId: response.KeyId || encryptedData.keyId,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('KMS decryption error:', error);
      throw new Error(`Failed to decrypt data: ${error}`);
    }
  }

  /**
   * Generate data key for envelope encryption
   */
  async generateDataKey(): Promise<{ plaintext: Buffer; ciphertext: Buffer }> {
    try {
      const command = new GenerateDataKeyCommand({
        KeyId: this.keyId,
        KeySpec: 'AES_256',
      });

      const response = await this.client.send(command);

      if (!response.Plaintext || !response.CiphertextBlob) {
        throw new Error('Failed to generate data key');
      }

      return {
        plaintext: Buffer.from(response.Plaintext),
        ciphertext: Buffer.from(response.CiphertextBlob),
      };
    } catch (error) {
      console.error('Generate data key error:', error);
      throw new Error(`Failed to generate data key: ${error}`);
    }
  }

  /**
   * Create a new KMS key
   */
  async createKey(description: string): Promise<string> {
    try {
      const command = new CreateKeyCommand({
        Description: description,
        KeyUsage: 'ENCRYPT_DECRYPT',
        Origin: 'AWS_KMS',
        MultiRegion: false,
      });

      const response = await this.client.send(command);

      if (!response.KeyMetadata?.KeyId) {
        throw new Error('Failed to create KMS key');
      }

      return response.KeyMetadata.KeyId;
    } catch (error) {
      console.error('Create KMS key error:', error);
      throw new Error(`Failed to create KMS key: ${error}`);
    }
  }

  /**
   * Enable automatic key rotation
   */
  async enableKeyRotation(): Promise<void> {
    try {
      const command = new EnableKeyRotationCommand({
        KeyId: this.keyId,
      });

      await this.client.send(command);
      console.log(`Key rotation enabled for key: ${this.keyId}`);
    } catch (error) {
      console.error('Enable key rotation error:', error);
      throw new Error(`Failed to enable key rotation: ${error}`);
    }
  }

  /**
   * Check key rotation status
   */
  async getKeyRotationStatus(): Promise<boolean> {
    try {
      const command = new GetKeyRotationStatusCommand({
        KeyId: this.keyId,
      });

      const response = await this.client.send(command);
      return response.KeyRotationEnabled || false;
    } catch (error) {
      console.error('Get key rotation status error:', error);
      throw new Error(`Failed to get key rotation status: ${error}`);
    }
  }

  /**
   * Get key metadata
   */
  async getKeyMetadata(): Promise<any> {
    try {
      const command = new DescribeKeyCommand({
        KeyId: this.keyId,
      });

      const response = await this.client.send(command);
      return response.KeyMetadata;
    } catch (error) {
      console.error('Get key metadata error:', error);
      throw new Error(`Failed to get key metadata: ${error}`);
    }
  }
}

export default new KMSService();

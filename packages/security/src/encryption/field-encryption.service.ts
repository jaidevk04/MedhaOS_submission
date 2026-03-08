/**
 * Field-Level Encryption Service
 * Encrypts specific fields in data objects for PII protection
 */

import * as crypto from 'crypto';
import kmsService from './kms.service';
import { FieldEncryptionOptions, EncryptedData } from '../types';
import { securityConfig } from '../config';

export class FieldEncryptionService {
  private algorithm: string;
  private keyLength: number;

  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
  }

  /**
   * Encrypt specific fields in an object
   */
  async encryptFields(data: any, options: FieldEncryptionOptions): Promise<any> {
    if (!securityConfig.encryption.fieldLevelEnabled) {
      return data;
    }

    const encryptedData = { ...data };
    const { plaintext: dataKey } = await kmsService.generateDataKey();

    for (const field of options.fields) {
      if (this.hasField(data, field)) {
        const value = this.getFieldValue(data, field);
        if (value !== null && value !== undefined) {
          const encrypted = this.encryptValue(value, dataKey);
          this.setFieldValue(encryptedData, field, encrypted);
        }
      }
    }

    return encryptedData;
  }

  /**
   * Decrypt specific fields in an object
   */
  async decryptFields(data: any, options: FieldEncryptionOptions): Promise<any> {
    if (!securityConfig.encryption.fieldLevelEnabled) {
      return data;
    }

    const decryptedData = { ...data };
    const { plaintext: dataKey } = await kmsService.generateDataKey();

    for (const field of options.fields) {
      if (this.hasField(data, field)) {
        const value = this.getFieldValue(data, field);
        if (value && typeof value === 'object' && value.encrypted) {
          const decrypted = this.decryptValue(value, dataKey);
          this.setFieldValue(decryptedData, field, decrypted);
        }
      }
    }

    return decryptedData;
  }

  /**
   * Encrypt a single value using AES-256-GCM
   */
  private encryptValue(value: any, key: Buffer): any {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    const plaintext = JSON.stringify(value);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
      encrypted: true,
      ciphertext: encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm: this.algorithm,
    };
  }

  /**
   * Decrypt a single value using AES-256-GCM
   */
  private decryptValue(encryptedValue: any, key: Buffer): any {
    const iv = Buffer.from(encryptedValue.iv, 'base64');
    const authTag = Buffer.from(encryptedValue.authTag, 'base64');
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedValue.ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  /**
   * Check if object has a field (supports nested paths)
   */
  private hasField(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return false;
      }
      current = current[key];
    }

    return true;
  }

  /**
   * Get field value (supports nested paths)
   */
  private getFieldValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Set field value (supports nested paths)
   */
  private setFieldValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Encrypt PII fields in patient data
   */
  async encryptPatientPII(patientData: any): Promise<any> {
    const piiFields = [
      'demographics.name',
      'demographics.contact.phone',
      'demographics.contact.email',
      'demographics.address',
      'abha_id',
      'medical_history',
      'allergies',
    ];

    return this.encryptFields(patientData, { fields: piiFields });
  }

  /**
   * Decrypt PII fields in patient data
   */
  async decryptPatientPII(patientData: any): Promise<any> {
    const piiFields = [
      'demographics.name',
      'demographics.contact.phone',
      'demographics.contact.email',
      'demographics.address',
      'abha_id',
      'medical_history',
      'allergies',
    ];

    return this.decryptFields(patientData, { fields: piiFields });
  }
}

export default new FieldEncryptionService();

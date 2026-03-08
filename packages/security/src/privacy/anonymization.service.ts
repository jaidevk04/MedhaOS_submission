/**
 * Data Anonymization Service
 * Anonymizes sensitive data for privacy protection
 */

import * as crypto from 'crypto';
import { AnonymizationConfig, AnonymizedData } from '../types';

export class AnonymizationService {
  /**
   * Anonymize data based on configuration
   */
  async anonymize(data: any, config: AnonymizationConfig): Promise<AnonymizedData> {
    const anonymized = { ...data };

    for (const field of config.fields) {
      if (this.hasField(data, field)) {
        const value = this.getFieldValue(data, field);
        if (value !== null && value !== undefined) {
          const anonymizedValue = await this.anonymizeValue(value, config.method, config);
          this.setFieldValue(anonymized, field, anonymizedValue);
        }
      }
    }

    return {
      original: data,
      anonymized,
      method: config.method,
      timestamp: new Date(),
      reversible: config.method === 'PSEUDONYMIZE',
    };
  }

  /**
   * Anonymize a single value
   */
  private async anonymizeValue(
    value: any,
    method: 'HASH' | 'MASK' | 'GENERALIZE' | 'SUPPRESS' | 'PSEUDONYMIZE',
    config: AnonymizationConfig
  ): Promise<any> {
    switch (method) {
      case 'HASH':
        return this.hashValue(value, config.salt);
      case 'MASK':
        return this.maskValue(value, config.preserveFormat);
      case 'GENERALIZE':
        return this.generalizeValue(value);
      case 'SUPPRESS':
        return null;
      case 'PSEUDONYMIZE':
        return this.pseudonymizeValue(value, config.salt);
      default:
        return value;
    }
  }

  /**
   * Hash value using SHA-256
   */
  private hashValue(value: any, salt?: string): string {
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    const saltedValue = salt ? `${valueStr}${salt}` : valueStr;
    return crypto.createHash('sha256').update(saltedValue).digest('hex');
  }

  /**
   * Mask value (e.g., phone numbers, emails)
   */
  private maskValue(value: any, preserveFormat?: boolean): string {
    const valueStr = String(value);

    if (!preserveFormat) {
      return '*'.repeat(valueStr.length);
    }

    // Preserve format for common patterns
    if (this.isEmail(valueStr)) {
      return this.maskEmail(valueStr);
    }

    if (this.isPhone(valueStr)) {
      return this.maskPhone(valueStr);
    }

    // Default masking: show first and last character
    if (valueStr.length <= 2) {
      return '*'.repeat(valueStr.length);
    }

    return valueStr[0] + '*'.repeat(valueStr.length - 2) + valueStr[valueStr.length - 1];
  }

  /**
   * Mask email address
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1] : '***';
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Mask phone number
   */
  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '***';
    
    const lastFour = digits.slice(-4);
    return '*'.repeat(digits.length - 4) + lastFour;
  }

  /**
   * Generalize value (reduce precision)
   */
  private generalizeValue(value: any): any {
    // Age: Round to nearest 5
    if (typeof value === 'number' && value > 0 && value < 150) {
      return Math.round(value / 5) * 5;
    }

    // Date: Keep only year
    if (value instanceof Date) {
      return value.getFullYear();
    }

    // String date
    if (typeof value === 'string' && this.isDate(value)) {
      const date = new Date(value);
      return date.getFullYear();
    }

    return value;
  }

  /**
   * Pseudonymize value (reversible with key)
   */
  private pseudonymizeValue(value: any, salt?: string): string {
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    const key = salt || 'default-pseudonym-key';
    
    // Simple pseudonymization (in production, use proper encryption)
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      crypto.scryptSync(key, 'salt', 32),
      Buffer.alloc(16, 0)
    );
    
    let encrypted = cipher.update(valueStr, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  }

  /**
   * De-pseudonymize value
   */
  async depseudonymize(pseudonym: string, salt?: string): Promise<string> {
    const key = salt || 'default-pseudonym-key';
    
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      crypto.scryptSync(key, 'salt', 32),
      Buffer.alloc(16, 0)
    );
    
    let decrypted = decipher.update(pseudonym, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Anonymize patient data
   */
  async anonymizePatientData(patientData: any): Promise<any> {
    const config: AnonymizationConfig = {
      method: 'HASH',
      fields: [
        'demographics.name',
        'demographics.contact.phone',
        'demographics.contact.email',
        'abha_id',
      ],
      salt: 'patient-anonymization-salt',
    };

    const result = await this.anonymize(patientData, config);
    return result.anonymized;
  }

  /**
   * Anonymize for research (k-anonymity)
   */
  async anonymizeForResearch(data: any[]): Promise<any[]> {
    // Implement k-anonymity: ensure each record is indistinguishable from at least k-1 others
    const k = 5; // k-anonymity parameter

    return data.map((record) => ({
      ...record,
      age: this.generalizeValue(record.age),
      gender: record.gender, // Keep as is
      diagnosis: record.diagnosis, // Keep as is
      // Remove direct identifiers
      name: undefined,
      phone: undefined,
      email: undefined,
      address: undefined,
    }));
  }

  /**
   * Helper: Check if field exists
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
   * Helper: Get field value
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
   * Helper: Set field value
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
   * Helper: Check if value is email
   */
  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  /**
   * Helper: Check if value is phone
   */
  private isPhone(value: string): boolean {
    return /^\+?[\d\s\-()]+$/.test(value) && value.replace(/\D/g, '').length >= 10;
  }

  /**
   * Helper: Check if value is date
   */
  private isDate(value: string): boolean {
    return !isNaN(Date.parse(value));
  }
}

export default new AnonymizationService();

/**
 * Data Retention Service
 * Manages data retention policies and automated deletion
 */

import { DataRetentionPolicy } from '../types';
import { securityConfig } from '../config';

export class DataRetentionService {
  private policies: Map<string, DataRetentionPolicy>;

  constructor() {
    this.policies = new Map();
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default retention policies
   */
  private initializeDefaultPolicies(): void {
    // Medical records: 7 years (as per Indian regulations)
    this.addPolicy({
      policyId: 'medical-records',
      dataType: 'MEDICAL_RECORDS',
      retentionDays: securityConfig.retention.dataDays,
      archiveAfterDays: 365,
      deleteAfterDays: securityConfig.retention.dataDays,
      legalHoldExempt: false,
    });

    // Audit logs: 7 years
    this.addPolicy({
      policyId: 'audit-logs',
      dataType: 'AUDIT_LOGS',
      retentionDays: securityConfig.retention.auditLogDays,
      deleteAfterDays: securityConfig.retention.auditLogDays,
      legalHoldExempt: false,
    });

    // Application logs: 90 days
    this.addPolicy({
      policyId: 'application-logs',
      dataType: 'APPLICATION_LOGS',
      retentionDays: securityConfig.retention.logDays,
      archiveAfterDays: 30,
      deleteAfterDays: securityConfig.retention.logDays,
      legalHoldExempt: true,
    });

    // Session data: 24 hours
    this.addPolicy({
      policyId: 'session-data',
      dataType: 'SESSION_DATA',
      retentionDays: 1,
      deleteAfterDays: 1,
      legalHoldExempt: true,
    });

    // Temporary files: 7 days
    this.addPolicy({
      policyId: 'temporary-files',
      dataType: 'TEMPORARY_FILES',
      retentionDays: 7,
      deleteAfterDays: 7,
      legalHoldExempt: true,
    });

    // Diagnostic images: 7 years
    this.addPolicy({
      policyId: 'diagnostic-images',
      dataType: 'DIAGNOSTIC_IMAGES',
      retentionDays: securityConfig.retention.dataDays,
      archiveAfterDays: 365,
      deleteAfterDays: securityConfig.retention.dataDays,
      legalHoldExempt: false,
    });
  }

  /**
   * Add retention policy
   */
  addPolicy(policy: DataRetentionPolicy): void {
    this.policies.set(policy.policyId, policy);
  }

  /**
   * Get retention policy
   */
  getPolicy(policyId: string): DataRetentionPolicy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * Get policy by data type
   */
  getPolicyByDataType(dataType: string): DataRetentionPolicy | undefined {
    return Array.from(this.policies.values()).find((p) => p.dataType === dataType);
  }

  /**
   * Get all policies
   */
  getAllPolicies(): DataRetentionPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Check if data should be archived
   */
  shouldArchive(dataType: string, createdAt: Date): boolean {
    const policy = this.getPolicyByDataType(dataType);
    if (!policy || !policy.archiveAfterDays) return false;

    const ageInDays = this.getAgeInDays(createdAt);
    return ageInDays >= policy.archiveAfterDays;
  }

  /**
   * Check if data should be deleted
   */
  shouldDelete(dataType: string, createdAt: Date, hasLegalHold: boolean = false): boolean {
    const policy = this.getPolicyByDataType(dataType);
    if (!policy) return false;

    // Don't delete if legal hold and not exempt
    if (hasLegalHold && !policy.legalHoldExempt) return false;

    const ageInDays = this.getAgeInDays(createdAt);
    return ageInDays >= policy.deleteAfterDays;
  }

  /**
   * Get data eligible for archival
   */
  async getDataForArchival(dataType: string): Promise<any[]> {
    // In production, query database for data matching criteria
    // This is a placeholder implementation
    return [];
  }

  /**
   * Get data eligible for deletion
   */
  async getDataForDeletion(dataType: string): Promise<any[]> {
    // In production, query database for data matching criteria
    // This is a placeholder implementation
    return [];
  }

  /**
   * Archive data
   */
  async archiveData(dataId: string, dataType: string): Promise<void> {
    console.log(`Archiving ${dataType} data: ${dataId}`);
    // In production:
    // 1. Move data to cold storage (S3 Glacier)
    // 2. Update database record with archive location
    // 3. Remove from hot storage
  }

  /**
   * Delete data
   */
  async deleteData(dataId: string, dataType: string): Promise<void> {
    console.log(`Deleting ${dataType} data: ${dataId}`);
    // In production:
    // 1. Verify no legal hold
    // 2. Delete from all storage locations
    // 3. Log deletion in audit trail
    // 4. Update database record
  }

  /**
   * Run retention policy enforcement
   */
  async enforceRetentionPolicies(): Promise<{
    archived: number;
    deleted: number;
    errors: number;
  }> {
    let archived = 0;
    let deleted = 0;
    let errors = 0;

    for (const policy of this.policies.values()) {
      try {
        // Archive eligible data
        const dataForArchival = await this.getDataForArchival(policy.dataType);
        for (const data of dataForArchival) {
          try {
            await this.archiveData(data.id, policy.dataType);
            archived++;
          } catch (error) {
            console.error(`Failed to archive data: ${error}`);
            errors++;
          }
        }

        // Delete eligible data
        const dataForDeletion = await this.getDataForDeletion(policy.dataType);
        for (const data of dataForDeletion) {
          try {
            await this.deleteData(data.id, policy.dataType);
            deleted++;
          } catch (error) {
            console.error(`Failed to delete data: ${error}`);
            errors++;
          }
        }
      } catch (error) {
        console.error(`Failed to enforce policy ${policy.policyId}: ${error}`);
        errors++;
      }
    }

    return { archived, deleted, errors };
  }

  /**
   * Get retention statistics
   */
  async getRetentionStats(): Promise<any> {
    const stats: any = {};

    for (const policy of this.policies.values()) {
      stats[policy.dataType] = {
        policyId: policy.policyId,
        retentionDays: policy.retentionDays,
        archiveAfterDays: policy.archiveAfterDays,
        deleteAfterDays: policy.deleteAfterDays,
        // In production, add actual counts from database
        totalRecords: 0,
        eligibleForArchival: 0,
        eligibleForDeletion: 0,
      };
    }

    return stats;
  }

  /**
   * Calculate age in days
   */
  private getAgeInDays(date: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Schedule retention policy enforcement
   */
  scheduleEnforcement(intervalHours: number = 24): NodeJS.Timeout {
    return setInterval(async () => {
      console.log('Running scheduled retention policy enforcement...');
      const result = await this.enforceRetentionPolicies();
      console.log(`Retention enforcement complete: ${JSON.stringify(result)}`);
    }, intervalHours * 60 * 60 * 1000);
  }
}

export default new DataRetentionService();

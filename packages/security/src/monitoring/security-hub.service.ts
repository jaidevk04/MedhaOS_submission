/**
 * AWS Security Hub Service
 * Centralized security and compliance monitoring
 */

import {
  SecurityHubClient,
  GetFindingsCommand,
  BatchUpdateFindingsCommand,
  GetInsightsCommand,
  GetInsightResultsCommand,
  DescribeStandardsCommand,
  GetEnabledStandardsCommand,
} from '@aws-sdk/client-securityhub';
import { securityConfig } from '../config';
import { SecurityFinding } from '../types';

export class SecurityHubService {
  private client: SecurityHubClient;

  constructor() {
    this.client = new SecurityHubClient({ region: securityConfig.aws.region });
  }

  /**
   * Get security findings from Security Hub
   */
  async getFindings(filters?: any): Promise<SecurityFinding[]> {
    try {
      const command = new GetFindingsCommand({
        Filters: filters || {
          RecordState: [{ Value: 'ACTIVE', Comparison: 'EQUALS' }],
          WorkflowStatus: [{ Value: 'NEW', Comparison: 'EQUALS' }],
        },
        MaxResults: 100,
      });

      const response = await this.client.send(command);

      if (!response.Findings) {
        return [];
      }

      return response.Findings.map((finding) => ({
        id: finding.Id || '',
        severity: this.mapSeverity(finding.Severity?.Label || 'INFORMATIONAL'),
        title: finding.Title || '',
        description: finding.Description || '',
        resource: finding.Resources?.[0]?.Type || '',
        remediation: finding.Remediation?.Recommendation?.Text || undefined,
        detectedAt: finding.CreatedAt ? new Date(finding.CreatedAt) : new Date(),
        status: this.mapWorkflowStatus(finding.Workflow?.Status || 'NEW'),
      }));
    } catch (error) {
      console.error('Security Hub get findings error:', error);
      throw new Error(`Failed to get Security Hub findings: ${error}`);
    }
  }

  /**
   * Get critical and high severity findings
   */
  async getCriticalFindings(): Promise<SecurityFinding[]> {
    const filters = {
      RecordState: [{ Value: 'ACTIVE', Comparison: 'EQUALS' }],
      SeverityLabel: [
        { Value: 'CRITICAL', Comparison: 'EQUALS' },
        { Value: 'HIGH', Comparison: 'EQUALS' },
      ],
    };

    return this.getFindings(filters);
  }

  /**
   * Get compliance findings
   */
  async getComplianceFindings(standard: string): Promise<SecurityFinding[]> {
    const filters = {
      RecordState: [{ Value: 'ACTIVE', Comparison: 'EQUALS' }],
      ComplianceStatus: [{ Value: 'FAILED', Comparison: 'EQUALS' }],
      GeneratorId: [{ Value: standard, Comparison: 'PREFIX' }],
    };

    return this.getFindings(filters);
  }

  /**
   * Update finding status
   */
  async updateFindingStatus(
    findingId: string,
    status: 'NEW' | 'NOTIFIED' | 'RESOLVED' | 'SUPPRESSED'
  ): Promise<void> {
    try {
      const command = new BatchUpdateFindingsCommand({
        FindingIdentifiers: [
          {
            Id: findingId,
            ProductArn: securityConfig.monitoring.securityHubArn,
          },
        ],
        Workflow: {
          Status: status,
        },
      });

      await this.client.send(command);
      console.log(`Finding ${findingId} updated to status: ${status}`);
    } catch (error) {
      console.error('Update finding status error:', error);
      throw new Error(`Failed to update finding status: ${error}`);
    }
  }

  /**
   * Get security insights
   */
  async getInsights(): Promise<any[]> {
    try {
      const command = new GetInsightsCommand({
        MaxResults: 20,
      });

      const response = await this.client.send(command);
      return response.Insights || [];
    } catch (error) {
      console.error('Get insights error:', error);
      throw new Error(`Failed to get insights: ${error}`);
    }
  }

  /**
   * Get insight results
   */
  async getInsightResults(insightArn: string): Promise<any> {
    try {
      const command = new GetInsightResultsCommand({
        InsightArn: insightArn,
      });

      const response = await this.client.send(command);
      return response.InsightResults;
    } catch (error) {
      console.error('Get insight results error:', error);
      throw new Error(`Failed to get insight results: ${error}`);
    }
  }

  /**
   * Get enabled security standards
   */
  async getEnabledStandards(): Promise<any[]> {
    try {
      const command = new GetEnabledStandardsCommand({});
      const response = await this.client.send(command);
      return response.StandardsSubscriptions || [];
    } catch (error) {
      console.error('Get enabled standards error:', error);
      throw new Error(`Failed to get enabled standards: ${error}`);
    }
  }

  /**
   * Get available security standards
   */
  async getAvailableStandards(): Promise<any[]> {
    try {
      const command = new DescribeStandardsCommand({});
      const response = await this.client.send(command);
      return response.Standards || [];
    } catch (error) {
      console.error('Get available standards error:', error);
      throw new Error(`Failed to get available standards: ${error}`);
    }
  }

  /**
   * Get security score
   */
  async getSecurityScore(): Promise<number> {
    try {
      const findings = await this.getFindings();
      const criticalCount = findings.filter((f) => f.severity === 'CRITICAL').length;
      const highCount = findings.filter((f) => f.severity === 'HIGH').length;
      const mediumCount = findings.filter((f) => f.severity === 'MEDIUM').length;

      // Calculate score (100 - weighted findings)
      const score = Math.max(
        0,
        100 - (criticalCount * 10 + highCount * 5 + mediumCount * 2)
      );

      return score;
    } catch (error) {
      console.error('Get security score error:', error);
      return 0;
    }
  }

  /**
   * Map Security Hub severity to our format
   */
  private mapSeverity(label: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL' {
    switch (label.toUpperCase()) {
      case 'CRITICAL':
        return 'CRITICAL';
      case 'HIGH':
        return 'HIGH';
      case 'MEDIUM':
        return 'MEDIUM';
      case 'LOW':
        return 'LOW';
      default:
        return 'INFORMATIONAL';
    }
  }

  /**
   * Map workflow status
   */
  private mapWorkflowStatus(status: string): 'NEW' | 'NOTIFIED' | 'RESOLVED' | 'SUPPRESSED' {
    switch (status.toUpperCase()) {
      case 'NEW':
        return 'NEW';
      case 'NOTIFIED':
        return 'NOTIFIED';
      case 'RESOLVED':
        return 'RESOLVED';
      case 'SUPPRESSED':
        return 'SUPPRESSED';
      default:
        return 'NEW';
    }
  }
}

export default new SecurityHubService();

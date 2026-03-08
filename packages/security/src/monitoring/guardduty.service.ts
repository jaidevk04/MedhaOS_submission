/**
 * AWS GuardDuty Service
 * Monitors for security threats and malicious activity
 */

import {
  GuardDutyClient,
  GetFindingsCommand,
  ListFindingsCommand,
  UpdateFindingsFeedbackCommand,
  GetDetectorCommand,
  ListDetectorsCommand,
  CreateThreatIntelSetCommand,
} from '@aws-sdk/client-guardduty';
import { securityConfig } from '../config';
import { SecurityFinding } from '../types';

export class GuardDutyService {
  private client: GuardDutyClient;
  private detectorId: string;

  constructor() {
    this.client = new GuardDutyClient({ region: securityConfig.aws.region });
    this.detectorId = securityConfig.monitoring.guardDutyDetectorId;
  }

  /**
   * Get security findings from GuardDuty
   */
  async getFindings(maxResults: number = 50): Promise<SecurityFinding[]> {
    try {
      // List finding IDs
      const listCommand = new ListFindingsCommand({
        DetectorId: this.detectorId,
        MaxResults: maxResults,
        FindingCriteria: {
          Criterion: {
            'severity': {
              Gte: 4, // Medium severity and above
            },
          },
        },
      });

      const listResponse = await this.client.send(listCommand);

      if (!listResponse.FindingIds || listResponse.FindingIds.length === 0) {
        return [];
      }

      // Get finding details
      const getCommand = new GetFindingsCommand({
        DetectorId: this.detectorId,
        FindingIds: listResponse.FindingIds,
      });

      const getResponse = await this.client.send(getCommand);

      if (!getResponse.Findings) {
        return [];
      }

      // Transform to SecurityFinding format
      return getResponse.Findings.map((finding) => ({
        id: finding.Id || '',
        severity: this.mapSeverity(finding.Severity || 0),
        title: finding.Title || '',
        description: finding.Description || '',
        resource: finding.Resource?.ResourceType || '',
        remediation: finding.Service?.Action?.ActionType || undefined,
        detectedAt: finding.CreatedAt ? new Date(finding.CreatedAt) : new Date(),
        status: 'NEW',
      }));
    } catch (error) {
      console.error('GuardDuty get findings error:', error);
      throw new Error(`Failed to get GuardDuty findings: ${error}`);
    }
  }

  /**
   * Get critical findings only
   */
  async getCriticalFindings(): Promise<SecurityFinding[]> {
    try {
      const listCommand = new ListFindingsCommand({
        DetectorId: this.detectorId,
        MaxResults: 100,
        FindingCriteria: {
          Criterion: {
            'severity': {
              Gte: 7, // High and Critical only
            },
          },
        },
      });

      const listResponse = await this.client.send(listCommand);

      if (!listResponse.FindingIds || listResponse.FindingIds.length === 0) {
        return [];
      }

      const getCommand = new GetFindingsCommand({
        DetectorId: this.detectorId,
        FindingIds: listResponse.FindingIds,
      });

      const getResponse = await this.client.send(getCommand);

      if (!getResponse.Findings) {
        return [];
      }

      return getResponse.Findings.map((finding) => ({
        id: finding.Id || '',
        severity: this.mapSeverity(finding.Severity || 0),
        title: finding.Title || '',
        description: finding.Description || '',
        resource: finding.Resource?.ResourceType || '',
        remediation: finding.Service?.Action?.ActionType || undefined,
        detectedAt: finding.CreatedAt ? new Date(finding.CreatedAt) : new Date(),
        status: 'NEW',
      }));
    } catch (error) {
      console.error('GuardDuty get critical findings error:', error);
      throw new Error(`Failed to get critical findings: ${error}`);
    }
  }

  /**
   * Mark finding as resolved
   */
  async markFindingResolved(findingId: string): Promise<void> {
    try {
      const command = new UpdateFindingsFeedbackCommand({
        DetectorId: this.detectorId,
        FindingIds: [findingId],
        Feedback: 'USEFUL',
        Comments: 'Finding has been resolved',
      });

      await this.client.send(command);
      console.log(`Finding ${findingId} marked as resolved`);
    } catch (error) {
      console.error('Mark finding resolved error:', error);
      throw new Error(`Failed to mark finding as resolved: ${error}`);
    }
  }

  /**
   * Get detector status
   */
  async getDetectorStatus(): Promise<any> {
    try {
      const command = new GetDetectorCommand({
        DetectorId: this.detectorId,
      });

      const response = await this.client.send(command);
      return {
        status: response.Status,
        serviceRole: response.ServiceRole,
        updatedAt: response.UpdatedAt,
      };
    } catch (error) {
      console.error('Get detector status error:', error);
      throw new Error(`Failed to get detector status: ${error}`);
    }
  }

  /**
   * List all detectors
   */
  async listDetectors(): Promise<string[]> {
    try {
      const command = new ListDetectorsCommand({});
      const response = await this.client.send(command);
      return response.DetectorIds || [];
    } catch (error) {
      console.error('List detectors error:', error);
      throw new Error(`Failed to list detectors: ${error}`);
    }
  }

  /**
   * Map GuardDuty severity to our severity levels
   */
  private mapSeverity(severity: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL' {
    if (severity >= 8.0) return 'CRITICAL';
    if (severity >= 7.0) return 'HIGH';
    if (severity >= 4.0) return 'MEDIUM';
    if (severity >= 1.0) return 'LOW';
    return 'INFORMATIONAL';
  }

  /**
   * Create threat intelligence set
   */
  async createThreatIntelSet(name: string, location: string): Promise<string> {
    try {
      const command = new CreateThreatIntelSetCommand({
        DetectorId: this.detectorId,
        Name: name,
        Format: 'TXT',
        Location: location,
        Activate: true,
      });

      const response = await this.client.send(command);
      return response.ThreatIntelSetId || '';
    } catch (error) {
      console.error('Create threat intel set error:', error);
      throw new Error(`Failed to create threat intel set: ${error}`);
    }
  }
}

export default new GuardDutyService();

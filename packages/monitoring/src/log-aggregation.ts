import { CloudWatchLogsClient, CreateLogGroupCommand, CreateLogStreamCommand, PutRetentionPolicyCommand } from '@aws-sdk/client-cloudwatch-logs';
import { MonitoringConfig } from './types';

/**
 * Log Aggregation Service
 * Manages CloudWatch log groups, streams, and retention policies
 */
export class LogAggregationService {
  private config: MonitoringConfig;
  private cloudWatchClient?: CloudWatchLogsClient;

  constructor(config: MonitoringConfig) {
    this.config = config;

    if (config.cloudWatch?.enabled) {
      this.cloudWatchClient = new CloudWatchLogsClient({
        region: config.cloudWatch.region,
      });
    }
  }

  /**
   * Create log group if it doesn't exist
   */
  async createLogGroup(logGroupName: string): Promise<void> {
    if (!this.cloudWatchClient) {
      return;
    }

    try {
      const command = new CreateLogGroupCommand({
        logGroupName,
      });

      await this.cloudWatchClient.send(command);
      console.log(`Log group created: ${logGroupName}`);
    } catch (error: any) {
      if (error.name === 'ResourceAlreadyExistsException') {
        console.log(`Log group already exists: ${logGroupName}`);
      } else {
        console.error('Failed to create log group:', error);
        throw error;
      }
    }
  }

  /**
   * Create log stream if it doesn't exist
   */
  async createLogStream(logGroupName: string, logStreamName: string): Promise<void> {
    if (!this.cloudWatchClient) {
      return;
    }

    try {
      const command = new CreateLogStreamCommand({
        logGroupName,
        logStreamName,
      });

      await this.cloudWatchClient.send(command);
      console.log(`Log stream created: ${logStreamName}`);
    } catch (error: any) {
      if (error.name === 'ResourceAlreadyExistsException') {
        console.log(`Log stream already exists: ${logStreamName}`);
      } else {
        console.error('Failed to create log stream:', error);
        throw error;
      }
    }
  }

  /**
   * Set log retention policy
   */
  async setRetentionPolicy(logGroupName: string, retentionDays: number): Promise<void> {
    if (!this.cloudWatchClient) {
      return;
    }

    try {
      const command = new PutRetentionPolicyCommand({
        logGroupName,
        retentionInDays: retentionDays,
      });

      await this.cloudWatchClient.send(command);
      console.log(`Retention policy set: ${logGroupName} - ${retentionDays} days`);
    } catch (error) {
      console.error('Failed to set retention policy:', error);
      throw error;
    }
  }

  /**
   * Initialize logging infrastructure
   */
  async initializeLogging(retentionDays: number = 90): Promise<void> {
    if (!this.config.cloudWatch) {
      return;
    }

    const logGroupName = this.config.cloudWatch.logGroup;
    const logStreamName = `${this.config.cloudWatch.logStreamPrefix}-${this.config.serviceName}`;

    // Create log group
    await this.createLogGroup(logGroupName);

    // Set retention policy
    await this.setRetentionPolicy(logGroupName, retentionDays);

    // Create log stream
    await this.createLogStream(logGroupName, logStreamName);

    console.log('Logging infrastructure initialized');
  }

  /**
   * Create log groups for different categories
   */
  async createCategorizedLogGroups(): Promise<void> {
    if (!this.config.cloudWatch) {
      return;
    }

    const categories = [
      'application',
      'access',
      'error',
      'audit',
      'performance',
      'security',
    ];

    for (const category of categories) {
      const logGroupName = `/medhaos/${category}`;
      await this.createLogGroup(logGroupName);
      
      // Set different retention policies based on category
      const retentionDays = category === 'audit' || category === 'security' ? 2555 : 90; // 7 years for audit/security
      await this.setRetentionPolicy(logGroupName, retentionDays);
    }

    console.log('Categorized log groups created');
  }
}

/**
 * Create log aggregation service instance
 */
export function createLogAggregationService(config: MonitoringConfig): LogAggregationService {
  return new LogAggregationService(config);
}

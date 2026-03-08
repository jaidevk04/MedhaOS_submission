import { CloudWatchClient, PutMetricAlarmCommand } from '@aws-sdk/client-cloudwatch';
import { MonitoringConfig } from './types';

/**
 * Alert Configuration
 */
export interface AlertConfig {
  name: string;
  description: string;
  metricName: string;
  namespace: string;
  threshold: number;
  comparisonOperator: 'GreaterThanThreshold' | 'LessThanThreshold' | 'GreaterThanOrEqualToThreshold' | 'LessThanOrEqualToThreshold';
  evaluationPeriods: number;
  period: number;
  statistic: 'Average' | 'Sum' | 'Minimum' | 'Maximum' | 'SampleCount';
  dimensions?: Array<{ Name: string; Value: string }>;
  actionsEnabled?: boolean;
  alarmActions?: string[];
}

/**
 * Alerting Service
 * Manages CloudWatch alarms and integrations with PagerDuty/Slack
 */
export class AlertingService {
  private config: MonitoringConfig;
  private cloudWatchClient?: CloudWatchClient;

  constructor(config: MonitoringConfig) {
    this.config = config;

    if (config.cloudWatch?.enabled) {
      this.cloudWatchClient = new CloudWatchClient({
        region: config.cloudWatch.region,
      });
    }
  }

  /**
   * Create CloudWatch alarm
   */
  async createAlarm(alertConfig: AlertConfig): Promise<void> {
    if (!this.cloudWatchClient) {
      console.warn('CloudWatch client not initialized, skipping alarm creation');
      return;
    }

    try {
      const command = new PutMetricAlarmCommand({
        AlarmName: `${this.config.serviceName}-${alertConfig.name}`,
        AlarmDescription: alertConfig.description,
        MetricName: alertConfig.metricName,
        Namespace: alertConfig.namespace,
        Statistic: alertConfig.statistic,
        Period: alertConfig.period,
        EvaluationPeriods: alertConfig.evaluationPeriods,
        Threshold: alertConfig.threshold,
        ComparisonOperator: alertConfig.comparisonOperator,
        Dimensions: alertConfig.dimensions || [],
        ActionsEnabled: alertConfig.actionsEnabled ?? true,
        AlarmActions: alertConfig.alarmActions || [],
      });

      await this.cloudWatchClient.send(command);
      console.log(`Alarm created: ${alertConfig.name}`);
    } catch (error) {
      console.error('Failed to create alarm:', error);
      throw error;
    }
  }

  /**
   * Create standard alarms for the service
   */
  async createStandardAlarms(snsTopicArn?: string): Promise<void> {
    const namespace = this.config.cloudWatch?.namespace || 'MedhaOS';
    const alarmActions = snsTopicArn ? [snsTopicArn] : [];

    // High error rate alarm
    await this.createAlarm({
      name: 'high-error-rate',
      description: 'Alert when error rate exceeds 5%',
      metricName: 'ErrorCount',
      namespace,
      threshold: 5,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      period: 300, // 5 minutes
      statistic: 'Sum',
      dimensions: [
        { Name: 'Service', Value: this.config.serviceName },
      ],
      alarmActions,
    });

    // High response time alarm
    await this.createAlarm({
      name: 'high-response-time',
      description: 'Alert when average response time exceeds 3 seconds',
      metricName: 'HttpRequestDuration',
      namespace,
      threshold: 3000, // 3 seconds in milliseconds
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      period: 300,
      statistic: 'Average',
      dimensions: [
        { Name: 'Service', Value: this.config.serviceName },
      ],
      alarmActions,
    });

    // Low agent confidence alarm
    await this.createAlarm({
      name: 'low-agent-confidence',
      description: 'Alert when agent confidence score is below 0.70',
      metricName: 'AgentConfidenceScore',
      namespace,
      threshold: 0.70,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 3,
      period: 300,
      statistic: 'Average',
      dimensions: [
        { Name: 'Service', Value: this.config.serviceName },
      ],
      alarmActions,
    });

    // High queue depth alarm (for queue-based services)
    await this.createAlarm({
      name: 'high-queue-depth',
      description: 'Alert when queue depth exceeds 100 messages',
      metricName: 'QueueDepth',
      namespace,
      threshold: 100,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      period: 300,
      statistic: 'Average',
      dimensions: [
        { Name: 'Service', Value: this.config.serviceName },
      ],
      alarmActions,
    });
  }

  /**
   * Send alert to Slack (webhook integration)
   */
  async sendSlackAlert(
    webhookUrl: string,
    message: string,
    severity: 'critical' | 'warning' | 'info'
  ): Promise<void> {
    const colors = {
      critical: '#FF0000',
      warning: '#FFA500',
      info: '#0000FF',
    };

    const payload = {
      attachments: [
        {
          color: colors[severity],
          title: `${severity.toUpperCase()}: ${this.config.serviceName}`,
          text: message,
          footer: 'MedhaOS Monitoring',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  /**
   * Send alert to PagerDuty
   */
  async sendPagerDutyAlert(
    integrationKey: string,
    summary: string,
    severity: 'critical' | 'error' | 'warning' | 'info',
    details?: any
  ): Promise<void> {
    const payload = {
      routing_key: integrationKey,
      event_action: 'trigger',
      payload: {
        summary,
        severity,
        source: this.config.serviceName,
        timestamp: new Date().toISOString(),
        custom_details: details,
      },
    };

    try {
      const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`PagerDuty API failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send PagerDuty alert:', error);
    }
  }
}

/**
 * Create alerting service instance
 */
export function createAlertingService(config: MonitoringConfig): AlertingService {
  return new AlertingService(config);
}

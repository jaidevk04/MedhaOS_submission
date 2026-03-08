import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { MonitoringConfig, CustomMetric, AgentMetrics, MetricLabels } from './types';

/**
 * Metrics Collection Service
 * Supports both Prometheus and CloudWatch metrics
 */
export class MetricsService {
  private config: MonitoringConfig;
  private registry: Registry;
  private cloudWatchClient?: CloudWatchClient;

  // Prometheus metrics
  private httpRequestsTotal: Counter;
  private httpRequestDuration: Histogram;
  private agentExecutionDuration: Histogram;
  private agentExecutionTotal: Counter;
  private agentConfidenceScore: Histogram;
  private activeConnections: Gauge;
  private queueDepth: Gauge;
  private errorRate: Counter;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.registry = new Registry();

    // Initialize CloudWatch client if enabled
    if (config.cloudWatch?.enabled) {
      this.cloudWatchClient = new CloudWatchClient({
        region: config.cloudWatch.region,
      });
    }

    // Initialize Prometheus metrics
    this.initializePrometheusMetrics();

    // Collect default metrics (CPU, memory, etc.)
    if (config.prometheus?.enabled) {
      collectDefaultMetrics({ register: this.registry });
    }
  }

  private initializePrometheusMetrics(): void {
    // HTTP request metrics
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status_code', 'service'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status_code', 'service'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    // Agent execution metrics
    this.agentExecutionDuration = new Histogram({
      name: 'agent_execution_duration_seconds',
      help: 'Agent execution duration in seconds',
      labelNames: ['agent_name', 'success', 'service'],
      buckets: [0.5, 1, 2, 5, 10, 30],
      registers: [this.registry],
    });

    this.agentExecutionTotal = new Counter({
      name: 'agent_execution_total',
      help: 'Total number of agent executions',
      labelNames: ['agent_name', 'success', 'service'],
      registers: [this.registry],
    });

    this.agentConfidenceScore = new Histogram({
      name: 'agent_confidence_score',
      help: 'Agent confidence score distribution',
      labelNames: ['agent_name', 'service'],
      buckets: [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0],
      registers: [this.registry],
    });

    // System metrics
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      labelNames: ['service'],
      registers: [this.registry],
    });

    this.queueDepth = new Gauge({
      name: 'queue_depth',
      help: 'Current queue depth',
      labelNames: ['queue_name', 'service'],
      registers: [this.registry],
    });

    this.errorRate = new Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['error_type', 'service'],
      registers: [this.registry],
    });
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    durationSeconds: number
  ): void {
    const labels = {
      method,
      path,
      status_code: statusCode.toString(),
      service: this.config.serviceName,
    };

    this.httpRequestsTotal.inc(labels);
    this.httpRequestDuration.observe(labels, durationSeconds);

    // Send to CloudWatch if enabled
    if (this.cloudWatchClient) {
      this.sendToCloudWatch({
        name: 'HttpRequestDuration',
        value: durationSeconds * 1000, // Convert to milliseconds
        unit: 'Milliseconds',
        labels,
      });
    }
  }

  /**
   * Record agent execution metrics
   */
  recordAgentExecution(metrics: AgentMetrics): void {
    const labels = {
      agent_name: metrics.agentName,
      success: metrics.success.toString(),
      service: this.config.serviceName,
    };

    const durationSeconds = metrics.executionTime / 1000;

    this.agentExecutionTotal.inc(labels);
    this.agentExecutionDuration.observe(labels, durationSeconds);
    this.agentConfidenceScore.observe(
      { agent_name: metrics.agentName, service: this.config.serviceName },
      metrics.confidenceScore
    );

    // Send to CloudWatch if enabled
    if (this.cloudWatchClient) {
      this.sendToCloudWatch({
        name: 'AgentExecutionTime',
        value: metrics.executionTime,
        unit: 'Milliseconds',
        labels: {
          AgentName: metrics.agentName,
          Success: metrics.success.toString(),
        },
      });

      this.sendToCloudWatch({
        name: 'AgentConfidenceScore',
        value: metrics.confidenceScore,
        unit: 'None',
        labels: {
          AgentName: metrics.agentName,
        },
      });
    }
  }

  /**
   * Record error
   */
  recordError(errorType: string): void {
    this.errorRate.inc({
      error_type: errorType,
      service: this.config.serviceName,
    });

    // Send to CloudWatch if enabled
    if (this.cloudWatchClient) {
      this.sendToCloudWatch({
        name: 'ErrorCount',
        value: 1,
        unit: 'Count',
        labels: {
          ErrorType: errorType,
        },
      });
    }
  }

  /**
   * Set active connections gauge
   */
  setActiveConnections(count: number): void {
    this.activeConnections.set({ service: this.config.serviceName }, count);
  }

  /**
   * Set queue depth gauge
   */
  setQueueDepth(queueName: string, depth: number): void {
    this.queueDepth.set(
      { queue_name: queueName, service: this.config.serviceName },
      depth
    );
  }

  /**
   * Send custom metric to CloudWatch
   */
  async sendToCloudWatch(metric: CustomMetric): Promise<void> {
    if (!this.cloudWatchClient || !this.config.cloudWatch) {
      return;
    }

    try {
      const dimensions = metric.labels
        ? Object.entries(metric.labels).map(([key, value]) => ({
            Name: key,
            Value: value.toString(),
          }))
        : [];

      // Add service dimension
      dimensions.push({
        Name: 'Service',
        Value: this.config.serviceName,
      });

      dimensions.push({
        Name: 'Environment',
        Value: this.config.environment,
      });

      const command = new PutMetricDataCommand({
        Namespace: this.config.cloudWatch.namespace,
        MetricData: [
          {
            MetricName: metric.name,
            Value: metric.value,
            Unit: metric.unit || 'None',
            Timestamp: metric.timestamp || new Date(),
            Dimensions: dimensions,
          },
        ],
      });

      await this.cloudWatchClient.send(command);
    } catch (error) {
      console.error('Failed to send metric to CloudWatch:', error);
    }
  }

  /**
   * Get Prometheus metrics
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get registry for custom metrics
   */
  getRegistry(): Registry {
    return this.registry;
  }
}

/**
 * Create metrics service instance
 */
export function createMetricsService(config: MonitoringConfig): MetricsService {
  return new MetricsService(config);
}

/**
 * Monitoring and Observability Types
 */

export interface MonitoringConfig {
  serviceName: string;
  environment: string;
  logLevel: string;
  cloudWatch?: CloudWatchConfig;
  prometheus?: PrometheusConfig;
  xray?: XRayConfig;
}

export interface CloudWatchConfig {
  region: string;
  logGroup: string;
  logStreamPrefix: string;
  namespace: string;
  enabled: boolean;
}

export interface PrometheusConfig {
  port: number;
  metricsPath: string;
  enabled: boolean;
}

export interface XRayConfig {
  daemonAddress: string;
  enabled: boolean;
}

export interface MetricLabels {
  [key: string]: string | number;
}

export interface CustomMetric {
  name: string;
  value: number;
  unit?: string;
  timestamp?: Date;
  labels?: MetricLabels;
}

export interface AgentMetrics {
  agentName: string;
  executionTime: number;
  confidenceScore: number;
  success: boolean;
  errorType?: string;
  timestamp: Date;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail';
      message?: string;
      responseTime?: number;
    };
  };
}

export interface PerformanceMetrics {
  requestId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userId?: string;
  agentName?: string;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

export interface LogContext {
  requestId?: string;
  userId?: string;
  agentName?: string;
  patientId?: string;
  encounterId?: string;
  [key: string]: any;
}

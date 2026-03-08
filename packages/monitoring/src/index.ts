/**
 * MedhaOS Monitoring and Observability Package
 * 
 * Provides centralized monitoring, logging, metrics, tracing, and alerting
 * for all MedhaOS services.
 */

export * from './types';
export * from './logger';
export * from './metrics';
export * from './tracing';
export * from './health';
export * from './alerts';
export * from './log-aggregation';
export * from './structured-logger';
export * from './service-map';
export * from './performance-analyzer';
export * from './alert-manager';
export * from './dashboard';

import { MonitoringConfig } from './types';
import { createLogger, Logger } from './logger';
import { createMetricsService, MetricsService } from './metrics';
import { createTracingService, TracingService } from './tracing';
import { createHealthCheckService, HealthCheckService } from './health';
import { createAlertingService, AlertingService } from './alerts';
import { createLogAggregationService, LogAggregationService } from './log-aggregation';
import { createStructuredLogger, StructuredLogger } from './structured-logger';

/**
 * Monitoring instance that combines all monitoring services
 */
export class Monitoring {
  public logger: Logger;
  public metrics: MetricsService;
  public tracing: TracingService;
  public health: HealthCheckService;
  public alerts: AlertingService;
  public logAggregation: LogAggregationService;
  public structuredLogger: StructuredLogger;

  constructor(config: MonitoringConfig) {
    this.logger = createLogger(config);
    this.metrics = createMetricsService(config);
    this.tracing = createTracingService(config);
    this.health = createHealthCheckService(config.serviceName);
    this.alerts = createAlertingService(config);
    this.logAggregation = createLogAggregationService(config);
    this.structuredLogger = createStructuredLogger(this.logger);
  }

  /**
   * Initialize monitoring with standard health checks
   */
  initializeStandardHealthChecks(): void {
    this.health.registerMemoryCheck(90);
    this.health.registerCpuCheck(90);
  }

  /**
   * Get Express middleware for monitoring
   */
  getExpressMiddleware() {
    return [
      this.tracing.getExpressMiddleware(),
      (req: any, res: any, next: any) => {
        const startTime = Date.now();

        // Log request
        this.logger.info(`${req.method} ${req.path}`, {
          requestId: req.id,
          method: req.method,
          path: req.path,
          ip: req.ip,
        });

        // Capture response
        res.on('finish', () => {
          const duration = Date.now() - startTime;
          const durationSeconds = duration / 1000;

          // Record metrics
          this.metrics.recordHttpRequest(
            req.method,
            req.path,
            res.statusCode,
            durationSeconds
          );

          // Log response
          this.logger.logRequest(
            req.method,
            req.path,
            res.statusCode,
            duration,
            { requestId: req.id }
          );
        });

        next();
      },
      this.tracing.getExpressCloseMiddleware(),
    ];
  }

  /**
   * Get metrics endpoint handler
   */
  getMetricsHandler() {
    return async (req: any, res: any) => {
      try {
        const metrics = await this.metrics.getMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
      } catch (error) {
        this.logger.error('Failed to get metrics', { error });
        res.status(500).send('Failed to get metrics');
      }
    };
  }

  /**
   * Get health check endpoint handler
   */
  getHealthHandler() {
    return async (req: any, res: any) => {
      try {
        const health = await this.health.getHealth();
        const statusCode = health.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(health);
      } catch (error) {
        this.logger.error('Failed to get health status', { error });
        res.status(500).json({ status: 'error', message: 'Failed to get health status' });
      }
    };
  }

  /**
   * Get detailed health check endpoint handler
   */
  getDetailedHealthHandler() {
    return async (req: any, res: any) => {
      try {
        const health = await this.health.getDetailedHealth();
        const statusCode = health.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(health);
      } catch (error) {
        this.logger.error('Failed to get detailed health status', { error });
        res.status(500).json({ status: 'error', message: 'Failed to get detailed health status' });
      }
    };
  }
}

/**
 * Create monitoring instance
 */
export function createMonitoring(config: MonitoringConfig): Monitoring {
  return new Monitoring(config);
}

/**
 * Helper function to create monitoring config from environment variables
 */
export function createMonitoringConfigFromEnv(): MonitoringConfig {
  return {
    serviceName: process.env.SERVICE_NAME || 'medhaos-service',
    environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    cloudWatch: {
      region: process.env.AWS_REGION || 'ap-south-1',
      logGroup: process.env.CLOUDWATCH_LOG_GROUP || '/medhaos/application',
      logStreamPrefix: process.env.CLOUDWATCH_LOG_STREAM_PREFIX || 'service',
      namespace: process.env.CLOUDWATCH_NAMESPACE || 'MedhaOS',
      enabled: process.env.CLOUDWATCH_ENABLED !== 'false',
    },
    prometheus: {
      port: parseInt(process.env.PROMETHEUS_PORT || '9090', 10),
      metricsPath: process.env.PROMETHEUS_METRICS_PATH || '/metrics',
      enabled: process.env.PROMETHEUS_ENABLED !== 'false',
    },
    xray: {
      daemonAddress: process.env.XRAY_DAEMON_ADDRESS || 'localhost:2000',
      enabled: process.env.XRAY_ENABLED === 'true',
    },
  };
}

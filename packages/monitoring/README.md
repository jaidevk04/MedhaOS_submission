# @medhaos/monitoring

Centralized monitoring and observability package for MedhaOS Healthcare Intelligence Ecosystem.

## Features

- **Structured Logging**: JSON-formatted logs with CloudWatch integration
- **Metrics Collection**: Prometheus metrics with CloudWatch export
- **Distributed Tracing**: AWS X-Ray integration for request tracing
- **Health Checks**: Comprehensive health monitoring for services and dependencies
- **Alerting**: CloudWatch alarms with PagerDuty and Slack integration

## Installation

```bash
npm install @medhaos/monitoring
```

## Quick Start

```typescript
import { createMonitoring, createMonitoringConfigFromEnv } from '@medhaos/monitoring';
import express from 'express';

const app = express();

// Create monitoring instance
const monitoring = createMonitoring(createMonitoringConfigFromEnv());

// Initialize standard health checks
monitoring.initializeStandardHealthChecks();

// Add monitoring middleware
app.use(monitoring.getExpressMiddleware());

// Add health check endpoints
app.get('/health', monitoring.getHealthHandler());
app.get('/health/detailed', monitoring.getDetailedHealthHandler());

// Add metrics endpoint
app.get('/metrics', monitoring.getMetricsHandler());

// Use logger
monitoring.logger.info('Service started', { port: 3000 });

// Record custom metrics
monitoring.metrics.recordAgentExecution({
  agentName: 'triage-agent',
  executionTime: 1500,
  confidenceScore: 0.92,
  success: true,
  timestamp: new Date(),
});

// Trace async operations
const result = await monitoring.tracing.traceAgentExecution('triage-agent', async () => {
  // Your agent logic here
  return { urgencyScore: 78 };
});

app.listen(3000);
```

## Configuration

### Environment Variables

```bash
# Service Configuration
SERVICE_NAME=triage-agent
ENVIRONMENT=production

# CloudWatch Configuration
AWS_REGION=ap-south-1
CLOUDWATCH_LOG_GROUP=/medhaos/application
CLOUDWATCH_LOG_STREAM_PREFIX=service
CLOUDWATCH_NAMESPACE=MedhaOS
CLOUDWATCH_ENABLED=true

# Prometheus Configuration
PROMETHEUS_PORT=9090
PROMETHEUS_METRICS_PATH=/metrics
PROMETHEUS_ENABLED=true

# X-Ray Configuration
XRAY_DAEMON_ADDRESS=localhost:2000
XRAY_ENABLED=true

# Logging Configuration
LOG_LEVEL=info
```

### Programmatic Configuration

```typescript
import { createMonitoring, MonitoringConfig } from '@medhaos/monitoring';

const config: MonitoringConfig = {
  serviceName: 'triage-agent',
  environment: 'production',
  logLevel: 'info',
  cloudWatch: {
    region: 'ap-south-1',
    logGroup: '/medhaos/application',
    logStreamPrefix: 'service',
    namespace: 'MedhaOS',
    enabled: true,
  },
  prometheus: {
    port: 9090,
    metricsPath: '/metrics',
    enabled: true,
  },
  xray: {
    daemonAddress: 'localhost:2000',
    enabled: true,
  },
};

const monitoring = createMonitoring(config);
```

## Usage

### Logging

```typescript
// Basic logging
monitoring.logger.info('User logged in', { userId: '123' });
monitoring.logger.warn('High memory usage', { usage: 85 });
monitoring.logger.error('Database connection failed', { error: err });

// Agent execution logging
monitoring.logger.logAgentExecution('triage-agent', 1500, true, {
  requestId: 'req-123',
  patientId: 'pat-456',
});

// API request logging
monitoring.logger.logRequest('POST', '/api/triage', 200, 1234, {
  requestId: 'req-123',
});

// Create child logger with context
const childLogger = monitoring.logger.child({ requestId: 'req-123' });
childLogger.info('Processing request');
```

### Metrics

```typescript
// HTTP request metrics
monitoring.metrics.recordHttpRequest('POST', '/api/triage', 200, 1.5);

// Agent execution metrics
monitoring.metrics.recordAgentExecution({
  agentName: 'triage-agent',
  executionTime: 1500,
  confidenceScore: 0.92,
  success: true,
  timestamp: new Date(),
});

// Error tracking
monitoring.metrics.recordError('DatabaseConnectionError');

// Custom gauges
monitoring.metrics.setActiveConnections(42);
monitoring.metrics.setQueueDepth('triage-queue', 15);

// Custom CloudWatch metrics
await monitoring.metrics.sendToCloudWatch({
  name: 'CustomMetric',
  value: 100,
  unit: 'Count',
  labels: {
    CustomLabel: 'value',
  },
});
```

### Distributed Tracing

```typescript
// Trace agent execution
const result = await monitoring.tracing.traceAgentExecution('triage-agent', async () => {
  // Your agent logic
  return { urgencyScore: 78 };
});

// Trace database query
const users = await monitoring.tracing.traceDatabaseQuery(
  'SELECT * FROM users WHERE id = ?',
  async () => {
    return db.query('SELECT * FROM users WHERE id = ?', [userId]);
  }
);

// Trace external API call
const response = await monitoring.tracing.traceExternalCall(
  'ABDM',
  '/api/health-records',
  async () => {
    return fetch('https://abdm.gov.in/api/health-records');
  }
);

// Add annotations and metadata
monitoring.tracing.addAnnotation('userId', '123');
monitoring.tracing.addMetadata('requestBody', { data: 'value' });

// Get trace ID
const traceId = monitoring.tracing.getTraceId();
```

### Health Checks

```typescript
// Register custom health checks
monitoring.health.registerDatabaseCheck(async () => {
  try {
    await db.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
});

monitoring.health.registerCacheCheck(async () => {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
});

monitoring.health.registerExternalServiceCheck('ABDM', async () => {
  try {
    const response = await fetch('https://abdm.gov.in/health');
    return response.ok;
  } catch {
    return false;
  }
});

// Get health status
const health = await monitoring.health.getHealth();
// { status: 'healthy', timestamp: '2024-02-26T10:00:00.000Z' }

const detailedHealth = await monitoring.health.getDetailedHealth();
// {
//   status: 'healthy',
//   timestamp: '2024-02-26T10:00:00.000Z',
//   checks: {
//     database: { status: 'pass', responseTime: 45 },
//     cache: { status: 'pass', responseTime: 12 },
//     'external:ABDM': { status: 'pass', responseTime: 234 }
//   }
// }
```

### Alerting

```typescript
// Create standard alarms
await monitoring.alerts.createStandardAlarms('arn:aws:sns:ap-south-1:123456789:alerts');

// Create custom alarm
await monitoring.alerts.createAlarm({
  name: 'high-urgency-score',
  description: 'Alert when urgency score exceeds 90',
  metricName: 'UrgencyScore',
  namespace: 'MedhaOS',
  threshold: 90,
  comparisonOperator: 'GreaterThanThreshold',
  evaluationPeriods: 2,
  period: 300,
  statistic: 'Average',
  alarmActions: ['arn:aws:sns:ap-south-1:123456789:critical-alerts'],
});

// Send Slack alert
await monitoring.alerts.sendSlackAlert(
  'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
  'High error rate detected in triage-agent',
  'critical'
);

// Send PagerDuty alert
await monitoring.alerts.sendPagerDutyAlert(
  'YOUR_INTEGRATION_KEY',
  'Database connection failure',
  'critical',
  { service: 'triage-agent', error: 'Connection timeout' }
);
```

## Metrics Reference

### Standard Metrics

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `http_requests_total` | Counter | Total HTTP requests | method, path, status_code, service |
| `http_request_duration_seconds` | Histogram | HTTP request duration | method, path, status_code, service |
| `agent_execution_total` | Counter | Total agent executions | agent_name, success, service |
| `agent_execution_duration_seconds` | Histogram | Agent execution duration | agent_name, success, service |
| `agent_confidence_score` | Histogram | Agent confidence scores | agent_name, service |
| `active_connections` | Gauge | Active connections | service |
| `queue_depth` | Gauge | Queue depth | queue_name, service |
| `errors_total` | Counter | Total errors | error_type, service |

### CloudWatch Metrics

- `HttpRequestDuration` (Milliseconds)
- `AgentExecutionTime` (Milliseconds)
- `AgentConfidenceScore` (None)
- `ErrorCount` (Count)

## Grafana Dashboards

Pre-built Grafana dashboards are available in `infrastructure/docker/grafana/dashboards/`:

- **System Health Dashboard**: Overall system health, uptime, error rates
- **Agent Performance Dashboard**: Agent execution times, confidence scores, success rates
- **API Performance Dashboard**: Request rates, response times, status codes
- **Resource Utilization Dashboard**: CPU, memory, network, disk usage

## Best Practices

1. **Always use structured logging**: Include context like requestId, userId, agentName
2. **Record metrics for all agent executions**: Track execution time and confidence scores
3. **Use distributed tracing for multi-service calls**: Helps identify bottlenecks
4. **Register health checks for all dependencies**: Database, cache, external services
5. **Set up alerts for critical metrics**: Error rates, response times, confidence scores
6. **Use correlation IDs**: Track requests across services
7. **Monitor agent confidence scores**: Alert when below threshold (0.70)
8. **Track queue depths**: Prevent backlog buildup

## Troubleshooting

### CloudWatch logs not appearing

- Verify AWS credentials are configured
- Check IAM permissions for CloudWatch Logs
- Ensure `CLOUDWATCH_ENABLED=true`
- Check log group and stream names

### Prometheus metrics not available

- Verify `/metrics` endpoint is accessible
- Check `PROMETHEUS_ENABLED=true`
- Ensure port is not blocked by firewall

### X-Ray traces not showing

- Verify X-Ray daemon is running
- Check `XRAY_ENABLED=true`
- Ensure IAM permissions for X-Ray
- Verify daemon address is correct

## License

MIT

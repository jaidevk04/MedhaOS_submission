/**
 * Example: Express Integration with MedhaOS Monitoring
 * 
 * This example shows how to integrate the monitoring package
 * with an Express.js service.
 */

import express from 'express';
import { createMonitoring, createMonitoringConfigFromEnv } from '@medhaos/monitoring';

// Create Express app
const app = express();
app.use(express.json());

// Initialize monitoring
const monitoring = createMonitoring(createMonitoringConfigFromEnv());

// Initialize standard health checks
monitoring.initializeStandardHealthChecks();

// Register custom health checks
monitoring.health.registerDatabaseCheck(async () => {
  try {
    // Check database connection
    // await db.query('SELECT 1');
    return true;
  } catch (error) {
    monitoring.logger.error('Database health check failed', { error });
    return false;
  }
});

monitoring.health.registerCacheCheck(async () => {
  try {
    // Check Redis connection
    // await redis.ping();
    return true;
  } catch (error) {
    monitoring.logger.error('Cache health check failed', { error });
    return false;
  }
});

// Add monitoring middleware (includes X-Ray tracing and request logging)
app.use(monitoring.getExpressMiddleware());

// Add monitoring endpoints
app.get('/health', monitoring.getHealthHandler());
app.get('/health/detailed', monitoring.getDetailedHealthHandler());
app.get('/metrics', monitoring.getMetricsHandler());

// Example: API endpoint with monitoring
app.post('/api/triage', async (req, res) => {
  const requestId = req.headers['x-request-id'] as string || 'unknown';
  
  try {
    // Log request start
    monitoring.structuredLogger.logApiRequest({
      requestId,
      method: req.method,
      path: req.path,
      statusCode: 200,
      responseTime: 0,
      userId: req.body.userId,
      ip: req.ip,
    });

    // Trace agent execution
    const result = await monitoring.tracing.traceAgentExecution('triage-agent', async () => {
      const startTime = Date.now();
      
      // Simulate agent execution
      const urgencyScore = Math.floor(Math.random() * 100);
      const confidenceScore = 0.85 + Math.random() * 0.15;
      
      const executionTime = Date.now() - startTime;
      
      // Record agent metrics
      monitoring.metrics.recordAgentExecution({
        agentName: 'triage-agent',
        executionTime,
        confidenceScore,
        success: true,
        timestamp: new Date(),
      });
      
      // Log agent completion
      monitoring.structuredLogger.logAgentComplete({
        requestId,
        agentName: 'triage-agent',
        executionTime,
        confidenceScore,
        success: true,
        output: { urgencyScore },
        userId: req.body.userId,
        patientId: req.body.patientId,
      });
      
      return { urgencyScore, confidenceScore };
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Log error
    monitoring.structuredLogger.logApiError({
      requestId,
      method: req.method,
      path: req.path,
      statusCode: 500,
      error: error as Error,
      userId: req.body.userId,
    });

    // Record error metric
    monitoring.metrics.recordError('TriageError');

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Example: Database query with tracing
async function getUserById(userId: string) {
  return monitoring.tracing.traceDatabaseQuery(
    `SELECT * FROM users WHERE id = '${userId}'`,
    async () => {
      // Simulate database query
      await new Promise(resolve => setTimeout(resolve, 50));
      return { id: userId, name: 'John Doe' };
    }
  );
}

// Example: External API call with tracing
async function fetchHealthRecords(abhaId: string) {
  return monitoring.tracing.traceExternalCall(
    'ABDM',
    '/api/health-records',
    async () => {
      // Simulate external API call
      await new Promise(resolve => setTimeout(resolve, 200));
      return { records: [] };
    }
  );
}

// Setup alerts
async function setupAlerts() {
  // Create standard alarms
  const snsTopicArn = process.env.SNS_TOPIC_ARN;
  if (snsTopicArn) {
    await monitoring.alerts.createStandardAlarms(snsTopicArn);
    monitoring.logger.info('Standard alarms created');
  }

  // Setup Slack alerts (if webhook URL is configured)
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhook) {
    // Example: Send alert on high error rate
    setInterval(async () => {
      const stats = monitoring.alertManager.getStatistics();
      if (stats.bySeverity.critical > 0) {
        await monitoring.alerts.sendSlackAlert(
          slackWebhook,
          `Critical alerts detected: ${stats.bySeverity.critical}`,
          'critical'
        );
      }
    }, 60000); // Check every minute
  }
}

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  monitoring.logger.info('Service started', {
    port: PORT,
    environment: process.env.ENVIRONMENT || 'development',
  });

  // Setup alerts
  await setupAlerts();

  // Initialize logging infrastructure
  await monitoring.logAggregation.initializeLogging();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  monitoring.logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  monitoring.logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

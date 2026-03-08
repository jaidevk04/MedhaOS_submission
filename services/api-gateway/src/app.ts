import express, { Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import 'express-async-errors';
import { config } from './config';
import { logger } from './utils/logger';
import { corsMiddleware } from './middleware/cors.middleware';
import { requestIdMiddleware, correlationIdMiddleware } from './middleware/requestId.middleware';
import { sanitizeInput } from './middleware/validation.middleware';
import { globalRateLimiter } from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { createServiceProxy } from './utils/proxy';
import { setupGraphQL } from './graphql';
import { setupSwagger } from './swagger';

export const createApp = async (): Promise<Application> => {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: config.graphql.enabled ? {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https:"],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
  }));

  // CORS
  app.use(corsMiddleware);

  // Request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression());

  // Request ID and Correlation ID
  app.use(requestIdMiddleware);
  app.use(correlationIdMiddleware);

  // Logging
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));

  // Input sanitization
  app.use(sanitizeInput);

  // Rate limiting
  app.use(globalRateLimiter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API version
  app.get('/version', (req, res) => {
    res.json({
      success: true,
      version: '1.0.0',
      apiVersion: 'v1',
    });
  });

  // REST API Routes
  import patientRoutes from './routes/patient.routes';
  import encounterRoutes from './routes/encounter.routes';
  import diagnosticRoutes from './routes/diagnostic.routes';
  import appointmentRoutes from './routes/appointment.routes';

  app.use('/api/v1/patients', patientRoutes);
  app.use('/api/v1/encounters', encounterRoutes);
  app.use('/api/v1/diagnostics', diagnosticRoutes);
  app.use('/api/v1/appointments', appointmentRoutes);

  // Service proxies for direct service access
  app.use('/api/v1/auth', createServiceProxy(config.services.auth, { '^/api/v1/auth': '' }));
  app.use('/api/v1/triage', createServiceProxy(config.services.triage, { '^/api/v1/triage': '' }));
  app.use('/api/v1/cdss', createServiceProxy(config.services.cdss, { '^/api/v1/cdss': '' }));
  app.use('/api/v1/drug-safety', createServiceProxy(config.services.drugSafety, { '^/api/v1/drug-safety': '' }));
  app.use('/api/v1/diagnostic-vision', createServiceProxy(config.services.diagnosticVision, { '^/api/v1/diagnostic-vision': '' }));
  app.use('/api/v1/operational', createServiceProxy(config.services.operationalIntelligence, { '^/api/v1/operational': '' }));
  app.use('/api/v1/nurse-tasks', createServiceProxy(config.services.nurseTask, { '^/api/v1/nurse-tasks': '' }));
  app.use('/api/v1/supply-chain', createServiceProxy(config.services.supplyChain, { '^/api/v1/supply-chain': '' }));
  app.use('/api/v1/revenue-cycle', createServiceProxy(config.services.revenueCycle, { '^/api/v1/revenue-cycle': '' }));
  app.use('/api/v1/public-health', createServiceProxy(config.services.publicHealth, { '^/api/v1/public-health': '' }));
  app.use('/api/v1/post-discharge', createServiceProxy(config.services.postDischarge, { '^/api/v1/post-discharge': '' }));
  app.use('/api/v1/integration', createServiceProxy(config.services.integration, { '^/api/v1/integration': '' }));
  app.use('/api/v1/edge', createServiceProxy(config.services.edgeIntelligence, { '^/api/v1/edge': '' }));
  app.use('/api/v1/supervisor', createServiceProxy(config.services.supervisor, { '^/api/v1/supervisor': '' }));
  app.use('/api/v1/ambient-scribe', createServiceProxy(config.services.ambientScribe, { '^/api/v1/ambient-scribe': '' }));
  app.use('/api/v1/speech-nlp', createServiceProxy(config.services.speechNlp, { '^/api/v1/speech-nlp': '' }));
  app.use('/api/v1/queue', createServiceProxy(config.services.queueOptimization, { '^/api/v1/queue': '' }));

  // Setup GraphQL
  await setupGraphQL(app);

  // Setup Swagger documentation
  setupSwagger(app);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
};

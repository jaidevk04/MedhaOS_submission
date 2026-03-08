import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',

  // Service URLs
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    triage: process.env.TRIAGE_SERVICE_URL || 'http://localhost:3002',
    cdss: process.env.CDSS_SERVICE_URL || 'http://localhost:3003',
    drugSafety: process.env.DRUG_SAFETY_SERVICE_URL || 'http://localhost:3004',
    diagnosticVision: process.env.DIAGNOSTIC_VISION_SERVICE_URL || 'http://localhost:3005',
    operationalIntelligence: process.env.OPERATIONAL_INTELLIGENCE_SERVICE_URL || 'http://localhost:3006',
    nurseTask: process.env.NURSE_TASK_SERVICE_URL || 'http://localhost:3007',
    supplyChain: process.env.SUPPLY_CHAIN_SERVICE_URL || 'http://localhost:3008',
    revenueCycle: process.env.REVENUE_CYCLE_SERVICE_URL || 'http://localhost:3009',
    publicHealth: process.env.PUBLIC_HEALTH_SERVICE_URL || 'http://localhost:3010',
    postDischarge: process.env.POST_DISCHARGE_SERVICE_URL || 'http://localhost:3011',
    integration: process.env.INTEGRATION_SERVICE_URL || 'http://localhost:3012',
    edgeIntelligence: process.env.EDGE_INTELLIGENCE_SERVICE_URL || 'http://localhost:3013',
    supervisor: process.env.SUPERVISOR_SERVICE_URL || 'http://localhost:3014',
    ambientScribe: process.env.AMBIENT_SCRIBE_SERVICE_URL || 'http://localhost:3015',
    speechNlp: process.env.SPEECH_NLP_SERVICE_URL || 'http://localhost:3016',
    queueOptimization: process.env.QUEUE_OPTIMIZATION_SERVICE_URL || 'http://localhost:3017',
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/medhaos',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiry: process.env.JWT_EXPIRY || '15m',
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // AWS
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // API Documentation
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
    path: process.env.SWAGGER_PATH || '/api-docs',
  },

  // GraphQL
  graphql: {
    enabled: process.env.GRAPHQL_ENABLED === 'true',
    path: process.env.GRAPHQL_PATH || '/graphql',
    playground: process.env.GRAPHQL_PLAYGROUND === 'true',
  },

  // WebSocket
  websocket: {
    enabled: process.env.WEBSOCKET_ENABLED === 'true',
    path: process.env.WEBSOCKET_PATH || '/ws',
  },

  // Monitoring
  monitoring: {
    enabled: process.env.ENABLE_METRICS === 'true',
    port: parseInt(process.env.METRICS_PORT || '9090', 10),
  },
};

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3050', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/medhaos',
  },
  
  dynamodb: {
    region: process.env.AWS_REGION || 'ap-south-1',
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  },
  
  services: {
    supervisorAgent: process.env.SUPERVISOR_AGENT_URL || 'http://localhost:3030',
    triageAgent: process.env.TRIAGE_AGENT_URL || 'http://localhost:3020',
  },
  
  queue: {
    maxQueueSize: parseInt(process.env.MAX_QUEUE_SIZE || '100', 10),
    reorderIntervalMs: parseInt(process.env.REORDER_INTERVAL_MS || '30000', 10),
    waitTimePredictionWindowHours: parseInt(process.env.WAIT_TIME_PREDICTION_WINDOW_HOURS || '24', 10),
  },
};

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://medhaos:medhaos123@localhost:5432/medhaos',
  },
  
  dynamodb: {
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
    region: process.env.AWS_REGION || 'ap-south-1',
  },
  
  llm: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    awsRegion: process.env.AWS_REGION || 'ap-south-1',
  },
  
  agent: {
    confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.75'),
    escalationThreshold: parseFloat(process.env.ESCALATION_THRESHOLD || '0.85'),
    maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
  },
  
  eventBus: {
    name: process.env.EVENT_BUS_NAME || 'medhaos-events',
  },
};

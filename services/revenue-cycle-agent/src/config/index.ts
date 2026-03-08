import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3015', 10),
    env: process.env.NODE_ENV || 'development',
    serviceName: process.env.SERVICE_NAME || 'revenue-cycle-agent',
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/medhaos',
  },
  ai: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    awsBedrockRegion: process.env.AWS_BEDROCK_REGION || 'ap-south-1',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  coding: {
    icd10Version: process.env.ICD10_VERSION || '2024',
    cptVersion: process.env.CPT_VERSION || '2024',
    confidenceThreshold: parseFloat(process.env.CODING_CONFIDENCE_THRESHOLD || '0.85'),
  },
  insurance: {
    payerApiUrl: process.env.INSURANCE_PAYER_API_URL || '',
    apiKey: process.env.INSURANCE_API_KEY || '',
  },
  claims: {
    submissionEndpoint: process.env.CLAIM_SUBMISSION_ENDPOINT || '',
    retryAttempts: parseInt(process.env.CLAIM_RETRY_ATTEMPTS || '3', 10),
    timeoutMs: parseInt(process.env.CLAIM_TIMEOUT_MS || '30000', 10),
  },
  priorAuth: {
    endpoint: process.env.PRIOR_AUTH_ENDPOINT || '',
    timeoutMs: parseInt(process.env.PRIOR_AUTH_TIMEOUT_MS || '60000', 10),
  },
};

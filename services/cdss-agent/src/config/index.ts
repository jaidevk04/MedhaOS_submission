import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3010', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: process.env.SERVICE_NAME || 'cdss-agent',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/medhaos'
  },
  
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  
  bedrock: {
    modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0'
  },
  
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || '',
    environment: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp',
    indexName: process.env.PINECONE_INDEX_NAME || 'medhaos-medical-knowledge'
  },
  
  pubmed: {
    apiKey: process.env.PUBMED_API_KEY || '',
    baseUrl: process.env.PUBMED_BASE_URL || 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
  },
  
  clinicalTrials: {
    apiUrl: process.env.CLINICAL_TRIALS_API_URL || 'https://clinicaltrials.gov/api/v2'
  },
  
  nmc: {
    guidelinesUrl: process.env.NMC_GUIDELINES_URL || 'https://api.nmc.org.in/guidelines'
  }
};

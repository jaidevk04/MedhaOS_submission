import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3014', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: process.env.SERVICE_NAME || 'supply-chain-agent',
  logLevel: process.env.LOG_LEVEL || 'info',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/medhaos'
  },
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  models: {
    drugForecastEndpoint: process.env.DRUG_FORECAST_MODEL_ENDPOINT,
    bloodForecastEndpoint: process.env.BLOOD_FORECAST_MODEL_ENDPOINT
  },
  thresholds: {
    criticalStock: parseInt(process.env.CRITICAL_STOCK_THRESHOLD || '10', 10),
    lowStock: parseInt(process.env.LOW_STOCK_THRESHOLD || '20', 10),
    expiryWarningDays: parseInt(process.env.EXPIRY_WARNING_DAYS || '30', 10),
    bloodCriticalUnits: parseInt(process.env.BLOOD_CRITICAL_UNITS || '5', 10)
  }
};

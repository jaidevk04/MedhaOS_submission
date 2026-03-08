import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3012', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/medhaos',
  },
  
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  
  models: {
    bedOccupancyEndpoint: process.env.BED_OCCUPANCY_MODEL_ENDPOINT || 'bed-occupancy-model',
    icuDemandEndpoint: process.env.ICU_DEMAND_MODEL_ENDPOINT || 'icu-demand-model',
    staffSchedulingEndpoint: process.env.STAFF_SCHEDULING_MODEL_ENDPOINT || 'staff-scheduling-model',
  },
  
  prediction: {
    bedForecastHorizonHours: parseInt(process.env.BED_FORECAST_HORIZON_HOURS || '72', 10),
    icuForecastHorizonHours: parseInt(process.env.ICU_FORECAST_HORIZON_HOURS || '24', 10),
    capacityAlertThreshold: parseFloat(process.env.CAPACITY_ALERT_THRESHOLD || '0.8'),
    burnoutRiskThreshold: parseFloat(process.env.BURNOUT_RISK_THRESHOLD || '0.7'),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

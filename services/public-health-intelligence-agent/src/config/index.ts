import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3016', 10),
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
    diseasePredictionEndpoint: process.env.DISEASE_PREDICTION_MODEL_ENDPOINT || 'disease-prediction-model',
    infectionSurveillanceEndpoint: process.env.INFECTION_SURVEILLANCE_MODEL_ENDPOINT || 'infection-surveillance-model',
  },
  
  prediction: {
    diseaseForecastHorizonDays: parseInt(process.env.DISEASE_FORECAST_HORIZON_DAYS || '28', 10),
    outbreakProbabilityThreshold: parseFloat(process.env.OUTBREAK_PROBABILITY_THRESHOLD || '0.7'),
    infectionClusterMinCases: parseInt(process.env.INFECTION_CLUSTER_MIN_CASES || '3', 10),
    infectionClusterTimeWindowHours: parseInt(process.env.INFECTION_CLUSTER_TIME_WINDOW_HOURS || '48', 10),
  },
  
  climate: {
    apiUrl: process.env.CLIMATE_API_URL || 'https://api.openweathermap.org/data/2.5',
    apiKey: process.env.CLIMATE_API_KEY || '',
  },
  
  news: {
    apiUrl: process.env.NEWS_API_URL || 'https://newsapi.org/v2',
    apiKey: process.env.NEWS_API_KEY || '',
  },
  
  twitter: {
    apiKey: process.env.TWITTER_API_KEY || '',
    apiSecret: process.env.TWITTER_API_SECRET || '',
  },
  
  multilingual: {
    supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'hi,en,ta,te,bn,mr,gu,kn,ml,pa,or,as,ur').split(','),
  },
  
  alerts: {
    webhookUrl: process.env.ALERT_WEBHOOK_URL || '',
    rrtActivationThreshold: parseFloat(process.env.RRT_ACTIVATION_THRESHOLD || '0.85'),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

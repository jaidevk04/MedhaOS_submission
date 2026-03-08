import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3007', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/medhaos',
  },
  
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    transcribe: {
      languageCode: process.env.AWS_TRANSCRIBE_LANGUAGE_CODE || 'en-IN',
    },
  },
  
  bhashini: {
    apiKey: process.env.BHASHINI_API_KEY || '',
    apiUrl: process.env.BHASHINI_API_URL || 'https://api.bhashini.gov.in',
  },
  
  audio: {
    maxDurationSeconds: parseInt(process.env.MAX_AUDIO_DURATION_SECONDS || '3600', 10),
    sampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE || '16000', 10),
    speakerDiarizationEnabled: process.env.SPEAKER_DIARIZATION_ENABLED === 'true',
  },
  
  clinicalNlp: {
    biobertModelPath: process.env.BIOBERT_MODEL_PATH || './models/biobert',
    nerConfidenceThreshold: parseFloat(process.env.CLINICAL_NER_CONFIDENCE_THRESHOLD || '0.75'),
  },
};

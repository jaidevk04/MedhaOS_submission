import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  bhashini: {
    apiUrl: process.env.BHASHINI_API_URL || 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model',
    apiKey: process.env.BHASHINI_API_KEY || '',
    userId: process.env.BHASHINI_USER_ID || '',
  },
  
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  
  service: {
    maxAudioSizeMB: parseInt(process.env.MAX_AUDIO_SIZE_MB || '10', 10),
    supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'hi,en,ta,te,kn,ml,bn,gu,mr,pa,or,as,ur,sa,ks,ne,sd,kok,mai,doi,mni,sat').split(','),
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'hi',
  },
};

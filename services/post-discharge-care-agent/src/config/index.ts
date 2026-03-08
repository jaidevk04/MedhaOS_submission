import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3017', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/medhaos',
  },
  
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    
    polly: {
      voiceIds: {
        hindi: process.env.POLLY_VOICE_ID_HINDI || 'Aditi',
        english: process.env.POLLY_VOICE_ID_ENGLISH || 'Joanna',
        tamil: process.env.POLLY_VOICE_ID_TAMIL || 'Kajal',
        kannada: process.env.POLLY_VOICE_ID_KANNADA || 'Kajal',
      },
    },
    
    sns: {
      smsTopicArn: process.env.SNS_TOPIC_ARN_SMS,
      whatsappTopicArn: process.env.SNS_TOPIC_ARN_WHATSAPP,
    },
    
    s3: {
      bucketName: process.env.S3_BUCKET_NAME || 'medhaos-patient-content',
      medicationImagesBucket: process.env.S3_MEDICATION_IMAGES_BUCKET || 'medhaos-medication-images',
      region: process.env.S3_BUCKET_REGION || 'ap-south-1',
    },
    
    rekognition: {
      collectionId: process.env.REKOGNITION_COLLECTION_ID || 'medication-pills',
    },
  },
  
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  
  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com/v1',
    apiKey: process.env.WHATSAPP_API_KEY,
  },
  
  medicationReminder: {
    checkIntervalMinutes: parseInt(process.env.REMINDER_CHECK_INTERVAL_MINUTES || '5', 10),
    advanceMinutes: parseInt(process.env.REMINDER_ADVANCE_MINUTES || '30', 10),
    maxAttempts: parseInt(process.env.MAX_REMINDER_ATTEMPTS || '3', 10),
  },
  
  followup: {
    day7Enabled: process.env.FOLLOWUP_DAY_7_ENABLED === 'true',
    day14Enabled: process.env.FOLLOWUP_DAY_14_ENABLED === 'true',
    day30Enabled: process.env.FOLLOWUP_DAY_30_ENABLED === 'true',
    callRetryAttempts: parseInt(process.env.FOLLOWUP_CALL_RETRY_ATTEMPTS || '3', 10),
  },
  
  escalation: {
    keywords: (process.env.ESCALATION_KEYWORDS || 'fever,bleeding,severe pain,chest pain,difficulty breathing,confusion').split(','),
    phoneNumber: process.env.ESCALATION_PHONE_NUMBER,
  },
  
  content: {
    cdnUrl: process.env.VIDEO_CDN_URL || 'https://cdn.medhaos.com/videos',
    supportedLanguages: (process.env.CONTENT_LANGUAGES || 'en,hi,ta,kn,te,ml,bn,mr,gu,pa,or,as').split(','),
  },
  
  medicationVerification: {
    minConfidence: parseInt(process.env.MEDICATION_VERIFICATION_MIN_CONFIDENCE || '70', 10),
    maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE_MB || '10', 10) * 1024 * 1024,
    supportedFormats: (process.env.SUPPORTED_IMAGE_FORMATS || 'jpg,jpeg,png').split(','),
  },
};

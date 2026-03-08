import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3020', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // ABDM Configuration
  abdm: {
    baseUrl: process.env.ABDM_BASE_URL || 'https://healthidsbx.abdm.gov.in',
    clientId: process.env.ABDM_CLIENT_ID || '',
    clientSecret: process.env.ABDM_CLIENT_SECRET || '',
    redirectUri: process.env.ABDM_REDIRECT_URI || '',
  },

  // EHR Configuration
  ehr: {
    fhirBaseUrl: process.env.EHR_FHIR_BASE_URL || '',
    clientCertPath: process.env.EHR_CLIENT_CERT_PATH || '',
    clientKeyPath: process.env.EHR_CLIENT_KEY_PATH || '',
    caCertPath: process.env.EHR_CA_CERT_PATH || '',
  },

  // LIS Configuration
  lis: {
    baseUrl: process.env.LIS_BASE_URL || '',
    apiKey: process.env.LIS_API_KEY || '',
    hl7Host: process.env.LIS_HL7_HOST || '',
    hl7Port: parseInt(process.env.LIS_HL7_PORT || '2575', 10),
  },

  // PACS Configuration
  pacs: {
    aeTitle: process.env.PACS_AE_TITLE || 'MEDHAOS_PACS',
    host: process.env.PACS_HOST || '',
    port: parseInt(process.env.PACS_PORT || '11112', 10),
    callingAeTitle: process.env.PACS_CALLING_AE_TITLE || 'MEDHAOS',
    s3Bucket: process.env.PACS_S3_BUCKET || '',
  },

  // AWS Configuration
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    snsTopicArn: process.env.AWS_SNS_TOPIC_ARN || '',
  },

  // Twilio Configuration
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },

  // WhatsApp Configuration
  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  },

  // Email Configuration
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@medhaos.health',
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || '',
  },
};

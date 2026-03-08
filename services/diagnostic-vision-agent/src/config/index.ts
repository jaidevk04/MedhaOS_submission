import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3011', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: process.env.SERVICE_NAME || 'diagnostic-vision-agent',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/medhaos'
  },
  
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  
  s3: {
    bucketName: process.env.S3_BUCKET_NAME || 'medhaos-medical-images',
    bucketRegion: process.env.S3_BUCKET_REGION || 'ap-south-1',
    presignedUrlExpiry: parseInt(process.env.S3_PRESIGNED_URL_EXPIRY || '3600', 10)
  },
  
  sagemaker: {
    llavaEndpoint: process.env.SAGEMAKER_LLAVA_ENDPOINT || 'medhaos-llava-endpoint',
    biomedclipEndpoint: process.env.SAGEMAKER_BIOMEDCLIP_ENDPOINT || 'medhaos-biomedclip-endpoint',
    medsamEndpoint: process.env.SAGEMAKER_MEDSAM_ENDPOINT || 'medhaos-medsam-endpoint'
  },
  
  bedrock: {
    modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0'
  },
  
  dicom: {
    serverHost: process.env.DICOM_SERVER_HOST || 'localhost',
    serverPort: parseInt(process.env.DICOM_SERVER_PORT || '11112', 10),
    aeTitle: process.env.DICOM_AE_TITLE || 'MEDHAOS_VLM'
  },
  
  imageProcessing: {
    maxImageSizeMB: parseInt(process.env.MAX_IMAGE_SIZE_MB || '50', 10),
    supportedFormats: (process.env.SUPPORTED_FORMATS || 'jpg,jpeg,png,dcm,dicom').split(','),
    imageQuality: parseInt(process.env.IMAGE_QUALITY || '90', 10),
    thumbnailSize: parseInt(process.env.THUMBNAIL_SIZE || '256', 10)
  },
  
  model: {
    confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.75'),
    criticalFindingThreshold: parseFloat(process.env.CRITICAL_FINDING_THRESHOLD || '0.85'),
    maxProcessingTimeSeconds: parseInt(process.env.MAX_PROCESSING_TIME_SECONDS || '8', 10)
  }
};

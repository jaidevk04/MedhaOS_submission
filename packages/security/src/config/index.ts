/**
 * Security Configuration
 */

export const securityConfig = {
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    accountId: process.env.AWS_ACCOUNT_ID || '',
  },
  
  kms: {
    keyId: process.env.KMS_KEY_ID || '',
    keyAlias: process.env.KMS_KEY_ALIAS || 'alias/medhaos-master-key',
  },
  
  encryption: {
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'AES-256-GCM',
    fieldLevelEnabled: process.env.FIELD_LEVEL_ENCRYPTION_ENABLED === 'true',
  },
  
  monitoring: {
    guardDutyDetectorId: process.env.GUARDDUTY_DETECTOR_ID || '',
    securityHubArn: process.env.SECURITY_HUB_ARN || '',
  },
  
  compliance: {
    abdmMode: process.env.ABDM_COMPLIANCE_MODE || 'strict',
    dishaActEnabled: process.env.DISHA_ACT_COMPLIANCE === 'enabled',
    iso27001Enabled: process.env.ISO_27001_CONTROLS === 'enabled',
  },
  
  retention: {
    dataDays: parseInt(process.env.DATA_RETENTION_DAYS || '2555', 10), // 7 years
    logDays: parseInt(process.env.LOG_RETENTION_DAYS || '90', 10),
    auditLogDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '2555', 10),
  },
  
  privacy: {
    anonymizationEnabled: process.env.ANONYMIZATION_ENABLED === 'true',
    differentialPrivacyEpsilon: parseFloat(process.env.DIFFERENTIAL_PRIVACY_EPSILON || '0.1'),
    rightToBeForgottenEnabled: process.env.RIGHT_TO_BE_FORGOTTEN_ENABLED === 'true',
  },
  
  tls: {
    version: 'TLS1.3' as const,
    enforceHTTPS: true,
    cipherSuites: [
      'TLS_AES_128_GCM_SHA256',
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
    ],
  },
};

export default securityConfig;

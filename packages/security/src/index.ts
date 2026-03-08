/**
 * MedhaOS Security Package
 * Comprehensive security and compliance infrastructure
 */

// Configuration
export { securityConfig } from './config';

// Types
export * from './types';

// Encryption Services
export * from './encryption';

// Security Monitoring
export * from './monitoring';

// Compliance Services
export * from './compliance';

// Privacy Services
export * from './privacy';

// Default exports for convenience
import kmsService from './encryption/kms.service';
import fieldEncryptionService from './encryption/field-encryption.service';
import tlsService from './encryption/tls.service';
import guardDutyService from './monitoring/guardduty.service';
import securityHubService from './monitoring/security-hub.service';
import vulnerabilityScannerService from './monitoring/vulnerability-scanner.service';
import incidentResponseService from './monitoring/incident-response.service';
import abdmComplianceService from './compliance/abdm-compliance.service';
import dishaActComplianceService from './compliance/disha-act-compliance.service';
import iso27001ComplianceService from './compliance/iso27001-compliance.service';
import complianceReportingService from './compliance/compliance-reporting.service';
import anonymizationService from './privacy/anonymization.service';
import differentialPrivacyService from './privacy/differential-privacy.service';
import dataRetentionService from './privacy/data-retention.service';
import rightToBeForgottenService from './privacy/right-to-be-forgotten.service';

export const security = {
  // Encryption
  kms: kmsService,
  fieldEncryption: fieldEncryptionService,
  tls: tlsService,

  // Monitoring
  guardDuty: guardDutyService,
  securityHub: securityHubService,
  vulnerabilityScanner: vulnerabilityScannerService,
  incidentResponse: incidentResponseService,

  // Compliance
  abdmCompliance: abdmComplianceService,
  dishaActCompliance: dishaActComplianceService,
  iso27001Compliance: iso27001ComplianceService,
  complianceReporting: complianceReportingService,

  // Privacy
  anonymization: anonymizationService,
  differentialPrivacy: differentialPrivacyService,
  dataRetention: dataRetentionService,
  rightToBeForgotten: rightToBeForgottenService,
};

export default security;

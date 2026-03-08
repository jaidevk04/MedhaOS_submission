/**
 * Security and Compliance Types
 */

export interface EncryptionConfig {
  algorithm: string;
  keyId: string;
  keyAlias: string;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyId: string;
  algorithm: string;
  timestamp: Date;
}

export interface DecryptedData {
  plaintext: string;
  keyId: string;
  timestamp: Date;
}

export interface FieldEncryptionOptions {
  fields: string[];
  algorithm?: string;
  keyId?: string;
}

export interface SecurityFinding {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  title: string;
  description: string;
  resource: string;
  remediation?: string;
  detectedAt: Date;
  status: 'NEW' | 'NOTIFIED' | 'RESOLVED' | 'SUPPRESSED';
}

export interface VulnerabilityScan {
  scanId: string;
  target: string;
  scanType: 'CONTAINER' | 'CODE' | 'DEPENDENCY' | 'INFRASTRUCTURE';
  findings: SecurityFinding[];
  startedAt: Date;
  completedAt?: Date;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export interface SecurityIncident {
  incidentId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  description: string;
  affectedResources: string[];
  detectedAt: Date;
  resolvedAt?: Date;
  status: 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED';
  assignedTo?: string;
  actions: IncidentAction[];
}

export interface IncidentAction {
  actionId: string;
  type: 'ISOLATE' | 'BLOCK' | 'ALERT' | 'INVESTIGATE' | 'REMEDIATE';
  description: string;
  performedBy: string;
  performedAt: Date;
  result: string;
}

export interface ComplianceCheck {
  checkId: string;
  standard: 'ABDM' | 'DISHA_ACT' | 'ISO_27001' | 'HIPAA';
  control: string;
  description: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE';
  evidence?: string;
  lastChecked: Date;
  nextCheck: Date;
}

export interface ComplianceReport {
  reportId: string;
  standard: string;
  generatedAt: Date;
  overallStatus: 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT';
  checks: ComplianceCheck[];
  summary: {
    total: number;
    compliant: number;
    nonCompliant: number;
    notApplicable: number;
  };
}

export interface AnonymizationConfig {
  method: 'HASH' | 'MASK' | 'GENERALIZE' | 'SUPPRESS' | 'PSEUDONYMIZE';
  fields: string[];
  preserveFormat?: boolean;
  salt?: string;
}

export interface AnonymizedData {
  original: any;
  anonymized: any;
  method: string;
  timestamp: Date;
  reversible: boolean;
}

export interface DifferentialPrivacyConfig {
  epsilon: number;
  delta?: number;
  sensitivity: number;
  mechanism: 'LAPLACE' | 'GAUSSIAN' | 'EXPONENTIAL';
}

export interface DataRetentionPolicy {
  policyId: string;
  dataType: string;
  retentionDays: number;
  archiveAfterDays?: number;
  deleteAfterDays: number;
  legalHoldExempt: boolean;
}

export interface DataDeletionRequest {
  requestId: string;
  userId: string;
  requestedBy: string;
  requestedAt: Date;
  dataTypes: string[];
  status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  completedAt?: Date;
  verificationRequired: boolean;
}

export interface AuditLog {
  logId: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  result: 'SUCCESS' | 'FAILURE';
  details?: any;
}

export interface AccessControl {
  userId: string;
  resourceId: string;
  resourceType: string;
  permissions: string[];
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export interface TLSConfig {
  version: 'TLS1.3' | 'TLS1.2';
  cipherSuites: string[];
  certificateArn: string;
  enforceHTTPS: boolean;
}

# MedhaOS Security Package

Comprehensive security and compliance infrastructure for the MedhaOS Healthcare Intelligence Ecosystem.

## Features

### 🔐 Encryption Infrastructure
- **AWS KMS Integration**: Encryption at rest using AWS Key Management Service
- **Field-Level Encryption**: Encrypt specific PII fields in data objects
- **TLS 1.3**: Secure communications with modern TLS configuration
- **Automatic Key Rotation**: Managed encryption key lifecycle

### 🛡️ Security Monitoring
- **AWS GuardDuty**: Threat detection and malicious activity monitoring
- **AWS Security Hub**: Centralized security and compliance monitoring
- **Vulnerability Scanning**: Container, code, dependency, and infrastructure scanning
- **Incident Response**: Automated security incident management and response workflows

### ✅ Compliance Validation
- **ABDM Compliance**: Ayushman Bharat Digital Mission standards
- **DISHA Act Compliance**: Digital Information Security in Healthcare Act
- **ISO 27001 Compliance**: International information security standards
- **Compliance Reporting**: Automated compliance reports and dashboards

### 🔒 Data Privacy Controls
- **Data Anonymization**: Hash, mask, generalize, suppress, or pseudonymize sensitive data
- **Differential Privacy**: Add statistical noise to protect individual privacy
- **Data Retention**: Automated data lifecycle management and deletion
- **Right to be Forgotten**: GDPR/DISHA Act compliant data erasure workflows

## Installation

```bash
npm install @medhaos/security
```

## Usage

### Encryption

```typescript
import { security } from '@medhaos/security';

// Encrypt data with KMS
const encrypted = await security.kms.encrypt('sensitive data');

// Decrypt data
const decrypted = await security.kms.decrypt(encrypted);

// Encrypt PII fields in patient data
const patientData = {
  demographics: {
    name: 'John Doe',
    contact: {
      phone: '+91-9876543210',
      email: 'john@example.com'
    }
  }
};

const encryptedPatient = await security.fieldEncryption.encryptPatientPII(patientData);
```

### Security Monitoring

```typescript
import { security } from '@medhaos/security';

// Get security findings from GuardDuty
const findings = await security.guardDuty.getFindings();

// Get critical findings from Security Hub
const criticalFindings = await security.securityHub.getCriticalFindings();

// Start vulnerability scan
const scanId = await security.vulnerabilityScanner.startScan(
  'my-container:latest',
  'CONTAINER'
);

// Create security incident
const incidentId = await security.incidentResponse.createIncident(
  'CRITICAL',
  'Data Breach',
  'Unauthorized access detected',
  ['database-server-1']
);
```

### Compliance

```typescript
import { security } from '@medhaos/security';

// Generate compliance report
const report = await security.complianceReporting.generateComplianceReport();

// Check ABDM compliance
const abdmChecks = await security.abdmCompliance.performComplianceChecks();

// Get compliance dashboard
const dashboard = await security.complianceReporting.getComplianceDashboard();

// Export compliance report
const csv = await security.complianceReporting.exportReportCSV();
```

### Privacy

```typescript
import { security } from '@medhaos/security';

// Anonymize patient data
const anonymized = await security.anonymization.anonymizePatientData(patientData);

// Apply differential privacy to query results
const privateCount = await security.differentialPrivacy.getPrivatePatientCount(1000);

// Submit data deletion request
const requestId = await security.rightToBeForgotten.submitDeletionRequest(
  'user-123',
  'user-123',
  ['PROFILE', 'MEDICAL_RECORDS']
);

// Enforce retention policies
const result = await security.dataRetention.enforceRetentionPolicies();
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCOUNT_ID=your-account-id

# KMS Configuration
KMS_KEY_ID=your-kms-key-id
KMS_KEY_ALIAS=alias/medhaos-master-key

# Security Monitoring
GUARDDUTY_DETECTOR_ID=your-guardduty-detector-id
SECURITY_HUB_ARN=arn:aws:securityhub:ap-south-1:account-id:hub/default

# Encryption Settings
FIELD_LEVEL_ENCRYPTION_ENABLED=true
ENCRYPTION_ALGORITHM=AES-256-GCM

# Compliance Settings
ABDM_COMPLIANCE_MODE=strict
DISHA_ACT_COMPLIANCE=enabled
ISO_27001_CONTROLS=enabled

# Data Retention
DATA_RETENTION_DAYS=2555
LOG_RETENTION_DAYS=90
AUDIT_LOG_RETENTION_DAYS=2555

# Privacy Settings
ANONYMIZATION_ENABLED=true
DIFFERENTIAL_PRIVACY_EPSILON=0.1
RIGHT_TO_BE_FORGOTTEN_ENABLED=true
```

## Architecture

```
packages/security/
├── src/
│   ├── config/           # Configuration management
│   ├── encryption/       # Encryption services
│   │   ├── kms.service.ts
│   │   ├── field-encryption.service.ts
│   │   └── tls.service.ts
│   ├── monitoring/       # Security monitoring
│   │   ├── guardduty.service.ts
│   │   ├── security-hub.service.ts
│   │   ├── vulnerability-scanner.service.ts
│   │   └── incident-response.service.ts
│   ├── compliance/       # Compliance validation
│   │   ├── abdm-compliance.service.ts
│   │   ├── disha-act-compliance.service.ts
│   │   ├── iso27001-compliance.service.ts
│   │   └── compliance-reporting.service.ts
│   ├── privacy/          # Privacy controls
│   │   ├── anonymization.service.ts
│   │   ├── differential-privacy.service.ts
│   │   ├── data-retention.service.ts
│   │   └── right-to-be-forgotten.service.ts
│   ├── types.ts          # TypeScript types
│   └── index.ts          # Main export
└── README.md
```

## Security Best Practices

1. **Encryption**
   - Always encrypt PII at rest and in transit
   - Use AWS KMS for key management
   - Enable automatic key rotation
   - Use TLS 1.3 for all communications

2. **Monitoring**
   - Enable GuardDuty and Security Hub
   - Set up automated alerts for critical findings
   - Regularly scan for vulnerabilities
   - Maintain incident response procedures

3. **Compliance**
   - Perform regular compliance checks
   - Document all compliance controls
   - Maintain audit trails
   - Review compliance reports monthly

4. **Privacy**
   - Anonymize data for research and analytics
   - Apply differential privacy to aggregate queries
   - Enforce data retention policies
   - Honor right to be forgotten requests

## Requirements

- Node.js >= 18.0.0
- AWS Account with appropriate permissions
- AWS KMS key configured
- GuardDuty and Security Hub enabled

## License

Proprietary - MedhaOS Healthcare Intelligence Ecosystem

## Support

For security issues, please contact: security@medhaos.com

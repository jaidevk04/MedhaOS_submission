/**
 * ABDM (Ayushman Bharat Digital Mission) Integration Test
 * Tests integration with India's national health infrastructure
 * 
 * Requirements: 1.5, 17.4, 17.5
 */

import axios from 'axios';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  createTestAuthToken,
  TestContext,
} from '../setup';

describe('ABDM Integration', () => {
  let context: TestContext;
  let authToken: string;

  beforeAll(async () => {
    context = await setupTestEnvironment();
    authToken = await createTestAuthToken(context.testUserId);
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('ABHA ID Verification', () => {
    it('should verify valid ABHA ID', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/abdm/verify-abha`,
        {
          abhaId: '1234-5678-9012-3456',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.verified).toBe(true);
      expect(response.data.patientInfo).toBeDefined();
      expect(response.data.patientInfo.name).toBeDefined();
    });

    it('should handle invalid ABHA ID gracefully', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/abdm/verify-abha`,
        {
          abhaId: 'invalid-abha-id',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(400);
      expect(response.data.error).toBeDefined();
    });
  });

  describe('Health Record Retrieval', () => {
    it('should retrieve patient health records from ABDM within 5 seconds', async () => {
      const startTime = Date.now();

      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/abdm/fetch-health-records`,
        {
          abhaId: '1234-5678-9012-3456',
          consentToken: 'test-consent-token',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.data.records).toBeDefined();
      expect(duration).toBeLessThan(5000); // Requirement: < 5 seconds
    });

    it('should transform FHIR R4 data correctly', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/abdm/fetch-health-records`,
        {
          abhaId: '1234-5678-9012-3456',
          consentToken: 'test-consent-token',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.records).toBeDefined();
      
      // Verify FHIR transformation
      const record = response.data.records[0];
      expect(record.resourceType).toBeDefined();
      expect(record.patient).toBeDefined();
      expect(record.encounter).toBeDefined();
    });
  });

  describe('Consent Management', () => {
    it('should request patient consent for data access', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/abdm/request-consent`,
        {
          abhaId: '1234-5678-9012-3456',
          purpose: 'CLINICAL_CONSULTATION',
          dataTypes: ['DIAGNOSTIC_REPORTS', 'PRESCRIPTIONS', 'DISCHARGE_SUMMARIES'],
          validityPeriod: '24h',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.consentRequestId).toBeDefined();
      expect(response.data.status).toBe('PENDING');
    });
  });

  describe('Data Push to ABDM', () => {
    it('should push clinical encounter data to ABDM', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/abdm/push-encounter`,
        {
          abhaId: '1234-5678-9012-3456',
          encounter: {
            date: new Date().toISOString(),
            type: 'OPD',
            diagnosis: 'Type 2 Diabetes',
            prescriptions: [
              {
                drugName: 'Metformin',
                dosage: '500mg',
                frequency: 'BID',
              },
            ],
          },
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.pushed).toBe(true);
      expect(response.data.recordId).toBeDefined();
    });
  });

  describe('Compliance Validation', () => {
    it('should validate DISHA Act compliance', async () => {
      const response = await axios.get(
        `${context.apiBaseUrl}/api/v1/abdm/compliance-status`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.dishaCompliant).toBe(true);
      expect(response.data.encryptionEnabled).toBe(true);
      expect(response.data.auditLoggingEnabled).toBe(true);
    });
  });
});

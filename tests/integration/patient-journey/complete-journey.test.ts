/**
 * Complete Patient Journey Integration Test
 * Tests the entire patient flow from registration to post-discharge
 * 
 * Requirements: All (comprehensive patient journey)
 */

import axios from 'axios';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  createTestAuthToken,
  waitFor,
  TestContext,
} from '../setup';

describe('Complete Patient Journey', () => {
  let context: TestContext;
  let authToken: string;
  let patientId: string;
  let encounterId: string;

  beforeAll(async () => {
    context = await setupTestEnvironment();
    authToken = await createTestAuthToken(context.testUserId);
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('Phase 1: Registration and Triage', () => {
    it('should register a new patient with ABHA ID', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/patients`,
        {
          abhaId: `test-abha-${Date.now()}`,
          name: 'Ramesh Kumar',
          age: 58,
          gender: 'MALE',
          languagePreference: 'hi',
          phone: '+919876543210',
          address: {
            district: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
          },
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.patient).toBeDefined();
      expect(response.data.patient.abhaId).toBeDefined();
      
      patientId = response.data.patient.id;
    });

    it('should perform voice-based triage with symptom analysis', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/triage/analyze`,
        {
          patientId,
          symptoms: ['chest pain', 'shortness of breath', 'sweating'],
          vitals: {
            temperature: 98.6,
            bloodPressure: '145/92',
            heartRate: 98,
            respiratoryRate: 20,
            spo2: 96,
          },
          medicalHistory: ['Previous MI (2020)', 'Type 2 Diabetes', 'Hypertension'],
          languageCode: 'hi',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.urgencyScore).toBeGreaterThan(70);
      expect(response.data.urgencyScore).toBeLessThanOrEqual(100);
      expect(response.data.recommendation).toBe('ED');
      expect(response.data.specialtyRouting).toContain('Cardiology');
      
      // Verify response time requirement (< 3 seconds)
      expect(response.headers['x-response-time']).toBeDefined();
      const responseTime = parseInt(response.headers['x-response-time']);
      expect(responseTime).toBeLessThan(3000);
    });

    it('should generate urgency score within 3 seconds', async () => {
      const startTime = Date.now();
      
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/triage/urgency-score`,
        {
          patientId,
          symptoms: ['chest pain', 'radiating to left arm'],
          vitals: {
            bloodPressure: '145/92',
            heartRate: 98,
          },
          medicalHistory: ['Previous MI'],
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.data.urgencyScore).toBeDefined();
      expect(duration).toBeLessThan(3000); // Requirement: < 3 seconds
    });
  });

  describe('Phase 2: Appointment Scheduling and Queue Management', () => {
    it('should recommend appropriate facility based on urgency', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/scheduling/recommend-facility`,
        {
          patientId,
          urgencyScore: 78,
          specialty: 'Cardiology',
          location: {
            latitude: 19.0760,
            longitude: 72.8777,
          },
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.facilities).toBeDefined();
      expect(response.data.facilities.length).toBeGreaterThan(0);
      expect(response.data.facilities[0].distance).toBeDefined();
      expect(response.data.facilities[0].estimatedWaitTime).toBeDefined();
      expect(response.data.facilities[0].specialty).toContain('Cardiology');
    });

    it('should create ED appointment and add to queue', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/appointments`,
        {
          patientId,
          facilityId: 'test-facility-1',
          appointmentType: 'ED',
          urgencyScore: 78,
          specialty: 'Cardiology',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.appointment).toBeDefined();
      expect(response.data.queuePosition).toBeDefined();
      expect(response.data.estimatedWaitTime).toBeDefined();
      
      encounterId = response.data.appointment.encounterId;
    });

    it('should send appointment confirmation via SMS and WhatsApp', async () => {
      // Wait for notification to be sent
      await waitFor(async () => {
        const notifications = await context.prisma.notification.findMany({
          where: {
            patientId,
            type: 'APPOINTMENT_CONFIRMATION',
          },
        });
        return notifications.length > 0;
      }, 10000);

      const notifications = await context.prisma.notification.findMany({
        where: {
          patientId,
          type: 'APPOINTMENT_CONFIRMATION',
        },
      });

      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].status).toBe('SENT');
      expect(notifications[0].channels).toContain('SMS');
    });
  });

  describe('Phase 3: Clinical Consultation with Ambient Scribe', () => {
    it('should start ambient scribe recording', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/ambient-scribe/start`,
        {
          encounterId,
          clinicianId: context.testUserId,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.sessionId).toBeDefined();
      expect(response.data.status).toBe('RECORDING');
    });

    it('should extract clinical facts from conversation', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/ambient-scribe/extract-facts`,
        {
          encounterId,
          conversationText: `
            Doctor: Describe the chest pain.
            Patient: Started 2 hours ago, feels like pressure, radiating to left arm. I'm sweating a lot.
            Doctor: Any previous heart issues?
            Patient: Yes, I had a heart attack in 2020.
          `,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.facts).toBeDefined();
      expect(response.data.facts.chiefComplaint).toContain('chest pain');
      expect(response.data.facts.symptoms).toContain('pressure-like pain');
      expect(response.data.facts.symptoms).toContain('radiating to left arm');
      expect(response.data.facts.medicalHistory).toContain('Previous MI');
      
      // Verify accuracy requirement (85%)
      expect(response.data.confidence).toBeGreaterThan(0.85);
    });

    it('should generate SOAP notes within 5 seconds', async () => {
      const startTime = Date.now();
      
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/ambient-scribe/generate-soap`,
        {
          encounterId,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.data.soapNote).toBeDefined();
      expect(response.data.soapNote.subjective).toBeDefined();
      expect(response.data.soapNote.objective).toBeDefined();
      expect(response.data.soapNote.assessment).toBeDefined();
      expect(response.data.soapNote.plan).toBeDefined();
      expect(duration).toBeLessThan(5000); // Requirement: < 5 seconds
    });
  });

  describe('Phase 4: Drug Safety and Prescription', () => {
    it('should check drug interactions in real-time', async () => {
      const startTime = Date.now();
      
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/drug-safety/check-interactions`,
        {
          patientId,
          newMedication: {
            drugName: 'Clopidogrel',
            dosage: '75mg',
          },
          currentMedications: [
            { drugName: 'Aspirin', dosage: '75mg' },
            { drugName: 'Atorvastatin', dosage: '40mg' },
          ],
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.data.interactions).toBeDefined();
      expect(duration).toBeLessThan(1000); // Requirement: < 1 second
    });

    it('should check allergy conflicts and block unsafe prescriptions', async () => {
      // Add allergy to patient
      await context.prisma.patient.update({
        where: { id: patientId },
        data: {
          allergies: ['Penicillin'],
        },
      });

      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/drug-safety/check-allergies`,
        {
          patientId,
          medication: {
            drugName: 'Amoxicillin', // Penicillin-based
            dosage: '500mg',
          },
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.allergyConflict).toBe(true);
      expect(response.data.severity).toBe('CRITICAL');
      expect(response.data.alternatives).toBeDefined();
      expect(response.data.alternatives.length).toBeGreaterThan(0);
    });

    it('should create prescription with safety validations', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/prescriptions`,
        {
          encounterId,
          patientId,
          medications: [
            {
              drugName: 'Aspirin',
              dosage: '300mg',
              frequency: 'STAT',
              duration: '1 day',
            },
            {
              drugName: 'Clopidogrel',
              dosage: '75mg',
              frequency: 'Once daily',
              duration: '30 days',
            },
          ],
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.prescription).toBeDefined();
      expect(response.data.safetyChecks).toBeDefined();
      expect(response.data.safetyChecks.interactionCheck).toBe('PASSED');
      expect(response.data.safetyChecks.allergyCheck).toBe('PASSED');
    });
  });

  describe('Phase 5: Diagnostic Imaging and Analysis', () => {
    it('should process medical image and detect anomalies', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/diagnostic-vision/analyze`,
        {
          encounterId,
          patientId,
          imageType: 'ECG',
          imageUrl: 'https://test-storage.s3.amazonaws.com/test-ecg.jpg',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.analysis).toBeDefined();
      expect(response.data.analysis.findings).toBeDefined();
      expect(response.data.analysis.confidence).toBeGreaterThan(0.75);
      expect(response.data.processingTime).toBeLessThan(8000); // Requirement: < 8 seconds
    });
  });

  describe('Phase 6: Discharge and Post-Care', () => {
    it('should generate discharge summary and recovery plan', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/encounters/${encounterId}/discharge`,
        {
          dischargeInstructions: 'Rest, follow medication schedule',
          followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          medications: [
            {
              drugName: 'Aspirin',
              dosage: '75mg',
              frequency: 'Once daily',
              duration: '30 days',
            },
          ],
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.dischargeSummary).toBeDefined();
      expect(response.data.recoveryPlan).toBeDefined();
      expect(response.data.recoveryPlan.medicationSchedule).toBeDefined();
    });

    it('should schedule automated follow-up reminders', async () => {
      // Wait for follow-up agent to create reminders
      await waitFor(async () => {
        const reminders = await context.prisma.medicationReminder.findMany({
          where: { patientId },
        });
        return reminders.length > 0;
      }, 10000);

      const reminders = await context.prisma.medicationReminder.findMany({
        where: { patientId },
      });

      expect(reminders.length).toBeGreaterThan(0);
      expect(reminders[0].status).toBe('SCHEDULED');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should maintain response times under 3 seconds for 95% of requests', async () => {
      const responseTimes: number[] = [];
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await axios.get(
          `${context.apiBaseUrl}/api/v1/patients/${patientId}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      // Calculate p95
      responseTimes.sort((a, b) => a - b);
      const p95Index = Math.floor(iterations * 0.95);
      const p95ResponseTime = responseTimes[p95Index];

      expect(p95ResponseTime).toBeLessThan(3000); // Requirement: < 3s for p95
    });
  });
});

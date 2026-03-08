/**
 * Multi-Agent Workflow Integration Test
 * Tests coordination between multiple AI agents
 * 
 * Requirements: 1.3, 2.4, 3.4, 4.2, 5.5
 */

import axios from 'axios';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  createTestAuthToken,
  waitFor,
  TestContext,
} from '../setup';

describe('Multi-Agent Orchestration', () => {
  let context: TestContext;
  let authToken: string;
  let patientId: string;

  beforeAll(async () => {
    context = await setupTestEnvironment();
    authToken = await createTestAuthToken(context.testUserId);
    
    // Create test patient
    const patient = await context.prisma.patient.create({
      data: {
        abhaId: `test-abha-${Date.now()}`,
        name: 'Test Patient',
        age: 65,
        gender: 'FEMALE',
        languagePreference: 'hi',
        phone: '+919876543210',
        allergies: ['Sulfa drugs'],
        currentMedications: [
          {
            drugName: 'Metformin',
            dosage: '500mg',
            frequency: 'BID',
          },
        ],
      },
    });
    patientId = patient.id;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('Supervisor Agent Orchestration', () => {
    it('should classify event and route to appropriate agents', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/supervisor/classify-event`,
        {
          eventType: 'PATIENT_TRIAGE',
          patientId,
          symptoms: ['fever', 'cough', 'difficulty breathing'],
          urgency: 'HIGH',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.classification).toBe('CLINICAL');
      expect(response.data.priority).toBe('URGENT');
      expect(response.data.assignedAgents).toContain('AI_TRIAGE_AGENT');
      expect(response.data.assignedAgents).toContain('QUEUE_OPTIMIZATION_AGENT');
    });

    it('should decompose complex task into sub-tasks', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/supervisor/decompose-task`,
        {
          taskType: 'COMPLETE_CONSULTATION',
          patientId,
          context: {
            symptoms: ['chest pain'],
            urgencyScore: 85,
          },
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.subTasks).toBeDefined();
      expect(response.data.subTasks.length).toBeGreaterThan(3);
      expect(response.data.subTasks).toContainEqual(
        expect.objectContaining({ agent: 'AMBIENT_SCRIBE_AGENT' })
      );
      expect(response.data.subTasks).toContainEqual(
        expect.objectContaining({ agent: 'CDSS_AGENT' })
      );
      expect(response.data.subTasks).toContainEqual(
        expect.objectContaining({ agent: 'DRUG_SAFETY_AGENT' })
      );
    });

    it('should handle mixed-initiative control with confidence thresholds', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/supervisor/evaluate-confidence`,
        {
          agentName: 'DIAGNOSTIC_VISION_AGENT',
          taskResult: {
            findings: ['Possible pneumonia'],
            confidence: 0.72,
          },
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.decision).toBe('ESCALATE_TO_HUMAN');
      expect(response.data.reason).toContain('confidence below threshold');
      expect(response.data.escalationTarget).toBe('RADIOLOGIST');
    });
  });

  describe('Triage → Queue → Scheduling Workflow', () => {
    it('should execute complete triage-to-scheduling workflow', async () => {
      // Step 1: Triage
      const triageResponse = await axios.post(
        `${context.apiBaseUrl}/api/v1/triage/analyze`,
        {
          patientId,
          symptoms: ['severe headache', 'vision changes', 'nausea'],
          vitals: {
            bloodPressure: '180/110',
            heartRate: 95,
          },
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(triageResponse.status).toBe(200);
      const urgencyScore = triageResponse.data.urgencyScore;
      expect(urgencyScore).toBeGreaterThan(70);

      // Step 2: Queue Optimization (automatic)
      await waitFor(async () => {
        const queueEntry = await context.prisma.queueEntry.findFirst({
          where: { patientId },
        });
        return queueEntry !== null;
      }, 5000);

      const queueEntry = await context.prisma.queueEntry.findFirst({
        where: { patientId },
      });

      expect(queueEntry).toBeDefined();
      expect(queueEntry?.priority).toBe('HIGH');

      // Step 3: Facility Recommendation
      const facilityResponse = await axios.post(
        `${context.apiBaseUrl}/api/v1/scheduling/recommend-facility`,
        {
          patientId,
          urgencyScore,
          specialty: 'Neurology',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(facilityResponse.status).toBe(200);
      expect(facilityResponse.data.facilities[0].specialty).toContain('Neurology');
    });
  });

  describe('Ambient Scribe → CDSS → Drug Safety Workflow', () => {
    let encounterId: string;

    beforeAll(async () => {
      const encounter = await context.prisma.clinicalEncounter.create({
        data: {
          patientId,
          encounterType: 'OPD',
          chiefComplaint: 'Diabetes management',
          urgencyScore: 40,
          status: 'IN_PROGRESS',
        },
      });
      encounterId = encounter.id;
    });

    it('should coordinate documentation, decision support, and safety checks', async () => {
      // Step 1: Ambient Scribe extracts facts
      const scribeResponse = await axios.post(
        `${context.apiBaseUrl}/api/v1/ambient-scribe/extract-facts`,
        {
          encounterId,
          conversationText: `
            Doctor: How is your blood sugar control?
            Patient: My fasting sugar is around 180-200.
            Doctor: Any symptoms of high sugar?
            Patient: Yes, increased thirst and frequent urination.
          `,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(scribeResponse.status).toBe(200);
      const extractedFacts = scribeResponse.data.facts;

      // Step 2: CDSS provides recommendations
      const cdssResponse = await axios.post(
        `${context.apiBaseUrl}/api/v1/cdss/recommend`,
        {
          patientId,
          encounterId,
          clinicalFacts: extractedFacts,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(cdssResponse.status).toBe(200);
      expect(cdssResponse.data.recommendations).toBeDefined();
      expect(cdssResponse.data.recommendations.length).toBeGreaterThan(0);

      // Step 3: Drug Safety checks proposed medication
      const proposedMedication = cdssResponse.data.recommendations[0].medication;
      
      const safetyResponse = await axios.post(
        `${context.apiBaseUrl}/api/v1/drug-safety/check-interactions`,
        {
          patientId,
          newMedication: proposedMedication,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(safetyResponse.status).toBe(200);
      expect(safetyResponse.data.interactions).toBeDefined();
      expect(safetyResponse.data.allergyCheck).toBe('PASSED');
    });
  });

  describe('Operational Intelligence Agents Coordination', () => {
    it('should coordinate bed occupancy, ICU demand, and staff scheduling', async () => {
      // Trigger operational intelligence workflow
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/operational-intelligence/forecast`,
        {
          facilityId: 'test-facility-1',
          forecastHorizon: 24,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.bedOccupancyForecast).toBeDefined();
      expect(response.data.icuDemandForecast).toBeDefined();
      expect(response.data.staffingRecommendations).toBeDefined();

      // Verify agents coordinated
      expect(response.data.agentsInvolved).toContain('BED_OCCUPANCY_AGENT');
      expect(response.data.agentsInvolved).toContain('ICU_DEMAND_AGENT');
      expect(response.data.agentsInvolved).toContain('STAFF_SCHEDULING_AGENT');
    });
  });

  describe('Supply Chain Agents Coordination', () => {
    it('should coordinate drug inventory and blood bank forecasting', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/supply-chain/forecast`,
        {
          facilityId: 'test-facility-1',
          forecastDays: 7,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.drugInventoryForecast).toBeDefined();
      expect(response.data.bloodBankForecast).toBeDefined();
      expect(response.data.reorderRecommendations).toBeDefined();
    });
  });

  describe('Public Health Intelligence Workflow', () => {
    it('should coordinate disease prediction, surveillance, and media scanning', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/public-health/analyze-outbreak-risk`,
        {
          district: 'Mumbai',
          state: 'Maharashtra',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.outbreakProbability).toBeDefined();
      expect(response.data.syndromi cIndicators).toBeDefined();
      expect(response.data.mediaEvents).toBeDefined();
      expect(response.data.environmentalFactors).toBeDefined();

      // Verify multi-agent coordination
      expect(response.data.agentsInvolved).toContain('REGIONAL_DISEASE_PREDICTION_AGENT');
      expect(response.data.agentsInvolved).toContain('INFECTION_SURVEILLANCE_AGENT');
      expect(response.data.agentsInvolved).toContain('MEDIA_SCANNING_AGENT');
    });
  });

  describe('Agent Performance Metrics', () => {
    it('should track agent execution times and confidence scores', async () => {
      const response = await axios.get(
        `${context.apiBaseUrl}/api/v1/supervisor/agent-metrics`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          params: {
            timeRange: '1h',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.metrics).toBeDefined();
      
      // Verify each agent has metrics
      const agentNames = Object.keys(response.data.metrics);
      expect(agentNames.length).toBeGreaterThan(5);

      // Check metric structure
      const sampleAgent = response.data.metrics[agentNames[0]];
      expect(sampleAgent.avgExecutionTime).toBeDefined();
      expect(sampleAgent.avgConfidenceScore).toBeDefined();
      expect(sampleAgent.successRate).toBeDefined();
      expect(sampleAgent.escalationRate).toBeDefined();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle agent failure and fallback gracefully', async () => {
      // Simulate agent failure scenario
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/supervisor/handle-agent-failure`,
        {
          failedAgent: 'DIAGNOSTIC_VISION_AGENT',
          taskId: 'test-task-123',
          errorType: 'TIMEOUT',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.recoveryAction).toBe('ESCALATE_TO_HUMAN');
      expect(response.data.fallbackAgent).toBeDefined();
      expect(response.data.notificationSent).toBe(true);
    });

    it('should retry transient failures with exponential backoff', async () => {
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/supervisor/retry-task`,
        {
          taskId: 'test-task-456',
          errorType: 'TRANSIENT',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.retryAttempts).toBeLessThanOrEqual(3);
      expect(response.data.backoffStrategy).toBe('EXPONENTIAL');
    });
  });
});

/**
 * API Performance Benchmark Tests
 * Tests system performance under various load conditions
 * 
 * Requirements: 18.1, 18.2, 18.3
 */

import axios from 'axios';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  createTestAuthToken,
  TestContext,
} from '../setup';

describe('API Performance Benchmarks', () => {
  let context: TestContext;
  let authToken: string;

  beforeAll(async () => {
    context = await setupTestEnvironment();
    authToken = await createTestAuthToken(context.testUserId);
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('Response Time Requirements', () => {
    it('should maintain < 3s response time for 95% of API requests', async () => {
      const iterations = 100;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await axios.get(
          `${context.apiBaseUrl}/api/v1/patients/${context.testPatientId}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      // Calculate percentiles
      responseTimes.sort((a, b) => a - b);
      const p50 = responseTimes[Math.floor(iterations * 0.50)];
      const p95 = responseTimes[Math.floor(iterations * 0.95)];
      const p99 = responseTimes[Math.floor(iterations * 0.99)];

      console.log(`Performance Metrics:
        P50: ${p50}ms
        P95: ${p95}ms
        P99: ${p99}ms
      `);

      expect(p95).toBeLessThan(3000); // Requirement: < 3s for P95
    });

    it('should process triage requests within 3 seconds', async () => {
      const iterations = 50;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await axios.post(
          `${context.apiBaseUrl}/api/v1/triage/analyze`,
          {
            patientId: context.testPatientId,
            symptoms: ['fever', 'cough'],
            vitals: {
              temperature: 101.5,
              heartRate: 85,
            },
          },
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / iterations;
      expect(avgResponseTime).toBeLessThan(3000);
    });

    it('should process medical images within 8 seconds', async () => {
      const iterations = 20;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await axios.post(
          `${context.apiBaseUrl}/api/v1/diagnostic-vision/analyze`,
          {
            patientId: context.testPatientId,
            imageType: 'X-RAY',
            imageUrl: 'https://test-storage.s3.amazonaws.com/test-xray.jpg',
          },
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      responseTimes.sort((a, b) => a - b);
      const p90 = responseTimes[Math.floor(iterations * 0.90)];
      
      expect(p90).toBeLessThan(8000); // Requirement: < 8s for 90% of cases
    });
  });

  describe('Throughput Benchmarks', () => {
    it('should handle 1000 concurrent patient registrations', async () => {
      const concurrentRequests = 1000;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        axios.post(
          `${context.apiBaseUrl}/api/v1/patients`,
          {
            abhaId: `test-abha-${Date.now()}-${i}`,
            name: `Test Patient ${i}`,
            age: 30 + (i % 50),
            gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
            languagePreference: 'en',
            phone: `+9198765${String(i).padStart(5, '0')}`,
          },
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        ).catch(err => ({ error: err.message }))
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successCount = results.filter(r => !('error' in r)).length;
      const throughput = (successCount / duration) * 1000; // requests per second

      console.log(`Throughput Test Results:
        Total Requests: ${concurrentRequests}
        Successful: ${successCount}
        Duration: ${duration}ms
        Throughput: ${throughput.toFixed(2)} req/s
      `);

      expect(successCount).toBeGreaterThan(concurrentRequests * 0.95); // 95% success rate
      expect(throughput).toBeGreaterThan(50); // At least 50 req/s
    });
  });

  describe('Database Query Performance', () => {
    it('should retrieve patient records with complex joins within 500ms', async () => {
      const iterations = 50;
      const queryTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await axios.get(
          `${context.apiBaseUrl}/api/v1/patients/${context.testPatientId}/complete-history`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        const endTime = Date.now();
        queryTimes.push(endTime - startTime);
      }

      const avgQueryTime = queryTimes.reduce((a, b) => a + b, 0) / iterations;
      expect(avgQueryTime).toBeLessThan(500);
    });
  });

  describe('Cache Performance', () => {
    it('should serve cached responses within 50ms', async () => {
      // First request (cache miss)
      await axios.get(
        `${context.apiBaseUrl}/api/v1/patients/${context.testPatientId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      // Subsequent requests (cache hit)
      const iterations = 20;
      const cacheTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await axios.get(
          `${context.apiBaseUrl}/api/v1/patients/${context.testPatientId}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        const endTime = Date.now();
        cacheTimes.push(endTime - startTime);
      }

      const avgCacheTime = cacheTimes.reduce((a, b) => a + b, 0) / iterations;
      expect(avgCacheTime).toBeLessThan(50);
    });
  });

  describe('WebSocket Performance', () => {
    it('should maintain real-time updates with < 100ms latency', async () => {
      // This would test WebSocket latency
      // Simplified for integration test
      const response = await axios.post(
        `${context.apiBaseUrl}/api/v1/websocket/test-latency`,
        {
          iterations: 50,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.avgLatency).toBeLessThan(100);
    });
  });

  describe('AI Model Inference Performance', () => {
    it('should complete urgency scoring within 2 seconds', async () => {
      const iterations = 30;
      const inferenceTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await axios.post(
          `${context.apiBaseUrl}/api/v1/triage/urgency-score`,
          {
            patientId: context.testPatientId,
            symptoms: ['chest pain', 'shortness of breath'],
            vitals: {
              bloodPressure: '140/90',
              heartRate: 95,
            },
          },
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        const endTime = Date.now();
        inferenceTimes.push(endTime - startTime);
      }

      const avgInferenceTime = inferenceTimes.reduce((a, b) => a + b, 0) / iterations;
      expect(avgInferenceTime).toBeLessThan(2000);
    });
  });

  describe('Resource Utilization', () => {
    it('should maintain memory usage within acceptable limits', async () => {
      const response = await axios.get(
        `${context.apiBaseUrl}/api/v1/system/metrics`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.memoryUsage).toBeDefined();
      expect(response.data.memoryUsage.heapUsed).toBeLessThan(
        response.data.memoryUsage.heapTotal * 0.90
      ); // < 90% heap usage
    });

    it('should maintain CPU usage under 70% during normal load', async () => {
      const response = await axios.get(
        `${context.apiBaseUrl}/api/v1/system/metrics`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.cpuUsage).toBeDefined();
      expect(response.data.cpuUsage).toBeLessThan(70);
    });
  });
});

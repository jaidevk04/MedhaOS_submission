/**
 * Endurance Test (Soak Test)
 * Tests system stability over 24 hours with 2,000 concurrent users
 * Detects memory leaks and performance degradation
 * 
 * Requirements: 18.1, 18.3
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const memoryLeakIndicator = new Trend('memory_leak_indicator');
const hourlyThroughput = new Counter('hourly_throughput');

export const options = {
  stages: [
    { duration: '10m', target: 2000 },  // Ramp up to 2000 users
    { duration: '24h', target: 2000 },  // Sustain for 24 hours
    { duration: '10m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],     // Response time should not degrade
    http_req_failed: ['rate<0.01'],        // Error rate should stay low
    memory_leak_indicator: ['avg<1.1'],    // Response time should not increase > 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const testPatients = JSON.parse(open('../scenarios/test-patients.json'));

let baselineResponseTime = null;
let hourlyResponseTimes = [];

export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: 'loadtest@medhaos.test',
    password: 'loadtest-password',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  return {
    authToken: loginRes.json('token'),
    startTime: Date.now(),
  };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.authToken}`,
  };

  const elapsedHours = (Date.now() - data.startTime) / (1000 * 60 * 60);

  // Simulate realistic patient workflows
  const scenario = Math.random();

  if (scenario < 0.3) {
    triageWorkflow(headers);
  } else if (scenario < 0.6) {
    appointmentWorkflow(headers);
  } else {
    recordsWorkflow(headers);
  }

  // Track response time degradation (memory leak indicator)
  const currentResponseTime = responseTime.values?.avg || 0;
  
  if (!baselineResponseTime && elapsedHours > 0.5) {
    // Set baseline after 30 minutes
    baselineResponseTime = currentResponseTime;
  }

  if (baselineResponseTime && currentResponseTime > 0) {
    const degradationRatio = currentResponseTime / baselineResponseTime;
    memoryLeakIndicator.add(degradationRatio);

    // Log hourly metrics
    const currentHour = Math.floor(elapsedHours);
    if (!hourlyResponseTimes[currentHour]) {
      hourlyResponseTimes[currentHour] = currentResponseTime;
      console.log(`Hour ${currentHour}: Avg response time ${currentResponseTime.toFixed(2)}ms (${((degradationRatio - 1) * 100).toFixed(2)}% change from baseline)`);
    }
  }

  hourlyThroughput.add(1);

  sleep(Math.random() * 5 + 2);
}

function triageWorkflow(headers) {
  const patient = testPatients[Math.floor(Math.random() * testPatients.length)];

  const start = Date.now();
  const res = http.post(
    `${BASE_URL}/api/v1/triage/analyze`,
    JSON.stringify({
      patientId: patient.id,
      symptoms: ['fever', 'cough'],
      vitals: {
        temperature: 101.5,
        heartRate: 85,
      },
    }),
    { headers }
  );

  const duration = Date.now() - start;
  responseTime.add(duration);
  errorRate.add(res.status !== 200);

  check(res, {
    'triage successful': (r) => r.status === 200,
  });
}

function appointmentWorkflow(headers) {
  const patient = testPatients[Math.floor(Math.random() * testPatients.length)];

  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/api/v1/patients/${patient.id}/appointments`,
    { headers }
  );

  const duration = Date.now() - start;
  responseTime.add(duration);
  errorRate.add(res.status !== 200);

  check(res, {
    'appointments fetch successful': (r) => r.status === 200,
  });
}

function recordsWorkflow(headers) {
  const patient = testPatients[Math.floor(Math.random() * testPatients.length)];

  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/api/v1/patients/${patient.id}/records`,
    { headers }
  );

  const duration = Date.now() - start;
  responseTime.add(duration);
  errorRate.add(res.status !== 200);

  check(res, {
    'records fetch successful': (r) => r.status === 200,
  });
}

export function handleSummary(data) {
  const testDurationHours = (Date.now() - data.setup.startTime) / (1000 * 60 * 60);
  
  const summary = {
    testType: 'endurance',
    duration: `${testDurationHours.toFixed(2)} hours`,
    totalRequests: data.metrics.http_reqs.values.count,
    avgThroughput: data.metrics.http_reqs.values.rate,
    errorRate: data.metrics.errors.values.rate,
    responseTimeP50: data.metrics.http_req_duration.values['p(50)'],
    responseTimeP95: data.metrics.http_req_duration.values['p(95)'],
    responseTimeP99: data.metrics.http_req_duration.values['p(99)'],
    memoryLeakIndicator: data.metrics.memory_leak_indicator.values.avg,
    degradationDetected: data.metrics.memory_leak_indicator.values.avg > 1.1,
    hourlyMetrics: hourlyResponseTimes,
    timestamp: new Date().toISOString(),
  };

  console.log('\n=== Endurance Test Summary ===');
  console.log(`Duration: ${summary.duration}`);
  console.log(`Total Requests: ${summary.totalRequests}`);
  console.log(`Error Rate: ${(summary.errorRate * 100).toFixed(2)}%`);
  console.log(`Memory Leak Indicator: ${summary.memoryLeakIndicator.toFixed(2)}x`);
  console.log(`Degradation Detected: ${summary.degradationDetected ? 'YES' : 'NO'}`);

  return {
    'results/endurance-test-summary.json': JSON.stringify(summary, null, 2),
  };
}

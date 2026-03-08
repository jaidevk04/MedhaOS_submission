/**
 * Stress Test
 * Tests system with 10,000 concurrent users
 * 
 * Requirements: 18.1, 18.2, 18.3
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const triageResponseTime = new Trend('triage_response_time');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// Stress test configuration
export const options = {
  stages: [
    { duration: '2m', target: 1000 },   // Ramp up to 1000
    { duration: '3m', target: 5000 },   // Ramp up to 5000
    { duration: '5m', target: 10000 },  // Ramp up to 10000 (stress)
    { duration: '10m', target: 10000 }, // Stay at 10000
    { duration: '5m', target: 5000 },   // Ramp down to 5000
    { duration: '3m', target: 1000 },   // Ramp down to 1000
    { duration: '2m', target: 0 },      // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // Allow higher latency under stress
    http_req_failed: ['rate<0.05'],    // Allow up to 5% error rate under stress
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const testPatients = JSON.parse(open('../scenarios/test-patients.json'));
const testSymptoms = JSON.parse(open('../scenarios/test-symptoms.json'));

export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: 'loadtest@medhaos.test',
    password: 'loadtest-password',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  return {
    authToken: loginRes.json('token'),
  };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.authToken}`,
  };

  // Weighted scenario distribution
  const scenario = Math.random();

  if (scenario < 0.5) {
    // 50% - High-priority triage (stress on AI models)
    triageStressTest(headers);
  } else if (scenario < 0.8) {
    // 30% - API read operations (stress on database)
    readOperationsStress(headers);
  } else {
    // 20% - Write operations (stress on database writes)
    writeOperationsStress(headers);
  }

  sleep(Math.random() * 2 + 0.5); // Shorter sleep for stress test
}

function triageStressTest(headers) {
  const patient = testPatients[Math.floor(Math.random() * testPatients.length)];
  const symptoms = testSymptoms[Math.floor(Math.random() * testSymptoms.length)];

  const triageStart = Date.now();
  const triageRes = http.post(
    `${BASE_URL}/api/v1/triage/analyze`,
    JSON.stringify({
      patientId: patient.id,
      symptoms: symptoms.symptoms,
      vitals: symptoms.vitals,
      medicalHistory: patient.medicalHistory,
    }),
    { 
      headers,
      timeout: '10s', // Longer timeout for stress conditions
    }
  );

  const triageDuration = Date.now() - triageStart;
  triageResponseTime.add(triageDuration);

  const success = triageRes.status === 200;
  errorRate.add(!success);
  
  if (success) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
  }

  check(triageRes, {
    'triage completed': (r) => r.status === 200 || r.status === 503, // Accept 503 under stress
  });
}

function readOperationsStress(headers) {
  const patient = testPatients[Math.floor(Math.random() * testPatients.length)];

  // Parallel read requests to stress database
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/v1/patients/${patient.id}`, null, { headers }],
    ['GET', `${BASE_URL}/api/v1/patients/${patient.id}/records`, null, { headers }],
    ['GET', `${BASE_URL}/api/v1/patients/${patient.id}/prescriptions`, null, { headers }],
    ['GET', `${BASE_URL}/api/v1/patients/${patient.id}/appointments`, null, { headers }],
  ]);

  responses.forEach((res) => {
    const success = res.status === 200;
    errorRate.add(!success);
    
    if (success) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
  });

  check(responses[0], {
    'batch reads completed': (r) => r.status === 200 || r.status === 503,
  });
}

function writeOperationsStress(headers) {
  const patient = testPatients[Math.floor(Math.random() * testPatients.length)];

  // Create appointment (write operation)
  const appointmentRes = http.post(
    `${BASE_URL}/api/v1/appointments`,
    JSON.stringify({
      patientId: patient.id,
      facilityId: 'test-facility-1',
      appointmentType: 'OPD',
      date: '2026-03-15',
      time: '14:00',
    }),
    { 
      headers,
      timeout: '10s',
    }
  );

  const success = appointmentRes.status === 201;
  errorRate.add(!success);
  
  if (success) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
  }

  check(appointmentRes, {
    'write operation completed': (r) => r.status === 201 || r.status === 503,
  });
}

export function handleSummary(data) {
  return {
    'results/stress-test-summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n' + indent + '=== Stress Test Summary ===\n\n';
  
  summary += indent + `Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += indent + `Successful: ${data.metrics.successful_requests.values.count}\n`;
  summary += indent + `Failed: ${data.metrics.failed_requests.values.count}\n`;
  summary += indent + `Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%\n\n`;
  
  summary += indent + 'Response Times:\n';
  summary += indent + `  P50: ${data.metrics.http_req_duration.values['p(50)']}ms\n`;
  summary += indent + `  P95: ${data.metrics.http_req_duration.values['p(95)']}ms\n`;
  summary += indent + `  P99: ${data.metrics.http_req_duration.values['p(99)']}ms\n\n`;
  
  summary += indent + `Triage Response Time (avg): ${data.metrics.triage_response_time.values.avg}ms\n`;
  
  return summary;
}

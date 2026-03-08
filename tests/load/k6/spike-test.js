/**
 * Spike Test
 * Tests sudden traffic increase from 1,000 to 10,000 users
 * Validates auto-scaling response
 * 
 * Requirements: 18.1, 18.2
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const scalingResponseTime = new Trend('scaling_response_time');

export const options = {
  stages: [
    { duration: '2m', target: 1000 },   // Normal load
    { duration: '30s', target: 10000 }, // Sudden spike!
    { duration: '5m', target: 10000 },  // Sustain spike
    { duration: '2m', target: 1000 },   // Drop back
    { duration: '2m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<8000'], // Allow higher latency during spike
    http_req_failed: ['rate<0.10'],    // Allow up to 10% errors during spike
    scaling_response_time: ['p(95)<120000'], // Auto-scaling should respond within 2 minutes
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const testPatients = JSON.parse(open('../scenarios/test-patients.json'));

let spikeStartTime = null;
let scalingDetected = false;

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

  // Detect spike start (when VUs suddenly increase)
  if (__VU > 1000 && !spikeStartTime) {
    spikeStartTime = Date.now();
  }

  // Simple health check to measure response
  const healthRes = http.get(`${BASE_URL}/api/v1/health`, { headers });
  
  const success = healthRes.status === 200;
  errorRate.add(!success);
  responseTime.add(healthRes.timings.duration);

  // Detect when system recovers (response time improves)
  if (spikeStartTime && !scalingDetected && healthRes.timings.duration < 3000) {
    const scalingTime = Date.now() - spikeStartTime;
    scalingResponseTime.add(scalingTime);
    scalingDetected = true;
    console.log(`Auto-scaling detected after ${scalingTime}ms`);
  }

  check(healthRes, {
    'health check passed': (r) => r.status === 200,
    'response time acceptable': (r) => r.timings.duration < 10000,
  });

  // Perform actual work
  const patient = testPatients[Math.floor(Math.random() * testPatients.length)];
  
  const patientRes = http.get(`${BASE_URL}/api/v1/patients/${patient.id}`, { headers });
  errorRate.add(patientRes.status !== 200);

  sleep(Math.random() * 2);
}

export function handleSummary(data) {
  const summary = {
    testType: 'spike',
    totalRequests: data.metrics.http_reqs.values.count,
    errorRate: data.metrics.errors.values.rate,
    responseTimeP95: data.metrics.http_req_duration.values['p(95)'],
    scalingResponseTime: data.metrics.scaling_response_time?.values['p(95)'] || 'N/A',
    timestamp: new Date().toISOString(),
  };

  return {
    'results/spike-test-summary.json': JSON.stringify(summary, null, 2),
  };
}

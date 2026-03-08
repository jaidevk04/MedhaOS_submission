/**
 * Normal Load Test
 * Simulates 1,000 concurrent users for 30 minutes
 * 
 * Requirements: 18.1, 18.2, 18.3
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const triageResponseTime = new Trend('triage_response_time');
const apiResponseTime = new Trend('api_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '5m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 500 },   // Ramp up to 500 users
    { duration: '10m', target: 1000 }, // Ramp up to 1000 users
    { duration: '10m', target: 1000 }, // Stay at 1000 users
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests must complete below 3s
    http_req_failed: ['rate<0.01'],    // Error rate must be below 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const testPatients = JSON.parse(open('../scenarios/test-patients.json'));
const testSymptoms = JSON.parse(open('../scenarios/test-symptoms.json'));

export function setup() {
  // Login and get auth token
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: 'loadtest@medhaos.test',
    password: 'loadtest-password',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
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

  // Simulate patient journey
  const scenario = Math.random();

  if (scenario < 0.4) {
    // 40% - Triage workflow
    triageWorkflow(headers);
  } else if (scenario < 0.7) {
    // 30% - Appointment booking
    appointmentWorkflow(headers);
  } else if (scenario < 0.9) {
    // 20% - View records
    viewRecordsWorkflow(headers);
  } else {
    // 10% - Medication reminders
    medicationWorkflow(headers);
  }

  sleep(Math.random() * 5 + 2); // Random sleep between 2-7 seconds
}

function triageWorkflow(headers) {
  const patient = testPatients[Math.floor(Math.random() * testPatients.length)];
  const symptoms = testSymptoms[Math.floor(Math.random() * testSymptoms.length)];

  // Step 1: Get patient info
  const patientRes = http.get(`${BASE_URL}/api/v1/patients/${patient.id}`, { headers });
  
  check(patientRes, {
    'patient fetch successful': (r) => r.status === 200,
  });
  
  errorRate.add(patientRes.status !== 200);
  apiResponseTime.add(patientRes.timings.duration);

  sleep(1);

  // Step 2: Submit triage request
  const triageStart = Date.now();
  const triageRes = http.post(
    `${BASE_URL}/api/v1/triage/analyze`,
    JSON.stringify({
      patientId: patient.id,
      symptoms: symptoms.symptoms,
      vitals: symptoms.vitals,
      medicalHistory: patient.medicalHistory,
    }),
    { headers }
  );

  const triageDuration = Date.now() - triageStart;
  triageResponseTime.add(triageDuration);

  check(triageRes, {
    'triage successful': (r) => r.status === 200,
    'triage response time < 3s': (r) => triageDuration < 3000,
    'urgency score present': (r) => r.json('urgencyScore') !== undefined,
  });

  errorRate.add(triageRes.status !== 200);

  sleep(2);

  // Step 3: Get facility recommendations
  if (triageRes.status === 200) {
    const urgencyScore = triageRes.json('urgencyScore');
    
    const facilityRes = http.post(
      `${BASE_URL}/api/v1/scheduling/recommend-facility`,
      JSON.stringify({
        patientId: patient.id,
        urgencyScore: urgencyScore,
        specialty: 'General Medicine',
      }),
      { headers }
    );

    check(facilityRes, {
      'facility recommendation successful': (r) => r.status === 200,
    });

    errorRate.add(facilityRes.status !== 200);
  }
}

function appointmentWorkflow(headers) {
  const patient = testPatients[Math.floor(Math.random() * testPatients.length)];

  // Step 1: Get available slots
  const slotsRes = http.get(
    `${BASE_URL}/api/v1/appointments/available-slots?facilityId=test-facility-1&date=2026-03-10`,
    { headers }
  );

  check(slotsRes, {
    'slots fetch successful': (r) => r.status === 200,
  });

  errorRate.add(slotsRes.status !== 200);

  sleep(2);

  // Step 2: Book appointment
  if (slotsRes.status === 200) {
    const bookingRes = http.post(
      `${BASE_URL}/api/v1/appointments`,
      JSON.stringify({
        patientId: patient.id,
        facilityId: 'test-facility-1',
        appointmentType: 'OPD',
        date: '2026-03-10',
        time: '10:00',
      }),
      { headers }
    );

    check(bookingRes, {
      'appointment booking successful': (r) => r.status === 201,
    });

    errorRate.add(bookingRes.status !== 201);
  }
}

function viewRecordsWorkflow(headers) {
  const patient = testPatients[Math.floor(Math.random() * testPatients.length)];

  // Step 1: Get patient records
  const recordsRes = http.get(
    `${BASE_URL}/api/v1/patients/${patient.id}/records`,
    { headers }
  );

  check(recordsRes, {
    'records fetch successful': (r) => r.status === 200,
  });

  errorRate.add(recordsRes.status !== 200);
  apiResponseTime.add(recordsRes.timings.duration);

  sleep(1);

  // Step 2: Get prescriptions
  const prescriptionsRes = http.get(
    `${BASE_URL}/api/v1/patients/${patient.id}/prescriptions`,
    { headers }
  );

  check(prescriptionsRes, {
    'prescriptions fetch successful': (r) => r.status === 200,
  });

  errorRate.add(prescriptionsRes.status !== 200);
}

function medicationWorkflow(headers) {
  const patient = testPatients[Math.floor(Math.random() * testPatients.length)];

  // Get medication reminders
  const remindersRes = http.get(
    `${BASE_URL}/api/v1/patients/${patient.id}/medication-reminders`,
    { headers }
  );

  check(remindersRes, {
    'reminders fetch successful': (r) => r.status === 200,
  });

  errorRate.add(remindersRes.status !== 200);

  sleep(1);

  // Mark medication as taken
  if (remindersRes.status === 200 && remindersRes.json('reminders').length > 0) {
    const reminderId = remindersRes.json('reminders')[0].id;
    
    const markTakenRes = http.post(
      `${BASE_URL}/api/v1/medication-reminders/${reminderId}/mark-taken`,
      null,
      { headers }
    );

    check(markTakenRes, {
      'mark taken successful': (r) => r.status === 200,
    });

    errorRate.add(markTakenRes.status !== 200);
  }
}

export function teardown(data) {
  // Cleanup if needed
  console.log('Load test completed');
}

# MedhaOS API Documentation

## Overview

MedhaOS provides a comprehensive REST API, GraphQL API, and WebSocket API for integrating with the Healthcare Intelligence Ecosystem. This document covers all available endpoints, authentication methods, request/response formats, and integration examples.

**Base URLs:**
- Production: `https://api.medhaos.health/v1`
- Staging: `https://api-staging.medhaos.health/v1`
- Development: `http://localhost:3000/api/v1`

**API Version:** v1.0.0  
**Last Updated:** February 26, 2026

## Table of Contents

1. [Authentication](#authentication)
2. [REST API Endpoints](#rest-api-endpoints)
3. [GraphQL API](#graphql-api)
4. [WebSocket API](#websocket-api)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Code Examples](#code-examples)

---

## Authentication

### OAuth 2.0 Flow

MedhaOS uses OAuth 2.0 with JWT tokens for authentication.

**1. Obtain Access Token**

```http
POST /auth/token
Content-Type: application/json

{
  "username": "doctor@hospital.com",
  "password": "secure_password",
  "grant_type": "password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900,
  "scope": "read:patients write:prescriptions"
}
```

**2. Use Access Token**

Include the access token in the Authorization header:

```http
GET /patients/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**3. Refresh Token**

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "grant_type": "refresh_token"
}
```

### API Key Authentication

For server-to-server integrations:

```http
GET /patients/123
X-API-Key: your_api_key_here
```

---

## REST API Endpoints

### Patient Management

#### Get Patient by ID

```http
GET /patients/{patient_id}
```

**Parameters:**
- `patient_id` (path, required): UUID of the patient

**Response (200 OK):**
```json
{
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "abha_id": "1234-5678-9012",
  "demographics": {
    "name": "Ramesh Kumar",
    "age": 58,
    "gender": "male",
    "language_preference": "hindi",
    "contact": {
      "phone": "+91-9876543210",
      "whatsapp": "+91-9876543210",
      "email": "ramesh@example.com"
    }
  },
  "medical_history": [
    {
      "condition": "Previous MI",
      "diagnosed_date": "2020-03-15",
      "status": "active"
    }
  ],
  "allergies": ["Penicillin", "Sulfa drugs"],
  "current_medications": [
    {
      "drug_name": "Aspirin",
      "dosage": "75mg",
      "frequency": "daily",
      "start_date": "2020-03-20"
    }
  ]
}
```

#### Create Patient

```http
POST /patients
Content-Type: application/json

{
  "abha_id": "1234-5678-9012",
  "demographics": {
    "name": "Priya Sharma",
    "age": 32,
    "gender": "female",
    "language_preference": "hindi",
    "contact": {
      "phone": "+91-9876543211",
      "email": "priya@example.com"
    }
  },
  "allergies": [],
  "medical_history": []
}
```

**Response (201 Created):**
```json
{
  "patient_id": "660e8400-e29b-41d4-a716-446655440001",
  "message": "Patient created successfully"
}
```

#### Update Patient

```http
PATCH /patients/{patient_id}
Content-Type: application/json

{
  "allergies": ["Penicillin"],
  "contact": {
    "phone": "+91-9876543212"
  }
}
```

**Response (200 OK):**
```json
{
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Patient updated successfully"
}
```

### Triage & Urgency Scoring

#### Submit Triage Data

```http
POST /triage
Content-Type: application/json

{
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "symptoms": ["chest pain", "shortness of breath", "sweating"],
  "vitals": {
    "temperature": 98.6,
    "blood_pressure": "145/92",
    "heart_rate": 98,
    "respiratory_rate": 18,
    "spo2": 96
  },
  "triage_responses": [
    {
      "question": "When did the pain start?",
      "answer": "2 hours ago"
    },
    {
      "question": "How would you describe it?",
      "answer": "Pressure-like, radiating to left arm"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "urgency_score": 78,
  "urgency_level": "HIGH",
  "recommended_action": "Emergency Department evaluation",
  "specialty": "Cardiology",
  "possible_conditions": [
    {
      "condition": "Acute Coronary Syndrome",
      "probability": 0.72,
      "severity": "critical"
    },
    {
      "condition": "STEMI",
      "probability": 0.45,
      "severity": "critical"
    }
  ],
  "nearest_facilities": [
    {
      "facility_id": "fac-001",
      "name": "Apollo Hospital",
      "distance_km": 2.3,
      "estimated_wait_minutes": 5,
      "available_specialists": ["Dr. Anjali Verma"]
    }
  ]
}
```

### Appointment Scheduling

#### Create Appointment

```http
POST /appointments
Content-Type: application/json

{
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "facility_id": "fac-001",
  "clinician_id": "doc-123",
  "appointment_type": "OPD",
  "specialty": "Cardiology",
  "preferred_datetime": "2026-02-27T10:00:00Z",
  "urgency_score": 78
}
```

**Response (201 Created):**
```json
{
  "appointment_id": "apt-789",
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "facility_name": "Apollo Hospital",
  "clinician_name": "Dr. Anjali Verma",
  "scheduled_datetime": "2026-02-27T10:00:00Z",
  "estimated_wait_minutes": 5,
  "queue_position": 3,
  "confirmation_sent": true
}
```

#### Get Appointment Queue

```http
GET /appointments/queue?facility_id=fac-001&specialty=Cardiology
```

**Response (200 OK):**
```json
{
  "facility_id": "fac-001",
  "specialty": "Cardiology",
  "queue_length": 12,
  "average_wait_minutes": 8,
  "patients": [
    {
      "queue_position": 1,
      "patient_name": "Ramesh Kumar",
      "urgency_score": 78,
      "estimated_time": "2026-02-26T14:40:00Z"
    },
    {
      "queue_position": 2,
      "patient_name": "Priya Sharma",
      "urgency_score": 45,
      "estimated_time": "2026-02-26T14:48:00Z"
    }
  ]
}
```

### Clinical Documentation

#### Create Clinical Encounter

```http
POST /encounters
Content-Type: application/json

{
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "facility_id": "fac-001",
  "clinician_id": "doc-123",
  "encounter_type": "OPD",
  "chief_complaint": "Chest pain",
  "urgency_score": 78
}
```

**Response (201 Created):**
```json
{
  "encounter_id": "enc-456",
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "in_progress",
  "created_at": "2026-02-26T14:35:00Z"
}
```

#### Update Clinical Notes (SOAP)

```http
PATCH /encounters/{encounter_id}/notes
Content-Type: application/json

{
  "subjective": "58M with chest pain x2h, pressure-like, radiating to left arm. Hx of MI (2020).",
  "objective": "Diaphoretic, BP 145/92, HR 98, SpO2 96%. ECG shows ST elevation in leads II, III.",
  "assessment": "R/O STEMI, Acute Coronary Syndrome",
  "plan": "Troponin I (STAT), Repeat ECG in 15 min, Aspirin 300mg, Cardiology consult"
}
```

**Response (200 OK):**
```json
{
  "encounter_id": "enc-456",
  "notes_updated": true,
  "ehr_populated": true
}
```

### Prescription Management

#### Create Prescription

```http
POST /prescriptions
Content-Type: application/json

{
  "encounter_id": "enc-456",
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "clinician_id": "doc-123",
  "medications": [
    {
      "drug_name": "Aspirin",
      "dosage": "300mg",
      "frequency": "STAT",
      "duration": "1 dose",
      "instructions": "Loading dose"
    },
    {
      "drug_name": "Clopidogrel",
      "dosage": "75mg",
      "frequency": "daily",
      "duration": "30 days",
      "instructions": "Take with food"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "prescription_id": "prx-789",
  "safety_checks": {
    "drug_interactions": [],
    "allergy_conflicts": [],
    "dosage_appropriate": true,
    "stock_available": true
  },
  "status": "approved",
  "sent_to_patient": true
}
```

#### Check Drug Safety

```http
POST /prescriptions/safety-check
Content-Type: application/json

{
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "proposed_medications": [
    {
      "drug_name": "Clopidogrel",
      "dosage": "75mg"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "safe": true,
  "drug_interactions": [],
  "allergy_conflicts": [],
  "warnings": [],
  "alternatives": []
}
```

### Diagnostic Imaging

#### Upload Medical Image

```http
POST /diagnostics/images
Content-Type: multipart/form-data

{
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "encounter_id": "enc-456",
  "modality": "X-ray",
  "body_part": "Chest",
  "image": <binary_file>
}
```

**Response (201 Created):**
```json
{
  "report_id": "rep-123",
  "image_url": "https://s3.amazonaws.com/medhaos-images/rep-123.dcm",
  "processing_status": "queued",
  "estimated_completion": "2026-02-26T14:43:00Z"
}
```

#### Get Diagnostic Report

```http
GET /diagnostics/reports/{report_id}
```

**Response (200 OK):**
```json
{
  "report_id": "rep-123",
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "modality": "X-ray",
  "ai_analysis": {
    "findings": ["Cardiomegaly", "Pulmonary congestion"],
    "anomalies_detected": [
      {
        "type": "Cardiomegaly",
        "location": "Heart",
        "confidence": 0.89,
        "severity": "moderate"
      }
    ],
    "draft_report": "Chest X-ray shows enlarged cardiac silhouette with pulmonary vascular congestion. Findings consistent with congestive heart failure.",
    "processing_time_seconds": 6.2
  },
  "status": "ai_completed",
  "requires_radiologist_review": true
}
```

### Operational Intelligence

#### Get Bed Occupancy Forecast

```http
GET /operations/bed-forecast?facility_id=fac-001&hours=24
```

**Response (200 OK):**
```json
{
  "facility_id": "fac-001",
  "current_occupancy": 87,
  "total_beds": 400,
  "forecast": [
    {
      "timestamp": "2026-02-26T20:00:00Z",
      "predicted_occupancy": 89,
      "confidence": 0.92
    },
    {
      "timestamp": "2026-02-27T02:00:00Z",
      "predicted_occupancy": 91,
      "confidence": 0.88
    },
    {
      "timestamp": "2026-02-27T08:00:00Z",
      "predicted_occupancy": 94,
      "confidence": 0.85
    }
  ],
  "alerts": [
    {
      "severity": "warning",
      "message": "Predicted to reach 95% capacity in 18 hours"
    }
  ]
}
```

#### Get ICU Demand Forecast

```http
GET /operations/icu-forecast?facility_id=fac-001&hours=12
```

**Response (200 OK):**
```json
{
  "facility_id": "fac-001",
  "current_icu_occupancy": 92,
  "total_icu_beds": 50,
  "forecast": [
    {
      "timestamp": "2026-02-26T20:00:00Z",
      "predicted_occupancy": 94,
      "confidence": 0.87
    },
    {
      "timestamp": "2026-02-27T02:00:00Z",
      "predicted_occupancy": 98,
      "confidence": 0.82
    }
  ],
  "alerts": [
    {
      "severity": "critical",
      "message": "ICU predicted to reach 98% capacity in 6 hours"
    }
  ]
}
```

### Public Health Surveillance

#### Get Disease Outbreak Predictions

```http
GET /public-health/outbreak-predictions?district=Mumbai&disease=dengue
```

**Response (200 OK):**
```json
{
  "district": "Mumbai",
  "state": "Maharashtra",
  "disease_type": "dengue",
  "outbreak_probability": 0.78,
  "prediction_horizon_days": 14,
  "current_case_count": 45,
  "predicted_case_count": 120,
  "environmental_factors": {
    "temperature": 32.5,
    "rainfall_mm": 85.2,
    "humidity": 78
  },
  "recommendation": "Activate Rapid Response Team, Initiate public awareness campaign"
}
```

---

## GraphQL API

### Endpoint

```
POST /graphql
Content-Type: application/json
```

### Schema Overview

```graphql
type Query {
  patient(id: ID!): Patient
  patients(limit: Int, offset: Int): [Patient]
  encounter(id: ID!): Encounter
  appointments(facilityId: ID!, date: String): [Appointment]
  diagnosticReport(id: ID!): DiagnosticReport
}

type Mutation {
  createPatient(input: PatientInput!): Patient
  updatePatient(id: ID!, input: PatientInput!): Patient
  createAppointment(input: AppointmentInput!): Appointment
  createPrescription(input: PrescriptionInput!): Prescription
}

type Subscription {
  queueUpdated(facilityId: ID!): QueueUpdate
  encounterUpdated(encounterId: ID!): Encounter
  alertCreated(facilityId: ID!): Alert
}
```

### Example Queries

**Get Patient with Encounters**

```graphql
query GetPatientDetails($patientId: ID!) {
  patient(id: $patientId) {
    patient_id
    demographics {
      name
      age
      gender
    }
    allergies
    encounters {
      encounter_id
      encounter_type
      chief_complaint
      created_at
      clinician {
        name
        specialty
      }
    }
  }
}
```

**Variables:**
```json
{
  "patientId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Create Appointment**

```graphql
mutation CreateAppointment($input: AppointmentInput!) {
  createAppointment(input: $input) {
    appointment_id
    scheduled_datetime
    queue_position
    estimated_wait_minutes
  }
}
```

**Variables:**
```json
{
  "input": {
    "patient_id": "550e8400-e29b-41d4-a716-446655440000",
    "facility_id": "fac-001",
    "clinician_id": "doc-123",
    "appointment_type": "OPD",
    "preferred_datetime": "2026-02-27T10:00:00Z"
  }
}
```

### Subscriptions

**Subscribe to Queue Updates**

```graphql
subscription QueueUpdates($facilityId: ID!) {
  queueUpdated(facilityId: $facilityId) {
    queue_length
    average_wait_minutes
    updated_at
  }
}
```

---

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('wss://api.medhaos.health/ws');

ws.on('open', () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your_jwt_token'
  }));
});
```

### Subscribe to Events

**Ambient Scribe Transcription**

```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'ambient-scribe',
  encounter_id: 'enc-456'
}));

ws.on('message', (data) => {
  const message = JSON.parse(data);
  if (message.type === 'transcription') {
    console.log('Speaker:', message.speaker);
    console.log('Text:', message.text);
  }
});
```

**Queue Position Updates**

```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'queue-updates',
  facility_id: 'fac-001'
}));

ws.on('message', (data) => {
  const message = JSON.parse(data);
  if (message.type === 'queue-update') {
    console.log('Queue length:', message.queue_length);
    console.log('Your position:', message.your_position);
  }
});
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid patient ID format",
    "details": {
      "field": "patient_id",
      "expected": "UUID",
      "received": "123"
    },
    "request_id": "req-abc-123"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## Rate Limiting

**Limits:**
- 1000 requests per minute per user
- 10,000 requests per hour per API key

**Headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1709046000
```

**Rate Limit Exceeded Response:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 45 seconds.",
    "retry_after": 45
  }
}
```

---

## Code Examples

### Python

```python
import requests

# Authentication
auth_response = requests.post(
    'https://api.medhaos.health/v1/auth/token',
    json={
        'username': 'doctor@hospital.com',
        'password': 'secure_password',
        'grant_type': 'password'
    }
)
token = auth_response.json()['access_token']

# Get patient
headers = {'Authorization': f'Bearer {token}'}
patient_response = requests.get(
    'https://api.medhaos.health/v1/patients/550e8400-e29b-41d4-a716-446655440000',
    headers=headers
)
patient = patient_response.json()
print(f"Patient: {patient['demographics']['name']}")

# Submit triage
triage_response = requests.post(
    'https://api.medhaos.health/v1/triage',
    headers=headers,
    json={
        'patient_id': '550e8400-e29b-41d4-a716-446655440000',
        'symptoms': ['chest pain', 'shortness of breath'],
        'vitals': {
            'blood_pressure': '145/92',
            'heart_rate': 98
        }
    }
)
urgency = triage_response.json()
print(f"Urgency Score: {urgency['urgency_score']}")
```

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_BASE = 'https://api.medhaos.health/v1';

// Authentication
async function authenticate() {
  const response = await axios.post(`${API_BASE}/auth/token`, {
    username: 'doctor@hospital.com',
    password: 'secure_password',
    grant_type: 'password'
  });
  return response.data.access_token;
}

// Get patient
async function getPatient(patientId, token) {
  const response = await axios.get(
    `${API_BASE}/patients/${patientId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}

// Usage
(async () => {
  const token = await authenticate();
  const patient = await getPatient('550e8400-e29b-41d4-a716-446655440000', token);
  console.log(`Patient: ${patient.demographics.name}`);
})();
```

### cURL

```bash
# Authentication
curl -X POST https://api.medhaos.health/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "doctor@hospital.com",
    "password": "secure_password",
    "grant_type": "password"
  }'

# Get patient
curl -X GET https://api.medhaos.health/v1/patients/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Submit triage
curl -X POST https://api.medhaos.health/v1/triage \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "550e8400-e29b-41d4-a716-446655440000",
    "symptoms": ["chest pain", "shortness of breath"],
    "vitals": {
      "blood_pressure": "145/92",
      "heart_rate": 98
    }
  }'
```

---

## Support

For API support, contact:
- Email: api-support@medhaos.health
- Documentation: https://docs.medhaos.health
- Status Page: https://status.medhaos.health

---

**Version History:**
- v1.0.0 (2026-02-26): Initial release

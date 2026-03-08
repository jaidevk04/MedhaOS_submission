# MedhaOS Triage Agent

AI-powered triage and urgency scoring service for the MedhaOS Healthcare Intelligence Ecosystem.

## Overview

The Triage Agent is responsible for:
- Collecting structured symptom data through intelligent questionnaires
- Capturing and validating patient vitals
- Retrieving relevant patient medical history
- Generating preliminary urgency scores and recommendations
- Routing patients to appropriate care levels and specialties

## Features

### 1. Structured Questionnaire Engine
- Dynamic question branching based on responses
- 17+ medical questions covering symptoms, history, and demographics
- Conditional logic for symptom-specific follow-ups
- Multi-choice, single-choice, text, numeric, and boolean question types

### 2. Symptom Capture Service
- Extracts structured symptoms from free-text and questionnaire responses
- Identifies red flag symptoms requiring immediate attention
- Maps symptom severity, onset, duration, and characteristics
- Supports multiple symptom types (cardiac, respiratory, neurological, etc.)

### 3. Vitals Integration
- Validates vital signs data (temperature, BP, HR, RR, SpO2)
- Calculates BMI automatically
- Assesses vitals severity (0-100 score)
- Identifies critical vitals requiring immediate intervention
- Calculates Modified Early Warning Score (MEWS)

### 4. Patient History Retrieval
- Fetches complete medical history from database
- Identifies relevant chronic conditions for current symptoms
- Calculates risk factors based on age and medical history
- Highlights life-threatening allergies and medication interactions

### 5. Urgency Scoring (Rule-Based)
- Multi-factor urgency calculation (0-100 score)
- Weighted scoring: Symptoms (40%), Vitals (30%), Onset (15%), Risk Factors (15%)
- Automatic elevation for red flag symptoms
- Urgency levels: Critical, Urgent, Semi-Urgent, Non-Urgent
- Recommended actions: ED, Urgent Care, OPD, Telemedicine, Self-Care

## API Endpoints

### Start Triage Session
```http
POST /triage/start
Content-Type: application/json

{
  "patientId": "uuid",
  "language": "en",
  "initialSymptoms": ["chest pain"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "firstQuestion": {
      "id": "q1_chief_complaint",
      "text": "What is your main concern or symptom today?",
      "type": "text",
      "required": true,
      "category": "symptom"
    },
    "patientHistory": {
      "patientId": "uuid",
      "medicalHistory": [...],
      "allergies": [...],
      "currentMedications": [...]
    }
  }
}
```

### Submit Answer
```http
POST /triage/answer
Content-Type: application/json

{
  "sessionId": "uuid",
  "questionId": "q1_chief_complaint",
  "answer": "chest pain"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nextQuestion": {
      "id": "q2_symptom_onset",
      "text": "When did your symptoms start?",
      "type": "single_choice",
      "options": [...]
    },
    "completed": false
  }
}
```

### Submit Vitals
```http
POST /triage/vitals
Content-Type: application/json

{
  "sessionId": "uuid",
  "vitals": {
    "temperature": 37.5,
    "bloodPressure": {
      "systolic": 145,
      "diastolic": 92
    },
    "heartRate": 98,
    "respiratoryRate": 18,
    "spo2": 96,
    "weight": 75,
    "height": 170
  }
}
```

### Get Triage Result
```http
GET /triage/result/:sessionId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "urgencyScore": 78,
    "recommendation": {
      "urgencyLevel": "urgent",
      "urgencyScore": 78,
      "recommendedAction": "emergency_department",
      "specialty": "Cardiology",
      "estimatedWaitTime": 5,
      "reasoning": [
        "Critical condition requiring immediate emergency care",
        "2 red flag(s) identified"
      ],
      "possibleConditions": [
        "Acute Coronary Syndrome (ACS)",
        "Myocardial Infarction (MI)"
      ],
      "redFlags": [
        "Chest pain with pressure/squeezing character (possible cardiac event)",
        "Chest pain radiating to left arm or jaw (possible MI)"
      ]
    },
    "symptoms": [...],
    "vitals": {...},
    "patientHistory": {...}
  }
}
```

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run in development mode
npm run dev

# Build for production
npm run build

# Run in production
npm start
```

## Environment Variables

```env
PORT=3020
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medhaos
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
SUPERVISOR_AGENT_URL=http://localhost:3030
SPEECH_NLP_SERVICE_URL=http://localhost:3040
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Triage Agent                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │         Triage Service (Orchestrator)           │  │
│  └─────────────────────────────────────────────────┘  │
│           │         │         │         │              │
│           ▼         ▼         ▼         ▼              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │Question- │ │ Symptom  │ │  Vitals  │ │ Patient  │ │
│  │naire     │ │ Capture  │ │Integration│ │ History  │ │
│  │ Service  │ │ Service  │ │  Service │ │ Service  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   Database       │
              │   (PostgreSQL)   │
              └──────────────────┘
```

## Next Steps

This implementation completes **Task 6.1: Implement triage data collection service**.

The next tasks are:
- **Task 6.2**: Train and deploy urgency scoring model (XGBoost with 500K synthetic cases)
- **Task 6.3**: Implement specialty routing logic with facility matching

## Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## Integration

The Triage Agent integrates with:
- **Database Package**: Patient data retrieval
- **Supervisor Agent**: Event routing and orchestration
- **Speech NLP Service**: Voice-based symptom capture
- **Queue Optimization Agent**: Appointment scheduling (Task 7)

## Performance Targets

- Question response time: < 500ms
- Triage completion time: < 3 seconds
- Urgency score generation: < 2 seconds
- Support for 1000+ concurrent triage sessions

## Compliance

- HIPAA-equivalent data handling
- ABDM integration ready
- Audit logging for all triage decisions
- Secure patient data transmission

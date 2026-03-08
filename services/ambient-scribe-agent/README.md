# Ambient Scribe Agent

The Ambient Scribe Agent provides real-time clinical documentation through automated transcription, speaker diarization, clinical fact extraction, and SOAP note generation.

## Features

### 8.1 Real-time Audio Processing
- **Audio Streaming Service**: Handles real-time audio stream ingestion
- **Speaker Diarization**: Identifies and labels speakers (doctor vs patient)
- **Real-time Transcription**: Converts speech to text with low latency (<2 seconds)
- **Multi-channel Support**: Processes audio from various sources

### 8.2 Clinical Fact Extraction Engine
- **Named Entity Recognition (NER)**: Extracts clinical entities
  - Symptoms (chest pain, dyspnea, etc.)
  - Diagnoses (MI, hypertension, diabetes, etc.)
  - Medications (aspirin, atorvastatin, etc.)
  - Allergies
  - Vital signs (BP, HR, temperature, SpO2)
  - Procedures (ECG, X-ray, CT scan, etc.)
- **Dosage and Frequency Extraction**: Parses medication details
  - Dosage (75mg, 10mg, etc.)
  - Frequency (once daily, BID, TID, etc.)
  - Route (oral, IV, IM, etc.)
  - Duration (for 7 days, for 2 weeks, etc.)
- **Temporal Relation Extraction**: Identifies time-based relationships
  - Absolute time (dates, times)
  - Relative time (2 hours ago, yesterday)
  - Duration (for 3 days)
  - Temporal relations (before, after, during)

### 8.3 SOAP Note Generation
- **Automated SOAP Note Creation**: Generates structured clinical notes
  - **Subjective**: Chief complaint, HPI, ROS
  - **Objective**: Vital signs, physical exam, procedures
  - **Assessment**: Diagnoses, differential diagnosis, clinical reasoning
  - **Plan**: Medications, tests, education, follow-up
- **EHR Auto-population**: Converts SOAP notes to structured EHR format
- **Clinician Review Interface**: Allows editing and approval

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Ambient Scribe Agent                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Audio Input (WebSocket/HTTP)                               │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────┐                                   │
│  │ Audio Streaming      │                                   │
│  │ Service              │                                   │
│  └──────────┬───────────┘                                   │
│             │                                                │
│             ├──────────────┬──────────────┐                 │
│             ▼              ▼              ▼                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Real-time    │  │ Speaker      │  │ Clinical     │     │
│  │ Transcription│  │ Diarization  │  │ NER          │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                            ▼                                │
│                  ┌──────────────────┐                       │
│                  │ Temporal         │                       │
│                  │ Extraction       │                       │
│                  └─────────┬────────┘                       │
│                            │                                │
│                            ▼                                │
│                  ┌──────────────────┐                       │
│                  │ SOAP Note        │                       │
│                  │ Generation       │                       │
│                  └─────────┬────────┘                       │
│                            │                                │
│                            ▼                                │
│                  ┌──────────────────┐                       │
│                  │ EHR Format       │                       │
│                  │ Conversion       │                       │
│                  └──────────────────┘                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### REST API

#### Session Management
- `POST /api/scribe/sessions` - Start new scribe session
- `GET /api/scribe/sessions/:sessionId` - Get session status
- `POST /api/scribe/sessions/:sessionId/pause` - Pause session
- `POST /api/scribe/sessions/:sessionId/resume` - Resume session
- `POST /api/scribe/sessions/:sessionId/stop` - Stop session and generate SOAP note
- `DELETE /api/scribe/sessions/:sessionId` - Delete session

#### Data Retrieval
- `GET /api/scribe/sessions/:sessionId/transcription` - Get current transcription
- `GET /api/scribe/sessions/:sessionId/facts` - Get extracted clinical facts
- `GET /api/scribe/sessions/:sessionId/soap-preview` - Get SOAP note preview
- `GET /api/scribe/sessions/:sessionId/statistics` - Get session statistics
- `GET /api/scribe/sessions/:sessionId/export` - Export session data

#### Updates
- `PATCH /api/scribe/sessions/:sessionId/segments/:segmentIndex/speaker` - Update speaker label

#### Conversion
- `POST /api/scribe/soap/to-ehr` - Convert SOAP note to EHR format

### WebSocket API

Connect to `ws://localhost:3007/ws`

#### Control Messages

**Start Session**
```json
{
  "type": "start",
  "payload": {
    "sessionId": "session-123",
    "encounterId": "encounter-456",
    "clinicianId": "clinician-789",
    "patientId": "patient-012",
    "options": {
      "enableSpeakerDiarization": true,
      "enableRealTimeTranscription": true
    }
  }
}
```

**Send Audio Data**
Send binary audio data (16-bit PCM, 16kHz sample rate)

**Pause Session**
```json
{
  "type": "pause",
  "payload": {
    "sessionId": "session-123"
  }
}
```

**Resume Session**
```json
{
  "type": "resume",
  "payload": {
    "sessionId": "session-123"
  }
}
```

**Stop Session**
```json
{
  "type": "stop",
  "payload": {
    "sessionId": "session-123"
  }
}
```

**Get Transcription**
```json
{
  "type": "get_transcription",
  "payload": {
    "sessionId": "session-123"
  }
}
```

**Get Facts**
```json
{
  "type": "get_facts",
  "payload": {
    "sessionId": "session-123"
  }
}
```

**Get SOAP Preview**
```json
{
  "type": "get_soap_preview",
  "payload": {
    "sessionId": "session-123"
  }
}
```

#### Server Messages

**Transcription Update**
```json
{
  "type": "transcription",
  "payload": {
    "speaker": "doctor",
    "text": "Tell me about your symptoms",
    "startTime": 0.0,
    "endTime": 2.5,
    "confidence": 0.95
  },
  "timestamp": "2024-02-27T10:30:00Z"
}
```

**Facts Update**
```json
{
  "type": "facts",
  "payload": [
    {
      "type": "symptom",
      "value": "chest pain",
      "normalizedValue": "Chest Pain",
      "confidence": 0.90
    }
  ],
  "timestamp": "2024-02-27T10:30:05Z"
}
```

**SOAP Note**
```json
{
  "type": "soap",
  "payload": {
    "subjective": "...",
    "objective": "...",
    "assessment": "...",
    "plan": "...",
    "confidence": 0.85
  },
  "timestamp": "2024-02-27T10:35:00Z"
}
```

## Installation

```bash
cd services/ambient-scribe-agent
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3007
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medhaos

# AWS Services
AWS_REGION=ap-south-1
AWS_TRANSCRIBE_LANGUAGE_CODE=en-IN

# Bhashini API
BHASHINI_API_KEY=your_bhashini_api_key
BHASHINI_API_URL=https://api.bhashini.gov.in

# Audio Processing
MAX_AUDIO_DURATION_SECONDS=3600
AUDIO_SAMPLE_RATE=16000
SPEAKER_DIARIZATION_ENABLED=true

# Clinical NLP
BIOBERT_MODEL_PATH=./models/biobert
CLINICAL_NER_CONFIDENCE_THRESHOLD=0.75
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Integration with Production Services

In production, this service integrates with:

1. **AWS Transcribe Medical**: Real-time medical transcription
2. **Bhashini API**: Multilingual speech processing
3. **BioBERT**: Medical named entity recognition
4. **AWS Comprehend Medical**: Clinical entity extraction
5. **EHR Systems**: Via FHIR R4 API

## Performance Targets

- **Transcription Latency**: < 2 seconds
- **SOAP Note Generation**: < 5 seconds
- **Clinical NER Accuracy**: > 85%
- **Speaker Diarization Accuracy**: > 90%

## Requirements Addressed

- **Requirement 3.1**: Real-time audio recording with doctor consent
- **Requirement 3.2**: Real-time transcription with speaker diarization
- **Requirement 3.3**: Clinical fact extraction with 85% accuracy
- **Requirement 3.4**: SOAP note generation within 5 seconds
- **Requirement 3.5**: EHR auto-population with clinician review

## Future Enhancements

- Integration with actual AWS Transcribe Medical
- BioBERT model deployment
- Multi-language support via Bhashini
- Voice activity detection
- Background noise reduction
- Medical terminology normalization to SNOMED CT
- ICD-10 code suggestion
- Clinical decision support integration

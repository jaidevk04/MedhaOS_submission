# Clinical Decision Support System (CDSS) Agent

The CDSS Agent provides comprehensive clinical decision support capabilities for the MedhaOS Healthcare Intelligence Ecosystem. It combines medical knowledge retrieval, differential diagnosis generation, clinical trial matching, and compliance checking to assist clinicians in making evidence-based decisions.

## Features

### 1. Medical Knowledge Base with RAG (Retrieval-Augmented Generation)
- Vector database for medical literature (Pinecone)
- Document ingestion from PubMed and medical guidelines
- Semantic search with embeddings (AWS Titan)
- LLM-powered summarization (Claude 3 via Bedrock)
- Evidence-based recommendations with source citations

### 2. Differential Diagnosis Engine
- Symptom-to-diagnosis mapping
- Probabilistic reasoning with patient context
- Age, gender, and medical history adjustments
- LLM-enhanced diagnostic reasoning
- Urgency classification (immediate/urgent/routine)
- Recommended diagnostic tests

### 3. Clinical Trial Matching
- Integration with ClinicalTrials.gov API
- Patient eligibility evaluation
- Genetic profile matching
- Location-based trial recommendations
- Match scoring and ranking

### 4. Compliance Checking
- NMC guideline validation
- Documentation completeness assessment
- Prescription compliance checking
- Procedure documentation validation
- Informed consent verification
- Prior authorization request generation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CDSS Agent                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  RAG Service     │  │  Diagnosis       │               │
│  │  - Vector DB     │  │  Service         │               │
│  │  - Embeddings    │  │  - Symptom Map   │               │
│  │  - LLM Summary   │  │  - Probabilistic │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  Trial Matching  │  │  Compliance      │               │
│  │  Service         │  │  Service         │               │
│  │  - Eligibility   │  │  - Guidelines    │               │
│  │  - Genetic Match │  │  - Prior Auth    │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │ Pinecone │        │ Bedrock  │        │ Clinical │
   │ Vector   │        │ Claude 3 │        │ Trials   │
   │ Database │        │ & Titan  │        │ API      │
   └──────────┘        └──────────┘        └──────────┘
```

## API Endpoints

### Core CDSS Operations

#### POST /api/cdss/request
Process a generic CDSS request.

**Request:**
```json
{
  "requestType": "diagnosis|literature_search|trial_matching|compliance_check|prior_auth",
  "patientContext": { ... },
  "patientProfile": { ... },
  "query": "string",
  "encounterId": "string",
  "authorizationRequest": { ... }
}
```

**Response:**
```json
{
  "requestId": "CDSS_1234567890_abc123",
  "requestType": "diagnosis",
  "data": { ... },
  "confidence": 0.85,
  "processingTime": 1234,
  "timestamp": "2026-02-27T10:00:00Z"
}
```

### Differential Diagnosis

#### POST /api/cdss/diagnosis
Generate differential diagnosis for a patient.

**Request:**
```json
{
  "patientContext": {
    "patientId": "P123456",
    "age": 58,
    "gender": "male",
    "symptoms": [
      {
        "name": "chest pain",
        "severity": "severe",
        "duration": "2 hours",
        "onset": "sudden"
      }
    ],
    "vitals": {
      "temperature": 37.2,
      "bloodPressure": "145/92",
      "heartRate": 98,
      "oxygenSaturation": 96
    },
    "medicalHistory": ["diabetes", "hypertension"],
    "currentMedications": ["metformin", "lisinopril"],
    "allergies": ["penicillin"]
  }
}
```

**Response:**
```json
{
  "requestId": "CDSS_1234567890_abc123",
  "requestType": "diagnosis",
  "data": {
    "patientId": "P123456",
    "diagnoses": [
      {
        "condition": "Acute Myocardial Infarction (STEMI)",
        "icdCode": "I21.0",
        "probability": 0.78,
        "reasoning": "Based on symptoms: chest pain, patient age > 50, history of diabetes",
        "supportingEvidence": ["chest pain", "Age > 50 increases cardiac risk"],
        "recommendedTests": ["ECG", "Troponin", "Chest X-ray"],
        "urgency": "immediate"
      }
    ],
    "recommendations": [
      "IMMEDIATE: Rule out life-threatening conditions",
      "Obtain vital signs and continuous monitoring",
      "Recommended diagnostic tests: ECG, Troponin, Chest X-ray",
      "Consider Cardiology consultation"
    ],
    "confidence": 0.85,
    "timestamp": "2026-02-27T10:00:00Z"
  },
  "confidence": 0.85,
  "processingTime": 2345,
  "timestamp": "2026-02-27T10:00:00Z"
}
```

### Medical Literature Search

#### POST /api/cdss/literature-search
Search medical literature using RAG.

**Request:**
```json
{
  "query": "Latest treatment guidelines for acute myocardial infarction"
}
```

**Response:**
```json
{
  "requestId": "CDSS_1234567890_abc123",
  "requestType": "literature_search",
  "data": {
    "query": "Latest treatment guidelines for acute myocardial infarction",
    "results": [
      {
        "id": "pubmed_12345678",
        "score": 0.92,
        "document": {
          "title": "2023 ACC/AHA Guidelines for STEMI Management",
          "content": "...",
          "source": "guideline",
          "metadata": { ... }
        }
      }
    ],
    "summary": "Current guidelines recommend immediate reperfusion therapy...",
    "sources": [
      "Smith J et al (2023). 2023 ACC/AHA Guidelines. JACC. DOI: 10.1016/..."
    ],
    "confidence": 0.89
  },
  "confidence": 0.89,
  "processingTime": 3456,
  "timestamp": "2026-02-27T10:00:00Z"
}
```

### Clinical Trial Matching

#### POST /api/cdss/trial-matching
Match patient to relevant clinical trials.

**Request:**
```json
{
  "patientProfile": {
    "patientId": "P123456",
    "age": 58,
    "gender": "male",
    "diagnoses": ["Non-small cell lung cancer", "Stage IIIA"],
    "geneticProfile": {
      "mutations": ["EGFR exon 19 deletion"],
      "biomarkers": {
        "PD-L1": "50%"
      }
    },
    "location": {
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India"
    }
  }
}
```

**Response:**
```json
{
  "requestId": "CDSS_1234567890_abc123",
  "requestType": "trial_matching",
  "data": {
    "patientId": "P123456",
    "matches": [
      {
        "trial": {
          "nctId": "NCT12345678",
          "title": "Phase III Study of EGFR Inhibitor in NSCLC",
          "status": "RECRUITING",
          "phase": "PHASE3",
          "conditions": ["Non-small cell lung cancer"],
          "eligibilityCriteria": { ... },
          "locations": [ ... ],
          "studyUrl": "https://clinicaltrials.gov/study/NCT12345678"
        },
        "matchScore": 85,
        "matchReasons": [
          "Patient diagnosis matches trial condition",
          "Patient has required mutation: EGFR exon 19 deletion",
          "Trial site available in Maharashtra"
        ],
        "eligibilityStatus": "eligible"
      }
    ],
    "totalTrialsEvaluated": 45,
    "timestamp": "2026-02-27T10:00:00Z"
  },
  "confidence": 0.9,
  "processingTime": 4567,
  "timestamp": "2026-02-27T10:00:00Z"
}
```

### Compliance Checking

#### POST /api/cdss/compliance-check
Validate documentation compliance.

**Request:**
```json
{
  "encounterId": "E123456",
  "patientId": "P123456",
  "chiefComplaint": "Chest pain",
  "presentingSymptoms": ["chest pain", "diaphoresis"],
  "vitalSigns": { ... },
  "assessment": "Acute coronary syndrome",
  "diagnosis": "STEMI",
  "treatmentPlan": "Immediate reperfusion therapy",
  "prescriptions": [ ... ]
}
```

**Response:**
```json
{
  "requestId": "CDSS_1234567890_abc123",
  "requestType": "compliance_check",
  "data": {
    "encounterId": "E123456",
    "overallCompliance": "compliant",
    "checks": [
      {
        "checkType": "documentation",
        "status": "compliant",
        "message": "Documentation is complete and meets NMC standards",
        "guidelineReference": {
          "id": "nmc_doc_2023",
          "title": "NMC Clinical Documentation Standards",
          "organization": "NMC",
          "version": "2023.1"
        }
      }
    ],
    "documentationCompleteness": {
      "encounterId": "E123456",
      "completenessScore": 1.0,
      "missingCriticalFields": [],
      "suggestions": ["Documentation is complete and comprehensive"]
    },
    "recommendations": [
      "Documentation meets all compliance requirements"
    ],
    "timestamp": "2026-02-27T10:00:00Z"
  },
  "confidence": 0.95,
  "processingTime": 1234,
  "timestamp": "2026-02-27T10:00:00Z"
}
```

### Prior Authorization

#### POST /api/cdss/prior-authorization
Generate prior authorization request.

**Request:**
```json
{
  "authorizationRequest": {
    "patientId": "P123456",
    "encounterId": "E123456",
    "requestType": "medication",
    "details": {
      "name": "Pembrolizumab",
      "code": "J9271",
      "justification": "First-line treatment for metastatic NSCLC with PD-L1 ≥50%",
      "clinicalEvidence": [
        "PD-L1 expression 50%",
        "EGFR and ALK negative",
        "Stage IV NSCLC confirmed by biopsy"
      ],
      "alternativesConsidered": [
        "Chemotherapy alone - less effective per KEYNOTE-024 trial"
      ]
    },
    "insuranceInfo": {
      "provider": "Star Health Insurance",
      "policyNumber": "SH123456789"
    },
    "urgency": "urgent"
  }
}
```

### Knowledge Base Management

#### POST /api/cdss/ingest/pubmed
Ingest documents from PubMed.

**Request:**
```json
{
  "query": "acute myocardial infarction treatment",
  "maxResults": 100
}
```

#### POST /api/cdss/ingest/guidelines
Ingest medical guidelines.

**Request:**
```json
{
  "guidelines": [
    {
      "title": "ACC/AHA STEMI Guidelines 2023",
      "content": "...",
      "organization": "ACC/AHA",
      "url": "https://..."
    }
  ]
}
```

#### GET /api/cdss/knowledge-base/stats
Get knowledge base statistics.

## Setup

### Prerequisites
- Node.js 18+
- AWS Account with Bedrock access
- Pinecone account
- PubMed API key (optional, for higher rate limits)

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Server
PORT=3010
NODE_ENV=development

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Bedrock
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0

# Pinecone
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX_NAME=medhaos-medical-knowledge

# PubMed
PUBMED_API_KEY=your_pubmed_key
```

### Installation

```bash
# Install dependencies
npm install

# Build
npm run build

# Development
npm run dev

# Production
npm start
```

## Usage Examples

### Generate Differential Diagnosis

```bash
curl -X POST http://localhost:3010/api/cdss/diagnosis \
  -H "Content-Type: application/json" \
  -d '{
    "patientContext": {
      "patientId": "P123",
      "age": 58,
      "gender": "male",
      "symptoms": [
        {
          "name": "chest pain",
          "severity": "severe",
          "duration": "2 hours",
          "onset": "sudden"
        }
      ],
      "medicalHistory": ["diabetes", "hypertension"]
    }
  }'
```

### Search Medical Literature

```bash
curl -X POST http://localhost:3010/api/cdss/literature-search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Latest guidelines for STEMI management"
  }'
```

### Match Clinical Trials

```bash
curl -X POST http://localhost:3010/api/cdss/trial-matching \
  -H "Content-Type: application/json" \
  -d '{
    "patientProfile": {
      "patientId": "P123",
      "age": 58,
      "gender": "male",
      "diagnoses": ["Non-small cell lung cancer"],
      "location": {
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India"
      }
    }
  }'
```

## Performance

- Differential diagnosis: < 3 seconds (p95)
- Literature search: < 5 seconds (p95)
- Trial matching: < 10 seconds (p95)
- Compliance check: < 2 seconds (p95)

## Accuracy Targets

- Differential diagnosis: 92% accuracy
- Literature relevance: 89% precision
- Trial matching: 85% eligibility accuracy
- Compliance detection: 95% accuracy

## Integration

The CDSS Agent integrates with:
- Supervisor Agent (for task routing)
- Triage Agent (for initial assessment)
- Drug Safety Agent (for prescription validation)
- Auth Service (for access control)
- Database (for patient data)

## License

Proprietary - MedhaOS Healthcare Intelligence Ecosystem

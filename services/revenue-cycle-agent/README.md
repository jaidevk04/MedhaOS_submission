# Revenue Cycle Agent

The Revenue Cycle Agent is a comprehensive financial intelligence service for the MedhaOS Healthcare Intelligence Ecosystem. It automates medical coding, insurance claim generation, billing error detection, rejection prediction, and prior authorization workflows.

## Features

### 1. Automated Medical Coding (ICD-10 & CPT)
- **AI-Powered Coding**: Uses Claude 3.5 Sonnet to generate ICD-10 and CPT codes from clinical notes
- **Target Accuracy**: 92% first-pass coding accuracy
- **Confidence Scoring**: Each code includes a confidence score
- **Human Review Flagging**: Automatically flags low-confidence codes for review

### 2. Insurance Claim Generation
- **Automated Claim Creation**: Generates complete insurance claims from encounter data
- **Multi-Payer Support**: Works with various insurance payers
- **Validation**: Comprehensive claim validation before submission
- **Auto-Submission**: Optional automatic submission to insurance payers

### 3. Billing Error Minimization
- **Anomaly Detection**: AI-powered detection of billing errors
- **Rule Engine**: Validates claims against insurance rules
- **Rejection Prediction**: Predicts claim rejection probability (0-100%)
- **Error Correction**: Suggests corrections for detected errors
- **Target Impact**: 60% reduction in billing errors

### 4. Prior Authorization Automation
- **Requirement Detection**: Automatically detects when prior auth is needed
- **Justification Generation**: AI-generated clinical justifications
- **Documentation Assembly**: Automatically assembles supporting evidence
- **Submission Ready**: Generates submission-ready authorization requests

## API Endpoints

### Generate Medical Codes
```http
POST /api/revenue-cycle/codes
Content-Type: application/json

{
  "clinical_note": {
    "encounter_id": "ENC-123",
    "patient_id": "PAT-456",
    "encounter_date": "2024-02-26",
    "encounter_type": "ED",
    "chief_complaint": "Chest pain",
    "subjective": "Patient reports...",
    "objective": "Vital signs...",
    "assessment": "Possible STEMI",
    "plan": "Admit to cardiology..."
  }
}
```

**Response:**
```json
{
  "medical_coding": {
    "encounter_id": "ENC-123",
    "icd10_codes": [
      {
        "code": "I21.09",
        "description": "ST elevation myocardial infarction",
        "confidence": 0.95,
        "category": "Cardiovascular",
        "is_primary": true
      }
    ],
    "cpt_codes": [
      {
        "code": "99285",
        "description": "Emergency department visit, high complexity",
        "confidence": 0.92,
        "units": 1
      }
    ],
    "overall_confidence": 0.94,
    "requires_review": false
  },
  "processing_time_ms": 2340,
  "model_used": "claude-3-5-sonnet-20241022"
}
```

### Generate Insurance Claim
```http
POST /api/revenue-cycle/claims
Content-Type: application/json

{
  "encounter_id": "ENC-123",
  "patient_id": "PAT-456",
  "insurance_policy_id": "POL-789",
  "medical_coding": { ... },
  "auto_submit": false
}
```

### Detect Billing Errors
```http
POST /api/revenue-cycle/detect-errors
Content-Type: application/json

{
  "claim_id": "CLM-123",
  "encounter_id": "ENC-123",
  "patient_id": "PAT-456",
  "medical_coding": { ... },
  ...
}
```

### Predict Claim Rejection
```http
POST /api/revenue-cycle/predict-rejection
Content-Type: application/json

{
  "claim_id": "CLM-123",
  ...
}
```

**Response:**
```json
{
  "claim_id": "CLM-123",
  "rejection_probability": 0.23,
  "risk_factors": [
    {
      "factor": "Low Coding Confidence",
      "impact_score": 15,
      "description": "Medical coding confidence is 82.5%",
      "mitigation": "Request human review of medical codes"
    }
  ],
  "preventive_actions": [
    "Request human review of medical codes before submission"
  ]
}
```

### Generate Prior Authorization
```http
POST /api/revenue-cycle/prior-authorization
Content-Type: application/json

{
  "encounter_id": "ENC-123",
  "patient_id": "PAT-456",
  "insurance_policy_id": "POL-789",
  "requested_service": "MRI Lumbar Spine",
  "urgency": "Routine"
}
```

### Complete Encounter Processing
```http
POST /api/revenue-cycle/process-encounter
Content-Type: application/json

{
  "coding_request": {
    "clinical_note": { ... }
  },
  "insurance_policy_id": "POL-789",
  "auto_submit": false
}
```

**Response includes:**
- Medical coding results
- Generated claim
- Detected billing errors
- Rejection prediction

## Configuration

Create a `.env` file based on `.env.example`:

```env
PORT=3015
NODE_ENV=development
SERVICE_NAME=revenue-cycle-agent

# AI Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key

# Medical Coding
ICD10_VERSION=2024
CPT_VERSION=2024
CODING_CONFIDENCE_THRESHOLD=0.85

# Insurance & Claims
INSURANCE_PAYER_API_URL=https://api.insurance-payer.example.com
CLAIM_SUBMISSION_ENDPOINT=https://claims.example.com/api/v1
```

## Installation

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build
npm run build

# Production
npm start
```

## Architecture

### Services

1. **MedicalCodingService**: AI-powered ICD-10 and CPT code generation
2. **ClaimGenerationService**: Automated insurance claim creation and validation
3. **ErrorMinimizationService**: Billing error detection and rejection prediction
4. **PriorAuthorizationService**: Prior authorization request generation
5. **RevenueCycleService**: Main orchestration service

### AI Models

- **Primary Model**: Claude 3.5 Sonnet (Anthropic)
- **Use Cases**: 
  - Medical code generation from clinical notes
  - Clinical justification generation for prior auth
  - Anomaly detection in billing
  - Error correction suggestions

### Data Flow

```
Clinical Note → Medical Coding → Claim Generation → Validation → Submission
                                        ↓
                                Error Detection
                                        ↓
                              Rejection Prediction
```

## Performance Targets

- **Coding Accuracy**: 92% first-pass rate
- **Processing Time**: < 3 seconds for coding
- **Error Reduction**: 60% reduction in billing errors
- **Rejection Rate**: < 5% claim rejection rate

## Requirements Addressed

- **8.1**: Automated ICD-10 and CPT code mapping from clinical notes
- **8.2**: NLP model for medical coding with 92% accuracy
- **8.3**: Automated claim generation and submission
- **8.4**: Billing error minimization and rejection prediction
- **8.5**: Prior authorization automation
- **13.5**: Compliance checking and documentation completeness

## Integration

The Revenue Cycle Agent integrates with:
- **EHR Systems**: Receives clinical encounter data
- **Insurance Payers**: Submits claims and prior auth requests
- **Supervisor Agent**: Receives tasks and reports status
- **Database**: Stores coding results, claims, and audit trails

## Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## Monitoring

Key metrics to monitor:
- Coding accuracy rate
- Claim submission success rate
- Average rejection probability
- Error detection rate
- Processing time per encounter
- Prior authorization approval rate

## Security

- All patient data encrypted at rest and in transit
- HIPAA-compliant data handling
- Audit logging for all operations
- Role-based access control
- Secure API key management

## License

Private - MedhaOS Healthcare Intelligence Ecosystem

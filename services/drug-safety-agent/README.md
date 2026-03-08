# Drug Interaction & Allergy Safety Agent

The Drug Safety Agent is a critical component of the MedhaOS Healthcare Intelligence Ecosystem that provides real-time drug safety checking, interaction detection, allergy conflict identification, and inventory integration.

## Features

### 1. Drug Knowledge Graph
- Comprehensive database with 10+ medications (expandable to 10,000+)
- Drug-drug interaction mappings with severity classification
- Allergy cross-reactivity mappings
- Dosage and contraindication data
- Therapeutic class categorization

### 2. Safety Checking
- **Allergy Conflict Detection**: Identifies contraindicated drugs based on patient allergies
- **Drug-Drug Interaction Checking**: Real-time interaction detection with severity classification (Critical/Major/Moderate/Minor)
- **Contraindication Validation**: Checks against medical conditions, renal/hepatic function
- **Duplicate Therapy Detection**: Identifies duplicate medications or therapeutic classes
- **Dosage Validation**: Verifies appropriate dosing for age, weight, and organ function

### 3. Inventory Integration
- Stock availability checking
- Expiry date validation
- Alternative drug suggestions based on availability
- Low stock alerts
- Reorder level monitoring

## API Endpoints

### Safety Check
```
POST /api/safety-check
```

Request body:
```json
{
  "patientId": "patient_123",
  "proposedDrug": {
    "drugId": "drug_001",
    "dosage": "75mg",
    "frequency": "once daily",
    "route": "oral"
  },
  "currentMedications": [
    {
      "drugId": "drug_002",
      "dosage": "75mg",
      "frequency": "once daily",
      "startDate": "2024-01-01"
    }
  ],
  "allergies": ["Penicillin"],
  "medicalConditions": ["Hypertension", "Type 2 Diabetes"],
  "age": 58,
  "weight": 75,
  "renalFunction": "normal",
  "hepaticFunction": "normal"
}
```

Response:
```json
{
  "safe": false,
  "alerts": [
    {
      "type": "interaction",
      "severity": "major",
      "message": "DRUG INTERACTION: Aspirin + Clopidogrel",
      "details": "Significantly increased risk of bleeding...",
      "action": "warn",
      "affectedDrugs": ["drug_001", "drug_002"]
    }
  ],
  "recommendations": [
    "CAUTION: Major safety concerns identified...",
    "Monitor for interaction effects..."
  ],
  "alternatives": [
    {
      "drugId": "drug_003",
      "drugName": "Atorvastatin",
      "reason": "Alternative without identified safety concerns",
      "safetyProfile": "safer"
    }
  ]
}
```

### Drug Search
```
GET /api/drugs/search?q=aspirin
```

### Drug Details
```
GET /api/drugs/:id
```

### Drug Interactions
```
GET /api/drugs/:id/interactions
```

### Inventory Check
```
POST /api/inventory/check
```

Request body:
```json
{
  "drugId": "drug_001",
  "facilityId": "facility_001",
  "requiredQuantity": 30
}
```

### Stock Status
```
GET /api/inventory/:facilityId/:drugId/status
```

### Expiry Validation
```
GET /api/inventory/:facilityId/:drugId/expiry
```

### Statistics
```
GET /api/stats
```

## Installation

```bash
cd services/drug-safety-agent
npm install
```

## Configuration

Create a `.env` file:

```env
PORT=3007
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medhaos
SERVICE_NAME=drug-safety-agent
LOG_LEVEL=info
```

## Running the Service

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## Architecture

### Services

1. **DrugKnowledgeGraphService**: Manages the drug database, interactions, and allergy mappings
2. **DrugSafetyService**: Performs comprehensive safety checks
3. **InventoryIntegrationService**: Integrates with pharmacy inventory system

### Data Models

- **Drug**: Complete drug information including dosages, contraindications, side effects
- **DrugInteraction**: Drug-drug interaction with severity and clinical recommendations
- **AllergyMapping**: Allergy cross-reactivity information
- **SafetyAlert**: Safety issue with severity classification and recommended action

## Safety Alert Severity Levels

- **Critical**: Life-threatening, contraindicated (Action: Block)
- **Major**: Serious, requires intervention (Action: Warn)
- **Moderate**: Monitor closely (Action: Monitor)
- **Minor**: Minimal clinical significance (Action: Inform)

## Integration with MedhaOS

The Drug Safety Agent integrates with:
- **Clinician Terminal**: Real-time safety checks during prescription
- **Triage Agent**: Medication history validation
- **Supervisor Agent**: Event routing for critical drug safety alerts
- **Inventory System**: Stock availability and expiry validation

## Requirements Addressed

- **Requirement 4.1**: Real-time drug interaction checking
- **Requirement 4.2**: Allergy conflict detection with severity classification
- **Requirement 4.3**: Therapeutic alternative recommendations
- **Requirement 4.4**: Dosage validation and contraindication checking
- **Requirement 4.5**: Inventory integration for stock availability

## Future Enhancements

1. Expand drug database to 10,000+ medications
2. Machine learning for interaction prediction
3. Integration with external drug databases (FDA, WHO)
4. Pharmacogenomics integration
5. Real-time monitoring of adverse drug reactions
6. Clinical decision support for drug selection

## Testing

Run tests:
```bash
npm test
```

## License

Copyright © 2026 MedhaOS Healthcare Intelligence Ecosystem

# MedhaOS Supervisor Agent

Central orchestrator for the MedhaOS Healthcare Intelligence Ecosystem. The Supervisor Agent coordinates 18 specialized AI agents through intelligent event classification, task decomposition, and workflow orchestration.

## Features

### 1. Agent Orchestration Framework
- **LangGraph-based Workflow Engine**: State machine-based orchestration with conditional routing
- **Agent Registry**: Service discovery and capability management for all 18 AI agents
- **Semantic Kernel**: LLM-powered intent classification and reasoning
- **Context Management**: DynamoDB-based patient context and workflow state tracking

### 2. Event Classification and Routing
- **Event Classifier**: Uses Claude 3 to classify events into categories (CLINICAL, OPERATIONAL, FINANCIAL, PUBLIC_HEALTH, SUPPLY_CHAIN)
- **Priority Assignment**: Automatic priority levels (CRITICAL, URGENT, ROUTINE, SCHEDULED)
- **Agent Selection**: Intelligent routing to appropriate specialized agents
- **Task Decomposition**: Complex workflows broken into sequential subtasks

### 3. Mixed-Initiative Control
- **Confidence Threshold Evaluation**: Monitors agent confidence scores
- **Human Escalation**: Automatic escalation when confidence < 75%
- **Escalation Notifications**: Real-time alerts to appropriate personnel
- **Override Mechanisms**: Human operators can override AI decisions

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Supervisor Agent                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Agent      │  │   Intent     │  │   Context    │     │
│  │   Registry   │  │  Classifier  │  │   Manager    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │    Workflow     │                       │
│                   │     Engine      │                       │
│                   │   (LangGraph)   │                       │
│                   └─────────────────┘                       │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │   18 Specialized Agents  │
              └──────────────────────────┘
```

## API Endpoints

### Event Processing
```bash
POST /api/supervisor/events
```
Process a new event and initiate workflow.

**Request Body:**
```json
{
  "eventType": "CLINICAL",
  "source": "patient-mobile-app",
  "payload": {
    "symptoms": ["chest pain", "shortness of breath"],
    "vitals": {
      "bloodPressure": "145/92",
      "heartRate": 98
    }
  },
  "metadata": {
    "patientId": "uuid",
    "facilityId": "uuid"
  }
}
```

**Response:**
```json
{
  "workflowId": "uuid",
  "status": "active",
  "message": "Event processed successfully"
}
```

### Workflow Management
```bash
GET /api/supervisor/workflows/:workflowId
DELETE /api/supervisor/workflows/:workflowId
```

### Agent Registry
```bash
GET /api/supervisor/agents
GET /api/supervisor/agents/:agentType
PUT /api/supervisor/agents/:agentType/health
```

### Patient Context
```bash
GET /api/supervisor/patients/:patientId/context
GET /api/supervisor/patients/:patientId/workflows
```

### Health Check
```bash
GET /api/supervisor/health
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
PORT=3002
NODE_ENV=development

DATABASE_URL=postgresql://medhaos:medhaos123@localhost:5432/medhaos
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_REGION=ap-south-1

ANTHROPIC_API_KEY=your_anthropic_api_key_here
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

CONFIDENCE_THRESHOLD=0.75
ESCALATION_THRESHOLD=0.85
MAX_RETRY_ATTEMPTS=3
```

## Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## Agent Types

The Supervisor Agent coordinates the following 18 specialized agents:

### Clinical Intelligence (5)
- **TRIAGE**: AI Triage & Urgency Scoring
- **CDSS**: Clinical Decision Support System
- **DRUG_SAFETY**: Drug Interaction & Allergy Safety
- **AMBIENT_SCRIBE**: Ambient Clinical Documentation
- **DIAGNOSTIC_VISION**: Medical Image Analysis

### Operational Intelligence (6)
- **QUEUE_OPTIMIZATION**: ED/OPD Queue Management
- **BED_OCCUPANCY**: Bed Availability Forecasting
- **ICU_DEMAND**: ICU Demand Prediction
- **STAFF_SCHEDULING**: Staff Schedule Optimization
- **WORKFLOW_OPTIMIZATION**: Process Bottleneck Detection
- **NURSE_TASK_ROUTER**: Nursing Task Prioritization

### Supply Chain Intelligence (2)
- **DRUG_INVENTORY**: Medication Inventory Forecasting
- **BLOOD_BANK**: Blood Stock Forecasting

### Financial Intelligence (2)
- **REVENUE_CYCLE**: Medical Coding & Billing
- **CODING_BILLING**: Billing Error Minimization

### Public Health Intelligence (2)
- **DISEASE_PREDICTION**: Regional Disease Outbreak Prediction
- **INFECTION_SURVEILLANCE**: Infection Cluster Detection

### Post-Discharge Care (1)
- **FOLLOW_UP**: Follow-up & Adherence Management

## Workflow Execution

1. **Event Reception**: Incoming event received via API
2. **Classification**: LLM classifies event type and priority
3. **Task Decomposition**: Complex tasks broken into subtasks
4. **Agent Selection**: Appropriate agents selected based on capabilities
5. **Execution**: Agents execute tasks in dependency order
6. **Confidence Evaluation**: Each agent result evaluated for confidence
7. **Escalation**: Low-confidence results escalated to humans
8. **Completion**: Workflow completed and results returned

## Context Management

Patient context is maintained in DynamoDB with:
- Current state in patient journey
- Historical events and interactions
- Active workflows
- Metadata for personalization

## Error Handling

- **Retry Logic**: Failed tasks retried up to 3 times
- **Fallback Classification**: Rule-based fallback if LLM unavailable
- **Graceful Degradation**: System continues with available agents
- **Escalation**: Critical failures escalated to human operators

## Monitoring

The service provides health check endpoints that report:
- Total number of agents
- Agent health status (healthy/degraded/unavailable)
- System status
- Timestamp

## Requirements

Implements requirements:
- 1.3: Event classification and routing
- 2.4: Queue optimization coordination
- 3.4: Clinical documentation orchestration
- 4.2: Mixed-initiative control
- 5.5: Multi-agent coordination

## License

Copyright © 2026 MedhaOS. All rights reserved.

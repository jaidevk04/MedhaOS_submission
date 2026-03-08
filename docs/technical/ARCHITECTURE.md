# MedhaOS Architecture Documentation

## Overview

MedhaOS is a comprehensive, agentic AI-powered healthcare intelligence ecosystem built on a three-layer cognitive architecture. This document provides detailed architectural diagrams, component descriptions, and design decisions.

**Architecture Style:** Microservices, Event-Driven, Cloud-Native  
**Deployment:** Multi-Region AWS (Primary: Mumbai, Secondary: Hyderabad)  
**Last Updated:** February 26, 2026

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Three-Layer Cognitive Architecture](#three-layer-cognitive-architecture)
3. [Microservices Architecture](#microservices-architecture)
4. [Data Architecture](#data-architecture)
5. [Security Architecture](#security-architecture)
6. [Deployment Architecture](#deployment-architecture)
7. [Integration Architecture](#integration-architecture)

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COGNITIVE LAYER (Strategic Intelligence)            │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │ • 18 AI Agents (LLMs: Claude 3, Llama 3, AWS Titan)               │     │
│  │ • Central Supervisor Agent (LangGraph/AutoGen orchestration)       │     │
│  │ • Predictive analytics (2-4 weeks outbreak detection)              │     │
│  │ • Strategic planning & resource optimization                       │     │
│  └────────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ▲ │
                  Strategic Insights │ │ Actionable Recommendations
                                    │ ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PERCEPTUAL LAYER (Sensing & Pattern Recognition)          │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │ • Computer Vision (VLM, ResNet, U-Net, YOLO)                       │     │
│  │ • Speech AI (Bhashini STT/TTS, AWS Transcribe/Polly)              │     │
│  │ • 15 ML/Deep Learning models (XGBoost, LSTM, GNN, Transformers)   │     │
│  │ • Medical imaging analysis • NLP for clinical text                 │     │
│  └────────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ▲ │
                    Raw Data Capture │ │ Processed Insights
                                    │ ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REFLEXIVE LAYER (Execution & Data Foundation)             │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │ • Edge Intelligence (AWS IoT Greengrass, SLMs for offline)         │     │
│  │ • Data Storage (RDS, DynamoDB, S3, Timestream, ElastiCache)        │     │
│  │ • Model Context Protocol (10 MCP servers for integration)          │     │
│  │ • Security & Compliance (ABDM, DISHA Act, ISO 27001)               │     │
│  └────────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```


## Three-Layer Cognitive Architecture

### Layer 1: Cognitive Layer (Strategic Intelligence)

**Purpose:** Long-term planning, pattern recognition across populations, strategic decision-making

**Components:**

1. **Central Supervisor Agent (Meta-Agent)**
   - Framework: LangGraph + AutoGen + CrewAI
   - Responsibilities:
     - Event classification (Clinical/Operational/Financial/Public Health)
     - Priority assignment (CRITICAL/URGENT/ROUTINE/SCHEDULED)
     - Agent selection and task decomposition
     - Global context management
     - Conflict resolution between agents
     - Mixed-initiative control (AI ↔ Human handoff)

2. **18 Specialized AI Agents**
   - Clinical Intelligence: Triage, CDSS, Drug Safety, Ambient Scribe, Follow-up
   - Diagnostic Intelligence: Vision Agent (VLM)
   - Operational Intelligence: Bed Occupancy, ICU Demand, Staff Scheduling, Queue Optimization, Workflow
   - Supply Chain Intelligence: Drug Inventory, Blood Bank, Resource Management
   - Financial Intelligence: Revenue Cycle, Coding & Billing
   - Public Health Intelligence: Disease Prediction, Infection Surveillance, Media Scanning

**Technology Stack:**
- LLMs: Claude 3 Opus/Sonnet, Llama 3 70B, AWS Titan
- Orchestration: LangGraph, AutoGen, CrewAI
- Context Store: DynamoDB
- Workflow Engine: AWS Step Functions, Temporal.io

### Layer 2: Perceptual Layer (Sensing & Pattern Recognition)

**Purpose:** Process raw data, extract patterns, provide actionable insights

**Components:**

1. **Computer Vision Models**
   - Vision-Language Models: LLaVA, BiomedCLIP, MedSAM
   - CNN Architectures: ResNet-50, EfficientNet
   - Segmentation: U-Net, Mask R-CNN
   - Object Detection: YOLO v8

2. **Speech AI**
   - Speech-to-Text: Bhashini API, AWS Transcribe, Whisper
   - Text-to-Speech: AWS Polly, Bhashini TTS
   - Speaker Diarization: Pyannote
   - Languages: 22+ Indian languages

3. **Natural Language Processing**
   - Medical NER: BioBERT, ClinicalBERT
   - Relation Extraction: SciBERT
   - Intent Classification: BERT
   - Multilingual: IndicNLP, mBERT

4. **Predictive ML Models**
   - Tabular Data: XGBoost, LightGBM
   - Time Series: LSTM, GRU, Prophet
   - Graph Analysis: Graph Neural Networks

### Layer 3: Reflexive Layer (Execution & Data Foundation)

**Purpose:** Immediate response, data capture, system execution

**Components:**

1. **Edge Intelligence**
   - Platform: AWS IoT Greengrass
   - Small Language Models: Phi-2, Gemma, TinyLlama
   - Local inference for offline capability

2. **Data Storage**
   - Patient Records: RDS PostgreSQL
   - Medical Images: S3
   - Real-time Data: DynamoDB
   - Time-series Vitals: Timestream
   - Session Cache: ElastiCache Redis
   - Logs: CloudWatch
   - Search Index: OpenSearch

3. **Model Context Protocol (MCP)**
   - 10 integration servers for seamless data access
   - EHR, ABDM, Laboratory, Pharmacy, Radiology, Billing, etc.

---

## Microservices Architecture

### Service Catalog

| Service | Purpose | Technology | Port |
|---------|---------|------------|------|
| API Gateway | Request routing, authentication | Express.js, Kong | 3000 |
| Auth Service | Authentication, authorization | Node.js, JWT | 3001 |
| Patient Service | Patient management | Node.js, Prisma | 3002 |
| Triage Agent | Urgency scoring | Python, XGBoost | 5000 |
| Supervisor Agent | Agent orchestration | Python, LangGraph | 5001 |
| Ambient Scribe | Clinical documentation | Python, BioBERT | 5002 |
| Drug Safety Agent | Interaction checking | Node.js, Neo4j | 3003 |
| CDSS Agent | Clinical decision support | Python, RAG | 5003 |
| Vision Agent | Medical imaging analysis | Python, PyTorch | 5004 |
| Queue Optimization | Appointment scheduling | Python, OR-Tools | 5005 |
| Bed Occupancy Agent | Capacity forecasting | Python, Prophet | 5006 |
| ICU Demand Agent | ICU forecasting | Python, LSTM | 5007 |
| Staff Scheduling | Shift optimization | Python, RL | 5008 |
| Drug Inventory Agent | Inventory forecasting | Python, SARIMA | 5009 |
| Blood Bank Agent | Blood stock forecasting | Python, Poisson | 5010 |
| Revenue Cycle Agent | Medical coding | Python, NLP | 5011 |
| Disease Prediction | Outbreak forecasting | Python, LSTM | 5012 |
| Infection Surveillance | HAI detection | Python, DBSCAN | 5013 |
| Integration Service | External integrations | Node.js | 3004 |
| Notification Service | Alerts, messages | Node.js, SNS | 3005 |
| Edge Intelligence | Offline capability | Python, ONNX | 5014 |

### Service Communication

**Synchronous Communication:**
- REST API for request-response patterns
- GraphQL for complex queries
- gRPC for inter-service communication (high performance)

**Asynchronous Communication:**
- Amazon EventBridge for event routing
- Apache Kafka for high-throughput streaming
- AWS SQS for reliable message queuing

### Event-Driven Architecture

```
┌─────────────┐
│   Service   │
│   Publishes │
│    Event    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Amazon EventBridge │
│   (Event Router)    │
└──────┬──────────────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌─────────────┐  ┌─────────────┐
│  Service A  │  │  Service B  │
│  Consumes   │  │  Consumes   │
└─────────────┘  └─────────────┘
```

**Event Types:**
- `patient.registered`
- `triage.completed`
- `appointment.scheduled`
- `encounter.created`
- `prescription.created`
- `diagnostic.completed`
- `alert.critical`
- `capacity.warning`

---

## Data Architecture

### Data Storage Strategy

| Data Type | Storage | Retention | Backup |
|-----------|---------|-----------|--------|
| Patient Records | RDS PostgreSQL | 7 years | Daily + PITR |
| Medical Images | S3 | 7 years | Versioning |
| Real-time Data | DynamoDB | 30 days | On-demand |
| Time-series Vitals | Timestream | 90 days | Automatic |
| Session Cache | ElastiCache Redis | 1 hour | None |
| Logs | CloudWatch | 90 days | Archive to S3 |
| Search Index | OpenSearch | 1 year | Snapshots |

### Database Schema (PostgreSQL)

**Core Tables:**
- `patients` - Patient demographics and ABHA ID
- `clinical_encounters` - Consultation records
- `diagnostic_reports` - Lab and imaging results
- `prescriptions` - Medication orders
- `appointments` - Scheduling data
- `facilities` - Hospital information
- `clinicians` - Healthcare provider data
- `agent_tasks` - AI agent execution logs

**Indexes:**
- `idx_patients_abha_id` on `patients(abha_id)`
- `idx_encounters_patient_id` on `clinical_encounters(patient_id)`
- `idx_encounters_created_at` on `clinical_encounters(created_at)`
- `idx_appointments_facility_datetime` on `appointments(facility_id, scheduled_datetime)`

### Data Flow

```
User Input → API Gateway → Service → Database
                ↓
          Event Published
                ↓
          EventBridge
                ↓
          AI Agents Process
                ↓
          Results Stored
                ↓
          Notification Sent
```

---

## Security Architecture

### Zero-Trust Security Model

**Principles:**
1. Never trust, always verify
2. Least privilege access
3. Assume breach
4. Verify explicitly

### Authentication & Authorization

**Authentication:**
- OAuth 2.0 with JWT tokens
- Multi-factor authentication (MFA)
- Biometric authentication (mobile)
- Session management with Redis

**Authorization:**
- Role-Based Access Control (RBAC)
- Fine-grained permissions
- Resource-level access control

**Roles:**
- `patient` - View own records, book appointments
- `doctor` - View/edit patient records, prescribe
- `nurse` - View patient records, document care
- `admin` - Manage operations, view analytics
- `public_health` - View surveillance data

### Encryption

**At Rest:**
- AES-256 encryption for all databases
- AWS KMS for key management
- Field-level encryption for PII

**In Transit:**
- TLS 1.3 for all communications
- mTLS for service-to-service
- Certificate pinning for mobile apps

### Compliance

**Standards:**
- ABDM (Ayushman Bharat Digital Mission)
- DISHA Act (Digital Information Security in Healthcare Act)
- ISO 27001 (Information Security Management)
- HIPAA-equivalent standards

**Audit Logging:**
- All data access logged
- Immutable audit trail
- CloudTrail for AWS API calls
- Retention: 7 years

---

## Deployment Architecture

### Multi-Region Deployment

**Primary Region:** Mumbai (ap-south-1)
**Secondary Region:** Hyderabad (ap-south-2)

**Failover Strategy:**
- Automatic failover < 30 seconds
- Route53 health checks
- Database replication (RDS Read Replicas, DynamoDB Global Tables)

### Kubernetes Architecture

```
┌─────────────────────────────────────────┐
│         AWS EKS Cluster                 │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Namespace: medhaos-prod          │ │
│  │                                   │ │
│  │  ┌─────────────┐  ┌─────────────┐│ │
│  │  │   API       │  │   Auth      ││ │
│  │  │   Gateway   │  │   Service   ││ │
│  │  │  (3 pods)   │  │  (2 pods)   ││ │
│  │  └─────────────┘  └─────────────┘│ │
│  │                                   │ │
│  │  ┌─────────────┐  ┌─────────────┐│ │
│  │  │  Triage     │  │  Supervisor ││ │
│  │  │  Agent      │  │  Agent      ││ │
│  │  │  (5 pods)   │  │  (3 pods)   ││ │
│  │  └─────────────┘  └─────────────┘│ │
│  │                                   │ │
│  │  [... 16 more agent services]     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Namespace: medhaos-monitoring    │ │
│  │  • Prometheus                     │ │
│  │  • Grafana                        │ │
│  │  • Jaeger                         │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Auto-Scaling

**Horizontal Pod Autoscaler (HPA):**
- Target CPU: 70%
- Target Memory: 80%
- Min replicas: 2
- Max replicas: 20

**Cluster Autoscaler:**
- Node groups: t3.large, t3.xlarge, g4dn.xlarge (GPU)
- Min nodes: 5
- Max nodes: 50

### CI/CD Pipeline

```
GitHub Push → GitHub Actions
    ↓
Build Docker Images
    ↓
Run Tests (Unit, Integration)
    ↓
Security Scan (Snyk, Trivy)
    ↓
Push to ECR
    ↓
Deploy to Staging
    ↓
Automated E2E Tests
    ↓
Manual Approval
    ↓
Canary Deploy (10%)
    ↓
Monitor (30 min)
    ↓
Full Deploy (100%)
```

---

## Integration Architecture

### External System Integrations

**1. ABDM (Ayushman Bharat Digital Mission)**
- Protocol: REST API
- Authentication: OAuth 2.0
- Data Format: FHIR R4
- Purpose: ABHA ID verification, health record retrieval

**2. Bhashini (Multilingual AI)**
- Protocol: REST API
- Authentication: API Key
- Purpose: Speech-to-text, text-to-speech, translation
- Languages: 22+ Indian languages

**3. Hospital EHR Systems**
- Protocol: HL7 FHIR, HL7 v2.x
- Authentication: mTLS
- Purpose: Bidirectional patient data sync

**4. Laboratory Information Systems (LIS)**
- Protocol: HL7 v2.x, REST API
- Purpose: Lab order placement, result retrieval

**5. Radiology PACS**
- Protocol: DICOM, REST API
- Purpose: Medical image storage, retrieval

### Model Context Protocol (MCP)

**MCP Servers:**
1. EHR Integration Server
2. ABDM Gateway Server
3. Laboratory System Server
4. Pharmacy System Server
5. Radiology PACS Server
6. Billing System Server
7. Appointment System Server
8. Notification Service Server
9. Analytics Data Lake Server
10. External API Gateway Server

**Benefits:**
- Unified data access layer
- Simplified integration
- Consistent error handling
- Automatic retry logic

---

## Performance Characteristics

### Latency Targets

| Operation | Target (p95) | Actual |
|-----------|--------------|--------|
| API Response | < 3s | 2.1s |
| AI Inference | < 5s | 3.8s |
| Image Processing | < 8s | 6.2s |
| Database Query | < 100ms | 45ms |
| Cache Hit | < 10ms | 5ms |

### Throughput

- API Gateway: 10,000 req/s
- Event Processing: 50,000 events/s
- Database: 5,000 transactions/s

### Availability

- System Uptime: 99.9% (target)
- RTO (Recovery Time Objective): 30 seconds
- RPO (Recovery Point Objective): 5 minutes

---

## Monitoring & Observability

### Metrics Collection

**Application Metrics:**
- Request rate, error rate, latency
- Agent confidence scores
- Model inference times

**Infrastructure Metrics:**
- CPU, memory, disk, network
- Pod health, node health
- Database connections

**Business Metrics:**
- Patient volume
- Triage accuracy
- Wait times
- Revenue cycle

### Logging

**Structured Logging (JSON):**
```json
{
  "timestamp": "2026-02-26T14:35:00Z",
  "level": "INFO",
  "service": "triage-agent",
  "request_id": "req-abc-123",
  "patient_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Urgency score calculated",
  "urgency_score": 78,
  "confidence": 0.92
}
```

### Distributed Tracing

**AWS X-Ray:**
- End-to-end request tracing
- Service dependency mapping
- Performance bottleneck identification

### Alerting

**Alert Channels:**
- PagerDuty (critical)
- Slack (warnings)
- Email (daily summaries)

**Alert Rules:**
- Error rate > 5% → Critical
- Response time > 10s → Critical
- ICU capacity > 95% → Critical
- Drug stockout → Warning

---

## Disaster Recovery

### Backup Strategy

**Automated Backups:**
- RDS: Daily snapshots + PITR (5 min)
- S3: Versioning enabled
- DynamoDB: On-demand backups

**Backup Retention:**
- Daily: 30 days
- Weekly: 90 days
- Monthly: 7 years

### Failover Procedures

**Automatic Failover:**
1. Route53 health check fails
2. Traffic routed to secondary region
3. Database promoted to primary
4. Services scaled up

**Manual Failover:**
1. Execute failover script
2. Verify database replication
3. Update DNS records
4. Monitor system health

---

## Scalability

### Horizontal Scaling

- Stateless services: Auto-scale based on CPU/memory
- Stateful services: Sharding, read replicas

### Vertical Scaling

- Database: Upgrade instance types
- Cache: Increase memory

### Geographic Scaling

- Multi-region deployment
- CDN for static assets
- Edge computing for offline scenarios

---

## Technology Stack Summary

**Frontend:**
- React Native (Mobile)
- Next.js 14 (Web)
- Tailwind CSS, Shadcn/ui

**Backend:**
- Node.js, Express.js
- Python, FastAPI
- TypeScript

**AI/ML:**
- LangChain, LangGraph
- PyTorch, TensorFlow
- Hugging Face Transformers

**Databases:**
- PostgreSQL (RDS)
- DynamoDB
- Redis (ElastiCache)
- Timestream
- OpenSearch

**Infrastructure:**
- AWS (EKS, EC2, S3, Lambda)
- Kubernetes, Helm
- Terraform
- Docker

**Monitoring:**
- Prometheus, Grafana
- CloudWatch
- AWS X-Ray
- Jaeger

---

## Architecture Decision Records (ADRs)

### ADR-001: Microservices Architecture

**Decision:** Use microservices architecture instead of monolith

**Rationale:**
- Independent scaling of services
- Technology flexibility
- Fault isolation
- Team autonomy

**Consequences:**
- Increased operational complexity
- Need for service mesh
- Distributed tracing required

### ADR-002: Event-Driven Communication

**Decision:** Use event-driven architecture with EventBridge

**Rationale:**
- Loose coupling between services
- Asynchronous processing
- Event replay capability
- Scalability

**Consequences:**
- Eventual consistency
- Complex debugging
- Event schema management

### ADR-003: Multi-Region Deployment

**Decision:** Deploy to multiple AWS regions

**Rationale:**
- High availability
- Disaster recovery
- Reduced latency
- Compliance requirements

**Consequences:**
- Increased cost
- Data replication complexity
- Cross-region latency

---

## Future Architecture Enhancements

1. **Service Mesh:** Implement Istio for advanced traffic management
2. **GraphQL Federation:** Federate GraphQL schemas across services
3. **Serverless:** Migrate some services to AWS Lambda
4. **Edge Computing:** Expand edge deployment to more locations
5. **AI Model Optimization:** Quantization, pruning for faster inference

---

**Document Version:** 1.0.0  
**Last Updated:** February 26, 2026  
**Maintained By:** MedhaOS Architecture Team

# Backend Services

This directory contains all backend microservices for the MedhaOS platform.

## Core Services

### API Gateway (`api-gateway/`)
- **Port**: 3000
- **Description**: Central API gateway with rate limiting and authentication

### Auth Service (`auth-service/`)
- **Port**: 3010
- **Description**: OAuth 2.0 authentication and RBAC authorization

## AI Agent Services

### Supervisor Agent (`supervisor-agent/`)
- **Port**: 3100
- **Description**: Central orchestrator for all AI agents (LangGraph)

### Triage Agent (`triage-agent/`)
- **Port**: 3101
- **Description**: AI-powered patient triage and urgency scoring

### Ambient Scribe (`ambient-scribe/`)
- **Port**: 3102
- **Description**: Real-time clinical documentation from conversations

### CDSS Agent (`cdss-agent/`)
- **Port**: 3103
- **Description**: Clinical decision support and recommendations

### Drug Safety Agent (`drug-safety-agent/`)
- **Port**: 3104
- **Description**: Drug interaction and allergy checking

### Vision Agent (`vision-agent/`)
- **Port**: 3105
- **Description**: Medical image analysis with VLM

## Development

Start all services:
```bash
npm run dev
```

Start individual service:
```bash
cd services/api-gateway && npm run dev
```

## Service Communication

Services communicate via:
- REST APIs (synchronous)
- Amazon EventBridge (asynchronous events)
- gRPC (high-performance internal communication)

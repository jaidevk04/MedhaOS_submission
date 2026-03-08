# @medhaos/database

Database schema and client for the MedhaOS Healthcare Intelligence Ecosystem.

## Overview

This package provides:
- Prisma schema definitions for all core entities
- Type-safe database client
- Database utilities and helpers
- Migration management

## Installation

```bash
npm install @medhaos/database
```

## Setup

1. Copy the environment file:
```bash
cp .env.example .env
```

2. Update the `DATABASE_URL` in `.env` with your PostgreSQL connection string.

3. Generate Prisma client:
```bash
npm run db:generate
```

4. Run migrations:
```bash
npm run db:migrate
```

## Usage

### Import the client

```typescript
import { prisma } from '@medhaos/database';

// Query patients
const patients = await prisma.patient.findMany({
  where: {
    district: 'Mumbai',
  },
  include: {
    medicalHistory: true,
    currentMedications: true,
  },
});
```

### Using utilities

```typescript
import { buildPagination, buildTextSearch } from '@medhaos/database';

const pagination = buildPagination({ page: 1, limit: 20 });
const searchFilter = buildTextSearch('firstName', 'John');

const results = await prisma.patient.findMany({
  where: searchFilter,
  ...pagination,
});
```

### Transaction handling

```typescript
import { withTransaction } from '@medhaos/database';

const result = await withTransaction(async (tx) => {
  const patient = await tx.patient.create({
    data: patientData,
  });

  await tx.medicalHistory.create({
    data: {
      patientId: patient.id,
      ...historyData,
    },
  });

  return patient;
});
```

## Database Schema

### PostgreSQL (Prisma)

#### Clinical Schema
- `patients` - Patient demographics and contact information
- `medical_history` - Patient medical history records
- `current_medications` - Active medications
- `clinical_encounters` - Patient visits and consultations
- `diagnoses` - Diagnosis records with ICD codes
- `prescriptions` - Medication prescriptions
- `diagnostic_orders` - Lab and imaging orders
- `diagnostic_reports` - Radiology and lab reports with AI analysis

#### Operational Schema
- `facilities` - Hospital and clinic information
- `agent_tasks` - AI agent task execution records

#### Audit Schema
- `audit_logs` - Comprehensive audit trail for compliance

### DynamoDB (Real-time Data)

#### Agent Tasks Table
- Real-time AI agent task tracking
- Access patterns: by agent name, status, patient ID
- DynamoDB Streams enabled for event processing

#### Session Data Table
- User session management with automatic TTL
- Access patterns: by user ID, active sessions
- TTL-based automatic cleanup

#### Queue Management Table
- Real-time patient queue management
- Access patterns: by facility/queue type, urgency score, status
- Priority-based sorting for optimal queue ordering

## Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database (dev)
- `npm run db:migrate` - Create and run migrations
- `npm run db:migrate:deploy` - Deploy migrations (production)
- `npm run db:studio` - Open Prisma Studio GUI
- `npm run db:seed` - Seed database with sample data
- `npm run dynamodb:setup` - Create DynamoDB tables (requires LocalStack or AWS)

## Performance Optimization

### Indexes

The schema includes optimized indexes for:
- Patient lookups by ABHA ID, phone, location
- Encounter queries by patient, facility, status
- Diagnostic report searches
- Agent task monitoring
- Audit log queries

### Connection Pooling

The client is configured with connection pooling:
- Min connections: 2
- Max connections: 10
- Idle timeout: 10 seconds

### Query Optimization

Use `include` and `select` to fetch only required data:

```typescript
// Good - fetch only needed fields
const patient = await prisma.patient.findUnique({
  where: { id },
  select: {
    id: true,
    firstName: true,
    lastName: true,
  },
});

// Better - use relations efficiently
const encounter = await prisma.clinicalEncounter.findUnique({
  where: { id },
  include: {
    patient: {
      select: {
        firstName: true,
        lastName: true,
        allergies: true,
      },
    },
    diagnoses: true,
  },
});
```

## Security

### Data Encryption

- All sensitive data is encrypted at rest (AES-256)
- TLS 1.3 for data in transit
- Field-level encryption for PII

### Audit Logging

All data modifications are automatically logged to `audit_logs` table with:
- User context
- IP address
- Timestamp
- Before/after data snapshots

### Access Control

Database access is controlled through:
- Role-based permissions
- Row-level security policies
- Schema-level isolation

## Compliance

The database schema is designed to comply with:
- ABDM (Ayushman Bharat Digital Mission) standards
- DISHA Act requirements
- ISO 27001 security controls
- HIPAA-equivalent standards

## Troubleshooting

### Connection Issues

If you encounter connection errors:

1. Verify PostgreSQL is running:
```bash
docker-compose ps postgres
```

2. Check connection string in `.env`

3. Test connection:
```bash
npm run db:studio
```

### Migration Issues

If migrations fail:

1. Reset database (dev only):
```bash
npx prisma migrate reset
```

2. Generate client:
```bash
npm run db:generate
```

3. Re-run migrations:
```bash
npm run db:migrate
```

## Contributing

When adding new models:

1. Update `schema.prisma`
2. Add appropriate indexes
3. Create migration: `npm run db:migrate`
4. Update types in `src/types.ts`
5. Add utility functions if needed
6. Update this README

## License

Proprietary - MedhaOS Healthcare Platform

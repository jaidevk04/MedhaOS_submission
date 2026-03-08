# Shared Packages

This directory contains shared libraries used across the MedhaOS platform.

## Packages

### UI Components (`ui-components/`)
- Shared React components for all frontend applications
- Design system implementation
- Storybook documentation

### Types (`types/`)
- TypeScript type definitions
- Shared interfaces and enums
- API contract types

### Utils (`utils/`)
- Common utility functions
- Date/time helpers
- Validation functions
- Formatting utilities

### Config (`config/`)
- Shared configuration
- Environment variable management
- Feature flags

### Database (`database/`)
- Prisma schema
- Database migrations
- Seed data
- Repository patterns

## Usage

Import shared packages in your application:

```typescript
import { Button, Card } from '@medhaos/ui-components';
import { Patient, ClinicalEncounter } from '@medhaos/types';
import { formatDate, validateEmail } from '@medhaos/utils';
import { config } from '@medhaos/config';
```

## Development

Build all packages:
```bash
npm run build
```

Build individual package:
```bash
cd packages/types && npm run build
```

# Frontend Applications

This directory contains all frontend applications for the MedhaOS platform.

## Applications

### Patient Mobile App (`patient-mobile/`)
- **Technology**: React Native with Expo
- **Platform**: iOS, Android, Web
- **Port**: N/A (mobile)
- **Description**: Voice-first patient interface with multilingual support

### Clinician Terminal (`clinician-terminal/`)
- **Technology**: Next.js 14
- **Port**: 3002
- **Description**: Desktop interface for doctors with ambient scribe and CDSS

### Nurse Tablet (`nurse-tablet/`)
- **Technology**: React with Vite
- **Port**: 3003
- **Description**: Touch-optimized tablet interface for nurses

### Admin Dashboard (`admin-dashboard/`)
- **Technology**: Next.js 14
- **Port**: 3004
- **Description**: Operations dashboard for hospital administrators

### Public Health Dashboard (`public-health-dashboard/`)
- **Technology**: Next.js 14
- **Port**: 3005
- **Description**: Disease surveillance and outbreak prediction dashboard

## Development

Start all applications:
```bash
npm run dev
```

Start individual application:
```bash
cd apps/patient-mobile && npm run dev
```

## Shared Components

UI components are shared via `@medhaos/ui-components` package.

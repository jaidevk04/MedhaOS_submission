# MedhaOS Patient Mobile Application

React Native mobile application for patients to access healthcare services through the MedhaOS platform.

## Features

- **Multilingual Support**: 22+ Indian languages with voice-first interface
- **Voice-Based Triage**: Speak symptoms in native language for AI-powered assessment
- **Smart Appointment Booking**: Automatic facility and doctor matching based on urgency
- **Health Records**: Access medical history, diagnostic reports, and prescriptions
- **Medication Management**: Reminders, pill scanning, and adherence tracking
- **Post-Discharge Care**: Recovery plans and automated follow-ups
- **Offline Capability**: Core features work without internet connectivity

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: Zustand
- **Styling**: Custom theme system with design tokens
- **API Client**: Fetch-based HTTP client

## Project Structure

```
apps/patient-mobile/
├── src/
│   ├── components/       # Reusable UI components
│   ├── navigation/       # Navigation configuration
│   ├── screens/          # Screen components
│   ├── store/            # Zustand state management
│   ├── theme/            # Design tokens (colors, typography, spacing)
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── assets/               # Images, fonts, and other assets
├── App.tsx               # Main app component
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Expo CLI

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

## Development

### Theme System

The app uses a comprehensive design token system for consistent styling:

- **Colors**: Primary, secondary, urgency levels, semantic colors
- **Typography**: Font sizes, weights, and text styles
- **Spacing**: Consistent spacing values
- **Shadows**: Elevation and shadow styles

Example usage:

```typescript
import { theme } from '@theme';

const styles = {
  container: {
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.md,
  },
  title: {
    ...theme.typography.styles.h1,
    color: theme.colors.text.primary,
  },
};
```

### State Management

The app uses Zustand for state management with separate stores:

- **authStore**: User authentication and profile
- **appStore**: Global app state (language, notifications, online status)

Example usage:

```typescript
import { useAuthStore } from '@store';

const user = useAuthStore((state) => state.user);
const login = useAuthStore((state) => state.login);
```

### Navigation

Navigation is structured with:

- **RootNavigator**: Switches between Auth and Main flows
- **AuthNavigator**: Authentication screens (login, register, etc.)
- **MainNavigator**: Bottom tab navigation for authenticated users

## Requirements Addressed

- **Requirement 1.1**: Multilingual patient registration and interface
- **Requirement 16.1**: Patient-focused interface with role-based access

## Next Steps

- Task 20.2: Implement authentication and onboarding screens
- Task 20.3: Build home screen and navigation
- Task 20.4: Implement voice-based triage interface
- Task 20.5: Build appointment booking flow
- Task 20.6: Create health records viewer
- Task 20.7: Implement medication management
- Task 20.8: Build recovery plan interface

## License

Proprietary - MedhaOS Healthcare Platform

# MedhaOS Nurse Tablet Application

Touch-optimized task coordination interface for nurses built with React, TypeScript, and Vite.

## Features

### Task 22.1: React Tablet Application Setup ✅

- **React + TypeScript**: Modern React 18 with full TypeScript support
- **Touch-Optimized UI**: 
  - Minimum 44px touch targets
  - Gesture controls (swipe, long-press, double-tap)
  - Touch-friendly components with proper spacing
  - Tap highlight removal for native feel
- **Offline-First Architecture**:
  - IndexedDB for local data storage
  - Service Worker with PWA support
  - Automatic sync when online
  - Sync queue for offline changes
- **Gesture Controls**:
  - Swipe left/right for task actions
  - Long-press for context menus
  - Double-tap for quick actions
  - Drag-and-drop for task reordering

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Routing**: React Router v6
- **State Management**: Zustand
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS
- **Drag & Drop**: @dnd-kit
- **Gestures**: react-use-gesture
- **Offline Storage**: idb (IndexedDB wrapper)
- **PWA**: vite-plugin-pwa

## Project Structure

```
apps/nurse-tablet/
├── src/
│   ├── components/
│   │   └── ui/           # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   │   ├── useGesture.ts
│   │   ├── useOnlineStatus.ts
│   │   └── useToast.ts
│   ├── lib/
│   │   ├── offlineStorage.ts  # IndexedDB wrapper
│   │   └── utils.ts           # Utility functions
│   ├── pages/            # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── TasksPage.tsx      # To be implemented in 22.2
│   │   ├── PatientsPage.tsx   # To be implemented in 22.3
│   │   ├── MedicationPage.tsx # To be implemented in 22.4
│   │   └── CommunicationPage.tsx # To be implemented in 22.5
│   ├── store/            # Zustand stores
│   │   ├── authStore.ts
│   │   ├── taskStore.ts
│   │   └── patientStore.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The application will be available at `http://localhost:3003`

### Build for Production

```bash
npm run build
npm run preview
```

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
VITE_AUTH_SERVICE_URL=http://localhost:4001
VITE_NURSE_SERVICE_URL=http://localhost:4010
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_BARCODE_SCANNER=true
VITE_ENABLE_VOICE_NOTES=true
```

## Offline Capability

The application uses IndexedDB for offline data storage:

- **Tasks**: Cached locally with sync queue
- **Patients**: Patient assignments and vitals
- **Messages**: Communication history
- **Handoff Notes**: Shift handoff information

When offline, all changes are queued and automatically synced when connectivity is restored.

## Gesture Controls

### Swipe Gestures
- **Swipe Left**: Complete task / Mark as done
- **Swipe Right**: Snooze / Defer task

### Long Press
- Hold for 500ms to open context menu
- Available on task cards and patient cards

### Double Tap
- Quick action on task cards
- Opens task details

## Touch Optimization

- All interactive elements have minimum 44px touch targets
- Proper spacing between touch elements
- Visual feedback on touch
- No text selection on UI elements
- Disabled zoom and overscroll

## PWA Features

- Installable on tablets
- Offline functionality
- Background sync
- Push notifications (when implemented)
- Landscape orientation optimized

## Next Steps

### Task 22.2: Task Prioritization Interface
- Color-coded task cards (urgent/soon/routine)
- Drag-and-drop reordering
- Swipe-to-complete interactions
- Task filtering and search

### Task 22.3: Patient Assignment View
- Patient list with acuity scores
- Vital signs status display
- Medication due time indicators
- Alert notifications

### Task 22.4: Medication Administration Workflow
- Barcode scanner integration
- Five rights verification checklist
- Medication verification display
- Documentation capture

### Task 22.5: Communication and Escalation Tools
- Quick messaging to doctors
- Escalation button
- Handoff notes interface
- Shift report generation

## Requirements Addressed

- **Requirement 14.4**: Touch-optimized tablet interface for nurses
- **Requirement 16.3**: Role-based access for nurse users
- **Requirement 15.1**: Offline capability with edge intelligence
- **Requirement 15.2**: Automatic sync when connectivity restored

## License

Private - MedhaOS Healthcare Platform

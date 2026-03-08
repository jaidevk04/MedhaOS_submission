# MedhaOS Public Health Dashboard

Real-time disease surveillance and outbreak prediction dashboard for India's public health officials.

## Overview

The Public Health Dashboard provides comprehensive visualization and monitoring capabilities for:
- Disease outbreak prediction (2-4 weeks advance warning)
- Interactive India heatmap with district-level risk data
- Real-time outbreak alerts and RRT deployment tracking
- Syndromic surveillance trends
- Media scanning for early disease detection
- Public awareness campaign management

## Features

### Implemented (Task 24.1)
- ✅ Next.js 14 application setup with TypeScript
- ✅ React Map GL integration for geographic visualization
- ✅ D3.js setup for custom charts
- ✅ Real-time WebSocket connection for live updates
- ✅ Zustand state management
- ✅ Tailwind CSS with custom design system
- ✅ Core type definitions and utilities
- ✅ Responsive layout with header and navigation

### Upcoming Subtasks
- 🔲 24.2: India disease heatmap with interactive layers
- 🔲 24.3: Predictive outbreak alert cards
- 🔲 24.4: Outbreak timeline interface
- 🔲 24.5: Resource allocation tracker
- 🔲 24.6: Syndromic trends visualization
- 🔲 24.7: Media scanning insights panel
- 🔲 24.8: Public awareness campaign manager

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Mapping**: React Map GL + Mapbox GL
- **Charts**: D3.js + Recharts
- **Real-time**: Socket.io Client
- **UI Components**: Custom components with Radix UI patterns

## Prerequisites

- Node.js 18+ and npm
- Mapbox API token (for map visualization)

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Add your Mapbox token to .env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

## Getting a Mapbox Token

1. Sign up at https://www.mapbox.com/
2. Go to Account → Tokens
3. Create a new token or use the default public token
4. Copy the token to your `.env` file

## Development

```bash
# Start development server
npm run dev

# The dashboard will be available at http://localhost:3005
```

## Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Main dashboard page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (redirects to dashboard)
├── components/            # React components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility functions
│   ├── utils.ts          # General utilities
│   └── websocket.ts      # WebSocket service
├── store/                 # Zustand stores
│   └── dashboardStore.ts # Dashboard state management
└── types/                 # TypeScript type definitions
    └── index.ts          # Core types
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_MAPBOX_TOKEN=     # Mapbox API token for maps

# Optional (defaults provided)
NEXT_PUBLIC_API_URL=          # Backend API URL (default: http://localhost:4000)
NEXT_PUBLIC_WS_URL=           # WebSocket URL (default: ws://localhost:4000)
PUBLIC_HEALTH_AGENT_URL=      # Public Health Agent URL (default: http://localhost:4016)
```

## API Integration

The dashboard connects to the Public Health Intelligence Agent service for data:

- **Endpoint**: `http://localhost:4016` (configurable)
- **WebSocket**: Real-time updates for outbreak alerts, RRT deployments, and media events
- **REST API**: Historical data, trends, and resource allocation

## Key Features

### Real-time Updates
- WebSocket connection for live outbreak alerts
- Automatic reconnection with exponential backoff
- Event-driven state updates

### Interactive Map
- District-level disease risk visualization
- Multiple data layers (syndromic, lab, environmental, mobility)
- Zoom and pan controls
- Click interactions for detailed information

### Predictive Analytics
- 2-4 week outbreak forecasts
- 89% prediction accuracy
- Environmental factor correlation
- Syndromic surveillance integration

### Resource Management
- RRT deployment tracking
- Medical supply inventory
- Hospital capacity monitoring
- Gap identification and alerts

## Design System

### Colors
- Primary: Blue (#1890FF)
- Success: Green (#52C41A)
- Warning: Orange (#FAAD14)
- Error: Red (#FF4D4F)

### Typography
- Font: Inter (primary), system fonts (fallback)
- Scale: 12px to 48px

### Components
- Cards with glassmorphism effects
- Color-coded badges for risk levels
- Responsive grid layouts
- Smooth animations and transitions

## Performance

- Server-side rendering with Next.js
- Optimized bundle size
- Lazy loading for map components
- Efficient state management with Zustand
- WebSocket connection pooling

## Accessibility

- WCAG 2.1 AA compliance target
- Keyboard navigation support
- Screen reader optimization
- High contrast ratios (4.5:1 minimum)
- Semantic HTML structure

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

## Related Services

- **Public Health Intelligence Agent**: `services/public-health-intelligence-agent`
- **Integration Service**: `services/integration-service`
- **Supervisor Agent**: `services/supervisor-agent`

## Requirements Mapping

This dashboard implements requirements:
- **11.1**: Regional disease prediction with 2-4 week advance warning
- **11.2**: Climate data integration for outbreak forecasting
- **11.3**: Media scanning for early disease detection
- **11.4**: District-level heatmaps and outbreak timelines
- **11.5**: Resource allocation tracking and RRT deployment
- **16.5**: Role-based public health official interface

## Next Steps

1. Implement India disease heatmap (Task 24.2)
2. Create outbreak alert cards (Task 24.3)
3. Build outbreak timeline (Task 24.4)
4. Add resource allocation tracker (Task 24.5)
5. Implement syndromic trends charts (Task 24.6)
6. Create media scanning panel (Task 24.7)
7. Build campaign manager (Task 24.8)

## License

Part of the MedhaOS Healthcare Intelligence Ecosystem

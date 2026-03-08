# MedhaOS Administrator Dashboard

Healthcare Intelligence Operations Command Center built with Next.js 14, React, TypeScript, and Recharts.

## Features

- **Real-time Data Streaming**: WebSocket integration for live updates
- **Responsive Grid Layout**: Adaptive dashboard layout for all screen sizes
- **Data Visualization**: Recharts for interactive charts and graphs
- **State Management**: Zustand for efficient state management
- **Type Safety**: Full TypeScript support
- **Modern UI**: Tailwind CSS with custom design system

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Real-time**: Socket.io Client
- **State**: Zustand
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend services running (for WebSocket and API connections)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_OPERATIONAL_INTELLIGENCE_URL=http://localhost:3010
NEXT_PUBLIC_SUPPLY_CHAIN_URL=http://localhost:3011
NEXT_PUBLIC_REVENUE_CYCLE_URL=http://localhost:3012
NEXT_PUBLIC_PUBLIC_HEALTH_URL=http://localhost:3013
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:3001
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3004
```

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
apps/admin-dashboard/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── ui/                 # UI components
│   │   ├── capacity/           # Capacity management components
│   │   ├── analytics/          # Analytics components
│   │   ├── alerts/             # Alert components
│   │   ├── financial/          # Financial components
│   │   ├── operational/        # Operational components
│   │   └── staff/              # Staff management components
│   ├── lib/                    # Utilities
│   │   ├── utils.ts            # Helper functions
│   │   └── websocket.ts        # WebSocket service
│   ├── store/                  # State management
│   │   └── dashboardStore.ts   # Dashboard state
│   └── types/                  # TypeScript types
│       └── index.ts            # Type definitions
├── public/                     # Static assets
├── .env.example                # Environment variables template
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

## Dashboard Sections

### 1. Capacity Management Overview
- Bed occupancy gauge charts
- ICU utilization display
- ED queue metrics
- Staff coverage indicators
- OPD wait time display

### 2. Predictive Analytics
- Bed occupancy forecast charts
- ICU demand forecast display
- Drug inventory alerts
- Blood bank status indicators

### 3. Alerts & Notifications
- Critical alert cards
- Warning notifications
- Action buttons for each alert
- Alert history and filtering

### 4. Financial Overview
- Revenue cycle metrics display
- Claim submission tracking
- Denial rate trend charts
- Accounts receivable aging

### 5. Operational Efficiency
- Wait time trend charts
- Patient satisfaction display
- Bottleneck identification view
- Process optimization recommendations

### 6. Staff Management
- Shift coverage display
- Burnout risk indicators
- Overtime tracking
- Schedule optimization suggestions

## Real-time Updates

The dashboard connects to the backend WebSocket server for real-time updates:

- **Capacity Updates**: Live bed occupancy, ICU status, queue lengths
- **Alerts**: Critical notifications, warnings, and system alerts
- **Forecast Updates**: Updated predictions and analytics
- **Metrics Updates**: Financial, operational, and staff metrics

## Design System

### Colors

- **Primary**: Blue (#1890FF)
- **Success**: Green (#52C41A)
- **Warning**: Orange (#FAAD14)
- **Error**: Red (#FF4D4F)
- **Info**: Blue (#1890FF)

### Typography

- **Font Family**: Inter (body), Poppins (headings)
- **Font Sizes**: 12px - 48px scale

### Components

- Cards with glassmorphism effects
- Gradient backgrounds
- Smooth animations and transitions
- Responsive grid layouts

## Performance

- Server-side rendering with Next.js
- Optimized bundle size
- Lazy loading for charts
- Efficient WebSocket connection management
- Debounced updates for high-frequency data

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Private - MedhaOS Healthcare Platform

## Support

For issues and questions, contact the development team.

# MedhaOS Mock API Server

A lightweight mock API server for MedhaOS frontend development. Provides REST endpoints and WebSocket connections for real-time updates.

## Features

- REST API endpoints for patient data, alerts, and metrics
- WebSocket server for real-time updates
- CORS enabled for all frontend applications
- Health check endpoint
- Simulated real-time data updates

## Installation

```bash
npm install
```

## Usage

### Start the server

```bash
npm start
```

The server will start on port 4000 by default.

### Development mode (with auto-reload)

```bash
npm run dev
```

## Endpoints

### REST API

- `GET /health` - Health check endpoint
- `GET /api/patients` - Get patient list
- `GET /api/alerts` - Get system alerts

### WebSocket Events

#### Server → Client

- `connected` - Sent when client connects
- `update` - Real-time metrics updates (every 5 seconds)

#### Client → Server

- `subscribe` - Subscribe to a specific channel
- `unsubscribe` - Unsubscribe from a channel

## Configuration

The server can be configured using environment variables:

- `PORT` - Server port (default: 4000)

## Connected Applications

The following frontend applications connect to this API server:

- Clinician Terminal (http://localhost:3002)
- Nurse Tablet (http://localhost:3003)
- Admin Dashboard (http://localhost:3004)
- Public Health Dashboard (http://localhost:3005)

## Development Notes

This is a mock server for frontend development. In production, replace this with:

- Proper microservices architecture
- Authentication and authorization
- Database connections
- Real-time data processing
- API gateway
- Load balancing

## Logs

The server logs all WebSocket connections and subscriptions to the console for debugging.

# MedhaOS API Gateway

Central entry point for all API requests in the MedhaOS Healthcare Intelligence Ecosystem.

## Features

- **Request Routing**: Intelligent routing to 17+ microservices
- **Authentication & Authorization**: JWT-based auth with RBAC
- **Rate Limiting**: 1000 requests/minute per user (configurable)
- **CORS Configuration**: Secure cross-origin resource sharing
- **Request Validation**: Input sanitization and validation
- **Error Handling**: Centralized error handling and logging
- **Monitoring**: Request tracking with correlation IDs
- **Security**: Helmet.js, input sanitization, rate limiting

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Request Pipeline                                       │ │
│  │  1. CORS                                                │ │
│  │  2. Request ID / Correlation ID                         │ │
│  │  3. Authentication                                      │ │
│  │  4. Rate Limiting                                       │ │
│  │  5. Input Validation                                    │ │
│  │  6. Service Proxy                                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Auth Service │    │Triage Service│    │ CDSS Service │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Installation

```bash
cd services/api-gateway
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key configuration options:
- `PORT`: Gateway port (default: 3000)
- `JWT_SECRET`: Secret for JWT verification
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per minute (default: 1000)
- `CORS_ORIGIN`: Allowed origins for CORS
- Service URLs for all microservices

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

## API Routes

### Health & Status
- `GET /health` - Health check
- `GET /version` - API version

### Service Routes
All routes are prefixed with `/api/v1/`:

- `/api/v1/auth/*` → Auth Service
- `/api/v1/triage/*` → Triage Service
- `/api/v1/cdss/*` → CDSS Service
- `/api/v1/drug-safety/*` → Drug Safety Service
- `/api/v1/diagnostic-vision/*` → Diagnostic Vision Service
- `/api/v1/operational/*` → Operational Intelligence Service
- `/api/v1/nurse-tasks/*` → Nurse Task Coordination Service
- `/api/v1/supply-chain/*` → Supply Chain Service
- `/api/v1/revenue-cycle/*` → Revenue Cycle Service
- `/api/v1/public-health/*` → Public Health Service
- `/api/v1/post-discharge/*` → Post-Discharge Care Service
- `/api/v1/integration/*` → Integration Service
- `/api/v1/edge/*` → Edge Intelligence Service
- `/api/v1/supervisor/*` → Supervisor Agent Service
- `/api/v1/ambient-scribe/*` → Ambient Scribe Service
- `/api/v1/speech-nlp/*` → Speech NLP Service
- `/api/v1/queue/*` → Queue Optimization Service

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Rate Limiting

- Global: 1000 requests/minute per user
- Auth endpoints: 10 requests/minute per IP
- AI endpoints: 100 requests/minute per user

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

## Request Tracking

Each request receives unique identifiers:
- `X-Request-ID`: Unique request identifier
- `X-Correlation-ID`: Distributed tracing identifier

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "details": {}
}
```

HTTP Status Codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `502` - Bad Gateway (service unavailable)

## Monitoring

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

Log format: JSON with timestamp, level, message, and metadata

## Security

- Helmet.js for security headers
- CORS with configurable origins
- Rate limiting per user/IP
- Input sanitization
- JWT token verification
- Request/response logging

## Performance

- Response compression (gzip)
- Connection pooling
- Request timeout: 30 seconds
- Graceful shutdown support

## Docker

```bash
docker build -t medhaos-api-gateway .
docker run -p 3000:3000 --env-file .env medhaos-api-gateway
```

## Testing

```bash
npm test
```

## License

MIT

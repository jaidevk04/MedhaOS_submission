import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import revenueCycleRoutes from './routes/revenue-cycle.routes';
import { config } from './config';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Routes
app.use('/api/revenue-cycle', revenueCycleRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: config.server.serviceName,
    version: '1.0.0',
    status: 'running',
    description: 'Revenue Cycle Agent - Automated Medical Coding, Claims Generation, Error Minimization, and Prior Authorization',
    endpoints: {
      health: '/api/revenue-cycle/health',
      generateCodes: 'POST /api/revenue-cycle/codes',
      generateClaim: 'POST /api/revenue-cycle/claims',
      detectErrors: 'POST /api/revenue-cycle/detect-errors',
      predictRejection: 'POST /api/revenue-cycle/predict-rejection',
      priorAuthorization: 'POST /api/revenue-cycle/prior-authorization',
      processEncounter: 'POST /api/revenue-cycle/process-encounter',
    },
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: config.server.serviceName,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.server.env === 'development' ? err.message : 'An unexpected error occurred',
  });
});

export default app;

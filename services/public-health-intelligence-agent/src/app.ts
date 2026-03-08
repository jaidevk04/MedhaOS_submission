import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import publicHealthRoutes from './routes/public-health.routes';
import { config } from './config';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/public-health', publicHealthRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'MedhaOS Public Health Intelligence Agent',
    version: '1.0.0',
    description: 'Regional Disease Prediction, Infection Surveillance, Media Scanning, and Public Health Dashboard',
    endpoints: {
      health: '/api/public-health/health',
      surveillance: '/api/public-health/surveillance/perform',
      dashboard: '/api/public-health/dashboard',
      prediction: '/api/public-health/prediction/outbreak',
      infection: '/api/public-health/infection/monitor',
      media: '/api/public-health/media/scan',
      rrt: '/api/public-health/rrt/activate',
      outbreaks: '/api/public-health/outbreaks/active',
      resources: '/api/public-health/resources/track',
      awareness: '/api/public-health/awareness/generate',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'development' ? err.message : 'Internal server error',
  });
});

export default app;

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import speechRoutes from './routes/speech.routes';
import clinicalRoutes from './routes/clinical.routes';
import voiceRoutes from './routes/voice.routes';

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'speech-nlp-service',
      timestamp: new Date().toISOString(),
    });
  });

  // Routes
  app.use('/api/speech', speechRoutes);
  app.use('/api/clinical', clinicalRoutes);
  app.use('/api/voice', voiceRoutes);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
    });
  });

  // Error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  });

  return app;
}

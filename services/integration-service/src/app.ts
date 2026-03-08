import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';

// Import routes
import abdmRoutes from './routes/abdm.routes';
import ehrRoutes from './routes/ehr.routes';
import lisRoutes from './routes/lis.routes';
import pacsRoutes from './routes/pacs.routes';
import notificationRoutes from './routes/notification.routes';

/**
 * MedhaOS Integration Service
 * Handles external system integrations:
 * - ABDM (Ayushman Bharat Digital Mission)
 * - EHR Systems (HL7 FHIR)
 * - Laboratory Information Systems (LIS)
 * - PACS (Picture Archiving and Communication System)
 * - Multi-channel Notifications (SMS, Email, WhatsApp, Push)
 */
export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.nodeEnv === 'production' ? [] : '*',
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'integration-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      integrations: {
        abdm: 'enabled',
        ehr: 'enabled',
        lis: 'enabled',
        pacs: 'enabled',
        notifications: 'enabled',
      },
    });
  });

  // API routes
  app.use('/api/abdm', abdmRoutes);
  app.use('/api/ehr', ehrRoutes);
  app.use('/api/lis', lisRoutes);
  app.use('/api/pacs', pacsRoutes);
  app.use('/api/notifications', notificationRoutes);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`,
    });
  });

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message:
        config.nodeEnv === 'development' ? err.message : 'An error occurred',
    });
  });

  return app;
}

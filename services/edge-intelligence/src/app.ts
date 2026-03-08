import express, { Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import { config } from './config';
import { logger } from './utils/logger';
import { OfflineStorageService } from './services/offline-storage.service';
import { InferenceEngineService } from './services/inference-engine.service';
import { SyncService } from './services/sync.service';
import { MonitoringService } from './services/monitoring.service';
import { InferenceRequest } from './types';
import { v4 as uuidv4 } from 'uuid';

export class EdgeIntelligenceApp {
  private app: express.Application;
  private offlineStorage: OfflineStorageService;
  private inferenceEngine: InferenceEngineService;
  private syncService: SyncService;
  private monitoringService: MonitoringService;

  constructor() {
    this.app = express();
    this.offlineStorage = new OfflineStorageService();
    this.inferenceEngine = new InferenceEngineService();
    this.syncService = new SyncService(this.offlineStorage);
    this.monitoringService = new MonitoringService(this.offlineStorage, this.inferenceEngine);

    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        const healthCheck = await this.monitoringService.performHealthCheck();
        res.json(healthCheck);
      } catch (error) {
        logger.error('Health check failed:', error);
        res.status(500).json({ error: 'Health check failed' });
      }
    });

    // Device info
    this.app.get('/device/info', (req: Request, res: Response) => {
      res.json({
        deviceId: config.device.id,
        facilityId: config.device.facilityId,
        deviceType: config.device.type,
        softwareVersion: '1.0.0',
        capabilities: {
          triageSupport: true,
          documentationSupport: true,
          offlineMode: true,
        },
      });
    });

    // Metrics
    this.app.get('/metrics', (req: Request, res: Response) => {
      const metrics = this.monitoringService.getLatestMetrics();
      res.json(metrics);
    });

    // Metrics history
    this.app.get('/metrics/history', (req: Request, res: Response) => {
      const limit = parseInt(req.query.limit as string) || 10;
      const history = this.monitoringService.getMetricsHistory(limit);
      res.json(history);
    });

    // Sync status
    this.app.get('/sync/status', (req: Request, res: Response) => {
      const status = this.syncService.getSyncStatus();
      res.json(status);
    });

    // Force sync
    this.app.post('/sync/force', async (req: Request, res: Response) => {
      try {
        const status = await this.syncService.forceSyncNow();
        res.json(status);
      } catch (error) {
        logger.error('Force sync failed:', error);
        res.status(500).json({ error: 'Sync failed' });
      }
    });

    // Connectivity status
    this.app.get('/connectivity', (req: Request, res: Response) => {
      const status = this.syncService.getConnectivityStatus();
      res.json(status);
    });

    // Triage inference
    this.app.post('/inference/triage', async (req: Request, res: Response) => {
      try {
        const request: InferenceRequest = {
          requestId: uuidv4(),
          modelType: 'triage',
          input: req.body,
          timestamp: new Date(),
          offline: !this.syncService.getConnectivityStatus().online,
        };

        const response = await this.inferenceEngine.runTriageInference(request);

        // Save to offline storage
        this.offlineStorage.saveEntity('inference', response.requestId, response);

        res.json(response);
      } catch (error) {
        logger.error('Triage inference failed:', error);
        res.status(500).json({ error: 'Inference failed' });
      }
    });

    // Documentation inference
    this.app.post('/inference/documentation', async (req: Request, res: Response) => {
      try {
        const request: InferenceRequest = {
          requestId: uuidv4(),
          modelType: 'documentation',
          input: req.body,
          timestamp: new Date(),
          offline: !this.syncService.getConnectivityStatus().online,
        };

        const response = await this.inferenceEngine.runDocumentationInference(request);

        // Save to offline storage
        this.offlineStorage.saveEntity('inference', response.requestId, response);

        res.json(response);
      } catch (error) {
        logger.error('Documentation inference failed:', error);
        res.status(500).json({ error: 'Inference failed' });
      }
    });

    // Model info
    this.app.get('/models/info', (req: Request, res: Response) => {
      const triageInfo = this.inferenceEngine.getModelInfo('triage');
      const documentationInfo = this.inferenceEngine.getModelInfo('documentation');

      res.json({
        triage: triageInfo,
        documentation: documentationInfo,
      });
    });

    // Save entity (offline storage)
    this.app.post('/storage/:entityType', (req: Request, res: Response) => {
      try {
        const { entityType } = req.params;
        const entityId = req.body.id || uuidv4();
        const entity = this.offlineStorage.saveEntity(entityType, entityId, req.body);
        res.json(entity);
      } catch (error) {
        logger.error('Failed to save entity:', error);
        res.status(500).json({ error: 'Failed to save entity' });
      }
    });

    // Get entity
    this.app.get('/storage/:entityType/:entityId', (req: Request, res: Response) => {
      try {
        const { entityType, entityId } = req.params;
        const entity = this.offlineStorage.getEntity(entityType, entityId);

        if (!entity) {
          return res.status(404).json({ error: 'Entity not found' });
        }

        res.json(entity);
      } catch (error) {
        logger.error('Failed to get entity:', error);
        res.status(500).json({ error: 'Failed to get entity' });
      }
    });

    // Get entities by type
    this.app.get('/storage/:entityType', (req: Request, res: Response) => {
      try {
        const { entityType } = req.params;
        const limit = parseInt(req.query.limit as string) || 100;
        const entities = this.offlineStorage.getEntitiesByType(entityType, limit);
        res.json(entities);
      } catch (error) {
        logger.error('Failed to get entities:', error);
        res.status(500).json({ error: 'Failed to get entities' });
      }
    });

    // Storage stats
    this.app.get('/storage/stats', (req: Request, res: Response) => {
      try {
        const stats = this.offlineStorage.getStorageStats();
        res.json(stats);
      } catch (error) {
        logger.error('Failed to get storage stats:', error);
        res.status(500).json({ error: 'Failed to get storage stats' });
      }
    });

    // Error handler
    this.app.use((err: Error, req: Request, res: Response, next: any) => {
      logger.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    try {
      const port = config.server.port;
      const host = config.server.host;

      this.app.listen(port, host, () => {
        logger.info(`Edge Intelligence service started on ${host}:${port}`);
        logger.info(`Device ID: ${config.device.id}`);
        logger.info(`Facility ID: ${config.device.facilityId}`);
        logger.info(`Offline mode: enabled`);
      });
    } catch (error) {
      logger.error('Failed to start application:', error);
      throw error;
    }
  }

  /**
   * Shutdown the application gracefully
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Edge Intelligence service...');

    // Stop sync
    this.syncService.stopSync();

    // Stop monitoring
    this.monitoringService.stopHeartbeat();

    // Close database
    this.offlineStorage.close();

    logger.info('Shutdown complete');
  }

  /**
   * Get Express app instance
   */
  getApp(): express.Application {
    return this.app;
  }
}

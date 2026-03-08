import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { setupWebSocket, WebSocketEvents } from './websocket';
import { createServer } from 'http';

const startServer = async (): Promise<void> => {
  try {
    const app = await createApp();
    const httpServer = createServer(app);

    // Setup WebSocket
    const io = setupWebSocket(httpServer);
    const wsEvents = io ? new WebSocketEvents(io) : null;

    // Make WebSocket events available globally for other services to use
    if (wsEvents) {
      (global as any).wsEvents = wsEvents;
    }

    httpServer.listen(config.port, config.host, () => {
      logger.info(`🚀 API Gateway started successfully`);
      logger.info(`📡 Server running on http://${config.host}:${config.port}`);
      logger.info(`🌍 Environment: ${config.env}`);
      logger.info(`📊 Health check: http://${config.host}:${config.port}/health`);
      if (wsEvents) {
        logger.info(`🔌 WebSocket enabled at ${config.websocket.path}`);
      }
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      // Close WebSocket connections
      if (io) {
        io.close(() => {
          logger.info('WebSocket server closed');
        });
      }

      httpServer.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

import { EdgeIntelligenceApp } from './app';
import { logger } from './utils/logger';

/**
 * Main entry point for Edge Intelligence service
 */
async function main() {
  try {
    logger.info('Starting MedhaOS Edge Intelligence service...');

    const app = new EdgeIntelligenceApp();
    await app.start();

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      await app.shutdown();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      await app.shutdown();
      process.exit(0);
    });

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
    logger.error('Failed to start Edge Intelligence service:', error);
    process.exit(1);
  }
}

// Start the application
main();

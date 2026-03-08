import app from './app';
import { config } from './config';
import { VectorDatabaseService } from './services/vector-database.service';

const PORT = config.port;

// Initialize vector database
const vectorDbService = new VectorDatabaseService();

async function startServer() {
  try {
    // Initialize vector database index
    console.log('Initializing vector database...');
    await vectorDbService.initialize();
    console.log('Vector database initialized successfully');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`CDSS Agent service running on port ${PORT}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

startServer();

import app from './app';
import { config } from './config';

const PORT = config.port;

async function startServer() {
  try {
    console.log('Initializing Diagnostic Vision Agent...');
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`Diagnostic Vision Agent service running on port ${PORT}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`S3 Bucket: ${config.s3.bucketName}`);
      console.log(`DICOM Server: ${config.dicom.serverHost}:${config.dicom.serverPort}`);
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

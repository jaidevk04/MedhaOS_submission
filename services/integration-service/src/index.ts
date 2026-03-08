import { createApp } from './app';
import { config } from './config';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log('='.repeat(60));
  console.log('🏥 MedhaOS Integration Service');
  console.log('='.repeat(60));
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Server running on port: ${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/health`);
  console.log('');
  console.log('Available Integrations:');
  console.log(`  📋 ABDM:          http://localhost:${config.port}/api/abdm`);
  console.log(`  🏥 EHR:           http://localhost:${config.port}/api/ehr`);
  console.log(`  🧪 LIS:           http://localhost:${config.port}/api/lis`);
  console.log(`  📷 PACS:          http://localhost:${config.port}/api/pacs`);
  console.log(`  📧 Notifications: http://localhost:${config.port}/api/notifications`);
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;

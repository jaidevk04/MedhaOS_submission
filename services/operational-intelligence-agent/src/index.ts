import app from './app';
import { config } from './config';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('MedhaOS Operational Intelligence Agent');
  console.log('='.repeat(60));
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`\nEndpoints:`);
  console.log(`  - GET  /api/operational/metrics/:facilityId`);
  console.log(`  - GET  /api/operational/alerts/:facilityId`);
  console.log(`  - GET  /api/operational/dashboard/:facilityId`);
  console.log(`  - POST /api/operational/optimize/:facilityId`);
  console.log(`  - GET  /api/operational/health`);
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

export default server;

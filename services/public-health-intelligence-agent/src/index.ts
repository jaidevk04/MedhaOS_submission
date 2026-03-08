import app from './app';
import { config } from './config';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🏥 MedhaOS Public Health Intelligence Agent');
  console.log('='.repeat(60));
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Server running on port: ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/public-health/health`);
  console.log('='.repeat(60));
  console.log('Services:');
  console.log('  ✓ Regional Disease Prediction (LSTM + Attention)');
  console.log('  ✓ Infection Surveillance (DBSCAN Clustering)');
  console.log('  ✓ Media Scanning (Multilingual)');
  console.log('  ✓ Public Health Dashboard');
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

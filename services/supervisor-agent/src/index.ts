import app from './app';
import { config } from './config';

const PORT = config.port;

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 MedhaOS Supervisor Agent Service');
  console.log('='.repeat(60));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api/supervisor`);
  console.log('='.repeat(60));
  console.log('Available Endpoints:');
  console.log('  POST   /api/supervisor/events');
  console.log('  GET    /api/supervisor/workflows/:workflowId');
  console.log('  DELETE /api/supervisor/workflows/:workflowId');
  console.log('  GET    /api/supervisor/agents');
  console.log('  GET    /api/supervisor/agents/:agentType');
  console.log('  PUT    /api/supervisor/agents/:agentType/health');
  console.log('  GET    /api/supervisor/patients/:patientId/context');
  console.log('  GET    /api/supervisor/patients/:patientId/workflows');
  console.log('  GET    /api/supervisor/health');
  console.log('');
  console.log('  GET    /api/escalations');
  console.log('  GET    /api/escalations/:escalationId');
  console.log('  POST   /api/escalations/:escalationId/acknowledge');
  console.log('  POST   /api/escalations/:escalationId/resolve');
  console.log('  GET    /api/escalations/task/:taskId');
  console.log('  GET    /api/escalations/stats');
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

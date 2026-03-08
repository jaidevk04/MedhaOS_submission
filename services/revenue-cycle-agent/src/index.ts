import app from './app';
import { config } from './config';

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`🚀 ${config.server.serviceName} running on port ${PORT}`);
  console.log(`📊 Environment: ${config.server.env}`);
  console.log(`🏥 Revenue Cycle Agent ready for medical coding and claims generation`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  - POST /api/revenue-cycle/codes - Generate ICD-10/CPT codes`);
  console.log(`  - POST /api/revenue-cycle/claims - Generate insurance claims`);
  console.log(`  - POST /api/revenue-cycle/process-encounter - Complete workflow`);
  console.log(`  - GET  /api/revenue-cycle/health - Health check`);
});

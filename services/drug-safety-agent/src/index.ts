import app from './app';
import { config } from './config';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Drug Safety Agent running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🏥 Service: ${config.serviceName}`);
  console.log(`\n📚 Available endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /api/safety-check - Perform drug safety check`);
  console.log(`   GET  /api/drugs/search?q=<query> - Search drugs`);
  console.log(`   GET  /api/drugs/:id - Get drug details`);
  console.log(`   GET  /api/drugs/:id/interactions - Get drug interactions`);
  console.log(`   POST /api/inventory/check - Check inventory`);
  console.log(`   GET  /api/inventory/:facilityId/:drugId/status - Get stock status`);
  console.log(`   GET  /api/inventory/:facilityId/:drugId/expiry - Validate expiry`);
  console.log(`   GET  /api/stats - Get knowledge graph statistics`);
});

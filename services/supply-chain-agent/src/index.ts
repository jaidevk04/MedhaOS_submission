import app from './app';
import { config } from './config';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Supply Chain Intelligence Agent running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🏥 Service: ${config.serviceName}`);
  console.log(`\n📚 Available endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /api/supply-chain/status/:facilityId - Get supply chain status`);
  console.log(`   POST /api/supply-chain/forecast - Generate demand forecast`);
  console.log(`   GET  /api/supply-chain/inventory/:facilityId - Get inventory status`);
  console.log(`   GET  /api/supply-chain/drug-forecasts/:facilityId - Get drug forecasts`);
  console.log(`   GET  /api/supply-chain/reorder-recommendations/:facilityId - Get reorder recommendations`);
  console.log(`   POST /api/supply-chain/purchase-orders/:facilityId - Generate purchase orders`);
  console.log(`   GET  /api/supply-chain/blood-shortages/:facilityId - Get blood shortage alerts`);
  console.log(`   POST /api/supply-chain/donor-drive/:facilityId - Trigger donor drive`);
  console.log(`   GET  /api/supply-chain/expiry-alerts/:facilityId - Get expiry alerts`);
});

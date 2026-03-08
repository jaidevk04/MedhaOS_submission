/**
 * Test script for Supply Chain Intelligence Agent
 * Run with: npx tsx test-service.ts
 */

import { SupplyChainService } from './src/services/supply-chain.service';
import { DrugInventoryForecastingService } from './src/services/drug-inventory-forecasting.service';
import { BloodBankForecastingService } from './src/services/blood-bank-forecasting.service';
import { InventoryManagementService } from './src/services/inventory-management.service';

const facilityId = 'facility-test-001';

async function testDrugForecasting() {
  console.log('\n🧪 Testing Drug Inventory Forecasting...\n');
  
  const service = new DrugInventoryForecastingService();
  
  // Test usage pattern analysis
  console.log('1. Analyzing usage pattern...');
  const pattern = await service.analyzeUsagePattern(facilityId, 'drug-001', 90);
  console.log(`   ✓ Trend: ${pattern.trendDirection}`);
  console.log(`   ✓ Average daily usage: ${(pattern.dailyUsage.reduce((a, b) => a + b, 0) / pattern.dailyUsage.length).toFixed(2)}`);
  
  // Test forecast generation
  console.log('\n2. Generating 7-day forecast...');
  const forecast = await service.generateForecast(facilityId, 'drug-001', '7d');
  console.log(`   ✓ Current stock: ${forecast.currentStock}`);
  console.log(`   ✓ Reorder point: ${forecast.reorderPoint}`);
  console.log(`   ✓ Reorder quantity: ${forecast.reorderQuantity}`);
  console.log(`   ✓ Stockout risk: ${forecast.stockoutRisk}`);
  console.log(`   ✓ Predicted demand (7 days): ${forecast.predictedDemand.reduce((a, b) => a + b, 0)}`);
  
  // Test reorder recommendations
  console.log('\n3. Generating reorder recommendations...');
  const recommendations = await service.generateReorderRecommendations(facilityId);
  console.log(`   ✓ Found ${recommendations.length} items needing reorder`);
  for (const rec of recommendations) {
    console.log(`   - ${rec.itemName}: ${rec.currentStock} units (Urgency: ${rec.urgency})`);
  }
}

async function testBloodBankForecasting() {
  console.log('\n🧪 Testing Blood Bank Forecasting...\n');
  
  const service = new BloodBankForecastingService();
  
  // Test blood usage pattern
  console.log('1. Analyzing blood usage pattern...');
  const pattern = await service.analyzeBloodUsagePattern(facilityId, 'O+', 90);
  console.log(`   ✓ Blood group: ${pattern.bloodGroup}`);
  console.log(`   ✓ Emergency usage rate: ${(pattern.emergencyUsageRate * 100).toFixed(0)}%`);
  console.log(`   ✓ Surgery usage rate: ${(pattern.surgeryUsageRate * 100).toFixed(0)}%`);
  console.log(`   ✓ Trauma usage rate: ${(pattern.traumaUsageRate * 100).toFixed(0)}%`);
  
  // Test blood forecast
  console.log('\n2. Generating blood forecast for O+...');
  const forecast = await service.generateBloodForecast(facilityId, 'O+', '7d');
  console.log(`   ✓ Current stock: ${forecast.currentStock} units`);
  console.log(`   ✓ Critical threshold: ${forecast.criticalThreshold} units`);
  console.log(`   ✓ Shortage risk: ${forecast.shortageRisk}`);
  console.log(`   ✓ Donor drive recommended: ${forecast.recommendedDonorDrive ? 'Yes' : 'No'}`);
  console.log(`   ✓ Predicted demand (7 days): ${forecast.predictedDemand.reduce((a, b) => a + b, 0)} units`);
  
  // Test all blood groups
  console.log('\n3. Forecasting all blood groups...');
  const allForecasts = await service.generateAllBloodGroupForecasts(facilityId, '7d');
  console.log(`   ✓ Generated forecasts for ${allForecasts.length} blood groups`);
  for (const f of allForecasts) {
    console.log(`   - ${f.bloodGroup}: ${f.currentStock} units (Risk: ${f.shortageRisk})`);
  }
  
  // Test critical shortages
  console.log('\n4. Identifying critical shortages...');
  const criticalShortages = await service.identifyCriticalShortages(facilityId);
  console.log(`   ✓ Found ${criticalShortages.length} critical/high risk blood groups`);
  for (const shortage of criticalShortages) {
    console.log(`   - ${shortage.bloodGroup}: ${shortage.currentStock} units (${shortage.shortageRisk})`);
  }
  
  // Test blood compatibility
  console.log('\n5. Testing blood compatibility matrix...');
  const compatible = service.getCompatibleBloodGroups('AB+');
  console.log(`   ✓ AB+ can receive from: ${compatible.join(', ')}`);
  
  // Test alternative sources
  console.log('\n6. Finding alternative blood sources for O-...');
  const alternatives = await service.findAlternativeBloodSources(facilityId, 'O-', 5);
  console.log(`   ✓ Found ${alternatives.length} alternative sources`);
  for (const alt of alternatives) {
    console.log(`   - ${alt.bloodGroup}: ${alt.availableUnits} units`);
  }
}

async function testInventoryManagement() {
  console.log('\n🧪 Testing Inventory Management...\n');
  
  const service = new InventoryManagementService();
  
  // Test inventory status
  console.log('1. Getting inventory status...');
  const status = await service.getInventoryStatus(facilityId);
  console.log(`   ✓ Total items: ${status.totalItems}`);
  console.log(`   ✓ Low stock items: ${status.lowStockItems}`);
  console.log(`   ✓ Critical stock items: ${status.criticalStockItems}`);
  console.log(`   ✓ Expiring items: ${status.expiringItems}`);
  console.log(`   ✓ Active alerts: ${status.alerts.length}`);
  
  // Test stock tracking
  console.log('\n2. Tracking stock level for drug-002...');
  const stockStatus = await service.trackStockLevel(facilityId, 'drug-002', 'drug');
  console.log(`   ✓ Current stock: ${stockStatus.currentStock}`);
  console.log(`   ✓ Status: ${stockStatus.status}`);
  console.log(`   ✓ Alerts: ${stockStatus.alerts.length}`);
  
  // Test expiry monitoring
  console.log('\n3. Monitoring expiry dates...');
  const expiryAlerts = await service.monitorExpiryDates(facilityId);
  console.log(`   ✓ Found ${expiryAlerts.length} expiry alerts`);
  for (const alert of expiryAlerts.slice(0, 3)) {
    console.log(`   - ${alert.severity.toUpperCase()}: ${alert.message}`);
  }
  
  // Test purchase order generation
  console.log('\n4. Generating purchase orders...');
  const purchaseOrders = await service.generatePurchaseOrder(facilityId);
  console.log(`   ✓ Generated ${purchaseOrders.length} purchase orders`);
  for (const po of purchaseOrders) {
    console.log(`   - ${po.orderId}: ${po.items.length} items, $${po.totalAmount} (${po.priority})`);
  }
  
  // Test donor drive
  console.log('\n5. Triggering donor drive...');
  const donorDrive = await service.triggerDonorDrive(facilityId);
  if (donorDrive) {
    console.log(`   ✓ Donor drive created: ${donorDrive.driveId}`);
    console.log(`   ✓ Blood groups: ${donorDrive.bloodGroups.join(', ')}`);
    console.log(`   ✓ Target units: ${donorDrive.targetUnits}`);
    console.log(`   ✓ Start date: ${donorDrive.startDate.toLocaleDateString()}`);
  } else {
    console.log(`   ✓ No donor drive needed at this time`);
  }
}

async function testSupplyChainService() {
  console.log('\n🧪 Testing Supply Chain Service (Integration)...\n');
  
  const service = new SupplyChainService();
  
  // Test comprehensive status
  console.log('1. Getting comprehensive supply chain status...');
  const status = await service.getSupplyChainStatus(facilityId);
  console.log(`   ✓ Facility: ${status.facilityId}`);
  console.log(`   ✓ Total inventory items: ${status.inventory.totalItems}`);
  console.log(`   ✓ Drug forecasts: ${status.drugForecasts.count} (${status.drugForecasts.highRisk} high risk)`);
  console.log(`   ✓ Blood forecasts: ${status.bloodForecasts.count} (${status.bloodForecasts.critical} critical, ${status.bloodForecasts.high} high)`);
  
  // Test forecast generation
  console.log('\n2. Generating drug forecast...');
  const forecast = await service.generateForecast({
    facilityId,
    itemType: 'drug',
    itemId: 'drug-001',
    forecastPeriod: '7d'
  });
  console.log(`   ✓ Forecast generated for ${forecast.drugName || 'Blood ' + forecast.bloodGroup}`);
  
  // Test reorder recommendations
  console.log('\n3. Getting reorder recommendations...');
  const recommendations = await service.getReorderRecommendations(facilityId);
  console.log(`   ✓ Found ${recommendations.length} reorder recommendations`);
  
  // Test blood shortage alerts
  console.log('\n4. Getting blood shortage alerts...');
  const shortages = await service.getBloodShortageAlerts(facilityId);
  console.log(`   ✓ Found ${shortages.length} blood shortage alerts`);
  
  // Test purchase order processing
  console.log('\n5. Processing purchase orders...');
  const orders = await service.processPurchaseOrders(facilityId);
  console.log(`   ✓ Processed ${orders.length} purchase orders`);
  
  // Test expiry monitoring
  console.log('\n6. Monitoring expiry...');
  const alerts = await service.monitorExpiry(facilityId);
  console.log(`   ✓ Found ${alerts.length} expiry alerts`);
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Supply Chain Intelligence Agent - Test Suite');
  console.log('═══════════════════════════════════════════════════════════');
  
  try {
    await testDrugForecasting();
    await testBloodBankForecasting();
    await testInventoryManagement();
    await testSupplyChainService();
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ✅ All tests completed successfully!');
    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();

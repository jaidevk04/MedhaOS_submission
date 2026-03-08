/**
 * Simple test script to verify the Drug Safety Agent functionality
 */

import { drugKnowledgeGraph } from './src/services/drug-knowledge-graph.service';
import { drugSafetyService } from './src/services/drug-safety.service';
import { inventoryIntegrationService } from './src/services/inventory-integration.service';

console.log('🧪 Testing Drug Safety Agent\n');

// Test 1: Drug Knowledge Graph
console.log('Test 1: Drug Knowledge Graph');
console.log('─'.repeat(50));
const stats = {
  totalDrugs: drugKnowledgeGraph.getDrugCount(),
  totalInteractions: drugKnowledgeGraph.getInteractionCount()
};
console.log(`✅ Total drugs: ${stats.totalDrugs}`);
console.log(`✅ Total interactions: ${stats.totalInteractions}`);

// Test 2: Drug Search
console.log('\nTest 2: Drug Search');
console.log('─'.repeat(50));
const searchResults = drugKnowledgeGraph.searchDrugs('aspirin');
console.log(`✅ Found ${searchResults.length} drug(s) matching "aspirin"`);
if (searchResults.length > 0) {
  console.log(`   - ${searchResults[0].name} (${searchResults[0].genericName})`);
}

// Test 3: Safety Check - Aspirin + Clopidogrel (Major Interaction)
console.log('\nTest 3: Safety Check - Aspirin + Clopidogrel');
console.log('─'.repeat(50));
drugSafetyService.performSafetyCheck({
  patientId: 'test_patient_001',
  proposedDrug: {
    drugId: 'drug_001', // Aspirin
    dosage: '75mg',
    frequency: 'once daily',
    route: 'oral'
  },
  currentMedications: [
    {
      drugId: 'drug_002', // Clopidogrel
      dosage: '75mg',
      frequency: 'once daily',
      startDate: '2024-01-01'
    }
  ],
  allergies: [],
  age: 58
}).then(result => {
  console.log(`✅ Safety check completed`);
  console.log(`   - Safe: ${result.safe}`);
  console.log(`   - Alerts: ${result.alerts.length}`);
  if (result.alerts.length > 0) {
    console.log(`   - First alert: ${result.alerts[0].message}`);
    console.log(`   - Severity: ${result.alerts[0].severity}`);
  }
});

// Test 4: Allergy Conflict - Amoxicillin with Penicillin Allergy
console.log('\nTest 4: Allergy Conflict - Amoxicillin with Penicillin Allergy');
console.log('─'.repeat(50));
drugSafetyService.performSafetyCheck({
  patientId: 'test_patient_002',
  proposedDrug: {
    drugId: 'drug_008', // Amoxicillin
    dosage: '500mg',
    frequency: 'three times daily',
    route: 'oral'
  },
  currentMedications: [],
  allergies: ['Penicillin'],
  age: 35
}).then(result => {
  console.log(`✅ Safety check completed`);
  console.log(`   - Safe: ${result.safe}`);
  console.log(`   - Alerts: ${result.alerts.length}`);
  if (result.alerts.length > 0) {
    console.log(`   - First alert: ${result.alerts[0].message}`);
    console.log(`   - Action: ${result.alerts[0].action}`);
  }
});

// Test 5: Inventory Check
console.log('\nTest 5: Inventory Check - Aspirin at Facility 001');
console.log('─'.repeat(50));
inventoryIntegrationService.checkInventory({
  drugId: 'drug_001',
  facilityId: 'facility_001',
  requiredQuantity: 30
}).then(result => {
  console.log(`✅ Inventory check completed`);
  console.log(`   - Available: ${result.available}`);
  console.log(`   - Current stock: ${result.currentStock} ${result.unit}`);
  console.log(`   - Days until expiry: ${result.daysUntilExpiry}`);
});

// Test 6: Low Stock Drug
console.log('\nTest 6: Low Stock Drug - Amoxicillin');
console.log('─'.repeat(50));
inventoryIntegrationService.checkInventory({
  drugId: 'drug_008',
  facilityId: 'facility_001',
  requiredQuantity: 50
}).then(result => {
  console.log(`✅ Inventory check completed`);
  console.log(`   - Available: ${result.available}`);
  console.log(`   - Current stock: ${result.currentStock} ${result.unit}`);
  if (result.alternatives && result.alternatives.length > 0) {
    console.log(`   - Alternatives available: ${result.alternatives.length}`);
    console.log(`   - First alternative: ${result.alternatives[0].drugName} (${result.alternatives[0].stock} in stock)`);
  }
});

setTimeout(() => {
  console.log('\n✅ All tests completed!\n');
}, 1000);

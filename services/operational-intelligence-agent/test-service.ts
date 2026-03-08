import { OperationalIntelligenceService } from './src/services/operational-intelligence.service';
import { BedOccupancyPredictionService } from './src/services/bed-occupancy-prediction.service';
import { ICUDemandForecastingService } from './src/services/icu-demand-forecasting.service';
import { StaffSchedulingService } from './src/services/staff-scheduling.service';
import { WorkflowOptimizationService } from './src/services/workflow-optimization.service';
import { StaffMember, ShiftRequirement } from './src/types';

/**
 * Test script for Operational Intelligence Agent
 */
async function testOperationalIntelligence() {
  console.log('='.repeat(80));
  console.log('Testing MedhaOS Operational Intelligence Agent');
  console.log('='.repeat(80));

  const facilityId = 'facility-test-001';

  // Test 1: Bed Occupancy Prediction
  console.log('\n1. Testing Bed Occupancy Prediction Agent...');
  const bedService = new BedOccupancyPredictionService();
  
  try {
    const bedPrediction = await bedService.predictBedOccupancy(facilityId, 'general', 72);
    console.log('✓ Bed occupancy prediction generated');
    console.log(`  - Forecast horizon: ${bedPrediction.forecastHorizon} hours`);
    console.log(`  - Predictions: ${bedPrediction.predictions.length} data points`);
    console.log(`  - First prediction: ${bedPrediction.predictions[0].predictedOccupancy} beds occupied`);
    console.log(`  - Available: ${bedPrediction.predictions[0].predictedAvailable} beds`);
    
    const bedAlerts = await bedService.generateCapacityAlerts(bedPrediction);
    console.log(`✓ Generated ${bedAlerts.length} capacity alerts`);
    if (bedAlerts.length > 0) {
      console.log(`  - Highest severity: ${bedAlerts[0].severity}`);
      console.log(`  - Message: ${bedAlerts[0].message}`);
    }
    
    bedService.dispose();
  } catch (error) {
    console.error('✗ Bed occupancy prediction failed:', error);
  }

  // Test 2: ICU Demand Forecasting
  console.log('\n2. Testing ICU Demand Forecasting Agent...');
  const icuService = new ICUDemandForecastingService();
  
  try {
    const icuPrediction = await icuService.predictICUDemand(facilityId, 24);
    console.log('✓ ICU demand prediction generated');
    console.log(`  - Forecast horizon: ${icuPrediction.forecastHorizon} hours`);
    console.log(`  - Alert level: ${icuPrediction.alertLevel}`);
    console.log(`  - Predictions: ${icuPrediction.predictions.length} data points`);
    console.log(`  - First prediction: ${(icuPrediction.predictions[0].predictedUtilization * 100).toFixed(1)}% utilization`);
    console.log(`  - Recommendations: ${icuPrediction.recommendedActions.length}`);
    
    const icuAlerts = await icuService.generateICUAlerts(icuPrediction);
    console.log(`✓ Generated ${icuAlerts.length} ICU alerts`);
    
    const patterns = await icuService.analyzeAdmissionPatterns(facilityId);
    console.log('✓ ICU admission patterns analyzed');
    console.log(`  - Peak hours: ${patterns.peakHours.join(', ')}`);
    console.log(`  - Average stay: ${patterns.averageStayDays.toFixed(1)} days`);
    
    icuService.dispose();
  } catch (error) {
    console.error('✗ ICU demand forecasting failed:', error);
  }

  // Test 3: Staff Scheduling
  console.log('\n3. Testing Staff Scheduling Optimization Agent...');
  const staffService = new StaffSchedulingService();
  
  try {
    // Create sample staff members
    const staffMembers: StaffMember[] = [
      {
        staffId: 'nurse-001',
        name: 'Sarah Johnson',
        role: 'nurse',
        experienceYears: 8,
        skillLevel: 'senior',
        availability: [
          { dayOfWeek: 1, startTime: '07:00', endTime: '19:00' },
          { dayOfWeek: 2, startTime: '07:00', endTime: '19:00' },
          { dayOfWeek: 3, startTime: '07:00', endTime: '19:00' },
        ],
        maxHoursPerWeek: 40,
        currentHoursThisWeek: 0,
        preferredShifts: ['morning', 'afternoon'],
      },
      {
        staffId: 'nurse-002',
        name: 'Michael Chen',
        role: 'nurse',
        experienceYears: 3,
        skillLevel: 'mid',
        availability: [
          { dayOfWeek: 1, startTime: '15:00', endTime: '23:00' },
          { dayOfWeek: 2, startTime: '15:00', endTime: '23:00' },
          { dayOfWeek: 4, startTime: '15:00', endTime: '23:00' },
        ],
        maxHoursPerWeek: 40,
        currentHoursThisWeek: 0,
        preferredShifts: ['afternoon', 'night'],
      },
    ];
    
    // Create sample shift requirements
    const shiftRequirements: ShiftRequirement[] = [
      {
        facilityId,
        date: new Date(),
        shift: 'morning',
        role: 'nurse',
        requiredCount: 1,
        minSkillLevel: 'mid',
        patientAcuity: 'high',
      },
      {
        facilityId,
        date: new Date(),
        shift: 'afternoon',
        role: 'nurse',
        requiredCount: 1,
        minSkillLevel: 'mid',
        patientAcuity: 'medium',
      },
    ];
    
    const schedule = await staffService.generateWeeklySchedule(
      facilityId,
      new Date(),
      staffMembers,
      shiftRequirements
    );
    
    console.log('✓ Weekly schedule generated');
    console.log(`  - Assignments: ${schedule.assignments.length}`);
    console.log(`  - Coverage score: ${(schedule.coverageScore * 100).toFixed(1)}%`);
    console.log(`  - Fairness score: ${(schedule.fairnessScore * 100).toFixed(1)}%`);
    console.log(`  - Burnout risks: ${schedule.burnoutRisks.length}`);
    
    // Test call-in handling
    const callInResponse = await staffService.handleStaffCallIn(
      facilityId,
      'nurse-001',
      new Date(),
      'morning',
      staffMembers
    );
    
    console.log('✓ Staff call-in handled');
    console.log(`  - Processing time: ${callInResponse.processingTime}ms`);
    console.log(`  - Replacements found: ${callInResponse.replacements.length}`);
    console.log(`  - Adjustments: ${callInResponse.adjustments.length}`);
  } catch (error) {
    console.error('✗ Staff scheduling failed:', error);
  }

  // Test 4: Workflow Optimization
  console.log('\n4. Testing Workflow Optimization Agent...');
  const workflowService = new WorkflowOptimizationService();
  
  try {
    const bottlenecks = await workflowService.identifyBottlenecks(
      facilityId,
      'patient-admission'
    );
    
    console.log('✓ Workflow bottlenecks identified');
    console.log(`  - Bottlenecks found: ${bottlenecks.length}`);
    
    if (bottlenecks.length > 0) {
      const topBottleneck = bottlenecks[0];
      console.log(`  - Top bottleneck: ${topBottleneck.stepName}`);
      console.log(`  - Impact score: ${topBottleneck.impactScore.toFixed(1)}`);
      console.log(`  - Average duration: ${(topBottleneck.averageDuration / 60000).toFixed(1)} minutes`);
      console.log(`  - Root causes: ${topBottleneck.rootCauses.length}`);
      console.log(`  - Recommendations: ${topBottleneck.recommendations.length}`);
    }
    
    const efficiency = await workflowService.analyzeWorkflowEfficiency(
      facilityId,
      'patient-admission'
    );
    
    console.log('✓ Workflow efficiency analyzed');
    console.log(`  - Total cases: ${efficiency.totalCases}`);
    console.log(`  - Average cycle time: ${(efficiency.averageCycleTime / 60000).toFixed(1)} minutes`);
    console.log(`  - Success rate: ${(efficiency.successRate * 100).toFixed(1)}%`);
    console.log(`  - Efficiency score: ${efficiency.efficiencyScore.toFixed(1)}`);
  } catch (error) {
    console.error('✗ Workflow optimization failed:', error);
  }

  // Test 5: Integrated Service
  console.log('\n5. Testing Integrated Operational Intelligence Service...');
  const operationalService = new OperationalIntelligenceService();
  
  try {
    const metrics = await operationalService.getOperationalMetrics(facilityId);
    console.log('✓ Operational metrics retrieved');
    console.log(`  - Bed occupancy rate: ${(metrics.bedOccupancyRate * 100).toFixed(1)}%`);
    console.log(`  - ICU utilization: ${(metrics.icuUtilization * 100).toFixed(1)}%`);
    console.log(`  - Average wait time: ${metrics.averageWaitTime.toFixed(1)} minutes`);
    console.log(`  - Bottleneck count: ${metrics.bottleneckCount}`);
    
    const alerts = await operationalService.getAllCapacityAlerts(facilityId);
    console.log(`✓ Retrieved ${alerts.length} total capacity alerts`);
    
    const dashboard = await operationalService.generateDashboardData(facilityId);
    console.log('✓ Dashboard data generated');
    console.log(`  - Bed capacity types: ${Object.keys(dashboard.bedCapacity).length}`);
    console.log(`  - ICU predictions: ${dashboard.icuDemand.predictions.length}`);
    console.log(`  - Active alerts: ${dashboard.alerts.length}`);
    console.log(`  - Workflow bottlenecks: ${dashboard.workflowBottlenecks.length}`);
    
    operationalService.dispose();
  } catch (error) {
    console.error('✗ Integrated service failed:', error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('Testing Complete!');
  console.log('='.repeat(80));
}

// Run tests
testOperationalIntelligence()
  .then(() => {
    console.log('\n✓ All tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Test suite failed:', error);
    process.exit(1);
  });

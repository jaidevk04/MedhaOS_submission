/**
 * Test script for Public Health Intelligence Agent
 * 
 * Run with: npx tsx test-service.ts
 */

import { PublicHealthIntelligenceService } from './src/services/public-health-intelligence.service';

async function testPublicHealthIntelligence() {
  console.log('='.repeat(80));
  console.log('Testing Public Health Intelligence Agent');
  console.log('='.repeat(80));
  console.log();

  const service = new PublicHealthIntelligenceService();

  try {
    // Test 1: Disease Outbreak Prediction
    console.log('Test 1: Regional Disease Prediction');
    console.log('-'.repeat(80));
    const prediction = await service.predictOutbreak('Mumbai', 'Maharashtra', 'Dengue');
    console.log('Prediction ID:', prediction.predictionId);
    console.log('Risk Level:', prediction.riskLevel);
    console.log('Forecast Horizon:', prediction.forecastHorizon, 'days');
    console.log('Number of Predictions:', prediction.predictions.length);
    console.log('First Prediction:');
    console.log('  Date:', prediction.predictions[0].date.toISOString());
    console.log('  Outbreak Probability:', (prediction.predictions[0].outbreakProbability * 100).toFixed(1) + '%');
    console.log('  Expected Cases:', prediction.predictions[0].expectedCases);
    console.log('  Confidence:', (prediction.predictions[0].confidence * 100).toFixed(1) + '%');
    console.log('Contributing Factors:');
    console.log('  Syndromic:', (prediction.contributingFactors.syndromic * 100).toFixed(1) + '%');
    console.log('  Climate:', (prediction.contributingFactors.climate * 100).toFixed(1) + '%');
    console.log('  Historical:', (prediction.contributingFactors.historical * 100).toFixed(1) + '%');
    console.log('  Mobility:', (prediction.contributingFactors.mobility * 100).toFixed(1) + '%');
    console.log('Recommendations:', prediction.recommendations.length);
    prediction.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
    console.log();

    // Test 2: Infection Surveillance
    console.log('Test 2: Infection Surveillance');
    console.log('-'.repeat(80));
    const infectionAlerts = await service.monitorFacility('facility-mumbai');
    console.log('Infection Alerts:', infectionAlerts.length);
    if (infectionAlerts.length > 0) {
      const alert = infectionAlerts[0];
      console.log('Alert ID:', alert.alertId);
      console.log('Alert Type:', alert.alertType);
      console.log('Severity:', alert.severity);
      console.log('Infection Type:', alert.infectionType);
      console.log('Affected Count:', alert.affectedCount);
      console.log('Location:', alert.location);
      console.log('Isolation Required:', alert.isolationRequired);
      console.log('Contact Tracing Required:', alert.contactTracingRequired);
      console.log('Recommendations:', alert.recommendations.length);
      alert.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }
    console.log();

    // Test 3: Media Scanning
    console.log('Test 3: Media Scanning');
    console.log('-'.repeat(80));
    const mediaScan = await service.scanMedia(7);
    console.log('Scan ID:', mediaScan.scanId);
    console.log('Time Range:', mediaScan.timeRange.start.toISOString(), 'to', mediaScan.timeRange.end.toISOString());
    console.log('Total Events:', mediaScan.totalEvents);
    console.log('Verified Events:', mediaScan.verifiedEvents);
    console.log('Bot Filtered Events:', mediaScan.botFilteredEvents);
    console.log('Language Distribution:');
    Object.entries(mediaScan.languageDistribution).forEach(([lang, count]) => {
      console.log(`  ${lang}: ${count}`);
    });
    console.log('Disease Distribution:');
    Object.entries(mediaScan.diseaseDistribution).forEach(([disease, count]) => {
      console.log(`  ${disease}: ${count}`);
    });
    console.log('Priority Events:', mediaScan.priorityEvents.length);
    if (mediaScan.priorityEvents.length > 0) {
      const event = mediaScan.priorityEvents[0];
      console.log('  Event ID:', event.eventId);
      console.log('  Source:', event.source);
      console.log('  Language:', event.language);
      console.log('  Severity:', event.severity);
      console.log('  Location:', event.location.district, event.location.state);
      console.log('  Disease Keywords:', event.diseaseKeywords.join(', '));
    }
    console.log();

    // Test 4: Comprehensive Surveillance
    console.log('Test 4: Comprehensive Surveillance');
    console.log('-'.repeat(80));
    const surveillance = await service.performSurveillance(
      'Maharashtra',
      ['Mumbai', 'Pune'],
      'Dengue'
    );
    console.log('Predictions:', surveillance.predictions.length);
    console.log('Outbreak Alerts:', surveillance.outbreakAlerts.length);
    console.log('Infection Clusters:', surveillance.infectionClusters.length);
    console.log('Infection Alerts:', surveillance.infectionAlerts.length);
    console.log('Media Scan Events:', surveillance.mediaScan.totalEvents);
    console.log('Public Health Metrics:');
    console.log('  Active Outbreaks:', surveillance.metrics.totalActiveOutbreaks);
    console.log('  Districts at Risk:', surveillance.metrics.districtsAtRisk);
    console.log('  Total Cases:', surveillance.metrics.totalCases);
    console.log('  RRT Deployments:', surveillance.metrics.rrtDeployments);
    console.log('  Prediction Accuracy:', (surveillance.metrics.predictionAccuracy * 100).toFixed(1) + '%');
    console.log('  Early Warning Lead Time:', surveillance.metrics.earlyWarningLeadTime, 'days');
    console.log();

    // Test 5: Dashboard Data
    console.log('Test 5: Dashboard Data');
    console.log('-'.repeat(80));
    const dashboard = await service.getDashboardData('Maharashtra');
    console.log('Active Outbreaks:', dashboard.activeOutbreaks.length);
    console.log('RRT Deployments:', dashboard.rrtDeployments.length);
    console.log('Resource Allocations:', dashboard.resourceAllocations.length);
    if (dashboard.activeOutbreaks.length > 0) {
      const outbreak = dashboard.activeOutbreaks[0];
      console.log('Outbreak Details:');
      console.log('  Disease:', outbreak.diseaseType);
      console.log('  Location:', outbreak.district, outbreak.state);
      console.log('  Status:', outbreak.status);
      console.log('  Total Cases:', outbreak.totalCases);
      console.log('  Deaths:', outbreak.deaths);
      console.log('  Recoveries:', outbreak.recoveries);
      console.log('  Timeline Events:', outbreak.events.length);
    }
    console.log();

    // Test 6: RRT Activation
    console.log('Test 6: RRT Activation');
    console.log('-'.repeat(80));
    const rrtActivation = await service.activateRRT('Mumbai', 'Maharashtra', 'Dengue', 0.87);
    if (rrtActivation) {
      console.log('Activation ID:', rrtActivation.activationId);
      console.log('Status:', rrtActivation.status);
      console.log('Team Members:', rrtActivation.teamMembers.length);
      rrtActivation.teamMembers.forEach((member, i) => {
        console.log(`  ${i + 1}. ${member.name} - ${member.role}`);
      });
      console.log('Objectives:', rrtActivation.objectives.length);
      rrtActivation.objectives.forEach((obj, i) => {
        console.log(`  ${i + 1}. ${obj}`);
      });
    } else {
      console.log('RRT activation threshold not met');
    }
    console.log();

    // Test 7: Resource Gap Identification
    console.log('Test 7: Resource Gap Identification');
    console.log('-'.repeat(80));
    const gaps = await service.identifyResourceGaps('Mumbai', 'Maharashtra', 50);
    console.log('Resource Gaps:', gaps.length);
    gaps.forEach((gap, i) => {
      console.log(`  ${i + 1}. ${gap.resourceType}`);
      console.log(`     Required: ${gap.required}`);
      console.log(`     Available: ${gap.available}`);
      console.log(`     Gap: ${gap.gap}`);
    });
    console.log();

    // Test 8: Public Awareness Message
    console.log('Test 8: Public Awareness Message Generation');
    console.log('-'.repeat(80));
    const messageEn = await service.generateAwarenessMessage('Dengue', 'Mumbai', 'Maharashtra', 'en');
    console.log('English Message:');
    console.log(messageEn);
    console.log();
    const messageHi = await service.generateAwarenessMessage('Dengue', 'Mumbai', 'Maharashtra', 'hi');
    console.log('Hindi Message:');
    console.log(messageHi);
    console.log();

    console.log('='.repeat(80));
    console.log('All tests completed successfully!');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testPublicHealthIntelligence();

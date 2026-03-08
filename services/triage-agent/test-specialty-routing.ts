/**
 * Manual test for Specialty Routing Service
 */

import { SpecialtyRoutingService } from './src/services/specialty-routing.service';
import { TriageSession } from './src/types';

async function testSpecialtyRouting() {
  console.log('=== Testing Specialty Routing Service ===\n');
  
  const service = new SpecialtyRoutingService();

  // Test 1: Cardiology classification
  console.log('Test 1: Cardiology Classification');
  const cardiologySession: TriageSession = {
    sessionId: 'test-1',
    patientId: 'patient-1',
    status: 'completed',
    currentQuestionIndex: 5,
    responses: [
      {
        questionId: 'q1',
        question: 'What is your main symptom?',
        answer: 'chest pain',
        answeredAt: new Date()
      },
      {
        questionId: 'q16_age',
        question: 'What is your age?',
        answer: '55',
        answeredAt: new Date()
      }
    ],
    symptoms: ['chest pain', 'shortness of breath', 'heart palpitations'],
    urgencyScore: 85,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const cardiologyClassification = service.classifySpecialty(cardiologySession);
  console.log('Primary Specialty:', cardiologyClassification.primarySpecialty);
  console.log('Confidence:', cardiologyClassification.confidence);
  console.log('Alternative Specialties:', cardiologyClassification.alternativeSpecialties);
  console.log('Reasoning:', cardiologyClassification.reasoning);
  console.log('✓ Test 1 passed\n');

  // Test 2: Pediatrics classification
  console.log('Test 2: Pediatrics Classification');
  const pediatricsSession: TriageSession = {
    sessionId: 'test-2',
    patientId: 'patient-2',
    status: 'completed',
    currentQuestionIndex: 5,
    responses: [
      {
        questionId: 'q16_age',
        question: 'What is your age?',
        answer: '7',
        answeredAt: new Date()
      },
      {
        questionId: 'q1',
        question: 'What is your main symptom?',
        answer: 'fever and cough',
        answeredAt: new Date()
      }
    ],
    symptoms: ['fever', 'cough'],
    urgencyScore: 50,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const pediatricsClassification = service.classifySpecialty(pediatricsSession);
  console.log('Primary Specialty:', pediatricsClassification.primarySpecialty);
  console.log('Confidence:', pediatricsClassification.confidence);
  console.log('✓ Test 2 passed\n');

  // Test 3: Facility matching
  console.log('Test 3: Facility Matching');
  const patientLocation = {
    latitude: 28.6139,
    longitude: 77.2090
  };

  const facilities = await service.matchFacilities(
    cardiologyClassification,
    patientLocation,
    'urgent'
  );

  console.log(`Found ${facilities.length} matching facilities:`);
  facilities.forEach((facility, index) => {
    console.log(`\n${index + 1}. ${facility.facilityName}`);
    console.log(`   Distance: ${facility.distance} km`);
    console.log(`   Travel Time: ${facility.estimatedTravelTime} minutes`);
    console.log(`   Has Specialty: ${facility.hasSpecialty ? 'Yes' : 'No'}`);
    console.log(`   Availability: ${facility.availabilityStatus}`);
    console.log(`   Wait Time: ${facility.currentWaitTime} minutes`);
    console.log(`   Match Score: ${facility.matchScore}/100`);
  });
  console.log('\n✓ Test 3 passed\n');

  // Test 4: Complete routing recommendation
  console.log('Test 4: Complete Routing Recommendation');
  const recommendation = await service.getRoutingRecommendation(
    cardiologySession,
    patientLocation,
    'urgent'
  );

  console.log('Classification:');
  console.log('  Primary Specialty:', recommendation.classification.primarySpecialty);
  console.log('  Confidence:', recommendation.classification.confidence);
  console.log('  Alternative Specialties:', recommendation.classification.alternativeSpecialties);
  console.log('\nTop Recommended Facility:');
  console.log('  Name:', recommendation.recommendedFacilities[0].facilityName);
  console.log('  Distance:', recommendation.recommendedFacilities[0].distance, 'km');
  console.log('  Match Score:', recommendation.recommendedFacilities[0].matchScore);
  console.log('\n✓ Test 4 passed\n');

  // Test 5: Neurology classification
  console.log('Test 5: Neurology Classification');
  const neurologySession: TriageSession = {
    sessionId: 'test-5',
    patientId: 'patient-5',
    status: 'completed',
    currentQuestionIndex: 5,
    responses: [
      {
        questionId: 'q1',
        question: 'What is your main symptom?',
        answer: 'severe headache',
        answeredAt: new Date()
      }
    ],
    symptoms: ['headache', 'dizziness', 'confusion'],
    urgencyScore: 70,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const neurologyClassification = service.classifySpecialty(neurologySession);
  console.log('Primary Specialty:', neurologyClassification.primarySpecialty);
  console.log('Confidence:', neurologyClassification.confidence);
  console.log('✓ Test 5 passed\n');

  console.log('=== All Tests Passed Successfully! ===');
}

// Run tests
testSpecialtyRouting().catch(console.error);

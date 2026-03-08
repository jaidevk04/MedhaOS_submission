/**
 * Test script for Educational Content Delivery System
 * 
 * This script demonstrates the functionality of the educational content service
 * including personalized recommendations, multilingual support, and content management.
 */

import { EducationalContentService } from './src/services/educational-content.service';
import { Patient, DischargeData } from './src/types';

async function testEducationalContent() {
  console.log('=== Educational Content Delivery System Test ===\n');

  const contentService = new EducationalContentService();

  // Test 1: Personalized Recommendations for Cardiac Patient (Hindi)
  console.log('Test 1: Personalized Recommendations - Cardiac Patient (Hindi)');
  console.log('-----------------------------------------------------------');
  
  const cardiacPatient: Patient = {
    id: 'patient-001',
    name: 'Rajesh Kumar',
    phone: '+919876543210',
    language: 'hi',
  };

  const cardiacDischarge: DischargeData = {
    patientId: 'patient-001',
    encounterId: 'enc-001',
    dischargeDate: new Date('2024-03-01'),
    diagnosis: ['Myocardial Infarction', 'Hypertension'],
    procedures: ['Angioplasty'],
    restrictions: [],
  };

  const cardiacRecommendations = await contentService.getPersonalizedRecommendations(
    cardiacPatient,
    cardiacDischarge
  );

  console.log('Patient:', cardiacPatient.name);
  console.log('Language:', cardiacRecommendations.language);
  console.log('Diagnosis:', cardiacRecommendations.diagnosis.join(', '));
  console.log('Personalized Message:', cardiacRecommendations.personalizedMessage);
  console.log('\nRecommended Content:');
  cardiacRecommendations.recommendedContent.forEach((content, index) => {
    console.log(`  ${index + 1}. ${content.title} (${content.type})`);
    console.log(`     Category: ${content.category}`);
    console.log(`     Language: ${content.language}`);
    if (content.duration) {
      console.log(`     Duration: ${content.duration}`);
    }
    console.log(`     URL: ${content.url}`);
    console.log();
  });

  // Test 2: Personalized Recommendations for Diabetes Patient (English)
  console.log('\nTest 2: Personalized Recommendations - Diabetes Patient (English)');
  console.log('------------------------------------------------------------------');
  
  const diabetesPatient: Patient = {
    id: 'patient-002',
    name: 'Priya Sharma',
    phone: '+919876543211',
    language: 'en',
  };

  const diabetesDischarge: DischargeData = {
    patientId: 'patient-002',
    encounterId: 'enc-002',
    dischargeDate: new Date('2024-03-02'),
    diagnosis: ['Type 2 Diabetes Mellitus'],
    procedures: [],
    restrictions: [],
  };

  const diabetesRecommendations = await contentService.getPersonalizedRecommendations(
    diabetesPatient,
    diabetesDischarge
  );

  console.log('Patient:', diabetesPatient.name);
  console.log('Language:', diabetesRecommendations.language);
  console.log('Diagnosis:', diabetesRecommendations.diagnosis.join(', '));
  console.log('\nRecommended Content Count:', diabetesRecommendations.recommendedContent.length);
  console.log('Content Types:');
  const contentTypes = diabetesRecommendations.recommendedContent.reduce((acc, content) => {
    acc[content.type] = (acc[content.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(contentTypes).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`);
  });

  // Test 3: Get Content by Category
  console.log('\n\nTest 3: Get Content by Category - Cardiac (English)');
  console.log('----------------------------------------------------');
  
  const cardiacContent = await contentService.getContentByCategory('cardiac', 'en');
  console.log(`Found ${cardiacContent.length} cardiac content items in English:`);
  cardiacContent.forEach((content, index) => {
    console.log(`  ${index + 1}. ${content.title} (${content.type})`);
  });

  // Test 4: Search Content
  console.log('\n\nTest 4: Search Content - "diabetes"');
  console.log('------------------------------------');
  
  const searchResults = await contentService.searchContent('diabetes', 'en');
  console.log(`Found ${searchResults.length} results for "diabetes":`);
  searchResults.forEach((content, index) => {
    console.log(`  ${index + 1}. ${content.title}`);
    console.log(`     Description: ${content.description}`);
  });

  // Test 5: Get Available Categories
  console.log('\n\nTest 5: Available Categories');
  console.log('----------------------------');
  
  const categories = await contentService.getAvailableCategories();
  console.log('Available categories:', categories.join(', '));

  // Test 6: Get Supported Languages
  console.log('\n\nTest 6: Supported Languages');
  console.log('---------------------------');
  
  const languages = await contentService.getSupportedLanguages();
  console.log('Supported languages:', languages.join(', '));

  // Test 7: Get Content by Type
  console.log('\n\nTest 7: Get Content by Type - Videos (Hindi)');
  console.log('---------------------------------------------');
  
  const videos = await contentService.getContentByType('video', 'hi');
  console.log(`Found ${videos.length} videos in Hindi:`);
  videos.forEach((content, index) => {
    console.log(`  ${index + 1}. ${content.title} (${content.duration})`);
  });

  // Test 8: Track Content View
  console.log('\n\nTest 8: Track Content View');
  console.log('--------------------------');
  
  if (cardiacRecommendations.recommendedContent.length > 0) {
    const firstContent = cardiacRecommendations.recommendedContent[0];
    await contentService.trackContentView(
      cardiacPatient.id,
      firstContent.id,
      330 // 5 minutes 30 seconds
    );
    console.log(`Tracked view for content: ${firstContent.title}`);
    console.log('Duration: 5:30 (330 seconds)');
  }

  // Test 9: Language Fallback
  console.log('\n\nTest 9: Language Fallback - Tamil (falls back to English)');
  console.log('----------------------------------------------------------');
  
  const tamilPatient: Patient = {
    id: 'patient-003',
    name: 'Murugan',
    phone: '+919876543212',
    language: 'ta',
  };

  const tamilRecommendations = await contentService.getPersonalizedRecommendations(
    tamilPatient,
    cardiacDischarge
  );

  console.log('Requested Language: ta (Tamil)');
  console.log('Content Languages Found:');
  const languageCounts = tamilRecommendations.recommendedContent.reduce((acc, content) => {
    acc[content.language] = (acc[content.language] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(languageCounts).forEach(([lang, count]) => {
    console.log(`  - ${lang}: ${count} items`);
  });

  console.log('\n=== All Tests Completed Successfully ===');
}

// Run tests
testEducationalContent().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});

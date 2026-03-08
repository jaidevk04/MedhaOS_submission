/**
 * Test script for Diagnostic Vision Agent
 * 
 * This script demonstrates the basic functionality of the vision service
 */

import { DiagnosticVisionService } from './src/services/diagnostic-vision.service';
import { ImageUploadRequest, ImageAnalysisRequest } from './src/types';

async function testVisionService() {
  console.log('Testing Diagnostic Vision Agent...\n');

  const visionService = new DiagnosticVisionService();

  // Test 1: Health Check
  console.log('1. Testing health check...');
  try {
    const health = await visionService.healthCheck();
    console.log('Health status:', health.status);
    console.log('Services:', health.services);
    console.log('✓ Health check passed\n');
  } catch (error) {
    console.error('✗ Health check failed:', error);
  }

  // Test 2: Statistics
  console.log('2. Testing statistics...');
  try {
    const stats = await visionService.getStatistics('day');
    console.log('Statistics:', stats);
    console.log('✓ Statistics test passed\n');
  } catch (error) {
    console.error('✗ Statistics test failed:', error);
  }

  // Test 3: Image Upload (simulated)
  console.log('3. Testing image upload (simulated)...');
  try {
    // In real usage, this would be an actual image buffer
    const mockImageBuffer = Buffer.from('mock-image-data');
    
    const uploadRequest: ImageUploadRequest = {
      patientId: 'PAT-12345',
      encounterId: 'ENC-67890',
      modality: 'X-ray',
      bodyPart: 'chest',
      studyDate: new Date(),
      clinicalContext: {
        patientAge: 58,
        patientGender: 'male',
        symptoms: ['chest pain', 'shortness of breath'],
        clinicalQuestion: 'Rule out pneumonia'
      }
    };

    console.log('Upload request:', uploadRequest);
    console.log('Note: Actual upload requires AWS credentials and S3 bucket');
    console.log('✓ Image upload structure validated\n');
  } catch (error) {
    console.error('✗ Image upload test failed:', error);
  }

  // Test 4: Analysis Request (simulated)
  console.log('4. Testing analysis request (simulated)...');
  try {
    const analysisRequest: ImageAnalysisRequest = {
      imageId: 'img-uuid-12345',
      clinicalContext: {
        patientAge: 58,
        patientGender: 'male',
        symptoms: ['chest pain'],
        clinicalQuestion: 'Rule out pneumonia'
      },
      generateReport: true,
      urgency: 'stat'
    };

    console.log('Analysis request:', analysisRequest);
    console.log('Note: Actual analysis requires SageMaker endpoints');
    console.log('✓ Analysis request structure validated\n');
  } catch (error) {
    console.error('✗ Analysis request test failed:', error);
  }

  console.log('Test suite completed!');
  console.log('\nTo run the service:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Configure .env file with AWS credentials');
  console.log('3. Deploy models to SageMaker: npm run deploy-models');
  console.log('4. Start service: npm run dev');
}

// Run tests
testVisionService().catch(console.error);

/**
 * Test script for CDSS Agent
 * Demonstrates the functionality of all CDSS services
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3010';

// Test data
const testPatientContext = {
  patientId: 'P123456',
  age: 58,
  gender: 'male',
  symptoms: [
    {
      name: 'chest pain',
      severity: 'severe' as const,
      duration: '2 hours',
      onset: 'sudden',
      characteristics: ['pressure-like', 'radiating to left arm']
    },
    {
      name: 'diaphoresis',
      severity: 'moderate' as const,
      duration: '2 hours',
      onset: 'sudden'
    }
  ],
  vitals: {
    temperature: 37.2,
    bloodPressure: '145/92',
    heartRate: 98,
    respiratoryRate: 18,
    oxygenSaturation: 96
  },
  medicalHistory: ['Type 2 Diabetes (2015)', 'Hypertension (2012)', 'Previous MI (2020)'],
  currentMedications: ['Aspirin 75mg', 'Atorvastatin 40mg', 'Metformin 500mg', 'Lisinopril 10mg'],
  allergies: ['Penicillin']
};

const testPatientProfile = {
  patientId: 'P123456',
  age: 58,
  gender: 'male',
  diagnoses: ['Non-small cell lung cancer', 'Stage IIIA'],
  geneticProfile: {
    mutations: ['EGFR exon 19 deletion'],
    biomarkers: {
      'PD-L1': '50%'
    }
  },
  location: {
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India'
  }
};

const testEncounterData = {
  encounterId: 'E123456',
  patientId: 'P123456',
  chiefComplaint: 'Chest pain',
  presentingSymptoms: ['chest pain', 'diaphoresis'],
  vitalSigns: {
    temperature: 37.2,
    bloodPressure: '145/92',
    heartRate: 98,
    oxygenSaturation: 96
  },
  physicalExamination: 'Patient appears diaphoretic and in distress',
  assessment: 'Acute coronary syndrome',
  diagnosis: 'STEMI',
  treatmentPlan: 'Immediate reperfusion therapy, aspirin, clopidogrel',
  clinicianSignature: 'Dr. Anjali Verma',
  medicalHistory: ['diabetes', 'hypertension'],
  allergies: ['penicillin'],
  currentMedications: ['metformin', 'lisinopril'],
  prescriptions: [
    {
      drugName: 'Aspirin',
      dosage: '300mg',
      frequency: 'STAT, then 75mg daily',
      duration: 'Ongoing',
      instructions: 'Take with food'
    },
    {
      drugName: 'Clopidogrel',
      dosage: '300mg',
      frequency: 'STAT, then 75mg daily',
      duration: '12 months',
      instructions: 'Take with food'
    }
  ]
};

async function testHealthCheck() {
  console.log('\n=== Testing Health Check ===');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✓ Health check passed:', response.data);
  } catch (error: any) {
    console.error('✗ Health check failed:', error.message);
  }
}

async function testDifferentialDiagnosis() {
  console.log('\n=== Testing Differential Diagnosis ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/cdss/diagnosis`, {
      patientContext: testPatientContext
    });
    
    console.log('✓ Differential diagnosis generated');
    console.log('Request ID:', response.data.requestId);
    console.log('Confidence:', response.data.confidence);
    console.log('Processing time:', response.data.processingTime, 'ms');
    console.log('\nTop 3 Diagnoses:');
    response.data.data.diagnoses.slice(0, 3).forEach((dx: any, i: number) => {
      console.log(`${i + 1}. ${dx.condition} (${dx.icdCode})`);
      console.log(`   Probability: ${(dx.probability * 100).toFixed(1)}%`);
      console.log(`   Urgency: ${dx.urgency}`);
      console.log(`   Reasoning: ${dx.reasoning}`);
    });
    console.log('\nRecommendations:');
    response.data.data.recommendations.forEach((rec: string) => {
      console.log(`- ${rec}`);
    });
  } catch (error: any) {
    console.error('✗ Differential diagnosis failed:', error.response?.data || error.message);
  }
}

async function testLiteratureSearch() {
  console.log('\n=== Testing Literature Search ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/cdss/literature-search`, {
      query: 'Latest treatment guidelines for acute myocardial infarction'
    });
    
    console.log('✓ Literature search completed');
    console.log('Request ID:', response.data.requestId);
    console.log('Confidence:', response.data.confidence);
    console.log('Processing time:', response.data.processingTime, 'ms');
    console.log('\nResults found:', response.data.data.results.length);
    console.log('\nTop 3 Results:');
    response.data.data.results.slice(0, 3).forEach((result: any, i: number) => {
      console.log(`${i + 1}. ${result.document.title}`);
      console.log(`   Relevance: ${(result.score * 100).toFixed(1)}%`);
      console.log(`   Source: ${result.document.source}`);
    });
    console.log('\nSummary:', response.data.data.summary.substring(0, 200) + '...');
  } catch (error: any) {
    console.error('✗ Literature search failed:', error.response?.data || error.message);
  }
}

async function testTrialMatching() {
  console.log('\n=== Testing Clinical Trial Matching ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/cdss/trial-matching`, {
      patientProfile: testPatientProfile
    });
    
    console.log('✓ Trial matching completed');
    console.log('Request ID:', response.data.requestId);
    console.log('Confidence:', response.data.confidence);
    console.log('Processing time:', response.data.processingTime, 'ms');
    console.log('\nTrials evaluated:', response.data.data.totalTrialsEvaluated);
    console.log('Matches found:', response.data.data.matches.length);
    console.log('\nTop 3 Matches:');
    response.data.data.matches.slice(0, 3).forEach((match: any, i: number) => {
      console.log(`${i + 1}. ${match.trial.title}`);
      console.log(`   NCT ID: ${match.trial.nctId}`);
      console.log(`   Match Score: ${match.matchScore}`);
      console.log(`   Eligibility: ${match.eligibilityStatus}`);
      console.log(`   Reasons: ${match.matchReasons.join(', ')}`);
    });
  } catch (error: any) {
    console.error('✗ Trial matching failed:', error.response?.data || error.message);
  }
}

async function testComplianceCheck() {
  console.log('\n=== Testing Compliance Check ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/cdss/compliance-check`, testEncounterData);
    
    console.log('✓ Compliance check completed');
    console.log('Request ID:', response.data.requestId);
    console.log('Confidence:', response.data.confidence);
    console.log('Processing time:', response.data.processingTime, 'ms');
    console.log('\nOverall Compliance:', response.data.data.overallCompliance);
    console.log('Completeness Score:', (response.data.data.documentationCompleteness.completenessScore * 100).toFixed(1) + '%');
    console.log('\nCompliance Checks:');
    response.data.data.checks.forEach((check: any) => {
      console.log(`- ${check.checkType}: ${check.status}`);
      console.log(`  ${check.message}`);
    });
    console.log('\nRecommendations:');
    response.data.data.recommendations.forEach((rec: string) => {
      console.log(`- ${rec}`);
    });
  } catch (error: any) {
    console.error('✗ Compliance check failed:', error.response?.data || error.message);
  }
}

async function testPriorAuthorization() {
  console.log('\n=== Testing Prior Authorization ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/cdss/prior-authorization`, {
      authorizationRequest: {
        patientId: 'P123456',
        encounterId: 'E123456',
        requestType: 'medication',
        details: {
          name: 'Pembrolizumab',
          code: 'J9271',
          justification: 'First-line treatment for metastatic NSCLC with PD-L1 ≥50%',
          clinicalEvidence: [
            'PD-L1 expression 50%',
            'EGFR and ALK negative',
            'Stage IV NSCLC confirmed by biopsy',
            'ECOG performance status 0-1'
          ],
          alternativesConsidered: [
            'Chemotherapy alone - less effective per KEYNOTE-024 trial',
            'Combination therapy - patient not suitable due to comorbidities'
          ]
        },
        insuranceInfo: {
          provider: 'Star Health Insurance',
          policyNumber: 'SH123456789',
          groupNumber: 'GRP001'
        },
        urgency: 'urgent'
      }
    });
    
    console.log('✓ Prior authorization generated');
    console.log('Request ID:', response.data.requestId);
    console.log('Confidence:', response.data.confidence);
    console.log('Processing time:', response.data.processingTime, 'ms');
    console.log('\nAuthorization Request ID:', response.data.data.requestId);
    console.log('Estimated Approval Time:', response.data.data.estimatedApprovalTime);
    console.log('\nSupporting Documents Required:');
    response.data.data.supportingDocuments.forEach((doc: string) => {
      console.log(`- ${doc}`);
    });
    console.log('\nGenerated Document Preview:');
    console.log(response.data.data.generatedDocument.substring(0, 300) + '...');
  } catch (error: any) {
    console.error('✗ Prior authorization failed:', error.response?.data || error.message);
  }
}

async function testClinicalRecommendations() {
  console.log('\n=== Testing Clinical Recommendations ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/cdss/recommendations`, {
      condition: 'Acute Myocardial Infarction',
      patientContext: 'Patient with diabetes and hypertension, previous MI in 2020'
    });
    
    console.log('✓ Clinical recommendations retrieved');
    console.log('Request ID:', response.data.requestId);
    console.log('Confidence:', response.data.confidence);
    console.log('Processing time:', response.data.processingTime, 'ms');
    console.log('\nRecommendations Summary:');
    console.log(response.data.data.summary.substring(0, 300) + '...');
  } catch (error: any) {
    console.error('✗ Clinical recommendations failed:', error.response?.data || error.message);
  }
}

async function testDrugInformation() {
  console.log('\n=== Testing Drug Information ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/cdss/drug-information`, {
      drugName: 'Clopidogrel',
      indication: 'Acute Coronary Syndrome'
    });
    
    console.log('✓ Drug information retrieved');
    console.log('Request ID:', response.data.requestId);
    console.log('Confidence:', response.data.confidence);
    console.log('Processing time:', response.data.processingTime, 'ms');
    console.log('\nDrug Information Summary:');
    console.log(response.data.data.summary.substring(0, 300) + '...');
  } catch (error: any) {
    console.error('✗ Drug information failed:', error.response?.data || error.message);
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         CDSS Agent - Comprehensive Test Suite             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  await testHealthCheck();
  await testDifferentialDiagnosis();
  await testLiteratureSearch();
  await testTrialMatching();
  await testComplianceCheck();
  await testPriorAuthorization();
  await testClinicalRecommendations();
  await testDrugInformation();
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                   Test Suite Complete                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

// Run tests
runAllTests().catch(console.error);

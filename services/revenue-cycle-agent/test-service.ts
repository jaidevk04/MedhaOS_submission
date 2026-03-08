/**
 * Revenue Cycle Agent Test Script
 * 
 * Tests the complete revenue cycle workflow including:
 * - Medical coding generation
 * - Claim generation
 * - Error detection
 * - Rejection prediction
 * - Prior authorization
 */

import { ClinicalNote } from './src/types';

const API_BASE_URL = 'http://localhost:3015/api/revenue-cycle';

// Sample clinical note for testing
const sampleClinicalNote: ClinicalNote = {
  encounter_id: 'ENC-TEST-001',
  patient_id: 'PAT-TEST-001',
  clinician_id: 'DOC-001',
  encounter_date: '2024-02-26',
  encounter_type: 'ED',
  chief_complaint: 'Chest pain with radiation to left arm',
  subjective: `Patient is a 58-year-old male presenting with acute onset chest pain that started 2 hours ago. 
  Pain is described as pressure-like, 8/10 severity, radiating to left arm. Associated with diaphoresis and nausea. 
  Patient has history of myocardial infarction in 2020, type 2 diabetes, and hypertension.`,
  objective: `Vital Signs: BP 145/92 mmHg, HR 98 bpm, RR 18/min, Temp 98.2°F, SpO2 96% on room air
  Physical Exam: Patient appears diaphoretic and in moderate distress. Heart: Regular rhythm, no murmurs. 
  Lungs: Clear bilaterally. Abdomen: Soft, non-tender.
  ECG: ST elevation in leads II, III, aVF suggesting inferior wall STEMI.`,
  assessment: `Acute ST-elevation myocardial infarction (STEMI), inferior wall. 
  High risk for cardiogenic shock given history of previous MI.`,
  plan: `1. Activate cardiac catheterization lab for emergent PCI
  2. Aspirin 325mg PO given
  3. Clopidogrel 600mg loading dose
  4. Heparin bolus and infusion
  5. Admit to CCU
  6. Cardiology consultation`,
  diagnoses: [
    'Acute ST-elevation myocardial infarction (STEMI)',
    'Type 2 diabetes mellitus',
    'Essential hypertension',
  ],
  procedures: [
    'Emergency department visit, high complexity',
    'ECG interpretation',
  ],
};

async function testMedicalCoding() {
  console.log('\n🔬 Testing Medical Coding Generation...\n');

  try {
    const response = await fetch(`${API_BASE_URL}/codes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinical_note: sampleClinicalNote,
        encounter_context: {
          facility_type: 'Hospital',
          specialty: 'Emergency Medicine',
          visit_duration_minutes: 45,
        },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Medical Coding Generated Successfully\n');
      console.log('ICD-10 Codes:');
      data.medical_coding.icd10_codes.forEach((code: any) => {
        console.log(`  ${code.is_primary ? '⭐' : '  '} ${code.code}: ${code.description}`);
        console.log(`     Confidence: ${(code.confidence * 100).toFixed(1)}%`);
      });

      console.log('\nCPT Codes:');
      data.medical_coding.cpt_codes.forEach((code: any) => {
        console.log(`  - ${code.code}: ${code.description}`);
        console.log(`    Confidence: ${(code.confidence * 100).toFixed(1)}%`);
      });

      console.log(`\nOverall Confidence: ${(data.medical_coding.overall_confidence * 100).toFixed(1)}%`);
      console.log(`Requires Review: ${data.medical_coding.requires_review ? 'Yes' : 'No'}`);
      console.log(`Processing Time: ${data.processing_time_ms}ms`);

      return data.medical_coding;
    } else {
      console.error('❌ Error:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
    return null;
  }
}

async function testClaimGeneration(medicalCoding: any) {
  console.log('\n💰 Testing Claim Generation...\n');

  try {
    const response = await fetch(`${API_BASE_URL}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        encounter_id: sampleClinicalNote.encounter_id,
        patient_id: sampleClinicalNote.patient_id,
        insurance_policy_id: 'POL-TEST-001',
        medical_coding: medicalCoding,
        auto_submit: false,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Claim Generated Successfully\n');
      console.log(`Claim ID: ${data.claim.claim_id}`);
      console.log(`Total Charges: $${data.claim.total_charges.toFixed(2)}`);
      console.log(`Status: ${data.claim.claim_status}`);
      console.log(`\nValidation Result:`);
      console.log(`  Valid: ${data.validation_result.is_valid ? 'Yes' : 'No'}`);
      console.log(`  Errors: ${data.validation_result.errors.length}`);
      console.log(`  Warnings: ${data.validation_result.warnings.length}`);
      console.log(`  Rejection Risk: ${data.validation_result.rejection_risk_score}%`);

      if (data.validation_result.recommendations.length > 0) {
        console.log('\nRecommendations:');
        data.validation_result.recommendations.forEach((rec: string) => {
          console.log(`  - ${rec}`);
        });
      }

      return data.claim;
    } else {
      console.error('❌ Error:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
    return null;
  }
}

async function testErrorDetection(claim: any) {
  console.log('\n🔍 Testing Error Detection...\n');

  try {
    const response = await fetch(`${API_BASE_URL}/detect-errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claim),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Error Detection Complete\n');
      console.log(`Errors Detected: ${data.errors_detected}`);

      if (data.errors.length > 0) {
        console.log('\nDetected Errors:');
        data.errors.forEach((error: any) => {
          console.log(`  - [${error.severity}] ${error.error_type}`);
          console.log(`    ${error.description}`);
          if (error.suggested_correction) {
            console.log(`    💡 ${error.suggested_correction}`);
          }
        });
      } else {
        console.log('  No errors detected - claim looks good!');
      }

      return data.errors;
    } else {
      console.error('❌ Error:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
    return null;
  }
}

async function testRejectionPrediction(claim: any) {
  console.log('\n📊 Testing Rejection Prediction...\n');

  try {
    const response = await fetch(`${API_BASE_URL}/predict-rejection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claim),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Rejection Prediction Complete\n');
      console.log(`Rejection Probability: ${(data.rejection_probability * 100).toFixed(1)}%`);
      console.log(`Risk Level: ${data.rejection_probability > 0.5 ? '🔴 HIGH' : data.rejection_probability > 0.25 ? '🟡 MEDIUM' : '🟢 LOW'}`);

      if (data.risk_factors.length > 0) {
        console.log('\nRisk Factors:');
        data.risk_factors.forEach((factor: any) => {
          console.log(`  - ${factor.factor} (Impact: ${factor.impact_score})`);
          console.log(`    ${factor.description}`);
          console.log(`    💡 ${factor.mitigation}`);
        });
      }

      if (data.preventive_actions.length > 0) {
        console.log('\nPreventive Actions:');
        data.preventive_actions.forEach((action: string) => {
          console.log(`  ✓ ${action}`);
        });
      }

      return data;
    } else {
      console.error('❌ Error:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
    return null;
  }
}

async function testPriorAuthorization() {
  console.log('\n📋 Testing Prior Authorization...\n');

  try {
    const response = await fetch(`${API_BASE_URL}/prior-authorization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        encounter_id: 'ENC-TEST-002',
        patient_id: 'PAT-TEST-001',
        insurance_policy_id: 'POL-TEST-001',
        requested_service: 'MRI Lumbar Spine with contrast',
        urgency: 'Routine',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Prior Authorization Request Generated\n');
      console.log(`Request ID: ${data.authorization_request.auth_request_id}`);
      console.log(`Service: ${data.authorization_request.requested_service}`);
      console.log(`Status: ${data.authorization_request.status}`);
      console.log(`Urgency: ${data.authorization_request.urgency}`);
      console.log(`Submission Ready: ${data.submission_ready ? 'Yes' : 'No'}`);

      console.log('\nClinical Justification:');
      console.log(`  ${data.auto_generated_justification.substring(0, 200)}...`);

      console.log('\nSupporting Evidence:');
      data.supporting_evidence.forEach((evidence: string) => {
        console.log(`  - ${evidence}`);
      });

      return data;
    } else {
      console.error('❌ Error:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
    return null;
  }
}

async function testCompleteWorkflow() {
  console.log('\n🔄 Testing Complete Revenue Cycle Workflow...\n');

  try {
    const response = await fetch(`${API_BASE_URL}/process-encounter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coding_request: {
          clinical_note: sampleClinicalNote,
        },
        insurance_policy_id: 'POL-TEST-001',
        auto_submit: false,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Complete Workflow Executed Successfully\n');
      console.log('📊 Summary:');
      console.log(`  - Codes Generated: ${data.coding_response.medical_coding.icd10_codes.length} ICD-10, ${data.coding_response.medical_coding.cpt_codes.length} CPT`);
      console.log(`  - Claim ID: ${data.claim_response.claim.claim_id}`);
      console.log(`  - Total Charges: $${data.claim_response.claim.total_charges.toFixed(2)}`);
      console.log(`  - Errors Detected: ${data.billing_errors.length}`);
      console.log(`  - Rejection Risk: ${(data.rejection_prediction.rejection_probability * 100).toFixed(1)}%`);

      return data;
    } else {
      console.error('❌ Error:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
    return null;
  }
}

async function testHealthCheck() {
  console.log('\n❤️  Testing Health Check...\n');

  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Service is healthy\n');
      console.log('Services Status:');
      Object.entries(data.services).forEach(([service, status]) => {
        console.log(`  - ${service}: ${status}`);
      });
      return true;
    } else {
      console.error('❌ Health check failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Service is not running. Please start the service first.');
    console.error('   Run: npm run dev');
    return false;
  }
}

// Main test execution
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Revenue Cycle Agent - Test Suite');
  console.log('═══════════════════════════════════════════════════════════');

  // Check if service is running
  const isHealthy = await testHealthCheck();
  if (!isHealthy) {
    console.log('\n⚠️  Please start the service before running tests.');
    process.exit(1);
  }

  // Test individual components
  const medicalCoding = await testMedicalCoding();
  if (!medicalCoding) {
    console.log('\n❌ Medical coding test failed. Stopping tests.');
    process.exit(1);
  }

  const claim = await testClaimGeneration(medicalCoding);
  if (!claim) {
    console.log('\n❌ Claim generation test failed. Stopping tests.');
    process.exit(1);
  }

  await testErrorDetection(claim);
  await testRejectionPrediction(claim);
  await testPriorAuthorization();

  // Test complete workflow
  await testCompleteWorkflow();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ✅ All Tests Completed');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Run tests
runTests().catch(console.error);

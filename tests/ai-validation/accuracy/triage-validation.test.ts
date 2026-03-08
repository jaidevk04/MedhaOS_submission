/**
 * AI Triage Agent Accuracy Validation
 * Tests triage model against labeled dataset
 * 
 * Requirements: 1.4 (92% accuracy target)
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface TriageTestCase {
  id: string;
  symptoms: string[];
  vitals: {
    temperature: number;
    bloodPressure: string;
    heartRate: number;
    respiratoryRate: number;
    spo2: number;
  };
  medicalHistory: string[];
  groundTruthUrgency: number;
  groundTruthCategory: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
  groundTruthSpecialty: string;
}

interface ValidationResult {
  totalCases: number;
  correctPredictions: number;
  accuracy: number;
  precisionByCategory: Record<string, number>;
  recallByCategory: Record<string, number>;
  f1ScoreByCategory: Record<string, number>;
  confusionMatrix: number[][];
  avgUrgencyError: number;
}

describe('AI Triage Agent Validation', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
  const TEST_DATASET_PATH = path.join(__dirname, '../datasets/triage-test-dataset.json');
  
  let testDataset: TriageTestCase[];
  let authToken: string;

  beforeAll(async () => {
    // Load test dataset
    const datasetContent = fs.readFileSync(TEST_DATASET_PATH, 'utf-8');
    testDataset = JSON.parse(datasetContent);

    // Authenticate
    const loginRes = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
      email: 'validator@medhaos.test',
      password: 'validator-password',
    });
    authToken = loginRes.data.token;
  });

  test('should achieve 92% accuracy on test dataset', async () => {
    const results = await validateTriageModel(testDataset);

    console.log('\n=== Triage Model Validation Results ===');
    console.log(`Total Cases: ${results.totalCases}`);
    console.log(`Correct Predictions: ${results.correctPredictions}`);
    console.log(`Accuracy: ${(results.accuracy * 100).toFixed(2)}%`);
    console.log(`Avg Urgency Error: ${results.avgUrgencyError.toFixed(2)}`);
    
    console.log('\nPer-Category Metrics:');
    Object.keys(results.precisionByCategory).forEach(category => {
      console.log(`  ${category}:`);
      console.log(`    Precision: ${(results.precisionByCategory[category] * 100).toFixed(2)}%`);
      console.log(`    Recall: ${(results.recallByCategory[category] * 100).toFixed(2)}%`);
      console.log(`    F1-Score: ${(results.f1ScoreByCategory[category] * 100).toFixed(2)}%`);
    });

    // Save results
    fs.writeFileSync(
      path.join(__dirname, '../results/triage-validation-results.json'),
      JSON.stringify(results, null, 2)
    );

    // Assert accuracy requirement
    expect(results.accuracy).toBeGreaterThanOrEqual(0.92); // 92% requirement
  }, 600000); // 10 minute timeout

  test('should maintain accuracy across age groups', async () => {
    const pediatricCases = testDataset.filter(c => c.id.includes('pediatric'));
    const adultCases = testDataset.filter(c => c.id.includes('adult'));
    const geriatricCases = testDataset.filter(c => c.id.includes('geriatric'));

    const pediatricResults = await validateTriageModel(pediatricCases);
    const adultResults = await validateTriageModel(adultCases);
    const geriatricResults = await validateTriageModel(geriatricCases);

    console.log('\n=== Accuracy by Age Group ===');
    console.log(`Pediatric: ${(pediatricResults.accuracy * 100).toFixed(2)}%`);
    console.log(`Adult: ${(adultResults.accuracy * 100).toFixed(2)}%`);
    console.log(`Geriatric: ${(geriatricResults.accuracy * 100).toFixed(2)}%`);

    // All age groups should meet minimum threshold
    expect(pediatricResults.accuracy).toBeGreaterThanOrEqual(0.88);
    expect(adultResults.accuracy).toBeGreaterThanOrEqual(0.88);
    expect(geriatricResults.accuracy).toBeGreaterThanOrEqual(0.88);

    // Variance between groups should be < 5%
    const accuracies = [
      pediatricResults.accuracy,
      adultResults.accuracy,
      geriatricResults.accuracy,
    ];
    const maxAccuracy = Math.max(...accuracies);
    const minAccuracy = Math.min(...accuracies);
    const variance = maxAccuracy - minAccuracy;

    expect(variance).toBeLessThan(0.05);
  }, 600000);

  test('should correctly identify high-urgency cases', async () => {
    const highUrgencyCases = testDataset.filter(
      c => c.groundTruthCategory === 'EMERGENCY'
    );

    const results = await validateTriageModel(highUrgencyCases);

    console.log('\n=== High-Urgency Case Performance ===');
    console.log(`Recall: ${(results.recallByCategory['EMERGENCY'] * 100).toFixed(2)}%`);

    // High recall is critical for emergency cases (minimize false negatives)
    expect(results.recallByCategory['EMERGENCY']).toBeGreaterThanOrEqual(0.95);
  }, 300000);

  test('should provide confidence scores', async () => {
    const sampleCase = testDataset[0];

    const response = await axios.post(
      `${API_BASE_URL}/api/v1/triage/analyze`,
      {
        symptoms: sampleCase.symptoms,
        vitals: sampleCase.vitals,
        medicalHistory: sampleCase.medicalHistory,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    expect(response.data.confidence).toBeDefined();
    expect(response.data.confidence).toBeGreaterThan(0);
    expect(response.data.confidence).toBeLessThanOrEqual(1);
  });

  async function validateTriageModel(cases: TriageTestCase[]): Promise<ValidationResult> {
    let correctPredictions = 0;
    let totalUrgencyError = 0;
    
    const categoryPredictions: Record<string, { tp: number; fp: number; fn: number }> = {
      EMERGENCY: { tp: 0, fp: 0, fn: 0 },
      URGENT: { tp: 0, fp: 0, fn: 0 },
      ROUTINE: { tp: 0, fp: 0, fn: 0 },
    };

    for (const testCase of cases) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/triage/analyze`,
          {
            symptoms: testCase.symptoms,
            vitals: testCase.vitals,
            medicalHistory: testCase.medicalHistory,
          },
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        const predictedUrgency = response.data.urgencyScore;
        const predictedCategory = response.data.category;

        // Calculate urgency error
        const urgencyError = Math.abs(predictedUrgency - testCase.groundTruthUrgency);
        totalUrgencyError += urgencyError;

        // Check if prediction is correct (within 10 points for urgency)
        if (urgencyError <= 10 && predictedCategory === testCase.groundTruthCategory) {
          correctPredictions++;
        }

        // Update confusion matrix data
        if (predictedCategory === testCase.groundTruthCategory) {
          categoryPredictions[testCase.groundTruthCategory].tp++;
        } else {
          categoryPredictions[testCase.groundTruthCategory].fn++;
          categoryPredictions[predictedCategory].fp++;
        }

      } catch (error) {
        console.error(`Error validating case ${testCase.id}:`, error);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Calculate metrics
    const accuracy = correctPredictions / cases.length;
    const avgUrgencyError = totalUrgencyError / cases.length;

    const precisionByCategory: Record<string, number> = {};
    const recallByCategory: Record<string, number> = {};
    const f1ScoreByCategory: Record<string, number> = {};

    Object.keys(categoryPredictions).forEach(category => {
      const { tp, fp, fn } = categoryPredictions[category];
      
      const precision = tp / (tp + fp) || 0;
      const recall = tp / (tp + fn) || 0;
      const f1Score = (2 * precision * recall) / (precision + recall) || 0;

      precisionByCategory[category] = precision;
      recallByCategory[category] = recall;
      f1ScoreByCategory[category] = f1Score;
    });

    return {
      totalCases: cases.length,
      correctPredictions,
      accuracy,
      precisionByCategory,
      recallByCategory,
      f1ScoreByCategory,
      confusionMatrix: [], // Simplified for this example
      avgUrgencyError,
    };
  }
});

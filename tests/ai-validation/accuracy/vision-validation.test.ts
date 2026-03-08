/**
 * Diagnostic Vision Agent Accuracy Validation
 * Tests medical image analysis model
 * 
 * Requirements: 5.2 (89% accuracy target)
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface VisionTestCase {
  id: string;
  imageType: 'X-RAY' | 'CT' | 'MRI' | 'ECG';
  imageUrl: string;
  groundTruthFindings: string[];
  groundTruthDiagnosis: string;
  severity: 'NORMAL' | 'ABNORMAL' | 'CRITICAL';
}

interface VisionValidationResult {
  totalCases: number;
  correctDiagnoses: number;
  accuracy: number;
  sensitivity: number;
  specificity: number;
  diceScore: number;
  avgConfidence: number;
  performanceByModality: Record<string, number>;
}

describe('Diagnostic Vision Agent Validation', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
  const TEST_DATASET_PATH = path.join(__dirname, '../datasets/vision-test-dataset.json');
  
  let testDataset: VisionTestCase[];
  let authToken: string;

  beforeAll(async () => {
    const datasetContent = fs.readFileSync(TEST_DATASET_PATH, 'utf-8');
    testDataset = JSON.parse(datasetContent);

    const loginRes = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
      email: 'validator@medhaos.test',
      password: 'validator-password',
    });
    authToken = loginRes.data.token;
  });

  test('should achieve 89% accuracy on medical images', async () => {
    const results = await validateVisionModel(testDataset);

    console.log('\n=== Vision Model Validation Results ===');
    console.log(`Total Cases: ${results.totalCases}`);
    console.log(`Correct Diagnoses: ${results.correctDiagnoses}`);
    console.log(`Accuracy: ${(results.accuracy * 100).toFixed(2)}%`);
    console.log(`Sensitivity: ${(results.sensitivity * 100).toFixed(2)}%`);
    console.log(`Specificity: ${(results.specificity * 100).toFixed(2)}%`);
    console.log(`Dice Score: ${results.diceScore.toFixed(3)}`);
    console.log(`Avg Confidence: ${(results.avgConfidence * 100).toFixed(2)}%`);

    console.log('\nPerformance by Modality:');
    Object.keys(results.performanceByModality).forEach(modality => {
      console.log(`  ${modality}: ${(results.performanceByModality[modality] * 100).toFixed(2)}%`);
    });

    fs.writeFileSync(
      path.join(__dirname, '../results/vision-validation-results.json'),
      JSON.stringify(results, null, 2)
    );

    expect(results.accuracy).toBeGreaterThanOrEqual(0.89); // 89% requirement
  }, 900000); // 15 minute timeout

  test('should detect critical findings with high sensitivity', async () => {
    const criticalCases = testDataset.filter(c => c.severity === 'CRITICAL');
    const results = await validateVisionModel(criticalCases);

    console.log('\n=== Critical Finding Detection ===');
    console.log(`Sensitivity: ${(results.sensitivity * 100).toFixed(2)}%`);

    // High sensitivity is critical for detecting serious conditions
    expect(results.sensitivity).toBeGreaterThanOrEqual(0.95);
  }, 600000);

  test('should perform consistently across imaging modalities', async () => {
    const modalities = ['X-RAY', 'CT', 'MRI', 'ECG'];
    const modalityResults: Record<string, number> = {};

    for (const modality of modalities) {
      const modalityCases = testDataset.filter(c => c.imageType === modality);
      if (modalityCases.length > 0) {
        const results = await validateVisionModel(modalityCases);
        modalityResults[modality] = results.accuracy;
      }
    }

    console.log('\n=== Accuracy by Modality ===');
    Object.keys(modalityResults).forEach(modality => {
      console.log(`${modality}: ${(modalityResults[modality] * 100).toFixed(2)}%`);
    });

    // All modalities should meet minimum threshold
    Object.values(modalityResults).forEach(accuracy => {
      expect(accuracy).toBeGreaterThanOrEqual(0.85);
    });

    // Variance between modalities should be < 8%
    const accuracies = Object.values(modalityResults);
    const maxAccuracy = Math.max(...accuracies);
    const minAccuracy = Math.min(...accuracies);
    const variance = maxAccuracy - minAccuracy;

    expect(variance).toBeLessThan(0.08);
  }, 900000);

  test('should complete analysis within 8 seconds', async () => {
    const sampleCase = testDataset[0];

    const startTime = Date.now();
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/diagnostic-vision/analyze`,
      {
        imageType: sampleCase.imageType,
        imageUrl: sampleCase.imageUrl,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    const duration = Date.now() - startTime;

    console.log(`\nAnalysis Time: ${duration}ms`);

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(8000); // Requirement: < 8 seconds
  });

  test('should provide explainable results', async () => {
    const sampleCase = testDataset[0];

    const response = await axios.post(
      `${API_BASE_URL}/api/v1/diagnostic-vision/analyze`,
      {
        imageType: sampleCase.imageType,
        imageUrl: sampleCase.imageUrl,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    expect(response.data.findings).toBeDefined();
    expect(response.data.confidence).toBeDefined();
    expect(response.data.explanation).toBeDefined();
    expect(response.data.highlightedRegions).toBeDefined();
  });

  async function validateVisionModel(cases: VisionTestCase[]): Promise<VisionValidationResult> {
    let correctDiagnoses = 0;
    let truePositives = 0;
    let trueNegatives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let totalConfidence = 0;
    let totalDiceScore = 0;

    const performanceByModality: Record<string, { correct: number; total: number }> = {};

    for (const testCase of cases) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/diagnostic-vision/analyze`,
          {
            imageType: testCase.imageType,
            imageUrl: testCase.imageUrl,
          },
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        const predictedFindings = response.data.findings || [];
        const predictedDiagnosis = response.data.diagnosis;
        const confidence = response.data.confidence;

        totalConfidence += confidence;

        // Check if diagnosis matches
        const diagnosisMatch = predictedDiagnosis === testCase.groundTruthDiagnosis;
        if (diagnosisMatch) {
          correctDiagnoses++;
        }

        // Calculate sensitivity/specificity
        const isAbnormal = testCase.severity !== 'NORMAL';
        const predictedAbnormal = predictedFindings.length > 0;

        if (isAbnormal && predictedAbnormal) truePositives++;
        if (!isAbnormal && !predictedAbnormal) trueNegatives++;
        if (!isAbnormal && predictedAbnormal) falsePositives++;
        if (isAbnormal && !predictedAbnormal) falseNegatives++;

        // Calculate Dice score (overlap between predicted and ground truth findings)
        const diceScore = calculateDiceScore(predictedFindings, testCase.groundTruthFindings);
        totalDiceScore += diceScore;

        // Track performance by modality
        if (!performanceByModality[testCase.imageType]) {
          performanceByModality[testCase.imageType] = { correct: 0, total: 0 };
        }
        performanceByModality[testCase.imageType].total++;
        if (diagnosisMatch) {
          performanceByModality[testCase.imageType].correct++;
        }

      } catch (error) {
        console.error(`Error validating case ${testCase.id}:`, error);
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const accuracy = correctDiagnoses / cases.length;
    const sensitivity = truePositives / (truePositives + falseNegatives) || 0;
    const specificity = trueNegatives / (trueNegatives + falsePositives) || 0;
    const avgConfidence = totalConfidence / cases.length;
    const avgDiceScore = totalDiceScore / cases.length;

    const performanceByModalityPercent: Record<string, number> = {};
    Object.keys(performanceByModality).forEach(modality => {
      const { correct, total } = performanceByModality[modality];
      performanceByModalityPercent[modality] = correct / total;
    });

    return {
      totalCases: cases.length,
      correctDiagnoses,
      accuracy,
      sensitivity,
      specificity,
      diceScore: avgDiceScore,
      avgConfidence,
      performanceByModality: performanceByModalityPercent,
    };
  }

  function calculateDiceScore(predicted: string[], groundTruth: string[]): number {
    const predictedSet = new Set(predicted.map(f => f.toLowerCase()));
    const groundTruthSet = new Set(groundTruth.map(f => f.toLowerCase()));

    const intersection = new Set([...predictedSet].filter(x => groundTruthSet.has(x)));
    
    if (predictedSet.size === 0 && groundTruthSet.size === 0) return 1.0;
    if (predictedSet.size === 0 || groundTruthSet.size === 0) return 0.0;

    return (2 * intersection.size) / (predictedSet.size + groundTruthSet.size);
  }
});

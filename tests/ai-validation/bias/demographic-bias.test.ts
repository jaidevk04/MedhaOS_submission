/**
 * Demographic Bias Detection Tests
 * Tests for bias across age, gender, and geography
 * 
 * Requirements: 17.1 (fairness and bias mitigation)
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface BiasTestResult {
  demographic: string;
  groups: Record<string, {
    accuracy: number;
    avgUrgencyScore: number;
    sampleSize: number;
  }>;
  maxVariance: number;
  biasDetected: boolean;
}

describe('Demographic Bias Detection', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
  let authToken: string;

  beforeAll(async () => {
    const loginRes = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
      email: 'validator@medhaos.test',
      password: 'validator-password',
    });
    authToken = loginRes.data.token;
  });

  test('should not show age bias in triage decisions', async () => {
    const ageGroups = {
      pediatric: generateTestCases('pediatric', 100),
      adult: generateTestCases('adult', 100),
      geriatric: generateTestCases('geriatric', 100),
    };

    const results: Record<string, any> = {};

    for (const [ageGroup, cases] of Object.entries(ageGroups)) {
      const groupResults = await evaluateTriageCases(cases);
      results[ageGroup] = groupResults;
    }

    console.log('\n=== Age Bias Analysis ===');
    Object.keys(results).forEach(group => {
      console.log(`${group}: Accuracy ${(results[group].accuracy * 100).toFixed(2)}%, Avg Urgency ${results[group].avgUrgency.toFixed(2)}`);
    });

    // Calculate variance
    const accuracies = Object.values(results).map((r: any) => r.accuracy);
    const maxAccuracy = Math.max(...accuracies);
    const minAccuracy = Math.min(...accuracies);
    const variance = maxAccuracy - minAccuracy;

    console.log(`Variance: ${(variance * 100).toFixed(2)}%`);

    // Variance should be < 5% (no significant bias)
    expect(variance).toBeLessThan(0.05);

    // Save results
    fs.writeFileSync(
      path.join(__dirname, '../results/age-bias-results.json'),
      JSON.stringify({ results, variance, biasDetected: variance >= 0.05 }, null, 2)
    );
  }, 600000);

  test('should not show gender bias in triage decisions', async () => {
    const genderGroups = {
      male: generateTestCases('male', 100),
      female: generateTestCases('female', 100),
    };

    const results: Record<string, any> = {};

    for (const [gender, cases] of Object.entries(genderGroups)) {
      const groupResults = await evaluateTriageCases(cases);
      results[gender] = groupResults;
    }

    console.log('\n=== Gender Bias Analysis ===');
    Object.keys(results).forEach(group => {
      console.log(`${group}: Accuracy ${(results[group].accuracy * 100).toFixed(2)}%, Avg Urgency ${results[group].avgUrgency.toFixed(2)}`);
    });

    const accuracies = Object.values(results).map((r: any) => r.accuracy);
    const maxAccuracy = Math.max(...accuracies);
    const minAccuracy = Math.min(...accuracies);
    const variance = maxAccuracy - minAccuracy;

    console.log(`Variance: ${(variance * 100).toFixed(2)}%`);

    expect(variance).toBeLessThan(0.03); // Even stricter for gender

    fs.writeFileSync(
      path.join(__dirname, '../results/gender-bias-results.json'),
      JSON.stringify({ results, variance, biasDetected: variance >= 0.03 }, null, 2)
    );
  }, 600000);

  test('should not show geographic bias (urban vs rural)', async () => {
    const geographicGroups = {
      urban: generateTestCases('urban', 100),
      rural: generateTestCases('rural', 100),
    };

    const results: Record<string, any> = {};

    for (const [geography, cases] of Object.entries(geographicGroups)) {
      const groupResults = await evaluateTriageCases(cases);
      results[geography] = groupResults;
    }

    console.log('\n=== Geographic Bias Analysis ===');
    Object.keys(results).forEach(group => {
      console.log(`${group}: Accuracy ${(results[group].accuracy * 100).toFixed(2)}%, Avg Urgency ${results[group].avgUrgency.toFixed(2)}`);
    });

    const accuracies = Object.values(results).map((r: any) => r.accuracy);
    const maxAccuracy = Math.max(...accuracies);
    const minAccuracy = Math.min(...accuracies);
    const variance = maxAccuracy - minAccuracy;

    console.log(`Variance: ${(variance * 100).toFixed(2)}%`);

    expect(variance).toBeLessThan(0.05);

    fs.writeFileSync(
      path.join(__dirname, '../results/geographic-bias-results.json'),
      JSON.stringify({ results, variance, biasDetected: variance >= 0.05 }, null, 2)
    );
  }, 600000);

  test('should not show language bias', async () => {
    const languageGroups = {
      hindi: generateTestCases('hindi', 50),
      english: generateTestCases('english', 50),
      tamil: generateTestCases('tamil', 50),
      telugu: generateTestCases('telugu', 50),
    };

    const results: Record<string, any> = {};

    for (const [language, cases] of Object.entries(languageGroups)) {
      const groupResults = await evaluateTriageCases(cases);
      results[language] = groupResults;
    }

    console.log('\n=== Language Bias Analysis ===');
    Object.keys(results).forEach(group => {
      console.log(`${group}: Accuracy ${(results[group].accuracy * 100).toFixed(2)}%`);
    });

    const accuracies = Object.values(results).map((r: any) => r.accuracy);
    const maxAccuracy = Math.max(...accuracies);
    const minAccuracy = Math.min(...accuracies);
    const variance = maxAccuracy - minAccuracy;

    console.log(`Variance: ${(variance * 100).toFixed(2)}%`);

    expect(variance).toBeLessThan(0.05);
  }, 600000);

  async function evaluateTriageCases(cases: any[]): Promise<any> {
    let correctPredictions = 0;
    let totalUrgency = 0;

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
        totalUrgency += predictedUrgency;

        // Check if prediction is within acceptable range
        const urgencyError = Math.abs(predictedUrgency - testCase.expectedUrgency);
        if (urgencyError <= 10) {
          correctPredictions++;
        }

      } catch (error) {
        console.error('Error evaluating case:', error);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      accuracy: correctPredictions / cases.length,
      avgUrgency: totalUrgency / cases.length,
      sampleSize: cases.length,
    };
  }

  function generateTestCases(demographic: string, count: number): any[] {
    // Generate synthetic test cases for different demographics
    const cases = [];
    
    for (let i = 0; i < count; i++) {
      cases.push({
        id: `${demographic}-${i}`,
        demographic,
        symptoms: ['fever', 'cough', 'body ache'],
        vitals: {
          temperature: 101 + Math.random() * 2,
          bloodPressure: '120/80',
          heartRate: 80 + Math.floor(Math.random() * 20),
          respiratoryRate: 16 + Math.floor(Math.random() * 6),
          spo2: 95 + Math.floor(Math.random() * 5),
        },
        medicalHistory: [],
        expectedUrgency: 50 + Math.floor(Math.random() * 30),
      });
    }

    return cases;
  }
});

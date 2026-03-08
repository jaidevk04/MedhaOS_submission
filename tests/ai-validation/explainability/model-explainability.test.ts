/**
 * Model Explainability Tests
 * Validates that AI models provide explainable predictions
 * 
 * Requirements: 17.1 (transparency and explainability)
 */

import axios from 'axios';

describe('Model Explainability', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
  let authToken: string;

  beforeAll(async () => {
    const loginRes = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
      email: 'validator@medhaos.test',
      password: 'validator-password',
    });
    authToken = loginRes.data.token;
  });

  describe('Triage Agent Explainability', () => {
    test('should provide feature importance scores', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/triage/analyze`,
        {
          symptoms: ['chest pain', 'shortness of breath'],
          vitals: {
            temperature: 98.6,
            bloodPressure: '145/92',
            heartRate: 98,
          },
          medicalHistory: ['Previous MI'],
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.data.explanation).toBeDefined();
      expect(response.data.explanation.featureImportance).toBeDefined();
      
      const featureImportance = response.data.explanation.featureImportance;
      expect(Object.keys(featureImportance).length).toBeGreaterThan(0);

      // Feature importance scores should sum to ~1.0
      const totalImportance = Object.values(featureImportance).reduce((sum: number, val: any) => sum + val, 0);
      expect(totalImportance).toBeGreaterThan(0.95);
      expect(totalImportance).toBeLessThan(1.05);

      console.log('\n=== Feature Importance ===');
      Object.entries(featureImportance).forEach(([feature, importance]) => {
        console.log(`${feature}: ${(importance as number * 100).toFixed(2)}%`);
      });
    });

    test('should provide reasoning for urgency score', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/triage/analyze`,
        {
          symptoms: ['chest pain', 'radiating to left arm'],
          vitals: {
            bloodPressure: '145/92',
            heartRate: 98,
          },
          medicalHistory: ['Previous MI'],
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.data.explanation.reasoning).toBeDefined();
      expect(response.data.explanation.reasoning.length).toBeGreaterThan(0);

      const reasoning = response.data.explanation.reasoning;
      console.log('\n=== Urgency Reasoning ===');
      reasoning.forEach((reason: string, index: number) => {
        console.log(`${index + 1}. ${reason}`);
      });

      // Reasoning should mention key factors
      const reasoningText = reasoning.join(' ').toLowerCase();
      expect(reasoningText).toContain('chest pain');
      expect(reasoningText).toContain('previous mi');
    });

    test('should provide confidence score with explanation', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/triage/analyze`,
        {
          symptoms: ['fever', 'cough'],
          vitals: {
            temperature: 101.5,
            heartRate: 85,
          },
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.data.confidence).toBeDefined();
      expect(response.data.explanation.confidenceFactors).toBeDefined();

      console.log(`\nConfidence: ${(response.data.confidence * 100).toFixed(2)}%`);
      console.log('Confidence Factors:', response.data.explanation.confidenceFactors);
    });
  });

  describe('CDSS Agent Explainability', () => {
    test('should explain clinical recommendations', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/cdss/recommend`,
        {
          patientId: 'test-patient-001',
          clinicalFacts: {
            chiefComplaint: 'Chest pain',
            symptoms: ['pressure-like pain', 'radiating to left arm'],
            vitals: {
              bloodPressure: '145/92',
              heartRate: 98,
            },
            medicalHistory: ['Previous MI'],
          },
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.data.recommendations).toBeDefined();
      expect(response.data.recommendations.length).toBeGreaterThan(0);

      const firstRecommendation = response.data.recommendations[0];
      expect(firstRecommendation.explanation).toBeDefined();
      expect(firstRecommendation.evidenceLevel).toBeDefined();
      expect(firstRecommendation.guidelines).toBeDefined();

      console.log('\n=== CDSS Recommendation Explanation ===');
      console.log(`Recommendation: ${firstRecommendation.action}`);
      console.log(`Explanation: ${firstRecommendation.explanation}`);
      console.log(`Evidence Level: ${firstRecommendation.evidenceLevel}`);
      console.log(`Guidelines: ${firstRecommendation.guidelines.join(', ')}`);
    });

    test('should provide alternative recommendations', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/cdss/recommend`,
        {
          patientId: 'test-patient-001',
          clinicalFacts: {
            chiefComplaint: 'Diabetes management',
          },
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.data.recommendations).toBeDefined();
      expect(response.data.alternatives).toBeDefined();
      expect(response.data.alternatives.length).toBeGreaterThan(0);

      console.log('\n=== Alternative Recommendations ===');
      response.data.alternatives.forEach((alt: any, index: number) => {
        console.log(`${index + 1}. ${alt.action} (Confidence: ${(alt.confidence * 100).toFixed(2)}%)`);
        console.log(`   Rationale: ${alt.rationale}`);
      });
    });
  });

  describe('Diagnostic Vision Agent Explainability', () => {
    test('should highlight regions of interest in images', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/diagnostic-vision/analyze`,
        {
          imageType: 'X-RAY',
          imageUrl: 'https://test-storage.s3.amazonaws.com/test-xray.jpg',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.data.highlightedRegions).toBeDefined();
      expect(response.data.highlightedRegions.length).toBeGreaterThan(0);

      const firstRegion = response.data.highlightedRegions[0];
      expect(firstRegion.coordinates).toBeDefined();
      expect(firstRegion.finding).toBeDefined();
      expect(firstRegion.confidence).toBeDefined();

      console.log('\n=== Highlighted Regions ===');
      response.data.highlightedRegions.forEach((region: any, index: number) => {
        console.log(`${index + 1}. ${region.finding} at ${JSON.stringify(region.coordinates)}`);
        console.log(`   Confidence: ${(region.confidence * 100).toFixed(2)}%`);
      });
    });

    test('should provide visual explanation overlay', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/diagnostic-vision/analyze`,
        {
          imageType: 'X-RAY',
          imageUrl: 'https://test-storage.s3.amazonaws.com/test-xray.jpg',
          includeExplanation: true,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.data.explanationOverlayUrl).toBeDefined();
      expect(response.data.heatmapUrl).toBeDefined();

      console.log('\n=== Visual Explanations ===');
      console.log(`Explanation Overlay: ${response.data.explanationOverlayUrl}`);
      console.log(`Attention Heatmap: ${response.data.heatmapUrl}`);
    });
  });

  describe('Disease Prediction Agent Explainability', () => {
    test('should explain outbreak predictions', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/public-health/predict-outbreak`,
        {
          district: 'Mumbai',
          state: 'Maharashtra',
          disease: 'Dengue',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.data.prediction).toBeDefined();
      expect(response.data.explanation).toBeDefined();
      expect(response.data.explanation.contributingFactors).toBeDefined();

      console.log('\n=== Outbreak Prediction Explanation ===');
      console.log(`Probability: ${(response.data.prediction.probability * 100).toFixed(2)}%`);
      console.log('Contributing Factors:');
      response.data.explanation.contributingFactors.forEach((factor: any) => {
        console.log(`  - ${factor.name}: ${factor.impact} (${factor.value})`);
      });
    });
  });

  describe('Explainability Quality Metrics', () => {
    test('should provide human-readable explanations', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/triage/analyze`,
        {
          symptoms: ['chest pain'],
          vitals: { heartRate: 98 },
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      const reasoning = response.data.explanation.reasoning;
      
      // Explanations should be in complete sentences
      reasoning.forEach((reason: string) => {
        expect(reason.length).toBeGreaterThan(10);
        expect(reason).toMatch(/[.!?]$/); // Ends with punctuation
      });

      // Should not contain technical jargon without explanation
      const technicalTerms = ['tensor', 'logit', 'softmax', 'embedding'];
      const reasoningText = reasoning.join(' ').toLowerCase();
      
      technicalTerms.forEach(term => {
        expect(reasoningText).not.toContain(term);
      });
    });

    test('should provide actionable insights', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/cdss/recommend`,
        {
          patientId: 'test-patient-001',
          clinicalFacts: {
            chiefComplaint: 'Chest pain',
          },
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      const recommendations = response.data.recommendations;
      
      recommendations.forEach((rec: any) => {
        // Each recommendation should have clear action
        expect(rec.action).toBeDefined();
        expect(rec.action.length).toBeGreaterThan(5);
        
        // Should include rationale
        expect(rec.explanation).toBeDefined();
        
        // Should be actionable (contains verbs)
        const actionVerbs = ['order', 'administer', 'monitor', 'assess', 'consult', 'prescribe'];
        const hasActionVerb = actionVerbs.some(verb => rec.action.toLowerCase().includes(verb));
        expect(hasActionVerb).toBe(true);
      });
    });
  });
});

/**
 * Tests for Specialty Routing Service
 */

import { SpecialtyRoutingService } from '../specialty-routing.service';
import { TriageSession } from '../../types';

describe('SpecialtyRoutingService', () => {
  let service: SpecialtyRoutingService;

  beforeEach(() => {
    service = new SpecialtyRoutingService();
  });

  describe('classifySpecialty', () => {
    it('should classify cardiology for chest pain symptoms', () => {
      const session: TriageSession = {
        sessionId: 'test-session-1',
        patientId: 'patient-1',
        status: 'completed',
        currentQuestionIndex: 5,
        responses: [
          {
            questionId: 'q1',
            question: 'What is your main symptom?',
            answer: 'chest pain',
            answeredAt: new Date()
          }
        ],
        symptoms: ['chest pain', 'shortness of breath'],
        urgencyScore: 85,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const classification = service.classifySpecialty(session);

      expect(classification.primarySpecialty).toBe('Cardiology');
      expect(classification.confidence).toBeGreaterThan(0.6);
      expect(classification.reasoning.length).toBeGreaterThan(0);
    });

    it('should classify neurology for headache symptoms', () => {
      const session: TriageSession = {
        sessionId: 'test-session-2',
        patientId: 'patient-2',
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
        symptoms: ['headache', 'dizziness'],
        urgencyScore: 60,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const classification = service.classifySpecialty(session);

      expect(classification.primarySpecialty).toBe('Neurology');
      expect(classification.confidence).toBeGreaterThan(0.5);
    });

    it('should classify pediatrics for child patients', () => {
      const session: TriageSession = {
        sessionId: 'test-session-3',
        patientId: 'patient-3',
        status: 'completed',
        currentQuestionIndex: 5,
        responses: [
          {
            questionId: 'q16_age',
            question: 'What is your age?',
            answer: '5',
            answeredAt: new Date()
          },
          {
            questionId: 'q1',
            question: 'What is your main symptom?',
            answer: 'fever',
            answeredAt: new Date()
          }
        ],
        symptoms: ['fever', 'cough'],
        urgencyScore: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const classification = service.classifySpecialty(session);

      expect(classification.primarySpecialty).toBe('Pediatrics');
    });

    it('should default to General Medicine for unclear symptoms', () => {
      const session: TriageSession = {
        sessionId: 'test-session-4',
        patientId: 'patient-4',
        status: 'completed',
        currentQuestionIndex: 3,
        responses: [
          {
            questionId: 'q1',
            question: 'What is your main symptom?',
            answer: 'feeling unwell',
            answeredAt: new Date()
          }
        ],
        symptoms: ['fatigue'],
        urgencyScore: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const classification = service.classifySpecialty(session);

      expect(classification.primarySpecialty).toBe('General Medicine');
    });

    it('should provide alternative specialties when applicable', () => {
      const session: TriageSession = {
        sessionId: 'test-session-5',
        patientId: 'patient-5',
        status: 'completed',
        currentQuestionIndex: 5,
        responses: [],
        symptoms: ['chest pain', 'cough', 'breathing difficulty'],
        urgencyScore: 75,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const classification = service.classifySpecialty(session);

      expect(classification.alternativeSpecialties.length).toBeGreaterThan(0);
      expect(
        classification.alternativeSpecialties.includes('Pulmonology') ||
        classification.alternativeSpecialties.includes('Cardiology')
      ).toBe(true);
    });
  });

  describe('matchFacilities', () => {
    it('should return facility matches sorted by score', async () => {
      const classification = {
        primarySpecialty: 'Cardiology',
        alternativeSpecialties: ['Emergency Medicine'],
        confidence: 0.9,
        reasoning: ['Chest pain symptoms detected']
      };

      const patientLocation = {
        latitude: 28.6139,
        longitude: 77.2090
      };

      const matches = await service.matchFacilities(
        classification,
        patientLocation,
        'urgent'
      );

      expect(matches.length).toBeGreaterThan(0);
      expect(matches.length).toBeLessThanOrEqual(5);
      
      // Verify sorted by match score
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i - 1].matchScore).toBeGreaterThanOrEqual(matches[i].matchScore);
      }
    });

    it('should include distance and travel time estimates', async () => {
      const classification = {
        primarySpecialty: 'General Medicine',
        alternativeSpecialties: [],
        confidence: 0.8,
        reasoning: []
      };

      const patientLocation = {
        latitude: 28.6139,
        longitude: 77.2090
      };

      const matches = await service.matchFacilities(
        classification,
        patientLocation,
        'non_urgent'
      );

      expect(matches[0].distance).toBeGreaterThan(0);
      expect(matches[0].estimatedTravelTime).toBeGreaterThan(0);
    });

    it('should indicate specialty availability', async () => {
      const classification = {
        primarySpecialty: 'Cardiology',
        alternativeSpecialties: [],
        confidence: 0.9,
        reasoning: []
      };

      const patientLocation = {
        latitude: 28.6139,
        longitude: 77.2090
      };

      const matches = await service.matchFacilities(
        classification,
        patientLocation,
        'urgent'
      );

      expect(matches[0]).toHaveProperty('hasSpecialty');
      expect(typeof matches[0].hasSpecialty).toBe('boolean');
    });
  });

  describe('getRoutingRecommendation', () => {
    it('should return complete routing recommendation', async () => {
      const session: TriageSession = {
        sessionId: 'test-session-6',
        patientId: 'patient-6',
        status: 'completed',
        currentQuestionIndex: 5,
        responses: [],
        symptoms: ['chest pain', 'heart palpitations'],
        urgencyScore: 85,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const patientLocation = {
        latitude: 28.6139,
        longitude: 77.2090
      };

      const recommendation = await service.getRoutingRecommendation(
        session,
        patientLocation,
        'urgent'
      );

      expect(recommendation).toHaveProperty('classification');
      expect(recommendation).toHaveProperty('recommendedFacilities');
      expect(recommendation).toHaveProperty('urgencyLevel');
      expect(recommendation.urgencyLevel).toBe('urgent');
      expect(recommendation.classification.primarySpecialty).toBe('Cardiology');
      expect(recommendation.recommendedFacilities.length).toBeGreaterThan(0);
    });
  });
});

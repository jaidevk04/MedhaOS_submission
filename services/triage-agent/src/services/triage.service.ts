import { v4 as uuidv4 } from 'uuid';
import {
  TriageSession,
  TriageResponse,
  StartTriageRequest,
  StartTriageResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  SubmitVitalsRequest,
  GetTriageResultResponse,
  VitalsData,
} from '../types';
import { QuestionnaireService } from './questionnaire.service';
import { SymptomCaptureService } from './symptom-capture.service';
import { VitalsIntegrationService } from './vitals-integration.service';
import { PatientHistoryService } from './patient-history.service';
import { UrgencyScoringService } from './urgency-scoring.service';
import { SpecialtyRoutingService, RoutingRecommendation } from './specialty-routing.service';

/**
 * Main Triage Service
 * Orchestrates the triage data collection process
 */
export class TriageService {
  private sessions: Map<string, TriageSession>;
  private questionnaireService: QuestionnaireService;
  private symptomCaptureService: SymptomCaptureService;
  private vitalsService: VitalsIntegrationService;
  private historyService: PatientHistoryService;
  private urgencyScoringService: UrgencyScoringService;
  private specialtyRoutingService: SpecialtyRoutingService;

  constructor() {
    this.sessions = new Map();
    this.questionnaireService = new QuestionnaireService();
    this.symptomCaptureService = new SymptomCaptureService();
    this.vitalsService = new VitalsIntegrationService();
    this.historyService = new PatientHistoryService();
    this.urgencyScoringService = new UrgencyScoringService();
    this.specialtyRoutingService = new SpecialtyRoutingService();
  }

  /**
   * Start a new triage session
   */
  async startTriage(request: StartTriageRequest): Promise<StartTriageResponse> {
    const sessionId = uuidv4();
    
    // Create new session
    const session: TriageSession = {
      sessionId,
      patientId: request.patientId,
      status: 'in_progress',
      currentQuestionIndex: 0,
      responses: [],
      symptoms: request.initialSymptoms || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    // Get first question
    const firstQuestion = this.questionnaireService.getFirstQuestion();

    // Retrieve patient history
    const patientHistory = await this.historyService.getPatientHistory(request.patientId);

    return {
      sessionId,
      firstQuestion,
      patientHistory: patientHistory || undefined,
    };
  }

  /**
   * Submit an answer to a question
   */
  async submitAnswer(request: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    const session = this.sessions.get(request.sessionId);
    if (!session) {
      throw new Error('Triage session not found');
    }

    // Validate answer
    const isValid = this.questionnaireService.validateAnswer(request.questionId, request.answer);
    if (!isValid) {
      throw new Error('Invalid answer for question');
    }

    // Store response
    const response: TriageResponse = {
      questionId: request.questionId,
      question: this.questionnaireService.getQuestion(request.questionId)?.text || '',
      answer: request.answer,
      answeredAt: new Date(),
    };

    session.responses.push(response);
    session.currentQuestionIndex++;
    session.updatedAt = new Date();

    // Build response map for next question logic
    const responseMap = new Map(
      session.responses.map(r => [r.questionId, r.answer])
    );

    // Get next question
    const nextQuestion = this.questionnaireService.getNextQuestion(
      request.questionId,
      request.answer,
      responseMap
    );

    if (nextQuestion) {
      // More questions to ask
      return {
        nextQuestion,
        completed: false,
      };
    } else {
      // Triage complete - generate recommendation using ML model
      session.status = 'completed';
      
      // Extract symptoms from responses
      const symptoms = this.symptomCaptureService.extractSymptoms(session.responses);
      session.symptoms = symptoms.map(s => s.name);

      // Use ML model to calculate urgency score
      const mlRecommendation = await this.urgencyScoringService.calculateUrgencyScore(session);
      
      // Convert ML recommendation to legacy format
      const recommendation = {
        urgencyLevel: mlRecommendation.urgencyLevel,
        urgencyScore: mlRecommendation.urgencyScore,
        recommendedAction: mlRecommendation.recommendedAction,
        specialty: mlRecommendation.specialty,
        estimatedWaitTime: this.estimateWaitTime(mlRecommendation.urgencyLevel),
        reasoning: mlRecommendation.reasoning,
        possibleConditions: this.identifyPossibleConditions(symptoms, session.responses),
        redFlags: symptoms.filter(s => s.isRedFlag).map(s => s.name),
        confidence: mlRecommendation.confidence,
        modelVersion: mlRecommendation.modelVersion,
      };
      
      session.recommendation = recommendation;

      return {
        completed: true,
        recommendation,
      };
    }
  }

  /**
   * Submit vitals data for a triage session
   */
  async submitVitals(request: SubmitVitalsRequest): Promise<void> {
    const session = this.sessions.get(request.sessionId);
    if (!session) {
      throw new Error('Triage session not found');
    }

    // Validate vitals
    const validation = this.vitalsService.validateVitals(request.vitals);
    if (!validation.valid) {
      throw new Error(`Invalid vitals data: ${validation.errors.join(', ')}`);
    }

    // Calculate BMI if possible
    const vitalsWithBMI = this.vitalsService.calculateBMI(request.vitals);

    // Store vitals
    session.vitals = vitalsWithBMI;
    session.updatedAt = new Date();

    // Update recommendation if session is completed
    if (session.status === 'completed') {
      const mlRecommendation = await this.urgencyScoringService.calculateUrgencyScore(session);
      const symptoms = this.symptomCaptureService.extractSymptoms(session.responses);
      
      session.recommendation = {
        urgencyLevel: mlRecommendation.urgencyLevel,
        urgencyScore: mlRecommendation.urgencyScore,
        recommendedAction: mlRecommendation.recommendedAction,
        specialty: mlRecommendation.specialty,
        estimatedWaitTime: this.estimateWaitTime(mlRecommendation.urgencyLevel),
        reasoning: mlRecommendation.reasoning,
        possibleConditions: this.identifyPossibleConditions(symptoms, session.responses),
        redFlags: symptoms.filter(s => s.isRedFlag).map(s => s.name),
        confidence: mlRecommendation.confidence,
        modelVersion: mlRecommendation.modelVersion,
      };
    }
  }

  /**
   * Get triage result
   */
  async getTriageResult(sessionId: string): Promise<GetTriageResultResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Triage session not found');
    }

    if (session.status !== 'completed') {
      throw new Error('Triage session not completed');
    }

    // Extract structured symptoms
    const symptoms = this.symptomCaptureService.extractSymptoms(session.responses);

    // Get patient history
    const patientHistory = await this.historyService.getPatientHistory(session.patientId);

    // Generate final recommendation
    const recommendation = session.recommendation || this.generatePreliminaryRecommendation(session);

    return {
      sessionId: session.sessionId,
      urgencyScore: recommendation.urgencyScore,
      recommendation,
      symptoms,
      vitals: session.vitals,
      patientHistory: patientHistory || undefined,
    };
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): TriageSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get specialty routing recommendation
   */
  async getRoutingRecommendation(
    sessionId: string,
    patientLocation: { latitude: number; longitude: number }
  ): Promise<RoutingRecommendation> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Triage session not found');
    }

    if (session.status !== 'completed') {
      throw new Error('Triage session not completed');
    }

    const urgencyLevel = session.recommendation?.urgencyLevel || 'non_urgent';
    
    return await this.specialtyRoutingService.getRoutingRecommendation(
      session,
      patientLocation,
      urgencyLevel
    );
  }

  /**
   * Generate preliminary recommendation based on collected data
   * This is a rule-based approach that will be enhanced by ML model in task 6.2
   */
  private generatePreliminaryRecommendation(session: TriageSession): any {
    let urgencyScore = 0;
    const reasoning: string[] = [];
    const possibleConditions: string[] = [];
    const redFlags: string[] = [];

    // Extract symptoms
    const symptoms = this.symptomCaptureService.extractSymptoms(session.responses);
    
    // Identify red flags
    const symptomRedFlags = this.symptomCaptureService.identifyRedFlags(symptoms);
    redFlags.push(...symptomRedFlags);

    // Calculate symptom severity score
    const symptomSeverityScore = this.calculateSymptomSeverity(session.responses);
    urgencyScore += symptomSeverityScore * 0.4; // 40% weight

    // Calculate vitals severity score
    if (session.vitals) {
      const vitalsSeverityScore = this.vitalsService.assessVitalsSeverity(session.vitals);
      urgencyScore += vitalsSeverityScore * 0.3; // 30% weight

      // Check for critical vitals
      const criticalVitals = this.vitalsService.identifyCriticalVitals(session.vitals);
      redFlags.push(...criticalVitals);

      if (criticalVitals.length > 0) {
        reasoning.push('Critical vital signs detected');
      }
    }

    // Calculate duration/onset score
    const onsetScore = this.calculateOnsetScore(session.responses);
    urgencyScore += onsetScore * 0.15; // 15% weight

    // Calculate risk factors score (age, chronic conditions)
    const riskScore = this.calculateRiskScore(session.responses);
    urgencyScore += riskScore * 0.15; // 15% weight

    // Red flags automatically elevate to high urgency
    if (redFlags.length > 0) {
      urgencyScore = Math.max(urgencyScore, 75);
      reasoning.push(`${redFlags.length} red flag(s) identified`);
    }

    // Cap score at 100
    urgencyScore = Math.min(Math.round(urgencyScore), 100);

    // Determine urgency level and recommended action
    let urgencyLevel: 'critical' | 'urgent' | 'semi_urgent' | 'non_urgent';
    let recommendedAction: 'emergency_department' | 'urgent_care' | 'opd_appointment' | 'telemedicine' | 'self_care';
    let specialty: string | undefined;

    if (urgencyScore >= 80) {
      urgencyLevel = 'critical';
      recommendedAction = 'emergency_department';
      reasoning.push('Critical condition requiring immediate emergency care');
    } else if (urgencyScore >= 60) {
      urgencyLevel = 'urgent';
      recommendedAction = 'emergency_department';
      reasoning.push('Urgent condition requiring emergency evaluation');
    } else if (urgencyScore >= 40) {
      urgencyLevel = 'semi_urgent';
      recommendedAction = 'urgent_care';
      reasoning.push('Semi-urgent condition requiring same-day evaluation');
    } else {
      urgencyLevel = 'non_urgent';
      recommendedAction = 'opd_appointment';
      reasoning.push('Non-urgent condition suitable for scheduled appointment');
    }

    // Determine specialty based on symptoms
    specialty = this.determineSpecialty(symptoms);

    // Identify possible conditions
    possibleConditions.push(...this.identifyPossibleConditions(symptoms, session.responses));

    return {
      urgencyLevel,
      urgencyScore,
      recommendedAction,
      specialty,
      estimatedWaitTime: this.estimateWaitTime(urgencyLevel),
      reasoning,
      possibleConditions,
      redFlags,
    };
  }

  /**
   * Calculate symptom severity score (0-100)
   */
  private calculateSymptomSeverity(responses: TriageResponse[]): number {
    const responseMap = new Map(responses.map(r => [r.questionId, r]));
    let totalSeverity = 0;
    let count = 0;

    // Get severity from questions with severity ratings
    for (const response of responses) {
      const question = this.questionnaireService.getQuestion(response.questionId);
      if (question?.options) {
        const selectedOption = question.options.find(opt => opt.value === response.answer);
        if (selectedOption?.severity) {
          totalSeverity += selectedOption.severity * 10; // Convert to 0-100 scale
          count++;
        }
      }
    }

    return count > 0 ? totalSeverity / count : 50;
  }

  /**
   * Calculate onset/duration score (0-100)
   */
  private calculateOnsetScore(responses: TriageResponse[]): number {
    const onsetResponse = responses.find(r => r.questionId === 'q2_symptom_onset');
    if (!onsetResponse) return 50;

    const onsetScores: Record<string, number> = {
      'just_now': 90,
      '2_6_hours': 80,
      '6_24_hours': 70,
      '1_3_days': 50,
      '3_7_days': 40,
      'over_week': 30,
    };

    return onsetScores[onsetResponse.answer as string] || 50;
  }

  /**
   * Calculate risk factors score (0-100)
   */
  private calculateRiskScore(responses: TriageResponse[]): number {
    let riskScore = 0;

    // Age risk
    const ageResponse = responses.find(r => r.questionId === 'q16_age');
    if (ageResponse) {
      const age = parseInt(ageResponse.answer as string);
      if (age >= 65) riskScore += 40;
      else if (age >= 50) riskScore += 20;
      else if (age < 1) riskScore += 30;
    }

    // Chronic conditions
    const conditionsResponse = responses.find(r => r.questionId === 'q13_chronic_conditions');
    if (conditionsResponse) {
      const conditions = Array.isArray(conditionsResponse.answer) 
        ? conditionsResponse.answer 
        : [conditionsResponse.answer];
      
      if (conditions.includes('none')) {
        riskScore += 0;
      } else {
        riskScore += Math.min(conditions.length * 15, 60);
      }
    }

    return Math.min(riskScore, 100);
  }

  /**
   * Determine medical specialty based on symptoms
   */
  private determineSpecialty(symptoms: any[]): string {
    const symptomNames = symptoms.map(s => s.name.toLowerCase()).join(' ');

    if (symptomNames.includes('chest') || symptomNames.includes('heart')) {
      return 'Cardiology';
    }
    if (symptomNames.includes('breath') || symptomNames.includes('cough')) {
      return 'Pulmonology';
    }
    if (symptomNames.includes('headache') || symptomNames.includes('consciousness')) {
      return 'Neurology';
    }
    if (symptomNames.includes('abdominal') || symptomNames.includes('stomach')) {
      return 'Gastroenterology';
    }

    return 'General Medicine';
  }

  /**
   * Identify possible conditions based on symptom patterns
   */
  private identifyPossibleConditions(symptoms: any[], responses: TriageResponse[]): string[] {
    const conditions: string[] = [];
    const symptomNames = symptoms.map(s => s.name.toLowerCase()).join(' ');

    // Cardiac conditions
    if (symptomNames.includes('chest pain')) {
      const responseMap = new Map(responses.map(r => [r.questionId, r]));
      const character = responseMap.get('q4_chest_pain_character');
      const radiation = responseMap.get('q5_chest_pain_radiation');
      const associated = responseMap.get('q6_chest_pain_associated');

      if (character?.answer === 'pressure' || 
          (Array.isArray(radiation?.answer) && radiation.answer.includes('left_arm'))) {
        conditions.push('Acute Coronary Syndrome (ACS)');
        conditions.push('Myocardial Infarction (MI)');
      } else {
        conditions.push('Angina');
        conditions.push('Musculoskeletal chest pain');
      }
    }

    // Respiratory conditions
    if (symptomNames.includes('cough') || symptomNames.includes('breath')) {
      conditions.push('Respiratory infection');
      conditions.push('Pneumonia');
      conditions.push('Asthma exacerbation');
    }

    // Neurological conditions
    if (symptomNames.includes('headache')) {
      conditions.push('Migraine');
      conditions.push('Tension headache');
      if (symptoms.some(s => s.character?.includes('worst_ever'))) {
        conditions.push('Subarachnoid hemorrhage');
      }
    }

    return conditions;
  }

  /**
   * Estimate wait time based on urgency level
   */
  private estimateWaitTime(urgencyLevel: string): number {
    const waitTimes: Record<string, number> = {
      'critical': 0,
      'urgent': 5,
      'semi_urgent': 30,
      'non_urgent': 60,
    };
    return waitTimes[urgencyLevel] || 30;
  }
}

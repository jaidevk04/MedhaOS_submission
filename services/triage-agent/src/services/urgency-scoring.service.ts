/**
 * Urgency Scoring Service
 * Integrates ML model with triage workflow
 */

import { UrgencyModel, ModelFeatures } from '../ml/urgency-model';
import { TriageSession, VitalsData } from '../types';

export interface UrgencyScoreResult {
  urgencyScore: number;
  urgencyLevel: 'critical' | 'urgent' | 'semi_urgent' | 'non_urgent';
  confidence: number;
  recommendedAction: 'emergency_department' | 'urgent_care' | 'opd_appointment' | 'telemedicine' | 'self_care';
  specialty?: string;
  reasoning: string[];
  featureImportance: Record<string, number>;
  modelVersion: string;
}

export class UrgencyScoringService {
  private model: UrgencyModel;
  private modelVersion: string = '1.0.0';
  
  constructor() {
    this.model = new UrgencyModel();
    this.initializeModel();
  }
  
  /**
   * Initialize and load the trained model
   */
  private async initializeModel(): Promise<void> {
    try {
      // In production, load from AWS SageMaker endpoint
      await this.model.loadModel('urgency-model-v1');
      console.log('Urgency scoring model loaded successfully');
    } catch (error) {
      console.warn('Failed to load model, using rule-based fallback:', error);
    }
  }
  
  /**
   * Calculate urgency score for a triage session
   */
  async calculateUrgencyScore(session: TriageSession): Promise<UrgencyScoreResult> {
    // Extract features from session
    const features = this.extractFeaturesFromSession(session);
    
    // Get prediction from model
    const prediction = this.model.predict(features);
    
    // Determine urgency level
    const urgencyLevel = this.determineUrgencyLevel(prediction.urgencyScore);
    
    // Determine recommended action
    const recommendedAction = this.determineRecommendedAction(
      prediction.urgencyScore,
      features
    );
    
    // Determine specialty
    const specialty = this.determineSpecialty(session);
    
    // Generate reasoning
    const reasoning = this.generateReasoning(features, prediction);
    
    return {
      urgencyScore: prediction.urgencyScore,
      urgencyLevel,
      confidence: prediction.confidence,
      recommendedAction,
      specialty,
      reasoning,
      featureImportance: prediction.featureImportance,
      modelVersion: this.modelVersion,
    };
  }

  /**
   * Extract model features from triage session
   */
  private extractFeaturesFromSession(session: TriageSession): ModelFeatures {
    // Extract age from responses
    const ageResponse = session.responses.find(r => r.questionId === 'q16_age');
    const age = ageResponse ? parseInt(ageResponse.answer as string) : 40;
    
    // Extract symptom severity
    const severityResponse = session.responses.find(r => r.questionId === 'q3_symptom_severity');
    const symptomSeverity = severityResponse ? parseInt(severityResponse.answer as string) : 5;
    
    // Extract chronic conditions
    const conditionsResponse = session.responses.find(r => r.questionId === 'q13_chronic_conditions');
    const conditions = conditionsResponse 
      ? (Array.isArray(conditionsResponse.answer) ? conditionsResponse.answer : [conditionsResponse.answer])
      : [];
    const chronicConditionsCount = conditions.includes('none') ? 0 : conditions.length;
    
    // Extract red flags
    const hasRedFlags = session.symptoms.some(s => 
      ['chest_pain', 'shortness_of_breath', 'severe_headache', 'altered_consciousness'].includes(s)
    );
    const redFlagCount = hasRedFlags ? session.symptoms.filter(s => 
      ['chest_pain', 'shortness_of_breath', 'severe_headache', 'altered_consciousness'].includes(s)
    ).length : 0;
    
    // Extract symptom onset
    const onsetResponse = session.responses.find(r => r.questionId === 'q2_symptom_onset');
    const symptomOnsetHours = this.convertOnsetToHours(onsetResponse?.answer as string || '6_24_hours');
    
    // Extract vitals (with defaults if not provided)
    const vitals = session.vitals || this.getDefaultVitals();
    
    // Handle blood pressure - it can be either object or string format
    let bloodPressureSystolic = 120;
    let bloodPressureDiastolic = 80;
    
    if (vitals.bloodPressure) {
      if (typeof vitals.bloodPressure === 'object' && 'systolic' in vitals.bloodPressure) {
        bloodPressureSystolic = vitals.bloodPressure.systolic;
        bloodPressureDiastolic = vitals.bloodPressure.diastolic;
      }
    }
    
    return {
      age,
      symptomSeverity,
      temperature: vitals.temperature || 98.6,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      heartRate: vitals.heartRate || 75,
      respiratoryRate: vitals.respiratoryRate || 16,
      oxygenSaturation: vitals.spo2 || 98,
      chronicConditionsCount,
      previousHospitalizations: 0, // Would come from patient history
      currentMedications: 0, // Would come from patient history
      hasRedFlags: hasRedFlags ? 1 : 0,
      redFlagCount,
      symptomOnsetHours,
    };
  }
  
  private convertOnsetToHours(onset: string): number {
    const mapping: Record<string, number> = {
      'just_now': 0.5,
      '2_6_hours': 4,
      '6_24_hours': 12,
      '1_3_days': 48,
      '3_7_days': 120,
      'over_week': 240,
    };
    return mapping[onset] || 24;
  }
  
  private getDefaultVitals(): VitalsData {
    return {
      temperature: 98.6,
      bloodPressure: {
        systolic: 120,
        diastolic: 80
      },
      heartRate: 75,
      respiratoryRate: 16,
      spo2: 98,
    };
  }

  private determineUrgencyLevel(score: number): 'critical' | 'urgent' | 'semi_urgent' | 'non_urgent' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'urgent';
    if (score >= 40) return 'semi_urgent';
    return 'non_urgent';
  }
  
  private determineRecommendedAction(
    score: number,
    features: ModelFeatures
  ): 'emergency_department' | 'urgent_care' | 'opd_appointment' | 'telemedicine' | 'self_care' {
    // Critical cases always go to ED
    if (score >= 80 || features.hasRedFlags) {
      return 'emergency_department';
    }
    
    // Urgent cases
    if (score >= 60) {
      return 'emergency_department';
    }
    
    // Semi-urgent cases
    if (score >= 40) {
      return 'urgent_care';
    }
    
    // Non-urgent cases
    if (score >= 25) {
      return 'opd_appointment';
    }
    
    // Very low urgency
    if (score >= 15) {
      return 'telemedicine';
    }
    
    return 'self_care';
  }
  
  private determineSpecialty(session: TriageSession): string {
    const symptoms = session.symptoms.join(' ').toLowerCase();
    
    // Use more comprehensive specialty mapping
    if (symptoms.includes('chest') || symptoms.includes('heart') || symptoms.includes('cardiac')) {
      return 'Cardiology';
    }
    if (symptoms.includes('breath') || symptoms.includes('cough') || symptoms.includes('lung') || symptoms.includes('respiratory')) {
      return 'Pulmonology';
    }
    if (symptoms.includes('head') || symptoms.includes('consciousness') || symptoms.includes('seizure') || symptoms.includes('stroke')) {
      return 'Neurology';
    }
    if (symptoms.includes('abdominal') || symptoms.includes('stomach') || symptoms.includes('nausea') || symptoms.includes('vomit')) {
      return 'Gastroenterology';
    }
    if (symptoms.includes('bone') || symptoms.includes('joint') || symptoms.includes('fracture') || symptoms.includes('trauma')) {
      return 'Orthopedics';
    }
    if (symptoms.includes('skin') || symptoms.includes('rash') || symptoms.includes('dermatitis')) {
      return 'Dermatology';
    }
    if (symptoms.includes('kidney') || symptoms.includes('renal') || symptoms.includes('urinary')) {
      return 'Nephrology';
    }
    if (symptoms.includes('eye') || symptoms.includes('vision') || symptoms.includes('sight')) {
      return 'Ophthalmology';
    }
    if (symptoms.includes('ear') || symptoms.includes('nose') || symptoms.includes('throat') || symptoms.includes('ent')) {
      return 'ENT';
    }
    if (symptoms.includes('diabetes') || symptoms.includes('thyroid') || symptoms.includes('hormone')) {
      return 'Endocrinology';
    }
    if (symptoms.includes('mental') || symptoms.includes('psychiatric') || symptoms.includes('depression') || symptoms.includes('anxiety')) {
      return 'Psychiatry';
    }
    if (symptoms.includes('pregnancy') || symptoms.includes('pregnant') || symptoms.includes('gynecological')) {
      return 'Obstetrics & Gynecology';
    }
    if (symptoms.includes('infection') || symptoms.includes('fever') || symptoms.includes('sepsis')) {
      return 'Infectious Disease';
    }
    
    // Check age for pediatrics
    const age = this.extractAge(session);
    if (age !== null && age < 18) {
      return 'Pediatrics';
    }
    
    return 'General Medicine';
  }

  private extractAge(session: TriageSession): number | null {
    const ageResponse = session.responses.find(r => r.questionId === 'q16_age');
    if (ageResponse && typeof ageResponse.answer === 'string') {
      const age = parseInt(ageResponse.answer);
      return isNaN(age) ? null : age;
    }
    return null;
  }

  private generateReasoning(features: ModelFeatures, prediction: any): string[] {
    const reasoning: string[] = [];
    
    // Symptom severity
    if (features.symptomSeverity >= 8) {
      reasoning.push('Severe symptom intensity reported');
    } else if (features.symptomSeverity >= 6) {
      reasoning.push('Moderate to severe symptom intensity');
    }
    
    // Red flags
    if (features.hasRedFlags) {
      reasoning.push(`${features.redFlagCount} critical red flag(s) identified`);
    }
    
    // Vitals
    if (features.oxygenSaturation < 90) {
      reasoning.push('Critical oxygen saturation level');
    } else if (features.oxygenSaturation < 94) {
      reasoning.push('Low oxygen saturation detected');
    }
    
    if (features.heartRate > 120 || features.heartRate < 50) {
      reasoning.push('Abnormal heart rate detected');
    }
    
    if (features.bloodPressureSystolic > 180 || features.bloodPressureSystolic < 90) {
      reasoning.push('Critical blood pressure reading');
    } else if (features.bloodPressureSystolic > 160 || features.bloodPressureSystolic < 100) {
      reasoning.push('Elevated blood pressure detected');
    }
    
    if (features.temperature > 103 || features.temperature < 95) {
      reasoning.push('Critical body temperature');
    } else if (features.temperature > 101) {
      reasoning.push('High fever detected');
    }
    
    // Age risk
    if (features.age < 1) {
      reasoning.push('Infant patient - higher risk category');
    } else if (features.age < 5) {
      reasoning.push('Pediatric patient - requires careful assessment');
    } else if (features.age > 75) {
      reasoning.push('Elderly patient - increased risk factors');
    } else if (features.age > 65) {
      reasoning.push('Senior patient - age-related considerations');
    }
    
    // Chronic conditions
    if (features.chronicConditionsCount >= 3) {
      reasoning.push('Multiple chronic conditions present');
    } else if (features.chronicConditionsCount >= 1) {
      reasoning.push('Chronic medical condition(s) present');
    }
    
    // Onset timing
    if (features.symptomOnsetHours < 2) {
      reasoning.push('Acute onset - symptoms started very recently');
    } else if (features.symptomOnsetHours < 6) {
      reasoning.push('Recent symptom onset');
    }
    
    // Model confidence
    if (prediction.confidence < 0.8) {
      reasoning.push('Limited data available - recommendation may require clinical review');
    }
    
    return reasoning;
  }
  
  /**
   * Get model performance metrics
   */
  getModelMetrics(): Record<string, number> {
    return this.model.getMetrics();
  }
  
  /**
   * Get model version
   */
  getModelVersion(): string {
    return this.modelVersion;
  }
}

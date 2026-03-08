import { PatientRepository } from '@medhaos/database';
import { PatientHistory, MedicalCondition, Allergy, Medication } from '../types';

/**
 * Patient History Service
 * Retrieves and processes patient medical history from database
 */
export class PatientHistoryService {
  private patientRepository: PatientRepository;

  constructor() {
    this.patientRepository = new PatientRepository();
  }

  /**
   * Retrieve complete patient history
   */
  async getPatientHistory(patientId: string): Promise<PatientHistory | null> {
    try {
      const patient = await this.patientRepository.findById(patientId);
      if (!patient) {
        return null;
      }

      // Transform database patient to PatientHistory format
      const history: PatientHistory = {
        patientId: patient.id,
        medicalHistory: this.parseMedicalHistory(patient.medicalHistory),
        surgicalHistory: [],
        allergies: this.parseAllergies(patient.allergies),
        currentMedications: this.parseCurrentMedications(patient.currentMedications),
        familyHistory: [],
        socialHistory: undefined,
      };

      return history;
    } catch (error) {
      console.error('Error retrieving patient history:', error);
      return null;
    }
  }

  /**
   * Parse medical history from database format
   */
  private parseMedicalHistory(medicalHistory: any): MedicalCondition[] {
    if (!medicalHistory || !Array.isArray(medicalHistory)) {
      return [];
    }

    return medicalHistory.map((condition: any) => ({
      condition: condition.condition || condition.name,
      diagnosedDate: condition.diagnosedDate ? new Date(condition.diagnosedDate) : new Date(),
      status: condition.status || 'active',
      notes: condition.notes,
    }));
  }

  /**
   * Parse allergies from database format
   */
  private parseAllergies(allergies: any): Allergy[] {
    if (!allergies || !Array.isArray(allergies)) {
      return [];
    }

    return allergies.map((allergy: any) => ({
      allergen: allergy.allergen || allergy.name,
      reaction: allergy.reaction || 'Unknown reaction',
      severity: this.mapAllergySeverity(allergy.severity),
    }));
  }

  /**
   * Parse current medications from database format
   */
  private parseCurrentMedications(medications: any): Medication[] {
    if (!medications || !Array.isArray(medications)) {
      return [];
    }

    return medications.map((med: any) => ({
      name: med.name || med.drugName,
      dosage: med.dosage,
      frequency: med.frequency,
      startDate: med.startDate ? new Date(med.startDate) : new Date(),
      endDate: med.endDate ? new Date(med.endDate) : undefined,
      prescribedBy: med.prescribedBy,
    }));
  }

  /**
   * Map allergy severity
   */
  private mapAllergySeverity(severity: any): 'mild' | 'moderate' | 'severe' | 'life_threatening' {
    if (typeof severity === 'string') {
      const lower = severity.toLowerCase();
      if (lower.includes('life') || lower.includes('anaphyl')) {
        return 'life_threatening';
      }
      if (lower.includes('severe')) {
        return 'severe';
      }
      if (lower.includes('moderate')) {
        return 'moderate';
      }
    }
    return 'mild';
  }

  /**
   * Calculate risk factors from patient history
   */
  calculateRiskFactors(history: PatientHistory, age: number): number {
    let riskScore = 0;

    // Age-based risk
    if (age >= 65) {
      riskScore += 20;
    } else if (age >= 50) {
      riskScore += 10;
    }

    // Chronic conditions risk
    const highRiskConditions = [
      'heart disease',
      'coronary artery disease',
      'myocardial infarction',
      'diabetes',
      'chronic kidney disease',
      'copd',
      'asthma',
      'cancer',
      'immunocompromised',
      'hiv',
      'transplant',
    ];

    for (const condition of history.medicalHistory) {
      if (condition.status === 'active' || condition.status === 'chronic') {
        const conditionLower = condition.condition.toLowerCase();
        if (highRiskConditions.some(risk => conditionLower.includes(risk))) {
          riskScore += 15;
        }
      }
    }

    // Life-threatening allergies
    const hasLifeThreateningAllergy = history.allergies.some(
      a => a.severity === 'life_threatening'
    );
    if (hasLifeThreateningAllergy) {
      riskScore += 10;
    }

    // Multiple medications (polypharmacy)
    if (history.currentMedications.length >= 5) {
      riskScore += 10;
    }

    // Cap at 100
    return Math.min(riskScore, 100);
  }

  /**
   * Identify relevant medical history for current symptoms
   */
  identifyRelevantHistory(
    history: PatientHistory,
    symptoms: string[]
  ): { conditions: string[]; medications: string[]; allergies: string[] } {
    const relevant = {
      conditions: [] as string[],
      medications: [] as string[],
      allergies: [] as string[],
    };

    const symptomKeywords = symptoms.map(s => s.toLowerCase());

    // Check for relevant chronic conditions
    for (const condition of history.medicalHistory) {
      const conditionLower = condition.condition.toLowerCase();
      
      // Cardiac symptoms
      if (symptomKeywords.some(s => s.includes('chest') || s.includes('heart'))) {
        if (conditionLower.includes('heart') || conditionLower.includes('cardiac') ||
            conditionLower.includes('hypertension') || conditionLower.includes('diabetes')) {
          relevant.conditions.push(condition.condition);
        }
      }

      // Respiratory symptoms
      if (symptomKeywords.some(s => s.includes('breath') || s.includes('cough'))) {
        if (conditionLower.includes('asthma') || conditionLower.includes('copd') ||
            conditionLower.includes('lung')) {
          relevant.conditions.push(condition.condition);
        }
      }

      // Neurological symptoms
      if (symptomKeywords.some(s => s.includes('headache') || s.includes('dizz'))) {
        if (conditionLower.includes('stroke') || conditionLower.includes('migraine') ||
            conditionLower.includes('seizure')) {
          relevant.conditions.push(condition.condition);
        }
      }
    }

    // Check for relevant medications
    for (const med of history.currentMedications) {
      const medLower = med.name.toLowerCase();
      
      // Cardiac medications
      if (symptomKeywords.some(s => s.includes('chest') || s.includes('heart'))) {
        if (medLower.includes('aspirin') || medLower.includes('statin') ||
            medLower.includes('beta') || medLower.includes('ace')) {
          relevant.medications.push(med.name);
        }
      }

      // Anticoagulants (bleeding risk)
      if (medLower.includes('warfarin') || medLower.includes('heparin') ||
          medLower.includes('xarelto') || medLower.includes('eliquis')) {
        relevant.medications.push(`${med.name} (anticoagulant - bleeding risk)`);
      }
    }

    // All severe allergies are relevant
    for (const allergy of history.allergies) {
      if (allergy.severity === 'severe' || allergy.severity === 'life_threatening') {
        relevant.allergies.push(`${allergy.allergen} (${allergy.severity})`);
      }
    }

    return relevant;
  }

  /**
   * Generate clinical summary of patient history
   */
  generateHistorySummary(history: PatientHistory): string {
    const parts: string[] = [];

    // Active chronic conditions
    const activeConditions = history.medicalHistory
      .filter(c => c.status === 'active' || c.status === 'chronic')
      .map(c => c.condition);
    
    if (activeConditions.length > 0) {
      parts.push(`PMH: ${activeConditions.join(', ')}`);
    }

    // Current medications
    if (history.currentMedications.length > 0) {
      const medNames = history.currentMedications.map(m => m.name).slice(0, 5);
      parts.push(`Medications: ${medNames.join(', ')}${history.currentMedications.length > 5 ? '...' : ''}`);
    }

    // Allergies
    if (history.allergies.length > 0) {
      const allergens = history.allergies.map(a => a.allergen);
      parts.push(`Allergies: ${allergens.join(', ')}`);
    }

    return parts.join(' | ');
  }

  /**
   * Check if patient has specific condition
   */
  hasCondition(history: PatientHistory, conditionName: string): boolean {
    const searchTerm = conditionName.toLowerCase();
    return history.medicalHistory.some(c => 
      c.condition.toLowerCase().includes(searchTerm) &&
      (c.status === 'active' || c.status === 'chronic')
    );
  }

  /**
   * Check if patient is on specific medication
   */
  isOnMedication(history: PatientHistory, medicationName: string): boolean {
    const searchTerm = medicationName.toLowerCase();
    return history.currentMedications.some(m => 
      m.name.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Check if patient has specific allergy
   */
  hasAllergy(history: PatientHistory, allergen: string): boolean {
    const searchTerm = allergen.toLowerCase();
    return history.allergies.some(a => 
      a.allergen.toLowerCase().includes(searchTerm)
    );
  }
}

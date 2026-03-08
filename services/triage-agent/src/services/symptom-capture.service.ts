import { Symptom, TriageResponse } from '../types';

/**
 * Symptom Capture Service
 * Processes and structures symptom data from triage responses
 */
export class SymptomCaptureService {
  /**
   * Extract structured symptoms from triage responses
   */
  extractSymptoms(responses: TriageResponse[]): Symptom[] {
    const symptoms: Symptom[] = [];
    const responseMap = new Map(responses.map(r => [r.questionId, r]));

    // Extract chief complaint
    const chiefComplaint = responseMap.get('q1_chief_complaint');
    if (chiefComplaint && typeof chiefComplaint.answer === 'string') {
      const mainSymptom = this.parseChiefComplaint(chiefComplaint.answer);
      if (mainSymptom) {
        symptoms.push(mainSymptom);
      }
    }

    // Extract severity
    const severity = responseMap.get('q3_symptom_severity');
    if (severity && symptoms.length > 0) {
      symptoms[0].severity = this.mapSeverity(severity.answer as string);
    }

    // Extract onset/duration
    const onset = responseMap.get('q2_symptom_onset');
    if (onset && symptoms.length > 0) {
      symptoms[0].onset = this.mapOnset(onset.answer as string);
      symptoms[0].duration = this.calculateDuration(onset.answer as string);
    }

    // Extract chest pain specific details
    const chestPainChar = responseMap.get('q4_chest_pain_character');
    if (chestPainChar && symptoms.length > 0) {
      symptoms[0].character = this.mapChestPainCharacter(chestPainChar.answer as string);
    }

    const chestPainRad = responseMap.get('q5_chest_pain_radiation');
    if (chestPainRad && symptoms.length > 0) {
      symptoms[0].radiation = Array.isArray(chestPainRad.answer)
        ? chestPainRad.answer.join(', ')
        : chestPainRad.answer;
    }

    // Extract associated symptoms
    const associated = responseMap.get('q6_chest_pain_associated');
    if (associated && symptoms.length > 0) {
      symptoms[0].associatedSymptoms = Array.isArray(associated.answer)
        ? associated.answer
        : [associated.answer];
    }

    // Extract respiratory symptoms
    const breathing = responseMap.get('q7_breathing_difficulty');
    if (breathing && breathing.answer !== 'none') {
      symptoms.push({
        name: 'Difficulty breathing',
        severity: this.mapBreathingSeverity(breathing.answer as string),
        duration: symptoms[0]?.duration || 'unknown',
        onset: symptoms[0]?.onset || 'unknown',
      });
    }

    const cough = responseMap.get('q8_cough');
    if (cough && cough.answer !== 'none') {
      symptoms.push({
        name: 'Cough',
        severity: this.mapCoughSeverity(cough.answer as string),
        duration: symptoms[0]?.duration || 'unknown',
        onset: symptoms[0]?.onset || 'unknown',
        character: cough.answer as string,
      });
    }

    // Extract fever
    const fever = responseMap.get('q9_fever');
    if (fever && fever.answer !== 'none') {
      symptoms.push({
        name: 'Fever',
        severity: this.mapFeverSeverity(fever.answer as string),
        duration: symptoms[0]?.duration || 'unknown',
        onset: symptoms[0]?.onset || 'unknown',
      });
    }

    // Extract neurological symptoms
    const consciousness = responseMap.get('q10_consciousness');
    if (consciousness && consciousness.answer !== 'alert') {
      symptoms.push({
        name: 'Altered consciousness',
        severity: 'severe',
        duration: symptoms[0]?.duration || 'unknown',
        onset: symptoms[0]?.onset || 'unknown',
        character: consciousness.answer as string,
      });
    }

    const headache = responseMap.get('q11_headache');
    if (headache && headache.answer !== 'none') {
      symptoms.push({
        name: 'Headache',
        severity: this.mapHeadacheSeverity(headache.answer as string),
        duration: symptoms[0]?.duration || 'unknown',
        onset: symptoms[0]?.onset || 'unknown',
      });
    }

    // Extract abdominal pain
    const abdominalPain = responseMap.get('q12_abdominal_pain');
    if (abdominalPain && abdominalPain.answer !== 'none') {
      symptoms.push({
        name: 'Abdominal pain',
        severity: this.mapAbdominalPainSeverity(abdominalPain.answer as string),
        duration: symptoms[0]?.duration || 'unknown',
        onset: symptoms[0]?.onset || 'unknown',
      });
    }

    return symptoms;
  }

  /**
   * Parse chief complaint into structured symptom
   */
  private parseChiefComplaint(complaint: string): Symptom | null {
    const lowerComplaint = complaint.toLowerCase();
    
    // Common symptom patterns
    const symptomPatterns = [
      { pattern: /chest pain|chest discomfort|heart pain/i, name: 'Chest pain', location: 'chest' },
      { pattern: /headache|head pain/i, name: 'Headache', location: 'head' },
      { pattern: /abdominal pain|stomach pain|belly pain/i, name: 'Abdominal pain', location: 'abdomen' },
      { pattern: /shortness of breath|difficulty breathing|breathless/i, name: 'Shortness of breath' },
      { pattern: /fever|high temperature/i, name: 'Fever' },
      { pattern: /cough/i, name: 'Cough' },
      { pattern: /nausea|vomiting/i, name: 'Nausea/Vomiting' },
      { pattern: /dizziness|lightheaded/i, name: 'Dizziness' },
    ];

    for (const { pattern, name, location } of symptomPatterns) {
      if (pattern.test(lowerComplaint)) {
        return {
          name,
          severity: 'moderate', // Default, will be updated
          duration: 'unknown',
          onset: 'unknown',
          location,
        };
      }
    }

    // Generic symptom if no pattern matches
    return {
      name: complaint,
      severity: 'moderate',
      duration: 'unknown',
      onset: 'unknown',
    };
  }

  /**
   * Map severity values
   */
  private mapSeverity(value: string): 'mild' | 'moderate' | 'severe' {
    switch (value) {
      case 'mild':
        return 'mild';
      case 'moderate':
        return 'moderate';
      case 'severe':
      case 'unbearable':
        return 'severe';
      default:
        return 'moderate';
    }
  }

  /**
   * Map onset values
   */
  private mapOnset(value: string): string {
    const onsetMap: Record<string, string> = {
      'just_now': 'Acute (< 1 hour)',
      '2_6_hours': 'Acute (2-6 hours)',
      '6_24_hours': 'Acute (6-24 hours)',
      '1_3_days': 'Subacute (1-3 days)',
      '3_7_days': 'Subacute (3-7 days)',
      'over_week': 'Chronic (> 1 week)',
    };
    return onsetMap[value] || value;
  }

  /**
   * Calculate duration from onset
   */
  private calculateDuration(onset: string): string {
    const durationMap: Record<string, string> = {
      'just_now': '< 1 hour',
      '2_6_hours': '2-6 hours',
      '6_24_hours': '6-24 hours',
      '1_3_days': '1-3 days',
      '3_7_days': '3-7 days',
      'over_week': '> 1 week',
    };
    return durationMap[onset] || 'unknown';
  }

  /**
   * Map chest pain character
   */
  private mapChestPainCharacter(value: string): string {
    const characterMap: Record<string, string> = {
      'sharp': 'Sharp/Stabbing',
      'pressure': 'Pressure/Squeezing',
      'burning': 'Burning',
      'dull': 'Dull ache',
    };
    return characterMap[value] || value;
  }

  /**
   * Map breathing difficulty severity
   */
  private mapBreathingSeverity(value: string): 'mild' | 'moderate' | 'severe' {
    switch (value) {
      case 'severe':
        return 'severe';
      case 'moderate':
        return 'moderate';
      case 'mild':
      default:
        return 'mild';
    }
  }

  /**
   * Map cough severity
   */
  private mapCoughSeverity(value: string): 'mild' | 'moderate' | 'severe' {
    switch (value) {
      case 'blood':
        return 'severe';
      case 'productive':
        return 'moderate';
      case 'dry':
      default:
        return 'mild';
    }
  }

  /**
   * Map fever severity
   */
  private mapFeverSeverity(value: string): 'mild' | 'moderate' | 'severe' {
    switch (value) {
      case 'high':
        return 'severe';
      case 'moderate':
        return 'moderate';
      case 'low':
      default:
        return 'mild';
    }
  }

  /**
   * Map headache severity
   */
  private mapHeadacheSeverity(value: string): 'mild' | 'moderate' | 'severe' {
    switch (value) {
      case 'worst_ever':
      case 'severe':
        return 'severe';
      case 'moderate':
        return 'moderate';
      case 'mild':
      default:
        return 'mild';
    }
  }

  /**
   * Map abdominal pain severity
   */
  private mapAbdominalPainSeverity(value: string): 'mild' | 'moderate' | 'severe' {
    switch (value) {
      case 'severe':
        return 'severe';
      case 'moderate':
        return 'moderate';
      case 'mild':
      default:
        return 'mild';
    }
  }

  /**
   * Validate symptom data
   */
  validateSymptom(symptom: Symptom): boolean {
    return !!(
      symptom.name &&
      symptom.severity &&
      ['mild', 'moderate', 'severe'].includes(symptom.severity)
    );
  }

  /**
   * Identify red flag symptoms that require immediate attention
   */
  identifyRedFlags(symptoms: Symptom[]): string[] {
    const redFlags: string[] = [];

    for (const symptom of symptoms) {
      // Chest pain red flags
      if (symptom.name.toLowerCase().includes('chest pain')) {
        if (symptom.character?.includes('Pressure') || symptom.character?.includes('Squeezing')) {
          redFlags.push('Chest pain with pressure/squeezing character (possible cardiac event)');
        }
        if (symptom.radiation?.includes('left_arm') || symptom.radiation?.includes('jaw')) {
          redFlags.push('Chest pain radiating to left arm or jaw (possible MI)');
        }
        if (symptom.associatedSymptoms?.includes('sweating') || 
            symptom.associatedSymptoms?.includes('shortness_breath')) {
          redFlags.push('Chest pain with diaphoresis or dyspnea (possible ACS)');
        }
      }

      // Respiratory red flags
      if (symptom.name.toLowerCase().includes('breathing') && symptom.severity === 'severe') {
        redFlags.push('Severe difficulty breathing (respiratory distress)');
      }

      // Neurological red flags
      if (symptom.name.toLowerCase().includes('consciousness')) {
        redFlags.push('Altered level of consciousness (neurological emergency)');
      }

      if (symptom.name.toLowerCase().includes('headache')) {
        if (symptom.character?.includes('worst_ever')) {
          redFlags.push('Worst headache ever (possible subarachnoid hemorrhage)');
        }
      }

      // Hemorrhage red flags
      if (symptom.character?.includes('blood')) {
        redFlags.push('Hemoptysis (coughing up blood)');
      }
    }

    return redFlags;
  }
}

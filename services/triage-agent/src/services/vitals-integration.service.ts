import { VitalsData } from '../types';

/**
 * Vitals Integration Service
 * Handles vitals data validation, processing, and risk assessment
 */
export class VitalsIntegrationService {
  /**
   * Validate vitals data
   */
  validateVitals(vitals: VitalsData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Temperature validation (Celsius)
    if (vitals.temperature !== undefined) {
      if (vitals.temperature < 35 || vitals.temperature > 42) {
        errors.push('Temperature out of valid range (35-42°C)');
      }
    }

    // Blood pressure validation
    if (vitals.bloodPressure) {
      const { systolic, diastolic } = vitals.bloodPressure;
      if (systolic < 70 || systolic > 250) {
        errors.push('Systolic BP out of valid range (70-250 mmHg)');
      }
      if (diastolic < 40 || diastolic > 150) {
        errors.push('Diastolic BP out of valid range (40-150 mmHg)');
      }
      if (systolic <= diastolic) {
        errors.push('Systolic BP must be greater than diastolic BP');
      }
    }

    // Heart rate validation
    if (vitals.heartRate !== undefined) {
      if (vitals.heartRate < 30 || vitals.heartRate > 220) {
        errors.push('Heart rate out of valid range (30-220 bpm)');
      }
    }

    // Respiratory rate validation
    if (vitals.respiratoryRate !== undefined) {
      if (vitals.respiratoryRate < 8 || vitals.respiratoryRate > 60) {
        errors.push('Respiratory rate out of valid range (8-60 breaths/min)');
      }
    }

    // SpO2 validation
    if (vitals.spo2 !== undefined) {
      if (vitals.spo2 < 70 || vitals.spo2 > 100) {
        errors.push('SpO2 out of valid range (70-100%)');
      }
    }

    // Weight validation
    if (vitals.weight !== undefined) {
      if (vitals.weight < 2 || vitals.weight > 300) {
        errors.push('Weight out of valid range (2-300 kg)');
      }
    }

    // Height validation
    if (vitals.height !== undefined) {
      if (vitals.height < 40 || vitals.height > 250) {
        errors.push('Height out of valid range (40-250 cm)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate BMI if weight and height are provided
   */
  calculateBMI(vitals: VitalsData): VitalsData {
    if (vitals.weight && vitals.height) {
      const heightInMeters = vitals.height / 100;
      vitals.bmi = Number((vitals.weight / (heightInMeters * heightInMeters)).toFixed(1));
    }
    return vitals;
  }

  /**
   * Assess vitals severity and generate risk score (0-100)
   */
  assessVitalsSeverity(vitals: VitalsData): number {
    let severityScore = 0;
    let factorCount = 0;

    // Temperature assessment
    if (vitals.temperature !== undefined) {
      factorCount++;
      if (vitals.temperature >= 39.4) {
        severityScore += 80; // High fever
      } else if (vitals.temperature >= 38.3) {
        severityScore += 50; // Moderate fever
      } else if (vitals.temperature >= 37.5) {
        severityScore += 30; // Low-grade fever
      } else if (vitals.temperature < 36) {
        severityScore += 70; // Hypothermia
      } else {
        severityScore += 10; // Normal
      }
    }

    // Blood pressure assessment
    if (vitals.bloodPressure) {
      factorCount++;
      const { systolic, diastolic } = vitals.bloodPressure;
      
      // Hypertensive crisis
      if (systolic >= 180 || diastolic >= 120) {
        severityScore += 90;
      }
      // Stage 2 hypertension
      else if (systolic >= 140 || diastolic >= 90) {
        severityScore += 60;
      }
      // Stage 1 hypertension
      else if (systolic >= 130 || diastolic >= 80) {
        severityScore += 40;
      }
      // Hypotension
      else if (systolic < 90 || diastolic < 60) {
        severityScore += 70;
      }
      // Normal
      else {
        severityScore += 10;
      }
    }

    // Heart rate assessment
    if (vitals.heartRate !== undefined) {
      factorCount++;
      if (vitals.heartRate > 120) {
        severityScore += 70; // Severe tachycardia
      } else if (vitals.heartRate > 100) {
        severityScore += 50; // Tachycardia
      } else if (vitals.heartRate < 50) {
        severityScore += 60; // Bradycardia
      } else if (vitals.heartRate < 40) {
        severityScore += 80; // Severe bradycardia
      } else {
        severityScore += 10; // Normal
      }
    }

    // Respiratory rate assessment
    if (vitals.respiratoryRate !== undefined) {
      factorCount++;
      if (vitals.respiratoryRate > 30) {
        severityScore += 80; // Severe tachypnea
      } else if (vitals.respiratoryRate > 24) {
        severityScore += 60; // Tachypnea
      } else if (vitals.respiratoryRate < 10) {
        severityScore += 70; // Bradypnea
      } else {
        severityScore += 10; // Normal
      }
    }

    // SpO2 assessment
    if (vitals.spo2 !== undefined) {
      factorCount++;
      if (vitals.spo2 < 90) {
        severityScore += 90; // Critical hypoxemia
      } else if (vitals.spo2 < 94) {
        severityScore += 70; // Moderate hypoxemia
      } else if (vitals.spo2 < 96) {
        severityScore += 40; // Mild hypoxemia
      } else {
        severityScore += 10; // Normal
      }
    }

    // Return average severity score
    return factorCount > 0 ? Math.round(severityScore / factorCount) : 0;
  }

  /**
   * Identify critical vitals that require immediate attention
   */
  identifyCriticalVitals(vitals: VitalsData): string[] {
    const criticalFindings: string[] = [];

    // Critical temperature
    if (vitals.temperature !== undefined) {
      if (vitals.temperature >= 40) {
        criticalFindings.push('Hyperpyrexia (temperature ≥40°C) - immediate cooling required');
      } else if (vitals.temperature < 35) {
        criticalFindings.push('Hypothermia (temperature <35°C) - warming required');
      }
    }

    // Critical blood pressure
    if (vitals.bloodPressure) {
      const { systolic, diastolic } = vitals.bloodPressure;
      if (systolic >= 180 || diastolic >= 120) {
        criticalFindings.push('Hypertensive crisis - immediate intervention required');
      } else if (systolic < 90) {
        criticalFindings.push('Hypotension (systolic <90 mmHg) - risk of shock');
      }
    }

    // Critical heart rate
    if (vitals.heartRate !== undefined) {
      if (vitals.heartRate > 150) {
        criticalFindings.push('Severe tachycardia (HR >150 bpm) - cardiac evaluation needed');
      } else if (vitals.heartRate < 40) {
        criticalFindings.push('Severe bradycardia (HR <40 bpm) - cardiac evaluation needed');
      }
    }

    // Critical respiratory rate
    if (vitals.respiratoryRate !== undefined) {
      if (vitals.respiratoryRate > 30) {
        criticalFindings.push('Severe tachypnea (RR >30) - respiratory distress');
      } else if (vitals.respiratoryRate < 10) {
        criticalFindings.push('Severe bradypnea (RR <10) - respiratory depression');
      }
    }

    // Critical SpO2
    if (vitals.spo2 !== undefined) {
      if (vitals.spo2 < 90) {
        criticalFindings.push('Critical hypoxemia (SpO2 <90%) - supplemental oxygen required');
      }
    }

    return criticalFindings;
  }

  /**
   * Generate vitals summary for clinical display
   */
  generateVitalsSummary(vitals: VitalsData): string {
    const parts: string[] = [];

    if (vitals.temperature !== undefined) {
      parts.push(`Temp: ${vitals.temperature}°C`);
    }

    if (vitals.bloodPressure) {
      parts.push(`BP: ${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg`);
    }

    if (vitals.heartRate !== undefined) {
      parts.push(`HR: ${vitals.heartRate} bpm`);
    }

    if (vitals.respiratoryRate !== undefined) {
      parts.push(`RR: ${vitals.respiratoryRate}/min`);
    }

    if (vitals.spo2 !== undefined) {
      parts.push(`SpO2: ${vitals.spo2}%`);
    }

    if (vitals.bmi !== undefined) {
      parts.push(`BMI: ${vitals.bmi}`);
    }

    return parts.join(' | ');
  }

  /**
   * Determine if vitals indicate emergency condition
   */
  isEmergency(vitals: VitalsData): boolean {
    const criticalFindings = this.identifyCriticalVitals(vitals);
    return criticalFindings.length > 0;
  }

  /**
   * Calculate Modified Early Warning Score (MEWS)
   * Used for rapid assessment of patient deterioration
   */
  calculateMEWS(vitals: VitalsData): number {
    let mewsScore = 0;

    // Respiratory rate scoring
    if (vitals.respiratoryRate !== undefined) {
      if (vitals.respiratoryRate < 9) mewsScore += 2;
      else if (vitals.respiratoryRate >= 9 && vitals.respiratoryRate <= 14) mewsScore += 0;
      else if (vitals.respiratoryRate >= 15 && vitals.respiratoryRate <= 20) mewsScore += 1;
      else if (vitals.respiratoryRate >= 21 && vitals.respiratoryRate <= 29) mewsScore += 2;
      else if (vitals.respiratoryRate >= 30) mewsScore += 3;
    }

    // Heart rate scoring
    if (vitals.heartRate !== undefined) {
      if (vitals.heartRate < 40) mewsScore += 2;
      else if (vitals.heartRate >= 40 && vitals.heartRate <= 50) mewsScore += 1;
      else if (vitals.heartRate >= 51 && vitals.heartRate <= 100) mewsScore += 0;
      else if (vitals.heartRate >= 101 && vitals.heartRate <= 110) mewsScore += 1;
      else if (vitals.heartRate >= 111 && vitals.heartRate <= 129) mewsScore += 2;
      else if (vitals.heartRate >= 130) mewsScore += 3;
    }

    // Systolic BP scoring
    if (vitals.bloodPressure) {
      const systolic = vitals.bloodPressure.systolic;
      if (systolic < 70) mewsScore += 3;
      else if (systolic >= 70 && systolic <= 80) mewsScore += 2;
      else if (systolic >= 81 && systolic <= 100) mewsScore += 1;
      else if (systolic >= 101 && systolic <= 199) mewsScore += 0;
      else if (systolic >= 200) mewsScore += 2;
    }

    // Temperature scoring
    if (vitals.temperature !== undefined) {
      if (vitals.temperature < 35) mewsScore += 2;
      else if (vitals.temperature >= 35 && vitals.temperature < 38.5) mewsScore += 0;
      else if (vitals.temperature >= 38.5) mewsScore += 2;
    }

    return mewsScore;
  }
}

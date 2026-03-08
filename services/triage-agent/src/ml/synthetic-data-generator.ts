/**
 * Synthetic Training Data Generator for Urgency Scoring Model
 * Generates 500K synthetic triage cases with realistic medical scenarios
 */

export interface SyntheticTriageCase {
  // Demographics
  age: number;
  gender: 'male' | 'female' | 'other';
  
  // Symptoms
  chiefComplaint: string;
  symptomOnset: string;
  symptomSeverity: number; // 1-10
  symptomCharacter: string;
  
  // Vitals
  temperature: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  
  // Medical History
  chronicConditions: string[];
  previousHospitalizations: number;
  currentMedications: number;
  allergies: number;
  
  // Risk Factors
  hasRedFlags: boolean;
  redFlagCount: number;
  
  // Target Variable
  urgencyScore: number; // 0-100
  actualOutcome: 'emergency' | 'urgent' | 'routine' | 'discharged';
}

export class SyntheticDataGenerator {
  private random = Math.random;
  
  /**
   * Generate synthetic training dataset
   */
  generateDataset(size: number): SyntheticTriageCase[] {
    const dataset: SyntheticTriageCase[] = [];
    
    for (let i = 0; i < size; i++) {
      dataset.push(this.generateCase());
    }
    
    return dataset;
  }

  /**
   * Generate a single synthetic case
   */
  private generateCase(): SyntheticTriageCase {
    // Generate demographics
    const age = this.generateAge();
    const gender = this.generateGender();
    
    // Generate symptom profile
    const symptomProfile = this.generateSymptomProfile();
    
    // Generate vitals based on symptom severity
    const vitals = this.generateVitals(symptomProfile.severity);
    
    // Generate medical history
    const history = this.generateMedicalHistory(age);
    
    // Calculate urgency score based on all factors
    const urgencyScore = this.calculateUrgencyScore({
      age,
      symptomProfile,
      vitals,
      history,
    });
    
    // Determine actual outcome
    const actualOutcome = this.determineOutcome(urgencyScore);
    
    return {
      age,
      gender,
      chiefComplaint: symptomProfile.complaint,
      symptomOnset: symptomProfile.onset,
      symptomSeverity: symptomProfile.severity,
      symptomCharacter: symptomProfile.character,
      temperature: vitals.temperature,
      bloodPressureSystolic: vitals.bpSystolic,
      bloodPressureDiastolic: vitals.bpDiastolic,
      heartRate: vitals.heartRate,
      respiratoryRate: vitals.respiratoryRate,
      oxygenSaturation: vitals.oxygenSaturation,
      chronicConditions: history.conditions,
      previousHospitalizations: history.hospitalizations,
      currentMedications: history.medications,
      allergies: history.allergies,
      hasRedFlags: symptomProfile.hasRedFlags,
      redFlagCount: symptomProfile.redFlagCount,
      urgencyScore,
      actualOutcome,
    };
  }

  private generateAge(): number {
    // Age distribution: 20% pediatric, 60% adult, 20% elderly
    const rand = Math.random();
    if (rand < 0.2) {
      return Math.floor(Math.random() * 18); // 0-17
    } else if (rand < 0.8) {
      return Math.floor(Math.random() * 47) + 18; // 18-64
    } else {
      return Math.floor(Math.random() * 30) + 65; // 65-94
    }
  }
  
  private generateGender(): 'male' | 'female' | 'other' {
    const rand = Math.random();
    if (rand < 0.48) return 'male';
    if (rand < 0.96) return 'female';
    return 'other';
  }
  
  private generateSymptomProfile() {
    const complaints = [
      { name: 'chest_pain', severity: 8, redFlag: true },
      { name: 'shortness_of_breath', severity: 7, redFlag: true },
      { name: 'severe_headache', severity: 7, redFlag: true },
      { name: 'abdominal_pain', severity: 6, redFlag: false },
      { name: 'fever', severity: 5, redFlag: false },
      { name: 'cough', severity: 3, redFlag: false },
      { name: 'back_pain', severity: 4, redFlag: false },
      { name: 'dizziness', severity: 5, redFlag: false },
      { name: 'nausea', severity: 3, redFlag: false },
      { name: 'headache', severity: 4, redFlag: false },
    ];
    
    const complaint = complaints[Math.floor(Math.random() * complaints.length)];
    
    const onsets = ['just_now', '2_6_hours', '6_24_hours', '1_3_days', '3_7_days', 'over_week'];
    const onset = onsets[Math.floor(Math.random() * onsets.length)];
    
    const characters = ['sharp', 'dull', 'pressure', 'burning', 'throbbing', 'cramping'];
    const character = characters[Math.floor(Math.random() * characters.length)];
    
    // Add variability to severity
    const severity = Math.max(1, Math.min(10, 
      complaint.severity + Math.floor((Math.random() - 0.5) * 4)
    ));
    
    const hasRedFlags = complaint.redFlag && Math.random() > 0.3;
    const redFlagCount = hasRedFlags ? Math.floor(Math.random() * 3) + 1 : 0;
    
    return {
      complaint: complaint.name,
      onset,
      character,
      severity,
      hasRedFlags,
      redFlagCount,
    };
  }

  private generateVitals(symptomSeverity: number) {
    // Base vitals with variation based on symptom severity
    const severityFactor = symptomSeverity / 10;
    
    const temperature = 98.6 + (Math.random() - 0.5) * 4 + severityFactor * 2;
    
    const bpSystolic = 120 + (Math.random() - 0.5) * 40 + severityFactor * 20;
    const bpDiastolic = 80 + (Math.random() - 0.5) * 20 + severityFactor * 10;
    
    const heartRate = 70 + (Math.random() - 0.5) * 30 + severityFactor * 20;
    
    const respiratoryRate = 16 + (Math.random() - 0.5) * 8 + severityFactor * 6;
    
    const oxygenSaturation = 98 - (Math.random() * 3) - severityFactor * 5;
    
    return {
      temperature: Math.round(temperature * 10) / 10,
      bpSystolic: Math.round(bpSystolic),
      bpDiastolic: Math.round(bpDiastolic),
      heartRate: Math.round(heartRate),
      respiratoryRate: Math.round(respiratoryRate),
      oxygenSaturation: Math.round(oxygenSaturation),
    };
  }
  
  private generateMedicalHistory(age: number) {
    const allConditions = [
      'hypertension', 'diabetes', 'asthma', 'copd', 'heart_disease',
      'kidney_disease', 'cancer', 'stroke', 'arthritis', 'depression'
    ];
    
    // Older patients more likely to have chronic conditions
    const conditionProbability = age < 18 ? 0.1 : age < 65 ? 0.3 : 0.6;
    const numConditions = Math.random() < conditionProbability 
      ? Math.floor(Math.random() * 3) + 1 
      : 0;
    
    const conditions: string[] = [];
    for (let i = 0; i < numConditions; i++) {
      const condition = allConditions[Math.floor(Math.random() * allConditions.length)];
      if (!conditions.includes(condition)) {
        conditions.push(condition);
      }
    }
    
    const hospitalizations = conditions.length > 0 
      ? Math.floor(Math.random() * 3) 
      : 0;
    
    const medications = conditions.length * 2 + Math.floor(Math.random() * 3);
    
    const allergies = Math.random() < 0.2 ? Math.floor(Math.random() * 3) + 1 : 0;
    
    return {
      conditions,
      hospitalizations,
      medications,
      allergies,
    };
  }

  private calculateUrgencyScore(params: {
    age: number;
    symptomProfile: any;
    vitals: any;
    history: any;
  }): number {
    let score = 0;
    
    // Symptom severity (40% weight)
    score += params.symptomProfile.severity * 4;
    
    // Red flags (immediate elevation)
    if (params.symptomProfile.hasRedFlags) {
      score += params.symptomProfile.redFlagCount * 15;
    }
    
    // Vitals assessment (30% weight)
    let vitalsScore = 0;
    
    // Temperature
    if (params.vitals.temperature > 103 || params.vitals.temperature < 95) {
      vitalsScore += 10;
    } else if (params.vitals.temperature > 101 || params.vitals.temperature < 96) {
      vitalsScore += 5;
    }
    
    // Blood pressure
    if (params.vitals.bpSystolic > 180 || params.vitals.bpSystolic < 90) {
      vitalsScore += 10;
    } else if (params.vitals.bpSystolic > 160 || params.vitals.bpSystolic < 100) {
      vitalsScore += 5;
    }
    
    // Heart rate
    if (params.vitals.heartRate > 120 || params.vitals.heartRate < 50) {
      vitalsScore += 10;
    } else if (params.vitals.heartRate > 100 || params.vitals.heartRate < 60) {
      vitalsScore += 5;
    }
    
    // Oxygen saturation
    if (params.vitals.oxygenSaturation < 90) {
      vitalsScore += 15;
    } else if (params.vitals.oxygenSaturation < 94) {
      vitalsScore += 8;
    }
    
    score += vitalsScore * 3;
    
    // Age risk (15% weight)
    if (params.age < 1 || params.age > 75) {
      score += 15;
    } else if (params.age < 5 || params.age > 65) {
      score += 10;
    }
    
    // Medical history (15% weight)
    score += Math.min(params.history.conditions.length * 5, 15);
    
    // Symptom onset
    const onsetScores: Record<string, number> = {
      'just_now': 10,
      '2_6_hours': 8,
      '6_24_hours': 6,
      '1_3_days': 4,
      '3_7_days': 2,
      'over_week': 1,
    };
    score += onsetScores[params.symptomProfile.onset] || 5;
    
    // Add some random variation
    score += (Math.random() - 0.5) * 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  private determineOutcome(urgencyScore: number): 'emergency' | 'urgent' | 'routine' | 'discharged' {
    if (urgencyScore >= 75) return 'emergency';
    if (urgencyScore >= 50) return 'urgent';
    if (urgencyScore >= 25) return 'routine';
    return 'discharged';
  }
}

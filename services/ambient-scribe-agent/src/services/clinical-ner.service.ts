import { ClinicalFact, MedicationFact, TranscriptionSegment } from '../types';

export class ClinicalNERService {
  /**
   * Extract clinical entities from transcription text
   * In production, this would use BioBERT or ClinicalBERT
   */
  public async extractClinicalFacts(
    transcriptionSegments: TranscriptionSegment[]
  ): Promise<ClinicalFact[]> {
    const allFacts: ClinicalFact[] = [];
    let offset = 0;
    
    for (const segment of transcriptionSegments) {
      const facts = await this.extractFromText(segment.text, offset);
      allFacts.push(...facts);
      offset += segment.text.length + 1; // +1 for space
    }
    
    return this.deduplicateFacts(allFacts);
  }

  /**
   * Extract clinical entities from text
   */
  public async extractFromText(text: string, startOffset: number): Promise<ClinicalFact[]> {
    const facts: ClinicalFact[] = [];
    
    // Extract symptoms
    facts.push(...this.extractSymptoms(text, startOffset));
    
    // Extract diagnoses
    facts.push(...this.extractDiagnoses(text, startOffset));
    
    // Extract medications
    facts.push(...this.extractMedications(text, startOffset));
    
    // Extract allergies
    facts.push(...this.extractAllergies(text, startOffset));
    
    // Extract vitals
    facts.push(...this.extractVitals(text, startOffset));
    
    // Extract procedures
    facts.push(...this.extractProcedures(text, startOffset));
    
    return facts;
  }

  /**
   * Extract symptoms from text
   */
  private extractSymptoms(text: string, startOffset: number): ClinicalFact[] {
    const symptoms: ClinicalFact[] = [];
    
    // Common symptom patterns
    const symptomPatterns = [
      { pattern: /chest pain/gi, normalized: 'Chest Pain' },
      { pattern: /shortness of breath|difficulty breathing|dyspnea/gi, normalized: 'Dyspnea' },
      { pattern: /headache/gi, normalized: 'Headache' },
      { pattern: /fever/gi, normalized: 'Fever' },
      { pattern: /cough/gi, normalized: 'Cough' },
      { pattern: /nausea/gi, normalized: 'Nausea' },
      { pattern: /vomiting/gi, normalized: 'Vomiting' },
      { pattern: /dizziness/gi, normalized: 'Dizziness' },
      { pattern: /fatigue|tiredness/gi, normalized: 'Fatigue' },
      { pattern: /abdominal pain|stomach pain/gi, normalized: 'Abdominal Pain' },
      { pattern: /back pain/gi, normalized: 'Back Pain' },
      { pattern: /joint pain|arthralgia/gi, normalized: 'Arthralgia' },
      { pattern: /sweating|diaphoresis/gi, normalized: 'Diaphoresis' },
      { pattern: /palpitations/gi, normalized: 'Palpitations' },
    ];
    
    for (const { pattern, normalized } of symptomPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        symptoms.push({
          type: 'symptom',
          value: match[0],
          normalizedValue: normalized,
          confidence: 0.85,
          startOffset: startOffset + match.index,
          endOffset: startOffset + match.index + match[0].length,
          context: this.getContext(text, match.index, 50),
        });
      }
    }
    
    return symptoms;
  }

  /**
   * Extract diagnoses from text
   */
  private extractDiagnoses(text: string, startOffset: number): ClinicalFact[] {
    const diagnoses: ClinicalFact[] = [];
    
    const diagnosisPatterns = [
      { pattern: /myocardial infarction|heart attack|MI/gi, normalized: 'Myocardial Infarction' },
      { pattern: /hypertension|high blood pressure/gi, normalized: 'Hypertension' },
      { pattern: /diabetes|diabetic/gi, normalized: 'Diabetes Mellitus' },
      { pattern: /asthma/gi, normalized: 'Asthma' },
      { pattern: /pneumonia/gi, normalized: 'Pneumonia' },
      { pattern: /COPD|chronic obstructive pulmonary disease/gi, normalized: 'COPD' },
      { pattern: /stroke|CVA|cerebrovascular accident/gi, normalized: 'Cerebrovascular Accident' },
      { pattern: /angina/gi, normalized: 'Angina Pectoris' },
      { pattern: /arrhythmia/gi, normalized: 'Cardiac Arrhythmia' },
      { pattern: /sepsis/gi, normalized: 'Sepsis' },
    ];
    
    for (const { pattern, normalized } of diagnosisPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        diagnoses.push({
          type: 'diagnosis',
          value: match[0],
          normalizedValue: normalized,
          confidence: 0.80,
          startOffset: startOffset + match.index,
          endOffset: startOffset + match.index + match[0].length,
          context: this.getContext(text, match.index, 50),
        });
      }
    }
    
    return diagnoses;
  }

  /**
   * Extract medications from text
   */
  private extractMedications(text: string, startOffset: number): MedicationFact[] {
    const medications: MedicationFact[] = [];
    
    const medicationPatterns = [
      'aspirin', 'atorvastatin', 'metformin', 'lisinopril', 'amlodipine',
      'metoprolol', 'losartan', 'simvastatin', 'omeprazole', 'levothyroxine',
      'clopidogrel', 'warfarin', 'insulin', 'albuterol', 'prednisone',
    ];
    
    for (const medication of medicationPatterns) {
      const pattern = new RegExp(medication, 'gi');
      let match;
      
      while ((match = pattern.exec(text)) !== null) {
        const context = this.getContext(text, match.index, 100);
        const dosageInfo = this.extractDosageInfo(context);
        
        medications.push({
          type: 'medication',
          value: match[0],
          normalizedValue: medication.charAt(0).toUpperCase() + medication.slice(1),
          confidence: 0.90,
          startOffset: startOffset + match.index,
          endOffset: startOffset + match.index + match[0].length,
          context,
          metadata: dosageInfo,
        });
      }
    }
    
    return medications;
  }

  /**
   * Extract dosage information from context
   */
  private extractDosageInfo(context: string): {
    dosage?: string;
    frequency?: string;
    route?: string;
    duration?: string;
  } {
    const info: any = {};
    
    // Extract dosage (e.g., "75mg", "10 mg", "1 tablet")
    const dosageMatch = context.match(/(\d+\.?\d*)\s*(mg|g|ml|mcg|units?|tablets?)/i);
    if (dosageMatch) {
      info.dosage = dosageMatch[0];
    }
    
    // Extract frequency
    const frequencyPatterns = [
      { pattern: /once daily|OD|QD/i, value: 'Once daily' },
      { pattern: /twice daily|BID|BD/i, value: 'Twice daily' },
      { pattern: /three times daily|TID|TDS/i, value: 'Three times daily' },
      { pattern: /four times daily|QID/i, value: 'Four times daily' },
      { pattern: /every (\d+) hours/i, value: 'Every $1 hours' },
      { pattern: /at bedtime|HS/i, value: 'At bedtime' },
      { pattern: /as needed|PRN/i, value: 'As needed' },
    ];
    
    for (const { pattern, value } of frequencyPatterns) {
      const match = context.match(pattern);
      if (match) {
        info.frequency = value.replace('$1', match[1] || '');
        break;
      }
    }
    
    // Extract route
    const routePatterns = [
      { pattern: /oral|PO|by mouth/i, value: 'Oral' },
      { pattern: /IV|intravenous/i, value: 'Intravenous' },
      { pattern: /IM|intramuscular/i, value: 'Intramuscular' },
      { pattern: /subcutaneous|SC|SQ/i, value: 'Subcutaneous' },
      { pattern: /topical/i, value: 'Topical' },
      { pattern: /inhaled/i, value: 'Inhaled' },
    ];
    
    for (const { pattern, value } of routePatterns) {
      if (pattern.test(context)) {
        info.route = value;
        break;
      }
    }
    
    // Extract duration
    const durationMatch = context.match(/for (\d+) (days?|weeks?|months?)/i);
    if (durationMatch) {
      info.duration = durationMatch[0];
    }
    
    return info;
  }

  /**
   * Extract allergies from text
   */
  private extractAllergies(text: string, startOffset: number): ClinicalFact[] {
    const allergies: ClinicalFact[] = [];
    
    // Look for allergy mentions
    const allergyPattern = /allergic to ([a-z\s,]+)|allergy:?\s*([a-z\s,]+)/gi;
    let match;
    
    while ((match = allergyPattern.exec(text)) !== null) {
      const allergyText = match[1] || match[2];
      const allergyItems = allergyText.split(/,|and/).map(s => s.trim());
      
      for (const item of allergyItems) {
        if (item.length > 2) {
          allergies.push({
            type: 'allergy',
            value: item,
            normalizedValue: item.charAt(0).toUpperCase() + item.slice(1),
            confidence: 0.85,
            startOffset: startOffset + match.index,
            endOffset: startOffset + match.index + match[0].length,
            context: this.getContext(text, match.index, 50),
          });
        }
      }
    }
    
    return allergies;
  }

  /**
   * Extract vital signs from text
   */
  private extractVitals(text: string, startOffset: number): ClinicalFact[] {
    const vitals: ClinicalFact[] = [];
    
    // Blood pressure
    const bpPattern = /blood pressure|BP:?\s*(\d{2,3})\s*[\/over]\s*(\d{2,3})/gi;
    let match;
    
    while ((match = bpPattern.exec(text)) !== null) {
      vitals.push({
        type: 'vital',
        value: `${match[1]}/${match[2]} mmHg`,
        normalizedValue: 'Blood Pressure',
        confidence: 0.95,
        startOffset: startOffset + match.index,
        endOffset: startOffset + match.index + match[0].length,
        context: this.getContext(text, match.index, 30),
        metadata: { systolic: match[1], diastolic: match[2], unit: 'mmHg' },
      });
    }
    
    // Heart rate
    const hrPattern = /heart rate|HR|pulse:?\s*(\d{2,3})\s*(bpm|beats per minute)?/gi;
    while ((match = hrPattern.exec(text)) !== null) {
      vitals.push({
        type: 'vital',
        value: `${match[1]} bpm`,
        normalizedValue: 'Heart Rate',
        confidence: 0.95,
        startOffset: startOffset + match.index,
        endOffset: startOffset + match.index + match[0].length,
        context: this.getContext(text, match.index, 30),
        metadata: { value: match[1], unit: 'bpm' },
      });
    }
    
    // Temperature
    const tempPattern = /temperature|temp:?\s*(\d{2,3}\.?\d*)\s*(F|C|fahrenheit|celsius)?/gi;
    while ((match = tempPattern.exec(text)) !== null) {
      vitals.push({
        type: 'vital',
        value: `${match[1]}°${match[2] || 'F'}`,
        normalizedValue: 'Temperature',
        confidence: 0.95,
        startOffset: startOffset + match.index,
        endOffset: startOffset + match.index + match[0].length,
        context: this.getContext(text, match.index, 30),
        metadata: { value: match[1], unit: match[2] || 'F' },
      });
    }
    
    // SpO2
    const spo2Pattern = /SpO2|oxygen saturation:?\s*(\d{2,3})%?/gi;
    while ((match = spo2Pattern.exec(text)) !== null) {
      vitals.push({
        type: 'vital',
        value: `${match[1]}%`,
        normalizedValue: 'Oxygen Saturation',
        confidence: 0.95,
        startOffset: startOffset + match.index,
        endOffset: startOffset + match.index + match[0].length,
        context: this.getContext(text, match.index, 30),
        metadata: { value: match[1], unit: '%' },
      });
    }
    
    return vitals;
  }

  /**
   * Extract procedures from text
   */
  private extractProcedures(text: string, startOffset: number): ClinicalFact[] {
    const procedures: ClinicalFact[] = [];
    
    const procedurePatterns = [
      { pattern: /ECG|electrocardiogram|EKG/gi, normalized: 'Electrocardiogram' },
      { pattern: /X-ray|radiograph/gi, normalized: 'X-ray' },
      { pattern: /CT scan|computed tomography/gi, normalized: 'CT Scan' },
      { pattern: /MRI|magnetic resonance imaging/gi, normalized: 'MRI' },
      { pattern: /ultrasound|sonography/gi, normalized: 'Ultrasound' },
      { pattern: /blood test|lab work/gi, normalized: 'Blood Test' },
      { pattern: /biopsy/gi, normalized: 'Biopsy' },
      { pattern: /endoscopy/gi, normalized: 'Endoscopy' },
    ];
    
    for (const { pattern, normalized } of procedurePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        procedures.push({
          type: 'procedure',
          value: match[0],
          normalizedValue: normalized,
          confidence: 0.85,
          startOffset: startOffset + match.index,
          endOffset: startOffset + match.index + match[0].length,
          context: this.getContext(text, match.index, 50),
        });
      }
    }
    
    return procedures;
  }

  /**
   * Get context around a match
   */
  private getContext(text: string, index: number, contextLength: number): string {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + contextLength);
    return text.substring(start, end);
  }

  /**
   * Deduplicate extracted facts
   */
  private deduplicateFacts(facts: ClinicalFact[]): ClinicalFact[] {
    const seen = new Set<string>();
    const unique: ClinicalFact[] = [];
    
    for (const fact of facts) {
      const key = `${fact.type}:${fact.normalizedValue || fact.value}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(fact);
      }
    }
    
    return unique;
  }

  /**
   * Filter facts by confidence threshold
   */
  public filterByConfidence(facts: ClinicalFact[], threshold: number = 0.75): ClinicalFact[] {
    return facts.filter(fact => fact.confidence >= threshold);
  }

  /**
   * Group facts by type
   */
  public groupFactsByType(facts: ClinicalFact[]): Map<string, ClinicalFact[]> {
    const grouped = new Map<string, ClinicalFact[]>();
    
    for (const fact of facts) {
      const existing = grouped.get(fact.type) || [];
      existing.push(fact);
      grouped.set(fact.type, existing);
    }
    
    return grouped;
  }
}

export const clinicalNERService = new ClinicalNERService();

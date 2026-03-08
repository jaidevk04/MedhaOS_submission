import {
  ClinicalEntity,
  SymptomExtractionRequest,
  SymptomExtractionResponse,
  ClinicalFactExtractionRequest,
  ClinicalFactExtractionResponse,
  SYMPTOM_CATEGORIES,
  SEVERITY_INDICATORS,
  DURATION_PATTERNS,
} from '../types/clinical.types';

/**
 * Clinical NLP Service
 * Handles medical named entity recognition, symptom extraction, and clinical fact extraction
 * 
 * Note: This is a simplified implementation. In production, integrate with:
 * - BioBERT for medical NER
 * - ClinicalBERT for clinical text understanding
 * - UMLS/SNOMED CT for medical concept normalization
 */
export class ClinicalNLPService {
  /**
   * Extract symptoms from clinical text
   */
  async extractSymptoms(request: SymptomExtractionRequest): Promise<SymptomExtractionResponse> {
    const startTime = Date.now();
    const text = request.text.toLowerCase();
    const symptoms: SymptomExtractionResponse['symptoms'] = [];

    // Extract symptoms using pattern matching and medical vocabulary
    for (const [category, symptomList] of Object.entries(SYMPTOM_CATEGORIES)) {
      for (const symptom of symptomList) {
        const regex = new RegExp(`\\b${symptom}\\b`, 'gi');
        const matches = text.match(regex);

        if (matches) {
          // Extract context around symptom
          const index = text.indexOf(symptom.toLowerCase());
          const contextStart = Math.max(0, index - 50);
          const contextEnd = Math.min(text.length, index + symptom.length + 50);
          const context = text.substring(contextStart, contextEnd);

          // Determine severity
          const severity = this.extractSeverity(context);

          // Extract duration
          const duration = this.extractDuration(context);

          // Extract location (for pain-related symptoms)
          const location = this.extractLocation(context, symptom);

          symptoms.push({
            symptom,
            normalizedForm: this.normalizeSymptom(symptom),
            severity,
            duration,
            location,
            confidence: 0.85, // In production, use ML model confidence
          });
        }
      }
    }

    // Remove duplicates
    const uniqueSymptoms = this.deduplicateSymptoms(symptoms);

    return {
      symptoms: uniqueSymptoms,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Extract clinical facts from conversation
   */
  async extractClinicalFacts(
    request: ClinicalFactExtractionRequest
  ): Promise<ClinicalFactExtractionResponse> {
    const startTime = Date.now();
    const text = request.conversationText.toLowerCase();

    // Extract chief complaint (usually first patient statement)
    const chiefComplaint = this.extractChiefComplaint(request);

    // Extract symptoms
    const symptomResult = await this.extractSymptoms({ text });
    const symptoms = symptomResult.symptoms.map((s) => s.symptom);

    // Extract duration
    const duration = this.extractDuration(text) || 'not specified';

    // Extract severity
    const severity = this.extractSeverity(text) || 'not specified';

    // Extract associated symptoms
    const associatedSymptoms = this.extractAssociatedSymptoms(text, symptoms);

    // Extract medical history
    const medicalHistory = this.extractMedicalHistory(text);

    // Extract current medications
    const currentMedications = this.extractMedications(text);

    // Extract allergies
    const allergies = this.extractAllergies(text);

    // Extract vital signs
    const vitalSigns = this.extractVitalSigns(text);

    // Extract physical exam findings
    const physicalExamFindings = this.extractPhysicalExamFindings(text);

    return {
      chiefComplaint,
      symptoms,
      duration,
      severity,
      associatedSymptoms,
      medicalHistory,
      currentMedications,
      allergies,
      vitalSigns,
      physicalExamFindings,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Extract named entities from clinical text
   */
  async extractEntities(text: string): Promise<ClinicalEntity[]> {
    const entities: ClinicalEntity[] = [];
    const lowerText = text.toLowerCase();

    // Extract symptoms
    for (const [, symptomList] of Object.entries(SYMPTOM_CATEGORIES)) {
      for (const symptom of symptomList) {
        const regex = new RegExp(`\\b${symptom}\\b`, 'gi');
        let match;
        while ((match = regex.exec(lowerText)) !== null) {
          entities.push({
            text: symptom,
            type: 'symptom',
            startIndex: match.index,
            endIndex: match.index + symptom.length,
            confidence: 0.85,
            normalizedForm: this.normalizeSymptom(symptom),
          });
        }
      }
    }

    // Extract medications (common patterns)
    const medicationPatterns = [
      /\b(aspirin|ibuprofen|paracetamol|metformin|lisinopril|atorvastatin|amlodipine)\b/gi,
    ];

    for (const pattern of medicationPatterns) {
      let match;
      while ((match = pattern.exec(lowerText)) !== null) {
        entities.push({
          text: match[0],
          type: 'medication',
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          confidence: 0.9,
        });
      }
    }

    // Extract dosages
    const dosagePattern = /\b(\d+)\s*(mg|g|ml|mcg|units?)\b/gi;
    let match;
    while ((match = dosagePattern.exec(lowerText)) !== null) {
      entities.push({
        text: match[0],
        type: 'dosage',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 0.95,
      });
    }

    // Extract frequencies
    const frequencyPattern = /\b(once|twice|three times|daily|weekly|monthly|bid|tid|qid|prn)\b/gi;
    while ((match = frequencyPattern.exec(lowerText)) !== null) {
      entities.push({
        text: match[0],
        type: 'frequency',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 0.9,
      });
    }

    return entities.sort((a, b) => a.startIndex - b.startIndex);
  }

  // Helper methods

  private extractChiefComplaint(request: ClinicalFactExtractionRequest): string {
    if (request.speakerLabels && request.speakerLabels.length > 0) {
      // Find first patient statement
      const firstPatientStatement = request.speakerLabels.find(
        (label) => label.speaker === 'patient'
      );
      if (firstPatientStatement) {
        return firstPatientStatement.text;
      }
    }

    // Fallback: extract first sentence
    const sentences = request.conversationText.split(/[.!?]/);
    return sentences[0]?.trim() || 'Not specified';
  }

  private extractSeverity(text: string): 'mild' | 'moderate' | 'severe' | undefined {
    for (const [severity, indicators] of Object.entries(SEVERITY_INDICATORS)) {
      for (const indicator of indicators) {
        if (text.includes(indicator)) {
          return severity as 'mild' | 'moderate' | 'severe';
        }
      }
    }
    return undefined;
  }

  private extractDuration(text: string): string | undefined {
    for (const pattern of DURATION_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return undefined;
  }

  private extractLocation(context: string, symptom: string): string | undefined {
    // Common anatomical locations
    const locations = [
      'chest', 'head', 'abdomen', 'back', 'leg', 'arm', 'neck', 'shoulder',
      'knee', 'ankle', 'wrist', 'hip', 'left', 'right', 'upper', 'lower',
    ];

    for (const location of locations) {
      if (context.includes(location)) {
        return location;
      }
    }
    return undefined;
  }

  private extractAssociatedSymptoms(text: string, primarySymptoms: string[]): string[] {
    const associated: string[] = [];
    const keywords = ['also', 'along with', 'accompanied by', 'with', 'and'];

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        // Extract symptoms mentioned after these keywords
        const index = text.indexOf(keyword);
        const afterKeyword = text.substring(index);

        for (const [, symptomList] of Object.entries(SYMPTOM_CATEGORIES)) {
          for (const symptom of symptomList) {
            if (
              afterKeyword.includes(symptom) &&
              !primarySymptoms.includes(symptom)
            ) {
              associated.push(symptom);
            }
          }
        }
      }
    }

    return [...new Set(associated)];
  }

  private extractMedicalHistory(text: string): string[] {
    const history: string[] = [];
    const patterns = [
      /history of ([^,.]+)/gi,
      /previous ([^,.]+)/gi,
      /diagnosed with ([^,.]+)/gi,
      /had ([^,.]+) in \d{4}/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) {
          history.push(match[1].trim());
        }
      }
    }

    return [...new Set(history)];
  }

  private extractMedications(text: string): string[] {
    const medications: string[] = [];
    const patterns = [
      /taking ([a-z]+(?:\s+\d+\s*mg)?)/gi,
      /on ([a-z]+(?:\s+\d+\s*mg)?)/gi,
      /prescribed ([a-z]+(?:\s+\d+\s*mg)?)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) {
          medications.push(match[1].trim());
        }
      }
    }

    return [...new Set(medications)];
  }

  private extractAllergies(text: string): string[] {
    const allergies: string[] = [];
    const patterns = [
      /allergic to ([^,.]+)/gi,
      /allergy to ([^,.]+)/gi,
      /cannot take ([^,.]+)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) {
          allergies.push(match[1].trim());
        }
      }
    }

    return [...new Set(allergies)];
  }

  private extractVitalSigns(text: string): ClinicalFactExtractionResponse['vitalSigns'] {
    const vitalSigns: ClinicalFactExtractionResponse['vitalSigns'] = {};

    // Blood pressure
    const bpMatch = text.match(/(\d{2,3})\/(\d{2,3})\s*mmhg/i);
    if (bpMatch) {
      vitalSigns.bloodPressure = `${bpMatch[1]}/${bpMatch[2]}`;
    }

    // Heart rate
    const hrMatch = text.match(/(\d{2,3})\s*bpm/i);
    if (hrMatch) {
      vitalSigns.heartRate = parseInt(hrMatch[1]);
    }

    // Temperature
    const tempMatch = text.match(/(\d{2,3}(?:\.\d)?)\s*[°]?[fc]/i);
    if (tempMatch) {
      vitalSigns.temperature = parseFloat(tempMatch[1]);
    }

    // Respiratory rate
    const rrMatch = text.match(/respiratory rate[:\s]+(\d{1,2})/i);
    if (rrMatch) {
      vitalSigns.respiratoryRate = parseInt(rrMatch[1]);
    }

    // Oxygen saturation
    const spo2Match = text.match(/(?:spo2|oxygen saturation)[:\s]+(\d{2,3})%?/i);
    if (spo2Match) {
      vitalSigns.oxygenSaturation = parseInt(spo2Match[1]);
    }

    return vitalSigns;
  }

  private extractPhysicalExamFindings(text: string): string[] {
    const findings: string[] = [];
    const patterns = [
      /examination reveals? ([^,.]+)/gi,
      /on examination[,:]? ([^,.]+)/gi,
      /physical exam[:]? ([^,.]+)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) {
          findings.push(match[1].trim());
        }
      }
    }

    return [...new Set(findings)];
  }

  private normalizeSymptom(symptom: string): string {
    // Simple normalization - in production, use UMLS/SNOMED CT
    const normalizations: Record<string, string> = {
      'chest pain': 'Chest Pain',
      'shortness of breath': 'Dyspnea',
      'difficulty breathing': 'Dyspnea',
      'stomach ache': 'Abdominal Pain',
      'belly pain': 'Abdominal Pain',
      'throwing up': 'Vomiting',
      'feeling sick': 'Nausea',
    };

    return normalizations[symptom.toLowerCase()] || symptom;
  }

  private deduplicateSymptoms(
    symptoms: SymptomExtractionResponse['symptoms']
  ): SymptomExtractionResponse['symptoms'] {
    const seen = new Set<string>();
    const unique: SymptomExtractionResponse['symptoms'] = [];

    for (const symptom of symptoms) {
      const key = symptom.normalizedForm.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(symptom);
      }
    }

    return unique;
  }
}

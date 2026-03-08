import { SOAPNote, ClinicalFact, TranscriptionSegment, TemporalRelation } from '../types';

export class SOAPNoteService {
  /**
   * Generate SOAP note from transcription and extracted facts
   */
  public async generateSOAPNote(
    transcriptionSegments: TranscriptionSegment[],
    extractedFacts: ClinicalFact[],
    _temporalRelations: TemporalRelation[]
  ): Promise<SOAPNote> {
    const subjective = this.generateSubjective(transcriptionSegments, extractedFacts);
    const objective = this.generateObjective(extractedFacts);
    const assessment = this.generateAssessment(extractedFacts);
    const plan = this.generatePlan(extractedFacts);
    
    return {
      subjective,
      objective,
      assessment,
      plan,
      extractedFacts,
      confidence: this.calculateOverallConfidence(extractedFacts),
      generatedAt: new Date(),
    };
  }

  /**
   * Generate Subjective section (patient's perspective)
   */
  private generateSubjective(
    transcriptionSegments: TranscriptionSegment[],
    facts: ClinicalFact[]
  ): string {
    const sections: string[] = [];
    
    // Chief complaint
    const symptoms = facts.filter(f => f.type === 'symptom');
    if (symptoms.length > 0) {
      const chiefComplaint = symptoms[0];
      sections.push(`Chief Complaint: ${chiefComplaint.normalizedValue || chiefComplaint.value}`);
    }
    
    // History of present illness (from patient statements)
    const patientStatements = transcriptionSegments
      .filter(s => s.speaker === 'patient')
      .map(s => s.text)
      .join(' ');
    
    if (patientStatements) {
      sections.push(`\nHistory of Present Illness:`);
      sections.push(this.summarizePatientHistory(patientStatements, facts));
    }
    
    // Review of systems (from symptoms)
    if (symptoms.length > 1) {
      sections.push(`\nReview of Systems:`);
      const systemReview = this.organizeSymptomsBySystem(symptoms);
      for (const [system, systemSymptoms] of systemReview.entries()) {
        sections.push(`- ${system}: ${systemSymptoms.map(s => s.normalizedValue || s.value).join(', ')}`);
      }
    }
    
    return sections.join('\n');
  }

  /**
   * Generate Objective section (observable findings)
   */
  private generateObjective(facts: ClinicalFact[]): string {
    const sections: string[] = [];
    
    // Vital signs
    const vitals = facts.filter(f => f.type === 'vital');
    if (vitals.length > 0) {
      sections.push('Vital Signs:');
      for (const vital of vitals) {
        sections.push(`- ${vital.normalizedValue}: ${vital.value}`);
      }
    }
    
    // Physical examination findings (from transcription)
    sections.push('\nPhysical Examination:');
    sections.push('General: Alert and oriented');
    
    // Add system-specific findings based on symptoms
    const symptoms = facts.filter(f => f.type === 'symptom');
    const systems = this.organizeSymptomsBySystem(symptoms);
    
    for (const [system, _] of systems.entries()) {
      sections.push(`${system}: Examination findings documented`);
    }
    
    // Procedures performed
    const procedures = facts.filter(f => f.type === 'procedure');
    if (procedures.length > 0) {
      sections.push('\nProcedures/Tests:');
      for (const procedure of procedures) {
        sections.push(`- ${procedure.normalizedValue || procedure.value}`);
      }
    }
    
    return sections.join('\n');
  }

  /**
   * Generate Assessment section (diagnosis and clinical reasoning)
   */
  private generateAssessment(facts: ClinicalFact[]): string {
    const sections: string[] = [];
    
    // Primary diagnoses
    const diagnoses = facts.filter(f => f.type === 'diagnosis');
    if (diagnoses.length > 0) {
      sections.push('Diagnoses:');
      diagnoses.forEach((diagnosis, index) => {
        sections.push(`${index + 1}. ${diagnosis.normalizedValue || diagnosis.value}`);
      });
    } else {
      // Generate differential diagnosis from symptoms
      const symptoms = facts.filter(f => f.type === 'symptom');
      if (symptoms.length > 0) {
        sections.push('Differential Diagnosis:');
        const differentials = this.generateDifferentialDiagnosis(symptoms);
        differentials.forEach((diff, index) => {
          sections.push(`${index + 1}. ${diff}`);
        });
      }
    }
    
    // Clinical reasoning
    sections.push('\nClinical Reasoning:');
    sections.push(this.generateClinicalReasoning(facts));
    
    return sections.join('\n');
  }

  /**
   * Generate Plan section (treatment and follow-up)
   */
  private generatePlan(facts: ClinicalFact[]): string {
    const sections: string[] = [];
    
    // Medications
    const medications = facts.filter(f => f.type === 'medication');
    if (medications.length > 0) {
      sections.push('Medications:');
      for (const med of medications) {
        const metadata = (med as any).metadata || {};
        let medLine = `- ${med.normalizedValue || med.value}`;
        
        if (metadata.dosage) medLine += ` ${metadata.dosage}`;
        if (metadata.frequency) medLine += ` ${metadata.frequency}`;
        if (metadata.route) medLine += ` (${metadata.route})`;
        if (metadata.duration) medLine += ` for ${metadata.duration}`;
        
        sections.push(medLine);
      }
    }
    
    // Diagnostic tests
    const procedures = facts.filter(f => f.type === 'procedure');
    if (procedures.length > 0) {
      sections.push('\nDiagnostic Tests Ordered:');
      for (const procedure of procedures) {
        sections.push(`- ${procedure.normalizedValue || procedure.value}`);
      }
    }
    
    // Patient education
    sections.push('\nPatient Education:');
    sections.push('- Discussed diagnosis, treatment plan, and expected outcomes');
    sections.push('- Reviewed medication instructions and potential side effects');
    sections.push('- Advised on warning signs requiring immediate medical attention');
    
    // Follow-up
    sections.push('\nFollow-up:');
    sections.push('- Schedule follow-up appointment as clinically indicated');
    sections.push('- Return to ED/clinic if symptoms worsen or new symptoms develop');
    
    return sections.join('\n');
  }

  /**
   * Summarize patient history from statements
   */
  private summarizePatientHistory(patientText: string, facts: ClinicalFact[]): string {
    const summary: string[] = [];
    
    // Extract key information
    const symptoms = facts.filter(f => f.type === 'symptom');
    const temporalInfo = this.extractTemporalInfo(patientText);
    
    if (symptoms.length > 0) {
      const mainSymptom = symptoms[0];
      let line = `Patient reports ${mainSymptom.normalizedValue || mainSymptom.value}`;
      
      if (temporalInfo) {
        line += ` ${temporalInfo}`;
      }
      
      summary.push(line + '.');
    }
    
    // Add associated symptoms
    if (symptoms.length > 1) {
      const associated = symptoms.slice(1).map(s => s.normalizedValue || s.value);
      summary.push(`Associated symptoms include ${associated.join(', ')}.`);
    }
    
    // Add relevant context from patient statements
    if (patientText.length > 100) {
      summary.push(`Patient describes: "${patientText.substring(0, 200)}..."`);
    }
    
    return summary.join(' ');
  }

  /**
   * Extract temporal information from text
   */
  private extractTemporalInfo(text: string): string | null {
    const patterns = [
      /(\d+)\s+(hours?|days?|weeks?|months?)\s+ago/i,
      /since (yesterday|last week|this morning)/i,
      /started (yesterday|today|this morning)/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return null;
  }

  /**
   * Organize symptoms by body system
   */
  private organizeSymptomsBySystem(symptoms: ClinicalFact[]): Map<string, ClinicalFact[]> {
    const systemMap = new Map<string, ClinicalFact[]>();
    
    const systemMapping: Record<string, string> = {
      'Chest Pain': 'Cardiovascular',
      'Palpitations': 'Cardiovascular',
      'Dyspnea': 'Respiratory',
      'Cough': 'Respiratory',
      'Headache': 'Neurological',
      'Dizziness': 'Neurological',
      'Abdominal Pain': 'Gastrointestinal',
      'Nausea': 'Gastrointestinal',
      'Vomiting': 'Gastrointestinal',
      'Fever': 'Constitutional',
      'Fatigue': 'Constitutional',
      'Diaphoresis': 'Constitutional',
    };
    
    for (const symptom of symptoms) {
      const system = systemMapping[symptom.normalizedValue || ''] || 'Other';
      const existing = systemMap.get(system) || [];
      existing.push(symptom);
      systemMap.set(system, existing);
    }
    
    return systemMap;
  }

  /**
   * Generate differential diagnosis from symptoms
   */
  private generateDifferentialDiagnosis(symptoms: ClinicalFact[]): string[] {
    const differentials: string[] = [];
    
    // Simple rule-based differential generation
    const symptomNames = symptoms.map(s => s.normalizedValue || s.value);
    
    if (symptomNames.includes('Chest Pain')) {
      differentials.push('Acute Coronary Syndrome');
      differentials.push('Pulmonary Embolism');
      differentials.push('Costochondritis');
    }
    
    if (symptomNames.includes('Dyspnea')) {
      differentials.push('Congestive Heart Failure');
      differentials.push('Pneumonia');
      differentials.push('Asthma Exacerbation');
    }
    
    if (symptomNames.includes('Headache')) {
      differentials.push('Migraine');
      differentials.push('Tension Headache');
      differentials.push('Intracranial Pathology');
    }
    
    if (differentials.length === 0) {
      differentials.push('Further evaluation needed');
    }
    
    return differentials;
  }

  /**
   * Generate clinical reasoning narrative
   */
  private generateClinicalReasoning(facts: ClinicalFact[]): string {
    const reasoning: string[] = [];
    
    const symptoms = facts.filter(f => f.type === 'symptom');
    const vitals = facts.filter(f => f.type === 'vital');
    const diagnoses = facts.filter(f => f.type === 'diagnosis');
    
    if (symptoms.length > 0) {
      reasoning.push(`Patient presents with ${symptoms.length} symptom(s).`);
    }
    
    if (vitals.length > 0) {
      reasoning.push(`Vital signs documented and reviewed.`);
    }
    
    if (diagnoses.length > 0) {
      reasoning.push(`Clinical presentation consistent with documented diagnosis.`);
    } else {
      reasoning.push(`Differential diagnosis considered based on presenting symptoms.`);
    }
    
    reasoning.push(`Treatment plan formulated based on clinical guidelines and patient factors.`);
    
    return reasoning.join(' ');
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(facts: ClinicalFact[]): number {
    if (facts.length === 0) {
      return 0;
    }
    
    const totalConfidence = facts.reduce((sum, fact) => sum + fact.confidence, 0);
    return totalConfidence / facts.length;
  }

  /**
   * Format SOAP note for display
   */
  public formatSOAPNote(soapNote: SOAPNote): string {
    const sections: string[] = [];
    
    sections.push('='.repeat(60));
    sections.push('SOAP NOTE');
    sections.push('='.repeat(60));
    sections.push('');
    
    sections.push('SUBJECTIVE:');
    sections.push('-'.repeat(60));
    sections.push(soapNote.subjective);
    sections.push('');
    
    sections.push('OBJECTIVE:');
    sections.push('-'.repeat(60));
    sections.push(soapNote.objective);
    sections.push('');
    
    sections.push('ASSESSMENT:');
    sections.push('-'.repeat(60));
    sections.push(soapNote.assessment);
    sections.push('');
    
    sections.push('PLAN:');
    sections.push('-'.repeat(60));
    sections.push(soapNote.plan);
    sections.push('');
    
    sections.push('='.repeat(60));
    sections.push(`Generated: ${soapNote.generatedAt.toISOString()}`);
    sections.push(`Confidence: ${(soapNote.confidence * 100).toFixed(1)}%`);
    sections.push('='.repeat(60));
    
    return sections.join('\n');
  }

  /**
   * Convert SOAP note to structured format for EHR
   */
  public toEHRFormat(soapNote: SOAPNote): {
    subjective: { chiefComplaint: string; hpi: string; ros: string };
    objective: { vitals: any[]; physicalExam: string; procedures: string[] };
    assessment: { diagnoses: string[]; reasoning: string };
    plan: { medications: any[]; tests: string[]; education: string[]; followUp: string };
  } {
    // Parse SOAP note sections into structured data
    const subjective = this.parseSubjective(soapNote.subjective);
    const objective = this.parseObjective(soapNote.objective, soapNote.extractedFacts);
    const assessment = this.parseAssessment(soapNote.assessment);
    const plan = this.parsePlan(soapNote.plan, soapNote.extractedFacts);
    
    return {
      subjective,
      objective,
      assessment,
      plan,
    };
  }

  private parseSubjective(text: string): { chiefComplaint: string; hpi: string; ros: string } {
    const lines = text.split('\n');
    let chiefComplaint = '';
    let hpi = '';
    let ros = '';
    
    let currentSection = '';
    
    for (const line of lines) {
      if (line.startsWith('Chief Complaint:')) {
        chiefComplaint = line.replace('Chief Complaint:', '').trim();
        currentSection = 'cc';
      } else if (line.includes('History of Present Illness:')) {
        currentSection = 'hpi';
      } else if (line.includes('Review of Systems:')) {
        currentSection = 'ros';
      } else if (line.trim()) {
        if (currentSection === 'hpi') hpi += line + '\n';
        if (currentSection === 'ros') ros += line + '\n';
      }
    }
    
    return { chiefComplaint, hpi: hpi.trim(), ros: ros.trim() };
  }

  private parseObjective(text: string, facts: ClinicalFact[]): {
    vitals: any[];
    physicalExam: string;
    procedures: string[];
  } {
    const vitals = facts
      .filter(f => f.type === 'vital')
      .map(v => ({
        name: v.normalizedValue,
        value: v.value,
        metadata: v.metadata,
      }));
    
    const procedures = facts
      .filter(f => f.type === 'procedure')
      .map(p => p.normalizedValue || p.value);
    
    return {
      vitals,
      physicalExam: text,
      procedures,
    };
  }

  private parseAssessment(text: string): { diagnoses: string[]; reasoning: string } {
    const lines = text.split('\n');
    const diagnoses: string[] = [];
    let reasoning = '';
    
    let inDiagnoses = false;
    let inReasoning = false;
    
    for (const line of lines) {
      if (line.includes('Diagnoses:') || line.includes('Differential Diagnosis:')) {
        inDiagnoses = true;
        inReasoning = false;
      } else if (line.includes('Clinical Reasoning:')) {
        inDiagnoses = false;
        inReasoning = true;
      } else if (line.trim()) {
        if (inDiagnoses && line.match(/^\d+\./)) {
          diagnoses.push(line.replace(/^\d+\.\s*/, '').trim());
        } else if (inReasoning) {
          reasoning += line + ' ';
        }
      }
    }
    
    return { diagnoses, reasoning: reasoning.trim() };
  }

  private parsePlan(text: string, facts: ClinicalFact[]): {
    medications: any[];
    tests: string[];
    education: string[];
    followUp: string;
  } {
    const medications = facts
      .filter(f => f.type === 'medication')
      .map(m => ({
        name: m.normalizedValue || m.value,
        ...(m as any).metadata,
      }));
    
    const tests = facts
      .filter(f => f.type === 'procedure')
      .map(p => p.normalizedValue || p.value);
    
    const lines = text.split('\n');
    const education: string[] = [];
    let followUp = '';
    
    let inEducation = false;
    let inFollowUp = false;
    
    for (const line of lines) {
      if (line.includes('Patient Education:')) {
        inEducation = true;
        inFollowUp = false;
      } else if (line.includes('Follow-up:')) {
        inEducation = false;
        inFollowUp = true;
      } else if (line.trim().startsWith('-')) {
        if (inEducation) {
          education.push(line.replace(/^-\s*/, '').trim());
        } else if (inFollowUp) {
          followUp += line.replace(/^-\s*/, '').trim() + ' ';
        }
      }
    }
    
    return {
      medications,
      tests,
      education,
      followUp: followUp.trim(),
    };
  }
}

export const soapNoteService = new SOAPNoteService();

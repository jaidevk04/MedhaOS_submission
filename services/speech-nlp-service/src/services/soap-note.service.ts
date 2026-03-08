import {
  SOAPNote,
  SOAPNoteGenerationRequest,
  SOAPNoteGenerationResponse,
  ClinicalFactExtractionResponse,
} from '../types/clinical.types';
import { ClinicalNLPService } from './clinical-nlp.service';

/**
 * SOAP Note Generation Service
 * Generates structured SOAP (Subjective, Objective, Assessment, Plan) notes from clinical conversations
 */
export class SOAPNoteService {
  private clinicalNLP: ClinicalNLPService;

  constructor() {
    this.clinicalNLP = new ClinicalNLPService();
  }

  /**
   * Generate SOAP note from conversation
   */
  async generateSOAPNote(
    request: SOAPNoteGenerationRequest
  ): Promise<SOAPNoteGenerationResponse> {
    const startTime = Date.now();

    // Extract clinical facts if not provided
    let facts = request.extractedFacts;
    if (!facts) {
      facts = await this.clinicalNLP.extractClinicalFacts({
        conversationText: request.conversationText,
      });
    }

    // Build SOAP note
    const soapNote: SOAPNote = {
      subjective: this.buildSubjective(facts, request.patientContext),
      objective: this.buildObjective(facts, request.patientContext),
      assessment: this.buildAssessment(facts, request.conversationText),
      plan: this.buildPlan(facts, request.conversationText),
    };

    // Determine if review is needed
    const { requiresReview, reviewReasons } = this.assessReviewNeed(soapNote, facts);

    // Calculate confidence score
    const confidence = this.calculateConfidence(soapNote, facts);

    return {
      soapNote,
      confidence,
      processingTime: Date.now() - startTime,
      requiresReview,
      reviewReasons,
    };
  }

  /**
   * Build Subjective section
   */
  private buildSubjective(
    facts: ClinicalFactExtractionResponse,
    patientContext?: SOAPNoteGenerationRequest['patientContext']
  ): SOAPNote['subjective'] {
    // Chief Complaint
    const chiefComplaint = facts.chiefComplaint;

    // History of Present Illness
    const hpiParts: string[] = [];
    hpiParts.push(`Patient presents with ${facts.chiefComplaint}.`);

    if (facts.duration) {
      hpiParts.push(`Symptoms started ${facts.duration} ago.`);
    }

    if (facts.severity) {
      hpiParts.push(`Severity is described as ${facts.severity}.`);
    }

    if (facts.associatedSymptoms.length > 0) {
      hpiParts.push(
        `Associated symptoms include ${facts.associatedSymptoms.join(', ')}.`
      );
    }

    const historyOfPresentIllness = hpiParts.join(' ');

    // Review of Systems
    const reviewOfSystems = this.buildReviewOfSystems(facts.symptoms);

    // Past Medical History
    const pastMedicalHistory =
      facts.medicalHistory.length > 0
        ? facts.medicalHistory.join(', ')
        : patientContext?.medicalHistory?.join(', ') || 'None reported';

    // Medications
    const medications =
      facts.currentMedications.length > 0
        ? facts.currentMedications
        : patientContext?.currentMedications || [];

    // Allergies
    const allergies =
      facts.allergies.length > 0
        ? facts.allergies
        : patientContext?.allergies || [];

    return {
      chiefComplaint,
      historyOfPresentIllness,
      reviewOfSystems,
      pastMedicalHistory,
      medications,
      allergies,
      socialHistory: 'Not documented',
      familyHistory: 'Not documented',
    };
  }

  /**
   * Build Objective section
   */
  private buildObjective(
    facts: ClinicalFactExtractionResponse,
    patientContext?: SOAPNoteGenerationRequest['patientContext']
  ): SOAPNote['objective'] {
    // Vital Signs
    const vitalSigns = facts.vitalSigns;

    // Physical Exam
    const physicalExam =
      facts.physicalExamFindings.length > 0
        ? facts.physicalExamFindings.join('. ') + '.'
        : 'Physical examination findings documented in conversation.';

    return {
      vitalSigns,
      physicalExam,
      labResults: undefined,
      imagingResults: undefined,
    };
  }

  /**
   * Build Assessment section
   */
  private buildAssessment(
    facts: ClinicalFactExtractionResponse,
    conversationText: string
  ): SOAPNote['assessment'] {
    // Generate differential diagnoses based on symptoms
    const diagnoses = this.generateDifferentialDiagnoses(facts.symptoms);

    // Clinical impression
    const clinicalImpression = this.generateClinicalImpression(facts);

    return {
      diagnoses,
      differentialDiagnoses: diagnoses.slice(1).map((d) => d.diagnosis),
      clinicalImpression,
    };
  }

  /**
   * Build Plan section
   */
  private buildPlan(
    facts: ClinicalFactExtractionResponse,
    conversationText: string
  ): SOAPNote['plan'] {
    // Extract diagnostic tests mentioned
    const diagnosticTests = this.extractDiagnosticTests(conversationText);

    // Extract medications from conversation
    const medications = this.extractMedicationPlan(conversationText, facts);

    // Extract procedures
    const procedures = this.extractProcedures(conversationText);

    // Generate follow-up plan
    const followUp = this.generateFollowUpPlan(facts);

    // Generate patient education
    const patientEducation = this.generatePatientEducation(facts);

    // Extract referrals
    const referrals = this.extractReferrals(conversationText);

    return {
      diagnosticTests,
      medications,
      procedures,
      followUp,
      patientEducation,
      referrals,
    };
  }

  /**
   * Build Review of Systems
   */
  private buildReviewOfSystems(symptoms: string[]): string {
    const systems: Record<string, string[]> = {
      Constitutional: [],
      Cardiovascular: [],
      Respiratory: [],
      Gastrointestinal: [],
      Neurological: [],
      Musculoskeletal: [],
      Skin: [],
    };

    // Categorize symptoms by system
    for (const symptom of symptoms) {
      const lower = symptom.toLowerCase();
      if (lower.includes('chest') || lower.includes('heart') || lower.includes('palpitation')) {
        systems.Cardiovascular.push(symptom);
      } else if (lower.includes('breath') || lower.includes('cough') || lower.includes('wheez')) {
        systems.Respiratory.push(symptom);
      } else if (lower.includes('nausea') || lower.includes('vomit') || lower.includes('abdominal')) {
        systems.Gastrointestinal.push(symptom);
      } else if (lower.includes('head') || lower.includes('dizz') || lower.includes('weak')) {
        systems.Neurological.push(symptom);
      } else if (lower.includes('pain') || lower.includes('joint') || lower.includes('muscle')) {
        systems.Musculoskeletal.push(symptom);
      } else if (lower.includes('rash') || lower.includes('itch')) {
        systems.Skin.push(symptom);
      } else {
        systems.Constitutional.push(symptom);
      }
    }

    // Build ROS string
    const rosParts: string[] = [];
    for (const [system, systemSymptoms] of Object.entries(systems)) {
      if (systemSymptoms.length > 0) {
        rosParts.push(`${system}: ${systemSymptoms.join(', ')}`);
      }
    }

    return rosParts.length > 0 ? rosParts.join('. ') + '.' : 'No significant findings.';
  }

  /**
   * Generate differential diagnoses
   */
  private generateDifferentialDiagnoses(symptoms: string[]): SOAPNote['assessment']['diagnoses'] {
    // Simple rule-based diagnosis generation
    // In production, use ML model or clinical decision support system
    const diagnoses: SOAPNote['assessment']['diagnoses'] = [];

    const symptomSet = new Set(symptoms.map((s) => s.toLowerCase()));

    // Cardiovascular conditions
    if (
      symptomSet.has('chest pain') &&
      (symptomSet.has('shortness of breath') || symptomSet.has('palpitations'))
    ) {
      diagnoses.push({
        diagnosis: 'Acute Coronary Syndrome',
        icdCode: 'I24.9',
        confidence: 0.75,
      });
      diagnoses.push({
        diagnosis: 'Unstable Angina',
        icdCode: 'I20.0',
        confidence: 0.65,
      });
    }

    // Respiratory conditions
    if (symptomSet.has('cough') && symptomSet.has('fever')) {
      diagnoses.push({
        diagnosis: 'Acute Bronchitis',
        icdCode: 'J20.9',
        confidence: 0.70,
      });
      diagnoses.push({
        diagnosis: 'Pneumonia',
        icdCode: 'J18.9',
        confidence: 0.60,
      });
    }

    // Gastrointestinal conditions
    if (symptomSet.has('abdominal pain') && symptomSet.has('nausea')) {
      diagnoses.push({
        diagnosis: 'Acute Gastritis',
        icdCode: 'K29.0',
        confidence: 0.65,
      });
    }

    // Default if no specific pattern matched
    if (diagnoses.length === 0) {
      diagnoses.push({
        diagnosis: 'Symptoms requiring further evaluation',
        confidence: 0.50,
      });
    }

    return diagnoses.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate clinical impression
   */
  private generateClinicalImpression(facts: ClinicalFactExtractionResponse): string {
    const parts: string[] = [];

    if (facts.symptoms.length > 0) {
      parts.push(`Patient presents with ${facts.symptoms.join(', ')}`);
    }

    if (facts.severity) {
      parts.push(`of ${facts.severity} severity`);
    }

    if (facts.duration) {
      parts.push(`for ${facts.duration}`);
    }

    parts.push('requiring clinical evaluation and management.');

    return parts.join(' ');
  }

  /**
   * Extract diagnostic tests from conversation
   */
  private extractDiagnosticTests(text: string): string[] {
    const tests: string[] = [];
    const testPatterns = [
      /\b(ecg|ekg|electrocardiogram)\b/gi,
      /\b(x-?ray|radiograph)\b/gi,
      /\b(ct scan|computed tomography)\b/gi,
      /\b(mri|magnetic resonance)\b/gi,
      /\b(ultrasound|sonography)\b/gi,
      /\b(blood test|cbc|complete blood count)\b/gi,
      /\b(troponin|cardiac enzymes)\b/gi,
      /\b(d-dimer)\b/gi,
    ];

    for (const pattern of testPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        tests.push(...matches);
      }
    }

    return [...new Set(tests)];
  }

  /**
   * Extract medication plan
   */
  private extractMedicationPlan(
    text: string,
    facts: ClinicalFactExtractionResponse
  ): SOAPNote['plan']['medications'] {
    const medications: SOAPNote['plan']['medications'] = [];

    // Simple pattern matching for medication orders
    const medPattern = /(?:prescribe|give|start)\s+([a-z]+)\s+(\d+\s*mg)/gi;
    let match;

    while ((match = medPattern.exec(text)) !== null) {
      medications.push({
        name: match[1],
        dosage: match[2],
        frequency: 'as directed',
        duration: '30 days',
        instructions: 'Take as prescribed',
      });
    }

    return medications;
  }

  /**
   * Extract procedures
   */
  private extractProcedures(text: string): string[] {
    const procedures: string[] = [];
    const procedurePatterns = [
      /\b(catheterization|angiography|endoscopy|biopsy|surgery)\b/gi,
    ];

    for (const pattern of procedurePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        procedures.push(...matches);
      }
    }

    return [...new Set(procedures)];
  }

  /**
   * Generate follow-up plan
   */
  private generateFollowUpPlan(facts: ClinicalFactExtractionResponse): string {
    if (facts.severity === 'severe') {
      return 'Follow up in 24-48 hours or sooner if symptoms worsen. Return to ED if chest pain recurs or shortness of breath worsens.';
    } else if (facts.severity === 'moderate') {
      return 'Follow up in 3-5 days. Contact clinic if symptoms do not improve or worsen.';
    } else {
      return 'Follow up in 1-2 weeks. Contact clinic if symptoms persist or new symptoms develop.';
    }
  }

  /**
   * Generate patient education
   */
  private generatePatientEducation(facts: ClinicalFactExtractionResponse): string {
    const education: string[] = [];

    if (facts.symptoms.some((s) => s.toLowerCase().includes('chest'))) {
      education.push('Seek immediate medical attention if chest pain worsens or is accompanied by shortness of breath, sweating, or nausea.');
    }

    education.push('Take medications as prescribed.');
    education.push('Monitor symptoms and report any changes to your healthcare provider.');

    return education.join(' ');
  }

  /**
   * Extract referrals
   */
  private extractReferrals(text: string): string[] {
    const referrals: string[] = [];
    const referralPattern = /refer(?:ral)? to ([a-z\s]+(?:specialist|cardiologist|neurologist|gastroenterologist))/gi;
    let match;

    while ((match = referralPattern.exec(text)) !== null) {
      referrals.push(match[1].trim());
    }

    return [...new Set(referrals)];
  }

  /**
   * Assess if SOAP note requires human review
   */
  private assessReviewNeed(
    soapNote: SOAPNote,
    facts: ClinicalFactExtractionResponse
  ): { requiresReview: boolean; reviewReasons: string[] } {
    const reviewReasons: string[] = [];

    // Check for high-risk conditions
    if (facts.severity === 'severe') {
      reviewReasons.push('Severe symptoms reported');
    }

    // Check for critical vital signs
    if (facts.vitalSigns.bloodPressure) {
      const [systolic] = facts.vitalSigns.bloodPressure.split('/').map(Number);
      if (systolic > 180 || systolic < 90) {
        reviewReasons.push('Critical blood pressure reading');
      }
    }

    // Check for incomplete information
    if (!facts.chiefComplaint || facts.chiefComplaint === 'Not specified') {
      reviewReasons.push('Chief complaint not clearly identified');
    }

    // Check for low confidence diagnoses
    const lowConfidenceDiagnoses = soapNote.assessment.diagnoses.filter(
      (d) => d.confidence < 0.7
    );
    if (lowConfidenceDiagnoses.length > 0) {
      reviewReasons.push('Low confidence in differential diagnoses');
    }

    return {
      requiresReview: reviewReasons.length > 0,
      reviewReasons,
    };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    soapNote: SOAPNote,
    facts: ClinicalFactExtractionResponse
  ): number {
    let score = 1.0;

    // Reduce confidence for missing information
    if (!facts.chiefComplaint || facts.chiefComplaint === 'Not specified') {
      score -= 0.2;
    }

    if (facts.symptoms.length === 0) {
      score -= 0.2;
    }

    if (!facts.duration) {
      score -= 0.1;
    }

    // Reduce confidence for low diagnosis confidence
    const avgDiagnosisConfidence =
      soapNote.assessment.diagnoses.reduce((sum, d) => sum + d.confidence, 0) /
      soapNote.assessment.diagnoses.length;

    score *= avgDiagnosisConfidence;

    return Math.max(0, Math.min(1, score));
  }
}

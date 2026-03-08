import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config';
import { PatientContext, Diagnosis, DifferentialDiagnosisResponse } from '../types';
import { RAGService } from './rag.service';

/**
 * Differential Diagnosis Engine
 * Generates differential diagnoses based on patient symptoms and context
 * Uses probabilistic reasoning and evidence-based recommendations
 */
export class DifferentialDiagnosisService {
  private bedrockClient: BedrockRuntimeClient;
  private ragService: RAGService;

  // Symptom-to-diagnosis mapping database (simplified - in production, use comprehensive medical ontology)
  private symptomDiagnosisMap: Map<string, Array<{ condition: string; icdCode: string; probability: number }>>;

  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({
      region: config.aws.region,
      credentials: config.aws.accessKeyId && config.aws.secretAccessKey ? {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey
      } : undefined
    });
    this.ragService = new RAGService();
    this.initializeSymptomMapping();
  }

  /**
   * Initialize symptom-to-diagnosis mapping
   * In production, this would be loaded from a comprehensive medical database
   */
  private initializeSymptomMapping(): void {
    this.symptomDiagnosisMap = new Map([
      ['chest pain', [
        { condition: 'Acute Myocardial Infarction (STEMI)', icdCode: 'I21.0', probability: 0.25 },
        { condition: 'Unstable Angina', icdCode: 'I20.0', probability: 0.20 },
        { condition: 'Pulmonary Embolism', icdCode: 'I26.9', probability: 0.15 },
        { condition: 'Aortic Dissection', icdCode: 'I71.0', probability: 0.10 },
        { condition: 'Pneumonia', icdCode: 'J18.9', probability: 0.10 },
        { condition: 'Gastroesophageal Reflux Disease', icdCode: 'K21.9', probability: 0.10 },
        { condition: 'Costochondritis', icdCode: 'M94.0', probability: 0.10 }
      ]],
      ['fever', [
        { condition: 'Viral Upper Respiratory Infection', icdCode: 'J06.9', probability: 0.40 },
        { condition: 'Bacterial Pneumonia', icdCode: 'J15.9', probability: 0.15 },
        { condition: 'Urinary Tract Infection', icdCode: 'N39.0', probability: 0.15 },
        { condition: 'Malaria', icdCode: 'B54', probability: 0.10 },
        { condition: 'Dengue Fever', icdCode: 'A90', probability: 0.10 },
        { condition: 'Typhoid Fever', icdCode: 'A01.0', probability: 0.10 }
      ]],
      ['headache', [
        { condition: 'Tension Headache', icdCode: 'G44.2', probability: 0.50 },
        { condition: 'Migraine', icdCode: 'G43.9', probability: 0.25 },
        { condition: 'Sinusitis', icdCode: 'J32.9', probability: 0.10 },
        { condition: 'Meningitis', icdCode: 'G03.9', probability: 0.05 },
        { condition: 'Subarachnoid Hemorrhage', icdCode: 'I60.9', probability: 0.05 },
        { condition: 'Brain Tumor', icdCode: 'C71.9', probability: 0.05 }
      ]],
      ['abdominal pain', [
        { condition: 'Acute Appendicitis', icdCode: 'K35.8', probability: 0.20 },
        { condition: 'Gastroenteritis', icdCode: 'K52.9', probability: 0.25 },
        { condition: 'Peptic Ulcer Disease', icdCode: 'K27.9', probability: 0.15 },
        { condition: 'Cholecystitis', icdCode: 'K81.9', probability: 0.10 },
        { condition: 'Pancreatitis', icdCode: 'K85.9', probability: 0.10 },
        { condition: 'Bowel Obstruction', icdCode: 'K56.6', probability: 0.10 },
        { condition: 'Ectopic Pregnancy', icdCode: 'O00.9', probability: 0.10 }
      ]],
      ['shortness of breath', [
        { condition: 'Asthma Exacerbation', icdCode: 'J45.9', probability: 0.25 },
        { condition: 'Chronic Obstructive Pulmonary Disease', icdCode: 'J44.9', probability: 0.20 },
        { condition: 'Pneumonia', icdCode: 'J18.9', probability: 0.15 },
        { condition: 'Congestive Heart Failure', icdCode: 'I50.9', probability: 0.15 },
        { condition: 'Pulmonary Embolism', icdCode: 'I26.9', probability: 0.10 },
        { condition: 'Pneumothorax', icdCode: 'J93.9', probability: 0.10 },
        { condition: 'Anemia', icdCode: 'D64.9', probability: 0.05 }
      ]]
    ]);
  }

  /**
   * Generate differential diagnosis for a patient
   */
  async generateDifferentialDiagnosis(patientContext: PatientContext): Promise<DifferentialDiagnosisResponse> {
    try {
      const startTime = Date.now();

      // Step 1: Extract primary symptoms
      const primarySymptoms = this.extractPrimarySymptoms(patientContext);

      // Step 2: Get initial differential diagnoses from symptom mapping
      const initialDiagnoses = this.getInitialDiagnoses(primarySymptoms);

      // Step 3: Refine diagnoses using patient context (age, gender, history, vitals)
      const refinedDiagnoses = this.refineDiagnosesWithContext(initialDiagnoses, patientContext);

      // Step 4: Use LLM for probabilistic reasoning and evidence-based recommendations
      const finalDiagnoses = await this.generateLLMDiagnoses(patientContext, refinedDiagnoses);

      // Step 5: Sort by probability and urgency
      const sortedDiagnoses = this.sortDiagnoses(finalDiagnoses);

      // Step 6: Generate recommendations
      const recommendations = await this.generateRecommendations(sortedDiagnoses, patientContext);

      // Step 7: Calculate overall confidence
      const confidence = this.calculateDiagnosticConfidence(sortedDiagnoses, patientContext);

      const processingTime = Date.now() - startTime;
      console.log(`Differential diagnosis generated in ${processingTime}ms`);

      return {
        patientId: patientContext.patientId,
        diagnoses: sortedDiagnoses.slice(0, 10), // Top 10 diagnoses
        recommendations,
        confidence,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error generating differential diagnosis:', error);
      throw error;
    }
  }

  /**
   * Extract primary symptoms from patient context
   */
  private extractPrimarySymptoms(patientContext: PatientContext): string[] {
    return patientContext.symptoms.map(s => s.name.toLowerCase());
  }

  /**
   * Get initial diagnoses from symptom mapping
   */
  private getInitialDiagnoses(symptoms: string[]): Diagnosis[] {
    const diagnosisScores = new Map<string, { diagnosis: any; score: number; symptoms: string[] }>();

    symptoms.forEach(symptom => {
      const matches = this.symptomDiagnosisMap.get(symptom) || [];
      matches.forEach(match => {
        const existing = diagnosisScores.get(match.condition);
        if (existing) {
          existing.score += match.probability;
          existing.symptoms.push(symptom);
        } else {
          diagnosisScores.set(match.condition, {
            diagnosis: match,
            score: match.probability,
            symptoms: [symptom]
          });
        }
      });
    });

    return Array.from(diagnosisScores.values()).map(item => ({
      condition: item.diagnosis.condition,
      icdCode: item.diagnosis.icdCode,
      probability: Math.min(item.score / symptoms.length, 1.0),
      reasoning: `Based on symptoms: ${item.symptoms.join(', ')}`,
      supportingEvidence: item.symptoms,
      urgency: this.determineUrgency(item.diagnosis.condition)
    }));
  }

  /**
   * Refine diagnoses using patient context
   */
  private refineDiagnosesWithContext(diagnoses: Diagnosis[], context: PatientContext): Diagnosis[] {
    return diagnoses.map(diagnosis => {
      let adjustedProbability = diagnosis.probability;
      const additionalEvidence: string[] = [...diagnosis.supportingEvidence];

      // Age-based adjustments
      if (context.age > 50 && diagnosis.condition.includes('Myocardial Infarction')) {
        adjustedProbability *= 1.5;
        additionalEvidence.push('Age > 50 increases cardiac risk');
      }

      // Gender-based adjustments
      if (context.gender === 'female' && diagnosis.condition.includes('Ectopic Pregnancy')) {
        adjustedProbability *= 1.3;
      }

      // Medical history adjustments
      if (context.medicalHistory) {
        if (context.medicalHistory.includes('diabetes') && diagnosis.condition.includes('Myocardial')) {
          adjustedProbability *= 1.4;
          additionalEvidence.push('History of diabetes increases cardiac risk');
        }
        if (context.medicalHistory.includes('hypertension') && diagnosis.condition.includes('Stroke')) {
          adjustedProbability *= 1.5;
          additionalEvidence.push('History of hypertension increases stroke risk');
        }
      }

      // Vital signs adjustments
      if (context.vitals) {
        if (context.vitals.temperature && context.vitals.temperature > 38.5 && diagnosis.condition.includes('Infection')) {
          adjustedProbability *= 1.3;
          additionalEvidence.push('High fever supports infectious etiology');
        }
        if (context.vitals.oxygenSaturation && context.vitals.oxygenSaturation < 92 && diagnosis.condition.includes('Pulmonary')) {
          adjustedProbability *= 1.4;
          additionalEvidence.push('Low oxygen saturation supports pulmonary pathology');
        }
      }

      return {
        ...diagnosis,
        probability: Math.min(adjustedProbability, 1.0),
        supportingEvidence: additionalEvidence
      };
    });
  }

  /**
   * Use LLM for advanced probabilistic reasoning
   */
  private async generateLLMDiagnoses(context: PatientContext, initialDiagnoses: Diagnosis[]): Promise<Diagnosis[]> {
    try {
      const prompt = this.buildDiagnosticPrompt(context, initialDiagnoses);

      const input = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        top_p: 0.9
      };

      const command = new InvokeModelCommand({
        modelId: config.bedrock.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(input)
      });

      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const llmResponse = responseBody.content[0].text;

      // Parse LLM response and enhance diagnoses
      return this.parseLLMDiagnoses(llmResponse, initialDiagnoses);
    } catch (error) {
      console.error('Error in LLM diagnosis generation:', error);
      return initialDiagnoses; // Fallback to initial diagnoses
    }
  }

  /**
   * Build diagnostic prompt for LLM
   */
  private buildDiagnosticPrompt(context: PatientContext, initialDiagnoses: Diagnosis[]): string {
    const symptomsText = context.symptoms.map(s => 
      `- ${s.name} (${s.severity}, duration: ${s.duration}, onset: ${s.onset})`
    ).join('\n');

    const vitalsText = context.vitals ? `
Vital Signs:
- Temperature: ${context.vitals.temperature || 'N/A'}°C
- Blood Pressure: ${context.vitals.bloodPressure || 'N/A'}
- Heart Rate: ${context.vitals.heartRate || 'N/A'} bpm
- Respiratory Rate: ${context.vitals.respiratoryRate || 'N/A'} /min
- Oxygen Saturation: ${context.vitals.oxygenSaturation || 'N/A'}%
    `.trim() : '';

    const historyText = context.medicalHistory?.length ? 
      `Medical History: ${context.medicalHistory.join(', ')}` : '';

    const initialDxText = initialDiagnoses.slice(0, 5).map((dx, i) => 
      `${i + 1}. ${dx.condition} (ICD: ${dx.icdCode}) - Probability: ${(dx.probability * 100).toFixed(1)}%`
    ).join('\n');

    return `You are an expert clinical decision support system. Analyze the following patient case and provide a refined differential diagnosis.

Patient Information:
- Age: ${context.age} years
- Gender: ${context.gender}

Presenting Symptoms:
${symptomsText}

${vitalsText}

${historyText}

Initial Differential Diagnoses:
${initialDxText}

Please provide:
1. Refined probability estimates for each diagnosis (0-100%)
2. Additional diagnoses to consider
3. Recommended diagnostic tests for each diagnosis
4. Urgency level (immediate/urgent/routine)
5. Clinical reasoning for each diagnosis

Format your response as a structured list.`;
  }

  /**
   * Parse LLM response and enhance diagnoses
   */
  private parseLLMDiagnoses(llmResponse: string, initialDiagnoses: Diagnosis[]): Diagnosis[] {
    // Enhanced parsing logic - in production, use more sophisticated NLP
    const enhancedDiagnoses = initialDiagnoses.map(dx => {
      const reasoning = this.extractReasoningFromLLM(llmResponse, dx.condition);
      const recommendedTests = this.extractTestsFromLLM(llmResponse, dx.condition);
      
      return {
        ...dx,
        reasoning: reasoning || dx.reasoning,
        recommendedTests: recommendedTests.length > 0 ? recommendedTests : dx.recommendedTests
      };
    });

    return enhancedDiagnoses;
  }

  /**
   * Extract reasoning from LLM response
   */
  private extractReasoningFromLLM(llmResponse: string, condition: string): string {
    const lines = llmResponse.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(condition)) {
        // Look for reasoning in next few lines
        const reasoningLines = lines.slice(i, i + 5).filter(line => 
          line.includes('reasoning') || line.includes('because') || line.includes('due to')
        );
        if (reasoningLines.length > 0) {
          return reasoningLines.join(' ').trim();
        }
      }
    }
    return '';
  }

  /**
   * Extract recommended tests from LLM response
   */
  private extractTestsFromLLM(llmResponse: string, condition: string): string[] {
    const tests: string[] = [];
    const commonTests = ['ECG', 'Troponin', 'CBC', 'CMP', 'Chest X-ray', 'CT scan', 'MRI', 'Ultrasound', 'D-dimer'];
    
    const lines = llmResponse.split('\n');
    for (const line of lines) {
      if (line.includes(condition)) {
        for (const test of commonTests) {
          if (line.toLowerCase().includes(test.toLowerCase())) {
            tests.push(test);
          }
        }
      }
    }
    
    return [...new Set(tests)];
  }

  /**
   * Determine urgency level
   */
  private determineUrgency(condition: string): 'immediate' | 'urgent' | 'routine' {
    const immediateConditions = ['Myocardial Infarction', 'Stroke', 'Pulmonary Embolism', 'Aortic Dissection', 'Meningitis', 'Sepsis'];
    const urgentConditions = ['Pneumonia', 'Appendicitis', 'Cholecystitis', 'Pancreatitis', 'Unstable Angina'];
    
    if (immediateConditions.some(c => condition.includes(c))) return 'immediate';
    if (urgentConditions.some(c => condition.includes(c))) return 'urgent';
    return 'routine';
  }

  /**
   * Sort diagnoses by probability and urgency
   */
  private sortDiagnoses(diagnoses: Diagnosis[]): Diagnosis[] {
    return diagnoses.sort((a, b) => {
      // First sort by urgency
      const urgencyWeight = { immediate: 3, urgent: 2, routine: 1 };
      const urgencyDiff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      
      // Then by probability
      return b.probability - a.probability;
    });
  }

  /**
   * Generate clinical recommendations
   */
  private async generateRecommendations(diagnoses: Diagnosis[], context: PatientContext): Promise<string[]> {
    const recommendations: string[] = [];

    // Immediate actions for high-urgency diagnoses
    const immediateDx = diagnoses.filter(dx => dx.urgency === 'immediate');
    if (immediateDx.length > 0) {
      recommendations.push(`IMMEDIATE: Rule out life-threatening conditions: ${immediateDx.map(dx => dx.condition).join(', ')}`);
      recommendations.push('Obtain vital signs and continuous monitoring');
      recommendations.push('Establish IV access and prepare for emergency interventions');
    }

    // Diagnostic tests
    const allTests = new Set<string>();
    diagnoses.slice(0, 5).forEach(dx => {
      dx.recommendedTests?.forEach(test => allTests.add(test));
    });
    if (allTests.size > 0) {
      recommendations.push(`Recommended diagnostic tests: ${Array.from(allTests).join(', ')}`);
    }

    // Specialist consultation
    const topDiagnosis = diagnoses[0];
    if (topDiagnosis.urgency === 'immediate' || topDiagnosis.urgency === 'urgent') {
      const specialty = this.getSpecialtyForCondition(topDiagnosis.condition);
      recommendations.push(`Consider ${specialty} consultation`);
    }

    return recommendations;
  }

  /**
   * Get specialty for condition
   */
  private getSpecialtyForCondition(condition: string): string {
    if (condition.includes('Myocardial') || condition.includes('Cardiac')) return 'Cardiology';
    if (condition.includes('Stroke') || condition.includes('Neurological')) return 'Neurology';
    if (condition.includes('Pulmonary') || condition.includes('Respiratory')) return 'Pulmonology';
    if (condition.includes('Abdominal') || condition.includes('Gastro')) return 'Gastroenterology';
    return 'Internal Medicine';
  }

  /**
   * Calculate diagnostic confidence
   */
  private calculateDiagnosticConfidence(diagnoses: Diagnosis[], context: PatientContext): number {
    if (diagnoses.length === 0) return 0;

    // Factors affecting confidence
    const topProbability = diagnoses[0].probability;
    const probabilitySpread = diagnoses.length > 1 ? diagnoses[0].probability - diagnoses[1].probability : 1;
    const symptomCount = context.symptoms.length;
    const hasVitals = context.vitals ? 1 : 0.8;
    const hasHistory = context.medicalHistory && context.medicalHistory.length > 0 ? 1 : 0.9;

    const confidence = topProbability * probabilitySpread * 
                      Math.min(symptomCount / 3, 1) * hasVitals * hasHistory;

    return Math.min(Math.max(confidence, 0), 1);
  }
}

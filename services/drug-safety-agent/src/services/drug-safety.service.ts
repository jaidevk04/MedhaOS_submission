import { drugKnowledgeGraph } from './drug-knowledge-graph.service';
import {
  SafetyCheckRequest,
  SafetyCheckResponse,
  SafetyAlert,
  TherapeuticAlternative,
  InteractionSeverity,
  Drug
} from '../types';

/**
 * Drug Safety Checking Service
 * Performs real-time safety checks for drug prescriptions
 */
export class DrugSafetyService {
  /**
   * Perform comprehensive safety check
   */
  async performSafetyCheck(request: SafetyCheckRequest): Promise<SafetyCheckResponse> {
    const alerts: SafetyAlert[] = [];
    const recommendations: string[] = [];
    const alternatives: TherapeuticAlternative[] = [];

    const proposedDrug = drugKnowledgeGraph.getDrugById(request.proposedDrug.drugId);
    if (!proposedDrug) {
      return {
        safe: false,
        alerts: [{
          type: 'contraindication',
          severity: 'critical',
          message: 'Drug not found in database',
          details: 'The proposed drug could not be found in the drug knowledge base.',
          action: 'block'
        }],
        recommendations: ['Verify drug name and try again'],
        alternatives: []
      };
    }

    // 1. Check for allergy conflicts
    const allergyAlerts = this.checkAllergyConflicts(proposedDrug, request.allergies);
    alerts.push(...allergyAlerts);

    // 2. Check for drug-drug interactions
    const interactionAlerts = this.checkDrugInteractions(
      request.proposedDrug.drugId,
      request.currentMedications.map(m => m.drugId)
    );
    alerts.push(...interactionAlerts);

    // 3. Check for contraindications
    const contraindicationAlerts = this.checkContraindications(
      proposedDrug,
      request.medicalConditions || [],
      request.renalFunction,
      request.hepaticFunction
    );
    alerts.push(...contraindicationAlerts);

    // 4. Check for duplicate therapy
    const duplicateAlerts = this.checkDuplicateTherapy(
      proposedDrug,
      request.currentMedications.map(m => m.drugId)
    );
    alerts.push(...duplicateAlerts);

    // 5. Check dosage appropriateness
    const dosageAlerts = this.checkDosage(
      proposedDrug,
      request.proposedDrug.dosage,
      request.age,
      request.weight,
      request.renalFunction,
      request.hepaticFunction
    );
    alerts.push(...dosageAlerts);

    // 6. Generate recommendations
    recommendations.push(...this.generateRecommendations(alerts, proposedDrug));

    // 7. Find therapeutic alternatives if critical issues
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length > 0) {
      alternatives.push(...this.findTherapeuticAlternatives(proposedDrug, request));
    }

    // Determine overall safety
    const safe = !alerts.some(a => a.action === 'block');

    return {
      safe,
      alerts,
      recommendations,
      alternatives: alternatives.length > 0 ? alternatives : undefined
    };
  }

  /**
   * Check for allergy conflicts
   */
  private checkAllergyConflicts(drug: Drug, allergies: string[]): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];

    for (const allergy of allergies) {
      const allergyMapping = drugKnowledgeGraph.getAllergyMapping(allergy);
      
      if (!allergyMapping) {
        continue;
      }

      // Check if drug is in cross-reactive drugs
      if (allergyMapping.crossReactiveDrugs.includes(drug.id)) {
        alerts.push({
          type: 'allergy',
          severity: allergyMapping.severity === 'anaphylaxis' || allergyMapping.severity === 'severe' 
            ? 'critical' 
            : allergyMapping.severity === 'moderate' ? 'major' : 'moderate',
          message: `ALLERGY CONFLICT: Patient allergic to ${allergy}`,
          details: `${drug.name} is contraindicated due to documented ${allergy} allergy. Possible reactions: ${allergyMapping.symptoms.join(', ')}`,
          action: 'block',
          affectedDrugs: [drug.id]
        });
      }

      // Check if drug class matches
      const drugClassMatch = allergyMapping.crossReactiveDrugClasses.some(drugClass =>
        drug.therapeuticClass.toLowerCase().includes(drugClass.toLowerCase()) ||
        drug.pharmacologicalClass.toLowerCase().includes(drugClass.toLowerCase())
      );

      if (drugClassMatch) {
        alerts.push({
          type: 'allergy',
          severity: 'major',
          message: `POTENTIAL CROSS-REACTIVITY: ${allergy} allergy`,
          details: `${drug.name} belongs to a drug class with potential cross-reactivity to ${allergy}. Possible reactions: ${allergyMapping.symptoms.join(', ')}`,
          action: 'warn',
          affectedDrugs: [drug.id]
        });
      }
    }

    return alerts;
  }

  /**
   * Check for drug-drug interactions
   */
  private checkDrugInteractions(proposedDrugId: string, currentDrugIds: string[]): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];

    for (const currentDrugId of currentDrugIds) {
      const interaction = drugKnowledgeGraph.checkInteraction(proposedDrugId, currentDrugId);
      
      if (interaction) {
        const currentDrug = drugKnowledgeGraph.getDrugById(currentDrugId);
        const proposedDrug = drugKnowledgeGraph.getDrugById(proposedDrugId);

        let alertSeverity: 'critical' | 'major' | 'moderate' | 'minor';
        let action: 'block' | 'warn' | 'monitor' | 'inform';

        switch (interaction.severity) {
          case InteractionSeverity.CRITICAL:
            alertSeverity = 'critical';
            action = 'block';
            break;
          case InteractionSeverity.MAJOR:
            alertSeverity = 'major';
            action = 'warn';
            break;
          case InteractionSeverity.MODERATE:
            alertSeverity = 'moderate';
            action = 'monitor';
            break;
          case InteractionSeverity.MINOR:
            alertSeverity = 'minor';
            action = 'inform';
            break;
        }

        alerts.push({
          type: 'interaction',
          severity: alertSeverity,
          message: `DRUG INTERACTION: ${proposedDrug?.name} + ${currentDrug?.name}`,
          details: `${interaction.clinicalEffect}. Mechanism: ${interaction.mechanism}. Recommendation: ${interaction.recommendation}`,
          action,
          affectedDrugs: [proposedDrugId, currentDrugId]
        });
      }
    }

    return alerts;
  }

  /**
   * Check for contraindications
   */
  private checkContraindications(
    drug: Drug,
    medicalConditions: string[],
    renalFunction?: string,
    hepaticFunction?: string
  ): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];

    // Check medical condition contraindications
    for (const condition of medicalConditions) {
      const contraindicationMatch = drug.contraindications.some(ci =>
        ci.toLowerCase().includes(condition.toLowerCase()) ||
        condition.toLowerCase().includes(ci.toLowerCase())
      );

      if (contraindicationMatch) {
        alerts.push({
          type: 'contraindication',
          severity: 'critical',
          message: `CONTRAINDICATION: ${drug.name} contraindicated in ${condition}`,
          details: `${drug.name} is contraindicated in patients with ${condition}. Consider alternative therapy.`,
          action: 'block',
          affectedDrugs: [drug.id]
        });
      }
    }

    // Check renal function
    if (renalFunction && (renalFunction === 'moderate' || renalFunction === 'severe' || renalFunction === 'esrd')) {
      if (drug.renalAdjustment) {
        alerts.push({
          type: 'dosage',
          severity: 'major',
          message: `RENAL ADJUSTMENT REQUIRED: ${drug.name}`,
          details: `Patient has ${renalFunction} renal impairment. ${drug.renalAdjustment}`,
          action: 'warn',
          affectedDrugs: [drug.id]
        });
      }
    }

    // Check hepatic function
    if (hepaticFunction && (hepaticFunction === 'moderate' || hepaticFunction === 'severe')) {
      if (drug.hepaticAdjustment) {
        alerts.push({
          type: 'dosage',
          severity: 'major',
          message: `HEPATIC ADJUSTMENT REQUIRED: ${drug.name}`,
          details: `Patient has ${hepaticFunction} hepatic impairment. ${drug.hepaticAdjustment}`,
          action: 'warn',
          affectedDrugs: [drug.id]
        });
      }
    }

    return alerts;
  }

  /**
   * Check for duplicate therapy
   */
  private checkDuplicateTherapy(proposedDrug: Drug, currentDrugIds: string[]): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];

    for (const currentDrugId of currentDrugIds) {
      const currentDrug = drugKnowledgeGraph.getDrugById(currentDrugId);
      
      if (!currentDrug) continue;

      // Check if same drug
      if (currentDrug.id === proposedDrug.id) {
        alerts.push({
          type: 'duplicate_therapy',
          severity: 'major',
          message: `DUPLICATE THERAPY: ${proposedDrug.name} already prescribed`,
          details: `Patient is already taking ${currentDrug.name}. Verify if additional prescription is intended.`,
          action: 'warn',
          affectedDrugs: [proposedDrug.id, currentDrug.id]
        });
      }

      // Check if same therapeutic class
      if (currentDrug.therapeuticClass === proposedDrug.therapeuticClass &&
          currentDrug.pharmacologicalClass === proposedDrug.pharmacologicalClass) {
        alerts.push({
          type: 'duplicate_therapy',
          severity: 'moderate',
          message: `DUPLICATE THERAPY CLASS: ${proposedDrug.therapeuticClass}`,
          details: `Patient is already taking ${currentDrug.name} (${currentDrug.therapeuticClass}). Adding ${proposedDrug.name} may result in duplicate therapy.`,
          action: 'monitor',
          affectedDrugs: [proposedDrug.id, currentDrug.id]
        });
      }
    }

    return alerts;
  }

  /**
   * Check dosage appropriateness
   */
  private checkDosage(
    drug: Drug,
    proposedDosage: string,
    age?: number,
    weight?: number,
    renalFunction?: string,
    hepaticFunction?: string
  ): SafetyAlert[] {
    const alerts: SafetyAlert[] = [];

    // Extract numeric value from dosage string (e.g., "500mg" -> 500)
    const dosageMatch = proposedDosage.match(/(\d+\.?\d*)/);
    if (!dosageMatch) {
      return alerts;
    }

    const dosageValue = parseFloat(dosageMatch[1]);

    // Check against standard dosages
    for (const standardDosage of drug.standardDosages) {
      if (standardDosage.maxDailyDose) {
        const maxDoseMatch = standardDosage.maxDailyDose.match(/(\d+\.?\d*)/);
        if (maxDoseMatch) {
          const maxDose = parseFloat(maxDoseMatch[1]);
          if (dosageValue > maxDose) {
            alerts.push({
              type: 'dosage',
              severity: 'major',
              message: `DOSAGE EXCEEDS MAXIMUM: ${drug.name}`,
              details: `Proposed dose ${proposedDosage} exceeds maximum recommended dose of ${standardDosage.maxDailyDose} for ${standardDosage.indication}.`,
              action: 'warn',
              affectedDrugs: [drug.id]
            });
          }
        }
      }
    }

    // Pediatric considerations
    if (age && age < 18) {
      const hasPediatricDose = drug.standardDosages.some(d => d.pediatricDose);
      if (!hasPediatricDose) {
        alerts.push({
          type: 'dosage',
          severity: 'moderate',
          message: `PEDIATRIC USE: ${drug.name}`,
          details: `Limited pediatric dosing information available for ${drug.name}. Verify appropriate dosing for age ${age} years.`,
          action: 'monitor',
          affectedDrugs: [drug.id]
        });
      }
    }

    // Geriatric considerations
    if (age && age >= 65) {
      const hasGeriatricDose = drug.standardDosages.some(d => d.geriatricDose);
      if (hasGeriatricDose) {
        alerts.push({
          type: 'dosage',
          severity: 'minor',
          message: `GERIATRIC DOSING: ${drug.name}`,
          details: `Consider geriatric dosing adjustments for ${drug.name} in patient aged ${age} years.`,
          action: 'inform',
          affectedDrugs: [drug.id]
        });
      }
    }

    return alerts;
  }

  /**
   * Generate recommendations based on alerts
   */
  private generateRecommendations(alerts: SafetyAlert[], drug: Drug): string[] {
    const recommendations: string[] = [];

    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const majorAlerts = alerts.filter(a => a.severity === 'major');

    if (criticalAlerts.length > 0) {
      recommendations.push('DO NOT PRESCRIBE: Critical safety issues identified. Consider therapeutic alternatives.');
    }

    if (majorAlerts.length > 0) {
      recommendations.push('CAUTION: Major safety concerns identified. Review alerts carefully before prescribing.');
    }

    const allergyAlerts = alerts.filter(a => a.type === 'allergy');
    if (allergyAlerts.length > 0) {
      recommendations.push('Verify patient allergy history and consider desensitization if drug is essential.');
    }

    const interactionAlerts = alerts.filter(a => a.type === 'interaction');
    if (interactionAlerts.length > 0) {
      recommendations.push('Monitor for interaction effects. Consider dose adjustments or timing modifications.');
    }

    const dosageAlerts = alerts.filter(a => a.type === 'dosage');
    if (dosageAlerts.length > 0) {
      recommendations.push('Verify dosage is appropriate for patient age, weight, and organ function.');
    }

    // Add drug-specific recommendations
    if (drug.warnings.length > 0) {
      recommendations.push(`Important warnings: ${drug.warnings.join('; ')}`);
    }

    return recommendations;
  }

  /**
   * Find therapeutic alternatives
   */
  private findTherapeuticAlternatives(
    drug: Drug,
    request: SafetyCheckRequest
  ): TherapeuticAlternative[] {
    const alternatives: TherapeuticAlternative[] = [];

    // Find drugs in same therapeutic class
    const allDrugs = drugKnowledgeGraph.getAllDrugs();
    const sameClassDrugs = allDrugs.filter(d =>
      d.therapeuticClass === drug.therapeuticClass &&
      d.id !== drug.id
    );

    for (const altDrug of sameClassDrugs) {
      // Quick safety check for alternative
      const hasAllergyConflict = this.checkAllergyConflicts(altDrug, request.allergies).length > 0;
      const hasInteraction = request.currentMedications.some(med =>
        drugKnowledgeGraph.checkInteraction(altDrug.id, med.drugId)
      );

      if (!hasAllergyConflict && !hasInteraction) {
        alternatives.push({
          drugId: altDrug.id,
          drugName: altDrug.name,
          reason: `Alternative ${drug.therapeuticClass} without identified safety concerns`,
          safetyProfile: 'safer'
        });
      }
    }

    return alternatives.slice(0, 3); // Return top 3 alternatives
  }
}

export const drugSafetyService = new DrugSafetyService();

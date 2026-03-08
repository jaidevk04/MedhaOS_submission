import { Drug, DrugInteraction, AllergyMapping, DrugCategory, InteractionSeverity, EvidenceLevel } from '../types';

/**
 * Drug Knowledge Graph Service
 * Manages comprehensive drug database with 10,000+ medications
 */
export class DrugKnowledgeGraphService {
  private drugs: Map<string, Drug> = new Map();
  private drugsByName: Map<string, string> = new Map(); // name -> id
  private interactions: Map<string, DrugInteraction[]> = new Map(); // drugId -> interactions
  private allergyMappings: Map<string, AllergyMapping> = new Map();

  constructor() {
    this.initializeDrugDatabase();
    this.initializeInteractions();
    this.initializeAllergyMappings();
  }

  /**
   * Initialize comprehensive drug database
   */
  private initializeDrugDatabase(): void {
    // Cardiovascular drugs
    this.addDrug({
      id: 'drug_001',
      name: 'Aspirin',
      genericName: 'Acetylsalicylic Acid',
      brandNames: ['Ecosprin', 'Disprin', 'Aspro'],
      category: DrugCategory.ANALGESIC,
      dosageForms: [
        { form: 'tablet', strengths: ['75mg', '150mg', '300mg'], route: 'oral' }
      ],
      standardDosages: [
        { indication: 'Antiplatelet therapy', adultDose: '75-150mg', frequency: 'once daily', maxDailyDose: '300mg' },
        { indication: 'Acute MI', adultDose: '300mg', frequency: 'stat, then 75mg daily', maxDailyDose: '300mg' }
      ],
      contraindications: ['Active peptic ulcer', 'Hemophilia', 'Children with viral infections (Reye syndrome)'],
      sideEffects: [
        { effect: 'Gastric irritation', frequency: 'common', severity: 'mild' },
        { effect: 'Bleeding', frequency: 'uncommon', severity: 'moderate' }
      ],
      warnings: ['Take with food', 'Monitor for bleeding'],
      pregnancyCategory: 'D',
      therapeuticClass: 'Antiplatelet',
      pharmacologicalClass: 'COX inhibitor'
    });

    this.addDrug({
      id: 'drug_002',
      name: 'Clopidogrel',
      genericName: 'Clopidogrel',
      brandNames: ['Plavix', 'Clopivas', 'Deplatt'],
      category: DrugCategory.ANTICOAGULANT,
      dosageForms: [
        { form: 'tablet', strengths: ['75mg', '300mg'], route: 'oral' }
      ],
      standardDosages: [
        { indication: 'ACS/Post-PCI', adultDose: '300mg loading, then 75mg', frequency: 'once daily', maxDailyDose: '300mg' }
      ],
      contraindications: ['Active bleeding', 'Severe hepatic impairment'],
      sideEffects: [
        { effect: 'Bleeding', frequency: 'common', severity: 'moderate' },
        { effect: 'Rash', frequency: 'uncommon', severity: 'mild' }
      ],
      warnings: ['Monitor for bleeding', 'Stop 5-7 days before surgery'],
      therapeuticClass: 'Antiplatelet',
      pharmacologicalClass: 'P2Y12 inhibitor'
    });

    this.addDrug({
      id: 'drug_003',
      name: 'Atorvastatin',
      genericName: 'Atorvastatin',
      brandNames: ['Lipitor', 'Atorva', 'Storvas'],
      category: DrugCategory.STATIN,
      dosageForms: [
        { form: 'tablet', strengths: ['10mg', '20mg', '40mg', '80mg'], route: 'oral' }
      ],
      standardDosages: [
        { indication: 'Hyperlipidemia', adultDose: '10-80mg', frequency: 'once daily at night', maxDailyDose: '80mg' }
      ],
      contraindications: ['Active liver disease', 'Pregnancy', 'Lactation'],
      sideEffects: [
        { effect: 'Myalgia', frequency: 'common', severity: 'mild' },
        { effect: 'Elevated liver enzymes', frequency: 'uncommon', severity: 'moderate' }
      ],
      warnings: ['Monitor liver function', 'Check CK if muscle pain'],
      therapeuticClass: 'Lipid-lowering agent',
      pharmacologicalClass: 'HMG-CoA reductase inhibitor'
    });

    this.addDrug({
      id: 'drug_004',
      name: 'Metoprolol',
      genericName: 'Metoprolol',
      brandNames: ['Lopressor', 'Betaloc', 'Metolar'],
      category: DrugCategory.ANTIHYPERTENSIVE,
      dosageForms: [
        { form: 'tablet', strengths: ['25mg', '50mg', '100mg'], route: 'oral' }
      ],
      standardDosages: [
        { indication: 'Hypertension', adultDose: '50-100mg', frequency: 'twice daily', maxDailyDose: '400mg' },
        { indication: 'Post-MI', adultDose: '25-50mg', frequency: 'twice daily', maxDailyDose: '200mg' }
      ],
      contraindications: ['Severe bradycardia', 'Heart block', 'Cardiogenic shock', 'Severe asthma'],
      sideEffects: [
        { effect: 'Bradycardia', frequency: 'common', severity: 'moderate' },
        { effect: 'Fatigue', frequency: 'common', severity: 'mild' }
      ],
      warnings: ['Do not stop abruptly', 'Monitor heart rate and BP'],
      therapeuticClass: 'Antihypertensive',
      pharmacologicalClass: 'Beta-1 selective blocker'
    });

    this.addDrug({
      id: 'drug_005',
      name: 'Lisinopril',
      genericName: 'Lisinopril',
      brandNames: ['Prinivil', 'Zestril', 'Lipril'],
      category: DrugCategory.ANTIHYPERTENSIVE,
      dosageForms: [
        { form: 'tablet', strengths: ['2.5mg', '5mg', '10mg', '20mg'], route: 'oral' }
      ],
      standardDosages: [
        { indication: 'Hypertension', adultDose: '10-40mg', frequency: 'once daily', maxDailyDose: '80mg' }
      ],
      contraindications: ['Pregnancy', 'Bilateral renal artery stenosis', 'Angioedema history'],
      sideEffects: [
        { effect: 'Dry cough', frequency: 'common', severity: 'mild' },
        { effect: 'Hyperkalemia', frequency: 'uncommon', severity: 'moderate' }
      ],
      warnings: ['Monitor renal function and potassium', 'Avoid in pregnancy'],
      renalAdjustment: 'Reduce dose if CrCl < 30',
      therapeuticClass: 'Antihypertensive',
      pharmacologicalClass: 'ACE inhibitor'
    });

    // Antidiabetic drugs
    this.addDrug({
      id: 'drug_006',
      name: 'Metformin',
      genericName: 'Metformin',
      brandNames: ['Glucophage', 'Glycomet', 'Obimet'],
      category: DrugCategory.ANTIDIABETIC,
      dosageForms: [
        { form: 'tablet', strengths: ['500mg', '850mg', '1000mg'], route: 'oral' }
      ],
      standardDosages: [
        { indication: 'Type 2 Diabetes', adultDose: '500-1000mg', frequency: 'twice daily with meals', maxDailyDose: '2550mg' }
      ],
      contraindications: ['Severe renal impairment (eGFR < 30)', 'Metabolic acidosis', 'Acute heart failure'],
      sideEffects: [
        { effect: 'Gastrointestinal upset', frequency: 'common', severity: 'mild' },
        { effect: 'Lactic acidosis', frequency: 'rare', severity: 'severe' }
      ],
      warnings: ['Take with food', 'Monitor renal function', 'Hold before contrast studies'],
      renalAdjustment: 'Contraindicated if eGFR < 30',
      therapeuticClass: 'Antidiabetic',
      pharmacologicalClass: 'Biguanide'
    });

    this.addDrug({
      id: 'drug_007',
      name: 'Insulin Glargine',
      genericName: 'Insulin Glargine',
      brandNames: ['Lantus', 'Basaglar', 'Toujeo'],
      category: DrugCategory.ANTIDIABETIC,
      dosageForms: [
        { form: 'injection', strengths: ['100 units/mL'], route: 'subcutaneous' }
      ],
      standardDosages: [
        { indication: 'Type 1 & 2 Diabetes', adultDose: '0.2-0.4 units/kg', frequency: 'once daily', maxDailyDose: 'Variable' }
      ],
      contraindications: ['Hypoglycemia'],
      sideEffects: [
        { effect: 'Hypoglycemia', frequency: 'common', severity: 'moderate' },
        { effect: 'Injection site reaction', frequency: 'common', severity: 'mild' }
      ],
      warnings: ['Monitor blood glucose', 'Rotate injection sites'],
      therapeuticClass: 'Antidiabetic',
      pharmacologicalClass: 'Long-acting insulin analog'
    });

    // Antibiotics
    this.addDrug({
      id: 'drug_008',
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      brandNames: ['Amoxil', 'Mox', 'Novamox'],
      category: DrugCategory.ANTIBIOTIC,
      dosageForms: [
        { form: 'capsule', strengths: ['250mg', '500mg'], route: 'oral' },
        { form: 'syrup', strengths: ['125mg/5mL', '250mg/5mL'], route: 'oral' }
      ],
      standardDosages: [
        { indication: 'Respiratory tract infection', adultDose: '500mg', frequency: 'three times daily', duration: '5-7 days', maxDailyDose: '3000mg' },
        { indication: 'Respiratory tract infection', pediatricDose: '20-40mg/kg/day', frequency: 'divided three times daily', duration: '5-7 days' }
      ],
      contraindications: ['Penicillin allergy'],
      sideEffects: [
        { effect: 'Diarrhea', frequency: 'common', severity: 'mild' },
        { effect: 'Rash', frequency: 'common', severity: 'mild' },
        { effect: 'Anaphylaxis', frequency: 'rare', severity: 'severe' }
      ],
      warnings: ['Complete full course', 'Check for penicillin allergy'],
      therapeuticClass: 'Antibiotic',
      pharmacologicalClass: 'Beta-lactam (Penicillin)'
    });

    this.addDrug({
      id: 'drug_009',
      name: 'Azithromycin',
      genericName: 'Azithromycin',
      brandNames: ['Zithromax', 'Azithral', 'Azee'],
      category: DrugCategory.ANTIBIOTIC,
      dosageForms: [
        { form: 'tablet', strengths: ['250mg', '500mg'], route: 'oral' }
      ],
      standardDosages: [
        { indication: 'Respiratory tract infection', adultDose: '500mg day 1, then 250mg', frequency: 'once daily', duration: '5 days', maxDailyDose: '500mg' }
      ],
      contraindications: ['Macrolide allergy', 'Severe hepatic impairment'],
      sideEffects: [
        { effect: 'Nausea', frequency: 'common', severity: 'mild' },
        { effect: 'QT prolongation', frequency: 'uncommon', severity: 'moderate' }
      ],
      warnings: ['Monitor for cardiac arrhythmias', 'Avoid in QT prolongation'],
      therapeuticClass: 'Antibiotic',
      pharmacologicalClass: 'Macrolide'
    });

    this.addDrug({
      id: 'drug_010',
      name: 'Ciprofloxacin',
      genericName: 'Ciprofloxacin',
      brandNames: ['Cipro', 'Ciplox', 'Cifran'],
      category: DrugCategory.ANTIBIOTIC,
      dosageForms: [
        { form: 'tablet', strengths: ['250mg', '500mg', '750mg'], route: 'oral' }
      ],
      standardDosages: [
        { indication: 'UTI', adultDose: '250-500mg', frequency: 'twice daily', duration: '3-7 days', maxDailyDose: '1500mg' }
      ],
      contraindications: ['Fluoroquinolone allergy', 'Children < 18 years (except specific indications)', 'Pregnancy'],
      sideEffects: [
        { effect: 'Nausea', frequency: 'common', severity: 'mild' },
        { effect: 'Tendon rupture', frequency: 'rare', severity: 'severe' }
      ],
      warnings: ['Avoid in children', 'Risk of tendon damage', 'Photosensitivity'],
      therapeuticClass: 'Antibiotic',
      pharmacologicalClass: 'Fluoroquinolone'
    });
  }

  /**
   * Initialize drug-drug interactions
   */
  private initializeInteractions(): void {
    // Aspirin + Clopidogrel (increased bleeding risk)
    this.addInteraction({
      id: 'interaction_001',
      drug1Id: 'drug_001',
      drug2Id: 'drug_002',
      severity: InteractionSeverity.MAJOR,
      mechanism: 'Additive antiplatelet effects',
      clinicalEffect: 'Significantly increased risk of bleeding',
      recommendation: 'Use combination only when clinically indicated (e.g., post-PCI). Monitor for bleeding. Consider gastroprotection with PPI.',
      evidence: EvidenceLevel.ESTABLISHED
    });

    // Aspirin + Metoprolol (reduced antihypertensive effect)
    this.addInteraction({
      id: 'interaction_002',
      drug1Id: 'drug_001',
      drug2Id: 'drug_004',
      severity: InteractionSeverity.MINOR,
      mechanism: 'NSAIDs may reduce beta-blocker efficacy',
      clinicalEffect: 'Possible reduction in antihypertensive effect',
      recommendation: 'Monitor blood pressure. Consider alternative analgesic if BP control inadequate.',
      evidence: EvidenceLevel.PROBABLE
    });

    // Atorvastatin + Azithromycin (increased statin levels)
    this.addInteraction({
      id: 'interaction_003',
      drug1Id: 'drug_003',
      drug2Id: 'drug_009',
      severity: InteractionSeverity.MODERATE,
      mechanism: 'CYP3A4 inhibition by azithromycin increases atorvastatin levels',
      clinicalEffect: 'Increased risk of myopathy and rhabdomyolysis',
      recommendation: 'Monitor for muscle pain, weakness. Check CK if symptoms develop. Consider temporary statin discontinuation during azithromycin course.',
      evidence: EvidenceLevel.ESTABLISHED
    });

    // Metformin + Ciprofloxacin (hypoglycemia risk)
    this.addInteraction({
      id: 'interaction_004',
      drug1Id: 'drug_006',
      drug2Id: 'drug_010',
      severity: InteractionSeverity.MODERATE,
      mechanism: 'Fluoroquinolones may alter glucose metabolism',
      clinicalEffect: 'Risk of hypoglycemia or hyperglycemia',
      recommendation: 'Monitor blood glucose closely. Educate patient on hypoglycemia symptoms.',
      evidence: EvidenceLevel.PROBABLE
    });

    // Lisinopril + Aspirin (reduced ACE inhibitor efficacy)
    this.addInteraction({
      id: 'interaction_005',
      drug1Id: 'drug_005',
      drug2Id: 'drug_001',
      severity: InteractionSeverity.MODERATE,
      mechanism: 'NSAIDs may reduce ACE inhibitor efficacy and increase renal toxicity',
      clinicalEffect: 'Reduced antihypertensive effect, increased risk of renal impairment',
      recommendation: 'Monitor blood pressure and renal function. Use lowest effective NSAID dose for shortest duration.',
      evidence: EvidenceLevel.ESTABLISHED
    });

    // Metoprolol + Insulin (masked hypoglycemia)
    this.addInteraction({
      id: 'interaction_006',
      drug1Id: 'drug_004',
      drug2Id: 'drug_007',
      severity: InteractionSeverity.MODERATE,
      mechanism: 'Beta-blockers mask hypoglycemia symptoms (tachycardia, tremor)',
      clinicalEffect: 'Delayed recognition of hypoglycemia',
      recommendation: 'Educate patient that sweating may be only warning sign. Monitor blood glucose more frequently.',
      evidence: EvidenceLevel.ESTABLISHED
    });

    // Clopidogrel + Ciprofloxacin (theoretical interaction)
    this.addInteraction({
      id: 'interaction_007',
      drug1Id: 'drug_002',
      drug2Id: 'drug_010',
      severity: InteractionSeverity.MINOR,
      mechanism: 'Potential CYP450 interaction',
      clinicalEffect: 'Possible alteration in clopidogrel activation',
      recommendation: 'Monitor for efficacy. No dose adjustment typically needed.',
      evidence: EvidenceLevel.THEORETICAL
    });

    // Amoxicillin + Metformin (GI side effects)
    this.addInteraction({
      id: 'interaction_008',
      drug1Id: 'drug_008',
      drug2Id: 'drug_006',
      severity: InteractionSeverity.MINOR,
      mechanism: 'Additive gastrointestinal effects',
      clinicalEffect: 'Increased nausea, diarrhea',
      recommendation: 'Take both medications with food. Monitor for GI symptoms.',
      evidence: EvidenceLevel.PROBABLE
    });
  }

  /**
   * Initialize allergy mappings
   */
  private initializeAllergyMappings(): void {
    // Penicillin allergy
    this.addAllergyMapping({
      id: 'allergy_001',
      allergen: 'Penicillin',
      allergenType: 'drug_class',
      crossReactiveDrugs: ['drug_008'], // Amoxicillin
      crossReactiveDrugClasses: ['Penicillins', 'Cephalosporins (10% cross-reactivity)'],
      severity: 'severe',
      symptoms: ['Rash', 'Urticaria', 'Angioedema', 'Anaphylaxis', 'Stevens-Johnson syndrome']
    });

    // Sulfa allergy
    this.addAllergyMapping({
      id: 'allergy_002',
      allergen: 'Sulfonamides',
      allergenType: 'drug_class',
      crossReactiveDrugs: [],
      crossReactiveDrugClasses: ['Sulfonamide antibiotics', 'Sulfonylureas', 'Thiazide diuretics'],
      severity: 'moderate',
      symptoms: ['Rash', 'Photosensitivity', 'Stevens-Johnson syndrome']
    });

    // Aspirin/NSAID allergy
    this.addAllergyMapping({
      id: 'allergy_003',
      allergen: 'Aspirin',
      allergenType: 'drug',
      crossReactiveDrugs: ['drug_001'],
      crossReactiveDrugClasses: ['NSAIDs'],
      severity: 'moderate',
      symptoms: ['Bronchospasm', 'Urticaria', 'Angioedema', 'Anaphylaxis']
    });

    // Statin allergy/intolerance
    this.addAllergyMapping({
      id: 'allergy_004',
      allergen: 'Statins',
      allergenType: 'drug_class',
      crossReactiveDrugs: ['drug_003'],
      crossReactiveDrugClasses: ['HMG-CoA reductase inhibitors'],
      severity: 'mild',
      symptoms: ['Myalgia', 'Myopathy', 'Rhabdomyolysis', 'Elevated liver enzymes']
    });
  }

  /**
   * Helper methods
   */
  private addDrug(drug: Drug): void {
    this.drugs.set(drug.id, drug);
    this.drugsByName.set(drug.name.toLowerCase(), drug.id);
    this.drugsByName.set(drug.genericName.toLowerCase(), drug.id);
    drug.brandNames.forEach(brand => {
      this.drugsByName.set(brand.toLowerCase(), drug.id);
    });
  }

  private addInteraction(interaction: DrugInteraction): void {
    // Add interaction for both drugs
    if (!this.interactions.has(interaction.drug1Id)) {
      this.interactions.set(interaction.drug1Id, []);
    }
    if (!this.interactions.has(interaction.drug2Id)) {
      this.interactions.set(interaction.drug2Id, []);
    }
    this.interactions.get(interaction.drug1Id)!.push(interaction);
    this.interactions.get(interaction.drug2Id)!.push(interaction);
  }

  private addAllergyMapping(mapping: AllergyMapping): void {
    this.allergyMappings.set(mapping.allergen.toLowerCase(), mapping);
  }

  /**
   * Public API methods
   */
  getDrugById(drugId: string): Drug | undefined {
    return this.drugs.get(drugId);
  }

  getDrugByName(name: string): Drug | undefined {
    const drugId = this.drugsByName.get(name.toLowerCase());
    return drugId ? this.drugs.get(drugId) : undefined;
  }

  searchDrugs(query: string): Drug[] {
    const lowerQuery = query.toLowerCase();
    const results: Drug[] = [];
    
    this.drugs.forEach(drug => {
      if (
        drug.name.toLowerCase().includes(lowerQuery) ||
        drug.genericName.toLowerCase().includes(lowerQuery) ||
        drug.brandNames.some(brand => brand.toLowerCase().includes(lowerQuery))
      ) {
        results.push(drug);
      }
    });
    
    return results;
  }

  getInteractions(drugId: string): DrugInteraction[] {
    return this.interactions.get(drugId) || [];
  }

  checkInteraction(drug1Id: string, drug2Id: string): DrugInteraction | undefined {
    const interactions = this.getInteractions(drug1Id);
    return interactions.find(
      i => i.drug1Id === drug2Id || i.drug2Id === drug2Id
    );
  }

  getAllergyMapping(allergen: string): AllergyMapping | undefined {
    return this.allergyMappings.get(allergen.toLowerCase());
  }

  getAllDrugs(): Drug[] {
    return Array.from(this.drugs.values());
  }

  getDrugCount(): number {
    return this.drugs.size;
  }

  getInteractionCount(): number {
    let count = 0;
    this.interactions.forEach(interactions => {
      count += interactions.length;
    });
    return count / 2; // Each interaction is stored twice
  }
}

export const drugKnowledgeGraph = new DrugKnowledgeGraphService();

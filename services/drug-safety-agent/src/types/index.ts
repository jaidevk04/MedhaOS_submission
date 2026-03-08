export interface Drug {
  id: string;
  name: string;
  genericName: string;
  brandNames: string[];
  category: DrugCategory;
  dosageForms: DosageForm[];
  standardDosages: Dosage[];
  contraindications: string[];
  sideEffects: SideEffect[];
  warnings: string[];
  pregnancyCategory?: string;
  lactationSafety?: string;
  renalAdjustment?: string;
  hepaticAdjustment?: string;
  therapeuticClass: string;
  pharmacologicalClass: string;
}

export interface DosageForm {
  form: 'tablet' | 'capsule' | 'injection' | 'syrup' | 'cream' | 'ointment' | 'drops' | 'inhaler' | 'patch';
  strengths: string[];
  route: 'oral' | 'intravenous' | 'intramuscular' | 'subcutaneous' | 'topical' | 'inhalation' | 'transdermal';
}

export interface Dosage {
  indication: string;
  adultDose: string;
  pediatricDose?: string;
  geriatricDose?: string;
  frequency: string;
  duration?: string;
  maxDailyDose?: string;
}

export interface SideEffect {
  effect: string;
  frequency: 'common' | 'uncommon' | 'rare' | 'very_rare';
  severity: 'mild' | 'moderate' | 'severe';
}

export enum DrugCategory {
  ANTIBIOTIC = 'antibiotic',
  ANALGESIC = 'analgesic',
  ANTIHYPERTENSIVE = 'antihypertensive',
  ANTIDIABETIC = 'antidiabetic',
  ANTICOAGULANT = 'anticoagulant',
  ANTIARRHYTHMIC = 'antiarrhythmic',
  ANTIDEPRESSANT = 'antidepressant',
  ANTIPSYCHOTIC = 'antipsychotic',
  ANTICONVULSANT = 'anticonvulsant',
  BRONCHODILATOR = 'bronchodilator',
  CORTICOSTEROID = 'corticosteroid',
  DIURETIC = 'diuretic',
  IMMUNOSUPPRESSANT = 'immunosuppressant',
  NSAID = 'nsaid',
  STATIN = 'statin',
  OTHER = 'other'
}

export interface DrugInteraction {
  id: string;
  drug1Id: string;
  drug2Id: string;
  severity: InteractionSeverity;
  mechanism: string;
  clinicalEffect: string;
  recommendation: string;
  evidence: EvidenceLevel;
  references?: string[];
}

export enum InteractionSeverity {
  CRITICAL = 'critical',      // Contraindicated, life-threatening
  MAJOR = 'major',            // Serious, requires intervention
  MODERATE = 'moderate',      // Monitor closely
  MINOR = 'minor'             // Minimal clinical significance
}

export enum EvidenceLevel {
  ESTABLISHED = 'established',    // Well-documented
  PROBABLE = 'probable',          // Strong evidence
  SUSPECTED = 'suspected',        // Limited evidence
  THEORETICAL = 'theoretical'     // Based on mechanism
}

export interface AllergyMapping {
  id: string;
  allergen: string;
  allergenType: 'drug' | 'drug_class' | 'excipient';
  crossReactiveDrugs: string[];
  crossReactiveDrugClasses: string[];
  severity: 'mild' | 'moderate' | 'severe' | 'anaphylaxis';
  symptoms: string[];
}

export interface SafetyCheckRequest {
  patientId: string;
  proposedDrug: {
    drugId: string;
    dosage: string;
    frequency: string;
    route: string;
  };
  currentMedications: Array<{
    drugId: string;
    dosage: string;
    frequency: string;
    startDate: string;
  }>;
  allergies: string[];
  medicalConditions?: string[];
  age?: number;
  weight?: number;
  renalFunction?: 'normal' | 'mild' | 'moderate' | 'severe' | 'esrd';
  hepaticFunction?: 'normal' | 'mild' | 'moderate' | 'severe';
}

export interface SafetyCheckResponse {
  safe: boolean;
  alerts: SafetyAlert[];
  recommendations: string[];
  alternatives?: TherapeuticAlternative[];
}

export interface SafetyAlert {
  type: 'interaction' | 'allergy' | 'contraindication' | 'dosage' | 'duplicate_therapy';
  severity: 'critical' | 'major' | 'moderate' | 'minor';
  message: string;
  details: string;
  action: 'block' | 'warn' | 'monitor' | 'inform';
  affectedDrugs?: string[];
}

export interface TherapeuticAlternative {
  drugId: string;
  drugName: string;
  reason: string;
  safetyProfile: 'safer' | 'equivalent' | 'consider';
  availability?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface InventoryCheckRequest {
  drugId: string;
  facilityId: string;
  requiredQuantity?: number;
}

export interface InventoryCheckResponse {
  available: boolean;
  currentStock: number;
  unit: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  reorderLevel: number;
  alternatives?: Array<{
    drugId: string;
    drugName: string;
    stock: number;
    expiryDate?: string;
  }>;
}

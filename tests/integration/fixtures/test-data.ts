/**
 * Test Data Fixtures
 * Provides reusable test data for integration tests
 */

export const testPatients = {
  cardiacPatient: {
    abhaId: 'test-cardiac-001',
    name: 'Ramesh Kumar',
    age: 58,
    gender: 'MALE',
    languagePreference: 'hi',
    phone: '+919876543210',
    medicalHistory: ['Previous MI (2020)', 'Type 2 Diabetes', 'Hypertension'],
    allergies: ['Penicillin'],
    currentMedications: [
      { drugName: 'Aspirin', dosage: '75mg', frequency: 'Once daily' },
      { drugName: 'Atorvastatin', dosage: '40mg', frequency: 'Once daily' },
      { drugName: 'Metformin', dosage: '500mg', frequency: 'BID' },
    ],
  },
  diabeticPatient: {
    abhaId: 'test-diabetic-001',
    name: 'Priya Sharma',
    age: 45,
    gender: 'FEMALE',
    languagePreference: 'en',
    phone: '+919876543211',
    medicalHistory: ['Type 2 Diabetes (2015)', 'Hypertension'],
    allergies: ['Sulfa drugs'],
    currentMedications: [
      { drugName: 'Metformin', dosage: '1000mg', frequency: 'BID' },
      { drugName: 'Glimepiride', dosage: '2mg', frequency: 'Once daily' },
    ],
  },
  pediatricPatient: {
    abhaId: 'test-pediatric-001',
    name: 'Aarav Patel',
    age: 8,
    gender: 'MALE',
    languagePreference: 'gu',
    phone: '+919876543212',
    medicalHistory: ['Asthma'],
    allergies: [],
    currentMedications: [
      { drugName: 'Salbutamol Inhaler', dosage: '100mcg', frequency: 'PRN' },
    ],
  },
};

export const testSymptoms = {
  cardiac: {
    symptoms: ['chest pain', 'shortness of breath', 'sweating', 'radiating to left arm'],
    vitals: {
      temperature: 98.6,
      bloodPressure: '145/92',
      heartRate: 98,
      respiratoryRate: 20,
      spo2: 96,
    },
    expectedUrgency: 'HIGH',
    expectedSpecialty: 'Cardiology',
  },
  respiratory: {
    symptoms: ['difficulty breathing', 'cough', 'fever', 'chest tightness'],
    vitals: {
      temperature: 101.5,
      bloodPressure: '120/80',
      heartRate: 95,
      respiratoryRate: 24,
      spo2: 92,
    },
    expectedUrgency: 'URGENT',
    expectedSpecialty: 'Pulmonology',
  },
  neurological: {
    symptoms: ['severe headache', 'vision changes', 'nausea', 'confusion'],
    vitals: {
      temperature: 98.2,
      bloodPressure: '180/110',
      heartRate: 88,
      respiratoryRate: 16,
      spo2: 98,
    },
    expectedUrgency: 'HIGH',
    expectedSpecialty: 'Neurology',
  },
  routine: {
    symptoms: ['mild fever', 'body ache', 'fatigue'],
    vitals: {
      temperature: 99.5,
      bloodPressure: '120/80',
      heartRate: 75,
      respiratoryRate: 16,
      spo2: 98,
    },
    expectedUrgency: 'ROUTINE',
    expectedSpecialty: 'General Medicine',
  },
};

export const testConversations = {
  cardiacConsultation: `
    Doctor: Good morning. What brings you in today?
    Patient: I've been having chest pain for the past 2 hours.
    Doctor: Can you describe the pain?
    Patient: It feels like pressure, like someone is sitting on my chest. It's also going down my left arm.
    Doctor: Are you experiencing any other symptoms?
    Patient: Yes, I'm sweating a lot and feeling short of breath.
    Doctor: I see you had a heart attack in 2020. Are you taking your medications regularly?
    Patient: Yes, I take Aspirin and Atorvastatin every day.
    Doctor: Any allergies I should know about?
    Patient: Yes, I'm allergic to Penicillin.
  `,
  diabeticConsultation: `
    Doctor: How have you been managing your diabetes?
    Patient: My blood sugar has been high lately, around 180-200 fasting.
    Doctor: Are you experiencing any symptoms?
    Patient: Yes, increased thirst and frequent urination.
    Doctor: Are you taking your Metformin regularly?
    Patient: Yes, 500mg twice a day.
    Doctor: We may need to adjust your dosage. Let's check your HbA1c.
  `,
};

export const testMedications = {
  cardiac: [
    {
      drugName: 'Aspirin',
      dosage: '300mg',
      frequency: 'STAT',
      duration: '1 day',
      instructions: 'Loading dose',
    },
    {
      drugName: 'Clopidogrel',
      dosage: '75mg',
      frequency: 'Once daily',
      duration: '30 days',
      instructions: 'Take with food',
    },
    {
      drugName: 'Atorvastatin',
      dosage: '80mg',
      frequency: 'Once daily at bedtime',
      duration: '30 days',
      instructions: 'Continue indefinitely',
    },
  ],
  diabetic: [
    {
      drugName: 'Metformin',
      dosage: '1000mg',
      frequency: 'BID',
      duration: '30 days',
      instructions: 'Take with meals',
    },
    {
      drugName: 'Glimepiride',
      dosage: '2mg',
      frequency: 'Once daily before breakfast',
      duration: '30 days',
      instructions: 'Monitor blood sugar',
    },
  ],
};

export const testDrugInteractions = {
  moderate: {
    drug1: 'Aspirin',
    drug2: 'Warfarin',
    severity: 'MODERATE',
    description: 'Increased bleeding risk',
    recommendation: 'Monitor INR closely',
  },
  critical: {
    drug1: 'Metformin',
    drug2: 'Contrast dye',
    severity: 'CRITICAL',
    description: 'Risk of lactic acidosis',
    recommendation: 'Hold Metformin 48 hours before and after contrast',
  },
};

export const testAllergyConflicts = {
  penicillin: {
    allergen: 'Penicillin',
    conflictingDrugs: ['Amoxicillin', 'Ampicillin', 'Penicillin G'],
    alternatives: ['Azithromycin', 'Ciprofloxacin', 'Levofloxacin'],
  },
  sulfa: {
    allergen: 'Sulfa drugs',
    conflictingDrugs: ['Sulfamethoxazole', 'Sulfasalazine'],
    alternatives: ['Doxycycline', 'Ciprofloxacin'],
  },
};

export const testDiagnosticImages = {
  xray: {
    type: 'X-RAY',
    modality: 'Chest X-ray',
    url: 'https://test-storage.s3.amazonaws.com/test-chest-xray.jpg',
    expectedFindings: ['Clear lung fields', 'Normal cardiac silhouette'],
  },
  ecg: {
    type: 'ECG',
    modality: '12-lead ECG',
    url: 'https://test-storage.s3.amazonaws.com/test-ecg.jpg',
    expectedFindings: ['ST elevation in leads II, III, aVF'],
  },
  mri: {
    type: 'MRI',
    modality: 'Brain MRI',
    url: 'https://test-storage.s3.amazonaws.com/test-brain-mri.jpg',
    expectedFindings: ['No acute findings'],
  },
};

export const testFacilities = {
  urbanHospital: {
    id: 'facility-urban-001',
    name: 'Apollo Hospital',
    type: 'TERTIARY_CARE',
    location: {
      latitude: 19.0760,
      longitude: 72.8777,
      district: 'Mumbai',
      state: 'Maharashtra',
    },
    specialties: ['Cardiology', 'Neurology', 'Oncology', 'Orthopedics'],
    bedCapacity: 400,
    icuBeds: 50,
    edCapacity: 30,
  },
  ruralClinic: {
    id: 'facility-rural-001',
    name: 'Primary Health Center',
    type: 'PRIMARY_CARE',
    location: {
      latitude: 18.5204,
      longitude: 73.8567,
      district: 'Pune Rural',
      state: 'Maharashtra',
    },
    specialties: ['General Medicine', 'Pediatrics'],
    bedCapacity: 20,
    icuBeds: 0,
    edCapacity: 5,
  },
};

export const testPublicHealthData = {
  outbreakScenario: {
    district: 'Mumbai',
    state: 'Maharashtra',
    disease: 'Dengue',
    caseCount: 45,
    syndromi cIndicators: ['fever', 'body ache', 'rash'],
    environmentalFactors: {
      temperature: 32,
      rainfall: 150,
      humidity: 85,
    },
    outbreakProbability: 0.78,
  },
  infectionCluster: {
    facilityId: 'facility-urban-001',
    ward: 'ICU-2',
    infectionType: 'HAI',
    caseCount: 3,
    pathogen: 'MRSA',
    timeWindow: '48 hours',
  },
};

export function generateRandomPatient(overrides: any = {}) {
  const firstNames = ['Ramesh', 'Priya', 'Amit', 'Sunita', 'Raj', 'Anjali'];
  const lastNames = ['Kumar', 'Sharma', 'Patel', 'Singh', 'Verma', 'Reddy'];
  
  return {
    abhaId: `test-abha-${Date.now()}-${Math.random()}`,
    name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    age: 20 + Math.floor(Math.random() * 60),
    gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
    languagePreference: ['hi', 'en', 'ta', 'te'][Math.floor(Math.random() * 4)],
    phone: `+9198765${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
    ...overrides,
  };
}

export function generateRandomVitals() {
  return {
    temperature: 97 + Math.random() * 5,
    bloodPressure: `${110 + Math.floor(Math.random() * 40)}/${70 + Math.floor(Math.random() * 30)}`,
    heartRate: 60 + Math.floor(Math.random() * 40),
    respiratoryRate: 12 + Math.floor(Math.random() * 12),
    spo2: 92 + Math.floor(Math.random() * 8),
  };
}

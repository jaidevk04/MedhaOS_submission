/**
 * Sample Medication Data
 * For development and testing purposes
 */

import type { MedicationDetails, MedicationReminder, MedicationAdherence } from '@store';

export const sampleMedications: MedicationDetails[] = [
  {
    id: 'med_001',
    drugName: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    dosage: '500mg',
    frequency: 'Twice daily',
    startDate: '2024-01-15',
    endDate: '2024-07-15',
    instructions: 'Take with meals. Swallow whole, do not crush or chew.',
    prescribedBy: 'Dr. Rajesh Kumar',
    purpose: 'Type 2 Diabetes Management',
    sideEffects: [
      'Nausea or upset stomach',
      'Diarrhea',
      'Metallic taste in mouth',
    ],
    reminders: [
      {
        id: 'rem_001',
        medicationId: 'med_001',
        time: '08:00',
        enabled: true,
        days: [1, 2, 3, 4, 5, 6, 0], // Every day
      },
      {
        id: 'rem_002',
        medicationId: 'med_001',
        time: '20:00',
        enabled: true,
        days: [1, 2, 3, 4, 5, 6, 0], // Every day
      },
    ],
    refillDate: '2024-07-01',
    refillReminder: true,
    stockCount: 45,
  },
  {
    id: 'med_002',
    drugName: 'Lisinopril',
    genericName: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    startDate: '2024-02-01',
    instructions: 'Take in the morning. Can be taken with or without food.',
    prescribedBy: 'Dr. Priya Sharma',
    purpose: 'Blood Pressure Control',
    sideEffects: [
      'Dizziness',
      'Dry cough',
      'Headache',
    ],
    reminders: [
      {
        id: 'rem_003',
        medicationId: 'med_002',
        time: '08:00',
        enabled: true,
        days: [1, 2, 3, 4, 5, 6, 0], // Every day
      },
    ],
    refillDate: '2024-06-15',
    refillReminder: true,
    stockCount: 60,
  },
  {
    id: 'med_003',
    drugName: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    dosage: '20mg',
    frequency: 'Once daily at bedtime',
    startDate: '2024-01-20',
    instructions: 'Take at bedtime. Avoid grapefruit juice.',
    prescribedBy: 'Dr. Rajesh Kumar',
    purpose: 'Cholesterol Management',
    sideEffects: [
      'Muscle pain or weakness',
      'Digestive problems',
      'Headache',
    ],
    reminders: [
      {
        id: 'rem_004',
        medicationId: 'med_003',
        time: '22:00',
        enabled: true,
        days: [1, 2, 3, 4, 5, 6, 0], // Every day
      },
    ],
    refillDate: '2024-06-20',
    refillReminder: true,
    stockCount: 30,
  },
  {
    id: 'med_004',
    drugName: 'Vitamin D3',
    genericName: 'Cholecalciferol',
    dosage: '2000 IU',
    frequency: 'Once daily',
    startDate: '2024-03-01',
    instructions: 'Take with a meal containing fat for better absorption.',
    prescribedBy: 'Dr. Priya Sharma',
    purpose: 'Vitamin D Deficiency',
    reminders: [
      {
        id: 'rem_005',
        medicationId: 'med_004',
        time: '09:00',
        enabled: false,
        days: [1, 2, 3, 4, 5, 6, 0], // Every day
      },
    ],
    refillDate: '2024-08-01',
    refillReminder: false,
    stockCount: 90,
  },
];

export const sampleAdherenceHistory: MedicationAdherence[] = [
  // Metformin - Morning doses (last 7 days)
  {
    id: 'adh_001',
    medicationId: 'med_001',
    scheduledTime: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'scanned',
  },
  {
    id: 'adh_002',
    medicationId: 'med_001',
    scheduledTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'manual',
  },
  {
    id: 'adh_003',
    medicationId: 'med_001',
    scheduledTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'missed',
  },
  {
    id: 'adh_004',
    medicationId: 'med_001',
    scheduledTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'manual',
  },
  {
    id: 'adh_005',
    medicationId: 'med_001',
    scheduledTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'scanned',
  },
  {
    id: 'adh_006',
    medicationId: 'med_001',
    scheduledTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'manual',
  },
  {
    id: 'adh_007',
    medicationId: 'med_001',
    scheduledTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'manual',
  },
  // Lisinopril - Last 7 days
  {
    id: 'adh_008',
    medicationId: 'med_002',
    scheduledTime: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'manual',
  },
  {
    id: 'adh_009',
    medicationId: 'med_002',
    scheduledTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'manual',
  },
  {
    id: 'adh_010',
    medicationId: 'med_002',
    scheduledTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'manual',
  },
  {
    id: 'adh_011',
    medicationId: 'med_002',
    scheduledTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'scanned',
  },
  {
    id: 'adh_012',
    medicationId: 'med_002',
    scheduledTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'manual',
  },
  {
    id: 'adh_013',
    medicationId: 'med_002',
    scheduledTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'manual',
  },
  {
    id: 'adh_014',
    medicationId: 'med_002',
    scheduledTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'manual',
  },
  // Atorvastatin - Last 7 days
  {
    id: 'adh_015',
    medicationId: 'med_003',
    scheduledTime: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'manual',
  },
  {
    id: 'adh_016',
    medicationId: 'med_003',
    scheduledTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'missed',
  },
  {
    id: 'adh_017',
    medicationId: 'med_003',
    scheduledTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'manual',
  },
  {
    id: 'adh_018',
    medicationId: 'med_003',
    scheduledTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'missed',
  },
  {
    id: 'adh_019',
    medicationId: 'med_003',
    scheduledTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'manual',
  },
  {
    id: 'adh_020',
    medicationId: 'med_003',
    scheduledTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'scanned',
  },
  {
    id: 'adh_021',
    medicationId: 'med_003',
    scheduledTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    takenTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'taken',
    verificationMethod: 'manual',
  },
];

/**
 * Initialize medication store with sample data
 * Call this function during app initialization for development/testing
 */
export const initializeSampleMedicationData = (
  setMedications: (medications: MedicationDetails[]) => void,
  setAdherenceHistory: (history: MedicationAdherence[]) => void
) => {
  setMedications(sampleMedications);
  // Set adherence history by recording each item
  sampleAdherenceHistory.forEach((adherence) => {
    // This would normally use recordAdherence, but for initialization we set directly
  });
};

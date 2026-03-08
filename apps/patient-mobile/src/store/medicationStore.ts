/**
 * Medication Store
 * Manages medication data, reminders, and adherence tracking
 */

import { create } from 'zustand';

export interface MedicationReminder {
  id: string;
  medicationId: string;
  time: string; // HH:mm format
  enabled: boolean;
  days: number[]; // 0-6 (Sunday-Saturday)
}

export interface MedicationAdherence {
  id: string;
  medicationId: string;
  scheduledTime: string;
  takenTime?: string;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  verificationMethod?: 'manual' | 'scanned';
  verificationImageUrl?: string;
  notes?: string;
}

export interface MedicationDetails {
  id: string;
  drugName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  instructions?: string;
  prescribedBy?: string;
  purpose?: string;
  sideEffects?: string[];
  reminders: MedicationReminder[];
  refillDate?: string;
  refillReminder: boolean;
  stockCount?: number;
  imageUrl?: string;
}

interface MedicationState {
  medications: MedicationDetails[];
  adherenceHistory: MedicationAdherence[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setMedications: (medications: MedicationDetails[]) => void;
  addMedication: (medication: MedicationDetails) => void;
  updateMedication: (id: string, updates: Partial<MedicationDetails>) => void;
  deleteMedication: (id: string) => void;
  
  // Reminder actions
  addReminder: (medicationId: string, reminder: MedicationReminder) => void;
  updateReminder: (medicationId: string, reminderId: string, updates: Partial<MedicationReminder>) => void;
  deleteReminder: (medicationId: string, reminderId: string) => void;
  toggleReminder: (medicationId: string, reminderId: string) => void;
  
  // Adherence actions
  recordAdherence: (adherence: MedicationAdherence) => void;
  updateAdherence: (id: string, updates: Partial<MedicationAdherence>) => void;
  getAdherenceForMedication: (medicationId: string, days?: number) => MedicationAdherence[];
  getAdherenceRate: (medicationId: string, days?: number) => number;
  
  // Refill actions
  updateRefillDate: (medicationId: string, refillDate: string) => void;
  toggleRefillReminder: (medicationId: string) => void;
  getMedicationsNeedingRefill: (daysThreshold?: number) => MedicationDetails[];
  
  // Loading and error
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Initialize with data
  initializeData: (medications: MedicationDetails[], adherenceHistory: MedicationAdherence[]) => void;
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  medications: [],
  adherenceHistory: [],
  isLoading: false,
  error: null,

  setMedications: (medications) => set({ medications }),

  addMedication: (medication) => set((state) => ({
    medications: [...state.medications, medication],
  })),

  updateMedication: (id, updates) => set((state) => ({
    medications: state.medications.map((med) =>
      med.id === id ? { ...med, ...updates } : med
    ),
  })),

  deleteMedication: (id) => set((state) => ({
    medications: state.medications.filter((med) => med.id !== id),
  })),

  addReminder: (medicationId, reminder) => set((state) => ({
    medications: state.medications.map((med) =>
      med.id === medicationId
        ? { ...med, reminders: [...med.reminders, reminder] }
        : med
    ),
  })),

  updateReminder: (medicationId, reminderId, updates) => set((state) => ({
    medications: state.medications.map((med) =>
      med.id === medicationId
        ? {
            ...med,
            reminders: med.reminders.map((rem) =>
              rem.id === reminderId ? { ...rem, ...updates } : rem
            ),
          }
        : med
    ),
  })),

  deleteReminder: (medicationId, reminderId) => set((state) => ({
    medications: state.medications.map((med) =>
      med.id === medicationId
        ? {
            ...med,
            reminders: med.reminders.filter((rem) => rem.id !== reminderId),
          }
        : med
    ),
  })),

  toggleReminder: (medicationId, reminderId) => set((state) => ({
    medications: state.medications.map((med) =>
      med.id === medicationId
        ? {
            ...med,
            reminders: med.reminders.map((rem) =>
              rem.id === reminderId ? { ...rem, enabled: !rem.enabled } : rem
            ),
          }
        : med
    ),
  })),

  recordAdherence: (adherence) => set((state) => ({
    adherenceHistory: [adherence, ...state.adherenceHistory],
  })),

  updateAdherence: (id, updates) => set((state) => ({
    adherenceHistory: state.adherenceHistory.map((adh) =>
      adh.id === id ? { ...adh, ...updates } : adh
    ),
  })),

  getAdherenceForMedication: (medicationId, days = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return get().adherenceHistory.filter(
      (adh) =>
        adh.medicationId === medicationId &&
        new Date(adh.scheduledTime) >= cutoffDate
    );
  },

  getAdherenceRate: (medicationId, days = 30) => {
    const adherenceRecords = get().getAdherenceForMedication(medicationId, days);
    if (adherenceRecords.length === 0) return 0;
    
    const takenCount = adherenceRecords.filter(
      (adh) => adh.status === 'taken'
    ).length;
    
    return Math.round((takenCount / adherenceRecords.length) * 100);
  },

  updateRefillDate: (medicationId, refillDate) => set((state) => ({
    medications: state.medications.map((med) =>
      med.id === medicationId ? { ...med, refillDate } : med
    ),
  })),

  toggleRefillReminder: (medicationId) => set((state) => ({
    medications: state.medications.map((med) =>
      med.id === medicationId
        ? { ...med, refillReminder: !med.refillReminder }
        : med
    ),
  })),

  getMedicationsNeedingRefill: (daysThreshold = 7) => {
    const today = new Date();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysThreshold);

    return get().medications.filter((med) => {
      if (!med.refillDate || !med.refillReminder) return false;
      const refillDate = new Date(med.refillDate);
      return refillDate >= today && refillDate <= threshold;
    });
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
  
  initializeData: (medications, adherenceHistory) => set({ medications, adherenceHistory }),
}));

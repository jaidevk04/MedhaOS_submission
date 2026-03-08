import { create } from 'zustand';
import type { Patient } from '@/types';
import { offlineStorage } from '@/lib/offlineStorage';

interface PatientState {
  patients: Patient[];
  selectedPatient: Patient | null;
  setPatients: (patients: Patient[]) => void;
  setSelectedPatient: (patient: Patient | null) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  fetchPatients: () => Promise<void>;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: [],
  selectedPatient: null,

  setPatients: (patients) => set({ patients }),

  setSelectedPatient: (patient) => set({ selectedPatient: patient }),

  updatePatient: (id, updates) => {
    const patients = get().patients.map((patient) =>
      patient.id === id ? { ...patient, ...updates } : patient
    );
    set({ patients });
    offlineStorage.savePatients(patients);
  },

  fetchPatients: async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_NURSE_SERVICE_URL}/api/patients/assigned`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const patients = await response.json();
        set({ patients });
        offlineStorage.savePatients(patients);
      } else {
        const patients = await offlineStorage.getPatients();
        set({ patients });
      }
    } catch (error) {
      const patients = await offlineStorage.getPatients();
      set({ patients });
    }
  },
}));

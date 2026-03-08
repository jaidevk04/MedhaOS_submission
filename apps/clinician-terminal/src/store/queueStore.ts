import { create } from 'zustand';
import { useAuthStore } from './authStore';
import type { QueuePatient, EmergencyAlert, QueueFilter, QueueSortBy } from '@/types/patient';

interface QueueStore {
  patients: QueuePatient[];
  alerts: EmergencyAlert[];
  filter: QueueFilter;
  sortBy: QueueSortBy;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;

  // Actions
  setPatients: (patients: QueuePatient[]) => void;
  addPatient: (patient: QueuePatient) => void;
  updatePatient: (encounterId: string, updates: Partial<QueuePatient>) => void;
  removePatient: (encounterId: string) => void;
  setAlerts: (alerts: EmergencyAlert[]) => void;
  addAlert: (alert: EmergencyAlert) => void;
  acknowledgeAlert: (alertId: string) => void;
  removeAlert: (alertId: string) => void;
  setFilter: (filter: QueueFilter) => void;
  setSortBy: (sortBy: QueueSortBy) => void;
  setSearchQuery: (query: string) => void;
  fetchQueue: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  clearError: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000';

// Mock data for development
const mockPatients: QueuePatient[] = [
  {
    encounter_id: 'enc-001',
    patient: {
      patient_id: 'pat-001',
      abha_id: '12-3456-7890-1234',
      demographics: {
        name: 'Ramesh Kumar',
        age: 45,
        gender: 'male',
        language_preference: 'Hindi',
        contact: {
          phone: '+91-9876543210',
          whatsapp: '+91-9876543210',
        },
        address: {
          district: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
        },
      },
      medical_history: [
        {
          condition: 'Type 2 Diabetes',
          diagnosed_date: '2020-03-15',
          status: 'active',
        },
        {
          condition: 'Hypertension',
          diagnosed_date: '2019-08-20',
          status: 'active',
        },
      ],
      allergies: ['Penicillin', 'Sulfa drugs'],
      current_medications: [
        {
          drug_name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          start_date: '2020-03-15',
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    encounter_type: 'ED',
    urgency_score: 85,
    chief_complaint: 'Severe chest pain radiating to left arm',
    triage_data: {
      symptoms: ['chest pain', 'shortness of breath', 'sweating'],
      vitals: {
        temperature: 37.2,
        blood_pressure: '160/95',
        heart_rate: 110,
        respiratory_rate: 22,
        spo2: 94,
      },
      triage_timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    recent_diagnostics: [
      {
        test_type: 'ECG',
        result: 'ST elevation in leads II, III, aVF',
        date: new Date(Date.now() - 10 * 60000).toISOString(),
        status: 'critical',
        notes: 'Possible inferior wall MI',
      },
      {
        test_type: 'Troponin I',
        result: 'Elevated (2.5 ng/mL)',
        date: new Date(Date.now() - 5 * 60000).toISOString(),
        status: 'critical',
        notes: 'Significantly above normal range',
      },
    ],
    status: 'waiting',
    estimated_wait_time: 5,
    queue_position: 1,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    encounter_id: 'enc-002',
    patient: {
      patient_id: 'pat-002',
      demographics: {
        name: 'Priya Sharma',
        age: 32,
        gender: 'female',
        language_preference: 'English',
        contact: {
          phone: '+91-9876543211',
        },
        address: {
          district: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400002',
        },
      },
      medical_history: [],
      allergies: [],
      current_medications: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    encounter_type: 'ED',
    urgency_score: 78,
    chief_complaint: 'High fever and severe headache for 3 days',
    triage_data: {
      symptoms: ['fever', 'headache', 'body ache'],
      vitals: {
        temperature: 39.5,
        blood_pressure: '120/80',
        heart_rate: 95,
        respiratory_rate: 18,
        spo2: 98,
      },
      triage_timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    },
    status: 'waiting',
    estimated_wait_time: 12,
    queue_position: 2,
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    encounter_id: 'enc-003',
    patient: {
      patient_id: 'pat-003',
      demographics: {
        name: 'Amit Patel',
        age: 28,
        gender: 'male',
        language_preference: 'Gujarati',
        contact: {
          phone: '+91-9876543212',
        },
        address: {
          district: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400003',
        },
      },
      medical_history: [],
      allergies: [],
      current_medications: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    encounter_type: 'OPD',
    urgency_score: 45,
    chief_complaint: 'Routine checkup and vaccination',
    triage_data: {
      symptoms: [],
      vitals: {
        temperature: 36.8,
        blood_pressure: '118/75',
        heart_rate: 72,
        respiratory_rate: 16,
        spo2: 99,
      },
      triage_timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    },
    status: 'waiting',
    estimated_wait_time: 25,
    queue_position: 3,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 60000).toISOString(),
  },
];

const mockAlerts: EmergencyAlert[] = [
  {
    alert_id: 'alert-001',
    patient_id: 'pat-001',
    patient_name: 'Ramesh Kumar',
    alert_type: 'critical_lab',
    severity: 'critical',
    message: 'Critical Lab Result',
    details: 'Troponin levels elevated - possible MI',
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
    acknowledged: false,
  },
  {
    alert_id: 'alert-002',
    patient_id: 'pat-004',
    patient_name: 'Sunita Desai',
    alert_type: 'drug_interaction',
    severity: 'urgent',
    message: 'Drug Interaction Alert',
    details: 'Prescription review needed',
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    acknowledged: false,
  },
  {
    alert_id: 'alert-003',
    patient_id: 'pat-002',
    patient_name: 'Priya Sharma',
    alert_type: 'new_arrival',
    severity: 'info',
    message: 'New Patient Arrival',
    details: 'Urgency score: 78',
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    acknowledged: false,
  },
];

export const useQueueStore = create<QueueStore>((set, get) => ({
  patients: [],
  alerts: [],
  filter: 'all',
  sortBy: 'urgency',
  searchQuery: '',
  isLoading: false,
  error: null,
  lastUpdated: null,

  setPatients: (patients) => {
    set({ patients, lastUpdated: new Date().toISOString() });
  },

  addPatient: (patient) => {
    set((state) => ({
      patients: [...state.patients, patient],
      lastUpdated: new Date().toISOString(),
    }));
  },

  updatePatient: (encounterId, updates) => {
    set((state) => ({
      patients: state.patients.map((p) =>
        p.encounter_id === encounterId ? { ...p, ...updates } : p
      ),
      lastUpdated: new Date().toISOString(),
    }));
  },

  removePatient: (encounterId) => {
    set((state) => ({
      patients: state.patients.filter((p) => p.encounter_id !== encounterId),
      lastUpdated: new Date().toISOString(),
    }));
  },

  setAlerts: (alerts) => {
    set({ alerts });
  },

  addAlert: (alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts],
    }));
  },

  acknowledgeAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.alert_id === alertId ? { ...a, acknowledged: true } : a
      ),
    }));
  },

  removeAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.alert_id !== alertId),
    }));
  },

  setFilter: (filter) => {
    set({ filter });
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  fetchQueue: async () => {
    set({ isLoading: true, error: null });

    try {
      const { tokens } = useAuthStore.getState();
      const token = tokens?.accessToken;
      
      let realPatients: QueuePatient[] = [];

      if (token) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000'}/api/appointments?status=scheduled`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.appointments) {
              realPatients = data.appointments.map((appt: any) => {
                const age = appt.patient_age || (appt.patient_dob ? new Date().getFullYear() - new Date(appt.patient_dob).getFullYear() : 0);
                
                return {
                  encounter_id: appt.appointment_id,
                  patient: {
                    patient_id: appt.patient_id,
                    demographics: {
                      name: appt.patient_name || 'Unknown',
                      age: age,
                      gender: appt.patient_gender || 'other',
                      language_preference: 'en',
                      contact: { phone: appt.patient_phone || '' },
                      address: { district: '', state: '', pincode: '' },
                    },
                    medical_history: [],
                    allergies: [],
                    current_medications: [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  encounter_type: 'OPD',
                  urgency_score: appt.urgency_score || 50,
                  chief_complaint: appt.notes || appt.specialty || 'General Consultation',
                  triage_data: {
                    symptoms: [],
                    vitals: {},
                    triage_timestamp: appt.created_at || new Date().toISOString(),
                  },
                  status: 'waiting',
                  estimated_wait_time: 15,
                  scheduled_time: appt.scheduled_time,
                  queue_position: 0, // Will be updated after sort
                  created_at: appt.scheduled_time || new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
              });
            }
          }
        } catch (apiError) {
          console.error('Failed to fetch real appointments:', apiError);
        }
      }

      const allPatients = [...realPatients, ...mockPatients];
      // Sort by scheduled time or creation time
      allPatients.sort((a, b) => {
        const timeA = new Date(a.scheduled_time || a.created_at).getTime();
        const timeB = new Date(b.scheduled_time || b.created_at).getTime();
        return timeA - timeB;
      });

      // Assign queue position
      const indexedPatients = allPatients.map((p, index) => ({
        ...p,
        queue_position: index + 1
      }));

      set({
        patients: indexedPatients,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch queue',
        isLoading: false,
      });
    }
  },

  fetchAlerts: async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${API_URL}/api/alerts`, {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // });
      // const data = await response.json();

      // For now, use mock data
      await new Promise((resolve) => setTimeout(resolve, 300));
      set({ alerts: mockAlerts });
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

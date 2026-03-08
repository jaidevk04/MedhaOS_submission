export interface Patient {
  patient_id: string;
  abha_id?: string;
  demographics: {
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    language_preference: string;
    contact: {
      phone: string;
      whatsapp?: string;
      email?: string;
    };
    address: {
      district: string;
      state: string;
      pincode: string;
    };
  };
  medical_history: Array<{
    condition: string;
    diagnosed_date: string;
    status: 'active' | 'resolved';
  }>;
  allergies: string[];
  current_medications: Array<{
    drug_name: string;
    dosage: string;
    frequency: string;
    start_date: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface QueuePatient {
  encounter_id: string;
  patient: Patient;
  encounter_type: 'ED' | 'OPD' | 'IPD' | 'Telemedicine';
  urgency_score: number;
  chief_complaint: string;
  triage_data: {
    symptoms: string[];
    vitals: {
      temperature?: number;
      blood_pressure?: string;
      heart_rate?: number;
      respiratory_rate?: number;
      spo2?: number;
    };
    triage_timestamp: string;
  };
  recent_diagnostics?: Array<{
    test_type: string;
    result: string;
    date: string;
    status: 'normal' | 'abnormal' | 'critical';
    notes?: string;
  }>;
  status: 'waiting' | 'in_progress' | 'completed' | 'admitted';
  estimated_wait_time?: number;
  scheduled_time?: string;
  queue_position: number;
  assigned_clinician_id?: string;
  created_at: string;
  updated_at: string;
}

export interface EmergencyAlert {
  alert_id: string;
  patient_id: string;
  patient_name: string;
  alert_type: 'critical_lab' | 'drug_interaction' | 'vital_signs' | 'new_arrival' | 'deterioration';
  severity: 'critical' | 'urgent' | 'warning' | 'info';
  message: string;
  details?: string;
  created_at: string;
  acknowledged: boolean;
}

export type QueueFilter = 'all' | 'waiting' | 'critical' | 'urgent' | 'routine';
export type QueueSortBy = 'urgency' | 'wait_time' | 'arrival_time';

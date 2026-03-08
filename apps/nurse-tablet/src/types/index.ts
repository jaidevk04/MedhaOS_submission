export interface User {
  id: string;
  name: string;
  role: 'nurse' | 'charge_nurse';
  email: string;
  facilityId: string;
  avatar?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  room: string;
  bed: string;
  acuityScore: number; // 1-5, 5 being highest
  allergies: string[];
  currentMedications: Medication[];
  vitals: VitalSigns;
  alerts: Alert[];
}

export interface VitalSigns {
  temperature?: number;
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  spo2?: number;
  lastUpdated: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface Task {
  id: string;
  patientId: string;
  patientName: string;
  room: string;
  type: 'medication' | 'vitals' | 'assessment' | 'procedure' | 'documentation' | 'other';
  title: string;
  description: string;
  priority: 'urgent' | 'soon' | 'routine';
  dueTime: string;
  estimatedDuration: number; // minutes
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assignedTo?: string;
  completedAt?: string;
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  route: 'oral' | 'IV' | 'IM' | 'SC' | 'topical' | 'other';
  frequency: string;
  scheduledTime: string;
  status: 'pending' | 'administered' | 'missed' | 'refused';
  barcode?: string;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  urgent: boolean;
}

export interface HandoffNote {
  id: string;
  patientId: string;
  patientName: string;
  from: string;
  to: string;
  shift: 'day' | 'evening' | 'night';
  date: string;
  summary: string;
  pendingTasks: string[];
  concerns: string[];
  vitals: VitalSigns;
}

export interface SyncStatus {
  lastSync: string;
  pendingChanges: number;
  isOnline: boolean;
  isSyncing: boolean;
}

export type GestureType = 'swipe-left' | 'swipe-right' | 'long-press' | 'double-tap';

export interface GestureConfig {
  enabled: boolean;
  threshold: number;
  timeout: number;
}

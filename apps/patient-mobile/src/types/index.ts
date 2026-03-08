/**
 * Global Type Definitions
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  abhaId?: string;
  language: string;
  address?: Address;
  medicalHistory?: MedicalCondition[];
  allergies?: string[];
  currentMedications?: Medication[];
}

export interface Address {
  street?: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
}

export interface MedicalCondition {
  condition: string;
  diagnosedDate: string;
  status: 'active' | 'resolved';
}

export interface Medication {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  instructions?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  facilityId: string;
  facilityName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  urgencyScore?: number;
}

export interface Facility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'diagnostic_center';
  address: Address;
  location: {
    latitude: number;
    longitude: number;
  };
  distance?: number; // in km
  estimatedWaitTime?: number; // in minutes
  availableSpecialties: string[];
  rating?: number;
  phone: string;
  emergencyAvailable: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  qualifications: string[];
  experience: number; // years
  rating?: number;
  availableSlots: TimeSlot[];
  consultationFee: number;
  languages: string[];
  photo?: string;
}

export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

export interface HealthRecord {
  id: string;
  patientId: string;
  type: 'consultation' | 'diagnostic' | 'prescription' | 'vaccination';
  title: string;
  date: string;
  facility: string;
  doctor?: string;
  summary?: string;
  documents?: Document[];
}

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export type Language = 
  | 'en' 
  | 'hi' 
  | 'ta' 
  | 'te' 
  | 'bn' 
  | 'mr' 
  | 'gu' 
  | 'kn' 
  | 'ml' 
  | 'pa' 
  | 'or';

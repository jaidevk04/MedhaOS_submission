/**
 * Navigation Types
 * Type definitions for React Navigation
 */

import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Auth Stack Navigator
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  LanguageSelection: undefined;
  ABHAIntegration: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Appointments: undefined;
  Records: undefined;
  Medications: undefined;
  Profile: undefined;
};

// Home Stack Navigator
export type HomeStackParamList = {
  HomeScreen: undefined;
  Triage: undefined;
  TriageResult: { urgencyScore: number; recommendation: string };
  AppointmentBooking: { urgencyScore?: number };
  FacilitySelection: undefined;
  DoctorSelection: { facilityId: string };
  AppointmentConfirmation: { appointmentId: string };
};

// Records Stack Navigator
export type RecordsStackParamList = {
  RecordsList: undefined;
  RecordDetail: { recordId: string };
  DiagnosticReport: { reportId: string };
  DocumentUpload: undefined;
};

// Medications Stack Navigator
export type MedicationsStackParamList = {
  MedicationsList: undefined;
  MedicationDetail: { medicationId: string };
  PillScanner: { medicationId?: string };
  ReminderSetup: { medicationId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

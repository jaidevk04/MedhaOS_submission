import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type Query {
    # Patient queries
    patient(id: ID!): Patient
    patients(search: String, page: Int, limit: Int): PatientConnection
    
    # Encounter queries
    encounter(id: ID!): Encounter
    encounters(patientId: ID, status: EncounterStatus, page: Int, limit: Int): EncounterConnection
    
    # Diagnostic queries
    diagnostic(id: ID!): DiagnosticReport
    diagnostics(patientId: ID, reportType: ReportType, status: DiagnosticStatus, page: Int, limit: Int): DiagnosticConnection
    
    # Appointment queries
    appointment(id: ID!): Appointment
    appointments(patientId: ID, clinicianId: ID, facilityId: ID, date: DateTime, status: AppointmentStatus, page: Int, limit: Int): AppointmentConnection
    appointmentAvailability(facilityId: ID!, clinicianId: ID, specialty: String, date: DateTime!): [TimeSlot!]!
    
    # Dashboard queries
    dashboardMetrics(facilityId: ID!): DashboardMetrics
    capacityOverview(facilityId: ID!): CapacityOverview
    queueStatus(facilityId: ID!): QueueStatus
    
    # Analytics queries
    predictiveAnalytics(facilityId: ID!, timeRange: String!): PredictiveAnalytics
    operationalMetrics(facilityId: ID!, startDate: DateTime!, endDate: DateTime!): OperationalMetrics
  }

  type Mutation {
    # Patient mutations
    createPatient(input: CreatePatientInput!): Patient!
    updatePatient(id: ID!, input: UpdatePatientInput!): Patient!
    
    # Encounter mutations
    createEncounter(input: CreateEncounterInput!): Encounter!
    updateEncounter(id: ID!, input: UpdateEncounterInput!): Encounter!
    addTriageData(encounterId: ID!, input: TriageDataInput!): Encounter!
    addClinicalNotes(encounterId: ID!, input: ClinicalNotesInput!): Encounter!
    addDiagnosis(encounterId: ID!, input: DiagnosisInput!): Encounter!
    addPrescription(encounterId: ID!, input: PrescriptionInput!): Encounter!
    completeEncounter(id: ID!): Encounter!
    
    # Diagnostic mutations
    createDiagnosticReport(input: CreateDiagnosticInput!): DiagnosticReport!
    uploadDiagnosticImage(reportId: ID!, imageUrl: String!): DiagnosticReport!
    analyzeDiagnosticImage(reportId: ID!): DiagnosticReport!
    verifyDiagnosticReport(reportId: ID!, input: VerifyReportInput!): DiagnosticReport!
    finalizeDiagnosticReport(reportId: ID!): DiagnosticReport!
    
    # Appointment mutations
    createAppointment(input: CreateAppointmentInput!): Appointment!
    updateAppointment(id: ID!, input: UpdateAppointmentInput!): Appointment!
    confirmAppointment(id: ID!): Appointment!
    cancelAppointment(id: ID!, reason: String): Appointment!
    rescheduleAppointment(id: ID!, newDate: DateTime!, newTime: String!): Appointment!
  }

  type Subscription {
    # Real-time updates
    queueUpdated(facilityId: ID!): QueueUpdate!
    appointmentStatusChanged(appointmentId: ID!): Appointment!
    diagnosticReportReady(patientId: ID!): DiagnosticReport!
    capacityAlert(facilityId: ID!): CapacityAlert!
  }

  # Patient types
  type Patient {
    id: ID!
    abhaId: String
    name: String!
    age: Int!
    gender: Gender!
    languagePreference: String
    contact: ContactInfo!
    address: Address
    medicalHistory: [MedicalCondition!]!
    allergies: [String!]!
    currentMedications: [Medication!]!
    encounters: [Encounter!]!
    appointments: [Appointment!]!
    diagnosticReports: [DiagnosticReport!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ContactInfo {
    phone: String!
    whatsapp: String
    email: String
  }

  type Address {
    district: String
    state: String
    pincode: String
  }

  type MedicalCondition {
    condition: String!
    diagnosedDate: DateTime
    status: ConditionStatus!
  }

  type Medication {
    drugName: String!
    dosage: String!
    frequency: String!
    startDate: DateTime!
    endDate: DateTime
  }

  # Encounter types
  type Encounter {
    id: ID!
    patient: Patient!
    facility: Facility!
    clinician: Clinician!
    encounterType: EncounterType!
    urgencyScore: Int
    chiefComplaint: String
    triageData: TriageData
    clinicalNotes: ClinicalNotes
    diagnoses: [Diagnosis!]!
    prescriptions: [Prescription!]!
    diagnosticOrders: [DiagnosticOrder!]!
    status: EncounterStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type TriageData {
    symptoms: [String!]!
    vitals: Vitals!
    triageTimestamp: DateTime!
  }

  type Vitals {
    temperature: Float
    bloodPressure: String
    heartRate: Int
    respiratoryRate: Int
    spo2: Int
  }

  type ClinicalNotes {
    subjective: String
    objective: String
    assessment: String
    plan: String
  }

  type Diagnosis {
    icdCode: String!
    description: String!
    confidence: Float
  }

  type Prescription {
    drugName: String!
    dosage: String!
    frequency: String!
    duration: String!
    instructions: String
  }

  type DiagnosticOrder {
    testType: String!
    urgency: OrderUrgency!
    status: OrderStatus!
  }

  # Diagnostic types
  type DiagnosticReport {
    id: ID!
    encounter: Encounter!
    patient: Patient!
    reportType: ReportType!
    modality: String
    imageUrls: [String!]!
    aiAnalysis: AIAnalysis
    radiologistReport: String
    status: DiagnosticStatus!
    createdAt: DateTime!
    verifiedAt: DateTime
  }

  type AIAnalysis {
    findings: [String!]!
    anomaliesDetected: [Anomaly!]!
    draftReport: String!
    processingTimeSeconds: Float!
  }

  type Anomaly {
    type: String!
    location: String!
    confidence: Float!
    severity: Severity!
  }

  # Appointment types
  type Appointment {
    id: ID!
    patient: Patient!
    facility: Facility!
    clinician: Clinician!
    appointmentDate: DateTime!
    appointmentTime: String!
    specialty: String
    urgencyScore: Int
    status: AppointmentStatus!
    estimatedWaitTime: Int
    queuePosition: Int
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type TimeSlot {
    time: String!
    available: Boolean!
    clinician: Clinician
  }

  # Facility and Clinician types
  type Facility {
    id: ID!
    name: String!
    type: String!
    address: Address!
    specialties: [String!]!
    capacity: FacilityCapacity!
  }

  type FacilityCapacity {
    totalBeds: Int!
    availableBeds: Int!
    icuBeds: Int!
    availableIcuBeds: Int!
  }

  type Clinician {
    id: ID!
    name: String!
    specialty: String!
    qualifications: [String!]!
    availability: [AvailabilitySlot!]!
  }

  type AvailabilitySlot {
    dayOfWeek: String!
    startTime: String!
    endTime: String!
  }

  # Dashboard types
  type DashboardMetrics {
    facilityId: ID!
    timestamp: DateTime!
    bedOccupancy: Float!
    icuUtilization: Float!
    edQueueLength: Int!
    opdQueueLength: Int!
    staffCoverage: Float!
    averageWaitTime: Int!
  }

  type CapacityOverview {
    beds: CapacityMetric!
    icuBeds: CapacityMetric!
    edQueue: QueueMetric!
    opdQueue: QueueMetric!
    staff: StaffMetric!
  }

  type CapacityMetric {
    total: Int!
    occupied: Int!
    available: Int!
    utilizationPercent: Float!
  }

  type QueueMetric {
    currentLength: Int!
    averageWaitTime: Int!
    longestWaitTime: Int!
  }

  type StaffMetric {
    total: Int!
    onDuty: Int!
    utilizationPercent: Float!
  }

  type QueueStatus {
    facilityId: ID!
    edQueue: [QueueEntry!]!
    opdQueue: [QueueEntry!]!
    updatedAt: DateTime!
  }

  type QueueEntry {
    patient: Patient!
    urgencyScore: Int!
    queuePosition: Int!
    estimatedWaitTime: Int!
    checkinTime: DateTime!
  }

  type PredictiveAnalytics {
    bedOccupancyForecast: [ForecastPoint!]!
    icuDemandForecast: [ForecastPoint!]!
    inventoryAlerts: [InventoryAlert!]!
  }

  type ForecastPoint {
    timestamp: DateTime!
    value: Float!
    confidence: Float!
  }

  type InventoryAlert {
    itemName: String!
    currentStock: Int!
    reorderLevel: Int!
    severity: Severity!
  }

  type OperationalMetrics {
    totalEncounters: Int!
    averageWaitTime: Int!
    patientSatisfaction: Float!
    bedTurnoverRate: Float!
    revenueGenerated: Float!
  }

  # Subscription types
  type QueueUpdate {
    facilityId: ID!
    queueType: String!
    currentLength: Int!
    averageWaitTime: Int!
    timestamp: DateTime!
  }

  type CapacityAlert {
    facilityId: ID!
    alertType: String!
    severity: Severity!
    message: String!
    timestamp: DateTime!
  }

  # Connection types for pagination
  type PatientConnection {
    edges: [PatientEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PatientEdge {
    node: Patient!
    cursor: String!
  }

  type EncounterConnection {
    edges: [EncounterEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type EncounterEdge {
    node: Encounter!
    cursor: String!
  }

  type DiagnosticConnection {
    edges: [DiagnosticEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type DiagnosticEdge {
    node: DiagnosticReport!
    cursor: String!
  }

  type AppointmentConnection {
    edges: [AppointmentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type AppointmentEdge {
    node: Appointment!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Input types
  input CreatePatientInput {
    name: String!
    age: Int!
    gender: Gender!
    abhaId: String
    languagePreference: String
    contact: ContactInfoInput!
    address: AddressInput
  }

  input UpdatePatientInput {
    name: String
    age: Int
    gender: Gender
    languagePreference: String
    contact: ContactInfoInput
    address: AddressInput
  }

  input ContactInfoInput {
    phone: String!
    whatsapp: String
    email: String
  }

  input AddressInput {
    district: String
    state: String
    pincode: String
  }

  input CreateEncounterInput {
    patientId: ID!
    facilityId: ID!
    clinicianId: ID!
    encounterType: EncounterType!
    chiefComplaint: String
  }

  input UpdateEncounterInput {
    chiefComplaint: String
    status: EncounterStatus
  }

  input TriageDataInput {
    symptoms: [String!]!
    vitals: VitalsInput!
  }

  input VitalsInput {
    temperature: Float
    bloodPressure: String
    heartRate: Int
    respiratoryRate: Int
    spo2: Int
  }

  input ClinicalNotesInput {
    subjective: String
    objective: String
    assessment: String
    plan: String
  }

  input DiagnosisInput {
    icdCode: String!
    description: String!
    confidence: Float
  }

  input PrescriptionInput {
    medications: [MedicationInput!]!
  }

  input MedicationInput {
    drugName: String!
    dosage: String!
    frequency: String!
    duration: String!
    instructions: String
  }

  input CreateDiagnosticInput {
    encounterId: ID!
    patientId: ID!
    reportType: ReportType!
    modality: String
  }

  input VerifyReportInput {
    radiologistReport: String!
    modifications: JSON
  }

  input CreateAppointmentInput {
    patientId: ID!
    facilityId: ID!
    clinicianId: ID!
    appointmentDate: DateTime!
    appointmentTime: String!
    specialty: String
    urgencyScore: Int
  }

  input UpdateAppointmentInput {
    appointmentDate: DateTime
    appointmentTime: String
    status: AppointmentStatus
  }

  # Enums
  enum Gender {
    male
    female
    other
  }

  enum ConditionStatus {
    active
    resolved
  }

  enum EncounterType {
    ED
    OPD
    IPD
    Telemedicine
  }

  enum EncounterStatus {
    in_progress
    completed
    admitted
  }

  enum ReportType {
    radiology
    laboratory
    pathology
  }

  enum DiagnosticStatus {
    pending
    ai_completed
    verified
    finalized
  }

  enum AppointmentStatus {
    scheduled
    confirmed
    in_progress
    completed
    cancelled
    no_show
  }

  enum OrderUrgency {
    STAT
    Routine
  }

  enum OrderStatus {
    ordered
    completed
  }

  enum Severity {
    critical
    moderate
    minor
  }
`;

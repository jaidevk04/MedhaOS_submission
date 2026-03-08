-- Database Indexes for Performance Optimization
-- MedhaOS Healthcare Platform

-- ============================================
-- Patient Table Indexes
-- ============================================

-- Primary lookup by ABHA ID
CREATE INDEX IF NOT EXISTS idx_patient_abha_id ON "Patient"(abha_id) WHERE abha_id IS NOT NULL;

-- Search by name (for autocomplete)
CREATE INDEX IF NOT EXISTS idx_patient_name ON "Patient"(first_name, last_name);

-- Filter by facility
CREATE INDEX IF NOT EXISTS idx_patient_facility ON "Patient"(facility_id) WHERE facility_id IS NOT NULL;

-- Temporal queries
CREATE INDEX IF NOT EXISTS idx_patient_created_at ON "Patient"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_updated_at ON "Patient"(updated_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_patient_facility_created ON "Patient"(facility_id, created_at DESC);

-- ============================================
-- Clinical Encounter Indexes
-- ============================================

-- Lookup by patient
CREATE INDEX IF NOT EXISTS idx_encounter_patient ON "ClinicalEncounter"(patient_id);

-- Lookup by clinician
CREATE INDEX IF NOT EXISTS idx_encounter_clinician ON "ClinicalEncounter"(clinician_id) WHERE clinician_id IS NOT NULL;

-- Lookup by facility
CREATE INDEX IF NOT EXISTS idx_encounter_facility ON "ClinicalEncounter"(facility_id);

-- Filter by encounter type
CREATE INDEX IF NOT EXISTS idx_encounter_type ON "ClinicalEncounter"(encounter_type);

-- Filter by status
CREATE INDEX IF NOT EXISTS idx_encounter_status ON "ClinicalEncounter"(status);

-- Urgency score for triage
CREATE INDEX IF NOT EXISTS idx_encounter_urgency ON "ClinicalEncounter"(urgency_score DESC) WHERE urgency_score IS NOT NULL;

-- Temporal queries
CREATE INDEX IF NOT EXISTS idx_encounter_created_at ON "ClinicalEncounter"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_encounter_updated_at ON "ClinicalEncounter"(updated_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_encounter_patient_created ON "ClinicalEncounter"(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_encounter_facility_status ON "ClinicalEncounter"(facility_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_encounter_urgency_status ON "ClinicalEncounter"(urgency_score DESC, status) WHERE urgency_score IS NOT NULL;

-- ============================================
-- Diagnostic Report Indexes
-- ============================================

-- Lookup by encounter
CREATE INDEX IF NOT EXISTS idx_diagnostic_encounter ON "DiagnosticReport"(encounter_id);

-- Lookup by patient
CREATE INDEX IF NOT EXISTS idx_diagnostic_patient ON "DiagnosticReport"(patient_id);

-- Filter by report type
CREATE INDEX IF NOT EXISTS idx_diagnostic_type ON "DiagnosticReport"(report_type);

-- Filter by modality
CREATE INDEX IF NOT EXISTS idx_diagnostic_modality ON "DiagnosticReport"(modality) WHERE modality IS NOT NULL;

-- Filter by status
CREATE INDEX IF NOT EXISTS idx_diagnostic_status ON "DiagnosticReport"(status);

-- Temporal queries
CREATE INDEX IF NOT EXISTS idx_diagnostic_created_at ON "DiagnosticReport"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostic_verified_at ON "DiagnosticReport"(verified_at DESC) WHERE verified_at IS NOT NULL;

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_diagnostic_patient_type ON "DiagnosticReport"(patient_id, report_type, created_at DESC);

-- ============================================
-- Agent Task Indexes
-- ============================================

-- Lookup by agent
CREATE INDEX IF NOT EXISTS idx_agent_task_agent ON "AgentTask"(agent_name);

-- Filter by task type
CREATE INDEX IF NOT EXISTS idx_agent_task_type ON "AgentTask"(task_type);

-- Filter by status
CREATE INDEX IF NOT EXISTS idx_agent_task_status ON "AgentTask"(status);

-- Escalation tracking
CREATE INDEX IF NOT EXISTS idx_agent_task_escalated ON "AgentTask"(escalated_to_human) WHERE escalated_to_human = true;

-- Performance monitoring
CREATE INDEX IF NOT EXISTS idx_agent_task_execution_time ON "AgentTask"(execution_time_ms) WHERE execution_time_ms IS NOT NULL;

-- Temporal queries
CREATE INDEX IF NOT EXISTS idx_agent_task_created_at ON "AgentTask"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_task_completed_at ON "AgentTask"(completed_at DESC) WHERE completed_at IS NOT NULL;

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_agent_task_agent_status ON "AgentTask"(agent_name, status, created_at DESC);

-- ============================================
-- Hospital Resource Indexes
-- ============================================

-- Lookup by facility
CREATE INDEX IF NOT EXISTS idx_resource_facility ON "HospitalResource"(facility_id);

-- Filter by resource type
CREATE INDEX IF NOT EXISTS idx_resource_type ON "HospitalResource"(resource_type);

-- Filter by status
CREATE INDEX IF NOT EXISTS idx_resource_status ON "HospitalResource"(status);

-- Lookup by current patient
CREATE INDEX IF NOT EXISTS idx_resource_patient ON "HospitalResource"(current_patient_id) WHERE current_patient_id IS NOT NULL;

-- Availability queries
CREATE INDEX IF NOT EXISTS idx_resource_availability ON "HospitalResource"(facility_id, resource_type, status);

-- Temporal queries
CREATE INDEX IF NOT EXISTS idx_resource_updated_at ON "HospitalResource"(updated_at DESC);

-- ============================================
-- Inventory Item Indexes
-- ============================================

-- Lookup by facility
CREATE INDEX IF NOT EXISTS idx_inventory_facility ON "InventoryItem"(facility_id);

-- Filter by item type
CREATE INDEX IF NOT EXISTS idx_inventory_type ON "InventoryItem"(item_type);

-- Search by name
CREATE INDEX IF NOT EXISTS idx_inventory_name ON "InventoryItem"(item_name);

-- Low stock alerts
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON "InventoryItem"(facility_id, current_stock) WHERE current_stock <= reorder_level;

-- Expiry tracking
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON "InventoryItem"(expiry_date) WHERE expiry_date IS NOT NULL;

-- Temporal queries
CREATE INDEX IF NOT EXISTS idx_inventory_updated_at ON "InventoryItem"(last_updated DESC);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_inventory_facility_type ON "InventoryItem"(facility_id, item_type);

-- ============================================
-- Disease Surveillance Event Indexes
-- ============================================

-- Geographic queries
CREATE INDEX IF NOT EXISTS idx_surveillance_district ON "DiseaseSurveillanceEvent"(district);
CREATE INDEX IF NOT EXISTS idx_surveillance_state ON "DiseaseSurveillanceEvent"(state);

-- Filter by disease type
CREATE INDEX IF NOT EXISTS idx_surveillance_disease ON "DiseaseSurveillanceEvent"(disease_type);

-- Lab confirmation status
CREATE INDEX IF NOT EXISTS idx_surveillance_lab_confirmed ON "DiseaseSurveillanceEvent"(lab_confirmed);

-- Outbreak probability
CREATE INDEX IF NOT EXISTS idx_surveillance_outbreak_prob ON "DiseaseSurveillanceEvent"(outbreak_probability DESC) WHERE outbreak_probability IS NOT NULL;

-- Temporal queries
CREATE INDEX IF NOT EXISTS idx_surveillance_detected_at ON "DiseaseSurveillanceEvent"(detected_at DESC);

-- Composite indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_surveillance_state_disease ON "DiseaseSurveillanceEvent"(state, disease_type, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_surveillance_district_disease ON "DiseaseSurveillanceEvent"(district, disease_type, detected_at DESC);

-- ============================================
-- User/Clinician Indexes (if applicable)
-- ============================================

-- Email lookup for authentication
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email) WHERE email IS NOT NULL;

-- Role-based queries
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);

-- Facility assignment
CREATE INDEX IF NOT EXISTS idx_user_facility ON "User"(facility_id) WHERE facility_id IS NOT NULL;

-- Active users
CREATE INDEX IF NOT EXISTS idx_user_active ON "User"(is_active) WHERE is_active = true;

-- ============================================
-- Appointment Indexes (if applicable)
-- ============================================

-- Lookup by patient
CREATE INDEX IF NOT EXISTS idx_appointment_patient ON "Appointment"(patient_id);

-- Lookup by clinician
CREATE INDEX IF NOT EXISTS idx_appointment_clinician ON "Appointment"(clinician_id);

-- Lookup by facility
CREATE INDEX IF NOT EXISTS idx_appointment_facility ON "Appointment"(facility_id);

-- Filter by status
CREATE INDEX IF NOT EXISTS idx_appointment_status ON "Appointment"(status);

-- Temporal queries
CREATE INDEX IF NOT EXISTS idx_appointment_scheduled_at ON "Appointment"(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointment_created_at ON "Appointment"(created_at DESC);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_appointment_clinician_date ON "Appointment"(clinician_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointment_facility_date ON "Appointment"(facility_id, scheduled_at);

-- ============================================
-- Full-Text Search Indexes (PostgreSQL)
-- ============================================

-- Patient search
CREATE INDEX IF NOT EXISTS idx_patient_search ON "Patient" USING gin(to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '')));

-- Clinical notes search
CREATE INDEX IF NOT EXISTS idx_encounter_notes_search ON "ClinicalEncounter" USING gin(to_tsvector('english', coalesce(chief_complaint, '')));

-- ============================================
-- Partial Indexes for Specific Queries
-- ============================================

-- Active encounters only
CREATE INDEX IF NOT EXISTS idx_encounter_active ON "ClinicalEncounter"(facility_id, created_at DESC) WHERE status IN ('in_progress', 'waiting');

-- Critical urgency encounters
CREATE INDEX IF NOT EXISTS idx_encounter_critical ON "ClinicalEncounter"(facility_id, urgency_score DESC, created_at DESC) WHERE urgency_score >= 70;

-- Pending diagnostic reports
CREATE INDEX IF NOT EXISTS idx_diagnostic_pending ON "DiagnosticReport"(patient_id, created_at DESC) WHERE status IN ('pending', 'ai_completed');

-- Failed agent tasks
CREATE INDEX IF NOT EXISTS idx_agent_task_failed ON "AgentTask"(agent_name, created_at DESC) WHERE status = 'failed';

-- ============================================
-- Maintenance Commands
-- ============================================

-- Run these periodically for optimal performance:
-- VACUUM ANALYZE "Patient";
-- VACUUM ANALYZE "ClinicalEncounter";
-- VACUUM ANALYZE "DiagnosticReport";
-- VACUUM ANALYZE "AgentTask";
-- VACUUM ANALYZE "HospitalResource";
-- VACUUM ANALYZE "InventoryItem";
-- VACUUM ANALYZE "DiseaseSurveillanceEvent";

-- Check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan ASC;

-- Find unused indexes:
-- SELECT schemaname, tablename, indexname
-- FROM pg_stat_user_indexes
-- WHERE idx_scan = 0 AND indexrelname NOT LIKE 'pg_toast%';

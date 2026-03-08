-- MedhaOS Database Schema
-- Drop existing tables if they exist
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS agent_tasks CASCADE;
DROP TABLE IF EXISTS diagnostic_reports CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS clinical_encounters CASCADE;
DROP TABLE IF EXISTS current_medications CASCADE;
DROP TABLE IF EXISTS allergies CASCADE;
DROP TABLE IF EXISTS medical_history CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Facilities table
CREATE TABLE facilities (
    facility_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- hospital, clinic, diagnostic_center
    address JSONB,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    specialties TEXT[],
    bed_capacity INTEGER DEFAULT 0,
    icu_capacity INTEGER DEFAULT 0,
    current_bed_occupancy INTEGER DEFAULT 0,
    current_icu_occupancy INTEGER DEFAULT 0,
    contact JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff table
CREATE TABLE staff (
    staff_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES facilities(facility_id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- doctor, nurse, technician, admin, public_health
    specialization VARCHAR(100),
    license_number VARCHAR(50),
    phone VARCHAR(15),
    language_preference VARCHAR(10) DEFAULT 'en',
    schedule JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE patients (
    patient_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    abha_id VARCHAR(14) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    age INTEGER,
    gender VARCHAR(20) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    language_preference VARCHAR(10) DEFAULT 'en',
    address JSONB,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    emergency_contact JSONB,
    blood_group VARCHAR(5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medical history
CREATE TABLE medical_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    condition VARCHAR(200) NOT NULL,
    diagnosed_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- active, resolved, chronic
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Allergies
CREATE TABLE allergies (
    allergy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    allergen VARCHAR(200) NOT NULL,
    allergen_type VARCHAR(50), -- drug, food, environmental
    reaction VARCHAR(200),
    severity VARCHAR(20), -- mild, moderate, severe, life-threatening
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Current medications
CREATE TABLE current_medications (
    medication_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    drug_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    route VARCHAR(50), -- oral, IV, topical, etc.
    start_date DATE,
    end_date DATE,
    prescribing_doctor_id UUID REFERENCES staff(staff_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clinical encounters
CREATE TABLE clinical_encounters (
    encounter_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    facility_id UUID REFERENCES facilities(facility_id),
    clinician_id UUID REFERENCES staff(staff_id),
    encounter_type VARCHAR(50) NOT NULL, -- ED, OPD, IPD, Telemedicine
    urgency_score INTEGER CHECK (urgency_score BETWEEN 0 AND 100),
    chief_complaint TEXT,
    symptoms TEXT[],
    vitals JSONB, -- temperature, bp, heart_rate, respiratory_rate, spo2
    triage_data JSONB,
    clinical_notes JSONB, -- SOAP format
    diagnoses JSONB,
    prescriptions JSONB,
    diagnostic_orders JSONB,
    status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, admitted, discharged
    admission_date TIMESTAMP,
    discharge_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments
CREATE TABLE appointments (
    appointment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    facility_id UUID REFERENCES facilities(facility_id),
    clinician_id UUID REFERENCES staff(staff_id),
    appointment_type VARCHAR(50), -- consultation, follow-up, procedure
    specialty VARCHAR(100),
    scheduled_time TIMESTAMP NOT NULL,
    estimated_duration INTEGER DEFAULT 30, -- minutes
    urgency_score INTEGER,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, in-progress, completed, cancelled, no-show
    queue_position INTEGER,
    estimated_wait_time INTEGER, -- minutes
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diagnostic reports
CREATE TABLE diagnostic_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES clinical_encounters(encounter_id),
    patient_id UUID REFERENCES patients(patient_id),
    report_type VARCHAR(50) NOT NULL, -- radiology, laboratory, pathology
    modality VARCHAR(50), -- X-ray, MRI, CT, Ultrasound, Blood, Urine
    test_name VARCHAR(200),
    image_urls TEXT[],
    ai_analysis JSONB,
    findings TEXT,
    impression TEXT,
    recommendations TEXT,
    radiologist_id UUID REFERENCES staff(staff_id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, ai_completed, verified, finalized
    priority VARCHAR(20) DEFAULT 'routine', -- stat, urgent, routine
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    verified_at TIMESTAMP
);

-- Agent tasks (for tracking AI agent executions)
CREATE TABLE agent_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name VARCHAR(100) NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    related_entity_type VARCHAR(50), -- patient, encounter, appointment
    related_entity_id UUID,
    input_data JSONB,
    output_data JSONB,
    confidence_score DECIMAL(5,4),
    escalated_to_human BOOLEAN DEFAULT FALSE,
    execution_time_ms INTEGER,
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, failed
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Audit logs
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_abha ON patients(abha_id);
CREATE INDEX idx_patients_name ON patients(first_name, last_name);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_encounters_patient ON clinical_encounters(patient_id);
CREATE INDEX idx_encounters_status ON clinical_encounters(status);
CREATE INDEX idx_encounters_created ON clinical_encounters(created_at);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_clinician ON appointments(clinician_id);
CREATE INDEX idx_appointments_time ON appointments(scheduled_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX idx_agent_tasks_agent ON agent_tasks(agent_name);
CREATE INDEX idx_agent_tasks_created ON agent_tasks(created_at);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_diagnostic_reports_patient ON diagnostic_reports(patient_id);
CREATE INDEX idx_diagnostic_reports_status ON diagnostic_reports(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_encounters_updated_at BEFORE UPDATE ON clinical_encounters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration: Add triage history table to store patient triage sessions

CREATE TABLE IF NOT EXISTS triage_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL, -- voice, text, chat
    language VARCHAR(10) DEFAULT 'en',
    symptoms TEXT[],
    conversation_data JSONB, -- stores full conversation history
    triage_result JSONB, -- AI assessment results
    urgency_score INTEGER CHECK (urgency_score BETWEEN 0 AND 100),
    recommended_action VARCHAR(100), -- emergency, urgent_care, schedule_appointment, self_care
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_triage_sessions_patient ON triage_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_triage_sessions_created ON triage_sessions(created_at);

-- Add patient_id to appointments if not exists (for guest users who later register)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'triage_session_id'
    ) THEN
        ALTER TABLE appointments ADD COLUMN triage_session_id UUID REFERENCES triage_sessions(session_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_appointments_triage_session ON appointments(triage_session_id);

COMMIT;

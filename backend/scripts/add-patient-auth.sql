-- Migration: Add authentication support for patients
-- This adds password_hash column and makes email unique

-- Add password_hash column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE patients ADD COLUMN password_hash VARCHAR(255);
    END IF;
END $$;

-- Make email unique if not already
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'patients_email_key'
    ) THEN
        ALTER TABLE patients ADD CONSTRAINT patients_email_key UNIQUE (email);
    END IF;
END $$;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);

COMMIT;

-- MedhaOS Database Initialization Script
-- This script sets up the initial database schema for local development

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS clinical;
CREATE SCHEMA IF NOT EXISTS operational;
CREATE SCHEMA IF NOT EXISTS financial;
CREATE SCHEMA IF NOT EXISTS public_health;
CREATE SCHEMA IF NOT EXISTS audit;

-- Set search path
SET search_path TO public, clinical, operational, financial, public_health, audit;

-- Grant schema permissions
GRANT USAGE ON SCHEMA clinical TO medhaos;
GRANT USAGE ON SCHEMA operational TO medhaos;
GRANT USAGE ON SCHEMA financial TO medhaos;
GRANT USAGE ON SCHEMA public_health TO medhaos;
GRANT USAGE ON SCHEMA audit TO medhaos;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA clinical TO medhaos;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA operational TO medhaos;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA financial TO medhaos;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public_health TO medhaos;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO medhaos;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA clinical TO medhaos;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA operational TO medhaos;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA financial TO medhaos;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public_health TO medhaos;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO medhaos;

-- Grant default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA clinical GRANT ALL ON TABLES TO medhaos;
ALTER DEFAULT PRIVILEGES IN SCHEMA operational GRANT ALL ON TABLES TO medhaos;
ALTER DEFAULT PRIVILEGES IN SCHEMA financial GRANT ALL ON TABLES TO medhaos;
ALTER DEFAULT PRIVILEGES IN SCHEMA public_health GRANT ALL ON TABLES TO medhaos;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT ALL ON TABLES TO medhaos;

ALTER DEFAULT PRIVILEGES IN SCHEMA clinical GRANT ALL ON SEQUENCES TO medhaos;
ALTER DEFAULT PRIVILEGES IN SCHEMA operational GRANT ALL ON SEQUENCES TO medhaos;
ALTER DEFAULT PRIVILEGES IN SCHEMA financial GRANT ALL ON SEQUENCES TO medhaos;
ALTER DEFAULT PRIVILEGES IN SCHEMA public_health GRANT ALL ON SEQUENCES TO medhaos;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT ALL ON SEQUENCES TO medhaos;

COMMENT ON DATABASE medhaos_db IS 'MedhaOS Healthcare Intelligence Ecosystem Database';
COMMENT ON SCHEMA clinical IS 'Clinical data - patient records, encounters, diagnostics';
COMMENT ON SCHEMA operational IS 'Operational data - facilities, resources, agent tasks';
COMMENT ON SCHEMA financial IS 'Financial data - billing, claims, revenue cycle';
COMMENT ON SCHEMA public_health IS 'Public health data - surveillance, outbreaks, predictions';
COMMENT ON SCHEMA audit IS 'Audit logs for compliance and security';

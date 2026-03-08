-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "audit";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "clinical";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "financial";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "operational";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public_health";

-- CreateTable
CREATE TABLE "clinical"."patients" (
    "id" UUID NOT NULL,
    "abha_id" VARCHAR(50),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "gender" VARCHAR(20) NOT NULL,
    "language_preference" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "whatsapp" VARCHAR(20),
    "email" VARCHAR(255),
    "address_line1" VARCHAR(255) NOT NULL,
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "blood_group" VARCHAR(10),
    "allergies" VARCHAR(255)[],
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical"."medical_history" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "condition" VARCHAR(255) NOT NULL,
    "diagnosed_date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "medical_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical"."current_medications" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "drug_name" VARCHAR(255) NOT NULL,
    "dosage" VARCHAR(100) NOT NULL,
    "frequency" VARCHAR(100) NOT NULL,
    "route" VARCHAR(50),
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "prescribed_by" VARCHAR(255),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "current_medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical"."clinical_encounters" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "clinician_id" UUID,
    "encounter_type" VARCHAR(20) NOT NULL,
    "encounter_number" VARCHAR(50) NOT NULL,
    "urgency_score" SMALLINT,
    "chief_complaint" TEXT NOT NULL,
    "triage_timestamp" TIMESTAMPTZ(3),
    "triage_symptoms" VARCHAR(255)[],
    "temperature" REAL,
    "blood_pressure" VARCHAR(20),
    "heart_rate" SMALLINT,
    "respiratory_rate" SMALLINT,
    "oxygen_saturation" SMALLINT,
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "status" VARCHAR(20) NOT NULL,
    "admission_date" TIMESTAMPTZ(3),
    "discharge_date" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clinical_encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical"."diagnoses" (
    "id" UUID NOT NULL,
    "encounter_id" UUID NOT NULL,
    "icd_code" VARCHAR(20) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "diagnosis_type" VARCHAR(50) NOT NULL,
    "confidence" REAL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical"."prescriptions" (
    "id" UUID NOT NULL,
    "encounter_id" UUID NOT NULL,
    "drug_name" VARCHAR(255) NOT NULL,
    "dosage" VARCHAR(100) NOT NULL,
    "frequency" VARCHAR(100) NOT NULL,
    "route" VARCHAR(50) NOT NULL,
    "duration" VARCHAR(100) NOT NULL,
    "instructions" TEXT,
    "quantity" SMALLINT,
    "refills" SMALLINT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical"."diagnostic_orders" (
    "id" UUID NOT NULL,
    "encounter_id" UUID NOT NULL,
    "test_type" VARCHAR(255) NOT NULL,
    "test_category" VARCHAR(100) NOT NULL,
    "urgency" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "instructions" TEXT,
    "ordered_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "diagnostic_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical"."diagnostic_reports" (
    "id" UUID NOT NULL,
    "encounter_id" UUID,
    "patient_id" UUID NOT NULL,
    "report_type" VARCHAR(100) NOT NULL,
    "modality" VARCHAR(100),
    "image_urls" VARCHAR(500)[],
    "document_urls" VARCHAR(500)[],
    "ai_findings" TEXT[],
    "ai_anomalies" JSONB,
    "ai_draft_report" TEXT,
    "ai_confidence" REAL,
    "processing_time_ms" INTEGER,
    "radiologist_report" TEXT,
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ(3),
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "diagnostic_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational"."facilities" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "facility_type" VARCHAR(100) NOT NULL,
    "address_line1" VARCHAR(255) NOT NULL,
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "website" VARCHAR(255),
    "total_beds" SMALLINT NOT NULL,
    "icu_beds" SMALLINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational"."agent_tasks" (
    "id" UUID NOT NULL,
    "agent_name" VARCHAR(100) NOT NULL,
    "task_type" VARCHAR(100) NOT NULL,
    "input_data" JSONB NOT NULL,
    "output_data" JSONB,
    "confidence_score" REAL,
    "escalated_to_human" BOOLEAN NOT NULL DEFAULT false,
    "execution_time_ms" INTEGER,
    "status" VARCHAR(20) NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "agent_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit"."audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "table_name" VARCHAR(100) NOT NULL,
    "operation" VARCHAR(20) NOT NULL,
    "record_id" UUID,
    "old_data" JSONB,
    "new_data" JSONB,
    "user_id" UUID,
    "user_role" VARCHAR(50),
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "changed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_abha_id_key" ON "clinical"."patients"("abha_id");

-- CreateIndex
CREATE INDEX "patients_abha_id_idx" ON "clinical"."patients"("abha_id");

-- CreateIndex
CREATE INDEX "patients_phone_idx" ON "clinical"."patients"("phone");

-- CreateIndex
CREATE INDEX "patients_district_state_idx" ON "clinical"."patients"("district", "state");

-- CreateIndex
CREATE INDEX "patients_created_at_idx" ON "clinical"."patients"("created_at");

-- CreateIndex
CREATE INDEX "medical_history_patient_id_idx" ON "clinical"."medical_history"("patient_id");

-- CreateIndex
CREATE INDEX "medical_history_status_idx" ON "clinical"."medical_history"("status");

-- CreateIndex
CREATE INDEX "current_medications_patient_id_idx" ON "clinical"."current_medications"("patient_id");

-- CreateIndex
CREATE INDEX "current_medications_drug_name_idx" ON "clinical"."current_medications"("drug_name");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_encounters_encounter_number_key" ON "clinical"."clinical_encounters"("encounter_number");

-- CreateIndex
CREATE INDEX "clinical_encounters_patient_id_idx" ON "clinical"."clinical_encounters"("patient_id");

-- CreateIndex
CREATE INDEX "clinical_encounters_facility_id_idx" ON "clinical"."clinical_encounters"("facility_id");

-- CreateIndex
CREATE INDEX "clinical_encounters_clinician_id_idx" ON "clinical"."clinical_encounters"("clinician_id");

-- CreateIndex
CREATE INDEX "clinical_encounters_encounter_type_idx" ON "clinical"."clinical_encounters"("encounter_type");

-- CreateIndex
CREATE INDEX "clinical_encounters_status_idx" ON "clinical"."clinical_encounters"("status");

-- CreateIndex
CREATE INDEX "clinical_encounters_created_at_idx" ON "clinical"."clinical_encounters"("created_at");

-- CreateIndex
CREATE INDEX "clinical_encounters_urgency_score_idx" ON "clinical"."clinical_encounters"("urgency_score");

-- CreateIndex
CREATE INDEX "diagnoses_encounter_id_idx" ON "clinical"."diagnoses"("encounter_id");

-- CreateIndex
CREATE INDEX "diagnoses_icd_code_idx" ON "clinical"."diagnoses"("icd_code");

-- CreateIndex
CREATE INDEX "prescriptions_encounter_id_idx" ON "clinical"."prescriptions"("encounter_id");

-- CreateIndex
CREATE INDEX "prescriptions_drug_name_idx" ON "clinical"."prescriptions"("drug_name");

-- CreateIndex
CREATE INDEX "diagnostic_orders_encounter_id_idx" ON "clinical"."diagnostic_orders"("encounter_id");

-- CreateIndex
CREATE INDEX "diagnostic_orders_status_idx" ON "clinical"."diagnostic_orders"("status");

-- CreateIndex
CREATE INDEX "diagnostic_orders_urgency_idx" ON "clinical"."diagnostic_orders"("urgency");

-- CreateIndex
CREATE INDEX "diagnostic_reports_patient_id_idx" ON "clinical"."diagnostic_reports"("patient_id");

-- CreateIndex
CREATE INDEX "diagnostic_reports_encounter_id_idx" ON "clinical"."diagnostic_reports"("encounter_id");

-- CreateIndex
CREATE INDEX "diagnostic_reports_report_type_idx" ON "clinical"."diagnostic_reports"("report_type");

-- CreateIndex
CREATE INDEX "diagnostic_reports_status_idx" ON "clinical"."diagnostic_reports"("status");

-- CreateIndex
CREATE INDEX "diagnostic_reports_created_at_idx" ON "clinical"."diagnostic_reports"("created_at");

-- CreateIndex
CREATE INDEX "facilities_district_state_idx" ON "operational"."facilities"("district", "state");

-- CreateIndex
CREATE INDEX "facilities_facility_type_idx" ON "operational"."facilities"("facility_type");

-- CreateIndex
CREATE INDEX "agent_tasks_agent_name_idx" ON "operational"."agent_tasks"("agent_name");

-- CreateIndex
CREATE INDEX "agent_tasks_task_type_idx" ON "operational"."agent_tasks"("task_type");

-- CreateIndex
CREATE INDEX "agent_tasks_status_idx" ON "operational"."agent_tasks"("status");

-- CreateIndex
CREATE INDEX "agent_tasks_created_at_idx" ON "operational"."agent_tasks"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_table_name_idx" ON "audit"."audit_logs"("table_name");

-- CreateIndex
CREATE INDEX "audit_logs_operation_idx" ON "audit"."audit_logs"("operation");

-- CreateIndex
CREATE INDEX "audit_logs_record_id_idx" ON "audit"."audit_logs"("record_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit"."audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_changed_at_idx" ON "audit"."audit_logs"("changed_at");

-- AddForeignKey
ALTER TABLE "clinical"."medical_history" ADD CONSTRAINT "medical_history_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical"."current_medications" ADD CONSTRAINT "current_medications_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical"."clinical_encounters" ADD CONSTRAINT "clinical_encounters_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical"."diagnoses" ADD CONSTRAINT "diagnoses_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."clinical_encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical"."prescriptions" ADD CONSTRAINT "prescriptions_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."clinical_encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical"."diagnostic_orders" ADD CONSTRAINT "diagnostic_orders_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."clinical_encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical"."diagnostic_reports" ADD CONSTRAINT "diagnostic_reports_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "clinical"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical"."diagnostic_reports" ADD CONSTRAINT "diagnostic_reports_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "clinical"."clinical_encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

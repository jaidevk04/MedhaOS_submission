-- MedhaOS Seed Data - Realistic Indian Healthcare Data
-- This script populates the database with realistic mock data

-- Insert Facilities (Hospitals in Kolkata)
INSERT INTO facilities (facility_id, name, type, address, city, state, pincode, specialties, bed_capacity, icu_capacity, current_bed_occupancy, current_icu_occupancy, contact) VALUES
('11111111-1111-1111-1111-111111111111', 'Apollo Gleneagles Hospital', 'hospital', '{"street": "58, Canal Circular Road", "area": "Kadapara", "landmark": "Near Phoolbagan"}', 'Kolkata', 'West Bengal', '700054', ARRAY['Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'General Medicine'], 500, 50, 380, 35, '{"phone": "+91-33-2320-3040", "emergency": "+91-33-2320-2122", "email": "info@apollogleneagles.in"}'),
('22222222-2222-2222-2222-222222222222', 'AMRI Hospital Salt Lake', 'hospital', '{"street": "JC-16 & 17, Sector III", "area": "Salt Lake City", "landmark": "Near City Centre"}', 'Kolkata', 'West Bengal', '700098', ARRAY['Cardiology', 'Gastroenterology', 'Nephrology', 'Pulmonology', 'General Medicine'], 400, 40, 310, 28, '{"phone": "+91-33-6606-3800", "emergency": "+91-33-6606-3939", "email": "info@amrihospitals.in"}'),
('33333333-3333-3333-3333-333333333333', 'Fortis Hospital Anandapur', 'hospital', '{"street": "730, Anandapur", "area": "EM Bypass", "landmark": "Near Ruby Hospital"}', 'Kolkata', 'West Bengal', '700107', ARRAY['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine'], 350, 35, 270, 25, '{"phone": "+91-33-6628-4444", "emergency": "+91-33-6628-4000", "email": "info@fortishealthcare.com"}'),
('44444444-4444-4444-4444-444444444444', 'Medica Superspecialty Hospital', 'hospital', '{"street": "127, Mukundapur", "area": "EM Bypass", "landmark": "Near Acropolis Mall"}', 'Kolkata', 'West Bengal', '700099', ARRAY['Cardiology', 'Oncology', 'Neurosurgery', 'Urology', 'General Medicine'], 450, 45, 340, 32, '{"phone": "+91-33-6652-0000", "emergency": "+91-33-6652-0100", "email": "info@medicasynergie.in"}');

-- Insert Staff (Doctors, Nurses, Admins)
-- Password for all users: "password123" (hashed with bcrypt)
INSERT INTO staff (staff_id, facility_id, first_name, last_name, email, password_hash, role, specialization, license_number, phone, language_preference) VALUES
-- Doctors
('d0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Rajesh', 'Kumar', 'dr.rajesh@medhaos.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'doctor', 'Cardiology', 'WB-MED-12345', '+91-98300-12345', 'hi'),
('d0000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Priya', 'Sharma', 'dr.priya@medhaos.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'doctor', 'General Medicine', 'WB-MED-12346', '+91-98300-12346', 'en'),
('d0000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Amit', 'Banerjee', 'dr.amit@medhaos.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'doctor', 'Neurology', 'WB-MED-12347', '+91-98300-12347', 'en'),
('d0000004-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'Sneha', 'Gupta', 'dr.sneha@medhaos.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'doctor', 'Pediatrics', 'WB-MED-12348', '+91-98300-12348', 'hi'),
('d0000005-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', 'Vikram', 'Singh', 'dr.vikram@medhaos.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'doctor', 'Orthopedics', 'WB-MED-12349', '+91-98300-12349', 'en'),
-- Nurses
('n0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Anjali', 'Das', 'nurse.anjali@medhaos.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'nurse', 'General Nursing', 'WB-NUR-54321', '+91-98300-54321', 'hi'),
('n0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Ritu', 'Chatterjee', 'nurse.ritu@medhaos.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'nurse', 'ICU Nursing', 'WB-NUR-54322', '+91-98300-54322', 'en'),
-- Admins
('a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Suresh', 'Patel', 'admin@medhaos.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin', NULL, NULL, '+91-98300-99999', 'en');

-- Insert Patients (Realistic Indian names and data)
INSERT INTO patients (patient_id, abha_id, first_name, last_name, date_of_birth, age, gender, phone, email, language_preference, address, city, state, pincode, blood_group) VALUES
('p0000001-0000-0000-0000-000000000001', '12-3456-7890-1234', 'Ramesh', 'Verma', '1975-03-15', 49, 'Male', '+91-98300-11111', 'ramesh.verma@email.com', 'hi', '{"street": "12/3, Park Street", "area": "Park Street", "landmark": "Near Metro Station"}', 'Kolkata', 'West Bengal', '700016', 'O+'),
('p0000002-0000-0000-0000-000000000002', '12-3456-7890-1235', 'Sunita', 'Devi', '1982-07-22', 42, 'Female', '+91-98300-11112', 'sunita.devi@email.com', 'hi', '{"street": "45, Gariahat Road", "area": "Gariahat", "landmark": "Near Market"}', 'Kolkata', 'West Bengal', '700019', 'A+'),
('p0000003-0000-0000-0000-000000000003', '12-3456-7890-1236', 'Arjun', 'Mukherjee', '1990-11-08', 34, 'Male', '+91-98300-11113', 'arjun.m@email.com', 'en', '{"street": "78, Salt Lake Sector 5", "area": "Salt Lake", "landmark": "Near Tank 5"}', 'Kolkata', 'West Bengal', '700091', 'B+'),
('p0000004-0000-0000-0000-000000000004', '12-3456-7890-1237', 'Kavita', 'Joshi', '1988-05-30', 36, 'Female', '+91-98300-11114', 'kavita.joshi@email.com', 'en', '{"street": "23, Ballygunge Circular Road", "area": "Ballygunge", "landmark": "Near Tram Depot"}', 'Kolkata', 'West Bengal', '700019', 'AB+'),
('p0000005-0000-0000-0000-000000000005', '12-3456-7890-1238', 'Manoj', 'Yadav', '1965-09-12', 59, 'Male', '+91-98300-11115', 'manoj.yadav@email.com', 'hi', '{"street": "56, EM Bypass", "area": "Kasba", "landmark": "Near Ruby Hospital"}', 'Kolkata', 'West Bengal', '700042', 'O-'),
('p0000006-0000-0000-0000-000000000006', '12-3456-7890-1239', 'Pooja', 'Agarwal', '1995-02-18', 29, 'Female', '+91-98300-11116', 'pooja.agarwal@email.com', 'en', '{"street": "89, Rajarhat', "area": "New Town", "landmark": "Near Eco Park"}', 'Kolkata', 'West Bengal', '700156', 'A-'),
('p0000007-0000-0000-0000-000000000007', '12-3456-7890-1240', 'Rajiv', 'Kapoor', '1978-12-25', 46, 'Male', '+91-98300-11117', 'rajiv.kapoor@email.com', 'hi', '{"street": "34, Alipore Road", "area": "Alipore", "landmark": "Near Zoo"}', 'Kolkata', 'West Bengal', '700027', 'B-'),
('p0000008-0000-0000-0000-000000000008', '12-3456-7890-1241', 'Meera', 'Nair', '2000-06-10', 24, 'Female', '+91-98300-11118', 'meera.nair@email.com', 'en', '{"street": "67, Howrah Station Road", "area": "Howrah", "landmark": "Near Station"}', 'Howrah', 'West Bengal', '711101', 'O+'),
('p0000009-0000-0000-0000-000000000009', '12-3456-7890-1242', 'Sanjay', 'Mishra', '1970-04-05', 54, 'Male', '+91-98300-11119', 'sanjay.mishra@email.com', 'hi', '{"street": "12, Behala Chowrasta", "area": "Behala", "landmark": "Near Tram Depot"}', 'Kolkata', 'West Bengal', '700034', 'AB-'),
('p0000010-0000-0000-0000-000000000010', '12-3456-7890-1243', 'Anita', 'Roy', '1985-08-20', 39, 'Female', '+91-98300-11120', 'anita.roy@email.com', 'en', '{"street": "45, Jadavpur 8B Bus Stand", "area": "Jadavpur", "landmark": "Near 8B Bus Stand"}', 'Kolkata', 'West Bengal', '700032', 'A+');

-- Insert Medical History
INSERT INTO medical_history (patient_id, condition, diagnosed_date, status, notes) VALUES
('p0000001-0000-0000-0000-000000000001', 'Hypertension', '2018-05-10', 'chronic', 'Controlled with medication'),
('p0000001-0000-0000-0000-000000000001', 'Type 2 Diabetes', '2019-08-15', 'chronic', 'HbA1c: 7.2%'),
('p0000002-0000-0000-0000-000000000002', 'Asthma', '2010-03-20', 'chronic', 'Uses inhaler as needed'),
('p0000005-0000-0000-0000-000000000005', 'Coronary Artery Disease', '2020-11-05', 'chronic', 'Post-angioplasty, on dual antiplatelet therapy'),
('p0000009-0000-0000-0000-000000000009', 'Chronic Kidney Disease Stage 3', '2021-06-12', 'chronic', 'eGFR: 45 ml/min');

-- Insert Allergies
INSERT INTO allergies (patient_id, allergen, allergen_type, reaction, severity) VALUES
('p0000001-0000-0000-0000-000000000001', 'Penicillin', 'drug', 'Rash and itching', 'moderate'),
('p0000002-0000-0000-0000-000000000002', 'Peanuts', 'food', 'Anaphylaxis', 'life-threatening'),
('p0000004-0000-0000-0000-000000000004', 'Aspirin', 'drug', 'Gastric irritation', 'mild'),
('p0000006-0000-0000-0000-000000000006', 'Sulfa drugs', 'drug', 'Severe rash', 'severe');

-- Insert Current Medications
INSERT INTO current_medications (patient_id, drug_name, dosage, frequency, route, start_date, prescribing_doctor_id, is_active) VALUES
('p0000001-0000-0000-0000-000000000001', 'Amlodipine', '5mg', 'Once daily', 'oral', '2023-01-15', 'd0000001-0000-0000-0000-000000000001', true),
('p0000001-0000-0000-0000-000000000001', 'Metformin', '500mg', 'Twice daily', 'oral', '2023-01-15', 'd0000002-0000-0000-0000-000000000002', true),
('p0000002-0000-0000-0000-000000000002', 'Salbutamol Inhaler', '100mcg', 'As needed', 'inhalation', '2023-06-01', 'd0000002-0000-0000-0000-000000000002', true),
('p0000005-0000-0000-0000-000000000005', 'Aspirin', '75mg', 'Once daily', 'oral', '2023-03-10', 'd0000001-0000-0000-0000-000000000001', true),
('p0000005-0000-0000-0000-000000000005', 'Atorvastatin', '40mg', 'Once daily at night', 'oral', '2023-03-10', 'd0000001-0000-0000-0000-000000000001', true);

-- Insert Clinical Encounters (Recent visits)
INSERT INTO clinical_encounters (encounter_id, patient_id, facility_id, clinician_id, encounter_type, urgency_score, chief_complaint, symptoms, vitals, status, created_at) VALUES
('e0000001-0000-0000-0000-000000000001', 'p0000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'd0000002-0000-0000-0000-000000000002', 'OPD', 45, 'Fever and cough for 3 days', ARRAY['fever', 'cough', 'body ache'], '{"temperature": 38.5, "blood_pressure": "120/80", "heart_rate": 88, "respiratory_rate": 18, "spo2": 97}', 'completed', NOW() - INTERVAL '2 days'),
('e0000002-0000-0000-0000-000000000002', 'p0000007-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 'd0000003-0000-0000-0000-000000000003', 'ED', 75, 'Severe headache and dizziness', ARRAY['headache', 'dizziness', 'nausea'], '{"temperature": 37.2, "blood_pressure": "160/100", "heart_rate": 95, "respiratory_rate": 20, "spo2": 98}', 'completed', NOW() - INTERVAL '1 day'),
('e0000003-0000-0000-0000-000000000003', 'p0000010-0000-0000-0000-000000000010', '33333333-3333-3333-3333-333333333333', 'd0000004-0000-0000-0000-000000000004', 'OPD', 30, 'Routine checkup', ARRAY[], '{"temperature": 36.8, "blood_pressure": "118/75", "heart_rate": 72, "respiratory_rate": 16, "spo2": 99}', 'completed', NOW() - INTERVAL '5 hours');

-- Insert Appointments (Upcoming and recent)
INSERT INTO appointments (appointment_id, patient_id, facility_id, clinician_id, appointment_type, specialty, scheduled_time, urgency_score, status, queue_position) VALUES
('a0000001-0000-0000-0000-000000000001', 'p0000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'd0000002-0000-0000-0000-000000000002', 'follow-up', 'General Medicine', NOW() + INTERVAL '2 hours', 40, 'scheduled', 3),
('a0000002-0000-0000-0000-000000000002', 'p0000004-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'd0000003-0000-0000-0000-000000000003', 'consultation', 'Neurology', NOW() + INTERVAL '4 hours', 55, 'scheduled', 1),
('a0000003-0000-0000-0000-000000000003', 'p0000006-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', 'd0000004-0000-0000-0000-000000000004', 'consultation', 'Pediatrics', NOW() + INTERVAL '1 day', 35, 'scheduled', 5),
('a0000004-0000-0000-0000-000000000004', 'p0000008-0000-0000-0000-000000000008', '44444444-4444-4444-4444-444444444444', 'd0000005-0000-0000-0000-000000000005', 'consultation', 'Orthopedics', NOW() + INTERVAL '3 hours', 60, 'confirmed', 2);

-- Success message
SELECT 'Database seeded successfully with realistic Indian healthcare data!' as message;
SELECT COUNT(*) as facilities_count FROM facilities;
SELECT COUNT(*) as staff_count FROM staff;
SELECT COUNT(*) as patients_count FROM patients;
SELECT COUNT(*) as appointments_count FROM appointments;

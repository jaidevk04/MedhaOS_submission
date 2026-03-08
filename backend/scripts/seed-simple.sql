-- MedhaOS Simple Seed Data - Valid UUIDs
-- Password for all users: password123

-- Insert Facilities
INSERT INTO facilities (facility_id, name, type, city, state, pincode, specialties, bed_capacity, icu_capacity, current_bed_occupancy, current_icu_occupancy) VALUES
('11111111-1111-1111-1111-111111111111', 'Apollo Gleneagles Hospital', 'hospital', 'Kolkata', 'West Bengal', '700054', ARRAY['Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'General Medicine'], 500, 50, 380, 35),
('22222222-2222-2222-2222-222222222222', 'AMRI Hospital Salt Lake', 'hospital', 'Kolkata', 'West Bengal', '700098', ARRAY['Cardiology', 'Gastroenterology', 'Nephrology', 'Pulmonology', 'General Medicine'], 400, 40, 310, 28),
('33333333-3333-3333-3333-333333333333', 'Fortis Hospital Anandapur', 'hospital', 'Kolkata', 'West Bengal', '700107', ARRAY['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine'], 350, 35, 270, 25),
('44444444-4444-4444-4444-444444444444', 'Medica Superspecialty Hospital', 'hospital', 'Kolkata', 'West Bengal', '700099', ARRAY['Cardiology', 'Oncology', 'Neurosurgery', 'Urology', 'General Medicine'], 450, 45, 340, 32);

-- Insert Staff
INSERT INTO staff (staff_id, facility_id, first_name, last_name, email, password_hash, role, specialization, license_number, phone, language_preference) VALUES
('10000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Rajesh', 'Kumar', 'dr.rajesh@medhaos.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'doctor', 'Cardiology', 'WB-MED-12345', '+91-98300-12345', 'hi'),
('10000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Priya', 'Sharma', 'dr.priya@medhaos.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'doctor', 'General Medicine', 'WB-MED-12346', '+91-98300-12346', 'en'),
('10000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Amit', 'Banerjee', 'dr.amit@medhaos.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'doctor', 'Neurology', 'WB-MED-12347', '+91-98300-12347', 'en'),
('10000004-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'Sneha', 'Gupta', 'dr.sneha@medhaos.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'doctor', 'Pediatrics', 'WB-MED-12348', '+91-98300-12348', 'hi'),
('10000005-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', 'Vikram', 'Singh', 'dr.vikram@medhaos.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'doctor', 'Orthopedics', 'WB-MED-12349', '+91-98300-12349', 'en'),
('20000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Anjali', 'Das', 'nurse.anjali@medhaos.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'nurse', 'General Nursing', 'WB-NUR-54321', '+91-98300-54321', 'hi'),
('20000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Ritu', 'Chatterjee', 'nurse.ritu@medhaos.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'nurse', 'ICU Nursing', 'WB-NUR-54322', '+91-98300-54322', 'en'),
('30000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Suresh', 'Patel', 'admin@medhaos.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin', NULL, NULL, '+91-98300-99999', 'en');

-- Insert Patients
INSERT INTO patients (patient_id, abha_id, first_name, last_name, date_of_birth, age, gender, phone, email, language_preference, city, state, pincode, blood_group) VALUES
('40000001-0000-0000-0000-000000000001', '12345678901234', 'Ramesh', 'Verma', '1975-03-15', 49, 'Male', '+91-98300-11111', 'ramesh.verma@email.com', 'hi', 'Kolkata', 'West Bengal', '700016', 'O+'),
('40000002-0000-0000-0000-000000000002', '12345678901235', 'Sunita', 'Devi', '1982-07-22', 42, 'Female', '+91-98300-11112', 'sunita.devi@email.com', 'hi', 'Kolkata', 'West Bengal', '700019', 'A+'),
('40000003-0000-0000-0000-000000000003', '12345678901236', 'Arjun', 'Mukherjee', '1990-11-08', 34, 'Male', '+91-98300-11113', 'arjun.m@email.com', 'en', 'Kolkata', 'West Bengal', '700091', 'B+'),
('40000004-0000-0000-0000-000000000004', '12345678901237', 'Kavita', 'Joshi', '1988-05-30', 36, 'Female', '+91-98300-11114', 'kavita.joshi@email.com', 'en', 'Kolkata', 'West Bengal', '700019', 'AB+'),
('40000005-0000-0000-0000-000000000005', '12345678901238', 'Manoj', 'Yadav', '1965-09-12', 59, 'Male', '+91-98300-11115', 'manoj.yadav@email.com', 'hi', 'Kolkata', 'West Bengal', '700042', 'O-'),
('40000006-0000-0000-0000-000000000006', '12345678901239', 'Pooja', 'Agarwal', '1995-02-18', 29, 'Female', '+91-98300-11116', 'pooja.agarwal@email.com', 'en', 'Kolkata', 'West Bengal', '700156', 'A-'),
('40000007-0000-0000-0000-000000000007', '12345678901240', 'Rajiv', 'Kapoor', '1978-12-25', 46, 'Male', '+91-98300-11117', 'rajiv.kapoor@email.com', 'hi', 'Kolkata', 'West Bengal', '700027', 'B-'),
('40000008-0000-0000-0000-000000000008', '12345678901241', 'Meera', 'Nair', '2000-06-10', 24, 'Female', '+91-98300-11118', 'meera.nair@email.com', 'en', 'Howrah', 'West Bengal', '711101', 'O+'),
('40000009-0000-0000-0000-000000000009', '12345678901242', 'Sanjay', 'Mishra', '1970-04-05', 54, 'Male', '+91-98300-11119', 'sanjay.mishra@email.com', 'hi', 'Kolkata', 'West Bengal', '700034', 'AB-'),
('40000010-0000-0000-0000-000000000010', '12345678901243', 'Anita', 'Roy', '1985-08-20', 39, 'Female', '+91-98300-11120', 'anita.roy@email.com', 'en', 'Kolkata', 'West Bengal', '700032', 'A+');

-- Insert Medical History
INSERT INTO medical_history (patient_id, condition, diagnosed_date, status, notes) VALUES
('40000001-0000-0000-0000-000000000001', 'Hypertension', '2018-05-10', 'chronic', 'Controlled with medication'),
('40000001-0000-0000-0000-000000000001', 'Type 2 Diabetes', '2019-08-15', 'chronic', 'HbA1c 7.2%'),
('40000002-0000-0000-0000-000000000002', 'Asthma', '2010-03-20', 'chronic', 'Uses inhaler as needed'),
('40000005-0000-0000-0000-000000000005', 'Coronary Artery Disease', '2020-11-05', 'chronic', 'Post-angioplasty'),
('40000009-0000-0000-0000-000000000009', 'Chronic Kidney Disease Stage 3', '2021-06-12', 'chronic', 'eGFR 45 ml/min');

-- Insert Allergies
INSERT INTO allergies (patient_id, allergen, allergen_type, reaction, severity) VALUES
('40000001-0000-0000-0000-000000000001', 'Penicillin', 'drug', 'Rash and itching', 'moderate'),
('40000002-0000-0000-0000-000000000002', 'Peanuts', 'food', 'Anaphylaxis', 'life-threatening'),
('40000004-0000-0000-0000-000000000004', 'Aspirin', 'drug', 'Gastric irritation', 'mild'),
('40000006-0000-0000-0000-000000000006', 'Sulfa drugs', 'drug', 'Severe rash', 'severe');

-- Insert Current Medications
INSERT INTO current_medications (patient_id, drug_name, dosage, frequency, route, start_date, prescribing_doctor_id, is_active) VALUES
('40000001-0000-0000-0000-000000000001', 'Amlodipine', '5mg', 'Once daily', 'oral', '2023-01-15', '10000001-0000-0000-0000-000000000001', true),
('40000001-0000-0000-0000-000000000001', 'Metformin', '500mg', 'Twice daily', 'oral', '2023-01-15', '10000002-0000-0000-0000-000000000002', true),
('40000002-0000-0000-0000-000000000002', 'Salbutamol Inhaler', '100mcg', 'As needed', 'inhalation', '2023-06-01', '10000002-0000-0000-0000-000000000002', true),
('40000005-0000-0000-0000-000000000005', 'Aspirin', '75mg', 'Once daily', 'oral', '2023-03-10', '10000001-0000-0000-0000-000000000001', true),
('40000005-0000-0000-0000-000000000005', 'Atorvastatin', '40mg', 'Once daily at night', 'oral', '2023-03-10', '10000001-0000-0000-0000-000000000001', true);

-- Success message
SELECT 'Database seeded successfully!' as message;
SELECT COUNT(*) as facilities FROM facilities;
SELECT COUNT(*) as staff FROM staff;
SELECT COUNT(*) as patients FROM patients;

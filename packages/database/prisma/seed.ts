/**
 * Database Seed Script
 * 
 * Populates the database with sample data for development and testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample facilities
  console.log('Creating facilities...');
  const apolloHospital = await prisma.facility.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Apollo Hospital',
      facilityType: 'hospital',
      addressLine1: 'Greams Road',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600006',
      latitude: 13.0569,
      longitude: 80.2497,
      phone: '+914428296000',
      email: 'info@apollohospitals.com',
      totalBeds: 400,
      icuBeds: 50,
    },
  });

  const fortisHospital = await prisma.facility.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Fortis Hospital',
      facilityType: 'hospital',
      addressLine1: 'Mulund Goregaon Link Road',
      city: 'Mumbai',
      district: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400078',
      latitude: 19.1646,
      longitude: 72.9505,
      phone: '+912267206700',
      email: 'info@fortishealthcare.com',
      totalBeds: 350,
      icuBeds: 45,
    },
  });

  console.log(`✅ Created ${2} facilities`);

  // Create sample patients
  console.log('Creating patients...');
  const patient1 = await prisma.patient.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      abhaId: '12345678901234',
      firstName: 'Ramesh',
      lastName: 'Kumar',
      dateOfBirth: new Date('1965-03-15'),
      gender: 'Male',
      languagePreference: 'Hindi',
      phone: '+919876543210',
      whatsapp: '+919876543210',
      email: 'ramesh.kumar@example.com',
      addressLine1: 'House No. 123, Sector 15',
      city: 'Mumbai',
      district: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      bloodGroup: 'O+',
      allergies: ['Penicillin', 'Sulfa drugs'],
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: { id: '00000000-0000-0000-0000-000000000102' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000102',
      abhaId: '98765432109876',
      firstName: 'Priya',
      lastName: 'Sharma',
      dateOfBirth: new Date('1990-07-22'),
      gender: 'Female',
      languagePreference: 'Tamil',
      phone: '+919123456789',
      whatsapp: '+919123456789',
      email: 'priya.sharma@example.com',
      addressLine1: 'Flat 45, Anna Nagar',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600040',
      bloodGroup: 'A+',
      allergies: [],
    },
  });

  console.log(`✅ Created ${2} patients`);

  // Create medical history for patient1
  console.log('Creating medical history...');
  await prisma.medicalHistory.createMany({
    data: [
      {
        patientId: patient1.id,
        condition: 'Myocardial Infarction',
        diagnosedDate: new Date('2020-05-10'),
        status: 'resolved',
        notes: 'Previous heart attack, underwent angioplasty',
      },
      {
        patientId: patient1.id,
        condition: 'Type 2 Diabetes Mellitus',
        diagnosedDate: new Date('2015-08-20'),
        status: 'chronic',
        notes: 'Managed with oral medications',
      },
      {
        patientId: patient1.id,
        condition: 'Hypertension',
        diagnosedDate: new Date('2012-03-15'),
        status: 'chronic',
        notes: 'Well controlled with medications',
      },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ Created medical history records`);

  // Create current medications for patient1
  console.log('Creating current medications...');
  await prisma.currentMedication.createMany({
    data: [
      {
        patientId: patient1.id,
        drugName: 'Aspirin',
        dosage: '75mg',
        frequency: 'Once daily',
        route: 'Oral',
        startDate: new Date('2020-05-15'),
        prescribedBy: 'Dr. Anjali Verma',
      },
      {
        patientId: patient1.id,
        drugName: 'Atorvastatin',
        dosage: '40mg',
        frequency: 'Once daily at night',
        route: 'Oral',
        startDate: new Date('2020-05-15'),
        prescribedBy: 'Dr. Anjali Verma',
      },
      {
        patientId: patient1.id,
        drugName: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        route: 'Oral',
        startDate: new Date('2015-08-20'),
        prescribedBy: 'Dr. Rajesh Patel',
      },
      {
        patientId: patient1.id,
        drugName: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        route: 'Oral',
        startDate: new Date('2012-03-15'),
        prescribedBy: 'Dr. Rajesh Patel',
      },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ Created current medications`);

  // Create a sample clinical encounter
  console.log('Creating clinical encounter...');
  const encounter = await prisma.clinicalEncounter.create({
    data: {
      patientId: patient1.id,
      facilityId: apolloHospital.id,
      encounterType: 'ED',
      encounterNumber: 'ED-2026-001234',
      urgencyScore: 78,
      chiefComplaint: 'Chest pain radiating to left arm',
      triageTimestamp: new Date(),
      triageSymptoms: ['Chest pain', 'Diaphoresis', 'Left arm pain'],
      temperature: 98.2,
      bloodPressure: '145/92',
      heartRate: 98,
      respiratoryRate: 18,
      oxygenSaturation: 96,
      subjective:
        '58M with chest pain x2h, pressure-like, radiating to left arm. History of MI (2020).',
      objective: 'Diaphoretic, BP 145/92, HR 98, RR 18, SpO2 96%',
      assessment: 'R/O STEMI, Acute Coronary Syndrome',
      plan: 'Troponin I (STAT), Repeat ECG in 15 min, Aspirin 300mg, Cardiology consult',
      status: 'in_progress',
    },
  });

  // Create diagnoses for the encounter
  await prisma.diagnosis.createMany({
    data: [
      {
        encounterId: encounter.id,
        icdCode: 'I21.9',
        description: 'Acute myocardial infarction, unspecified',
        diagnosisType: 'primary',
        confidence: 0.85,
      },
      {
        encounterId: encounter.id,
        icdCode: 'I20.0',
        description: 'Unstable angina',
        diagnosisType: 'differential',
        confidence: 0.72,
      },
    ],
  });

  // Create prescriptions
  await prisma.prescription.createMany({
    data: [
      {
        encounterId: encounter.id,
        drugName: 'Aspirin',
        dosage: '300mg',
        frequency: 'STAT',
        route: 'Oral',
        duration: 'Loading dose',
        instructions: 'Chew and swallow immediately',
      },
      {
        encounterId: encounter.id,
        drugName: 'Clopidogrel',
        dosage: '300mg',
        frequency: 'STAT',
        route: 'Oral',
        duration: 'Loading dose',
        instructions: 'Then 75mg daily',
      },
    ],
  });

  // Create diagnostic orders
  await prisma.diagnosticOrder.createMany({
    data: [
      {
        encounterId: encounter.id,
        testType: 'Troponin I',
        testCategory: 'laboratory',
        urgency: 'STAT',
        status: 'ordered',
      },
      {
        encounterId: encounter.id,
        testType: 'ECG',
        testCategory: 'radiology',
        urgency: 'STAT',
        status: 'completed',
      },
    ],
  });

  console.log(`✅ Created clinical encounter with related records`);

  // Create a sample diagnostic report
  console.log('Creating diagnostic report...');
  await prisma.diagnosticReport.create({
    data: {
      patientId: patient1.id,
      encounterId: encounter.id,
      reportType: 'radiology',
      modality: 'X-ray',
      imageUrls: ['https://storage.medhaos.com/images/chest-xray-001.dcm'],
      documentUrls: [],
      aiFindings: [
        'Cardiomegaly detected',
        'Pulmonary congestion present',
        'No acute infiltrates',
      ],
      aiAnomalies: {
        findings: [
          {
            type: 'Cardiomegaly',
            location: 'Cardiac silhouette',
            confidence: 0.89,
            severity: 'moderate',
          },
        ],
      },
      aiDraftReport:
        'Chest X-ray shows cardiomegaly with cardiothoracic ratio >0.5. Mild pulmonary vascular congestion noted. No acute infiltrates or pleural effusion.',
      aiConfidence: 0.89,
      processingTimeMs: 6500,
      status: 'ai_completed',
    },
  });

  console.log(`✅ Created diagnostic report`);

  // Create sample agent tasks
  console.log('Creating agent tasks...');
  await prisma.agentTask.createMany({
    data: [
      {
        agentName: 'AI Triage Agent',
        taskType: 'urgency_scoring',
        inputData: {
          symptoms: ['Chest pain', 'Diaphoresis', 'Left arm pain'],
          vitals: {
            bp: '145/92',
            hr: 98,
            temp: 98.2,
          },
        },
        outputData: {
          urgencyScore: 78,
          recommendation: 'Emergency Department',
          specialty: 'Cardiology',
        },
        confidenceScore: 0.92,
        escalatedToHuman: false,
        executionTimeMs: 1850,
        status: 'completed',
        completedAt: new Date(),
      },
      {
        agentName: 'Diagnostic Vision Agent',
        taskType: 'image_analysis',
        inputData: {
          imageUrl: 'https://storage.medhaos.com/images/chest-xray-001.dcm',
          modality: 'X-ray',
        },
        outputData: {
          findings: ['Cardiomegaly', 'Pulmonary congestion'],
          confidence: 0.89,
        },
        confidenceScore: 0.89,
        escalatedToHuman: false,
        executionTimeMs: 6500,
        status: 'completed',
        completedAt: new Date(),
      },
    ],
  });

  console.log(`✅ Created agent tasks`);

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

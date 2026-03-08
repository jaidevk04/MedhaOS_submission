/**
 * Test Data Generator for E2E Tests
 * Generates realistic test data for various scenarios
 */

import { faker } from '@faker-js/faker';

export interface TestPatient {
  id: string;
  abhaId: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email: string;
  languagePreference: string;
  medicalHistory: string[];
  allergies: string[];
  currentMedications: Medication[];
}

export interface Medication {
  drugName: string;
  dosage: string;
  frequency: string;
  startDate: string;
}

export interface TestAppointment {
  id: string;
  patientId: string;
  facilityId: string;
  facilityName: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  urgencyScore: number;
}

export class TestDataGenerator {
  /**
   * Generate a test patient with realistic data
   */
  static generatePatient(overrides: Partial<TestPatient> = {}): TestPatient {
    const gender = faker.helpers.arrayElement(['MALE', 'FEMALE', 'OTHER']);
    const firstName = faker.person.firstName(gender === 'MALE' ? 'male' : 'female');
    const lastName = faker.person.lastName();
    
    return {
      id: faker.string.uuid(),
      abhaId: `${faker.string.numeric(4)}-${faker.string.numeric(4)}-${faker.string.numeric(4)}-${faker.string.numeric(4)}`,
      name: `${firstName} ${lastName}`,
      age: faker.number.int({ min: 18, max: 85 }),
      gender,
      phone: `+91${faker.string.numeric(10)}`,
      email: faker.internet.email({ firstName, lastName }),
      languagePreference: faker.helpers.arrayElement(['hi', 'en', 'ta', 'te', 'kn', 'ml']),
      medicalHistory: this.generateMedicalHistory(),
      allergies: this.generateAllergies(),
      currentMedications: this.generateMedications(faker.number.int({ min: 0, max: 5 })),
      ...overrides,
    };
  }

  /**
   * Generate multiple test patients
   */
  static generatePatients(count: number): TestPatient[] {
    return Array.from({ length: count }, () => this.generatePatient());
  }

  /**
   * Generate a cardiac patient (for specific test scenarios)
   */
  static generateCardiacPatient(): TestPatient {
    return this.generatePatient({
      age: faker.number.int({ min: 50, max: 75 }),
      medicalHistory: ['Previous MI (2020)', 'Type 2 Diabetes', 'Hypertension'],
      allergies: ['Penicillin'],
      currentMedications: [
        { drugName: 'Aspirin', dosage: '75mg', frequency: 'Once daily', startDate: '2020-01-01' },
        { drugName: 'Atorvastatin', dosage: '40mg', frequency: 'Once daily', startDate: '2020-01-01' },
        { drugName: 'Metformin', dosage: '500mg', frequency: 'BID', startDate: '2015-01-01' },
      ],
    });
  }

  /**
   * Generate a diabetic patient
   */
  static generateDiabeticPatient(): TestPatient {
    return this.generatePatient({
      age: faker.number.int({ min: 40, max: 70 }),
      medicalHistory: ['Type 2 Diabetes', 'Hypertension'],
      allergies: ['Sulfa drugs'],
      currentMedications: [
        { drugName: 'Metformin', dosage: '1000mg', frequency: 'BID', startDate: '2015-01-01' },
        { drugName: 'Glimepiride', dosage: '2mg', frequency: 'Once daily', startDate: '2018-01-01' },
      ],
    });
  }

  /**
   * Generate a pediatric patient
   */
  static generatePediatricPatient(): TestPatient {
    return this.generatePatient({
      age: faker.number.int({ min: 1, max: 17 }),
      medicalHistory: ['Asthma'],
      allergies: [],
      currentMedications: [
        { drugName: 'Salbutamol Inhaler', dosage: '100mcg', frequency: 'PRN', startDate: '2023-01-01' },
      ],
    });
  }

  /**
   * Generate test appointment
   */
  static generateAppointment(patientId: string, overrides: Partial<TestAppointment> = {}): TestAppointment {
    const date = faker.date.future();
    
    return {
      id: faker.string.uuid(),
      patientId,
      facilityId: faker.string.uuid(),
      facilityName: faker.helpers.arrayElement([
        'Apollo Hospital',
        'Fortis Hospital',
        'Max Healthcare',
        'AIIMS',
        'Primary Health Center',
      ]),
      doctorName: `Dr. ${faker.person.firstName()} ${faker.person.lastName()}`,
      specialty: faker.helpers.arrayElement([
        'Cardiology',
        'Neurology',
        'Orthopedics',
        'General Medicine',
        'Pediatrics',
      ]),
      date: date.toISOString().split('T')[0],
      time: `${faker.number.int({ min: 8, max: 17 })}:${faker.helpers.arrayElement(['00', '30'])}`,
      status: 'SCHEDULED',
      urgencyScore: faker.number.int({ min: 30, max: 95 }),
      ...overrides,
    };
  }

  /**
   * Generate medical history
   */
  private static generateMedicalHistory(): string[] {
    const conditions = [
      'Hypertension',
      'Type 2 Diabetes',
      'Asthma',
      'COPD',
      'Previous MI',
      'Stroke',
      'Chronic Kidney Disease',
      'Hypothyroidism',
    ];
    
    const count = faker.number.int({ min: 0, max: 3 });
    return faker.helpers.arrayElements(conditions, count);
  }

  /**
   * Generate allergies
   */
  private static generateAllergies(): string[] {
    const allergies = [
      'Penicillin',
      'Sulfa drugs',
      'Aspirin',
      'NSAIDs',
      'Latex',
      'Shellfish',
    ];
    
    const count = faker.number.int({ min: 0, max: 2 });
    return faker.helpers.arrayElements(allergies, count);
  }

  /**
   * Generate medications
   */
  private static generateMedications(count: number): Medication[] {
    const drugs = [
      { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily' },
      { name: 'Atorvastatin', dosage: '40mg', frequency: 'Once daily' },
      { name: 'Metformin', dosage: '500mg', frequency: 'BID' },
      { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' },
      { name: 'Levothyroxine', dosage: '50mcg', frequency: 'Once daily' },
    ];
    
    return faker.helpers.arrayElements(drugs, count).map(drug => ({
      drugName: drug.name,
      dosage: drug.dosage,
      frequency: drug.frequency,
      startDate: faker.date.past({ years: 2 }).toISOString().split('T')[0],
    }));
  }

  /**
   * Generate symptoms for triage
   */
  static generateSymptoms(severity: 'MILD' | 'MODERATE' | 'SEVERE'): string[] {
    const mildSymptoms = ['mild fever', 'body ache', 'fatigue', 'headache'];
    const moderateSymptoms = ['high fever', 'persistent cough', 'chest discomfort', 'dizziness'];
    const severeSymptoms = ['chest pain', 'difficulty breathing', 'severe headache', 'confusion'];
    
    switch (severity) {
      case 'MILD':
        return faker.helpers.arrayElements(mildSymptoms, faker.number.int({ min: 1, max: 3 }));
      case 'MODERATE':
        return faker.helpers.arrayElements(moderateSymptoms, faker.number.int({ min: 2, max: 4 }));
      case 'SEVERE':
        return faker.helpers.arrayElements(severeSymptoms, faker.number.int({ min: 2, max: 4 }));
    }
  }

  /**
   * Generate vitals
   */
  static generateVitals(abnormal: boolean = false) {
    if (abnormal) {
      return {
        temperature: faker.number.float({ min: 100, max: 103, precision: 0.1 }),
        bloodPressure: `${faker.number.int({ min: 140, max: 180 })}/${faker.number.int({ min: 90, max: 110 })}`,
        heartRate: faker.number.int({ min: 90, max: 120 }),
        respiratoryRate: faker.number.int({ min: 20, max: 28 }),
        spo2: faker.number.int({ min: 88, max: 94 }),
      };
    }
    
    return {
      temperature: faker.number.float({ min: 97, max: 99, precision: 0.1 }),
      bloodPressure: `${faker.number.int({ min: 110, max: 130 })}/${faker.number.int({ min: 70, max: 85 })}`,
      heartRate: faker.number.int({ min: 60, max: 90 }),
      respiratoryRate: faker.number.int({ min: 12, max: 18 }),
      spo2: faker.number.int({ min: 95, max: 100 }),
    };
  }

  /**
   * Clean up test data
   */
  static async cleanupTestData(apiBaseUrl: string, authToken: string, patientIds: string[]) {
    for (const patientId of patientIds) {
      try {
        await fetch(`${apiBaseUrl}/api/v1/patients/${patientId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
      } catch (error) {
        console.error(`Failed to cleanup patient ${patientId}:`, error);
      }
    }
  }
}

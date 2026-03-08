/**
 * Integration Test Setup
 * Configures test environment and provides utilities for integration tests
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

export interface TestContext {
  prisma: PrismaClient;
  redis: Redis;
  apiBaseUrl: string;
  testUserId: string;
  testPatientId: string;
  cleanup: () => Promise<void>;
}

let testContext: TestContext | null = null;

/**
 * Initialize test environment
 */
export async function setupTestEnvironment(): Promise<TestContext> {
  if (testContext) {
    return testContext;
  }

  // Initialize database connection
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/medhaos_test',
      },
    },
  });

  // Initialize Redis connection
  const redis = new Redis({
    host: process.env.TEST_REDIS_HOST || 'localhost',
    port: parseInt(process.env.TEST_REDIS_PORT || '6379'),
    db: parseInt(process.env.TEST_REDIS_DB || '1'),
  });

  // API base URL
  const apiBaseUrl = process.env.TEST_API_BASE_URL || 'http://localhost:3000';

  // Create test user and patient
  const testUser = await prisma.user.create({
    data: {
      email: `test-${Date.now()}@medhaos.test`,
      name: 'Test User',
      role: 'DOCTOR',
      password: 'test-password-hash',
    },
  });

  const testPatient = await prisma.patient.create({
    data: {
      abhaId: `test-abha-${Date.now()}`,
      name: 'Test Patient',
      age: 45,
      gender: 'MALE',
      languagePreference: 'en',
      phone: '+919876543210',
    },
  });

  // Cleanup function
  const cleanup = async () => {
    await prisma.patient.deleteMany({
      where: { id: testPatient.id },
    });
    await prisma.user.deleteMany({
      where: { id: testUser.id },
    });
    await redis.flushdb();
    await prisma.$disconnect();
    await redis.quit();
  };

  testContext = {
    prisma,
    redis,
    apiBaseUrl,
    testUserId: testUser.id,
    testPatientId: testPatient.id,
    cleanup,
  };

  return testContext;
}

/**
 * Teardown test environment
 */
export async function teardownTestEnvironment(): Promise<void> {
  if (testContext) {
    await testContext.cleanup();
    testContext = null;
  }
}

/**
 * Create test authentication token
 */
export async function createTestAuthToken(userId: string): Promise<string> {
  // This would use your actual JWT signing logic
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, role: 'DOCTOR' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

/**
 * Wait for async operation with timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Generate test patient data
 */
export function generateTestPatientData(overrides: any = {}) {
  return {
    abhaId: `test-abha-${Date.now()}-${Math.random()}`,
    name: 'Test Patient',
    age: 45,
    gender: 'MALE',
    languagePreference: 'en',
    phone: '+919876543210',
    ...overrides,
  };
}

/**
 * Generate test clinical encounter data
 */
export function generateTestEncounterData(patientId: string, overrides: any = {}) {
  return {
    patientId,
    encounterType: 'OPD',
    chiefComplaint: 'Chest pain',
    urgencyScore: 75,
    status: 'IN_PROGRESS',
    triageData: {
      symptoms: ['chest pain', 'shortness of breath'],
      vitals: {
        temperature: 98.6,
        bloodPressure: '140/90',
        heartRate: 85,
        respiratoryRate: 18,
        spo2: 96,
      },
    },
    ...overrides,
  };
}

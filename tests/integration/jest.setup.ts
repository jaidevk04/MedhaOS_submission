/**
 * Jest Setup for Integration Tests
 * Configures global test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/medhaos_test';
process.env.TEST_REDIS_HOST = process.env.TEST_REDIS_HOST || 'localhost';
process.env.TEST_REDIS_PORT = process.env.TEST_REDIS_PORT || '6379';
process.env.TEST_REDIS_DB = process.env.TEST_REDIS_DB || '1';
process.env.TEST_API_BASE_URL = process.env.TEST_API_BASE_URL || 'http://localhost:3000';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
};

// Mock external services if needed
beforeAll(() => {
  console.info('Starting integration test suite...');
});

afterAll(() => {
  console.info('Integration test suite completed.');
});

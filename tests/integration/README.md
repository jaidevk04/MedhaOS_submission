# Integration Test Suite

This directory contains integration tests for the MedhaOS Healthcare Intelligence Ecosystem.

## Test Structure

- `patient-journey/` - End-to-end patient journey tests
- `multi-agent/` - Multi-agent workflow tests
- `external-integrations/` - External system integration tests
- `performance/` - Performance benchmark tests
- `fixtures/` - Test data and fixtures
- `utils/` - Test utilities and helpers

## Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test suite
npm run test:integration -- patient-journey

# Run with coverage
npm run test:integration:coverage
```

## Test Requirements

All integration tests must:
- Test real system interactions (no mocks for core functionality)
- Include proper setup and teardown
- Be idempotent and isolated
- Include performance assertions
- Validate against requirements

## Environment Setup

Integration tests require:
- Running database (PostgreSQL, DynamoDB)
- Redis cache
- Event bus (EventBridge/Kafka)
- Test API keys for external services

Use `docker-compose.test.yml` to spin up test infrastructure.

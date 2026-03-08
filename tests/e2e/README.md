# End-to-End Test Suite

This directory contains E2E tests for the MedhaOS Healthcare Intelligence Ecosystem.

## Test Structure

- `web/` - Playwright tests for web applications (Admin Dashboard, Public Health Dashboard)
- `mobile/` - Appium tests for mobile applications (Patient Mobile App, Nurse Tablet)
- `fixtures/` - Test data generators
- `utils/` - Test utilities and helpers
- `visual/` - Visual regression test baselines

## Running Tests

### Web Tests (Playwright)
```bash
# Run all web tests
npm run test:e2e:web

# Run specific browser
npm run test:e2e:web -- --project=chromium

# Run with UI mode
npm run test:e2e:web -- --ui

# Update visual baselines
npm run test:e2e:web -- --update-snapshots
```

### Mobile Tests (Appium)
```bash
# Run Android tests
npm run test:e2e:android

# Run iOS tests
npm run test:e2e:ios

# Run on specific device
npm run test:e2e:android -- --device="Pixel_7"
```

## Prerequisites

### Web Testing
- Node.js 18+
- Playwright browsers installed: `npx playwright install`

### Mobile Testing
- Appium 2.0+
- Android SDK (for Android tests)
- Xcode (for iOS tests, macOS only)
- Device emulators/simulators configured

## Environment Setup

```bash
# Install dependencies
npm install

# Setup Playwright
npx playwright install --with-deps

# Setup Appium
npm install -g appium
appium driver install uiautomator2  # Android
appium driver install xcuitest      # iOS
```

## Test Data

E2E tests use generated test data to ensure isolation. Each test run creates fresh test users and patients.

## Visual Regression Testing

Visual tests capture screenshots and compare against baselines. Update baselines when UI changes are intentional:

```bash
npm run test:e2e:web -- --update-snapshots
```

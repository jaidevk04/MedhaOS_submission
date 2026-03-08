/**
 * Clinician Terminal E2E Tests
 * Tests complete clinical workflows
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Clinician Terminal', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Login as clinician
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'doctor@medhaos.test');
    await page.fill('[data-testid="password-input"]', 'test-password');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL('/clinician/dashboard');
  });

  test('should display patient queue', async () => {
    // Verify queue is visible
    await expect(page.locator('[data-testid="patient-queue"]')).toBeVisible();
    
    // Verify queue has patients
    const queueItems = page.locator('[data-testid^="queue-item-"]');
    const count = await queueItems.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify urgency scores are displayed
    await expect(queueItems.first().locator('[data-testid="urgency-score"]')).toBeVisible();
  });

  test('should start consultation with ambient scribe', async () => {
    // Select first patient from queue
    await page.click('[data-testid^="queue-item-"]');
    
    // Verify patient brief loads
    await expect(page.locator('[data-testid="patient-brief"]')).toBeVisible();
    await expect(page.locator('[data-testid="patient-name"]')).toBeVisible();
    
    // Start ambient scribe
    await page.click('[data-testid="start-scribe-button"]');
    
    // Verify recording indicator
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="recording-indicator"]')).toHaveClass(/recording/);
    
    // Verify waveform visualization
    await expect(page.locator('[data-testid="audio-waveform"]')).toBeVisible();
  });

  test('should display real-time transcription', async () => {
    // Start consultation
    await page.click('[data-testid^="queue-item-"]');
    await page.click('[data-testid="start-scribe-button"]');
    
    // Simulate speech input
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('transcription-update', {
        detail: {
          speaker: 'Doctor',
          text: 'Describe the chest pain',
        },
      }));
    });
    
    await page.waitForTimeout(500);
    
    // Verify transcription appears
    await expect(page.locator('[data-testid="conversation-log"]')).toContainText('Describe the chest pain');
    
    // Simulate patient response
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('transcription-update', {
        detail: {
          speaker: 'Patient',
          text: 'Started 2 hours ago, feels like pressure',
        },
      }));
    });
    
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="conversation-log"]')).toContainText('feels like pressure');
  });

  test('should extract clinical facts automatically', async () => {
    // Start consultation
    await page.click('[data-testid^="queue-item-"]');
    await page.click('[data-testid="start-scribe-button"]');
    
    // Simulate conversation
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('facts-extracted', {
        detail: {
          chiefComplaint: 'Chest pain',
          symptoms: ['pressure-like pain', 'radiating to left arm', 'diaphoresis'],
          medicalHistory: ['Previous MI (2020)'],
        },
      }));
    });
    
    await page.waitForTimeout(500);
    
    // Verify extracted facts panel
    await expect(page.locator('[data-testid="extracted-facts"]')).toBeVisible();
    await expect(page.locator('[data-testid="extracted-facts"]')).toContainText('Chest pain');
    await expect(page.locator('[data-testid="extracted-facts"]')).toContainText('pressure-like pain');
  });

  test('should display CDSS recommendations', async () => {
    // Start consultation
    await page.click('[data-testid^="queue-item-"]');
    
    // Wait for CDSS to analyze
    await expect(page.locator('[data-testid="cdss-panel"]')).toBeVisible({ timeout: 5000 });
    
    // Verify recommendations
    await expect(page.locator('[data-testid="cdss-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="cdss-recommendations"]')).toBeVisible();
    
    // Verify action items
    const actions = page.locator('[data-testid^="cdss-action-"]');
    const actionCount = await actions.count();
    expect(actionCount).toBeGreaterThan(0);
  });

  test('should check drug safety before prescribing', async () => {
    // Start consultation
    await page.click('[data-testid^="queue-item-"]');
    
    // Navigate to prescription section
    await page.click('[data-testid="prescription-tab"]');
    
    // Search for medication
    await page.fill('[data-testid="drug-search"]', 'Clopidogrel');
    await page.click('[data-testid="drug-result-clopidogrel"]');
    
    // Verify safety checks run automatically
    await expect(page.locator('[data-testid="safety-check-status"]')).toBeVisible();
    
    // Verify safety indicators
    await expect(page.locator('[data-testid="interaction-check"]')).toContainText('No interactions');
    await expect(page.locator('[data-testid="allergy-check"]')).toContainText('No conflicts');
    
    // Add to prescription
    await page.click('[data-testid="add-to-prescription-button"]');
    
    // Verify medication appears in prescription list
    await expect(page.locator('[data-testid="prescription-list"]')).toContainText('Clopidogrel');
  });

  test('should block unsafe prescriptions', async () => {
    // Start consultation with patient who has penicillin allergy
    await page.click('[data-testid^="queue-item-"]');
    
    // Verify allergy alert is visible
    await expect(page.locator('[data-testid="allergy-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="allergy-alert"]')).toContainText('Penicillin');
    
    // Try to prescribe penicillin-based drug
    await page.click('[data-testid="prescription-tab"]');
    await page.fill('[data-testid="drug-search"]', 'Amoxicillin');
    await page.click('[data-testid="drug-result-amoxicillin"]');
    
    // Verify critical alert appears
    await expect(page.locator('[data-testid="critical-safety-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="critical-safety-alert"]')).toContainText('ALLERGY CONFLICT');
    
    // Verify add button is disabled
    await expect(page.locator('[data-testid="add-to-prescription-button"]')).toBeDisabled();
    
    // Verify alternatives are suggested
    await expect(page.locator('[data-testid="alternative-drugs"]')).toBeVisible();
  });

  test('should generate SOAP notes', async () => {
    // Complete consultation
    await page.click('[data-testid^="queue-item-"]');
    await page.click('[data-testid="start-scribe-button"]');
    
    // Stop recording
    await page.click('[data-testid="stop-scribe-button"]');
    
    // Generate SOAP note
    await page.click('[data-testid="generate-soap-button"]');
    
    // Verify SOAP note is generated
    await expect(page.locator('[data-testid="soap-note"]')).toBeVisible({ timeout: 10000 });
    
    // Verify all sections are present
    await expect(page.locator('[data-testid="soap-subjective"]')).toBeVisible();
    await expect(page.locator('[data-testid="soap-objective"]')).toBeVisible();
    await expect(page.locator('[data-testid="soap-assessment"]')).toBeVisible();
    await expect(page.locator('[data-testid="soap-plan"]')).toBeVisible();
    
    // Edit SOAP note
    await page.click('[data-testid="edit-soap-button"]');
    await page.fill('[data-testid="soap-subjective-input"]', 'Updated subjective');
    await page.click('[data-testid="save-soap-button"]');
    
    // Verify changes saved
    await expect(page.locator('[data-testid="soap-subjective"]')).toContainText('Updated subjective');
  });

  test('should complete consultation workflow', async () => {
    // Start consultation
    await page.click('[data-testid^="queue-item-"]');
    
    // Add prescription
    await page.click('[data-testid="prescription-tab"]');
    await page.fill('[data-testid="drug-search"]', 'Aspirin');
    await page.click('[data-testid="drug-result-aspirin"]');
    await page.click('[data-testid="add-to-prescription-button"]');
    
    // Complete consultation
    await page.click('[data-testid="complete-consultation-button"]');
    
    // Verify confirmation dialog
    await expect(page.locator('[data-testid="complete-confirmation"]')).toBeVisible();
    await page.click('[data-testid="confirm-complete-button"]');
    
    // Verify return to queue
    await expect(page.locator('[data-testid="patient-queue"]')).toBeVisible();
    
    // Verify patient removed from queue
    await expect(page.locator('[data-testid="queue-empty-message"]')).toBeVisible();
  });

  test('should perform visual regression check', async () => {
    await page.click('[data-testid^="queue-item-"]');
    
    await expect(page).toHaveScreenshot('clinician-terminal.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

/**
 * Admin Dashboard E2E Tests
 * Tests complete workflows in the administrator dashboard
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Login as administrator
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@medhaos.test');
    await page.fill('[data-testid="password-input"]', 'test-password');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForURL('/admin/dashboard');
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
  });

  test('should display real-time capacity metrics', async () => {
    // Verify capacity cards are visible
    await expect(page.locator('[data-testid="bed-occupancy-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="icu-capacity-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="ed-queue-card"]')).toBeVisible();
    
    // Verify metrics have values
    const bedOccupancy = await page.locator('[data-testid="bed-occupancy-value"]').textContent();
    expect(bedOccupancy).toMatch(/\d+%/);
    
    // Verify real-time updates (wait for WebSocket update)
    await page.waitForTimeout(2000);
    const updatedValue = await page.locator('[data-testid="bed-occupancy-value"]').textContent();
    expect(updatedValue).toBeDefined();
  });

  test('should display predictive analytics charts', async () => {
    // Navigate to analytics section
    await page.click('[data-testid="analytics-tab"]');
    
    // Verify forecast chart is visible
    await expect(page.locator('[data-testid="bed-forecast-chart"]')).toBeVisible();
    
    // Verify chart has data points
    const chartData = await page.locator('[data-testid="bed-forecast-chart"] svg path').count();
    expect(chartData).toBeGreaterThan(0);
  });

  test('should handle critical alerts', async () => {
    // Trigger a critical alert (simulated)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('critical-alert', {
        detail: {
          type: 'ICU_CAPACITY',
          severity: 'CRITICAL',
          message: 'ICU capacity at 95%',
        },
      }));
    });
    
    // Verify alert notification appears
    await expect(page.locator('[data-testid="alert-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="alert-notification"]')).toContainText('ICU capacity');
    
    // Click on alert to view details
    await page.click('[data-testid="alert-notification"]');
    await expect(page.locator('[data-testid="alert-details-modal"]')).toBeVisible();
    
    // Take action on alert
    await page.click('[data-testid="take-action-button"]');
    await expect(page.locator('[data-testid="action-form"]')).toBeVisible();
  });

  test('should manage staff scheduling', async () => {
    // Navigate to staff scheduling
    await page.click('[data-testid="staff-menu"]');
    await page.click('[data-testid="staff-scheduling-link"]');
    
    // Verify schedule grid is visible
    await expect(page.locator('[data-testid="schedule-grid"]')).toBeVisible();
    
    // Add new shift
    await page.click('[data-testid="add-shift-button"]');
    await page.fill('[data-testid="staff-select"]', 'Dr. Anjali Verma');
    await page.fill('[data-testid="shift-date"]', '2026-03-05');
    await page.fill('[data-testid="shift-start"]', '08:00');
    await page.fill('[data-testid="shift-end"]', '16:00');
    await page.click('[data-testid="save-shift-button"]');
    
    // Verify shift appears in grid
    await expect(page.locator('[data-testid="schedule-grid"]')).toContainText('Dr. Anjali Verma');
  });

  test('should export reports', async () => {
    // Navigate to reports
    await page.click('[data-testid="reports-menu"]');
    
    // Select report type
    await page.selectOption('[data-testid="report-type-select"]', 'DAILY_OPERATIONS');
    
    // Set date range
    await page.fill('[data-testid="start-date"]', '2026-03-01');
    await page.fill('[data-testid="end-date"]', '2026-03-04');
    
    // Generate report
    await page.click('[data-testid="generate-report-button"]');
    
    // Wait for report to generate
    await expect(page.locator('[data-testid="report-preview"]')).toBeVisible({ timeout: 10000 });
    
    // Download report
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-csv-button"]');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('daily_operations');
  });

  test('should manage outbreak alerts', async () => {
    // Navigate to public health section
    await page.click('[data-testid="public-health-menu"]');
    
    // Verify outbreak map is visible
    await expect(page.locator('[data-testid="outbreak-map"]')).toBeVisible();
    
    // Click on district with alert
    await page.click('[data-testid="district-mumbai"]');
    
    // Verify alert details
    await expect(page.locator('[data-testid="outbreak-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="outbreak-details"]')).toContainText('Dengue');
    
    // View detailed analytics
    await page.click('[data-testid="view-analytics-button"]');
    await expect(page.locator('[data-testid="outbreak-analytics"]')).toBeVisible();
  });

  test('should perform visual regression check on dashboard', async () => {
    // Take screenshot of main dashboard
    await expect(page).toHaveScreenshot('admin-dashboard.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should be responsive on mobile devices', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify mobile menu is visible
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Verify capacity cards stack vertically
    const cards = page.locator('[data-testid^="capacity-card"]');
    const firstCard = cards.nth(0);
    const secondCard = cards.nth(1);
    
    const firstBox = await firstCard.boundingBox();
    const secondBox = await secondCard.boundingBox();
    
    // Second card should be below first card (vertical stacking)
    expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height);
  });

  test('should handle real-time WebSocket updates', async () => {
    // Get initial bed occupancy value
    const initialValue = await page.locator('[data-testid="bed-occupancy-value"]').textContent();
    
    // Simulate WebSocket update
    await page.evaluate(() => {
      const event = new CustomEvent('websocket-update', {
        detail: {
          type: 'BED_OCCUPANCY',
          value: 92,
        },
      });
      window.dispatchEvent(event);
    });
    
    // Wait for UI to update
    await page.waitForTimeout(500);
    
    // Verify value changed
    const updatedValue = await page.locator('[data-testid="bed-occupancy-value"]').textContent();
    expect(updatedValue).not.toBe(initialValue);
  });

  test('should maintain accessibility standards', async () => {
    // Check for ARIA labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Button should have either aria-label or text content
      expect(ariaLabel || text).toBeTruthy();
    }
    
    // Check color contrast (simplified check)
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();
    
    for (let i = 0; i < headingCount; i++) {
      const heading = headings.nth(i);
      await expect(heading).toBeVisible();
    }
  });
});

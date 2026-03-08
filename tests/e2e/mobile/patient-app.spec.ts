/**
 * Patient Mobile App E2E Tests (Appium)
 * Tests complete patient workflows on mobile
 */

import { remote, RemoteOptions } from 'webdriverio';

describe('Patient Mobile App', () => {
  let driver: WebdriverIO.Browser;

  const androidCapabilities: RemoteOptions = {
    capabilities: {
      platformName: 'Android',
      'appium:deviceName': 'Android Emulator',
      'appium:platformVersion': '13',
      'appium:app': './apps/patient-mobile/android/app/build/outputs/apk/release/app-release.apk',
      'appium:automationName': 'UiAutomator2',
      'appium:newCommandTimeout': 300,
    },
  };

  beforeAll(async () => {
    driver = await remote({
      ...androidCapabilities,
      logLevel: 'info',
      port: 4723,
    });
  });

  afterAll(async () => {
    if (driver) {
      await driver.deleteSession();
    }
  });

  describe('Registration and Login', () => {
    it('should complete patient registration', async () => {
      // Wait for app to load
      await driver.pause(2000);
      
      // Click on register button
      const registerButton = await driver.$('~register-button');
      await registerButton.waitForDisplayed({ timeout: 5000 });
      await registerButton.click();
      
      // Fill registration form
      const nameInput = await driver.$('~name-input');
      await nameInput.setValue('Test Patient');
      
      const phoneInput = await driver.$('~phone-input');
      await phoneInput.setValue('9876543210');
      
      const abhaInput = await driver.$('~abha-input');
      await abhaInput.setValue('1234-5678-9012-3456');
      
      // Select language
      const languageDropdown = await driver.$('~language-dropdown');
      await languageDropdown.click();
      
      const hindiOption = await driver.$('~language-hindi');
      await hindiOption.click();
      
      // Submit registration
      const submitButton = await driver.$('~submit-registration');
      await submitButton.click();
      
      // Verify OTP screen appears
      const otpScreen = await driver.$('~otp-screen');
      await otpScreen.waitForDisplayed({ timeout: 5000 });
      
      expect(await otpScreen.isDisplayed()).toBe(true);
    });

    it('should login with credentials', async () => {
      // Enter phone number
      const phoneInput = await driver.$('~phone-input');
      await phoneInput.setValue('9876543210');
      
      // Click login
      const loginButton = await driver.$('~login-button');
      await loginButton.click();
      
      // Enter OTP (test OTP: 123456)
      const otpInputs = await driver.$$('~otp-digit');
      await otpInputs[0].setValue('1');
      await otpInputs[1].setValue('2');
      await otpInputs[2].setValue('3');
      await otpInputs[3].setValue('4');
      await otpInputs[4].setValue('5');
      await otpInputs[5].setValue('6');
      
      // Verify home screen loads
      const homeScreen = await driver.$('~home-screen');
      await homeScreen.waitForDisplayed({ timeout: 5000 });
      
      expect(await homeScreen.isDisplayed()).toBe(true);
    });
  });

  describe('Voice-Based Triage', () => {
    it('should start voice triage', async () => {
      // Navigate to home screen
      const homeTab = await driver.$('~home-tab');
      await homeTab.click();
      
      // Click voice button
      const voiceButton = await driver.$('~voice-triage-button');
      await voiceButton.waitForDisplayed({ timeout: 5000 });
      await voiceButton.click();
      
      // Verify recording indicator
      const recordingIndicator = await driver.$('~recording-indicator');
      await recordingIndicator.waitForDisplayed({ timeout: 2000 });
      
      expect(await recordingIndicator.isDisplayed()).toBe(true);
    });

    it('should display transcription in real-time', async () => {
      // Start voice triage
      const voiceButton = await driver.$('~voice-triage-button');
      await voiceButton.click();
      
      // Wait for transcription to appear (simulated)
      await driver.pause(3000);
      
      // Verify transcription text
      const transcriptionText = await driver.$('~transcription-text');
      await transcriptionText.waitForDisplayed({ timeout: 5000 });
      
      expect(await transcriptionText.isDisplayed()).toBe(true);
    });

    it('should show urgency score result', async () => {
      // Complete triage flow (simulated)
      const voiceButton = await driver.$('~voice-triage-button');
      await voiceButton.click();
      
      await driver.pause(5000); // Wait for AI processing
      
      // Verify urgency score screen
      const urgencyScreen = await driver.$('~urgency-result-screen');
      await urgencyScreen.waitForDisplayed({ timeout: 10000 });
      
      const urgencyScore = await driver.$('~urgency-score-value');
      const scoreText = await urgencyScore.getText();
      
      expect(parseInt(scoreText)).toBeGreaterThan(0);
      expect(parseInt(scoreText)).toBeLessThanOrEqual(100);
    });

    it('should recommend appropriate facility', async () => {
      // After urgency score is displayed
      const facilityCard = await driver.$('~recommended-facility');
      await facilityCard.waitForDisplayed({ timeout: 5000 });
      
      // Verify facility details
      const facilityName = await driver.$('~facility-name');
      const distance = await driver.$('~facility-distance');
      const waitTime = await driver.$('~facility-wait-time');
      
      expect(await facilityName.isDisplayed()).toBe(true);
      expect(await distance.isDisplayed()).toBe(true);
      expect(await waitTime.isDisplayed()).toBe(true);
    });
  });

  describe('Appointment Booking', () => {
    it('should book appointment from triage result', async () => {
      // From urgency result screen
      const bookButton = await driver.$('~book-appointment-button');
      await bookButton.click();
      
      // Verify appointment confirmation
      const confirmationScreen = await driver.$('~appointment-confirmation');
      await confirmationScreen.waitForDisplayed({ timeout: 5000 });
      
      const confirmButton = await driver.$('~confirm-appointment');
      await confirmButton.click();
      
      // Verify success message
      const successMessage = await driver.$('~booking-success');
      await successMessage.waitForDisplayed({ timeout: 5000 });
      
      expect(await successMessage.isDisplayed()).toBe(true);
    });

    it('should display appointment in list', async () => {
      // Navigate to appointments tab
      const appointmentsTab = await driver.$('~appointments-tab');
      await appointmentsTab.click();
      
      // Verify appointment list
      const appointmentList = await driver.$('~appointment-list');
      await appointmentList.waitForDisplayed({ timeout: 5000 });
      
      // Verify at least one appointment
      const appointments = await driver.$$('~appointment-item');
      expect(appointments.length).toBeGreaterThan(0);
    });

    it('should navigate to facility', async () => {
      // From appointment details
      const navigateButton = await driver.$('~navigate-button');
      await navigateButton.click();
      
      // Verify map opens (external app)
      await driver.pause(2000);
      
      // Return to app
      await driver.back();
      
      const appointmentScreen = await driver.$('~appointment-details');
      expect(await appointmentScreen.isDisplayed()).toBe(true);
    });
  });

  describe('Medication Reminders', () => {
    it('should display medication schedule', async () => {
      // Navigate to medications tab
      const medsTab = await driver.$('~medications-tab');
      await medsTab.click();
      
      // Verify medication list
      const medList = await driver.$('~medication-list');
      await medList.waitForDisplayed({ timeout: 5000 });
      
      expect(await medList.isDisplayed()).toBe(true);
    });

    it('should mark medication as taken', async () => {
      // Find first medication reminder
      const firstReminder = await driver.$('~medication-reminder-0');
      await firstReminder.waitForDisplayed({ timeout: 5000 });
      
      // Click mark as taken
      const takenButton = await driver.$('~mark-taken-button-0');
      await takenButton.click();
      
      // Verify confirmation
      const confirmation = await driver.$('~medication-taken-confirmation');
      await confirmation.waitForDisplayed({ timeout: 2000 });
      
      expect(await confirmation.isDisplayed()).toBe(true);
    });
  });

  describe('Health Records', () => {
    it('should view health records', async () => {
      // Navigate to records tab
      const recordsTab = await driver.$('~records-tab');
      await recordsTab.click();
      
      // Verify records list
      const recordsList = await driver.$('~records-list');
      await recordsList.waitForDisplayed({ timeout: 5000 });
      
      expect(await recordsList.isDisplayed()).toBe(true);
    });

    it('should view prescription details', async () => {
      // Click on first prescription
      const firstPrescription = await driver.$('~prescription-item-0');
      await firstPrescription.click();
      
      // Verify prescription details
      const prescriptionDetails = await driver.$('~prescription-details');
      await prescriptionDetails.waitForDisplayed({ timeout: 5000 });
      
      const medications = await driver.$$('~medication-detail');
      expect(medications.length).toBeGreaterThan(0);
    });

    it('should download prescription PDF', async () => {
      // From prescription details
      const downloadButton = await driver.$('~download-prescription');
      await downloadButton.click();
      
      // Verify download notification
      await driver.pause(2000);
      
      // Open notification shade
      await driver.openNotifications();
      
      // Verify download notification exists
      const downloadNotification = await driver.$('~download-complete');
      expect(await downloadNotification.isDisplayed()).toBe(true);
      
      // Close notification shade
      await driver.back();
    });
  });

  describe('Language Support', () => {
    it('should switch to Hindi', async () => {
      // Navigate to profile
      const profileTab = await driver.$('~profile-tab');
      await profileTab.click();
      
      // Open language settings
      const languageSettings = await driver.$('~language-settings');
      await languageSettings.click();
      
      // Select Hindi
      const hindiOption = await driver.$('~language-hindi');
      await hindiOption.click();
      
      // Verify UI text changed to Hindi
      const greeting = await driver.$('~greeting-text');
      const greetingText = await greeting.getText();
      
      expect(greetingText).toContain('नमस्ते');
    });

    it('should support voice input in Hindi', async () => {
      // Ensure Hindi is selected
      const voiceButton = await driver.$('~voice-triage-button');
      await voiceButton.click();
      
      // Verify Hindi language indicator
      const languageIndicator = await driver.$('~voice-language-indicator');
      const langText = await languageIndicator.getText();
      
      expect(langText).toContain('हिंदी');
    });
  });

  describe('Offline Functionality', () => {
    it('should cache data for offline access', async () => {
      // Enable airplane mode
      await driver.toggleAirplaneMode();
      
      // Navigate to appointments
      const appointmentsTab = await driver.$('~appointments-tab');
      await appointmentsTab.click();
      
      // Verify cached appointments are visible
      const appointmentList = await driver.$('~appointment-list');
      await appointmentList.waitForDisplayed({ timeout: 5000 });
      
      expect(await appointmentList.isDisplayed()).toBe(true);
      
      // Disable airplane mode
      await driver.toggleAirplaneMode();
    });
  });

  describe('Accessibility', () => {
    it('should support screen reader', async () => {
      // Enable TalkBack (Android screen reader)
      await driver.execute('mobile: shell', {
        command: 'settings put secure enabled_accessibility_services com.google.android.marvin.talkback/.TalkBackService',
      });
      
      // Verify elements have content descriptions
      const voiceButton = await driver.$('~voice-triage-button');
      const contentDesc = await voiceButton.getAttribute('content-desc');
      
      expect(contentDesc).toBeTruthy();
      expect(contentDesc.length).toBeGreaterThan(0);
    });

    it('should have sufficient touch target sizes', async () => {
      // Check voice button size
      const voiceButton = await driver.$('~voice-triage-button');
      const size = await voiceButton.getSize();
      
      // Minimum 44x44 dp for touch targets
      expect(size.width).toBeGreaterThanOrEqual(44);
      expect(size.height).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Performance', () => {
    it('should load home screen within 2 seconds', async () => {
      const startTime = Date.now();
      
      // Navigate to home
      const homeTab = await driver.$('~home-tab');
      await homeTab.click();
      
      // Wait for content to load
      const homeContent = await driver.$('~home-content');
      await homeContent.waitForDisplayed({ timeout: 5000 });
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(2000);
    });
  });
});

/**
 * Test script for Notification Service
 * 
 * This script demonstrates the notification service functionality
 * including SMS, Email, WhatsApp, and Push notifications.
 * 
 * Usage:
 *   tsx test-notifications.ts
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3020/api/notifications';

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

async function testHealthCheck() {
  console.log('\n📋 Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    results.push({
      test: 'Health Check',
      success: true,
      message: 'Service is healthy',
      data: response.data,
    });
    console.log('✅ Health check passed');
  } catch (error: any) {
    results.push({
      test: 'Health Check',
      success: false,
      message: error.message,
    });
    console.log('❌ Health check failed:', error.message);
  }
}

async function testSendSMS() {
  console.log('\n📱 Testing SMS Notification...');
  try {
    const response = await axios.post(`${BASE_URL}/sms`, {
      to: '+919876543210',
      body: 'Test SMS from MedhaOS Integration Service',
    });
    results.push({
      test: 'Send SMS',
      success: response.data.success,
      message: response.data.success ? 'SMS sent successfully' : response.data.error,
      data: response.data,
    });
    console.log(response.data.success ? '✅ SMS sent' : '⚠️ SMS failed:', response.data);
  } catch (error: any) {
    results.push({
      test: 'Send SMS',
      success: false,
      message: error.message,
    });
    console.log('❌ SMS test failed:', error.message);
  }
}

async function testSendEmail() {
  console.log('\n📧 Testing Email Notification...');
  try {
    const response = await axios.post(`${BASE_URL}/email`, {
      to: 'patient@example.com',
      template: 'appointment_confirmation',
      data: {
        patientName: 'John Doe',
        appointmentDate: '2024-03-15',
        appointmentTime: '10:00 AM',
        doctorName: 'Dr. Smith',
        facilityName: 'City Hospital',
      },
    });
    results.push({
      test: 'Send Email',
      success: response.data.success,
      message: response.data.success ? 'Email sent successfully' : response.data.error,
      data: response.data,
    });
    console.log(response.data.success ? '✅ Email sent' : '⚠️ Email failed:', response.data);
  } catch (error: any) {
    results.push({
      test: 'Send Email',
      success: false,
      message: error.message,
    });
    console.log('❌ Email test failed:', error.message);
  }
}

async function testSendWhatsApp() {
  console.log('\n💬 Testing WhatsApp Notification...');
  try {
    const response = await axios.post(`${BASE_URL}/whatsapp`, {
      to: '+919876543210',
      type: 'text',
      text: {
        body: 'Test WhatsApp message from MedhaOS',
      },
    });
    results.push({
      test: 'Send WhatsApp',
      success: response.data.success,
      message: response.data.success ? 'WhatsApp sent successfully' : response.data.error,
      data: response.data,
    });
    console.log(response.data.success ? '✅ WhatsApp sent' : '⚠️ WhatsApp failed:', response.data);
  } catch (error: any) {
    results.push({
      test: 'Send WhatsApp',
      success: false,
      message: error.message,
    });
    console.log('❌ WhatsApp test failed:', error.message);
  }
}

async function testSendPushNotification() {
  console.log('\n🔔 Testing Push Notification...');
  try {
    const response = await axios.post(`${BASE_URL}/push`, {
      title: 'Appointment Reminder',
      body: 'You have an appointment tomorrow at 10:00 AM',
      data: {
        appointmentId: 'appt-123',
        type: 'reminder',
      },
    });
    results.push({
      test: 'Send Push Notification',
      success: response.data.success,
      message: response.data.success ? 'Push notification sent successfully' : response.data.error,
      data: response.data,
    });
    console.log(response.data.success ? '✅ Push notification sent' : '⚠️ Push failed:', response.data);
  } catch (error: any) {
    results.push({
      test: 'Send Push Notification',
      success: false,
      message: error.message,
    });
    console.log('❌ Push notification test failed:', error.message);
  }
}

async function testUnifiedNotification() {
  console.log('\n🎯 Testing Unified Notification API...');
  try {
    const response = await axios.post(`${BASE_URL}/send`, {
      recipient: '+919876543210',
      channel: 'SMS',
      template: 'Your appointment is confirmed for {{date}} at {{time}}',
      data: {
        date: '2024-03-15',
        time: '10:00 AM',
      },
    });
    results.push({
      test: 'Unified Notification',
      success: response.data.success,
      message: response.data.success ? 'Notification sent successfully' : response.data.error,
      data: response.data,
    });
    console.log(response.data.success ? '✅ Unified notification sent' : '⚠️ Unified notification failed:', response.data);
  } catch (error: any) {
    results.push({
      test: 'Unified Notification',
      success: false,
      message: error.message,
    });
    console.log('❌ Unified notification test failed:', error.message);
  }
}

async function testBulkNotifications() {
  console.log('\n📦 Testing Bulk Notifications...');
  try {
    const response = await axios.post(`${BASE_URL}/bulk`, {
      notifications: [
        {
          recipient: '+919876543210',
          channel: 'SMS',
          template: 'Reminder: Take your medication',
          data: {},
        },
        {
          recipient: 'patient@example.com',
          channel: 'EMAIL',
          template: 'medication_reminder',
          data: {
            patientName: 'John Doe',
            medicationName: 'Aspirin',
            dosage: '100mg',
            time: '9:00 AM',
          },
        },
      ],
    });
    results.push({
      test: 'Bulk Notifications',
      success: response.data.success,
      message: `Sent ${response.data.successful}/${response.data.total} notifications`,
      data: response.data,
    });
    console.log('✅ Bulk notifications:', response.data);
  } catch (error: any) {
    results.push({
      test: 'Bulk Notifications',
      success: false,
      message: error.message,
    });
    console.log('❌ Bulk notifications test failed:', error.message);
  }
}

async function testScheduleNotification() {
  console.log('\n⏰ Testing Scheduled Notification...');
  try {
    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours() + 1);

    const response = await axios.post(`${BASE_URL}/schedule`, {
      recipient: '+919876543210',
      channel: 'SMS',
      template: 'Scheduled reminder',
      data: {},
      scheduledTime: scheduledTime.toISOString(),
    });
    results.push({
      test: 'Schedule Notification',
      success: response.data.success,
      message: 'Notification scheduled successfully',
      data: response.data,
    });
    console.log('✅ Notification scheduled:', response.data);
  } catch (error: any) {
    results.push({
      test: 'Schedule Notification',
      success: false,
      message: error.message,
    });
    console.log('❌ Schedule notification test failed:', error.message);
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log('');

  results.forEach((result) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.test}: ${result.message}`);
  });

  console.log('='.repeat(60));
}

async function runTests() {
  console.log('🚀 Starting Notification Service Tests...');
  console.log('Make sure the integration service is running on port 3020');

  await testHealthCheck();
  await testSendSMS();
  await testSendEmail();
  await testSendWhatsApp();
  await testSendPushNotification();
  await testUnifiedNotification();
  await testBulkNotifications();
  await testScheduleNotification();

  await printSummary();
}

// Run tests
runTests().catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});

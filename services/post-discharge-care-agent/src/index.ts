import app from './app';
import { config } from './config';
import { MedicationReminderService } from './services/medication-reminder.service';

const PORT = config.port;

// Initialize services
const medicationReminderService = new MedicationReminderService();

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Post-Discharge Care Agent running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🌍 Region: ${config.aws.region}`);
  
  // Start medication reminder scheduler
  medicationReminderService.startScheduler();
  console.log('✅ Medication reminder scheduler started');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  medicationReminderService.stopScheduler();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  medicationReminderService.stopScheduler();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default server;

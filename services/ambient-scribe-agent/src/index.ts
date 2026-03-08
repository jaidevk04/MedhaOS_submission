import http from 'http';
import { WebSocketServer } from 'ws';
import { createApp } from './app';
import { setupWebSocket } from './websocket';
import { config } from './config';

async function startServer() {
  try {
    // Create Express app
    const app = createApp();

    // Create HTTP server
    const server = http.createServer(app);

    // Create WebSocket server
    const wss = new WebSocketServer({ server, path: '/ws' });
    setupWebSocket(wss);

    // Start server
    server.listen(config.port, () => {
      console.log('='.repeat(60));
      console.log('🏥 Ambient Scribe Agent');
      console.log('='.repeat(60));
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`HTTP Server: http://localhost:${config.port}`);
      console.log(`WebSocket: ws://localhost:${config.port}/ws`);
      console.log(`Health Check: http://localhost:${config.port}/health`);
      console.log('='.repeat(60));
      console.log('Features:');
      console.log('  ✓ Real-time audio streaming');
      console.log('  ✓ Speaker diarization (doctor/patient)');
      console.log('  ✓ Real-time transcription');
      console.log('  ✓ Clinical NER (symptoms, diagnoses, medications)');
      console.log('  ✓ Temporal relation extraction');
      console.log('  ✓ SOAP note generation');
      console.log('  ✓ EHR auto-population');
      console.log('='.repeat(60));
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

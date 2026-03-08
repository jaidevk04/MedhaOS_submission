import { createServer } from 'http';
import { createApp } from './app';
import { setupWebSocket } from './websocket';
import { config } from './config';

const app = createApp();
const server = createServer(app);

// Setup WebSocket server
setupWebSocket(server);

server.listen(config.port, () => {
  console.log(`🎤 Speech & NLP Service running on port ${config.port}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🌍 Supported languages: ${config.service.supportedLanguages.length}`);
  console.log(`🔗 Health check: http://localhost:${config.port}/health`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${config.port}/ws/voice`);
});

import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { WebRTCAudioService } from './services/webrtc-audio.service';
import { RealtimeTranscriptionService } from './services/realtime-transcription.service';

export function setupWebSocket(server: HTTPServer): void {
  const wss = new WebSocketServer({ server, path: '/ws/voice' });
  const webrtcService = new WebRTCAudioService();
  const transcriptionService = new RealtimeTranscriptionService();

  console.log('🔌 WebSocket server initialized at /ws/voice');

  wss.on('connection', (ws: WebSocket, req) => {
    const connectionId = uuidv4();
    console.log(`✅ New WebSocket connection: ${connectionId}`);

    // Setup WebRTC audio service
    webrtcService.handleConnection(ws, connectionId);

    // Listen for transcription events
    transcriptionService.on('transcription', (data) => {
      if (data.sessionId === connectionId) {
        webrtcService.sendToClient(connectionId, {
          type: 'transcription',
          data: data.segment,
          isInterim: data.isInterim,
        });
      }
    });

    transcriptionService.on('transcriptUpdate', (data) => {
      if (data.sessionId === connectionId) {
        webrtcService.sendToClient(connectionId, {
          type: 'transcriptUpdate',
          data: {
            segments: data.segments,
            fullText: data.fullText,
          },
        });
      }
    });

    transcriptionService.on('error', (data) => {
      if (data.sessionId === connectionId) {
        webrtcService.sendToClient(connectionId, {
          type: 'error',
          error: data.error,
        });
      }
    });

    // Listen for audio chunks from WebRTC service
    webrtcService.on('audioChunk', async (data) => {
      if (data.connectionId === connectionId) {
        try {
          // Process audio chunk for transcription
          await transcriptionService.processAudioChunk(connectionId, data.chunk);
        } catch (error) {
          console.error('Error processing audio chunk:', error);
        }
      }
    });

    webrtcService.on('recordingStart', (data) => {
      if (data.connectionId === connectionId) {
        // Start transcription session
        transcriptionService.startSession(connectionId, {
          language: 'hi', // Default to Hindi, should be sent by client
          enableDiarization: true,
          interimResults: true,
        });
      }
    });

    webrtcService.on('recordingStop', async (data) => {
      if (data.connectionId === connectionId) {
        try {
          // Stop transcription session and get final result
          const result = await transcriptionService.stopSession(connectionId);
          webrtcService.sendToClient(connectionId, {
            type: 'finalTranscript',
            data: result,
          });
        } catch (error) {
          console.error('Error stopping transcription:', error);
        }
      }
    });

    webrtcService.on('disconnected', (data) => {
      if (data.connectionId === connectionId) {
        console.log(`❌ WebSocket disconnected: ${connectionId}`);
      }
    });
  });

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
}

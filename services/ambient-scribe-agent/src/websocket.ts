import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { scribeService } from './services/scribe.service';
import { WebSocketMessage } from './types';

export function setupWebSocket(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    console.log('WebSocket client connected');

    let sessionId: string | null = null;

    // Setup event listeners for scribe service
    const handleTranscriptionUpdate = (data: any) => {
      if (data.sessionId === sessionId) {
        sendMessage(ws, {
          type: 'transcription',
          payload: data.transcription,
          timestamp: new Date(),
        });
      }
    };

    const handleFactsUpdate = (data: any) => {
      if (data.sessionId === sessionId) {
        sendMessage(ws, {
          type: 'facts',
          payload: data.facts,
          timestamp: new Date(),
        });
      }
    };

    const handleSessionCompleted = (data: any) => {
      if (data.sessionId === sessionId) {
        sendMessage(ws, {
          type: 'soap',
          payload: data.session.soapNote,
          timestamp: new Date(),
        });
      }
    };

    scribeService.on('transcription:update', handleTranscriptionUpdate);
    scribeService.on('facts:update', handleFactsUpdate);
    scribeService.on('session:completed', handleSessionCompleted);

    // Handle incoming messages
    ws.on('message', async (data: Buffer) => {
      try {
        // Try to parse as JSON (control messages)
        const text = data.toString();
        
        if (text.startsWith('{')) {
          const message = JSON.parse(text);
          await handleControlMessage(ws, message, (sid) => { sessionId = sid; });
        } else {
          // Binary audio data
          if (sessionId) {
            scribeService.processAudio(sessionId, data);
          } else {
            sendError(ws, 'No active session. Send start message first.');
          }
        }
      } catch (error: any) {
        console.error('Error processing message:', error);
        sendError(ws, error.message);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      
      // Cleanup event listeners
      scribeService.off('transcription:update', handleTranscriptionUpdate);
      scribeService.off('facts:update', handleFactsUpdate);
      scribeService.off('session:completed', handleSessionCompleted);

      // Optionally pause or stop session
      if (sessionId) {
        try {
          scribeService.pauseSession(sessionId);
        } catch (error) {
          console.error('Error pausing session on disconnect:', error);
        }
      }
    });

    // Handle errors
    ws.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });

    // Send welcome message
    sendMessage(ws, {
      type: 'control',
      payload: { message: 'Connected to Ambient Scribe Agent' },
      timestamp: new Date(),
    });
  });
}

/**
 * Handle control messages
 */
async function handleControlMessage(
  ws: WebSocket,
  message: any,
  setSessionId: (sessionId: string) => void
): Promise<void> {
  const { type, payload } = message;

  switch (type) {
    case 'start':
      {
        const { sessionId, encounterId, clinicianId, patientId, options } = payload;

        if (!sessionId || !encounterId || !clinicianId || !patientId) {
          sendError(ws, 'Missing required fields');
          return;
        }

        const session = await scribeService.startSession(
          sessionId,
          encounterId,
          clinicianId,
          patientId,
          options || {
            enableSpeakerDiarization: true,
            enableRealTimeTranscription: true,
          }
        );

        setSessionId(sessionId);

        sendMessage(ws, {
          type: 'control',
          payload: { message: 'Session started', session },
          timestamp: new Date(),
        });
      }
      break;

    case 'pause':
      {
        const { sessionId } = payload;
        scribeService.pauseSession(sessionId);

        sendMessage(ws, {
          type: 'control',
          payload: { message: 'Session paused' },
          timestamp: new Date(),
        });
      }
      break;

    case 'resume':
      {
        const { sessionId } = payload;
        scribeService.resumeSession(sessionId);

        sendMessage(ws, {
          type: 'control',
          payload: { message: 'Session resumed' },
          timestamp: new Date(),
        });
      }
      break;

    case 'stop':
      {
        const { sessionId } = payload;
        const session = await scribeService.stopSession(sessionId);

        sendMessage(ws, {
          type: 'control',
          payload: { message: 'Session stopped', session },
          timestamp: new Date(),
        });
      }
      break;

    case 'get_transcription':
      {
        const { sessionId } = payload;
        const transcription = scribeService.getCurrentTranscription(sessionId);

        sendMessage(ws, {
          type: 'transcription',
          payload: transcription,
          timestamp: new Date(),
        });
      }
      break;

    case 'get_facts':
      {
        const { sessionId } = payload;
        const facts = scribeService.getExtractedFacts(sessionId);

        sendMessage(ws, {
          type: 'facts',
          payload: Object.fromEntries(facts),
          timestamp: new Date(),
        });
      }
      break;

    case 'get_soap_preview':
      {
        const { sessionId } = payload;
        const soapNote = await scribeService.getSOAPNotePreview(sessionId);

        sendMessage(ws, {
          type: 'soap',
          payload: soapNote,
          timestamp: new Date(),
        });
      }
      break;

    case 'update_speaker':
      {
        const { sessionId, segmentIndex, speaker } = payload;
        scribeService.updateSpeakerLabel(sessionId, segmentIndex, speaker);

        sendMessage(ws, {
          type: 'control',
          payload: { message: 'Speaker label updated' },
          timestamp: new Date(),
        });
      }
      break;

    default:
      sendError(ws, `Unknown message type: ${type}`);
  }
}

/**
 * Send message to WebSocket client
 */
function sendMessage(ws: WebSocket, message: WebSocketMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Send error message
 */
function sendError(ws: WebSocket, error: string): void {
  sendMessage(ws, {
    type: 'error',
    payload: { error },
    timestamp: new Date(),
  });
}

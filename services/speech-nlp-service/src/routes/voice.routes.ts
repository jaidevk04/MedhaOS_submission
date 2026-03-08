import { Router, Request, Response } from 'express';
import { WebRTCAudioService } from '../services/webrtc-audio.service';
import { RealtimeTranscriptionService } from '../services/realtime-transcription.service';
import { VoiceActivityDetectionService } from '../services/voice-activity-detection.service';

const router = Router();
const webrtcService = new WebRTCAudioService();
const transcriptionService = new RealtimeTranscriptionService();
const vadService = new VoiceActivityDetectionService();

/**
 * POST /api/voice/start-session
 * Start a real-time transcription session
 */
router.post('/start-session', (req: Request, res: Response) => {
  try {
    const { sessionId, language, enableDiarization, interimResults } = req.body;

    if (!sessionId || !language) {
      return res.status(400).json({
        error: 'Session ID and language are required',
      });
    }

    transcriptionService.startSession(sessionId, {
      language,
      enableDiarization: enableDiarization ?? true,
      interimResults: interimResults ?? true,
    });

    res.json({
      success: true,
      data: {
        sessionId,
        language,
        enableDiarization: enableDiarization ?? true,
        interimResults: interimResults ?? true,
        timestamp: Date.now(),
      },
    });
  } catch (error: any) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start session',
    });
  }
});

/**
 * POST /api/voice/stop-session
 * Stop a real-time transcription session
 */
router.post('/stop-session', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const result = await transcriptionService.stopSession(sessionId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Stop session error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to stop session',
    });
  }
});

/**
 * GET /api/voice/transcript/:sessionId
 * Get current transcript for a session
 */
router.get('/transcript/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const transcript = transcriptionService.getCurrentTranscript(sessionId);

    res.json({
      success: true,
      data: transcript,
    });
  } catch (error: any) {
    console.error('Get transcript error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get transcript',
    });
  }
});

/**
 * GET /api/voice/conversation/:sessionId
 * Get formatted conversation for a session
 */
router.get('/conversation/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const conversation = transcriptionService.getFormattedConversation(sessionId);

    res.json({
      success: true,
      data: {
        sessionId,
        conversation,
      },
    });
  } catch (error: any) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get conversation',
    });
  }
});

/**
 * GET /api/voice/stats/:sessionId
 * Get session statistics
 */
router.get('/stats/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const stats = transcriptionService.getSessionStats(sessionId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stats',
    });
  }
});

/**
 * POST /api/voice/detect-activity
 * Detect voice activity in audio
 */
router.post('/detect-activity', (req: Request, res: Response) => {
  try {
    const { audioData, sampleRate } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    // Convert base64 to buffer if needed
    const audioBuffer = Buffer.isBuffer(audioData)
      ? audioData
      : Buffer.from(audioData, 'base64');

    const result = vadService.detectVoiceActivity(audioBuffer, sampleRate || 16000);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Voice activity detection error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Voice activity detection failed',
    });
  }
});

/**
 * POST /api/voice/detect-segments
 * Detect speech segments in audio
 */
router.post('/detect-segments', (req: Request, res: Response) => {
  try {
    const { audioData, sampleRate } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const audioBuffer = Buffer.isBuffer(audioData)
      ? audioData
      : Buffer.from(audioData, 'base64');

    const segments = vadService.detectSpeechSegments(audioBuffer, sampleRate || 16000);

    res.json({
      success: true,
      data: {
        segments,
        count: segments.length,
      },
    });
  } catch (error: any) {
    console.error('Speech segment detection error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Speech segment detection failed',
    });
  }
});

/**
 * POST /api/voice/waveform
 * Get waveform data for visualization
 */
router.post('/waveform', (req: Request, res: Response) => {
  try {
    const { audioData, targetPoints } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const audioBuffer = Buffer.isBuffer(audioData)
      ? audioData
      : Buffer.from(audioData, 'base64');

    const waveform = vadService.getWaveformData(audioBuffer, targetPoints || 100);

    res.json({
      success: true,
      data: waveform,
    });
  } catch (error: any) {
    console.error('Waveform generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Waveform generation failed',
    });
  }
});

/**
 * GET /api/voice/connections
 * Get active WebRTC connections count
 */
router.get('/connections', (req: Request, res: Response) => {
  const count = webrtcService.getActiveConnectionsCount();

  res.json({
    success: true,
    data: {
      activeConnections: count,
      timestamp: Date.now(),
    },
  });
});

export default router;

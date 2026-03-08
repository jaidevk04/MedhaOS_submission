import { Router, Request, Response } from 'express';
import { scribeService } from '../services/scribe.service';
import { soapNoteService } from '../services/soap-note.service';

const router = Router();

/**
 * Start a new scribe session
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const { sessionId, encounterId, clinicianId, patientId, options } = req.body;

    if (!sessionId || !encounterId || !clinicianId || !patientId) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId, encounterId, clinicianId, patientId',
      });
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

    res.status(201).json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error('Error starting session:', error);
    res.status(500).json({
      error: 'Failed to start session',
      message: error.message,
    });
  }
});

/**
 * Get session status
 */
router.get('/sessions/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = scribeService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error('Error getting session:', error);
    res.status(500).json({
      error: 'Failed to get session',
      message: error.message,
    });
  }
});

/**
 * Get current transcription
 */
router.get('/sessions/:sessionId/transcription', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const transcription = scribeService.getCurrentTranscription(sessionId);

    res.json({
      success: true,
      transcription,
    });
  } catch (error: any) {
    console.error('Error getting transcription:', error);
    res.status(500).json({
      error: 'Failed to get transcription',
      message: error.message,
    });
  }
});

/**
 * Get extracted facts
 */
router.get('/sessions/:sessionId/facts', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const facts = scribeService.getExtractedFacts(sessionId);

    res.json({
      success: true,
      facts: Object.fromEntries(facts),
    });
  } catch (error: any) {
    console.error('Error getting facts:', error);
    res.status(500).json({
      error: 'Failed to get facts',
      message: error.message,
    });
  }
});

/**
 * Get SOAP note preview
 */
router.get('/sessions/:sessionId/soap-preview', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const soapNote = await scribeService.getSOAPNotePreview(sessionId);

    if (!soapNote) {
      return res.status(404).json({
        error: 'No SOAP note available yet',
      });
    }

    res.json({
      success: true,
      soapNote,
      formatted: soapNoteService.formatSOAPNote(soapNote),
    });
  } catch (error: any) {
    console.error('Error getting SOAP preview:', error);
    res.status(500).json({
      error: 'Failed to get SOAP preview',
      message: error.message,
    });
  }
});

/**
 * Pause session
 */
router.post('/sessions/:sessionId/pause', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    scribeService.pauseSession(sessionId);

    res.json({
      success: true,
      message: 'Session paused',
    });
  } catch (error: any) {
    console.error('Error pausing session:', error);
    res.status(500).json({
      error: 'Failed to pause session',
      message: error.message,
    });
  }
});

/**
 * Resume session
 */
router.post('/sessions/:sessionId/resume', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    scribeService.resumeSession(sessionId);

    res.json({
      success: true,
      message: 'Session resumed',
    });
  } catch (error: any) {
    console.error('Error resuming session:', error);
    res.status(500).json({
      error: 'Failed to resume session',
      message: error.message,
    });
  }
});

/**
 * Stop session and generate final SOAP note
 */
router.post('/sessions/:sessionId/stop', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await scribeService.stopSession(sessionId);

    res.json({
      success: true,
      session,
      soapNote: session.soapNote,
      formatted: session.soapNote ? soapNoteService.formatSOAPNote(session.soapNote) : null,
    });
  } catch (error: any) {
    console.error('Error stopping session:', error);
    res.status(500).json({
      error: 'Failed to stop session',
      message: error.message,
    });
  }
});

/**
 * Update speaker label
 */
router.patch('/sessions/:sessionId/segments/:segmentIndex/speaker', (req: Request, res: Response) => {
  try {
    const { sessionId, segmentIndex } = req.params;
    const { speaker } = req.body;

    if (!speaker || !['doctor', 'patient'].includes(speaker)) {
      return res.status(400).json({
        error: 'Invalid speaker. Must be "doctor" or "patient"',
      });
    }

    scribeService.updateSpeakerLabel(sessionId, parseInt(segmentIndex), speaker);

    res.json({
      success: true,
      message: 'Speaker label updated',
    });
  } catch (error: any) {
    console.error('Error updating speaker:', error);
    res.status(500).json({
      error: 'Failed to update speaker',
      message: error.message,
    });
  }
});

/**
 * Get session statistics
 */
router.get('/sessions/:sessionId/statistics', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const statistics = scribeService.getSessionStatistics(sessionId);

    if (!statistics) {
      return res.status(404).json({
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      statistics,
    });
  } catch (error: any) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message,
    });
  }
});

/**
 * Export session data
 */
router.get('/sessions/:sessionId/export', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = scribeService.exportSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error('Error exporting session:', error);
    res.status(500).json({
      error: 'Failed to export session',
      message: error.message,
    });
  }
});

/**
 * Delete session
 */
router.delete('/sessions/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    scribeService.deleteSession(sessionId);

    res.json({
      success: true,
      message: 'Session deleted',
    });
  } catch (error: any) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      error: 'Failed to delete session',
      message: error.message,
    });
  }
});

/**
 * Convert SOAP note to EHR format
 */
router.post('/soap/to-ehr', (req: Request, res: Response) => {
  try {
    const { soapNote } = req.body;

    if (!soapNote) {
      return res.status(400).json({
        error: 'Missing SOAP note',
      });
    }

    const ehrFormat = soapNoteService.toEHRFormat(soapNote);

    res.json({
      success: true,
      ehrFormat,
    });
  } catch (error: any) {
    console.error('Error converting to EHR format:', error);
    res.status(500).json({
      error: 'Failed to convert to EHR format',
      message: error.message,
    });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { TriageService } from '../services/triage.service';

const router = Router();
const triageService = new TriageService();

/**
 * POST /triage/start
 * Start a new triage session
 */
router.post(
  '/start',
  [
    body('patientId').isString().notEmpty().withMessage('Patient ID is required'),
    body('language').optional().isString(),
    body('initialSymptoms').optional().isArray(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const result = await triageService.startTriage(req.body);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error starting triage:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to start triage session',
      });
    }
  }
);

/**
 * POST /triage/answer
 * Submit an answer to a triage question
 */
router.post(
  '/answer',
  [
    body('sessionId').isString().notEmpty().withMessage('Session ID is required'),
    body('questionId').isString().notEmpty().withMessage('Question ID is required'),
    body('answer').notEmpty().withMessage('Answer is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const result = await triageService.submitAnswer(req.body);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit answer',
      });
    }
  }
);

/**
 * POST /triage/vitals
 * Submit vitals data for a triage session
 */
router.post(
  '/vitals',
  [
    body('sessionId').isString().notEmpty().withMessage('Session ID is required'),
    body('vitals').isObject().withMessage('Vitals data is required'),
    body('vitals.temperature').optional().isFloat({ min: 35, max: 42 }),
    body('vitals.bloodPressure').optional().isObject(),
    body('vitals.bloodPressure.systolic').optional().isInt({ min: 70, max: 250 }),
    body('vitals.bloodPressure.diastolic').optional().isInt({ min: 40, max: 150 }),
    body('vitals.heartRate').optional().isInt({ min: 30, max: 220 }),
    body('vitals.respiratoryRate').optional().isInt({ min: 8, max: 60 }),
    body('vitals.spo2').optional().isInt({ min: 70, max: 100 }),
    body('vitals.weight').optional().isFloat({ min: 2, max: 300 }),
    body('vitals.height').optional().isFloat({ min: 40, max: 250 }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      await triageService.submitVitals(req.body);

      res.json({
        success: true,
        message: 'Vitals submitted successfully',
      });
    } catch (error: any) {
      console.error('Error submitting vitals:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit vitals',
      });
    }
  }
);

/**
 * GET /triage/result/:sessionId
 * Get triage result for a completed session
 */
router.get(
  '/result/:sessionId',
  [
    param('sessionId').isString().notEmpty().withMessage('Session ID is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const result = await triageService.getTriageResult(req.params.sessionId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error getting triage result:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get triage result',
      });
    }
  }
);

/**
 * GET /triage/session/:sessionId
 * Get triage session details
 */
router.get(
  '/session/:sessionId',
  [
    param('sessionId').isString().notEmpty().withMessage('Session ID is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const session = triageService.getSession(req.params.sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Triage session not found',
        });
        return;
      }

      res.json({
        success: true,
        data: session,
      });
    } catch (error: any) {
      console.error('Error getting session:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get session',
      });
    }
  }
);

/**
 * POST /triage/routing
 * Get specialty routing and facility recommendations
 */
router.post(
  '/routing',
  [
    body('sessionId').isString().notEmpty().withMessage('Session ID is required'),
    body('patientLocation').isObject().withMessage('Patient location is required'),
    body('patientLocation.latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('patientLocation.longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const { sessionId, patientLocation } = req.body;
      const result = await triageService.getRoutingRecommendation(sessionId, patientLocation);

      res.json({
        success: true,
        data: {
          sessionId,
          ...result,
        },
      });
    } catch (error: any) {
      console.error('Error getting routing recommendation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get routing recommendation',
      });
    }
  }
);

export default router;

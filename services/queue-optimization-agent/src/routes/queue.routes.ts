import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { QueueManagementService } from '../services/queue-management.service';
import { WaitTimePredictionService } from '../services/wait-time-prediction.service';
import { QueueType } from '../types';

const router = Router();
const queueService = new QueueManagementService();
const waitTimeService = new WaitTimePredictionService();

/**
 * Add patient to queue
 * POST /api/queue
 */
router.post(
  '/',
  [
    body('patientId').isString().notEmpty(),
    body('facilityId').isString().notEmpty(),
    body('queueType').isIn(['ED', 'OPD']),
    body('urgencyScore').isInt({ min: 0, max: 100 }),
    body('specialty').optional().isString(),
    body('chiefComplaint').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const queueEntry = await queueService.addToQueue(req.body);
      res.status(201).json(queueEntry);
    } catch (error) {
      console.error('Error adding to queue:', error);
      res.status(500).json({ error: 'Failed to add patient to queue' });
    }
  }
);

/**
 * Get queue for facility
 * GET /api/queue/:facilityId/:queueType
 */
router.get(
  '/:facilityId/:queueType',
  [
    param('facilityId').isString().notEmpty(),
    param('queueType').isIn(['ED', 'OPD']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { facilityId, queueType } = req.params;
      const queue = await queueService.getQueue(facilityId, queueType as QueueType);
      res.json(queue);
    } catch (error) {
      console.error('Error getting queue:', error);
      res.status(500).json({ error: 'Failed to retrieve queue' });
    }
  }
);

/**
 * Get queue position for patient
 * GET /api/queue/position/:queueEntryId
 */
router.get(
  '/position/:queueEntryId',
  [param('queueEntryId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { queueEntryId } = req.params;
      const entry = await queueService.getQueuePosition(queueEntryId);
      
      if (!entry) {
        return res.status(404).json({ error: 'Queue entry not found' });
      }

      res.json(entry);
    } catch (error) {
      console.error('Error getting queue position:', error);
      res.status(500).json({ error: 'Failed to retrieve queue position' });
    }
  }
);

/**
 * Update queue entry status
 * PATCH /api/queue/:queueEntryId/status
 */
router.patch(
  '/:queueEntryId/status',
  [
    param('queueEntryId').isString().notEmpty(),
    body('status').isIn(['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
    body('assignedProviderId').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { queueEntryId } = req.params;
      const { status, assignedProviderId } = req.body;
      
      const updatedEntry = await queueService.updateQueueStatus(
        queueEntryId,
        status,
        assignedProviderId
      );
      
      res.json(updatedEntry);
    } catch (error) {
      console.error('Error updating queue status:', error);
      res.status(500).json({ error: 'Failed to update queue status' });
    }
  }
);

/**
 * Reorder queue
 * POST /api/queue/:facilityId/:queueType/reorder
 */
router.post(
  '/:facilityId/:queueType/reorder',
  [
    param('facilityId').isString().notEmpty(),
    param('queueType').isIn(['ED', 'OPD']),
    body('reason').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { facilityId, queueType } = req.params;
      const { reason } = req.body;
      
      const result = await queueService.reorderQueue({
        facilityId,
        queueType: queueType as QueueType,
        reason: reason || 'manual',
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error reordering queue:', error);
      res.status(500).json({ error: 'Failed to reorder queue' });
    }
  }
);

/**
 * Get queue metrics
 * GET /api/queue/:facilityId/:queueType/metrics
 */
router.get(
  '/:facilityId/:queueType/metrics',
  [
    param('facilityId').isString().notEmpty(),
    param('queueType').isIn(['ED', 'OPD']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { facilityId, queueType } = req.params;
      const metrics = await queueService.getQueueMetrics(facilityId, queueType as QueueType);
      res.json(metrics);
    } catch (error) {
      console.error('Error getting queue metrics:', error);
      res.status(500).json({ error: 'Failed to retrieve queue metrics' });
    }
  }
);

/**
 * Predict wait time for patient
 * GET /api/queue/wait-time/:queueEntryId
 */
router.get(
  '/wait-time/:queueEntryId',
  [param('queueEntryId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { queueEntryId } = req.params;
      const prediction = await waitTimeService.predictWaitTime(queueEntryId);
      res.json(prediction);
    } catch (error) {
      console.error('Error predicting wait time:', error);
      res.status(500).json({ error: 'Failed to predict wait time' });
    }
  }
);

/**
 * Get real-time wait times for facility
 * GET /api/queue/:facilityId/:queueType/wait-times
 */
router.get(
  '/:facilityId/:queueType/wait-times',
  [
    param('facilityId').isString().notEmpty(),
    param('queueType').isIn(['ED', 'OPD']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { facilityId, queueType } = req.params;
      const waitTimes = await waitTimeService.getRealTimeWaitTimes(
        facilityId,
        queueType as QueueType
      );
      res.json(waitTimes);
    } catch (error) {
      console.error('Error getting wait times:', error);
      res.status(500).json({ error: 'Failed to retrieve wait times' });
    }
  }
);

/**
 * Analyze historical wait times
 * GET /api/queue/:facilityId/:queueType/historical
 */
router.get(
  '/:facilityId/:queueType/historical',
  [
    param('facilityId').isString().notEmpty(),
    param('queueType').isIn(['ED', 'OPD']),
    query('startDate').isISO8601(),
    query('endDate').isISO8601(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { facilityId, queueType } = req.params;
      const { startDate, endDate } = req.query;
      
      const historicalData = await waitTimeService.analyzeHistoricalWaitTimes(
        facilityId,
        queueType as QueueType,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      res.json(historicalData);
    } catch (error) {
      console.error('Error analyzing historical wait times:', error);
      res.status(500).json({ error: 'Failed to analyze historical data' });
    }
  }
);

export default router;

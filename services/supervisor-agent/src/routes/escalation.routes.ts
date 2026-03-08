import { Router, Request, Response } from 'express';
import { EscalationManager } from '../escalation/escalation-manager';
import { NotificationService } from '../escalation/notification-service';

const router = Router();
const escalationManager = new EscalationManager();
const notificationService = new NotificationService();

/**
 * GET /api/escalations
 * Get all pending escalations
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { escalatedTo } = req.query;
    const escalations = await escalationManager.getPendingEscalations(
      escalatedTo as string | undefined
    );
    res.status(200).json(escalations);
  } catch (error) {
    console.error('Error getting escalations:', error);
    res.status(500).json({
      error: 'Failed to get escalations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/escalations/:escalationId
 * Get specific escalation
 */
router.get('/:escalationId', async (req: Request, res: Response) => {
  try {
    const { escalationId } = req.params;
    const escalation = await escalationManager.getEscalation(escalationId);
    
    if (!escalation) {
      return res.status(404).json({ error: 'Escalation not found' });
    }

    res.status(200).json(escalation);
  } catch (error) {
    console.error('Error getting escalation:', error);
    res.status(500).json({
      error: 'Failed to get escalation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/escalations/:escalationId/acknowledge
 * Acknowledge escalation
 */
router.post('/:escalationId/acknowledge', async (req: Request, res: Response) => {
  try {
    const { escalationId } = req.params;
    const { acknowledgedBy } = req.body;

    if (!acknowledgedBy) {
      return res.status(400).json({ error: 'acknowledgedBy is required' });
    }

    const escalation = await escalationManager.getEscalation(escalationId);
    if (!escalation) {
      return res.status(404).json({ error: 'Escalation not found' });
    }

    await escalationManager.acknowledgeEscalation(escalationId, acknowledgedBy);
    await notificationService.sendAcknowledgmentNotification(
      escalation,
      acknowledgedBy
    );

    res.status(200).json({ message: 'Escalation acknowledged successfully' });
  } catch (error) {
    console.error('Error acknowledging escalation:', error);
    res.status(500).json({
      error: 'Failed to acknowledge escalation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/escalations/:escalationId/resolve
 * Resolve escalation
 */
router.post('/:escalationId/resolve', async (req: Request, res: Response) => {
  try {
    const { escalationId } = req.params;
    const { resolution, resolvedBy } = req.body;

    if (!resolution || !resolvedBy) {
      return res.status(400).json({
        error: 'resolution and resolvedBy are required',
      });
    }

    const escalation = await escalationManager.getEscalation(escalationId);
    if (!escalation) {
      return res.status(404).json({ error: 'Escalation not found' });
    }

    await escalationManager.resolveEscalation(
      escalationId,
      resolution,
      resolvedBy
    );
    await notificationService.sendResolutionNotification(
      escalation,
      resolution,
      resolvedBy
    );

    res.status(200).json({ message: 'Escalation resolved successfully' });
  } catch (error) {
    console.error('Error resolving escalation:', error);
    res.status(500).json({
      error: 'Failed to resolve escalation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/escalations/task/:taskId
 * Get escalations for a specific task
 */
router.get('/task/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const escalations = await escalationManager.getEscalationsByTask(taskId);
    res.status(200).json(escalations);
  } catch (error) {
    console.error('Error getting task escalations:', error);
    res.status(500).json({
      error: 'Failed to get task escalations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/escalations/stats
 * Get escalation statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await escalationManager.getEscalationStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error getting escalation stats:', error);
    res.status(500).json({
      error: 'Failed to get escalation stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

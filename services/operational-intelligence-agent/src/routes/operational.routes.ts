import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { OperationalIntelligenceService } from '../services/operational-intelligence.service';

const router = Router();
const operationalService = new OperationalIntelligenceService();

/**
 * Get operational metrics for a facility
 */
router.get(
  '/metrics/:facilityId',
  [param('facilityId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { facilityId } = req.params;
      const metrics = await operationalService.getOperationalMetrics(facilityId);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error('Error getting operational metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get operational metrics',
      });
    }
  }
);

/**
 * Get capacity alerts for a facility
 */
router.get(
  '/alerts/:facilityId',
  [param('facilityId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { facilityId } = req.params;
      const alerts = await operationalService.getAllCapacityAlerts(facilityId);

      res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      console.error('Error getting capacity alerts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get capacity alerts',
      });
    }
  }
);

/**
 * Get comprehensive dashboard data
 */
router.get(
  '/dashboard/:facilityId',
  [param('facilityId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { facilityId } = req.params;
      const dashboardData = await operationalService.generateDashboardData(facilityId);

      res.json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      console.error('Error generating dashboard data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate dashboard data',
      });
    }
  }
);

/**
 * Optimize facility operations
 */
router.post(
  '/optimize/:facilityId',
  [
    param('facilityId').isString().notEmpty(),
    body('staffMembers').isArray(),
    body('shiftRequirements').isArray(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { facilityId } = req.params;
      const { staffMembers, shiftRequirements } = req.body;

      const optimization = await operationalService.optimizeFacilityOperations(
        facilityId,
        staffMembers,
        shiftRequirements
      );

      res.json({
        success: true,
        data: optimization,
      });
    } catch (error) {
      console.error('Error optimizing facility operations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize facility operations',
      });
    }
  }
);

/**
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'operational-intelligence-agent',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;

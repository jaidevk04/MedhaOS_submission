import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PublicHealthIntelligenceService } from '../services/public-health-intelligence.service';

const router = Router();
const publicHealthService = new PublicHealthIntelligenceService();

/**
 * Validation middleware
 */
const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * POST /api/surveillance/perform
 * Perform comprehensive public health surveillance
 */
router.post(
  '/surveillance/perform',
  [
    body('state').isString().notEmpty(),
    body('districts').isArray().notEmpty(),
    body('diseaseType').isString().notEmpty(),
    validate,
  ],
  async (req: Request, res: Response) => {
    try {
      const { state, districts, diseaseType } = req.body;
      
      const result = await publicHealthService.performSurveillance(
        state,
        districts,
        diseaseType
      );
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error performing surveillance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform surveillance',
      });
    }
  }
);

/**
 * GET /api/dashboard
 * Get dashboard data for public health officials
 */
router.get(
  '/dashboard',
  [query('state').optional().isString(), validate],
  async (req: Request, res: Response) => {
    try {
      const { state } = req.query;
      
      const dashboardData = await publicHealthService.getDashboardData(state as string);
      
      res.json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard data',
      });
    }
  }
);

/**
 * POST /api/prediction/outbreak
 * Predict disease outbreak for a district
 */
router.post(
  '/prediction/outbreak',
  [
    body('district').isString().notEmpty(),
    body('state').isString().notEmpty(),
    body('diseaseType').isString().notEmpty(),
    validate,
  ],
  async (req: Request, res: Response) => {
    try {
      const { district, state, diseaseType } = req.body;
      
      const prediction = await publicHealthService.predictOutbreak(
        district,
        state,
        diseaseType
      );
      
      res.json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      console.error('Error predicting outbreak:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to predict outbreak',
      });
    }
  }
);

/**
 * POST /api/infection/monitor
 * Monitor facility for infection clusters
 */
router.post(
  '/infection/monitor',
  [body('facilityId').isString().notEmpty(), validate],
  async (req: Request, res: Response) => {
    try {
      const { facilityId } = req.body;
      
      const alerts = await publicHealthService.monitorFacility(facilityId);
      
      res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      console.error('Error monitoring facility:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to monitor facility',
      });
    }
  }
);

/**
 * POST /api/media/scan
 * Scan media for disease events
 */
router.post(
  '/media/scan',
  [body('daysBack').optional().isInt({ min: 1, max: 30 }), validate],
  async (req: Request, res: Response) => {
    try {
      const { daysBack = 7 } = req.body;
      
      const scanResult = await publicHealthService.scanMedia(daysBack);
      
      res.json({
        success: true,
        data: scanResult,
      });
    } catch (error) {
      console.error('Error scanning media:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to scan media',
      });
    }
  }
);

/**
 * POST /api/rrt/activate
 * Activate Rapid Response Team
 */
router.post(
  '/rrt/activate',
  [
    body('district').isString().notEmpty(),
    body('state').isString().notEmpty(),
    body('diseaseType').isString().notEmpty(),
    body('outbreakProbability').isFloat({ min: 0, max: 1 }),
    validate,
  ],
  async (req: Request, res: Response) => {
    try {
      const { district, state, diseaseType, outbreakProbability } = req.body;
      
      const activation = await publicHealthService.activateRRT(
        district,
        state,
        diseaseType,
        outbreakProbability
      );
      
      if (!activation) {
        return res.status(400).json({
          success: false,
          error: 'RRT activation threshold not met',
        });
      }
      
      res.json({
        success: true,
        data: activation,
      });
    } catch (error) {
      console.error('Error activating RRT:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to activate RRT',
      });
    }
  }
);

/**
 * GET /api/outbreaks/active
 * Get active outbreaks
 */
router.get(
  '/outbreaks/active',
  [query('state').optional().isString(), validate],
  async (req: Request, res: Response) => {
    try {
      const { state } = req.query;
      
      const outbreaks = await publicHealthService.getActiveOutbreaks(state as string);
      
      res.json({
        success: true,
        data: outbreaks,
      });
    } catch (error) {
      console.error('Error fetching active outbreaks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch active outbreaks',
      });
    }
  }
);

/**
 * POST /api/resources/track
 * Track resource allocation
 */
router.post(
  '/resources/track',
  [
    body('district').isString().notEmpty(),
    body('state').isString().notEmpty(),
    body('resourceType').isIn(['rrt_team', 'medical_supplies', 'vaccines', 'testing_kits', 'ambulances']),
    body('quantity').isInt({ min: 1 }),
    body('targetFacilities').isArray().notEmpty(),
    validate,
  ],
  async (req: Request, res: Response) => {
    try {
      const { district, state, resourceType, quantity, targetFacilities } = req.body;
      
      const allocation = await publicHealthService.trackResources(
        district,
        state,
        resourceType,
        quantity,
        targetFacilities
      );
      
      res.json({
        success: true,
        data: allocation,
      });
    } catch (error) {
      console.error('Error tracking resources:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track resources',
      });
    }
  }
);

/**
 * POST /api/resources/gaps
 * Identify resource gaps
 */
router.post(
  '/resources/gaps',
  [
    body('district').isString().notEmpty(),
    body('state').isString().notEmpty(),
    body('expectedCases').isInt({ min: 0 }),
    validate,
  ],
  async (req: Request, res: Response) => {
    try {
      const { district, state, expectedCases } = req.body;
      
      const gaps = await publicHealthService.identifyResourceGaps(
        district,
        state,
        expectedCases
      );
      
      res.json({
        success: true,
        data: gaps,
      });
    } catch (error) {
      console.error('Error identifying resource gaps:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to identify resource gaps',
      });
    }
  }
);

/**
 * POST /api/awareness/generate
 * Generate public awareness message
 */
router.post(
  '/awareness/generate',
  [
    body('diseaseType').isString().notEmpty(),
    body('district').isString().notEmpty(),
    body('state').isString().notEmpty(),
    body('language').isString().notEmpty(),
    validate,
  ],
  async (req: Request, res: Response) => {
    try {
      const { diseaseType, district, state, language } = req.body;
      
      const message = await publicHealthService.generateAwarenessMessage(
        diseaseType,
        district,
        state,
        language
      );
      
      res.json({
        success: true,
        data: { message },
      });
    } catch (error) {
      console.error('Error generating awareness message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate awareness message',
      });
    }
  }
);

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'Public Health Intelligence Agent',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;

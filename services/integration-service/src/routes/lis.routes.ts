import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { LISService } from '../services/lis.service';

const router = Router();
const lisService = new LISService();

/**
 * Place lab order
 * POST /api/lis/orders
 */
router.post(
  '/orders',
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('encounterId').notEmpty().withMessage('Encounter ID is required'),
    body('tests').isArray().withMessage('Tests must be an array'),
    body('urgency')
      .isIn(['STAT', 'ROUTINE', 'URGENT'])
      .withMessage('Invalid urgency level'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await lisService.placeLabOrder(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Lab order error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Get lab results
 * GET /api/lis/results/:orderId
 */
router.get('/results/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const result = await lisService.getLabResults(orderId);
    res.json(result);
  } catch (error: any) {
    console.error('Lab results error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get patient lab history
 * GET /api/lis/history/:patientId
 */
router.get('/history/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const result = await lisService.getPatientLabHistory(patientId);
    res.json(result);
  } catch (error: any) {
    console.error('Lab history error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Parse HL7 ORU message
 * POST /api/lis/hl7/parse
 */
router.post(
  '/hl7/parse',
  [body('message').notEmpty().withMessage('HL7 message is required')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = lisService.parseHL7ORUMessage(req.body.message);
      res.json({
        success: true,
        parsed: result,
      });
    } catch (error: any) {
      console.error('HL7 parse error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Health check
 * GET /api/lis/health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'lis-integration',
    timestamp: new Date().toISOString(),
  });
});

export default router;

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { EHRService } from '../services/ehr.service';

const router = Router();
const ehrService = new EHRService();

/**
 * Sync patient data
 * POST /api/ehr/sync
 */
router.post(
  '/sync',
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('includeHistory')
      .optional()
      .isBoolean()
      .withMessage('includeHistory must be boolean'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await ehrService.syncPatientData(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('EHR sync error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Send HL7 message
 * POST /api/ehr/hl7/send
 */
router.post('/hl7/send', async (req: Request, res: Response) => {
  try {
    const result = await ehrService.sendHL7Message(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('HL7 send error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Parse HL7 message
 * POST /api/ehr/hl7/parse
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

      const result = ehrService.parseHL7Message(req.body.message);
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
 * Get FHIR resource
 * GET /api/ehr/fhir/:resourceType/:id
 */
router.get('/fhir/:resourceType/:id', async (req: Request, res: Response) => {
  try {
    const { resourceType, id } = req.params;
    const result = await ehrService.getFHIRResource(resourceType, id);
    res.json(result);
  } catch (error: any) {
    console.error('FHIR get error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Create FHIR resource
 * POST /api/ehr/fhir/:resourceType
 */
router.post('/fhir/:resourceType', async (req: Request, res: Response) => {
  try {
    const { resourceType } = req.params;
    const result = await ehrService.createFHIRResource(resourceType, req.body);
    res.json(result);
  } catch (error: any) {
    console.error('FHIR create error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Health check
 * GET /api/ehr/health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'ehr-integration',
    timestamp: new Date().toISOString(),
  });
});

export default router;

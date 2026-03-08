import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { ABDMService } from '../services/abdm.service';

const router = Router();
const abdmService = new ABDMService();

/**
 * Verify ABHA ID
 */
router.post(
  '/verify',
  [
    body('abhaId').notEmpty().withMessage('ABHA ID is required'),
    body('purpose').notEmpty().withMessage('Purpose is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await abdmService.verifyABHAId(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Request consent for health records
 */
router.post(
  '/consent/request',
  [
    body('abhaId').notEmpty().withMessage('ABHA ID is required'),
    body('purpose').notEmpty().withMessage('Purpose is required'),
    body('dateRange.from').notEmpty().withMessage('Start date is required'),
    body('dateRange.to').notEmpty().withMessage('End date is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await abdmService.requestConsent(
        req.body.abhaId,
        req.body.purpose,
        req.body.dateRange
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Get consent status
 */
router.get(
  '/consent/:consentId',
  [param('consentId').notEmpty().withMessage('Consent ID is required')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await abdmService.getConsentStatus(req.params.consentId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Retrieve health records
 */
router.post(
  '/health-records',
  [
    body('abhaId').notEmpty().withMessage('ABHA ID is required'),
    body('consentId').notEmpty().withMessage('Consent ID is required'),
    body('dateRange.from').notEmpty().withMessage('Start date is required'),
    body('dateRange.to').notEmpty().withMessage('End date is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const fhirBundle = await abdmService.getHealthRecords(req.body);
      const transformed = abdmService.transformFHIRToInternal(fhirBundle);
      res.json(transformed);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;

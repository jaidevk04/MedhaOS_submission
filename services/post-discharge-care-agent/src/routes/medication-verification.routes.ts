import { Router, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { body, param, query, validationResult } from 'express-validator';
import { MedicationVerificationService } from '../services/medication-verification.service';

const router = Router();
const medicationVerificationService = new MedicationVerificationService();

// Extend Express Request type to include file
interface MulterRequest extends Request {
  file?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  };
}

// Configure multer for image upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req: Request, file: any, cb: FileFilterCallback) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * POST /api/medication-verification/verify
 * Verify medication from uploaded image
 */
router.post(
  '/verify',
  upload.single('image'),
  [
    body('patientId').isUUID().withMessage('Valid patient ID is required'),
    body('medicationScheduleId').isUUID().withMessage('Valid medication schedule ID is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const multerReq = req as MulterRequest;
      if (!multerReq.file) {
        res.status(400).json({ error: 'Image file is required' });
        return;
      }

      const { patientId, medicationScheduleId } = req.body;

      // Verify medication
      const verification = await medicationVerificationService.verifyMedication(
        patientId,
        medicationScheduleId,
        multerReq.file.buffer,
        multerReq.file.originalname
      );

      res.status(200).json({
        success: true,
        data: verification,
        message: verification.verificationStatus === 'verified'
          ? 'Medication verified successfully'
          : 'Medication verification failed - please try again or contact your healthcare provider',
      });
    } catch (error) {
      console.error('Error in medication verification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify medication',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/medication-verification/history/:patientId
 * Get verification history for a patient
 */
router.get(
  '/history/:patientId',
  [
    param('patientId').isUUID().withMessage('Valid patient ID is required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { patientId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const history = await medicationVerificationService.getVerificationHistory(
        patientId,
        limit
      );

      res.status(200).json({
        success: true,
        data: history,
        count: history.length,
      });
    } catch (error) {
      console.error('Error getting verification history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get verification history',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/medication-verification/adherence/:patientId
 * Get adherence tracking for a patient
 */
router.get(
  '/adherence/:patientId',
  [
    param('patientId').isUUID().withMessage('Valid patient ID is required'),
    query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    query('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { patientId } = req.params;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const tracking = await medicationVerificationService.getAdherenceTracking(
        patientId,
        startDate,
        endDate
      );

      res.status(200).json({
        success: true,
        data: tracking,
      });
    } catch (error) {
      console.error('Error getting adherence tracking:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get adherence tracking',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/medication-verification/reprocess/:verificationId
 * Reprocess a failed verification
 */
router.post(
  '/reprocess/:verificationId',
  [
    param('verificationId').isUUID().withMessage('Valid verification ID is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { verificationId } = req.params;

      const verification = await medicationVerificationService.reprocessVerification(
        verificationId
      );

      res.status(200).json({
        success: true,
        data: verification,
        message: 'Verification reprocessed successfully',
      });
    } catch (error) {
      console.error('Error reprocessing verification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reprocess verification',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/medication-verification/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: 'medication-verification',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;

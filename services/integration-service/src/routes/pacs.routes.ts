import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { PACSService } from '../services/pacs.service';

const router = Router();
const pacsService = new PACSService();

/**
 * Query DICOM studies
 * GET /api/pacs/studies
 */
router.get(
  '/studies',
  [
    query('patientId').optional().isString(),
    query('studyDate').optional().isString(),
    query('modality').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await pacsService.queryStudies(req.query);
      res.json(result);
    } catch (error: any) {
      console.error('PACS query error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Get DICOM study
 * GET /api/pacs/studies/:studyInstanceUID
 */
router.get('/studies/:studyInstanceUID', async (req: Request, res: Response) => {
  try {
    const { studyInstanceUID } = req.params;
    const result = await pacsService.retrieveStudy(studyInstanceUID);
    res.json(result);
  } catch (error: any) {
    console.error('PACS retrieve error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Store DICOM image
 * POST /api/pacs/images
 */
router.post(
  '/images',
  [
    body('studyInstanceUID').notEmpty().withMessage('Study UID is required'),
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('imageData').notEmpty().withMessage('Image data is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { studyInstanceUID, patientId, imageData, metadata } = req.body;
      const result = await pacsService.storeImage(
        studyInstanceUID,
        patientId,
        Buffer.from(imageData, 'base64'),
        metadata
      );
      res.json(result);
    } catch (error: any) {
      console.error('PACS store error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Get DICOM image
 * GET /api/pacs/images/:sopInstanceUID
 */
router.get('/images/:sopInstanceUID', async (req: Request, res: Response) => {
  try {
    const { sopInstanceUID } = req.params;
    const result = await pacsService.retrieveImage(sopInstanceUID);
    res.json(result);
  } catch (error: any) {
    console.error('PACS image retrieve error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Parse DICOM metadata
 * POST /api/pacs/parse
 */
router.post(
  '/parse',
  [body('imageData').notEmpty().withMessage('Image data is required')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const imageBuffer = Buffer.from(req.body.imageData, 'base64');
      const metadata = pacsService.parseDICOMMetadata(imageBuffer);
      res.json({
        success: true,
        metadata,
      });
    } catch (error: any) {
      console.error('DICOM parse error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Health check
 * GET /api/pacs/health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'pacs-integration',
    timestamp: new Date().toISOString(),
  });
});

export default router;

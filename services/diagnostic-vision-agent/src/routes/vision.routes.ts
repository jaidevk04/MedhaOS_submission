import { Router, Request, Response } from 'express';
import multer from 'multer';
import { DiagnosticVisionService } from '../services/diagnostic-vision.service';
import { ImageUploadRequest, ImageAnalysisRequest } from '../types';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

const visionService = new DiagnosticVisionService();

/**
 * Upload and preprocess medical image
 * POST /api/vision/upload
 */
router.post('/upload', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    const file = (req as any).file;
    
    if (!file) {
      res.status(400).json({
        error: 'No image file provided'
      });
      return;
    }

    const uploadRequest: ImageUploadRequest = {
      patientId: req.body.patientId,
      encounterId: req.body.encounterId,
      modality: req.body.modality,
      bodyPart: req.body.bodyPart,
      studyDate: req.body.studyDate ? new Date(req.body.studyDate) : undefined,
      clinicalContext: req.body.clinicalContext ? JSON.parse(req.body.clinicalContext) : undefined
    };

    const result = await visionService.uploadImage(
      file.buffer,
      uploadRequest,
      file.originalname
    );

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      error: 'Failed to upload image',
      message: error.message
    });
  }
});

/**
 * Analyze medical image
 * POST /api/vision/analyze
 */
router.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const analysisRequest: ImageAnalysisRequest = {
      imageId: req.body.imageId,
      clinicalContext: req.body.clinicalContext,
      generateReport: req.body.generateReport !== false, // Default true
      urgency: req.body.urgency || 'routine'
    };

    if (!analysisRequest.imageId) {
      res.status(400).json({
        error: 'imageId is required'
      });
      return;
    }

    const result = await visionService.analyzeImage(analysisRequest);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    res.status(500).json({
      error: 'Failed to analyze image',
      message: error.message
    });
  }
});

/**
 * Get report by image ID
 * GET /api/vision/report/:imageId
 */
router.get('/report/:imageId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageId } = req.params;
    
    const report = await visionService.getReport(imageId);
    
    if (!report) {
      res.status(404).json({
        error: 'Report not found'
      });
      return;
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    console.error('Error retrieving report:', error);
    res.status(500).json({
      error: 'Failed to retrieve report',
      message: error.message
    });
  }
});

/**
 * Update report status
 * PATCH /api/vision/report/:reportId/status
 */
router.patch('/report/:reportId/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportId } = req.params;
    const { status, verifiedBy } = req.body;

    if (!status) {
      res.status(400).json({
        error: 'status is required'
      });
      return;
    }

    await visionService.updateReportStatus(reportId, status, verifiedBy);

    res.json({
      success: true,
      message: 'Report status updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating report status:', error);
    res.status(500).json({
      error: 'Failed to update report status',
      message: error.message
    });
  }
});

/**
 * Get analysis results
 * GET /api/vision/analysis/:imageId
 */
router.get('/analysis/:imageId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageId } = req.params;
    
    const analysis = await visionService.getAnalysisResults(imageId);
    
    if (!analysis) {
      res.status(404).json({
        error: 'Analysis not found'
      });
      return;
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    console.error('Error retrieving analysis:', error);
    res.status(500).json({
      error: 'Failed to retrieve analysis',
      message: error.message
    });
  }
});

/**
 * Get statistics
 * GET /api/vision/statistics
 */
router.get('/statistics', async (_req: Request, res: Response): Promise<void> => {
  try {
    const timeRange = (_req.query.timeRange as 'day' | 'week' | 'month') || 'day';
    
    const stats = await visionService.getStatistics(timeRange);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error retrieving statistics:', error);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: error.message
    });
  }
});

/**
 * Health check for vision services
 * GET /api/vision/health
 */
router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const health = await visionService.healthCheck();

    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error: any) {
    console.error('Error checking health:', error);
    res.status(503).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

export default router;

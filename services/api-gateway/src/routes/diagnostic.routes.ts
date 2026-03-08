import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createServiceProxy } from '../utils/proxy';
import { config } from '../config';

const router = Router();

// Diagnostic Report Routes

/**
 * @swagger
 * /api/v1/diagnostics:
 *   post:
 *     summary: Create a new diagnostic report
 *     tags: [Diagnostics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - encounterId
 *               - patientId
 *               - reportType
 *             properties:
 *               encounterId:
 *                 type: string
 *               patientId:
 *                 type: string
 *               reportType:
 *                 type: string
 *                 enum: [radiology, laboratory, pathology]
 *               modality:
 *                 type: string
 *     responses:
 *       201:
 *         description: Diagnostic report created
 */
router.post(
  '/',
  authenticate,
  authorize('doctor', 'radiologist', 'lab_technician'),
  validate([
    body('encounterId').isUUID().withMessage('Valid encounter ID is required'),
    body('patientId').isUUID().withMessage('Valid patient ID is required'),
    body('reportType').isIn(['radiology', 'laboratory', 'pathology']).withMessage('Valid report type is required'),
    body('modality').optional().isString(),
  ]),
  createServiceProxy(config.services.diagnosticVision)
);

/**
 * @swagger
 * /api/v1/diagnostics/{id}:
 *   get:
 *     summary: Get diagnostic report by ID
 *     tags: [Diagnostics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Diagnostic report details
 */
router.get(
  '/:id',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid report ID is required'),
  ]),
  createServiceProxy(config.services.diagnosticVision)
);

/**
 * @swagger
 * /api/v1/diagnostics:
 *   get:
 *     summary: List diagnostic reports
 *     tags: [Diagnostics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: encounterId
 *         schema:
 *           type: string
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of diagnostic reports
 */
router.get(
  '/',
  authenticate,
  validate([
    query('patientId').optional().isUUID(),
    query('encounterId').optional().isUUID(),
    query('reportType').optional().isIn(['radiology', 'laboratory', 'pathology']),
    query('status').optional().isIn(['pending', 'ai_completed', 'verified', 'finalized']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  createServiceProxy(config.services.diagnosticVision)
);

/**
 * @swagger
 * /api/v1/diagnostics/{id}/upload-image:
 *   post:
 *     summary: Upload medical image for analysis
 *     tags: [Diagnostics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 */
router.post(
  '/:id/upload-image',
  authenticate,
  authorize('doctor', 'radiologist', 'lab_technician'),
  validate([
    param('id').isUUID().withMessage('Valid report ID is required'),
  ]),
  createServiceProxy(config.services.diagnosticVision)
);

/**
 * @swagger
 * /api/v1/diagnostics/{id}/analyze:
 *   post:
 *     summary: Trigger AI analysis of diagnostic image
 *     tags: [Diagnostics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analysis started
 */
router.post(
  '/:id/analyze',
  authenticate,
  authorize('doctor', 'radiologist'),
  validate([
    param('id').isUUID().withMessage('Valid report ID is required'),
  ]),
  createServiceProxy(config.services.diagnosticVision)
);

/**
 * @swagger
 * /api/v1/diagnostics/{id}/verify:
 *   post:
 *     summary: Verify AI-generated report
 *     tags: [Diagnostics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               radiologistReport:
 *                 type: string
 *               modifications:
 *                 type: object
 *     responses:
 *       200:
 *         description: Report verified
 */
router.post(
  '/:id/verify',
  authenticate,
  authorize('doctor', 'radiologist'),
  validate([
    param('id').isUUID().withMessage('Valid report ID is required'),
    body('radiologistReport').notEmpty().withMessage('Radiologist report is required'),
  ]),
  createServiceProxy(config.services.diagnosticVision)
);

/**
 * @swagger
 * /api/v1/diagnostics/{id}/finalize:
 *   post:
 *     summary: Finalize diagnostic report
 *     tags: [Diagnostics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report finalized
 */
router.post(
  '/:id/finalize',
  authenticate,
  authorize('doctor', 'radiologist'),
  validate([
    param('id').isUUID().withMessage('Valid report ID is required'),
  ]),
  createServiceProxy(config.services.diagnosticVision)
);

/**
 * @swagger
 * /api/v1/diagnostics/{id}/critical-findings:
 *   get:
 *     summary: Get critical findings from report
 *     tags: [Diagnostics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Critical findings
 */
router.get(
  '/:id/critical-findings',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid report ID is required'),
  ]),
  createServiceProxy(config.services.diagnosticVision)
);

export default router;

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createServiceProxy } from '../utils/proxy';
import { config } from '../config';

const router = Router();

// Clinical Encounter Routes

/**
 * @swagger
 * /api/v1/encounters:
 *   post:
 *     summary: Create a new clinical encounter
 *     tags: [Encounters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - facilityId
 *               - encounterType
 *             properties:
 *               patientId:
 *                 type: string
 *               facilityId:
 *                 type: string
 *               encounterType:
 *                 type: string
 *                 enum: [ED, OPD, IPD, Telemedicine]
 *               chiefComplaint:
 *                 type: string
 *     responses:
 *       201:
 *         description: Encounter created successfully
 */
router.post(
  '/',
  authenticate,
  authorize('doctor', 'nurse'),
  validate([
    body('patientId').isUUID().withMessage('Valid patient ID is required'),
    body('facilityId').isUUID().withMessage('Valid facility ID is required'),
    body('encounterType').isIn(['ED', 'OPD', 'IPD', 'Telemedicine']).withMessage('Valid encounter type is required'),
    body('chiefComplaint').optional().isString(),
  ]),
  createServiceProxy(config.services.integration)
);

/**
 * @swagger
 * /api/v1/encounters/{id}:
 *   get:
 *     summary: Get encounter by ID
 *     tags: [Encounters]
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
 *         description: Encounter details
 */
router.get(
  '/:id',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid encounter ID is required'),
  ]),
  createServiceProxy(config.services.integration)
);

/**
 * @swagger
 * /api/v1/encounters:
 *   get:
 *     summary: List encounters
 *     tags: [Encounters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
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
 *         description: List of encounters
 */
router.get(
  '/',
  authenticate,
  validate([
    query('patientId').optional().isUUID(),
    query('status').optional().isIn(['in_progress', 'completed', 'admitted']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  createServiceProxy(config.services.integration)
);

/**
 * @swagger
 * /api/v1/encounters/{id}:
 *   put:
 *     summary: Update encounter
 *     tags: [Encounters]
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
 *         description: Encounter updated successfully
 */
router.put(
  '/:id',
  authenticate,
  authorize('doctor', 'nurse'),
  validate([
    param('id').isUUID().withMessage('Valid encounter ID is required'),
  ]),
  createServiceProxy(config.services.integration)
);

/**
 * @swagger
 * /api/v1/encounters/{id}/triage:
 *   post:
 *     summary: Add triage data to encounter
 *     tags: [Encounters]
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
 *               symptoms:
 *                 type: array
 *                 items:
 *                   type: string
 *               vitals:
 *                 type: object
 *     responses:
 *       200:
 *         description: Triage data added
 */
router.post(
  '/:id/triage',
  authenticate,
  authorize('doctor', 'nurse'),
  validate([
    param('id').isUUID().withMessage('Valid encounter ID is required'),
    body('symptoms').isArray().withMessage('Symptoms must be an array'),
    body('vitals').isObject().withMessage('Vitals must be an object'),
  ]),
  createServiceProxy(config.services.triage)
);

/**
 * @swagger
 * /api/v1/encounters/{id}/clinical-notes:
 *   post:
 *     summary: Add clinical notes to encounter
 *     tags: [Encounters]
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
 *               subjective:
 *                 type: string
 *               objective:
 *                 type: string
 *               assessment:
 *                 type: string
 *               plan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Clinical notes added
 */
router.post(
  '/:id/clinical-notes',
  authenticate,
  authorize('doctor'),
  validate([
    param('id').isUUID().withMessage('Valid encounter ID is required'),
  ]),
  createServiceProxy(config.services.ambientScribe)
);

/**
 * @swagger
 * /api/v1/encounters/{id}/diagnoses:
 *   post:
 *     summary: Add diagnosis to encounter
 *     tags: [Encounters]
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
 *               icdCode:
 *                 type: string
 *               description:
 *                 type: string
 *               confidence:
 *                 type: number
 *     responses:
 *       200:
 *         description: Diagnosis added
 */
router.post(
  '/:id/diagnoses',
  authenticate,
  authorize('doctor'),
  validate([
    param('id').isUUID().withMessage('Valid encounter ID is required'),
    body('icdCode').notEmpty().withMessage('ICD code is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('confidence').optional().isFloat({ min: 0, max: 1 }),
  ]),
  createServiceProxy(config.services.cdss)
);

/**
 * @swagger
 * /api/v1/encounters/{id}/prescriptions:
 *   post:
 *     summary: Add prescription to encounter
 *     tags: [Encounters]
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
 *               medications:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Prescription added
 */
router.post(
  '/:id/prescriptions',
  authenticate,
  authorize('doctor'),
  validate([
    param('id').isUUID().withMessage('Valid encounter ID is required'),
    body('medications').isArray().withMessage('Medications must be an array'),
  ]),
  createServiceProxy(config.services.drugSafety)
);

/**
 * @swagger
 * /api/v1/encounters/{id}/complete:
 *   post:
 *     summary: Complete encounter
 *     tags: [Encounters]
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
 *         description: Encounter completed
 */
router.post(
  '/:id/complete',
  authenticate,
  authorize('doctor'),
  validate([
    param('id').isUUID().withMessage('Valid encounter ID is required'),
  ]),
  createServiceProxy(config.services.integration)
);

export default router;

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createServiceProxy } from '../utils/proxy';
import { config } from '../config';

const router = Router();

// Patient Management Routes

/**
 * @swagger
 * /api/v1/patients:
 *   post:
 *     summary: Create a new patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - age
 *               - gender
 *               - contact
 *             properties:
 *               name:
 *                 type: string
 *               age:
 *                 type: integer
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               abhaId:
 *                 type: string
 *               contact:
 *                 type: object
 *                 properties:
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *     responses:
 *       201:
 *         description: Patient created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticate,
  authorize('doctor', 'nurse', 'admin'),
  validate([
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('age').isInt({ min: 0, max: 150 }).withMessage('Valid age is required'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
    body('contact.phone').notEmpty().withMessage('Phone number is required'),
    body('contact.email').optional().isEmail().withMessage('Valid email is required'),
    body('abhaId').optional().isString(),
    body('languagePreference').optional().isString(),
  ]),
  createServiceProxy(config.services.integration)
);

/**
 * @swagger
 * /api/v1/patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
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
 *         description: Patient details
 *       404:
 *         description: Patient not found
 */
router.get(
  '/:id',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid patient ID is required'),
  ]),
  createServiceProxy(config.services.integration)
);

/**
 * @swagger
 * /api/v1/patients:
 *   get:
 *     summary: Search patients
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
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
 *         description: List of patients
 */
router.get(
  '/',
  authenticate,
  authorize('doctor', 'nurse', 'admin'),
  validate([
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  createServiceProxy(config.services.integration)
);

/**
 * @swagger
 * /api/v1/patients/{id}:
 *   put:
 *     summary: Update patient information
 *     tags: [Patients]
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
 *         description: Patient updated successfully
 */
router.put(
  '/:id',
  authenticate,
  authorize('doctor', 'nurse', 'admin'),
  validate([
    param('id').isUUID().withMessage('Valid patient ID is required'),
  ]),
  createServiceProxy(config.services.integration)
);

/**
 * @swagger
 * /api/v1/patients/{id}/medical-history:
 *   get:
 *     summary: Get patient medical history
 *     tags: [Patients]
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
 *         description: Patient medical history
 */
router.get(
  '/:id/medical-history',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid patient ID is required'),
  ]),
  createServiceProxy(config.services.integration)
);

/**
 * @swagger
 * /api/v1/patients/{id}/medications:
 *   get:
 *     summary: Get patient current medications
 *     tags: [Patients]
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
 *         description: Patient medications
 */
router.get(
  '/:id/medications',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid patient ID is required'),
  ]),
  createServiceProxy(config.services.integration)
);

/**
 * @swagger
 * /api/v1/patients/{id}/allergies:
 *   get:
 *     summary: Get patient allergies
 *     tags: [Patients]
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
 *         description: Patient allergies
 */
router.get(
  '/:id/allergies',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid patient ID is required'),
  ]),
  createServiceProxy(config.services.integration)
);

export default router;

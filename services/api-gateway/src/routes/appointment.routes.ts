import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createServiceProxy } from '../utils/proxy';
import { config } from '../config';

const router = Router();

// Appointment Scheduling Routes

/**
 * @swagger
 * /api/v1/appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
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
 *               - clinicianId
 *               - appointmentDate
 *               - appointmentTime
 *             properties:
 *               patientId:
 *                 type: string
 *               facilityId:
 *                 type: string
 *               clinicianId:
 *                 type: string
 *               appointmentDate:
 *                 type: string
 *                 format: date
 *               appointmentTime:
 *                 type: string
 *               specialty:
 *                 type: string
 *               urgencyScore:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Appointment created successfully
 */
router.post(
  '/',
  authenticate,
  validate([
    body('patientId').isUUID().withMessage('Valid patient ID is required'),
    body('facilityId').isUUID().withMessage('Valid facility ID is required'),
    body('clinicianId').isUUID().withMessage('Valid clinician ID is required'),
    body('appointmentDate').isISO8601().withMessage('Valid date is required'),
    body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required'),
    body('specialty').optional().isString(),
    body('urgencyScore').optional().isInt({ min: 0, max: 100 }),
  ]),
  createServiceProxy(config.services.queueOptimization)
);

/**
 * @swagger
 * /api/v1/appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
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
 *         description: Appointment details
 */
router.get(
  '/:id',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid appointment ID is required'),
  ]),
  createServiceProxy(config.services.queueOptimization)
);

/**
 * @swagger
 * /api/v1/appointments:
 *   get:
 *     summary: List appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: clinicianId
 *         schema:
 *           type: string
 *       - in: query
 *         name: facilityId
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
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
 *         description: List of appointments
 */
router.get(
  '/',
  authenticate,
  validate([
    query('patientId').optional().isUUID(),
    query('clinicianId').optional().isUUID(),
    query('facilityId').optional().isUUID(),
    query('date').optional().isISO8601(),
    query('status').optional().isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  createServiceProxy(config.services.queueOptimization)
);

/**
 * @swagger
 * /api/v1/appointments/{id}:
 *   put:
 *     summary: Update appointment
 *     tags: [Appointments]
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
 *         description: Appointment updated
 */
router.put(
  '/:id',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid appointment ID is required'),
  ]),
  createServiceProxy(config.services.queueOptimization)
);

/**
 * @swagger
 * /api/v1/appointments/{id}/confirm:
 *   post:
 *     summary: Confirm appointment
 *     tags: [Appointments]
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
 *         description: Appointment confirmed
 */
router.post(
  '/:id/confirm',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid appointment ID is required'),
  ]),
  createServiceProxy(config.services.queueOptimization)
);

/**
 * @swagger
 * /api/v1/appointments/{id}/cancel:
 *   post:
 *     summary: Cancel appointment
 *     tags: [Appointments]
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment cancelled
 */
router.post(
  '/:id/cancel',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid appointment ID is required'),
    body('reason').optional().isString(),
  ]),
  createServiceProxy(config.services.queueOptimization)
);

/**
 * @swagger
 * /api/v1/appointments/{id}/reschedule:
 *   post:
 *     summary: Reschedule appointment
 *     tags: [Appointments]
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
 *             required:
 *               - newDate
 *               - newTime
 *             properties:
 *               newDate:
 *                 type: string
 *                 format: date
 *               newTime:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment rescheduled
 */
router.post(
  '/:id/reschedule',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid appointment ID is required'),
    body('newDate').isISO8601().withMessage('Valid date is required'),
    body('newTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required'),
  ]),
  createServiceProxy(config.services.queueOptimization)
);

/**
 * @swagger
 * /api/v1/appointments/availability:
 *   get:
 *     summary: Check appointment availability
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: clinicianId
 *         schema:
 *           type: string
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Available time slots
 */
router.get(
  '/availability',
  authenticate,
  validate([
    query('facilityId').isUUID().withMessage('Valid facility ID is required'),
    query('clinicianId').optional().isUUID(),
    query('specialty').optional().isString(),
    query('date').isISO8601().withMessage('Valid date is required'),
  ]),
  createServiceProxy(config.services.queueOptimization)
);

/**
 * @swagger
 * /api/v1/appointments/{id}/wait-time:
 *   get:
 *     summary: Get estimated wait time for appointment
 *     tags: [Appointments]
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
 *         description: Estimated wait time
 */
router.get(
  '/:id/wait-time',
  authenticate,
  validate([
    param('id').isUUID().withMessage('Valid appointment ID is required'),
  ]),
  createServiceProxy(config.services.queueOptimization)
);

export default router;

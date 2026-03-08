import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AppointmentSchedulingService } from '../services/appointment-scheduling.service';

const router = Router();
const appointmentService = new AppointmentSchedulingService();

/**
 * Book an appointment
 * POST /api/appointments
 */
router.post(
  '/',
  [
    body('patientId').isString().notEmpty(),
    body('facilityId').isString().notEmpty(),
    body('providerId').isString().notEmpty(),
    body('specialty').isString().notEmpty(),
    body('scheduledTime').isISO8601(),
    body('duration').optional().isInt({ min: 15, max: 180 }),
    body('urgencyScore').optional().isInt({ min: 0, max: 100 }),
    body('chiefComplaint').optional().isString(),
    body('notes').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const data = {
        ...req.body,
        scheduledTime: new Date(req.body.scheduledTime),
      };

      const result = await appointmentService.bookAppointment(data);
      
      if (result.conflicts.length > 0) {
        return res.status(409).json({
          error: 'Appointment conflicts detected',
          conflicts: result.conflicts,
        });
      }

      res.status(201).json(result.appointment);
    } catch (error) {
      console.error('Error booking appointment:', error);
      res.status(500).json({ error: 'Failed to book appointment' });
    }
  }
);

/**
 * Get available appointment slots
 * GET /api/appointments/slots
 */
router.get(
  '/slots',
  [
    query('facilityId').isString().notEmpty(),
    query('providerId').isString().notEmpty(),
    query('specialty').isString().notEmpty(),
    query('date').isISO8601(),
    query('duration').optional().isInt({ min: 15, max: 180 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { facilityId, providerId, specialty, date, duration } = req.query;
      
      const slots = await appointmentService.getAvailableSlots(
        facilityId as string,
        providerId as string,
        specialty as string,
        new Date(date as string),
        duration ? parseInt(duration as string) : 30
      );
      
      res.json(slots);
    } catch (error) {
      console.error('Error getting available slots:', error);
      res.status(500).json({ error: 'Failed to retrieve available slots' });
    }
  }
);

/**
 * Check for appointment conflicts
 * POST /api/appointments/check-conflicts
 */
router.post(
  '/check-conflicts',
  [
    body('facilityId').isString().notEmpty(),
    body('providerId').isString().notEmpty(),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const data = {
        ...req.body,
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
      };

      const conflicts = await appointmentService.checkConflicts(data);
      res.json({ conflicts });
    } catch (error) {
      console.error('Error checking conflicts:', error);
      res.status(500).json({ error: 'Failed to check conflicts' });
    }
  }
);

/**
 * Get appointment by ID
 * GET /api/appointments/:appointmentId
 */
router.get(
  '/:appointmentId',
  [param('appointmentId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { appointmentId } = req.params;
      const appointment = await appointmentService.getAppointment(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      res.json(appointment);
    } catch (error) {
      console.error('Error getting appointment:', error);
      res.status(500).json({ error: 'Failed to retrieve appointment' });
    }
  }
);

/**
 * Get patient appointments
 * GET /api/appointments/patient/:patientId
 */
router.get(
  '/patient/:patientId',
  [
    param('patientId').isString().notEmpty(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { patientId } = req.params;
      const { startDate, endDate } = req.query;
      
      const appointments = await appointmentService.getPatientAppointments(
        patientId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(appointments);
    } catch (error) {
      console.error('Error getting patient appointments:', error);
      res.status(500).json({ error: 'Failed to retrieve patient appointments' });
    }
  }
);

/**
 * Confirm appointment
 * POST /api/appointments/:appointmentId/confirm
 */
router.post(
  '/:appointmentId/confirm',
  [param('appointmentId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { appointmentId } = req.params;
      const appointment = await appointmentService.confirmAppointment(appointmentId);
      res.json(appointment);
    } catch (error) {
      console.error('Error confirming appointment:', error);
      res.status(500).json({ error: 'Failed to confirm appointment' });
    }
  }
);

/**
 * Cancel appointment
 * POST /api/appointments/:appointmentId/cancel
 */
router.post(
  '/:appointmentId/cancel',
  [
    param('appointmentId').isString().notEmpty(),
    body('reason').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { appointmentId } = req.params;
      const { reason } = req.body;
      
      const appointment = await appointmentService.cancelAppointment(appointmentId, reason);
      res.json(appointment);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      res.status(500).json({ error: 'Failed to cancel appointment' });
    }
  }
);

/**
 * Reschedule appointment
 * POST /api/appointments/:appointmentId/reschedule
 */
router.post(
  '/:appointmentId/reschedule',
  [
    param('appointmentId').isString().notEmpty(),
    body('newScheduledTime').isISO8601(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { appointmentId } = req.params;
      const { newScheduledTime } = req.body;
      
      const result = await appointmentService.rescheduleAppointment(
        appointmentId,
        new Date(newScheduledTime)
      );
      
      if (result.conflicts.length > 0) {
        return res.status(409).json({
          error: 'Rescheduling conflicts detected',
          conflicts: result.conflicts,
        });
      }

      res.json(result.appointment);
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      res.status(500).json({ error: 'Failed to reschedule appointment' });
    }
  }
);

/**
 * Send appointment reminders
 * POST /api/appointments/reminders/send
 */
router.post(
  '/reminders/send',
  [body('hoursBeforeAppointment').optional().isInt({ min: 1, max: 168 })],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { hoursBeforeAppointment } = req.body;
      const sentCount = await appointmentService.sendAppointmentReminders(
        hoursBeforeAppointment || 24
      );
      
      res.json({ sentCount, message: `Sent ${sentCount} appointment reminders` });
    } catch (error) {
      console.error('Error sending reminders:', error);
      res.status(500).json({ error: 'Failed to send appointment reminders' });
    }
  }
);

/**
 * Add appointment to calendar
 * POST /api/appointments/:appointmentId/calendar
 */
router.post(
  '/:appointmentId/calendar',
  [
    param('appointmentId').isString().notEmpty(),
    body('calendarType').isIn(['GOOGLE', 'OUTLOOK', 'APPLE']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { appointmentId } = req.params;
      const { calendarType } = req.body;
      
      const result = await appointmentService.addToCalendar(appointmentId, calendarType);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json(result);
    } catch (error) {
      console.error('Error adding to calendar:', error);
      res.status(500).json({ error: 'Failed to add appointment to calendar' });
    }
  }
);

export default router;

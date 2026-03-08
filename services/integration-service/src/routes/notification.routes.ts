import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { NotificationService } from '../services/notification.service';
import { NotificationRequest } from '../types';

const router = Router();
const notificationService = new NotificationService();

/**
 * Send single notification
 * POST /api/notifications/send
 */
router.post(
  '/send',
  [
    body('recipient').notEmpty().withMessage('Recipient is required'),
    body('channel')
      .isIn(['SMS', 'EMAIL', 'WHATSAPP', 'PUSH'])
      .withMessage('Invalid channel'),
    body('template').notEmpty().withMessage('Template is required'),
    body('data').isObject().withMessage('Data must be an object'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const request: NotificationRequest = req.body;
      const result = await notificationService.sendNotification(request);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error: any) {
      console.error('Notification send error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Send bulk notifications
 * POST /api/notifications/bulk
 */
router.post(
  '/bulk',
  [
    body('notifications')
      .isArray()
      .withMessage('Notifications must be an array'),
    body('notifications.*.recipient')
      .notEmpty()
      .withMessage('Recipient is required'),
    body('notifications.*.channel')
      .isIn(['SMS', 'EMAIL', 'WHATSAPP', 'PUSH'])
      .withMessage('Invalid channel'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { notifications } = req.body;
      const results = await notificationService.sendBulkNotifications(
        notifications
      );

      res.json({
        success: true,
        results,
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      });
    } catch (error: any) {
      console.error('Bulk notification error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Schedule notification
 * POST /api/notifications/schedule
 */
router.post(
  '/schedule',
  [
    body('recipient').notEmpty().withMessage('Recipient is required'),
    body('channel')
      .isIn(['SMS', 'EMAIL', 'WHATSAPP', 'PUSH'])
      .withMessage('Invalid channel'),
    body('template').notEmpty().withMessage('Template is required'),
    body('data').isObject().withMessage('Data must be an object'),
    body('scheduledTime')
      .isISO8601()
      .withMessage('Valid scheduled time is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { scheduledTime, ...request } = req.body;
      const result = await notificationService.scheduleNotification(
        request as NotificationRequest,
        new Date(scheduledTime)
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('Notification scheduling error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Get notification status
 * GET /api/notifications/status/:messageId
 */
router.get('/status/:messageId', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const status = await notificationService.getNotificationStatus(messageId);

    res.json({
      success: true,
      messageId,
      ...status,
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Send SMS
 * POST /api/notifications/sms
 */
router.post(
  '/sms',
  [
    body('to').notEmpty().withMessage('Phone number is required'),
    body('body').notEmpty().withMessage('Message body is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await notificationService.sendSMS(req.body);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error: any) {
      console.error('SMS send error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Send email
 * POST /api/notifications/email
 */
router.post(
  '/email',
  [
    body('to').isEmail().withMessage('Valid email is required'),
    body('template').notEmpty().withMessage('Template is required'),
    body('data').isObject().withMessage('Data must be an object'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { to, template, data } = req.body;
      const result = await notificationService.sendEmail(to, template, data);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error: any) {
      console.error('Email send error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Send WhatsApp message
 * POST /api/notifications/whatsapp
 */
router.post(
  '/whatsapp',
  [
    body('to').notEmpty().withMessage('Phone number is required'),
    body('type').isIn(['text', 'template']).withMessage('Invalid message type'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await notificationService.sendWhatsApp(req.body);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error: any) {
      console.error('WhatsApp send error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Send push notification
 * POST /api/notifications/push
 */
router.post(
  '/push',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('body').notEmpty().withMessage('Body is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await notificationService.sendPushNotification(req.body);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error: any) {
      console.error('Push notification error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * Health check
 * GET /api/notifications/health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
  });
});

export default router;

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    role: string;
    permissions: string[];
  };
}

export const setupWebSocket = (httpServer: HTTPServer): SocketIOServer => {
  if (!config.websocket.enabled) {
    logger.info('WebSocket is disabled');
    return null as any;
  }

  const io = new SocketIOServer(httpServer, {
    path: config.websocket.path,
    cors: {
      origin: config.cors.origin,
      credentials: config.cors.credentials,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        id: string;
        role: string;
        permissions: string[];
      };

      socket.user = decoded;
      next();
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`WebSocket client connected: ${socket.id}, User: ${socket.user?.id}`);

    // Join user-specific room
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
      socket.join(`role:${socket.user.role}`);
    }

    // Handle room subscriptions
    socket.on('subscribe:facility', (facilityId: string) => {
      if (!facilityId) {
        socket.emit('error', { message: 'Facility ID is required' });
        return;
      }
      socket.join(`facility:${facilityId}`);
      logger.info(`Client ${socket.id} subscribed to facility:${facilityId}`);
      socket.emit('subscribed', { room: `facility:${facilityId}` });
    });

    socket.on('unsubscribe:facility', (facilityId: string) => {
      socket.leave(`facility:${facilityId}`);
      logger.info(`Client ${socket.id} unsubscribed from facility:${facilityId}`);
      socket.emit('unsubscribed', { room: `facility:${facilityId}` });
    });

    socket.on('subscribe:patient', (patientId: string) => {
      if (!patientId) {
        socket.emit('error', { message: 'Patient ID is required' });
        return;
      }
      // Only allow patients to subscribe to their own data or healthcare providers
      if (socket.user?.role === 'patient' && socket.user.id !== patientId) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      socket.join(`patient:${patientId}`);
      logger.info(`Client ${socket.id} subscribed to patient:${patientId}`);
      socket.emit('subscribed', { room: `patient:${patientId}` });
    });

    socket.on('unsubscribe:patient', (patientId: string) => {
      socket.leave(`patient:${patientId}`);
      logger.info(`Client ${socket.id} unsubscribed from patient:${patientId}`);
      socket.emit('unsubscribed', { room: `patient:${patientId}` });
    });

    socket.on('subscribe:queue', (facilityId: string) => {
      if (!facilityId) {
        socket.emit('error', { message: 'Facility ID is required' });
        return;
      }
      socket.join(`queue:${facilityId}`);
      logger.info(`Client ${socket.id} subscribed to queue:${facilityId}`);
      socket.emit('subscribed', { room: `queue:${facilityId}` });
    });

    socket.on('unsubscribe:queue', (facilityId: string) => {
      socket.leave(`queue:${facilityId}`);
      logger.info(`Client ${socket.id} unsubscribed from queue:${facilityId}`);
      socket.emit('unsubscribed', { room: `queue:${facilityId}` });
    });

    socket.on('subscribe:appointment', (appointmentId: string) => {
      if (!appointmentId) {
        socket.emit('error', { message: 'Appointment ID is required' });
        return;
      }
      socket.join(`appointment:${appointmentId}`);
      logger.info(`Client ${socket.id} subscribed to appointment:${appointmentId}`);
      socket.emit('subscribed', { room: `appointment:${appointmentId}` });
    });

    socket.on('unsubscribe:appointment', (appointmentId: string) => {
      socket.leave(`appointment:${appointmentId}`);
      logger.info(`Client ${socket.id} unsubscribed from appointment:${appointmentId}`);
      socket.emit('unsubscribed', { room: `appointment:${appointmentId}` });
    });

    socket.on('subscribe:ambient-scribe', (encounterId: string) => {
      if (!encounterId) {
        socket.emit('error', { message: 'Encounter ID is required' });
        return;
      }
      // Only doctors and nurses can subscribe to ambient scribe
      if (!['doctor', 'nurse'].includes(socket.user?.role || '')) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      socket.join(`ambient-scribe:${encounterId}`);
      logger.info(`Client ${socket.id} subscribed to ambient-scribe:${encounterId}`);
      socket.emit('subscribed', { room: `ambient-scribe:${encounterId}` });
    });

    socket.on('unsubscribe:ambient-scribe', (encounterId: string) => {
      socket.leave(`ambient-scribe:${encounterId}`);
      logger.info(`Client ${socket.id} unsubscribed from ambient-scribe:${encounterId}`);
      socket.emit('unsubscribed', { room: `ambient-scribe:${encounterId}` });
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket client disconnected: ${socket.id}, Reason: ${reason}`);
    });

    // Error handler
    socket.on('error', (error) => {
      logger.error(`WebSocket error for client ${socket.id}:`, error);
    });
  });

  logger.info(`🔌 WebSocket server ready at ${config.websocket.path}`);

  return io;
};

// Event emitters for broadcasting updates
export class WebSocketEvents {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  // Queue updates
  emitQueueUpdate(facilityId: string, data: any): void {
    this.io.to(`queue:${facilityId}`).emit('queue:updated', {
      facilityId,
      ...data,
      timestamp: new Date().toISOString(),
    });
    logger.debug(`Emitted queue update for facility:${facilityId}`);
  }

  // Appointment updates
  emitAppointmentUpdate(appointmentId: string, data: any): void {
    this.io.to(`appointment:${appointmentId}`).emit('appointment:updated', {
      appointmentId,
      ...data,
      timestamp: new Date().toISOString(),
    });
    logger.debug(`Emitted appointment update for appointment:${appointmentId}`);
  }

  // Patient notifications
  emitPatientNotification(patientId: string, notification: any): void {
    this.io.to(`patient:${patientId}`).emit('notification', {
      patientId,
      ...notification,
      timestamp: new Date().toISOString(),
    });
    logger.debug(`Emitted notification for patient:${patientId}`);
  }

  // Capacity alerts
  emitCapacityAlert(facilityId: string, alert: any): void {
    this.io.to(`facility:${facilityId}`).emit('capacity:alert', {
      facilityId,
      ...alert,
      timestamp: new Date().toISOString(),
    });
    logger.debug(`Emitted capacity alert for facility:${facilityId}`);
  }

  // Ambient scribe transcription
  emitAmbientScribeTranscription(encounterId: string, transcription: any): void {
    this.io.to(`ambient-scribe:${encounterId}`).emit('transcription', {
      encounterId,
      ...transcription,
      timestamp: new Date().toISOString(),
    });
    logger.debug(`Emitted transcription for encounter:${encounterId}`);
  }

  // Ambient scribe clinical facts
  emitAmbientScribeFacts(encounterId: string, facts: any): void {
    this.io.to(`ambient-scribe:${encounterId}`).emit('clinical-facts', {
      encounterId,
      ...facts,
      timestamp: new Date().toISOString(),
    });
    logger.debug(`Emitted clinical facts for encounter:${encounterId}`);
  }

  // Diagnostic report ready
  emitDiagnosticReportReady(patientId: string, reportId: string, data: any): void {
    this.io.to(`patient:${patientId}`).emit('diagnostic:ready', {
      patientId,
      reportId,
      ...data,
      timestamp: new Date().toISOString(),
    });
    logger.debug(`Emitted diagnostic report ready for patient:${patientId}`);
  }

  // Dashboard metrics update
  emitDashboardMetrics(facilityId: string, metrics: any): void {
    this.io.to(`facility:${facilityId}`).emit('dashboard:metrics', {
      facilityId,
      ...metrics,
      timestamp: new Date().toISOString(),
    });
    logger.debug(`Emitted dashboard metrics for facility:${facilityId}`);
  }

  // Nurse task updates
  emitNurseTaskUpdate(nurseId: string, task: any): void {
    this.io.to(`user:${nurseId}`).emit('task:updated', {
      nurseId,
      ...task,
      timestamp: new Date().toISOString(),
    });
    logger.debug(`Emitted task update for nurse:${nurseId}`);
  }

  // Emergency alerts
  emitEmergencyAlert(facilityId: string, alert: any): void {
    this.io.to(`facility:${facilityId}`).to(`role:doctor`).to(`role:nurse`).emit('emergency:alert', {
      facilityId,
      ...alert,
      timestamp: new Date().toISOString(),
    });
    logger.warn(`Emitted emergency alert for facility:${facilityId}`);
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any): void {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    logger.debug(`Broadcasted event: ${event}`);
  }

  // Get connection count
  getConnectionCount(): number {
    return this.io.sockets.sockets.size;
  }

  // Get room members
  async getRoomMembers(room: string): Promise<string[]> {
    const sockets = await this.io.in(room).fetchSockets();
    return sockets.map(socket => socket.id);
  }
}

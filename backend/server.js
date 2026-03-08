const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const triageRoutes = require('./routes/triage');
const voiceTriageRoutes = require('./routes/voice-triage');
const liveVoiceRoutes = require('./routes/live-voice');
const appointmentRoutes = require('./routes/appointments');
const clinicalRoutes = require('./routes/clinical');
const drugRoutes = require('./routes/drugs');
const capacityRoutes = require('./routes/capacity');
const dashboardRoutes = require('./routes/dashboard');

// Import database
const { pool, testConnection } = require('./config/database');

const setupLiveVoiceSocket = require('./sockets/live-voice-socket');

// Import logger
const logger = require('./config/logger');

// Force restart again
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Make io available to routes
app.set('io', io);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const dbStatus = await testConnection();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      timezone: process.env.TIMEZONE || 'Asia/Kolkata',
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus ? 'connected' : 'disconnected',
      services: {
        api: 'running',
        websocket: 'running',
        ai_agents: 'ready'
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/voice', voiceTriageRoutes);
app.use('/api/live-voice', liveVoiceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/clinical', clinicalRoutes);
app.use('/api/drugs', drugRoutes);
app.use('/api/capacity', capacityRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Setup Live Voice Socket Handlers
setupLiveVoiceSocket(io);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.emit('connected', {
    message: 'Connected to MedhaOS API Server',
    timestamp: new Date().toISOString(),
    socketId: socket.id
  });

  // Subscribe to channels
  socket.on('subscribe', (channel) => {
    logger.info(`Client ${socket.id} subscribed to ${channel}`);
    socket.join(channel);
    socket.emit('subscribed', { channel });
  });

  socket.on('unsubscribe', (channel) => {
    logger.info(`Client ${socket.id} unsubscribed from ${channel}`);
    socket.leave(channel);
    socket.emit('unsubscribed', { channel });
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Real-time updates broadcaster (every 5 seconds)
setInterval(() => {
  io.emit('metrics_update', {
    timestamp: new Date().toISOString(),
    metrics: {
      activePatients: Math.floor(Math.random() * 100) + 50,
      waitingQueue: Math.floor(Math.random() * 30) + 10,
      bedOccupancy: Math.floor(Math.random() * 20) + 70,
      icuOccupancy: Math.floor(Math.random() * 15) + 60
    }
  });
}, 5000);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      status: 404,
      path: req.path
    }
  });
});

const PORT = process.env.PORT || 4000;

// Start server
server.listen(PORT, async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🏥  MedhaOS Healthcare Platform Backend');
  console.log('='.repeat(60));
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕐 Timezone: ${process.env.TIMEZONE || 'Asia/Kolkata'}`);
  console.log(`🗣️  Languages: ${process.env.SUPPORTED_LANGUAGES || 'en,hi'}`);
  
  // Test database connection
  const dbConnected = await testConnection();
  console.log(`💾 Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}`);
  
  console.log(`🤖 AI Agents: Ready (Gemini ${process.env.GEMINI_MODEL})`);
  console.log('\n' + '='.repeat(60));
  console.log('📚 API Documentation:');
  console.log('   • POST   /api/auth/login');
  console.log('   • GET    /api/patients');
  console.log('   • POST   /api/patients/register');
  console.log('   • POST   /api/triage/score');
  console.log('   • GET    /api/triage/questions');
  console.log('   • POST   /api/voice/transcribe');
  console.log('   • POST   /api/voice/triage-conversation');
  console.log('   • POST   /api/voice/analyze-symptoms');
  console.log('   • POST   /api/appointments/book');
  console.log('   • GET    /api/appointments');
  console.log('   • POST   /api/drugs/check-interactions');
  console.log('   • GET    /api/capacity/beds');
  console.log('   • GET    /api/dashboard/:role');
  console.log('='.repeat(60) + '\n');
  
  logger.info(`MedhaOS Backend started on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    await pool.end();
    logger.info('Database pool closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };

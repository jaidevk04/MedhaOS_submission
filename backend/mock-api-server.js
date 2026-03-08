const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mock API endpoints
app.get('/api/patients', (req, res) => {
  res.json({
    patients: [
      { id: '1', name: 'Patient A', status: 'waiting', priority: 'high' },
      { id: '2', name: 'Patient B', status: 'in-progress', priority: 'medium' },
    ]
  });
});

app.get('/api/alerts', (req, res) => {
  res.json({
    alerts: [
      { id: '1', type: 'critical', message: 'High capacity alert', timestamp: new Date().toISOString() },
      { id: '2', type: 'warning', message: 'Staff shortage', timestamp: new Date().toISOString() },
    ]
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send initial data
  socket.emit('connected', { 
    message: 'Connected to MedhaOS API Server',
    timestamp: new Date().toISOString()
  });

  // Simulate real-time updates
  const updateInterval = setInterval(() => {
    socket.emit('update', {
      type: 'metrics',
      data: {
        activePatients: Math.floor(Math.random() * 100),
        waitTime: Math.floor(Math.random() * 60),
        timestamp: new Date().toISOString()
      }
    });
  }, 5000);

  // Handle client events
  socket.on('subscribe', (channel) => {
    console.log(`Client ${socket.id} subscribed to ${channel}`);
    socket.join(channel);
  });

  socket.on('unsubscribe', (channel) => {
    console.log(`Client ${socket.id} unsubscribed from ${channel}`);
    socket.leave(channel);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    clearInterval(updateInterval);
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 MedhaOS Mock API Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

const { io } = require('socket.io-client');
const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');

require('dotenv').config();
const setupLiveVoiceSocket = require('./sockets/live-voice-socket');

const ioServer = new Server(server, { cors: { origin: '*' } });
setupLiveVoiceSocket(ioServer);

server.listen(4001, () => {
  console.log('Test Server running on port 4001');

  const socket = io('http://localhost:4001');
  
  socket.on('connect', () => {
    console.log('Client connected to socket server');
    socket.emit('start_live_voice', { language: 'en' });
  });

  socket.on('live_voice_started', () => {
    console.log('Live voice session started!');
    // Send a text message to simulate voice input that requires tool usage
    console.log('Sending message: I have a severe headache, nausea, and high fever.');
    socket.emit('live_voice_text_message', { text: 'I have a severe headache, nausea, and high fever.' });
  });

  socket.on('live_voice_symptoms_updated', (args) => {
    console.log('--- EVENT: SYMPTOMS UPDATED ---', args);
    setTimeout(() => {
       console.log('Telling AI to complete triage...');
       socket.emit('live_voice_text_message', { text: 'Can you finish the triage and book me an appointment?' });
    }, 2000);
  });

  socket.on('live_voice_assessment_complete', (args) => {
    console.log('--- EVENT: ASSESSMENT COMPLETE ---', args);
    setTimeout(() => {
        socket.emit('live_voice_text_message', { text: 'Yes, please book the appointment for tomorrow morning at 10 AM.' });
    }, 2000);
  });

  socket.on('live_voice_appointment_booked', (args) => {
    console.log('--- EVENT: APPOINTMENT BOOKED ---', args);
    console.log('All tools tested successfully!');
    process.exit(0);
  });

  socket.on('live_voice_error', (data) => {
    console.error('Socket error:', data);
    process.exit(1);
  });
});

#!/usr/bin/env node

const { io } = require('socket.io-client');

// Get the server URL from command line argument or use default
const serverUrl = process.argv[2] || 'http://localhost:3001';

console.log(`🔌 Testing Socket.IO connection to: ${serverUrl}`);
console.log('=====================================');

// Create Socket.IO client
const socket = io(serverUrl, {
  transports: ['websocket', 'polling'],
  timeout: 5000
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server');
  console.log(`   Socket ID: ${socket.id}`);
  console.log(`   Transport: ${socket.io.engine.transport.name}`);
  
  // Test ping/pong
  socket.emit('ping');
});

socket.on('pong', () => {
  console.log('✅ Ping/Pong test successful');
  
  // Disconnect after successful test
  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 1000);
});

socket.on('disconnect', (reason) => {
  console.log(`❌ Disconnected: ${reason}`);
  process.exit(1);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection failed:', error.message);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('❌ Connection timeout');
  socket.disconnect();
  process.exit(1);
}, 10000);

console.log('⏳ Attempting to connect...'); 
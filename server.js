const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// --- Utilities ---

function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function getLanIp() {
  const interfaces = os.networkInterfaces();
  const virtualPrefixes = ['172.', '169.254.'];
  let fallback = null;
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family !== 'IPv4' || iface.internal) continue;
      if (virtualPrefixes.some(p => iface.address.startsWith(p))) {
        fallback = fallback || iface.address;
        continue;
      }
      return iface.address;
    }
  }
  return fallback || 'localhost';
}

// --- State ---
const roomId = generateRoomId();
const lanIp = getLanIp();

function getBaseUrl() {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  if (process.env.FLY_APP_NAME) {
    return `https://${process.env.FLY_APP_NAME}.fly.dev`;
  }
  return `http://${lanIp}:${PORT}`;
}

const phoneUrl = `${getBaseUrl()}/phone?room=${roomId}`;

// --- Static files ---
app.use(express.static(path.join(__dirname, 'public')));

app.get('/phone', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'phone.html'));
});

// --- Socket.io ---
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Totem registers itself
  socket.on('totem:ready', () => {
    console.log(`Totem ready. Room: ${roomId} | Phone URL: ${phoneUrl}`);
    socket.join(roomId);
    socket.emit('server:init', { roomId, phoneUrl });
  });

  // Phone joins a room
  socket.on('phone:join', ({ roomId: requestedRoomId }) => {
    if (requestedRoomId !== roomId) {
      // Invalid room — session may have expired (Phase 3 will handle this properly)
      socket.emit('server:error', { message: 'Room not found or expired.' });
      return;
    }
    socket.join(roomId);
    socket.data.role = 'phone';
    console.log(`Phone joined room: ${roomId}`);

    // Notify totem
    io.to(roomId).except(socket.id).emit('totem:phone-connected', { socketId: socket.id });

    // Confirm to phone
    socket.emit('server:joined', { roomId });
  });

  // Phone sends a ping — relay to room (Totem) and respond with pong
  socket.on('phone:ping', ({ roomId }) => {
    console.log(`Ping from phone in room: ${roomId}`);
    io.to(roomId).except(socket.id).emit('server:ping', {});
    socket.emit('server:pong', {});
  });

  // Totem reports state change — relay to phone
  socket.on('totem:state', ({ state }) => {
    io.to(roomId).except(socket.id).emit('totem:state', { state });
  });

  // Phone reports calculated RTT — forward to room (Totem)
  socket.on('phone:latency', ({ roomId, latencyMs }) => {
    console.log(`Latency reported: ${latencyMs}ms in room ${roomId}`);
    io.to(roomId).except(socket.id).emit('server:latency', { latencyMs });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.data.role === 'phone') {
      io.to(roomId).emit('phone:disconnected', { socketId: socket.id });
      console.log(`Phone disconnected from room: ${roomId}`);
    } else {
      console.log(`Socket disconnected: ${socket.id}`);
    }
  });
});

// --- Start ---
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Phone URL: ${phoneUrl}`);
  console.log(`Room ID:   ${roomId}`);
});

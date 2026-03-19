const socket = io();

const statusEl = document.getElementById('status');
const canvasEl = document.getElementById('qr-canvas');
const roomIdEl = document.getElementById('room-id');
const phoneUrlEl = document.getElementById('phone-url');
const latencyEl = document.getElementById('latency-display');

// 1. Register totem with server
socket.emit('totem:ready');

// 2. Receive initialization data (roomId, phoneUrl)
socket.on('server:init', ({ roomId, phoneUrl }) => {
  // Show room ID text
  roomIdEl.textContent = roomId;
  phoneUrlEl.textContent = phoneUrl;

  // Render QR code
  QRCode.toCanvas(canvasEl, phoneUrl, { width: 300, margin: 2 }, (err) => {
    if (err) console.error('QR generation error:', err);
  });
});

// 3. Phone connected notification (Phase 1 — visual confirmation only)
socket.on('totem:phone-connected', () => {
  statusEl.textContent = 'Player connected! ✓';
  statusEl.classList.add('connected');
});

// 4. Phone disconnected notification (Phase 3 will expand this)
socket.on('phone:disconnected', () => {
  statusEl.textContent = 'Waiting for player...';
  statusEl.classList.remove('connected');
});

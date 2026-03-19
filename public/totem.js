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

// 5. Web Audio API — lazy init on first user interaction or first ping
let audioCtx = null;

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 6. Beep function (880Hz sine, ~80ms, exponential fade-out)
function playBeep() {
  const ctx = ensureAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, ctx.currentTime);

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.08);
}

// 7. Flash function (body background swap for 200ms, no CSS transition)
function flashGreen() {
  document.body.style.background = '#39ff14';
  setTimeout(() => {
    document.body.style.background = '#1a1a1a';
  }, 200);
}

// 8. server:ping handler — flash + beep concurrently (INT-02, INT-03)
socket.on('server:ping', () => {
  flashGreen();
  playBeep();
});

// 9. server:latency handler — update latency display (INT-04)
socket.on('server:latency', ({ latencyMs }) => {
  latencyEl.textContent = '\u23F1\uFE0F ' + latencyMs + ' ms';
});

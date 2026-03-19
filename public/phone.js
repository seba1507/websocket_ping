const socket = io({ transports: ['websocket'] });

const statusEl = document.getElementById('status');
const roomDisplayEl = document.getElementById('room-display');
const pingBtn = document.getElementById('ping-btn');
const pongFeedback = document.getElementById('pong-feedback');

let pingTimestamp = null;

// 1. Read room ID from URL query parameter
const params = new URLSearchParams(window.location.search);
const roomId = params.get('room');

if (!roomId) {
  statusEl.textContent = 'Error: No room ID in URL.';
  statusEl.classList.add('error');
} else {
  roomDisplayEl.textContent = `Room: ${roomId}`;

  // 2. Join room when connected to server
  socket.on('connect', () => {
    statusEl.textContent = 'Connecting to room...';
    socket.emit('phone:join', { roomId });
  });
}

// 3. Confirmed in room
socket.on('server:joined', ({ roomId: confirmedRoom }) => {
  statusEl.textContent = `Connected to room ${confirmedRoom} ✓`;
  statusEl.classList.add('connected');
  pingBtn.style.display = 'block';
});

// 4. Error from server (e.g. room not found)
socket.on('server:error', ({ message }) => {
  statusEl.textContent = `Error: ${message}`;
  statusEl.classList.remove('connected');
  statusEl.classList.add('error');
});

// 5. Socket disconnected
socket.on('disconnect', () => {
  statusEl.textContent = 'Disconnected...';
  statusEl.classList.remove('connected');
});

// 6. Ping button handler
pingBtn.addEventListener('click', () => {
  if (pingBtn.disabled) return;
  pingBtn.disabled = true;
  pingBtn.style.opacity = '0.4';
  pingTimestamp = Date.now();
  socket.emit('phone:ping', { roomId });
});

// 7. Pong feedback handler
socket.on('server:pong', () => {
  const latencyMs = Date.now() - pingTimestamp;

  // Display RTT on phone
  pongFeedback.textContent = latencyMs + ' ms';

  // Flash body green for 200ms (instant swap, no transition)
  document.body.style.background = '#39ff14';
  setTimeout(() => {
    document.body.style.background = '#1a1a1a';
  }, 200);

  // Haptic feedback - 80ms vibration, silent fail if unsupported
  if (navigator.vibrate) {
    navigator.vibrate(80);
  }

  // Re-enable button
  pingBtn.disabled = false;
  pingBtn.style.opacity = '1';

  // Send latency to server for Totem display
  socket.emit('phone:latency', { roomId, latencyMs });
});

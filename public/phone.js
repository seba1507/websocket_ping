const socket = io();

const statusEl = document.getElementById('status');
const roomDisplayEl = document.getElementById('room-display');
const pingBtn = document.getElementById('ping-btn');
const pongFeedback = document.getElementById('pong-feedback');

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
  // Phase 2 will show the ping button here
  // pingBtn.style.display = 'block';
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

// 6. Phase 2 placeholder — ping button handler (wired up in Plan 02-01)
// pingBtn.addEventListener('click', () => { ... });

// 7. Phase 2 placeholder — pong feedback handler
// socket.on('server:pong', ({ latencyMs }) => { ... });

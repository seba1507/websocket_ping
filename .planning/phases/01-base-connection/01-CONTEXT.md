# Phase 1: Base Connection - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning
**Source:** User discussion during /gsd-plan-phase 1

<domain>
## Phase Boundary

This phase establishes the foundational real-time communication pipeline between the Totem (large screen) and the Phone (mobile browser). It delivers: a running Node.js + Socket.io server, a QR code displayed on the Totem, and a Phone browser client that scans the QR, joins the specific Socket.io Room, and confirms the connection visually on both ends.

This phase does NOT include any ping/pong interaction logic, latency measurement, or resilience handling — those belong to Phases 2 and 3.

</domain>

<decisions>
## Implementation Decisions

### Server
- **Runtime**: Node.js with Express + Socket.io
- **Port**: `3000`
- **Entry point**: `server.js` at project root
- **Static assets**: Served via `express.static('public/')` — no bundler, no framework
- **Room ID generation**: 6-character uppercase alphanumeric ID (e.g. `A3KZ91`) generated server-side on startup using `Math.random()`
- **npm dependencies**: `express`, `socket.io`, `qrcode`

### File Structure
```
pingpong/
├── server.js
├── package.json
└── public/
    ├── totem.html
    ├── totem.js
    ├── phone.html
    └── phone.js
```

### Socket.io Event Naming Convention
| Event | Direction | Description |
|-------|-----------|-------------|
| `phone:join` | Phone → Server | Phone joins the room with its room ID |
| `totem:ready` | Totem → Server | Totem registers itself and listens for events |
| `totem:phone-connected` | Server → Totem | Server notifies Totem that a Phone has joined |
| `phone:disconnected` | Server → Totem | Server notifies Totem that Phone disconnected |

*Ping/pong events (phase:ping, server:pong, totem:flash) are defined in Phase 2.*

### Totem Client (totem.html + totem.js)
- Dark background (e.g. `#1a1a1a`)
- Centered QR code rendered on a `<canvas>` using the `qrcode` npm package (served client-side via CDN: `https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js`)
- QR encodes the full URL: `http://[LAN-IP]:3000/phone?room=[ROOM_ID]`
- Below the QR: text showing the Room ID in large monospace font
- Status overlay: initially "Waiting for player...", switches to "Player connected! ✓" in green when phone joins

### Phone Client (phone.html + phone.js)
- Room ID extracted from URL query param: `new URLSearchParams(location.search).get('room')`
- On load: immediately emit `phone:join` with `{ roomId }`
- Status display: shows "Connecting..." then "Connected to room [ROOM_ID] ✓"
- The main interactive button ("SEND PING") is NOT built in this phase — it is a Phase 2 concern
- Phase 1 phone UI only shows connection status

### Server Routing
- `GET /` → serves `public/totem.html`
- `GET /phone` → serves `public/phone.html`
- `GET /phone?room=XXXXXX` → same file, room ID handled client-side via JS

### LAN IP Detection
- Server detects its own LAN IP at startup using Node's `os.networkInterfaces()`
- Logs the full phone URL to console: `Phone URL: http://192.168.x.x:3000/phone?room=XXXXXX`
- QR code uses this IP so phones on the same WiFi can connect

### Claude's Discretion
- Exact CSS/visual polish (beyond functional dark background + legible text)
- Error handling for malformed room IDs (simple redirect to `/` is fine)
- Socket.io CORS settings (allow all origins for PoC simplicity)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/PROJECT.md` — Core value, constraints, out-of-scope
- `.planning/REQUIREMENTS.md` — REQ-IDs BASE-01, BASE-02, BASE-03
- `.planning/ROADMAP.md` — Phase 1 success criteria

No external specs or ADRs — all requirements fully captured in decisions above.

</canonical_refs>

<specifics>
## Specific Ideas

- The QR URL pattern must be exactly: `http://[LAN-IP]:3000/phone?room=[ROOM_ID]`
- Room ID must be stored in server memory (a simple `let roomId = generateId()` is fine — no database)
- The Totem page is the "default" landing page at `/`, the Phone page is at `/phone`
- Use `socket.join(roomId)` on the server when phone connects, and `io.to(roomId).emit(...)` for room-specific messages

</specifics>

<deferred>
## Deferred Ideas

- The "SEND PING" button UI → Phase 2
- Latency measurement → Phase 2
- Flash/beep/haptic feedback → Phase 2
- Grace period / 30s timeout → Phase 3
- Session expiration message → Phase 3

</deferred>

---

*Phase: 01-base-connection*
*Context gathered: 2026-03-19 via /gsd-plan-phase 1 discussion*

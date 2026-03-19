# El Ping-Pong (WebSocket Latency PoC)

## What This Is

A minimalist sandbox environment designed specifically to audit real-time WebSocket communication between a Totem (large screen) and a user's personal mobile phone. Its sole purpose is to test the technical pipeline for BTL (Below The Line) brand activations, entirely stripped of graphic or conceptual distractions.

## Core Value

Provide an objective, brutally obvious, and instant measurement of network latency and connection resilience, ensuring the "magic" of the experience isn't broken by technical friction.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- [x] **Flawless Handshake**: QR code scan reliably connects a specific phone to a specific Totem via Socket.io Rooms without crossover errors. (Validated in Phase 1: base-connection)

### Active

<!-- Current scope. Building toward these. -->

- [ ] **Instant Visual Feedback**: Totem must show a full-screen intense color flash (e.g., dark gray to neon green for 200ms) upon phone button press.
- [ ] **Phone Minimalist UI**: The mobile interface must consist of a single, full-screen interactive area (a giant button) reading "SEND PING", preventing any user confusion.
- [ ] **Haptic/Visual Pong Feedback**: The phone must receive the 'pong' back from the server/Totem and trigger a physical haptic vibration or visual flash, confirming the full round-trip.
- [ ] **Objective Measurement**: Overwrite a giant text in the center of the Totem showing the exact latency (e.g., `⏱️ 42 ms`).
- [ ] **Audio Cue**: Trigger a short, dry "beep" sound alongside the flash (human ear detects desync better than the eye).
- [ ] **30-Second Grace Period**: If the phone disconnects (screen lock, 4G loss), Totem enters a warning state: "Conexión inestable... Esperando al jugador [30s]".
- [ ] **Seamless Auto-Reconnect**: If the phone returns within 30s, the session resumes instantly without user friction.
- [ ] **Session Timeout**: After 30s of phone disconnection, the server destroys the room. The Totem clears the warning, kicks the phone logically, and displays a completely new QR code for the next user. Late reconnects get a "Tu sesión expiró" message.

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- **Complex Animations** — Interpolation/rendering frames obscure whether the delay is from the network or the GPU.
- **Raw WebSockets (`ws` library)** — Too raw; requires manual implementation of heartbeats, fallbacks, and reconnect logic.
- **Persistent Databases / User Accounts** — Adds setup overhead and isn't necessary for testing the real-time communication pipeline.

## Context

- **Use Case**: BTL activations at events where users control a Totem via their own phones.
- **Environment**: Internet connectivity at these events can be highly unstable (e.g., weak 4G, firewalls, sudden drops).
- **Tech Stack Selection**: Node.js with Socket.io is chosen explicitly because it handles reconnections automatically, has native Rooms, and offers HTTP long-polling fallback, which is crucial for bypassing restrictive 4G firewalls.

## Constraints

- **Performance**: The entire phone-to-Totem roundtrip must feel instant (under 100-150ms). We must isolate network latency from rendering latency.
- **Tech Stack**: Must use Node.js and Socket.io. Avoid third-party managed services like Pusher or Supabase to maintain control and zero-latency capability if running a local server at the event.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Socket.io over raw `ws` | Built-in resilience, rooms, and automatic fallbacks to HTTP polling for unstable 4G | ✓ Confirmed (Phase 1) |
| Color flash instead of animation | Instant rendering guarantees that measured delay is network-level, not graphical | — Pending |
| 30s Grace Period | Minimizes user friction; re-scanning a QR code ruins the experience if a minor drop occurs | — Pending |

---
*Last updated: 2026-03-19 after Phase 01 completion*

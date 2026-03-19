# Requirements: El Ping-Pong

**Defined:** 2026-03-19
**Core Value:** Provide an objective, brutally obvious, and instant measurement of network latency and connection resilience, ensuring the "magic" of the experience isn't broken by technical friction.

## v1 Requirements

### Base Pipeline

- [ ] **BASE-01**: Totem can generate a unique Room QR code.
- [ ] **BASE-02**: Phone can scan QR code and connect to the specific Totem Room.
- [ ] **BASE-03**: Totem and Phone utilize Socket.io for WebSocket communication and fallback.

### Real-time Interaction

- [ ] **INT-01**: Phone displays a single, full-screen interactive area (a giant button) reading "SEND PING" to trigger the ping.
- [ ] **INT-02**: Totem registers the ping and flashes intense color (e.g., neon green) for 200ms.
- [ ] **INT-03**: Totem plays a short "beep" sound concurrently with the color flash.
- [ ] **INT-04**: Totem calculates and displays the exact network latency (in ms) of the roundtrip/one-way trip.
- [ ] **INT-05**: Phone receives 'pong' from server/Totem and triggers a physical haptic vibration or visual flash.

### Resilience

- [ ] **RES-01**: Totem detects phone disconnection and enters a 30-second "Grace Period" warning state.
- [ ] **RES-02**: Phone automatically reconnects to the same Room if connectivity is restored within 30s.
- [ ] **RES-03**: Totem resumes the active session seamlessly upon phone reconnection.
- [ ] **RES-04**: After 30s of phone disconnection, the server destroys the room. Totem clears warning, logically kicks phone, and displays new QR.
- [ ] **RES-05**: Phone displays "Tu sesión expiró" if it attempts to reconnect after the 30s timeout.

## v2 Requirements

(None. This is a minimalist PoC.)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Complex animations | Interpolation/rendering frames obscure whether the delay is from the network or the GPU. |
| Raw WebSockets (`ws`) | Too raw; requires manual implementation of heartbeats, fallbacks, and reconnect logic. |
| Persistent Databases | Adds setup overhead and isn't necessary for testing the real-time communication pipeline. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BASE-01 | Phase 1 | Pending |
| BASE-02 | Phase 1 | Pending |
| BASE-03 | Phase 1 | Pending |
| INT-01 | Phase 2 | Pending |
| INT-02 | Phase 2 | Pending |
| INT-03 | Phase 2 | Pending |
| INT-04 | Phase 2 | Pending |
| INT-05 | Phase 2 | Pending |
| RES-01 | Phase 3 | Pending |
| RES-02 | Phase 3 | Pending |
| RES-03 | Phase 3 | Pending |
| RES-04 | Phase 3 | Pending |
| RES-05 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after initial definition*

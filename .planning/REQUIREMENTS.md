# Requirements: El Ping-Pong

**Defined:** 2026-03-19
**Core Value:** Provide an objective, brutally obvious, and instant measurement of network latency and connection resilience, ensuring the "magic" of the experience isn't broken by technical friction.

## v1 Requirements

### Base Pipeline

- [ ] **BASE-01**: Totem can generate a unique Room QR code.
- [ ] **BASE-02**: Phone can scan QR code and connect to the specific Totem Room.
- [ ] **BASE-03**: Totem and Phone utilize Socket.io for WebSocket communication and fallback.

### Real-time Interaction

- [ ] **INT-01**: Phone displays a large, obvious button to trigger the ping.
- [ ] **INT-02**: Totem registers the ping and flashes intense color (e.g., neon green) for 200ms.
- [ ] **INT-03**: Totem plays a short "beep" sound concurrently with the color flash.
- [ ] **INT-04**: Totem calculates and displays the exact network latency (in ms) of the roundtrip/one-way trip.

### Resilience

- [ ] **RES-01**: Totem detects phone disconnection and enters a 30-second "Grace Period" warning state.
- [ ] **RES-02**: Phone automatically reconnects to the same Room if connectivity is restored within 30s.
- [ ] **RES-03**: Totem resumes the active session seamlessly upon phone reconnection.
- [ ] **RES-04**: Totem destroys the session, closes the room, and generates a new QR if the 30s timeout is reached.
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
| BASE-01 | TBD | Pending |
| BASE-02 | TBD | Pending |
| BASE-03 | TBD | Pending |
| INT-01 | TBD | Pending |
| INT-02 | TBD | Pending |
| INT-03 | TBD | Pending |
| INT-04 | TBD | Pending |
| RES-01 | TBD | Pending |
| RES-02 | TBD | Pending |
| RES-03 | TBD | Pending |
| RES-04 | TBD | Pending |
| RES-05 | TBD | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 0
- Unmapped: 12 ⚠️

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after initial definition*

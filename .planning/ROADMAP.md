# Roadmap: El Ping-Pong

## Overview

A 3-phase journey to build a minimalist WebSocket sandox. We start by establishing the core connection via QR code (Phase 1), define the real-time interaction loop with extremely low latency feedback (Phase 2), and finally harden the system against real-world 4G drops using a 30-second grace period (Phase 3).

## Phases

- [ ] **Phase 1: Base Connection** - Establish a reliable Socket.io connection between Totem and Phone via QR code.
- [ ] **Phase 2: Real-time Interaction** - Implement the core latency measurement loop and visual/audio feedback.
- [ ] **Phase 3: Connection Resilience** - Handle unstable 4G drops with a 30-second Grace Period and session expiration.

## Phase Details

### Phase 1: Base Connection
**Goal**: Establish a reliable Socket.io connection between Totem and Phone via QR code.
**Depends on**: Nothing (first phase)
**Requirements**: [BASE-01, BASE-02, BASE-03]
**Success Criteria** (what must be TRUE):
  1. Totem generates and displays a unique QR code.
  2. Phone scans the QR and successfully joins the specific Socket.io room.
  3. Totem detects and visually confirms the phone has connected.
**Plans**: 2 plans

Plans:
- [ ] 01-01: Totem server setup and QR generation
- [ ] 01-02: Phone client connection and room joining

### Phase 2: Real-time Interaction
**Goal**: Implement the core latency measurement loop (Ping-Pong) and visual/audio feedback.
**Depends on**: Phase 1
**Requirements**: [INT-01, INT-02, INT-03, INT-04, INT-05]
**Success Criteria** (what must be TRUE):
  1. User presses the button on the phone to send a ping.
  2. Totem instantly flashes green and plays a beep sound upon receiving the ping.
  3. Totem accurately calculates and displays the network latency in milliseconds.
  4. Phone receives the 'pong' and triggers a haptic vibration or visual flash.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Ping event handling and latency calculation logic
- [ ] 02-02: Totem visual flash and audio beep integration

### Phase 3: Connection Resilience
**Goal**: Handle unstable 4G drops with a 30-second Grace Period and session expiration.
**Depends on**: Phase 2
**Requirements**: [RES-01, RES-02, RES-03, RES-04, RES-05]
**Success Criteria** (what must be TRUE):
  1. Disconnecting the phone triggers an "Esperando al jugador [30s]" warning on the Totem.
  2. Reconnecting within 30s resumes the session instantly without generating a new QR.
  3. Staying disconnected for >30s generates a new QR on Totem and blocks the old phone connection with an expiration message.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Connection loss detection, Grace Period UI, and auto-resume logic
- [ ] 03-02: 30-second timeout enforcement and session unlinking logic

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Base Connection | 0/2 | Not started | - |
| 2. Real-time Interaction | 0/2 | Not started | - |
| 3. Connection Resilience | 0/2 | Not started | - |

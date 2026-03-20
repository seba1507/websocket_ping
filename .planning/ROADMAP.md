# Roadmap: El Ping-Pong

## Overview

A 4-phase journey to build a minimalist WebSocket sandbox. We start by establishing the core connection via QR code (Phase 1), define the real-time interaction loop with extremely low latency feedback (Phase 2), harden the system against real-world 4G drops using a 30-second grace period (Phase 3), and finally deliver a full WebGL/Canvas UI redesign for both Totem and Phone (Phase 4).

## Phases

- [x] **Phase 1: Base Connection (2026-03-19)** - Establish a reliable Socket.io connection between Totem and Phone via QR code.
- [x] **Phase 2: Real-time Interaction (2026-03-19)** - Implement the core ping/pong loop and visual/haptic feedback. Note: latency display and audio removed by design decision post-implementation.
- [ ] **Phase 3: Connection Resilience** - Handle unstable 4G drops with a 30-second Grace Period and session expiration.
- [x] **Phase 4: UI Redesign (2026-03-19)** - Full visual overhaul of Totem (WebGL wave + Canvas 2D dormant animation) and Phone (glassmorphism) as self-contained HTML files. (completed 2026-03-19)
- [x] **Phase 5: FSM Experience (2026-03-20)** - Added FSM state machine to Totem (locked/unlocked/active/result), Three.js icosahedron with UnrealBloom, camera shake, state-driven overlay text, progress dots, state flash transitions. Phone button label and visual palette sync with totem FSM state.

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
- [x] 01-01: Totem server setup and QR generation
- [x] 01-02: Phone client connection and room joining

### Phase 2: Real-time Interaction
**Goal**: Implement the core ping/pong interaction loop with feedback.
**Depends on**: Phase 1
**Requirements**: [INT-01, INT-02, INT-03, INT-04, INT-05]
**Status**: Complete (with design deviations)
**Success Criteria**:
  1. ✅ Phone button sends ping via socket.
  2. ✅ Totem reacts visually on ping (wave effect replaces green flash).
  3. ⚠️ Latency display implemented then removed by user decision.
  4. ✅ Phone receives pong, haptic vibration fires.
  5. ⚠️ Audio (beep) implemented then removed by user decision.
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — Server ping routing + phone ping/pong UI (button, RTT calc, flash, haptic)
- [ ] 02-02-PLAN.md — Totem flash, beep, and latency display + end-to-end verification (superseded by Phase 4/5)

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

### Phase 4: UI Redesign
**Goal**: Full visual overhaul of Totem (WebGL wave + Canvas 2D dormant animation) and Phone (glassmorphism dark UI) as self-contained HTML files. Delete totem.js and phone.js — all logic inlined.
**Depends on**: Phase 1
**Requirements**: [UI-01, UI-02, UI-03, UI-04]
**Status**: Complete (2026-03-19)
**Success Criteria**:
  1. ✅ totem.html self-contained; WebGL wave triggers on server:ping.
  2. ✅ phone.html self-contained; glassmorphism button emits phone:ping.
  3. ✅ totem.js and phone.js deleted.
  4. ✅ All socket events working end-to-end.
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — Totem rewrite: self-contained WebGL wave + Canvas 2D dormant + socket logic
- [x] 04-02-PLAN.md — Phone rewrite: self-contained glassmorphism UI + file deletions + e2e verification

---

### Phase 5: FSM Experience
**Goal**: Upgrade the totem+phone into a multi-state interactive experience with a 4-step FSM.
**Depends on**: Phase 4
**Status**: Complete (2026-03-20)
**Success Criteria**:
  1. ✅ Totem FSM: idle → locked → unlocked → active → result → locked (loop).
  2. ✅ Each ping transitions FSM state with flash, overlay text, progress dots.
  3. ✅ Three.js icosahedron with UnrealBloom replaces Canvas 2D dormant animation. Scale, rotation speed, bloom intensity are state-driven.
  4. ✅ Camera shake on ping.
  5. ✅ Phone button label changes per state: DESBLOQUEAR / ACTIVAR / REVELAR PREMIO / REINICIAR.
  6. ✅ Phone button palette (border color, glow, background tint) matches totem state colors.
  7. ✅ Latency ms display removed. Audio removed.

**Socket events added**:
| Event | Direction | Description |
|-------|-----------|-------------|
| `totem:state` | Totem → Server → Phone | Totem notifies phone of new FSM state after each ping |

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Base Connection | 2/2 | Complete | 2026-03-19 |
| 2. Real-time Interaction | 1/2 | Complete* | 2026-03-19 |
| 3. Connection Resilience | 0/2 | Not started | - |
| 4. UI Redesign | 2/2 | Complete | 2026-03-19 |
| 5. FSM Experience | — | Complete | 2026-03-20 |

*Phase 2 plan 02-02 superseded by Phase 4/5 visual overhaul.

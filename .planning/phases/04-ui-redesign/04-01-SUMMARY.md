---
phase: 04-ui-redesign
plan: 01
subsystem: ui
tags: [webgl, canvas2d, webaudio, socket.io, glsl, fBm, chromatic-aberration]

requires:
  - phase: 02-real-time-interaction
    provides: socket events server:ping, server:latency, totem:phone-connected, phone:disconnected, server:init

provides:
  - Self-contained totem.html with WebGL chromatic wave shader, Three.js bloom anomaly, 880Hz beep, and full 3-state socket machine

affects:
  - 04-02 (phone UI redesign — shares same visual language and socket event patterns)

tech-stack:
  added:
    - Three.js r0.160.0 via importmap — IcosahedronGeometry + simplex noise vertex shader + UnrealBloomPass
  patterns:
    - "Single-file self-contained HTML with importmap for Three.js module resolution"
    - "Two-canvas architecture: WebGL (z-index:0) for wave bg, Three.js (z-index:1, mix-blend-mode:screen) for anomaly"
    - "WebGL single-program dual-mode: idle (bgA vignette) vs wave mode via u_wave/u_strength/u_bgBlend uniforms"
    - "u_bgBlend uniform enables 1s blue fade-out after wave completes (waveFading state)"
    - "Lazy AudioContext: created on first server:ping, fail-silent for autoplay policy"

key-files:
  created: []
  modified:
    - public/totem.html

key-decisions:
  - "WebGL shader uses single program with u_wave=0 for idle mode; u_bgBlend uniform controls post-wave blue fade-out"
  - "bgA() changed from grid pattern to vignette gradient (dark center to pure black at edges) — cleaner look"
  - "Canvas 2D dormant blobs replaced by Three.js IcosahedronGeometry with simplex noise displacement + UnrealBloom"
  - "Three.js canvas uses mix-blend-mode:screen so bloom fuses with WebGL wave naturally"
  - "triggerWave always fires from UV (0.5,0.5); anomalyPulse=1.0 triggers simultaneous 3D pulse"
  - "Wave chromatic aberration: 3x separate UV displacement (uvR/uvG/uvB) with different dir/perp offsets"
  - "importmap required: Three.js jsm addons import bare 'three' specifier"

patterns-established:
  - "State machine: QR screen (State 1) / Three.js anomaly (State 2) / WebGL wave + anomaly pulse (State 3)"
  - "Unified renderAll() loop drives both WebGL drawArrays and Three.js composer.render() per frame"
  - "Chroma flash: remove class, force reflow (void el.offsetWidth), re-add class for restart"

requirements-completed: [UI-01]

duration: 15min
completed: 2026-03-19
---

# Phase 04 Plan 01: Totem UI Redesign Summary

**WebGL fBm chromatic wave totem with Canvas 2D dormant blob, 880Hz beep, and self-contained socket state machine replacing the old totem.html + totem.js split**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-19T00:00:00Z
- **Completed:** 2026-03-19T00:15:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Rewrote `public/totem.html` as a fully self-contained file (no `totem.js` reference)
- WebGL fragment shader with fBm noise, chromatic aberration displacement, bgA/bgB backgrounds, and organic wave propagation
- Canvas 2D dormant animation: 3 screen-blended organic blobs (red/white/cyan), perpendicular magenta/cyan blobs, white rim, expanding ring halos, cold-blue interior radial gradient
- 3-state socket machine: QR screen on load, dormant blob when phone connects, WebGL wave on server:ping, returns to dormant when wave completes
- 880Hz Web Audio sine beep with exponential fade, lazy-initialized AudioContext
- Chromatic latency flash (chroma-flash class with restart-on-repeat logic)

## Task Commits

1. **Task 1: Rewrite totem.html as self-contained file** - `8516777` (feat)

**Plan metadata:** (docs commit — pending)

## Files Created/Modified

- `public/totem.html` — Complete rewrite: WebGL shader, Canvas 2D dormant, Web Audio, socket state machine, QR generation, all inlined

## Decisions Made

- WebGL uses a single shader program throughout; `u_wave = 0.0` naturally short-circuits all wave code so no second idle shader is needed
- Canvas 2D fBm replicates the GLSL noise using `Math.sin` approximation, avoiding a secondary WebGL context
- `triggerWave(0.5, 0.5)` always fires from screen center per spec — no click-position tracking needed for the totem

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Totem UI complete and self-contained; `totem.js` can be deleted after phase 04-02 confirms phone UI parity
- Phase 04-02 (phone UI redesign) can proceed immediately — no server.js changes needed

---
*Phase: 04-ui-redesign*
*Completed: 2026-03-19*

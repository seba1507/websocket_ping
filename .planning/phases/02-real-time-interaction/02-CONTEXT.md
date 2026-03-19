# Phase 2: Real-time Interaction - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the core Ping-Pong loop: phone button press triggers a ping, server routes it to the Totem which flashes green and plays a beep, server relays a pong back to the phone which gives haptic + visual feedback, phone calculates the round-trip time and sends it to the Totem for display.

This phase does NOT include resilience logic (disconnection grace period, session timeout, auto-reconnect) — those belong to Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Latency measurement
- Measurement type: **full round-trip time (RTT)** — the elapsed time from when the phone sends the ping to when it receives the pong
- **Phone is responsible for the calculation**: records `Date.now()` before emitting the ping event, calculates `Date.now() - timestamp` when the pong arrives
- Phone then emits the result to the server, which forwards it to the Totem via `io.to(roomId)`
- Totem displays the format: `⏱️ 42 ms` — matching the example in PROJECT.md
- Latency display **persists** — shows the last measurement until the next ping overwrites it (does not reset to blank between pings)

### Phone pong feedback
- Both **haptic + visual flash** on pong arrival
- Haptic: `navigator.vibrate(80)` (80ms pulse) — falls back silently on devices without Vibration API support
- Visual: full-screen background flash from `#1a1a1a` → `#39ff14` for 200ms (mirrors the Totem flash)
- The `#pong-feedback` div displays the RTT number (e.g. `42 ms`) — phone already has this value since it calculated it

### Audio — Sci-Fi Pulse (replaces simple beep)
- **Web Audio API** — no static audio files needed, two simultaneous layers
- **Layer 1 — Sub-Bass impact (dominant):**
  - OscillatorNode type `sine`, starts at **~80Hz**, pitch drops to **~40Hz** over 150ms (scheduled via `frequency.exponentialRampToValueAtTime`)
  - GainNode: starts at **1.0**, exponential decay to 0 over **150ms**
  - Gives the pulse physical "weight" — the bass drop that you feel
- **Layer 2 — Energy whiplash (texture):**
  - OscillatorNode type `sawtooth` or `square` feeding a **BiquadFilterNode** (type: `bandpass`)
  - Filter frequency sweeps **down from ~3kHz to ~1kHz** over **100ms** (`frequency.exponentialRampToValueAtTime`)
  - Filter Q: moderate (~5-8) for a crystalline laser resonance
  - GainNode: starts at **0.65** (sub-dominant), exponential decay to 0 over 150ms
  - Gives the pulse its sci-fi laser / liquid crystal texture
- **Timing:** both layers start simultaneously on the same frame
- **Total duration:** ~150ms — short and impactful, does not interrupt game flow
- Plays concurrently with the Totem's color flash (triggered on the same `server:ping` event)

### Button state during flight
- Button is **disabled while awaiting pong** — disabled attribute set immediately after tap
- Visual disabled state: `opacity: 0.4`, no cursor change — button dims visibly but stays neon green
- Button re-enables immediately when `server:pong` arrives (not on timeout)

### Claude's Discretion
- Exact Socket.io event names for Phase 2 (follow the established `noun:verb` convention from Phase 1 CONTEXT.md)
- AudioContext initialization strategy (handle browser autoplay policy)
- Exact CSS for the Totem full-screen flash (body background override vs overlay element)
- Exact CSS for the phone full-screen flash
- Totem flash: restore `#1a1a1a` background after 200ms

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project constraints and requirements
- `.planning/PROJECT.md` — Core value, constraints, out-of-scope rules (no complex animations, must use Socket.io)
- `.planning/REQUIREMENTS.md` — REQ-IDs INT-01 through INT-05 (the exact acceptance criteria for this phase)
- `.planning/ROADMAP.md` — Phase 2 success criteria and goal

### Prior phase context (patterns to continue)
- `.planning/phases/01-base-connection/01-CONTEXT.md` — Socket.io event naming convention, file structure, established color scheme, DOM element IDs

### Existing source files to read before modifying
- `public/phone.html` — `#ping-btn` already exists (hidden), `#pong-feedback` already exists; understand current DOM before adding Phase 2 behavior
- `public/phone.js` — Phase 2 placeholder comments at lines 29, 47, 50 mark exact insertion points
- `public/totem.html` — `#latency-display` already exists and is styled; read before adding flash logic
- `public/totem.js` — `latencyEl` already referenced; read before adding Phase 2 handlers
- `server.js` — Read existing event handlers before adding `phone:ping` routing logic

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `#ping-btn` (phone.html): Already styled — neon green, 200px tall, full-width, bold monospace, `display: none`. Phase 2 just needs to set `display: block` after `server:joined`.
- `#pong-feedback` (phone.html): Existing div at bottom, currently empty. Phase 2 populates it with the latency number.
- `#latency-display` (totem.html): Already styled at `4rem`, `font-weight: bold`, `#39ff14` neon green. Phase 2 sets its `textContent`.
- `latencyEl` (totem.js line 7): Already queried from DOM — ready to use.
- Established color constants: `#1a1a1a` (dark bg), `#39ff14` (neon green), `#f0f0f0` (text)

### Established Patterns
- Socket.io event naming: `noun:verb` format (e.g. `phone:join`, `totem:ready`, `server:init`, `totem:phone-connected`)
- Client-side room awareness: both `phone.js` and `totem.js` receive `roomId` from server events; use it for room-scoped messages
- No bundler/framework: plain `<script>` tags, vanilla JS, inline CSS in HTML files
- Error handling: `socket.on('server:error', ...)` pattern already in `phone.js`

### Integration Points
- `phone.js`: Ping button click handler and pong response handler slot into the commented-out placeholders (lines 46-50)
- `phone.js`: Show `#ping-btn` inside the `server:joined` handler (line 29 placeholder)
- `totem.js`: Flash handler and latency update slot in after the existing `totem:phone-connected` handler
- `server.js`: New `phone:ping` event handler goes inside the `io.on('connection', ...)` block, alongside existing `phone:join` and `totem:ready` handlers

</code_context>

<specifics>
## Specific Ideas

- Latency display format: `⏱️ 42 ms` — this exact format is called out in PROJECT.md
- The Totem flash must use the existing `#1a1a1a` → `#39ff14` color pair (PROJECT.md: "dark gray to neon green for 200ms")
- "Complex animations" are explicitly out of scope (PROJECT.md) — the flash must be an instant CSS color swap, not a CSS transition/animation with easing

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-real-time-interaction*
*Context gathered: 2026-03-19*

# Phase 4: UI Redesign - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning
**Source:** PRD Express Path (docs/superpowers/specs/2026-03-19-totem-phone-ui-redesign-design.md)

<domain>
## Phase Boundary

Full visual overhaul of `totem.html` and `phone.html`. Both files become self-contained (all socket.io logic, WebGL, and UI code inlined). `totem.js` and `phone.js` are deleted. No server-side changes. No new npm dependencies. No build system.

</domain>

<decisions>
## Implementation Decisions

### Architecture
- Both HTML files are self-contained — no external JS files
- `totem.js` and `phone.js` are deleted after rewrite
- No new npm dependencies, no build system
- `server.js` is untouched

### Shared Visual Language (both files)
- Background: `#020202` (near-black)
- Fine grid: `rgba(255,255,255,0.022)` lines every `16px`
- Chromatic palette: `#ff003c` (red), `#00f0ff` (cyan), `#ff00cc` (magenta)
- Font: `'Courier New', monospace`
- Connection indicator: `#00ff87` pulsing dot

### Totem — DOM / Layering Structure
- `<canvas id="webgl-canvas">` — position:fixed, z-index:0, 100vw×100vh
- `<canvas id="dormant-canvas">` — position:fixed, z-index:1, 100vw×100vh, pointer-events:none
- `<div id="qr-screen">` — position:fixed, z-index:5, full overlay for State 1
- `<div id="overlay">` — position:fixed, z-index:10, pointer-events:none
  - `<div id="latency-display">` — center: translate(-50%,-50%) from top:50% left:50%
  - `<div id="corner-bl">` — bottom:14px left:16px
  - `<div id="corner-br">` — bottom:14px right:16px

### Totem — WebGL Canvas (always running)
- Single WebGL fragment shader program running at all times
- Idle mode (`u_wave = 0.0`): renders `bgA` only (grid lines on dark fill)
- Wave mode (`u_wave > 0`): full shader with chromatic displacement
- `bgA`: `#020202` fill + grid lines (`rgba(13,13,13,1)`, 1px, every 16px)
- `bgB`: Same grid + radial gradient `rgba(5,15,60,0.4) → transparent` over radius = `u_wave × viewport_diagonal`

### Totem — Fragment Shader (GLSL, exact spec)
1. `uv = gl_FragCoord.xy / u_res` — aspect-corrected: `uv.x *= u_res.x / u_res.y`
2. `dist = length(uv - u_origin)`
3. `organic = fBm(uv × 3.0, 5 octaves)` — breaks circular border
4. `noisyDist = dist + (organic - 0.5) × 0.15 × u_strength`
5. `inBand = smoothstep(u_wave - bandWidth, u_wave, noisyDist) × (1.0 - smoothstep(u_wave, u_wave + 0.02, noisyDist))` where `bandWidth = 0.12`
6. Radial direction `dir = normalize(uv - u_origin)`, perpendicular `perp = vec2(-dir.y, dir.x)`
7. UV displacement: `dispUV = uv + dir × inBand × u_strength × 0.03 + perp × noise × 0.01`
8. Sample R at `dispUV × 1.00`, G at `dispUV × 0.82`, B at `dispUV × 0.65`
9. Lateral flare: add `#ff00cc` magenta on `+perp` side, `#00ffee` cyan on `−perp` side
10. Rim boost: `+white × 0.8 × u_strength` where `rim = smoothstep(u_wave - 0.04, u_wave - 0.01, noisyDist)`
11. Background blend: `bgA` outside bubble (`noisyDist > u_wave`), `bgB` inside

### Totem — Wave Trigger
- `triggerWave(originX=0.5, originY=0.5)` called on `server:ping` event
- Sets `u_origin = [0.5, 0.5]`, records `waveStartTime = performance.now()`, sets `waveActive = true`
- Each frame: `u_wave = clamp((now - waveStartTime) / 2000.0 * 1.6, 0.0, 1.6)`, `u_strength = exp(-pow((u_wave - 0.35) / 0.2, 2.0))`
- State 3 (wave active): hide `#dormant-canvas` (`display:none`)
- State 3 exit (when `u_wave >= 1.6`): reset `u_wave = 0`, show `#dormant-canvas` again (`display:block`) — instant switch, no fade

### Totem — Dormant Canvas (Canvas 2D)
- Shown in State 2 (phone connected), hidden in State 1 and during State 3 (wave)
- Origin: canvas center `(W/2, H/2)` = UV `(0.5, 0.5)`
- Three organic blobs, `globalCompositeOperation: 'screen'`:
  - R (`#ff003c`): radius scale `1.00`, X-offset `+baseR × 0.35`
  - G/white (`#ffffff`): radius scale `0.82`, no X-offset
  - B (`#00f0ff`): radius scale `0.65`, X-offset `−baseR × 0.28`
- Perpendicular split: two additional blobs (`#ff00cc` magenta, `#00ffee` cyan) at half radius
- White rim: stroked organic path at radius `0.95×baseR`, `rgba(255,255,255,0.6)`, 1px, blur 1px
- Breathing: `baseR = 6 + 5 × (0.5 + 0.5 × sin(t × 0.8))` — range 6–11px, period ~8s
- Expanding ring halos: 3 rings, staggered 1s apart, scale `1→9`, opacity `0.7→0`, duration 3s each
- Cold blue interior: radial gradient `rgba(5,15,60,0.08→0.12)` → transparent, radius = `baseR × 2.5`

### Totem — State Machine
- **State 1 (no phone):** `#qr-screen` visible, `#dormant-canvas` `display:none`. WebGL runs `bgA` (idle).
- **Initial DOM:** `#webgl-canvas` visible; `#dormant-canvas` `display:none`; `#qr-screen` `display:flex`; `#latency-display` empty (no placeholder)
- **`server:init { roomId, phoneUrl }` handler:** `QRCode.toCanvas(qrCanvasEl, phoneUrl, { width: 200, margin: 2 })` (CDN: `https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js`); populate room ID and phone URL text; update `#corner-bl` to `ROOM · {roomId}`. Corner-bl: `ROOM · XXXX` — 7px monospace `#1e1e1e`. Corner-br: dim dot `#1a1a1a`, no glow, `WAITING` — 7px monospace
- **`totem:phone-connected` → State 2:** `#qr-screen.style.display = 'none'`; show `#dormant-canvas`, start Canvas 2D rAF loop; update `#corner-br` dot to `background:#00ff87; box-shadow:0 0 6px #00ff87`; text to `CONNECTED` + pulsing CSS animation
- **`phone:disconnected` → back to State 1:** Show `#qr-screen`; hide `#dormant-canvas`, cancel rAF; revert `#corner-br` to dim dot + `WAITING`
- **`server:ping` → State 3:** Call `triggerWave(0.5, 0.5)`; hide `#dormant-canvas`
- **`socket.on('connect')` → emit `totem:ready`**

### Totem — `server:latency` Handler
- Set `#latency-display` textContent to `latencyMs` (number only, no unit suffix)
- Chromatic flash: `latencyEl.classList.add('chroma-flash')` + `setTimeout(() => latencyEl.classList.remove('chroma-flash'), 500)`
- CSS: `.chroma-flash { text-shadow: 2px 0 #ff003c, -2px 0 #00f0ff; }`
- If fires again while flash active: clear existing timeout, remove and re-add class (restart from 0)

### Totem — Audio
- Web Audio API, lazy init: `AudioContext` created/resumed on first `server:ping`
- 880Hz sine wave, 80ms, exponential gain fade-out (`0.3 → 0.001`)
- Browser blocks audio: fail silently — no beep, no error

### Phone — roomId Source
- Read from URL query param: `new URLSearchParams(window.location.search).get('room')`
- If null: show `Error: No room ID in URL.` in `#ff4444` dim red text, terminal state (no socket init, no retry)

### Phone — Socket Connection
- `socket.on('connect', () => { socket.emit('phone:join', { roomId }); })` — fires on connect AND reconnect

### Phone — State Machine
- **State 1 (connecting):** `#000` + 16px grid. Single centered `CONNECTING…` — 9px monospace, `rgba(255,255,255,0.08)`, opacity blink `0.4↔1.0`, 2.4s ease-in-out infinite. Nothing else.
- **`server:joined` → State 2:** Hide CONNECTING text, show button
- **`disconnect` event:** Show CONNECTING text again, hide button
- **`server:error { message }` → terminal:** dim red text `color: #ff4444` centered: `Error: {message}`. No retry.

### Phone — State 2 (Connected) Layout
- Background: `#000` + grid + `radial-gradient(ellipse 80% 50% at 50% 50%, rgba(5,12,55,0.35) 0%, transparent 65%)`
- Button `#ping-btn`: `width: 80vw (max 360px)`, `height: 110px`, `border-radius: 22px`, `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.07)`, `backdrop-filter: blur(12px)`, `animation: chroma-pulse 3s ease-in-out infinite`
- `@keyframes chroma-pulse`: 0%/100%: `box-shadow: 0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.05), -6px 0 16px rgba(255,0,60,0.05), 6px 0 16px rgba(0,240,255,0.05)`; 50%: `box-shadow: 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08), -10px 0 24px rgba(255,0,60,0.12), 10px 0 24px rgba(0,240,255,0.12)`
- Button label: `SEND PING` — 12px monospace, `letter-spacing: 0.2em`, `color: rgba(255,255,255,0.65)`
- Below button: `ROOM · {roomId}` — 8px monospace `#1a1a1a`
- Bottom-right: `#00ff87` pulsing dot + `CONNECTED` — 7px monospace

### Phone — Press Sequence
- **On touchstart/click (if not disabled):**
  - Store `pingTimestamp = Date.now()`
  - `button.disabled = true`, `pointer-events: none`
  - `socket.emit('phone:ping', { roomId })`
- **Step 1 — Impact flash (0ms, 80ms):** `transform: scale(0.96)` + `background: rgba(255,255,255,0.10)`; reset at 80ms
- **Step 2 — Internal ripple (0ms, 400ms):** Inject `<div class="ripple">` inside `#ping-btn`; position at touch point (`event.clientX - buttonRect.left`, `event.clientY - buttonRect.top`); fallback `buttonWidth/2, buttonHeight/2`; size `max(buttonWidth, buttonHeight)` px diameter, offset by `-size/2`; `@keyframes: scale(0)→scale(4.5), opacity: 1→0, 400ms ease-out`; remove on `animationend`
- **Step 3 — Chromatic ghost (60ms offset, 300ms):** `text-shadow: 2px 0 rgba(255,0,60,0.85), -2px 0 rgba(0,240,255,0.85)` on label; `color: rgba(255,255,255,0.95)`; cleared at 360ms
- **In-flight state:** `opacity: 0.3`, non-interactive. No timeout — stays disabled until `server:pong`
- **On `disconnect` during in-flight:** Reset `pingTimestamp = null`, `disabled = false`, `opacity = 1`, `pointerEvents = auto` before hiding button

### Phone — `server:pong` Handler
- `const latencyMs = Date.now() - pingTimestamp`
- `socket.emit('phone:latency', { roomId, latencyMs })`
- `if (navigator.vibrate) navigator.vibrate(80)`
- Re-enable button: `disabled = false`, `opacity = '1'`, `pointerEvents = 'auto'`
- No visual flash on phone side on pong

### Files Changed
- `public/totem.html` — Full rewrite, self-contained
- `public/phone.html` — Full rewrite, self-contained
- `public/totem.js` — Deleted
- `public/phone.js` — Deleted

### Claude's Discretion
- Internal implementation details of the fBm noise function (sin/cos approximation approach is specified; exact coefficients are Claude's discretion)
- Exact CSS for the pulsing dot animation (behavior specified, CSS syntax is Claude's discretion)
- How to structure the rAF loop cancel (using a returned ID or a flag variable)
- Order of HTML elements within `<head>` and `<body>` sections

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Spec (source of truth)
- `docs/superpowers/specs/2026-03-19-totem-phone-ui-redesign-design.md` — Full UI redesign spec: DOM structure, shader code, state machines, socket event payloads

### Existing implementation (to understand current socket events and structure)
- `public/totem.html` — Current totem HTML (to be fully rewritten)
- `public/totem.js` — Current totem JS logic (to be inlined then deleted)
- `public/phone.html` — Current phone HTML (to be fully rewritten)
- `public/phone.js` — Current phone JS logic (to be inlined then deleted)
- `server.js` — Server unchanged; read to confirm all socket event names match spec

### Planning
- `.planning/ROADMAP.md` — Phase 4 goal and requirements
- `.planning/REQUIREMENTS.md` — UI-01 through UI-04 definitions

</canonical_refs>

<specifics>
## Specific Ideas

- QR code CDN: `https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js`
- Socket.io CDN (existing pattern from current HTML files — follow same version)
- WebGL shader uses `u_wave`, `u_strength`, `u_origin`, `u_res` uniforms
- `u_wave` range: `0.0` (idle) to `1.6` (wave end), computed over 2000ms
- `u_strength = exp(-pow((u_wave - 0.35) / 0.2, 2.0))` — Gaussian bell centered at wave=0.35
- `bandWidth = 0.12` in shader `inBand` computation
- Dormant blob breathing formula: `baseR = 6 + 5 × (0.5 + 0.5 × sin(t × 0.8))`
- Dormant halo: 3 rings, 1s stagger, 3s duration each, scale 1→9, opacity 0.7→0

</specifics>

<deferred>
## Deferred Ideas

None — spec covers full phase scope. All items in spec are in-scope for Phase 4.

</deferred>

---

*Phase: 04-ui-redesign*
*Context gathered: 2026-03-19 via PRD Express Path*

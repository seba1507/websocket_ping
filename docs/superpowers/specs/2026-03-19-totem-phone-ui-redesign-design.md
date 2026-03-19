# UI Redesign — Totem & Phone
**Date:** 2026-03-19
**Status:** Approved for implementation
**Scope:** Replace `totem.html` + `phone.html` (and absorb `totem.js` + `phone.js` inline)

---

## Overview

Full visual redesign of both views. The totem becomes a WebGL canvas experience with an organic ripple + chromatic aberration wave triggered by WebSocket pings. The phone becomes a dark glassmorphism interface that shares the same visual language. Both files become self-contained (socket logic inlined — `totem.js` and `phone.js` are deleted).

---

## Architecture Decision

**Self-contained HTML files.** All socket.io logic, WebGL, and UI code lives inline in each HTML file. `totem.js` and `phone.js` are removed. No new dependencies. No build system.

---

## Shared Visual Language

Both views share:
- Background: `#020202` (near-black)
- Fine grid: `rgba(255,255,255,0.022)` lines every `16px` — same as WebGL `bgA`
- Chromatic palette: `#ff003c` (red), `#00f0ff` (cyan), `#ff00cc` (magenta)
- Font: `'Courier New', monospace`
- Connection indicator: `#00ff87` pulsing dot

---

## Totem — `totem.html`

### DOM / Layering Structure

```
<body>
  <canvas id="webgl-canvas">   <!-- position:fixed, z-index:0, 100vw×100vh -->
  <canvas id="dormant-canvas"> <!-- position:fixed, z-index:1, 100vw×100vh, pointer-events:none -->
  <div id="qr-screen">         <!-- position:fixed, z-index:5, full overlay for State 1 -->
  <div id="overlay">           <!-- position:fixed, z-index:10, pointer-events:none -->
    <div id="latency-display"> <!-- center: translate(-50%,-50%) from top:50% left:50% -->
    <div id="corner-bl">       <!-- bottom:14px left:16px -->
    <div id="corner-br">       <!-- bottom:14px right:16px -->
```

**WebGL canvas** is initialized on page load (eager) but renders only the grid (`bgA`) until `triggerWave()` is called. It always runs.

**Dormant canvas** is hidden (`display:none`) in State 1 and shown in State 2.

**QR screen** (`#qr-screen`) is visible in State 1 and hidden (`display:none`) in State 2.

---

### Initial DOM State (on page load)

- `#webgl-canvas`: visible, runs bgA shader immediately
- `#dormant-canvas`: `display:none` (hidden)
- `#qr-screen`: `display:flex` (visible)
- `#latency-display`: empty string, no placeholder

---

### State 1: No phone connected (QR screen)

`#qr-screen` visible (`display:flex`). `#dormant-canvas` `display:none`. WebGL renders `bgA` grid underneath.

**On `server:init { roomId, phoneUrl }`:**
- Store `roomId` in a module-scoped variable
- Call `QRCode.toCanvas(qrCanvasEl, phoneUrl, { width: 200, margin: 2 })`
- Populate room ID text element with `roomId`
- Populate dim phone URL text element with `phoneUrl`
- Update `#corner-bl` to `ROOM · {roomId}`
- (qrcode.js CDN: `https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js`)

- Bottom-left (`#corner-bl`): `ROOM · XXXX` — 7px monospace `#1e1e1e`
- Bottom-right (`#corner-br`): dim dot (`#1a1a1a`, no glow) + `WAITING` — 7px monospace

**Transition trigger:** `totem:phone-connected` socket event:
1. `#qr-screen.style.display = 'none'`
2. `#dormant-canvas.style.display = 'block'`; start Canvas 2D animation loop (using `requestAnimationFrame`)
3. Update `#corner-br` dot: `background:#00ff87; box-shadow:0 0 6px #00ff87`; text to `CONNECTED`; add pulsing CSS animation

**Transition back:** `phone:disconnected` socket event:
1. `#qr-screen.style.display = 'flex'`
2. `#dormant-canvas.style.display = 'none'`; cancel animation loop
3. Revert `#corner-br` to dim dot (`background:#1a1a1a; box-shadow:none`) + `WAITING`

---

### `totem:ready` Emit

Emitted on socket `connect` event (fires on page load and on reconnect):
```js
socket.on('connect', () => { socket.emit('totem:ready'); });
```

---

### State 2: Phone connected — Dormant Wave

`#dormant-canvas` visible, runs Canvas 2D animation loop.

**Background layer (WebGL, `#webgl-canvas`):**
- Renders `bgA` continuously: `#020202` fill + fine grid lines (`#0d0d0d`, 16px)
- No wave active

**Dormant wave (Canvas 2D, `#dormant-canvas`):**
- Origin: canvas center `(W/2, H/2)` = UV `(0.5, 0.5)` — same as wave origin
- Uses fBm noise (5 octaves of `sin/cos` approximation, no WebGL needed)
- Three organic blobs, `globalCompositeOperation: 'screen'`:
  - R (`#ff003c`): radius scale `1.00`, X-offset `+baseR × 0.35`
  - G/white (`#ffffff`): radius scale `0.82`, no X-offset
  - B (`#00f0ff`): radius scale `0.65`, X-offset `−baseR × 0.28`
- Perpendicular split: two additional blobs (`#ff00cc` magenta, `#00ffee` cyan) at half radius
- White rim: stroked organic path at radius `0.95×baseR`, `rgba(255,255,255,0.6)`, 1px, blur 1px
- Breathing: `baseR = 6 + 5 × (0.5 + 0.5 × sin(t × 0.8))` — range 6–11px, period ~8s
- Expanding ring halos: 3 rings (CSS-style `border-radius:50%` arcs), staggered 1s apart, scale `1→9`, opacity `0.7→0`, duration 3s each

**Cold blue interior:**
- Radial gradient centered at canvas center: `rgba(5,15,60,0.08→0.12)` → transparent, radius = `baseR × 2.5`

**Overlay (`#overlay`, z-index 10):**
- `#latency-display`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%)` — empty initially, no placeholder
- `#corner-bl`: `ROOM · XXXX` — 7px `#1e1e1e` monospace
- `#corner-br`: `#00ff87` pulsing dot + `CONNECTED` — 7px monospace

---

### State 3: Ping received — WebGL Wave

**Trigger:** `server:ping` socket event.

**On enter State 3:** Hide `#dormant-canvas` (`display:none`) so WebGL wave is unobstructed.

**On exit State 3** (when `u_wave >= 1.6`, i.e., ~2s after trigger): Reset `u_wave = 0`, show `#dormant-canvas` again (`display:block`). No fade — instant switch back to State 2 dormant animation.

**`triggerWave(originX, originY)`** — `originX=0.5, originY=0.5` (always screen center):

The totem uses **a single WebGL fragment shader program** running at all times. The shader has two modes controlled by uniforms — no shader swap needed:

- **Idle mode** (`u_wave = 0.0`): shader renders `bgA` only (grid lines on dark fill). All wave/displacement code evaluates to zero contribution because `u_strength = 0`.
- **Wave mode** (`u_wave > 0`): full shader runs, blending `bgA`/`bgB` and chromatic displacement.

`triggerWave(0.5, 0.5)`:
1. Sets `u_origin = [0.5, 0.5]` (the `vec2` uniform used as wave origin in the shader)
2. Records `waveStartTime = performance.now()`
3. Sets a `waveActive = true` flag; the WebGL render loop (already running) now computes:
   - `u_wave = clamp((now - waveStartTime) / 2000.0 * 1.6, 0.0, 1.6)`
   - `u_strength = exp(-pow((u_wave - 0.35) / 0.2, 2.0))`
4. These uniforms are uploaded each frame via `gl.uniform1f()`

**Fragment shader (GLSL) — per pixel:**
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

**`bgA`:** `#020202` fill + grid lines (`rgba(13,13,13,1)`, 1px, every 16px)
**`bgB`:** Same grid + radial gradient: `rgba(5,15,60,0.4) → transparent` over radius = `u_wave × viewport_diagonal`

**Audio (concurrent with triggerWave):**
- Web Audio API, lazy init: `AudioContext` created and/or resumed on first `server:ping`
- If browser blocks audio (no prior user gesture on totem page): fail silently — no beep, no error
- 880Hz sine wave, 80ms, exponential gain fade-out (`0.3 → 0.001`)

---

### `server:latency` — Update Display

1. Set `#latency-display` textContent to `latencyMs` (number only, no unit suffix)
2. Apply chromatic flash via JS class toggle + `setTimeout` (not CSS transition — must be one-shot):
   ```js
   latencyEl.classList.add('chroma-flash');
   setTimeout(() => latencyEl.classList.remove('chroma-flash'), 500);
   ```
   ```css
   .chroma-flash {
     text-shadow: 2px 0 #ff003c, -2px 0 #00f0ff;
   }
   ```
3. If `server:latency` fires again while flash is active: clear the existing timeout, remove and re-add the class (restart flash from 0)

---

### Totem Socket Disconnect

If the totem's own socket disconnects from the server (network drop), no special handling — socket.io's built-in reconnection handles this silently. No visual state change required.

---

## Phone — `phone.html`

### roomId Source

Read from URL query param on page load:
```js
const roomId = new URLSearchParams(window.location.search).get('room');
```
If `roomId` is null: show `Error: No room ID in URL.` in dim red text (`#ff4444`), do not attempt to connect. Terminal state (no retry).

---

### `phone:join` Emit

Emitted inside the `connect` socket event, immediately after connection (and on reconnect):
```js
socket.on('connect', () => { socket.emit('phone:join', { roomId }); });
```
`roomId` is read from URL before socket is initialized. If `roomId` is null, socket is never initialized.

---

### State 1: Connecting

- Background: `#000` + same `16px` grid (`rgba(255,255,255,0.022)`)
- Single centered element: `CONNECTING…` — 9px monospace, `rgba(255,255,255,0.08)`, opacity blink animation (`0.4↔1.0`, 2.4s ease-in-out infinite)
- Nothing else

**Transition:** `server:joined` event → hide CONNECTING text, show button (State 2)
**Reconnect:** `disconnect` event → show CONNECTING text again, hide button

---

### State 2: Connected

**Background:** `#000` + grid + `radial-gradient(ellipse 80% 50% at 50% 50%, rgba(5,12,55,0.35) 0%, transparent 65%)`

**Button (`#ping-btn`):**
```
width: 80vw (max 360px)
height: 110px
border-radius: 22px
background: rgba(255,255,255,0.04)
border: 1px solid rgba(255,255,255,0.07)
backdrop-filter: blur(12px)
animation: chroma-pulse 3s ease-in-out infinite
```

```css
@keyframes chroma-pulse {
  0%,100% {
    box-shadow: 0 0 0 1px rgba(255,255,255,0.02),
                inset 0 1px 0 rgba(255,255,255,0.05),
                -6px 0 16px rgba(255,0,60,0.05),
                6px 0 16px rgba(0,240,255,0.05);
  }
  50% {
    box-shadow: 0 0 0 1px rgba(255,255,255,0.04),
                inset 0 1px 0 rgba(255,255,255,0.08),
                -10px 0 24px rgba(255,0,60,0.12),
                10px 0 24px rgba(0,240,255,0.12);
  }
}
```

**Button label:** `SEND PING` — 12px monospace, `letter-spacing: 0.2em`, `color: rgba(255,255,255,0.65)`

**Below button:** `ROOM · {roomId}` — 8px monospace `#1a1a1a`

**Bottom-right:** `#00ff87` pulsing dot + `CONNECTED` — 7px monospace

---

### Press Sequence

**On touchstart / click (if not disabled):**

**Immediately:**
- Store `pingTimestamp = Date.now()`
- Set button `disabled = true`, `pointer-events: none`
- Emit `socket.emit('phone:ping', { roomId })`

**Step 1 — Impact flash (0ms, 80ms duration):**
- `transform: scale(0.96)` + `background: rgba(255,255,255,0.10)`
- Reset at 80ms

**Step 2 — Internal ripple (0ms, 400ms duration):**
- Inject `<div class="ripple">` appended inside `#ping-btn`
- Position: `position:absolute`, centered on touch/click point relative to button using `event.clientX - buttonRect.left` and `event.clientY - buttonRect.top`
- Fallback for keyboard/non-pointer: use `buttonWidth/2, buttonHeight/2` (button center)
- Size: `max(buttonWidth, buttonHeight)` px diameter; `margin-left` and `margin-top` offset by `-size/2` to center on touch point
- `@keyframes`: `transform: scale(0) → scale(4.5)`, `opacity: 1 → 0`, 400ms ease-out
- Remove element from DOM after animation ends (`animationend` event)

**On `disconnect` during in-flight:** Clear in-flight state — reset `pingTimestamp = null`, `disabled = false`, `opacity = 1`, `pointerEvents = auto` — before hiding button (the disconnect handler shows CONNECTING text and hides button, so the button will be fully re-enabled when shown again on reconnect).

**Step 3 — Chromatic ghost (60ms offset, 300ms duration):**
- `text-shadow: 2px 0 rgba(255,0,60,0.85), -2px 0 rgba(0,240,255,0.85)` on label
- `color: rgba(255,255,255,0.95)` during flash
- Cleared at 60ms + 300ms = 360ms

**In-flight state:** `opacity: 0.3`, non-interactive. No timeout — button stays disabled until `server:pong` arrives.

---

### `server:pong` Handler

```js
const latencyMs = Date.now() - pingTimestamp;
socket.emit('phone:latency', { roomId, latencyMs }); // payload: { roomId: string, latencyMs: number }
if (navigator.vibrate) navigator.vibrate(80);
pingBtn.disabled = false;
pingBtn.style.opacity = '1';
pingBtn.style.pointerEvents = 'auto';
```

No visual flash on the phone side on pong (removed from original design — totem handles the visual).

---

### `server:error` Handler

Show dim red text (`color: #ff4444`) centered: `Error: {message}`. Terminal state — user must reload. No retry logic.

The only server:error condition from the existing `server.js` (unchanged) is: room not found when `phone:join` is emitted with an unknown `roomId`.

---

## Socket Event Payloads

| Emit | Payload |
|------|---------|
| `totem:ready` | _(none)_ |
| `phone:join` | `{ roomId: string }` |
| `phone:ping` | `{ roomId: string }` |
| `phone:latency` | `{ roomId: string, latencyMs: number }` |

| Receive | Payload |
|---------|---------|
| `server:init` | `{ roomId: string, phoneUrl: string }` |
| `totem:phone-connected` | _(none)_ |
| `phone:disconnected` | _(none)_ |
| `server:ping` | _(none)_ |
| `server:latency` | `{ latencyMs: number }` |
| `server:joined` | `{ roomId: string }` |
| `server:pong` | _(none)_ |
| `server:error` | `{ message: string }` |

---

## Files Changed

| File | Action |
|------|--------|
| `public/totem.html` | Full rewrite — self-contained |
| `public/phone.html` | Full rewrite — self-contained |
| `public/totem.js` | Deleted |
| `public/phone.js` | Deleted |

No server-side changes (`server.js` untouched). No new npm dependencies.

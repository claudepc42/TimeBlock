# TimeBlock

One city block, six eras — **1945 · 1965 · 1985 · 2005 · 2025 · 2055**.

A 3D scene of a single city block that transforms in front of you as you drag
the timeline slider. Buildings rise and fall, storefronts re-sign themselves,
cars trade tailfins for hover skirts, pedestrians change wardrobes, and the
light, sky and soundscape shift with every decade.

## Run it

Double-click **`index.html`** — everything is local (Three.js is bundled in
`lib/`), no server or internet needed. Click **ENTER THE TIMESTREAM**.

## Controls

| Input | Action |
| --- | --- |
| Drag mouse | Look around |
| `W A S D` / arrows | Walk |
| `E` / `Q` (or Space / Ctrl) | Rise / sink |
| `Shift` | Sprint |
| Mouse wheel | Dolly forward/back |
| `1`–`6` | Jump straight to an era |
| `C` / 🎥 button | Cinematic auto-orbit |
| `M` / 🔊 button | Mute |
| Timeline slider (top) | Drag or click a year |

## What to look for

- **The Palace theater** — six different marquees, from *Victory at Dawn* (plus
  newsreel) to a boarded-up "FOR LEASE" 2005, to the 2055 *SENSORIUM*.
- **The corner of Keller's** — grocery → superette → KWIK-STOP → glass condo.
- **The Starlite Diner** — born 1965, dead letter in its neon by 1985,
  a parking lot by 2005.
- **The gas station** — 21¢ a gallon in 1945, induction hover-pads in 2055.
- **St. Ambrose church** — never changes. Its sign does.
- **Hotel Regent** — watch the blade sign: HOTEL REGENT → HOT L REGENT.
- Trolley + track in 1945, delivery robot in 2025, drones and sky-lanes in 2055.
- Trees grow older along with the block.

## Dev/test URL params

`index.html?auto=1&era=1985` — skip the start screen, load straight into an era.
Add `&goto=2055&delay=5000` to auto-trigger a transition (used for testing).

## Tech

Plain Three.js (r147, bundled), no build step, no external assets — every
texture is painted on canvas at load, every sound is synthesized with WebAudio.
Files: `js/textures.js` (facades/signs/billboards), `js/buildings.js` (15
building generators), `js/props.js` (street furniture), `js/vehicles.js`,
`js/pedestrians.js`, `js/city.js` (lot timelines + transition engine),
`js/audio.js` (procedural ambience), `js/main.js` (renderer/controls/UI).

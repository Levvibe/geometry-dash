# Neon Vector Rush

Original rhythm-inspired 2D auto-runner built as a static front-end project for GitHub Pages.

## Controls
- **Space / Tap / Mouse Down**: primary action (jump/thrust/pulse direction)
- **Esc**: pause/resume
- **R**: restart attempt
- **F1**: toggle QA overlay (FPS, mode, speed, gravity, progress)

## Run locally
```bash
python3 -m http.server 8080
# or
npx http-server .
```
Open `http://localhost:8080`.

## GitHub Pages deployment
1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Set source to **Deploy from a branch**.
4. Select branch `main` (or your deploy branch) and folder `/ (root)`.
5. Save and wait for Pages build.

## Offline behavior
All files are local/static; once loaded, the game can run without external CDNs.

## Level JSON schema
Levels live in `levels/level1.json` etc:
```json
{
  "meta": { "name": "...", "author": "...", "songBpm": 140, "length": 5600 },
  "startX": 100,
  "endX": 5600,
  "objects": [
    { "type": "platform", "x": 500, "y": 700, "w": 1200, "h": 40 },
    { "type": "hazard_spike", "x": 980, "y": 660, "w": 30, "h": 40 },
    { "type": "portal_mode_glider", "x": 3450, "y": 600, "w": 40, "h": 120 },
    { "type": "ring_typeA", "x": 1260, "y": 560, "radius": 20 }
  ]
}
```

## Known limitations
- Replace `vendor/phaser.min.js` with official Phaser 3 bundle before release (environment here blocked external package download).
- Placeholder generated tone synth is used for SFX/music loop.

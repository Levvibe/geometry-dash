# Neon Vector Rush

Neon Vector Rush is an original rhythm-inspired 2D auto-runner delivered as a static front-end game for GitHub Pages.

## Controls
- **Space / Tap / Mouse Down**: action (jump, glide thrust, pulse up-slope)
- **Esc**: pause/resume
- **R**: restart attempt
- **F1**: QA overlay (FPS, mode, speed, gravity, progress)

## Run locally
```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Deploy to GitHub Pages
1. Push repository to GitHub.
2. Open **Settings → Pages**.
3. Select **Deploy from branch**.
4. Choose your branch (for example `main`) and folder `/ (root)`.
5. Save and wait for the deployment URL.

## Save data
LocalStorage keys used:
- `bestPercent_level1`, `bestPercent_level2`, `bestPercent_level3`
- `bestAttempts_level1`, `bestAttempts_level2`, `bestAttempts_level3`
- `settings_screenShake`, `settings_particles`, `settings_showHitboxes`
- `settings_musicVolume`, `settings_sfxVolume`

## Level customization (JSON)
Levels are in `levels/level1.json`, `levels/level2.json`, `levels/level3.json`.

Schema (simplified):
```json
{
  "meta": { "name": "Level Name", "author": "Studio", "songBpm": 150, "length": 5600 },
  "startX": 100,
  "endX": 5600,
  "objects": [
    { "type": "platform", "x": 500, "y": 700, "w": 1200, "h": 40 },
    { "type": "hazard_spike", "x": 980, "y": 660, "w": 30, "h": 40 },
    { "type": "portal_mode_glider", "x": 3450, "y": 600, "w": 40, "h": 120 },
    { "type": "portal_speed", "x": 3960, "y": 600, "w": 40, "h": 120, "speedTier": "fast" },
    { "type": "ring_typeA", "x": 1260, "y": 560, "radius": 20 },
    { "type": "jump_pad", "x": 2250, "y": 675, "w": 48, "h": 18 }
  ]
}
```

## Known limitations
- Audio starts only after first user input (browser autoplay policy).
- The QA overlay is diagnostic and intentionally lightweight.

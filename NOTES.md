# Notes

## Mission
A fun Android shoot-'em-up like Sky Force: you fly up the screen, auto-fire, dodge, collect coins, upgrade your ship between levels, fight a boss.

## Decisions so far
- Prototype in the browser: JavaScript + Phaser 3 (changed from Godot on 2026-11-17; may move to Godot later). Platform: Android only.
- Code on GitHub. Plan: GitHub Pages gives a link to play on the phone; later Capacitor wraps it into an Android app (UNVERIFIED, not set up yet).
- Style: maybe pixel art (undecided). Hero: maybe a cat, maybe a kite (undecided).
- Success = fun.
- Library: lib/phaser.min.js = Phaser 3.80.1, about 1.18 MB, downloaded from https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js on 2026-11-17 with Omri's OK.

## Prototype goal (first milestone)
Ship follows the finger and auto-fires. 3 enemy types, one wave, one boss, score. Then Omri plays it and we tune the feel.

## Log
- 2026-11-17: Added manifest.webmanifest + icon.svg + meta tags so the game can be added to an Android home screen (full-screen). UNVERIFIED: whether Chrome on the phone shows the icon / opens full-screen; check after the GitHub Pages link is live. Plan: public repo flight-and-fight on GitHub, Pages from main root (not set up yet, needs Omri's "push").
- 2026-11-17: Project created. Agents added: flight-coder, flight-reviewer, flight-designer. Nothing built yet. Later same day: switched plan from Godot to browser + Phaser.
- 2026-11-17 (branch proto-ship-move): First playable slice. Files: index.html, src/config.js (all tuning), src/main.js, src/sprites.js (pixel art in code, hero in drawHero/HERO_ART), src/scenes/PlayScene.js, .claude/launch.json (python -m http.server 8123). Ship follows finger with offset, auto-fires twin bullets (pooled), 3 enemy types on a looping wave timeline, coins, 3 hearts, game over + tap to restart. No boss, no sound.
  - UNVERIFIED: syntax checked with node only; run in the built-in browser on 2026-11-17 with no console errors and the ship, fire and kills work; still never run on a phone. Touch feel, follow smoothness, finger offset, difficulty, speed on the phone.
  - Check on phone: does the ship feel glued to the finger (tune ship.followSmoothing, fingerOffsetY)? Is firing/hit flash readable? Too hard or too easy (waves, enemy hp)?
  - Follow-up fixes (same day): shooter timings, hit shake and restart delay moved to src/config.js; shooter sway now starts from where it stopped (no sideways jump). Check on phone: shooter hover looks smooth.
  - 2026-11-17: Crash rule (Omri's answer): hitting an enemy body costs a heart; while blinking nothing happens. After a real hit the enemy also dies, with no score and no coin (config ship.ramKillsEnemy, false = enemy survives). Changed src/scenes/PlayScene.js, src/config.js. UNVERIFIED: feel on phone.
- 2026-11-17 (branch proto-ship-move): Phone feedback round. (1) ship.fingerOffsetY 70 -> 28 (ship just above the thumb tip; still clamped by ship.margin). (2) Coins are now a 7x7 violet diamond gem with light highlight and dark outline (colours V/L/D in PAL in src/sprites.js, with a colour rule comment); enemy bullets are now red/orange (no yellow centre); player bullets unchanged. No purple on any bullet. (3) Every enemy +1 hp: grunt 2->3, zigzag 3->4, shooter 6->7 (src/config.js). UNVERIFIED: all feel on the phone. Check on phone: finger offset (not hidden by thumb, not too close?), coin vs bullet readability, difficulty.
- 2026-11-17 (branch proto-ship-move): Version shown small and dim under the score (top-left). It is the string `version` in src/config.js; bump it with each push so Omri can see on the phone he has the latest build. Never blocks touches. UNVERIFIED on phone: is it readable but not distracting? Does it still show on the game over screen (HUD kept)?
- 2026-11-17 (branch proto-ship-move, v0.1.2): (1) Zoom: `game.zoom` (1.5) in src/config.js; game canvas is now 240x427 (baseWidth/zoom), Scale.FIT stretches it, so everything looks 1.5x bigger. Sprites keep their art size; speeds, offsets, HUD sizes were divided by the zoom with `z()` in config.js (fingerOffsetY 28 -> 19). Change only `ZOOM` to try other sizes. (2) Bullets recoloured: player = thin cyan-white bolt, enemy = pink orb with dark outline; no yellow/gold in any sprite (hero flame now red/orange); coins stay violet. Colour rule comment in src/sprites.js updated. Version text is a bit bigger (11 px equivalent). UNVERIFIED: how it feels on the phone. Check: big enough or too big? Can you tell bullets from coins? Is the version readable?
- 2026-11-17 (branch proto-ship-move, v0.1.3): Phone feedback. (1) Controls are now relative drag: the ship moves by the same amount as the finger; touching elsewhere does not move it; lifting stops it; one finger only; mouse needs the button held. Setting ship.dragSensitivity (1.0). Removed fingerOffsetY, followSmoothing, maxSpeed (unused). (2) bullet.fireRateMs 130 -> 170. Changed src/scenes/PlayScene.js, src/config.js. UNVERIFIED on phone. Check: does drag feel natural, is fire rate better, does the ship ever jump (e.g. second finger, finger lifting)?

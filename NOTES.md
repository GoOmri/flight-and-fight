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
- 2026-11-17 (branch proto-ship-move, v0.1.4): Phone feedback. (1) Player shots about half size: art 3x7 -> 2x5 (PBULLET in src/sprites.js), twinOffset 6 -> 5. (2) Enemy shots all red (outline #7a0a0a, body #ff2a2a, core #ff7a7a); colour rule comment updated. (3) Ship weight: finger still sets the target 1:1, ship eases toward it (ship.followRate 20 = about 50 ms lag, lower = heavier, no overshoot, snaps exactly on target) plus a small tilt up to 8 deg (ship.bankDeg/bankSpeed/bankEase). Changed src/scenes/PlayScene.js (moveShip), src/config.js, src/sprites.js. UNVERIFIED in browser/phone (syntax checked only). Check on phone: shot size ok (not too tiny)? red shots easy to see? weight feel: heavier or lighter? tilt too much?
- 2026-11-17 (branch proto-ship-move, v0.2.0): Stage 1 built from DESIGN.md. Files: src/waves.js (all 10 waves as data, 122 enemies, 3 crates), src/waves-runner.js (one generic path follower + wave scheduler, mirror support), src/config.js (old looping wave list removed; new ship.hitRadius, coin.pickupRadius, enemyBullet.hitSize/speed, crate, stage), src/sprites.js (enemies recoloured, crate sprite, colour-rule comment), src/scenes/PlayScene.js.
  - What it does: first wave 1.5 s after start; waves run by their start rules (wait for clear, or N s after the last spawn so they overlap); enemies cannot be hit or hurt until their centre is on screen; shooters fire only while stopped (slow red shots, straight down or aimed); pools: enemies 40, coins 40. After wave 10 is gone (plus 1.5 s so you can still grab coins) a STAGE CLEAR screen shows score, KILLS a/b, COINS (value, 5 each) and HITS, then a tap restarts. Game over works as before.
  - Crates (waves 3, 6, calm before 10): wooden box, shoot it open (hp 6/6/10), no damage on touch, coins 6/6/10 fall out. Not enemies (no kill count); their coins count for the coins counter.
  - Counters kept in the scene: enemiesSpawned, enemiesKilled (ramming is not a kill), coinsSpawned, coinsCollected, hitsTaken (crashing counts as a hit). Only the result screen shows them.
  - Hitboxes: ship is hit only in a tiny 6x6 square at its centre (ship.hitRadius 3); coins grab from 10 px (coin.pickupRadius, replaces the 40 px magnet from DESIGN); enemy shot hurts only in its core (3 art px).
  - Enemy colours: steel-grey grunt with green canopy, olive/green zigzag, dark brown shooter with lime gun. Red = enemy shots, violet = coins, cyan-white = player shots.
  - Debug (add to the web address): ?wave=N starts at wave N (1-10); ?god=1 = hearts never drop (hits are still counted). Example: index.html?wave=10&god=1
  - Omri's decisions: crate coins count for "all coins"; crates are not enemies; 70% kills is an easy medal so the next stage can be unlocked; "no hit" includes crashing; stages can be replayed for all medals; hearts and weapon upgrades will drop from marked enemies later; boss and backgrounds come later.
  - Tested here: node --check on all files; node run of the wave data (every path valid, 122 enemies, 3 crates, scheduler finishes). NOT run in a browser or on a phone.
  - Check on phone: is the tiny ship hitbox fair/readable? Are the waves too hard or too easy for the base gun? Do the lanes feel fair? Can you tell the crate (brown) from coins (violet)? Enemies readable on the sky? Result screen text size.
- 2026-11-17 v0.2.1 review fixes: crate coins burst small (coinSpread 4), slow down sideways in 0.4 s and stay inside the screen edges; STAGE CLEAR waits until no enemy, crate or coin is left; enemy shot speed comes only from config enemyBullet.speed (waves.js FIRE no longer sets 100); crate pool size now in config (crate.poolSize); version 0.2.1. Unverified: not run in a browser; check on phone that crate coins drop close and are easy to catch.
- 2026-11-17 (branch proto-ship-move, v0.3.0): Weapon upgrades, hearts, HUD, medals, game feel. Phone feedback: hitbox OK, waves hard (upgrades fix it), crates too big.
  - Crates: art 11x11 -> 7x7 art px (about 64% size, hitbox follows the art). Size lives in CRATE in src/sprites.js.
  - Weapon levels 0..10: table `weaponLevels` in src/config.js ({fireRateMs, pattern, damage}; a shot may have its own dmg). Start at 0, each green pickup +1, hits never remove them. Roughly on ONE target: L0 12 dmg/s, L4 26, L8 40, L10 41 (about 3.4x); the wide shots add coverage on groups (nominal 97/s). Bullet pool 40 -> 90.
  - Carriers (data flag `drop` on a group in src/waves.js; applies to the LAST enemy of that group; they glow with a pulsing outline): weapon (green) = W1 the 2nd (left) grunt column, W2 2nd diagonal group, W3 right zigzag column, W4 centre grunt column, W5 horseshoe grunts, W6 the right shooter (x 215), W7 the zigzag line, W8 mirrored loop group, W9 the fast diagonal swarm, W10 the right wall column (x 195). Heart (pink-white glow) = W6 the left shooter (x 25) and W9 the left shooter (x 70). Pickups: green round badge with white arrow (falls a bit faster than a coin), heart with white outline (falls slowly; at full hearts gives 50 score). Not coins, not enemies.
  - HUD (new file src/hud.js): left = 4 medals + version; centre = score + 10 weapon bars (green); right = hearts + 10 wave pips (hollow coming, blinking current, solid done, notch = an enemy of that wave escaped or crashed, 10th is a diamond). Layout numbers in config `hud`.
  - Medals (src/medals.js): kill70 (half skull), killAll (skull), allCoins (gem), noHit (shield). Pending = dim outline, earned = colour, failed = grey with cross. A crate that falls off unopened also fails allCoins; crashing into an enemy fails killAll (it was not killed). noHit shows as pending until hit. Result screen shows the 4 big medals; best result saved in localStorage 'ff_medals_stage1' (merged, try/catch everywhere); a small NEW under a medal earned for the first time. Debug runs (?wave or ?god) do NOT save.
  - Game feel (config `feel`): 60 ms hit-stop when hit (physics world paused + update skipped, reset on restart), bigger explosion + small shake for shooters and crates, coin sparkle + score pop, muzzle flash (two white pixels, 45 ms), green flash and sparks at an upgrade. No sound.
  - Debug: ?wave=N starts with weapon level N-1 (max 10). ?god=1 still works.
  - Tested here: node --check on all files; node run of config/waves data (weapon table maths, carrier list). NOT run in a browser or on a phone.
  - Check on phone: weapon feel at each level (does every upgrade feel different and good? L10 too strong or fine?), is the stage fair with upgrades (maybe too easy at the end), are the green carriers noticeable, weapon badge vs coin vs enemy shots readable, HUD readable at 240 px wide (score vs pips not touching, medal icons clear), hit-stop 60 ms feel, muzzle flash visible, performance with 50+ bullets.
- 2026-11-17 (v0.3.1): (1) Blurry look fixed: canvas CSS image-rendering: pixelated in index.html (the browser was smoothing the small 240x427 canvas when stretching it) + roundPixels in main.js. UNVERIFIED on phone: some stretch factors are not whole numbers, so pixels can look slightly uneven in size but should be sharp. (2) Weapon upgrades are now ONLY fire rate and damage (Omri): same twin shot at every level; level 10 is about 2.2x the damage per second of level 0 (config WEAPON: fireRateStep 6 ms, damageStep 0.04 per level). Fans/spread/lasers are removed; they come later as bought power-ups or hangar upgrades. Reviewer leftovers still open: pickup pool sizes and some HUD positions not in config; score pop briefly covers the top of the upgrade bars.
- 2026-11-17 (v0.3.2): Wave indicator (10 dots under the hearts) hidden at Omri's request via config hud.showWaveIndicator = false (code kept, set true to bring it back).
- 2026-11-17 (branch proto-ship-move, v0.3.3): Phone feedback. (1) Coins are now round GOLD coins (7x7, gold #ffc928, shine #fff2a0, rim #b36b00, outline #5a3200); same for the 'all coins' medal icon and the pickup sparkle. Gold is for coins only; violet is unused now. Explosion sparks are now white / light grey / red-orange (no yellow). Result-screen SCORE text is white (was yellow). Colour rule comment in src/sprites.js updated. (2) Version text bigger: 10 px, white 90%, 3 px dark outline, resolution 3 (config hud.versionSize/versionAlpha/versionStroke/versionGap). (3) Cleanup: pickup pool sizes in config pickup.weaponPoolSize/heartPoolSize; HUD numbers in config hud (versionGap, rowOffset 22, heartStep, heartY); score text now pops from its middle so it no longer covers the weapon bars (bars moved 4 px lower). Version 0.3.3. UNVERIFIED (syntax checked only, no browser): check on phone that coins read as gold and are not confused with shots, version text readable and not clipped, nothing overlaps at the top.
- 2026-11-17 (branch proto-ship-move, v0.4.0): THEME STEP 1, art only (no gameplay change). Cute WITCH theme. Re-skinned in src/sprites.js (same sizes, keys and hitboxes): hero = witch on a broom (violet hat with lighter band, pink/violet sparkles at the broom tail instead of a flame); grunt = BAT, zigzag = GHOST, shooter = IMP (still the biggest); weapon-upgrade badge = green POTION bottle; crate = wooden TREASURE CHEST with grey steel bands. Unchanged: player shots, enemy red orbs, coins, hearts, carrier glows, medals, HUD, sky, game name/title. Colour-rule comment at the top of sprites.js updated (violet now free). Version 0.4.0 in src/config.js.
  - Omri's decisions to remember: tone is CUTE (storybook Halloween); reuse assets for enemies/backgrounds, do not build lots of variety; the cat ring is red only at the very start, then dark green, then light green; leaving the ring resets the timer, with a short mercy window if the witch returns quickly; cat zones must be calmer; medal gates to be decided later; no extra ingredients for now (coins only); spells are automatic (no button); the 'no hit' medal moves to hard mode and 'save all cats' becomes a normal medal; game title still undecided.
  - UNVERIFIED: only node --check run; sprites NOT looked at in a browser or on a phone. Pixel art is hand-typed, may need touch-ups.
  - Check on phone: does the witch read as a witch at 33 px? Do bat, ghost, imp read clearly on the light blue sky and look different from each other? Is the ghost never confused with a white player bolt? Does the potion still read as green weapon upgrade, and the chest not as a coin? Is the tail sparkle visible, and does the muzzle flash still sit at the hat tip?
- 2026-11-17 (branch v0500-feel-witch, v0.5.0): Bigger witch + game feel pass (no sound, no balance change).
  - Witch: new art in src/sprites.js (HERO_ART, 18x22 art px): plum hat with light band and white buckle, hair, face with eyes/smile/blush, magenta-violet cloak with clasp, small hand on the broom, broom bar with straw bristles, pink/violet sparkles. Drawn at ship.spriteScale 2 (36x44 px, about 15% of the screen width; 3 would be 22%). Hitbox is still ship.hitRadius 3 (tiny, around her face). Hat colour changed so she is not like the indigo bat. New config: ship.spriteScale, shotY, muzzleY, margin 20 (was 18).
  - Feel (all in config.feel, each has an off value): broom sparkle trail (more sparks when moving), 1 px recoil squash per volley, enemy knock-back/shake on hit, cyan-white impact sparks, death pops in the creature colour + ring (bigger for imp and chest), floating "+10" / "+5" text, coin magnet (radius 34), white-pink screen flash when hit, lost heart pops and shakes in the HUD, rings on potion/heart pickup, enemy shots swell gently, small white ring at an enemy when it fires, end screen fades in, clouds faster when flying up. Spark pool 90 -> 140; separate pools for trail (40) and rings (16); 10 reused text objects.
  - UNVERIFIED: only node --check; NOT run in a browser or on a phone. The enemy-shot swell and the recoil squash change the scale a little, so those hitboxes move by about 2 to 8 percent (tiny).
  - Check on phone: does the witch read well and look cute at 36 px (try spriteScale 3 if too small)? Hitbox still feels tiny and fair? Shots come from the hat? Trail not too busy? Impact sparks and rings not hiding enemy shots? Coin magnet too strong or weak? Performance at ?wave=10&god=1. White-pink hit flash: too strong?
  - Review fixes (same entry): enemy shots now draw at depth 35 (config enemyBullet.depth), above all effects and below the HUD. The hit flash is now our own reused rectangle (feel.hitFlashStrength 0.3, flashDepth 25, below the shots) instead of the camera flash. Hard-coded feel numbers moved to config.feel (pool sizes, ring depth, trail spread/carry, impact sparks, text edge/offset, fire flash, cloud ease). Recoil uses the real texture height. Clouds stop boosting at game over / stage clear. Still UNVERIFIED in a browser: check the flash is soft and the red shots stay visible on top of everything.

## 2026-11-18 v0.5.1: black screen fix
- v0.5.0 showed a black screen: a comma in src/config.js (enemyBullet line) sat inside a comment, so the file did not load. Fixed.
- Lesson: `node --check` did NOT catch it (ES modules). Check with the new-Function test or load the page in the browser pane and read the console BEFORE pushing.
- Verified: page loads in the browser pane, no console errors. Unverified: on the phone.

## 2026-11-18 v0.5.2: sharp text (canvas drawn 3x bigger)
- Why: the canvas was only 240x427 and stretched up by the browser, so all text was blurry. Now the canvas is 720x1281 (config.game.render = 3) and the main camera zooms by 3, so every game number is still logical. Sprites still use nearest-neighbour, so pixel art stays hard-edged. Text resolution = render.
- Touch input is divided by the render factor (PlayScene R). index.html: canvas image-rendering is now auto (the canvas is already 3x).
- Debug: window.__game exposes the Phaser game (e.g. __game.scene.scenes[0].stageClear()).
- Verified in the browser pane: HUD, "+10" texts and the STAGE CLEAR screen are crisp; drag moves the witch 1:1 as before; no console errors.
- UNVERIFIED on the phone: sharpness, speed (the canvas has 9x the pixels; if it stutters set game.render to 2), pixel-art edges after the last small browser stretch.

## 2026-11-18 v0.5.3: faster witch
- Omri: thumb and witch drift apart with 1:1 drag. Now config.ship.dragSensitivity 1.0 -> 1.5 (witch moves 1.5x the finger) and followRate 20 -> 28 (a bit less lag).
- Unverified: feel on the phone. If too twitchy go back toward 1.2 / 22. Other ideas if still odd: a thumb circle (virtual stick), or the old "witch glued above the finger" way.

## 2026-11-18 v0.5.4: witch settles above the thumb (drift fix)
- Omri: with drag x1.5 the witch drifted away from the thumb near the top of the screen. Now the drag stays relative (no jump at touch), but while the thumb is down the witch slowly slides to a spot fingerOffsetY (z(45)) above the thumb. config.ship: glueRate 2.5 (0 = old pure relative drag), fingerOffsetY, dragSensitivity 1.2 (was 1.5), followRate 28.
- Verified in the browser pane by simulating a far-away thumb: the witch slid to the spot above it. UNVERIFIED: real thumb feel. If it feels like it pulls against you, lower glueRate (1.5) or raise sensitivity; if still drifting, raise glueRate (4).

## 2026-11-19 v0.5.5: virtual stick (new default) + ?ctl= switch
- Omri asked to try a virtual stick. A faint ring appears where the thumb lands (rests at the bottom when idle); the witch flies where you push, speed grows with the push (config.stick: radius, deadZone 0.12, speed z(380) at full push). The old drag mode is still there. Switch without a new version: add ?ctl=stick or ?ctl=drag after the web address. Default is config.ship.controls = "stick".
- Verified in the browser pane by simulating a held stick: push right/up moves the witch that way and she stops on release; no console errors. UNVERIFIED: real thumb feel, ring size, speed.
- Tune on the phone: stick.speed (faster/slower), radius (bigger ring = finer control), deadZone, ringAlpha (how visible).

## 2026-11-19 v0.5.6 + v0.6.0: snappier stick, animated witch from the zip
- Stick (v0.5.6): the witch followed the stick with double lag (speed + easing). Now direct (stick.response 60), speed z(600), radius z(45), deadZone 0.08, curve 0.8. Too fast: lower stick.speed. Still slow: raise it.
- Witch art (v0.6.0): Omri's zip "Witch on Broomstick 1.2" (Svetlana Kushnariova and Jordan Irwin, CC BY / OGA-BY). Only the two 24x32 sheets + licence texts are in assets/witch; the zip itself is NOT in git (.gitignore *.zip). Credit is in CREDITS.md. A credits screen in the game is still to do (the licence needs the credit shown somewhere players can find it).
- Animation: back view (3 frames, flying up) normally; side-view frames when she flies sideways faster than ship.sideSpeed; tilt still applies. Sheet 2 (blue hat) is the default, sheet 1 (orange hair): try ?witch=1 / ?witch=2, or config.ship.witch. Size: spriteScale 1.5 = 36x48 px. Hitbox unchanged (hitRadius 3, centre of the sprite). The old drawn witch (HERO_ART) is unused now.
- Verified in the browser pane: back view and side view play, no console errors. UNVERIFIED: on the phone, whether the back view reads as a witch at this size, where the shots come from (shotY 20) and the sparkle trail (trailY 22) now sit right, stick feel.

## 2026-11-19 v0.6.1: pixel forest background (default), sky kept
- The sky and clouds are replaced by a calm forest floor seen from above: a plain green ground (colour taken from the sheet) with lighter grass patches, bushes, stumps/firs and big trees that scroll down forever and pass UNDER the witch, enemies and shots. Props are a fixed pool, reused at the top (no new objects per frame). A clearer lane stays in the middle. They speed up when the witch flies up (same cloud boost as before).
- Switch: config.background.mode = "forest" | "sky", or ?bg=sky / ?bg=forest after the web address. All knobs are in config.background.forest (scale 0.5, scroll, treeCount, bushCount, smallCount, patchCount, treeRows, laneHalf, laneKeep, gapY, groundColor).
- Files: src/forestArt.js (finds each tree/bush on the sheet by itself), assets/forest/plants.png and grass.png (copied from "Resurrected RPG 1.1"), PlayScene preload/makeForest/scrollBackground.
- LICENCE UNKNOWN: the "Resurrected RPG 1.1" sheets have no known licence. assets/forest must NOT be pushed (and "Resurrected RPG 1.1" must not be added to git) until Omri confirms the licence. Credit/licence must be added to CREDITS.md then.
- Verified: every game file parses (scratch/chk.mjs); the sheet cutting was tested in node on the real PNG (5 tree rows x 6, bushes, stumps/firs found correctly). UNVERIFIED: I could not look at the game running. Check on the phone/browser: tree size (about 40-60 px), calm look, seams (none expected, floor is one flat colour), whether red shots and gold coins are easy to see on the green (coins may be the weak one: gold on olive green), speed of scroll, frame rate (about 23 extra sprites).

## 2026-11-19 v0.6.1 licence note (forest sheets)
- Source: https://immunitys.itch.io/resurected-rpg-tile (Immunity). Licence: personal and commercial use, edits allowed, credit appreciated, NO repackaging/redistribution/resale. Omri chose (19 Nov) to keep only the used files in the public repo (assets/forest/plants.png, grass.png) and credit Immunity in CREDITS.md. The full pack folder "Resurrected RPG 1.1" stays untracked: never git add it (it is in .gitignore).
- Optional: ask the author in a comment on the itch page whether this is OK.

## 2026-11-19 v0.6.2: calmer stick
- Omri: the witch is too sensitive. stick: radius z(45) -> z(55) (more thumb travel for the same push), speed z(600) -> z(480), curve 0.8 -> 1.4 (small pushes move her gently, a full push still gives top speed), deadZone 0.1, response 60 -> 40 (a hair smoother).
- UNVERIFIED on the phone. Still too twitchy: curve 1.7 or speed z(400). Too sluggish: curve 1.1 or speed z(540).

## 2026-11-19 v0.6.3: forest edge walls and bigger trees
- Left and right edges are now walls of big tree tops (trunks off screen), so the middle is a path. 14 tops per side, drawn in order by height (lower = in front), recycled off the bottom. Middle has only 1 tree, 1 bush, 1 stump/fir at a time, with random gaps. Patches 8 -> 4. Total about 36 sprites. Still below the witch, enemies, shots, coins. ?bg=sky and the speed boost unchanged.
- Knobs (config.background.forest): edgeCount, edgeWidth [90,130], edgeInset [35,55], edgeStepY [40,52], midMargin, midTreeCount/midBushCount/midSmallCount, midTreeWidth/midBushWidth/midSmallWidth, midGapY, patchCount, treeRows/treeRowWeights. Removed: scale, treeCount, bushCount, smallCount, laneHalf, laneKeep, gapY.
- UNVERIFIED: not looked at in the browser or on the phone. Check: no floor gaps at the edges, wavy path edge, path wide enough to fly, middle props not looking like enemies, frame rate.

## 2026-11-19 v0.6.4: grass blobs
- Omri liked the lighter ground patches but wanted random blob shapes, not strips. Now drawn in code (PlayScene.makeBlobTextures): 6 wobbly oval variants with a grainy edge, a few lighter specks. config.background.forest: patchCount 6, blobVariants, blobSize [16,34] texels, blobCell 2 (game px per texel), blobColor / blobColor2.
- assets/forest/grass.png is no longer used and was removed from the repo (fewer files of the pack in a public repo).
- Verified in the browser pane. UNVERIFIED on the phone: whether the blobs are visible enough / too visible; raise or lower the colour difference with blobColor.

## 2026-11-19 v0.6.5: slower stick
- Omri: the witch is still too quick. stick.speed z(480) -> z(360) (full push = 240 px/s, crossing the screen in about a second). Curve 1.4, radius, deadZone unchanged.
- UNVERIFIED on the phone. Still quick: z(300). Now sluggish: z(420).

## 2026-11-19 v0.7.0: rocks on the forest floor
- Small rocks (5 on screen, 24 shapes, scaled 1.1-1.8) and a rare big rock (1; comes back after up to 1100 px of scrolling, so about every half minute). New rocks are placed so they are at least rockMinDist (80 px; 130 px for the big one) from every other rock. They lie under trees and bushes (depth -9.2 / -9.1) and under the witch, enemies and shots. Only on the path (inside midMargin), not in the tree walls.
- Art: assets/forest/rocks.png = a 227x136 crop of the Props sheet with ONLY the rocks (the rest of the Props sheet is not in the repo). Frame positions in src/rocks.js. config.background.forest: rockCount, rockScale, rockGapY, rockMinDist, bigRockCount, bigRockScale, bigRockGapY, bigRockMinDist.
- Big rocks are the future cat spots. For that they will need to be drawn above the trees and have a known position (item.big = true marks them).
- Verified in the browser pane (small rocks spread out, big rock shown by moving it on screen). UNVERIFIED on the phone: rock density and size.

## 2026-11-19 v0.7.1: natural prop placement
- Omri: avoid putting items in front of each other, more diagonal, a bush under a tree now and then is fine.
- All single path props (rocks, big rocks, trees, bushes, stumps/firs) are now placed by one function (placeFree in PlayScene.makeForest): a new prop only lands where its picture box does not overlap another prop (propGap 8 px), except a bush may sit under a tree (bushUnderTreeChance 0.25). Zigzag: the next prop goes to the other side of the path with chance zigzag 0.8 (left third / right third; the middle is left free). If no free spot is found in 30 tries it waits 200 px longer above the screen.
- Also: rocks fewer and smaller (rockCount 3, rockScale 0.9-1.4, rockMinDist 100) because 5 big ones looked crowded.
- Edge canopies are NOT changed (they are the walls and may overlap each other).
- Verified in the browser pane: no overlaps after respawn, zigzag spread, no errors. UNVERIFIED on the phone: density. Knobs in config.background.forest.

## 2026-11-19 v0.7.2: big trees always to the sides
- Omri: no big trees straight in the middle. Middle trees now have their centre at least treeLaneHalf (45 px) from the middle line and treeEdge (40 px) from the screen edge, so they stand left or right of the path and the centre stays open. Bushes, stumps and rocks keep the old placement.
- Verified: 4 respawns gave tree x = 188, 45, 177, 58 (middle line = 120). UNVERIFIED on the phone: the path may look emptier in the middle, that is on purpose. Knobs: config.background.forest treeLaneHalf, treeEdge.

## 2026-11-19 v0.7.3: invisible stick
- Omri: make the finger wheel invisible. config.stick.show = false hides the ring and knob (the stick works exactly the same). Set show: true to see it again (useful to tune the size).
- Verified in the browser pane: nothing drawn, a simulated push still moves the witch. Note: with no ring the player cannot see the stick centre; the stick centre is always where the thumb lands.

## 2026-11-19 v0.8.0: forest light (leaf shadows + light shafts)
- Soft leaf shadows (7 on screen, 4 shapes drawn in code, alpha 0.13) drift over the forest floor, scrolling 1.3x faster than the floor and 4 px/s sideways (looks like a canopy high above). 3 pale light shafts (tilted 18 degrees) fade in and out and drift 3 px/s. All at depth -6: above the forest, BELOW the witch, enemies, shots and coins, so nothing gameplay is darkened or hidden. config.background.forest.light has every number; light.on = false switches it all off.
- Cost: 10 extra sprites, no per-frame allocation. Verified in the browser pane (shadows and a shaft visible, no errors). UNVERIFIED on the phone: how strong the effect looks and frame rate. Too strong: lower shadowAlpha / shaftAlpha.
- Ideas for later: soft glows on player shots, coins and explosions; a dusk stage with a darkness layer.

## 2026-11-19 v0.8.1: even speed feel
- Omri: the witch feels faster flying up than sideways. Cause: feel.cloudBoost 1.2 made the whole forest (and leaf shadows) scroll up to 2.2x faster when she flew up, which looks like extra speed. Now cloudBoost 0.25 (a small rush). Her real stick speed was already the same in every direction (240 px/s at full push).
- UNVERIFIED on the phone. If up still feels faster, set cloudBoost 0; if sideways feels slower than up in real speed, add a sideways multiplier to stick.speed.

## 2026-11-19 v0.9.0: colourful broom trail
- Omri: colourful particles at the end of the broom, not short, not long. The existing sparkle trail is now longer (life 420 -> 900 ms, speed z(40) -> z(75): about 45 px behind her), bigger (trailSize 2.2-4 art px, was 1-2), denser (trailIdleMs 90, trailMoveMs 26, pool 110) and colourful: colours go round in order pink, lilac, blue, mint, violet, white (config.feel.trailColors). No red or gold on purpose (red = enemy shots, gold = coins).
- Verified in the browser pane by stepping the game by hand (a stream of coloured specks, no errors). UNVERIFIED on the phone: length and density at 60 fps; blue and mint specks near the cyan player shots. If too long: trailLifeMs 700. Too busy: trailMoveMs 40. Want rainbow with orange/yellow: add colours to trailColors (breaks the gold-for-coins rule).

## 2026-11-19 v0.9.1: tree shadows, one tree size, rocks to the sides, cloud shadows
- Rocks: centre at least rockLaneHalf (35 px) from the middle line and rockEdge (52 px) from the screen edge (may sit under the canopy edge). Big rocks too.
- One tree size: edge canopies and middle trees are all 100 px wide (edgeWidth, midTreeWidth). treeLaneHalf 55 so a 100 px tree does not cross the middle line.
- Tree shadows: each tree (edge and middle) has a shadow = its own picture filled dark (0x0d1f12, alpha 0.18), flattened to 0.6 of the height and tipped 55 degrees clockwise from its base (up and to the right; sun low at the lower left). It follows the tree, so it moves down with the scroll. Depth -9 (above floor and rocks, below trees). config.background.forest.treeShadow: on, angleDeg, lenMul, alpha, color, depth. 
- The leaf shadows are removed. Cloud shadows instead: 3 big soft shapes (192 px wide, alpha 0.12) drifting over the floor at 1.6x the floor speed and 6 px/s sideways. Light shafts stay. config.background.forest.light.shadow*.
- Verified in the browser pane (diagonal tree shadows, no errors). UNVERIFIED on the phone: strength (tree shadows fall on the left half of the path from the left walls; the right wall's shadows fall off screen), frame rate (+29 shadow sprites).

## 2026-11-19 v0.9.2: pixel-art tree sway
- Omri: make the trees sway, but pixel-arty. Smooth rotation would blur the pixel grid, so instead: for every tree picture in use (rows 0, 2, 4 of the sheet) a small atlas ("treeSway", 2032x776, made once in makeTreeSwayAtlas) holds 3 versions: top leaning left, straight, leaning right. Each pixel row is shifted by a WHOLE number of source pixels: sway.px (4) x (1 - y/height)^sway.curve (1.6), so the top moves most and the trunk stays still. The trees step through left - straight - right - straight at sway.fps (3) steps per second, each tree with its own start (swayPh) so they do not move together. The tree shadows use the same frames and sway with their tree. config.background.forest.sway: on, px, curve, fps.
- Verified in the browser pane: atlas built (54 frames), the 3 versions look different and pixel-sharp, 29 trees use it, no errors. UNVERIFIED on the phone: how strong/busy the sway feels with 30 trees moving. Too strong: px 3. Too calm: px 5 or fps 4. Switch off: sway.on false.
- Memory: the atlas is about 2032x776 px = 6 MB of texture memory.

## 2026-11-19 art packs organised (no game change)
- Omri added about 25 packs (itch.io, OpenGameArt) and asked to catalogue them and tidy the folder. All packs, archives and extracted copies moved from the project root into art-packs/ (git-ignored), by category: environment, characters-and-enemies, items-and-pickups, hut-and-witchcraft, effects-vfx. Each pack folder holds the original download and an unpacked/ copy (the two huge unused ones, Alenia and thunder, and the rar files stay packed). File count checked before and after: 457 = 457, nothing lost.
- art-packs/CATALOG.md lists every pack: source link, licence in plain words, whether it may go in the public repo, what is in it, status (USED / candidate / hold). Unknown sources are listed at the bottom ("To find out"). The old catalog/ viewer moved to art-packs/_tools/catalog (its image paths point to the old place and need fixing before use).
- Rule added to CLAUDE.md: never git add art-packs.
## 2026-11-19 v1.0.0: swamp background (stage 2)
- New theme: a dark foggy swamp from the Murky Swamp pack. Try it with ?bg=swamp in the web address, or set config.background.mode = 'swamp'. Default stays 'forest'; ?bg=forest and ?bg=sky work as before.
- The forest code now runs from a theme (makeForest(theme) in PlayScene.js): it asks a "kit" for pictures (makeForestKit = the old sheet + sway atlas, makeSwampKit = the swamp files) and the rest (edge walls, path props, placeFree, zigzag, rocks, tree shadows, fog/light, cloudMul) is shared in makeBackgroundLayers. Animated strips (names ending _anim, 8 frames) play by themselves (animFps 5), each sprite from a random frame; tree shadows follow the frame.
- Config: config.background.swamp (at the end of src/config.js) starts as a copy of the forest numbers and overrides: groundColor 0x444f3c, files {trees, bushes, smalls, rocks, bigRocks} (swap names to change the cast), animFps, animFrames, midBushScale / midSmallScale (props keep their own size, not one width), midBushCount 2, midSmallCount 1, rockScale, bigRockScale 1.5, pools (patchCount, blobSize, blobColor, blobColor2), treeShadow (alpha 0.28), light = fog (shadowCount 5, shadowCell 4, shadowAlpha 0.12, shadowColor pale grey-green; no light shafts).
- Art: 35 files copied to assets/swamp/ (about 240 KB): 9 big trees as walls (willow, cypress, swamp_tree, gnarled_oak), reeds, cattails, bog cotton, water hyacinth, sundew, pitcher plants, glow mushrooms (green), skunk cabbage, logs, stumps, lily pad, toad pad, stepping stones, moss lumps and boulders; big rocks = frog rock / moss boulder. Left out on purpose: swamp iris, glowing_mushrooms and skunk_cabbage_1 (they have yellow that looks like a coin), black gum (red), small trees (tupelo, birch, mangrove: too small for the 100 px wall), wisp (optional, not done).
- Version 1.0.0. CREDITS.md has the pack line (author name unknown: ask Omri).
- UNVERIFIED (not run): everything visual. Syntax checked only (chk.mjs). Check in the browser and on the phone: walls look right (side-view trees, canopy only), floor not too dark, fog visible but faint, nothing looks like a coin or red shot, big trees in the path stay to the sides, frame rate (about 45 animated sprites + shadows), forest and sky still unchanged.

## 2026-11-19 v1.1.0: start menu (Forest / Swamp)
- New scene src/scenes/MenuScene.js (key 'Menu'), first in the scene list. Two big cards: FOREST (1) and SWAMP (2), each with its 4 medals and a small BEST score (if saved). Press = card brighter, release on the same card = starts that stage (scene.start('Play', { theme })). Sliding the finger off cancels. Version shown at the bottom.
- Any debug parameter in the web address (wave, god, bg, ctl) skips the menu and starts the Play scene as before.
- PlayScene.init(data): data.theme picks the background; ?bg still wins; with no data it uses config.background.mode. Restart keeps the theme.
- Medals per stage: forest keeps key ff_medals_stage1 (old saves stay), swamp uses ff_medals_swamp. medals.js functions take the theme. New best score per stage (key + "_best"), saved on STAGE CLEAR only, not in debug runs.
- End screen: new small MENU button at the bottom (config.endMenuBtn); a tap on it goes to the menu and does not restart. Tap anywhere else restarts the same stage.
- Config: config.menu (card size, gap, colours, text sizes, medal scale) and config.endMenuBtn. Version 1.1.0.
- UNVERIFIED: thumb feel and size of the cards and the MENU button on the phone; looks in the browser (not run by the coder). Check: menu shows first; both cards start the right stage; medals of the swamp do not mix with the forest; MENU button works and does not restart.

## 2026-11-19 v1.1.1: UPDATE button
- Omri: an update button, to get the newest version in the browser and in the app installed from the browser. There is no service worker, so the browser keeps its own saved copies of our files (GitHub Pages says 10 minutes) and the installed app uses the same saved copies. New src/update.js: refreshFiles() fetches every game file with cache: 'reload' (replaces the saved copy), clears any Cache Storage and unregisters any service worker, then the menu reloads the page. latestVersion() reads the server's version number (never from the saved copy).
- Menu: a small UPDATE button under the cards. When the menu opens it checks the server's version; if it is newer than the running one the button turns green and says NEW VERSION. Offline: NO INTERNET for 2 seconds. config.menu: updateW, updateH, updateTop, updateSize, updateColor, updateHotColor.
- IMPORTANT: new source files must be added to FILES in src/update.js (and src/update.js refreshes itself). Versions before 1.1.1 have no button, so the phone needs ONE manual refresh (close the tab and reopen, or clear the site data) to get it. After that the button works.
- Verified in the browser pane: button shows, a tap fetches with cache reload and the page reloads to the menu, no errors. UNVERIFIED: the installed home-screen app on the phone, and the green NEW VERSION state (needs a real newer version on the server).

## 2026-11-19: animated enemy sprites (v1.2.0, branch v1200-enemy-sprites)
- Enemies can use sprite sheets from `config.enemies.sprites` (one entry per type: file, frameW/H, frames, fps, scale, hitW/H, faceVelocity). A type with no entry keeps its code-drawn picture (the ghost 'zigzag' still does).
- Now animated: grunt = purple bat (row S, frames 0,1,2,1), shooter = pink dino (dino-idle, frames 0-3, flips left/right with its movement). 'vulture' added in config only (frames 1,3,2,3, a guess), not in any wave. Sheets are in `assets/enemies/`; credits in CREDITS.md.
- Carrier halo for animated enemies = a solid green / pink-white bigger copy behind the enemy (`enemies.haloTint`, `haloScaleSprite`).
- Death colours changed for shooter (magenta) and added for vulture.
- UNVERIFIED: how it looks (sizes, hitbox honesty, halo look), whether the vulture loop is clean. Check on the phone: bat/dino size vs shots, that hits feel fair, white hit flash still shows.

## 2026-11-19: animated coin, hearts, chest and death puff (v1.3.0, branch v1300-pickup-sprites)
- New block config.sprites (src/config.js). Every entry is optional: a thing WITHOUT an entry keeps its old code-drawn picture. Hitboxes, pickup radius, values, hp, pools and coin spread are unchanged (the grab radius is divided by the sprite scale, so it is still 10 px on screen).
- Coin: gold spinning coin (24 frames, 30 fps, scale 1 = about 16 px), each coin starts at a random frame. Spark on pickup kept.
- Heart pickup: Drop plays once (11 frames), then Idle loops (24 frames) while it falls. When grabbed, Collect plays once where it was (12 frames); this REPLACES the pink ring. +heart / +50 logic unchanged.
- Top bar hearts: the Idle loop (scale 0.6 = about 13 px), 8 frames apart so they do not beat together. Lost heart = first frame as a flat dark-grey shape (emptyTint, emptyAlpha 0.6).
- Chest: Idle loops while it falls (random start frame); when destroyed Break plays once (15 frames) at the same moment as the coins. Scale 0.75, hit box 24x28 sheet px (about 18x21 on screen). The pack chest has yellow planks (looks like a coin), so config.sprites.crate.tint = 0x9a98a8 (muted brown). tint null = original colours.
- Death puff: 30 frames of "poof" at 60 fps = 0.5 s, scale 0.6 (about 35 px smoke), x1.5 for the shooter and the chest (bigMul). Frames 30-48 (thin tail of dots) are left out. Sits at depth 18 under the rings (19) and sparks (20). Not used when the witch is hit. Pool of 8 (+8 shared by chest-break and heart-collect).
- Files: assets/pickups/ (coin, crate-idle, crate-break, heart-idle, heart-drop, heart-collect + LICENSE-Frakassets.txt), assets/fx/ (poof + LICENSE-vfx-MIT.txt). Cut with a scratch script (scratch/pk/cut2.mjs, not in the repo); only the used frames were copied. Strips of one thing share one cell size and centre. Credits in CREDITS.md. Code: PlayScene (preload, anims, playFx pools, spawn scale), hud.js.
- Colour rules: the pack heart is salmon pink with a dark outline and a red-pink lower half (not pure enemy-shot red, but close: check on the phone). Yellow sparkles in heart-collect and poof were made white. The coin flash frames are white-gold.
- UNVERIFIED (not run by the coder): how everything looks and feels in the game; sizes next to shots; the chest tint; the heart Drop timing against its fall speed; frame rate with many coins and 2 pools of animated sprites. Check on the phone: coins readable and not too busy in a shower, heart easy to tell from enemy shots, chest not confused with a coin, puff not hiding enemy shots (it is under the sparks but over the enemies), hearts in the bar.

## 2026-11-19: green gem pickup + Halloween start menu (v1.3.1, branch v1310-menu-art)
- Weapon upgrade pickup (texture weaponUp) is now the animated GREEN gem: `config.sprites.weaponGem` (4 frames of 16x16, 8 fps, random start frame, scale 1 = 16 px). The grab radius is still 10 px on screen (divided by the scale like the heart). Carrier green halo and the green level-up flash are unchanged. Remove the weaponGem entry to get the old potion back. File: assets/pickups/gem-green.png.
- Start menu dressed with the Spooktober Halloween set: animated night sky behind everything (18 frames = every 2nd frame of the 36-frame GIF, 5 fps, cropped to a 202x360 upright part around the moon, scaled to the screen width; grid sheet 1212x1080, 32 KB). Decorations (config.menu.decor, one entry each: file, cell size, x/y/origin, scale, fps, bob): witch (4 frames, left of the gap under the title, bobs 1 px), ghost (5, right of the gap, bobs 2 px), bat hanging from the top edge at the right (4), cat bottom-left beside UPDATE (5), cauldron bottom-right (4). Each starts at a random frame. Decorations are drawn behind the cards (depth -5), take no input, and sit in free spots (cards, medals, UPDATE and version text are untouched).
- Knobs: config.menu.sky (fps) and config.menu.decor (positions, scale, fps, bob, flipX). Scales are multiples of 1/3 (0.667, 1, 1.333) so the pixels stay even on the 3x canvas. Delete an entry from decor to remove that character.
- Files copied: assets/menu/ (sky, witch, ghost, cat, boiler, bat) and assets/pickups/gem-green.png. Cut with scratch/pk/cutmenu.mjs (not in repo). Credits in CREDITS.md. Pumpkin and spider were not used.
- UNVERIFIED (not run by the coder): how the menu looks (title may be close to the witch and ghost, bat near the title, cat and cauldron near UPDATE), sky flicker at 5 fps, load time on the phone, gem size next to coins and its green against the new sky. Check on the phone: gem clearly green and easy to see, grabs like before; every card and UPDATE still taps; nothing covers text.

## 2026-11-19 UI and font direction (Omri, decided in chat; nothing built yet)
- Look: consistent, flashy, trendy and cool. NO green backgrounds in the UI (the forest/swamp worlds stay inside the game; the menu cards currently use their green ground colours and must change). Palette idea: purple, pink, cyan on dark. NO glow effects: flat, crisp, hard pixel edges (a hard 2-3 px dark shadow or outline is fine).
- Fonts: pixel-art fonts are a plus. Title font: an old-timey, swirly, Halloween feel; best pixel candidates are the Jacquard family (Jacquard 12 / 24, Jacquarda Bastarda 9, all OFL on Google Fonts). Text and numbers: a pixel font (Pixelify Sans, Silkscreen, Jersey 10...). Omri has not picked yet. Comparison page (local): art-packs/_tools/fonts/index.html.
- Ideas agreed so far: medals become stars (4 per stage, pop-in animation from the Frakassets power star); weapon level as a row of green gems instead of bars; end screen as "back at the hut"; menu already has the Halloween art (v1.3.1).
- Fonts go into the repo only after Omri picks (OFL licence text must be copied next to the font file; load before the first scene; use exact pixel sizes).

## 2026-11-20 v1.4.0: the logo in the menu
- Omri picked the first (pumpkin) logo: stacked "Fight&" over "Flight", small low "&", both lines the same colours, tilted 14 degrees up to the right with perspective (letters grow to the right), flat, no glow. Made in art-packs/_tools/logo (the "logo lab", local) from Jacquard 24 and saved as assets/menu/logo.png (116x83 art px). It replaces the plain-text title in the menu (config.menu.logo: file, x, y, scale; if the picture is missing the old text title shows).
- Name: the logo reads "Fight & Flight". The game is still called "Flight and Fight" in code, the page title, the manifest and the repo; Omri has not decided the name. To redo the logo with another name, open the logo lab, change the words, save as PNG and replace assets/menu/logo.png.
- Verified in the browser pane (logo shows, no errors). UNVERIFIED on the phone: size next to the witch and ghost.
- Still to do for the new look: menu cards are green (against the new direction), font, hearts/stars/gems UI.

## 2026-11-20 v1.5.0: Pixelify Sans font and purple button plates
- Font: Pixelify Sans (OFL, assets/fonts, 12 KB) replaces Courier New everywhere. index.html has the @font-face and a preload; src/main.js waits for the font (max 2 s) before it creates the game, so the first text is already in the right font. Font is in the UPDATE file list.
- Menu cards and UPDATE button: flat purple plates, pink 3 px border, dark bottom edge (4 px). Pressed: plate and its texts sink 2 px, fill a bit lighter. Forest card has an orange tab, Swamp a cyan tab (left edge). No green left in the UI. UPDATE turns orange (dark text) when a newer version waits. Number orange, name cream, BEST cyan.
- End screen: MENU button uses the same plate (drawPlate in src/hud.js). STAGE CLEAR cyan, GAME OVER pink, NEW orange, TAP TO PLAY AGAIN pink, other texts cream; hard dark shadow-colour outline, no glow.
- Knobs (src/config.js): menu.pal (all colours), plateDrop, plateDownShift, plateBorderW, plateRadius, tabW, tabColors, numberSize 32, nameSize 20, bestSize 12, updateSize 12, versionSize 8 (menu and HUD), endMenuBtn.size 16. End-screen sizes are snapped to multiples of 4 (snap4): title 24, score 16, small lines 12, MENU 12, NEW 8. Score in the HUD 12, floating +10 text 12.
- UNVERIFIED on the phone: how the font and sizes look, text overflow (stage names in the cards, score at the top, end-screen lines), pressed feel of the plates, orange UPDATE contrast.
- v1.5.0 addendum (lead, 2026-11-20): Pixelify Sans draws the digit 5 like S and 2 like 8, so scores read "SO". Fix: one font family "GameFont" made of two files with unicode-range: Pixelify Sans for letters, Jersey 10 (assets/fonts/Jersey10-latin.woff2, OFL, 13 KB) for the digits 0-9 only, with size-adjust 125% so digits are as tall as the letters (index.html). FONT in hud.js uses "GameFont". Checked on a snapshot of the end screen: digits are clear. Tune digit size with size-adjust in index.html.
- Pane note: the built-in browser pane turns its picture black after ~20 s of play (also on v1.4.0, so it is not the game). Use renderer.snapshot posted to a local file to inspect screens; this is only a test-tool problem. If a phone ever goes black after a while, tell Claude.

## 2026-11-20 v1.5.1: soft stop (overshoot) for the witch
- When the thumb lifts, she glides a little further (about 0.12 s of her speed) and settles with a small bounce back (damped spring) instead of stopping dead.
- Knobs in src/config.js `stick`: `stopGlide` (0 = off), `stopOmega` (speed of the settle), `stopDamping` (1 = no bounce, 0.3 = small bounce).
- Tested in the browser by simulation: glide ~29 px, overshoot ~7 px, settles with no jitter.
- UNVERIFIED: how it feels on a real thumb. Check: lift the thumb while moving fast and slow; too floaty = lower stopGlide; too bouncy = raise stopDamping.

## 2026-11-20 v1.5.2: bigger bats
- Omri: bats larger. Grunt (bat) scale 0.8 -> 1.1 and hitbox 20x16 -> 27x22 in config.enemies.sprites.grunt.
- UNVERIFIED on phone: size next to the witch and shots, waves not too crowded. Open question to Omri: which sprite he chose for the shooter (now still the pink dino).

## 2026-11-20 v1.5.3: vulture is the shooter
- Omri chose the vulture for the shooter. config.enemies.sprites.shooter now uses vulture.png (frames 1,3,2,3, scale 1.0, hit 24x24). The dino sheet stays in assets but is unused.
- UNVERIFIED: the flap loop order (a guess), which way it faces when moving, size and hitbox on the phone, death colours (shooter explosion is still magenta).

## 2026-11-20 v1.5.4: soft stop no longer turns the witch
- Omri: after every move the witch turned (side view + tilt) the other way. Cause: the soft-stop spring bounces the speed back, and the look followed that speed. Now during the soft stop only the forward glide counts (this.stopDirX); the bounce back is ignored for the side view and tilt. Movement itself is unchanged.
- UNVERIFIED on the phone (syntax checked only, not run). Check: lift the thumb after a sideways move: she should not flip to the other side. If it still feels wrong, set config.stick.stopGlide to 0 to turn the soft stop off.

## 2026-11-20 v1.6.0: tuning panel (?tune=1)
- Add `?tune=1` after the game address (the menu still shows first). A small TUNE button sits under the hearts (top right). A tap opens a panel at the top and PAUSES the game; tap X to close and fly again. Players never see it without ?tune=1.
- 8 stick numbers with - and + buttons (hold = repeat): SPEED, RADIUS, DEADZONE, CURVE, RESPONSE, GLIDE (stopGlide), SETTLE (stopOmega), DAMPING (stopDamping). Changes act at once on the live config. RESET = back to the values at page load. COPY = puts `stick: { ... }` on the clipboard (or says COPY FAILED); paste it to Claude, who puts it in src/config.js. A reload loses the changes.
- Files: new src/tune.js (also in FILES in src/update.js), hooks in src/scenes/PlayScene.js. A ?tune=1 run does not save medals.
- Verified in the browser (desktop, Playwright): panel opens, + changes speed 240 -> 250, X closes, no console errors, screenshot looks right. UNVERIFIED on the phone: button size under the thumb, hold-to-repeat, whether COPY works on the phone, whether the panel covers too much.

## 2026-11-20 v1.6.1: tuning panel works in the installed app
- Omri's home-screen app has no address bar, so ?tune=1 could not be used there. Now: tap the version text at the bottom of the MENU 5 times quickly -> it says TUNE ON (or TUNE OFF) and the choice is remembered (localStorage 'ff_tune'). ?tune=1 also turns it on and remembers it; ?tune=0 turns it off. Code: tuneEnabled() / toggleTune() in src/tune.js, MenuScene version tap, PlayScene uses tuneEnabled().
- Verified in the browser (phone-sized, touch): 5 taps -> next stage has the TUNE button, no console errors. UNVERIFIED on the phone/app: that the 5 taps are easy to hit (the area is about 80x24 px around the version text).
- Remember: with the remembered flag on, no medals are saved (debug run). Turn it OFF again for normal play.

## 2026-11-20 v1.6.2: stick numbers from Omri's phone tuning
- Tuned with the TUNE panel on the phone, copied by Omri. config.stick: speed z(360)=240 -> 200, radius z(55)=37 -> 47, deadZone 0.1 (same), curve 1.4 -> 1 (even response), response 40 -> 44, stopGlide 0.12 (same), stopOmega 16 -> 11, stopDamping 0.3 -> 0.8 (almost no bounce, slower settle).
- Speed and radius are now plain numbers (no z()); they were 240 and 37 before, so 200 and 47 are in the same game pixels.
- UNVERIFIED beyond what Omri felt while tuning: nothing else changed. Next idea (Omri has not decided): ?ctl=mouse for desktop testing.

## 2026-11-20 v1.7.0: polish pass (branch v1700-polish-pass)
- Shooter is now the fire wisp (assets/enemies/wisp.png, 10 frames, scale 0.5, hitbox 22x26). Vulture and dino stay unused.
- Chests are on the ground: they scroll at the ground speed (config.crate.onGround) and are drawn UNDER the tree tops (crate.depth -8.2), so they can no longer float above trees. A chest under a canopy is hidden until it passes. Opened chest: freezes on its last frame, waits crate.fadeHoldMs (150), fades out over crate.fadeMs (600).
- Forest sway steps 3 -> 1.5 per second; swamp animated props 5 -> 2.5 frames per second.
- Coin and green gem scale 1 -> 1.2.
- Stunned stars (assets/fx/stunned.png) circle over the witch's head for 1.1 s after a hit (config.sprites.stunned; not shown on the hit that kills her).
- Tint: a flat colour wash over the play field (config.tint: forest purple, swamp teal, alpha 0.12; shots, HUD and enemy bullets stay above). Turn off with ?tint=0, or tint.on = false.
- Verified in the browser (desktop): wisp shows and animates, chest depth -8.2 and moves 40 px/s = ground speed, chest freeze + fade works (frame 14 held, alpha 1 -> 0, then gone), stunned stars sit above the hat, tint looks subtle, swamp runs, no console errors.
- UNVERIFIED on the phone: wisp size and hitbox, whether the stars are big enough, whether 0.12 tint is too much or too little, the sway speed.
- NOT DONE / open: "shooter outline not lined with sprite": shooters never carry a weapon/heart in any wave, so the glow outline cannot show on them in the current waves. Omri to say when he saw it. New projectile packs (fox717 shot sheet, SovDigital arrow+fire) are catalogued but not used yet.

## 2026-11-20 gallery cleanup (local tool, nothing in the game; same branch)
- New `art-packs/_tools/gallery/apply-deletes.mjs` (real deletion of marked cards: dry run, then --yes, files go to art-packs/_deleted), duplicate hiding by pixels in build.mjs, folding groups per cat colour. Details in art-packs/CATALOG.md. Projectile packs (fox717, SovDigital) catalogued. Tested: dry run + a real move of a throwaway file. UNVERIFIED: the clipboard read when run from Omri's own terminal (it uses PowerShell Get-Clipboard).

## 2026-11-20 v1.7.1: outline that fits, mouse on desktop (branch v1710-outline-mouse)
- Carrier outline (green = weapon, pink = heart) was one bigger copy of the sprite, so it drifted off when the picture was not centred in its frame (the eagle). Now it is 4 solid-colour copies of the current frame shifted 2 px up/down/left/right (config.enemies.haloPx), so it follows the real shape of any sprite. Halo pool 12 -> 48. Verified in the browser on the wisp (temporarily made the shooter a carrier, then undone): the outline hugs it. No wave has a carrier shooter yet.
- Mouse control: on a desktop browser (hover + fine pointer) the witch follows the mouse pointer, no click needed. Phones keep the stick. ?ctl=mouse / stick / drag forces one. config.ship.mouseOnDesktop = false turns the automatic part off. The witch waits until the mouse has moved over the game. Verified: desktop pane -> mouse mode, follows the pointer; emulated phone -> stick.
- UNVERIFIED: a touch laptop (counts as desktop if its main pointer is a mouse); the outline on a carrier bat/ghost on the phone.

## 2026-11-20 v1.8.0: fire shot + swamp lanterns (branch v1720-fire-shot-lanterns, built on v1.7.1)
- Witch shot: ONE orange fire bolt straight up replaces the two cyan-white shots (config.bullet.fire, assets/fx/fire-shot.png; 12 frames at 24 fps; shot art shrunk 5x to a pixel look). Each shot now does double damage (WEAPON.shotDamageMul = 2) so damage per second is the same as before; hitbox 6x16. Delete `bullet.fire` in config to get the old code-drawn shot back (then set pattern TWIN). Enemy shots stay red. The muzzle flash still shows two small dots (old twin positions): not changed.
- Swamp lanterns (swamp only, config.background.swamp.lanterns): all 5 lantern strips mixed, 3 on screen, beside the path (side lanes), scrolling with the ground, above the trees. Each has a green glow (3 flat rings, added as light, flickers in steps) and 3 small bugs flying around it on whole pixels. Everything snaps to the pixel grid. Turn off with lanterns.on = false.
- Lightning: Omri asked for "glow and lightning"; I read it as the flickering light (done). A real lightning flash over the swamp is NOT built; ask Omri if he meant that.
- Possible enemy noted (not built): Twilight Flying Eye "Flight.png" (art-packs/characters-and-enemies/flying-eyes). Original by LuizMelo is CC0; this edit's licence is unknown (CATALOG).
- Verified in the browser (desktop): fire shots fly up as a stream of bolts, lanterns show with stepped green glow and bugs, no console errors. UNVERIFIED on the phone: shot size and feel (it is 8x22 px, thinner than two shots side by side), glow strength, whether lanterns hide behind the edge trees well enough, performance.

## 2026-11-20 v1.8.1: lantern and chest fixes, bigger shot, ghost sprite, hit flash (branch v1800-polish-2)
- Lanterns: scale 1.2 -> 0.75 and now drawn under the tree tops like the chests (depth -8.2). The glow now sits on the lamp itself (position found from each picture's brightest green pixels, flips with the picture), smaller (3 rings, 2 px texels, about 14 px radius); the 3 bugs circle closer (4 to 9 px).
- Chests: they now follow the ground's real speed, including the speed-up when she flies up (before they kept a fixed speed). The opened chest (freeze + fade) keeps scrolling with the ground.
- Witch shot scale 1 -> 1.6 (about 13x35 px; hitbox grows with it).
- Ghost: the swaying ghost is now the green pixel ghost (gosth.png column 3 (gallery numbering), 4 frames of 25x25, assets/enemies/ghost-sway.png, scale 1.3, hitbox 14x16); credit in CREDITS. (First tried the pink Halloween ghost by mistake.)
- Hit flash: an enemy that is hit (not killed) flashes solid white for 110 ms (was 70). The flash code was already there; checked it works on the ghost.
- Verified in the browser (swamp, wave 3): ghost shows, white flash on hit, lantern small with the glow on the lamp, big shots. UNVERIFIED on the phone: ghost size and hitbox, shot size, whether 110 ms reads as a flash at full speed.

## 2026-11-20 v1.8.2: lanterns really stick to the ground, ghost column 3, sizes (branch v1810-ground-flash)
- Rule (Omri): anything that is not a pickup or an enemy belongs to the world and scrolls with the ground. Lanterns did not: each frame I wrote the ROUNDED position back into the sprite, so the slow scroll (0.67 px/frame) got rounded to a different speed and they drifted. Now the exact position is kept in L.fx / L.fy and the sprite only gets the rounded copy. Measured: lantern and ground prop move 40.08 px each in 1 s of game time. Chests, the opened chest and tree shadows already follow the ground.
- Ghost: I had cut column 4 of gosth.png (x=75); Omri meant column 3 in the gallery numbering (x=50). Fixed (assets/enemies/ghost-sway.png). Ghost scale 1.3 -> 1.7.
- Coin scale 1.2 -> 1.0.
- Hit flash: simulated 900 frames with the witch under a ghost: 12 hits gave white flashes of 7 frames (110 ms) each; a flash starts on the first hit only if the enemy survives it, and hits closer than 110 ms merge into one flash. The sprite now turns white at once when hit (before, on the next update). If Omri still sees none on the phone: check the phone really runs v1.8.2 (UPDATE button), and say which enemy.
- UNVERIFIED on the phone: ghost size, coin size, flash visibility.

## 2026-11-20 v1.8.3: world keeps scrolling on game over, ?debug=1 (branch v1820-world-flash)
- Bug: on the game over screen the lanterns (and chests) froze while the ground kept scrolling, because the lantern update sat after the game-over return in update(). Now the lanterns update right after scrollBackground (always), and on game over the chests also move with the ground. Rule stays: everything that is not a pickup or an enemy belongs to the world. Verified: after gameOver() a lantern and a ground prop both moved 40.08 px in 1 s.
- New ?debug=1: a small line under the version: version, drawing mode (WEBGL or CANVAS), fps, controls (mouse/stick/drag). Purpose: Omri sees NO enemy hit flash on desktop. The flash (and the tint wash, the lantern glow) need WebGL; a browser that falls back to CANVAS would show none of them. Next step depends on what that line says on his desktop.
- UNVERIFIED: why the flash is missing on Omri's desktop.

## 2026-11-20 v1.8.4: hit flash works without WebGL (branch v1830-flash-canvas)
- Omri's desktop Chrome draws in CANVAS mode (his ?debug=1 line said "v1.8.3 CANVAS 60fps mouse"); the phone uses WebGL. setTintFill (the old flash) only works in WebGL, so no enemy flashed on his desktop. Now each animated enemy sheet gets a white copy at start (makeWhiteSheet) and a hit shows that white copy on top of the enemy for hitFlashMs (syncFlash, pool of 30). Works in both modes. Code-drawn enemy types would still use tintFill (none left).
- New ?render=canvas forces CANVAS (to test). NOTE: the browser may cache src files, so after editing, fetch them with cache 'reload' or use a fresh ?v= and hard refresh.
- Verified in real CANVAS mode (debug line: CANVAS): a hit ghost is solid white. UNVERIFIED on Omri's real desktop and phone.
- Other WebGL-only things that may look different in CANVAS (setTint / setTintFill): tree shadows, carrier outlines (green/pink), chest colour, spark colours, ship level-up flash. They looked fine in my CANVAS screenshots but I did not check each. The real fix for him is Chrome > Settings > System > "Use graphics acceleration when available" = on, then restart Chrome (then the debug line should say WEBGL).

## 2026-11-20 v1.8.5: coloured spinning smoke, longer stars, game-over outline fix (branch v1840-smoke-stun)
- Death smoke: the puff when an enemy dies is turned a random way and tinted to the enemy's main colour. The colour is found from the sprite sheet itself (average of its solid pixels, colourful ones count more, brightened), so a new enemy sprite gets a matching smoke with no config; override with `smokeColor` in config.enemies.sprites.<type>. Chest smoke is wood brown. Done with a pre-tinted copy of the poof sheet per type (not a game-object tint), so it works in WebGL and CANVAS. Found colours: bat lavender, ghost mint, wisp orange.
- Stunned stars: last as long as she blinks (ship.invulnMs, 1.5 s) and sit lower, just above her head (offsetY -16 -> -12). `showMs` is gone.
- Bug (Omri's screenshot): after game over the carrier outlines and white flash copies stayed frozen while the enemies kept animating, so they separated. Their update now runs on the game over screen too (decorEnemy). Verified: after gameOver the outline offsets stay exactly +-2 px from the enemy and no flash copy is left.
- Sparks and death rings still use the old DEATH_TINTS colours (ghost lavender, shooter magenta). Say if they should match the new sprites too.
- UNVERIFIED on the phone/desktop for real: how the tinted smoke looks at full speed.

## 2026-11-20 v1.8.6: no more light blue flash (branch v1850-no-blue-flash)
- Cause: the game's own background colour was still the old sky blue (#2a6fdb, from the first sky-and-clouds version, in src/main.js). It shows whenever no scene has drawn yet: when the page starts or reloads (UPDATE), and while the next scene loads its pictures (menu -> stage). Now it is the dark menu colour (config.menu.bgColor). Also the phone's theme colour (index.html meta and manifest) was blue: now the same dark colour.
- Not changed: the stage still loads its pictures when it starts, so the dark screen can show for a moment on slow devices (a loading bar would fix that: ask Omri).
- UNVERIFIED on the phone: an installed app keeps its old theme colour until it is reinstalled or the manifest refreshes.

## 2026-11-20 v1.8.7: Omri's questionnaire answers (branch v1850-no-blue-flash, includes v1.8.6)
- Witch shot scale 1.6 -> 2.0. Ghost scale 1.7 -> 2.1. Stars 2 px lower (offsetY -10). Lantern bugs smaller (1.5 px, was 2) and slower (bugSpeed 0.3, was 0.5); the bugs are now a pre-made coloured dot, not a tint, so they are coloured in CANVAS too. Muzzle flash is ONE dot in the middle (was two).
- ?debug=1 line now also says gl:yes / gl:no = whether the browser can make a WebGL picture at all. Omri's desktop still draws in CANVAS after turning graphics acceleration on: if it says gl:no, the browser has no WebGL (Chrome's GPU list or a policy); if gl:yes, Phaser chose CANVAS for another reason and I look at that. Flash and smoke work in CANVAS anyway.
- "Lightning" (his old note): he does not know what a flash is; most likely he wrote "lighting" = the lantern glow, which is done. Closed unless he says otherwise.
- Answers: sparks stay as they are; credits screen not yet; cat names stay Cat-1..6; flying eye PARKED; chest monsters (mimics) PARKED; boss style wanted = shots in patterns (spirals, walls); build one boss NOT yet (more polish first). Boss for stage 2 (swamp) was not answered; stage 1 boss: Omri wants to look at them in the gallery first.
- art-packs/_deleted (97 files) erased for good at Omri's word.
- Gallery: the 4 new packs are shown properly: Necromancer (17x7 cells of 160x128, one animation per row: idle, run, attack 1-3, hurt, death), Final boss (strips of 128x150), Keeper (RPG Maker battler: 18 motions of 3 frames, 192x64 cells), Chest monsters (64 px strips). Keeper motion names are numbers (I do not know the RPG Maker motion order).

## 2026-11-20 v1.8.8: coin shine, real muzzle flash, smoke centre (branch v1860-coin-shine-muzzle)
- Omri's test of v1.8.7: items 1-4, 6, 7, 11-15, 17 ok; desktop debug line "v1.8.7 WEBGL gl:yes 60fps mouse" (graphics acceleration fixed his desktop: WebGL now). Boss chosen: the Final boss FLYING strip (liz cheong; credit needed). Keeper needs FRONT facing sprites: gallery now shows waechter-19.png rows front / left / right / back.
- Muzzle flash: a one-pixel dot was pointless, so it is now a small fire burst made in code (7x7 orange-yellow-white diamond, then a small 3x3 plus, 90 ms in all), one in the middle of the wand.
- Death smoke: the picture's own middle was 4 px left and 5 px below the cell centre, so the random turn swung it around. The smoke now turns around its real middle (config.sprites.poof originX 0.45 / originY 0.57), which is also where the sparks start. The sparks still draw in FRONT of the smoke (depth 20 vs 18).
- Coin shine: subtle soft rays spinning behind a coin (3 pictures drawn in code and swapped at 6 per second, so every pixel stays on the grid) plus a small white twinkle now and then. ONLY ONE coin has it at a time (the first on screen; when it is gone the next one takes over), so a chest spilling six coins shows one shine. Config: sprites.coinShine.
- Stars 3 px lower (offsetY -7).
- UNVERIFIED on the phone: how subtle the rays look at full speed on a real screen (alpha 0.55, radius 12 px), the muzzle burst size.

## 2026-11-20 v1.8.9: calmer muzzle flash (branch v1870-muzzle-gallery)
- Omri: muzzle burst almost flashing. The burst is now 5x5 (was 7x7), shows 70 ms (was 90) at 80% strength (config.feel.muzzleMs / muzzleAlpha). Coin shine and stars: ok as they are.
- Gallery: the Keeper's side-view sheet (sv_waechter) is hidden (Omri: not needed); the front / left / right / back rows now belong to the right sheet (waechter-19.png). The Fox shot sheet is a still picture of bullet shapes, so it only shows when "still pictures" is ticked (search "fox").
- UNVERIFIED on the phone: how the smaller muzzle burst feels at full speed.

## 2026-11-20 boss choices (docs only, no version change)
- Omri chose: FOREST boss = Final boss flying strip (spr_enemy_finalboss_flying_strip6.png, liz cheong, credit needed). SWAMP boss = Necromancer sheet, starting with the idle row (CreativeKind; files must not be distributed: ask before pushing any of its pictures). Boss fights use shot patterns (spirals, walls). Building a boss comes after more polish (Omri's answer). Needs the in-game credit when built (the credits question was "not yet").
- The Fox shot sheet is one picture of many bullet shapes in colour rows, not an animation; the gallery now cuts it into one card per shape row (about 11 cards; the ring rows are cut by a rough guess).

## 2026-11-20 v1.9.0: violet potion for weapon upgrades (branch v1900-gallery-redesign)
- Omri: use Twinkling_Violet_Potion.png for weapon upgrades. The falling weapon pickup is now that 32x32 potion (assets/pickups/potion-violet.png, scale 0.9, one picture with its sparkles drawn in) instead of the green gem strip (still in assets, unused). The green outline on weapon CARRIER enemies stays green. Licence: none stated in the pack; Omri confirmed; credit in CREDITS.md.
- UNVERIFIED on the phone: potion size (29 px) and whether violet reads as "weapon" next to the green carrier outline and the green HUD bars.
- Gallery redesign (local tool, not in git): one card per creature / shape; dropdowns for animation (direction) and colour / style; tight crops; compact header. Details in art-packs/CATALOG.md.

## 2026-11-20 v1.9.1: green weapon potion with glow and rays (branch v1910-green-potion)
- Omri: tint the violet potion green, add a glow and light rays like the coins. The potion's violet colours (hue 225-335 degrees) are turned to green (-150 degrees) once at start in a recoloured copy (makeHueSheet), so it also works in CANVAS; the cork and ribbon keep their own colour (a first try shifted everything and made the cork blue). Config: sprites.weaponGem.hueShift / hueRange.
- Shine: a soft green glow of 3 flat rings (added as light, flickers in steps) and 8 spinning rays (3 pictures swapped 6 per second) behind the falling potion; config sprites.potionShine. One potion at a time has it (the first on screen).
- Verified in the browser: the potion shows green with glow and rays. UNVERIFIED on the phone: glow and ray strength, and that it stands out from the green carrier outline.

## 2026-11-20 v1.9.2: heart pickup shine (branch v1920-heart-shine)
- From Omri's gallery recipe (plump-heart, lit, glow + rays + bob, yellow): the falling heart pickup now has a soft yellow glow and 8 spinning rays behind it (config sprites.heartShine; same stepped pixel look as the potion and coin) and every heart bobs while it falls (its fall speed swings +-14 px/s, about 1 swing per 1.25 s). One glow + rays at a time (the first heart on screen). Verified in the browser: the heart shows with yellow glow and rays; its fall speed swings 36 to 63 px/s around the base 50.
- PARKED (Omri: "start out aside, we'll find a use for it"): power-star recipe = power-star, Idle_South, 32px, lit; effects glow, rays, colour yellow. Not built. The loot pack's own layers (shadow, glow, shine, outline) are chips in the gallery.
- UNVERIFIED on the phone: ray and glow strength, how the bob feels.

## 2026-11-20 v1.9.3: colour roles (branch v1930-colour-roles)
- Colour roles (Omri, from the readability talk): the player's side is COOL (blue shot, blue potion), danger is HOT (enemy shots hot pink), coins gold, hearts pink-white. The ghost stays mint, the wisp orange, carrier outlines green / pink.
- Witch shot: the orange fire strip is turned blue (config.bullet.fire.hueShift 195, a recoloured copy made at start, so it also works in CANVAS). The muzzle burst is blue too.
- Weapon potion: violet turned to blue and a bit darker (hueShift -70, valueMul 0.82, hue range 225-335); its glow and rays are blue.
- Enemy shots: new 7x7 picture with a white core, hot-pink rim and dark plum outline, drawn at scale 2 (config.enemyBullet.scale); hit size unchanged (3). The old red picture letters (e, h, q) stay in the palette but are unused.
- Heart glow and rays: pink-white (was yellow).
- Rays (coin, potion, heart): now tapered wedges 4 px wide at the base instead of 1 px lines (config coinShine / potionShine / heartShine: width, inner, rayColor; shared drawRays()).
- NOT done (Omri's step 5, later): a subtle warm-dark glow behind every enemy; the carrier outline must stay stronger.
- Verified in the browser (stage dropped items): shots blue, potion dark blue with blue glow, heart pink-white glow, coin rays wider, enemy bullet pink with white core. UNVERIFIED on the phone: enemy bullet size (14 px) and readability, ray width.

## 2026-11-20 v1.9.4: pack enemy shot, rays widen outward, lighter potion (branch v1940-enemy-shot-art)
- Omri: my 7x7 enemy shot was just a big chunky one with few pixels. Now the enemy shot is the red orb of the pack "Shmup Shots, Explosions and Pickups 16x16" (capttainjack; 24 shots: orb, bolt, bullet, ring x red, orange, yellow, green, cyan, magenta; licence = use freely, no reselling or re-sharing the assets; credit in CREDITS.md and a licence copy in assets/shots). One picture: assets/shots/orb-red.png, 16x16 at scale 1, hit size still 3. Config enemyBullet.file; remove it for the code-drawn pink orb. Other colours / shapes are in art-packs/effects-vfx/shmup-effects-pack (the pack also has pickups, explosions, muzzle and spark pictures).
- Rays (coin, potion, heart): reversed taper: 1 px next to the sprite and wider outward (about 4 px at the tip), as Omri asked.
- Potion: less dark (valueMul 0.82 -> 0.95).
- PARKED (Omri: "put it to the side, don't work on it now"): some elements such as explosions stay on the pause screen and the game over screen. We need a way to tell "world" things from "effects that should stop or clear". Not worked on.
- UNVERIFIED on the phone: the orb's size next to the shots and the ghost; ray width.

## 2026-11-20 v1.9.5: wedge rays, orb size bug, saturated potion with twinkle (branch v1950-rays-wedge)
- BUG found: cullOffscreen's "gentle swell" (feel.enemyShotPulse) reset every enemy shot to PX (3x) each frame, so the shot's own scale was ignored: the 16 px orb showed at 48 px (and the earlier 7x7 pink one at 21 px). The swell now works around the shot's own scale. Orb scale set to 1.5 = 24 px = half of what Omri saw (config enemyBullet.scale).
- Rays are now true wedges rasterised to whole pixels (like the gallery's smooth ones): 2 px wide next to the sprite, 6 px at the tip, opacity fading to 0.2 at the tip (config widthStart / widthEnd / alphaEnd per shine: coinShine, potionShine, heartShine).
- "Taper doesn't bob with the coin": I read it as the rays lagging behind the coin. The shine objects were positioned in update(), BEFORE physics moved the sprites (one frame behind, noticeable on fast / magnet coins). They now follow in a postupdate listener (this.shinePost). Verified lag 0 in a test. If Omri meant something else (rays should bob / pulse), ask him.
- Potion: blue more saturated (satMul 1.4), plus a white twinkle every 1.1 s like the coin and the gallery recipe (config potionShine.glint*). Glow and rays were already there.
- Gallery rays look better because they are smooth CSS wedges; the game rays are whole pixels, now shaped the same way.
- UNVERIFIED on the phone: ray look at full speed, orb size (24 px).

## 2026-11-20 v1.9.6: heart recipe, no shot pulse, slower shots (branch v1960-heart-recipe)
- Enemy shot swell off (feel.enemyShotPulse 0): Omri did not like it.
- Heart pickup follows his gallery recipe (plump-heart, lit + outline, rays, bob, twinkle, pink): the glow is removed, rays are pink, a white twinkle every 1.1 s, the bob stays. config.sprites.heartShine (glow key removed).
- Rays: tip width 6 -> 5 px. Ray geometry now starts at the sprite's edge so they look alike on coin, potion and heart: coin inner 8 / radius 15, potion 13 / 20, heart 11 / 17 (before, the potion's rays barely stuck out past its big sprite, so they looked different).
- Witch shot speed z(620) -> z(520) (about 16% slower). The shot strip is the SMOOTH version of the fire pack (12 frames at 24 fps = double the frames of the original 6 at 12 fps).
- Verified in the browser: heart without glow and with pink rays, coin and potion rays stick out about the same. UNVERIFIED on the phone: shot feel at the lower speed, twinkle look.

## 2026-11-20 v1.9.7: pickups above the colour wash, rays from the centre (branch v1970-pickups-above-tint)
- Omri: the potion looks dim. Cause: the colour wash (tint rectangle, depth 33) lay over everything below enemy shots, and pickups were at depth 0, so coins, hearts and the potion were washed (swamp teal) and dimmed. Now pickups and their shine pictures draw at config.pickup.depth 34 (above the wash, below enemy shots at 35).
- Rays now start at the middle of the sprite (inner 1) and reach further (coin 20, potion 26, heart 24 px), opacity 0.8 (was 0.55); potion glow rings stronger; potion value 1.0 (was 0.95). Closer to the gallery preview, which is the CSS approximation: smooth wedges and a drop-shadow glow, shown with no tint over them.
- Shots (answer to Omri): witch shot = SovDigital "Free Projectile Effects" fire, flight_smooth north row, 12 frames of 8x22 at 24 fps, turned blue by hue shift; enemy shot = red orb (capttainjack "Shmup Shots" pack, 16x16); muzzle burst = code-drawn pixels (blue); impact sparks = code squares.
- UNVERIFIED on the phone: whether the rays are now too long or too bright (they are big in the preview screenshot): tune coinShine / potionShine / heartShine radius and alpha.

## 2026-11-20 v1.9.8: witch shot = Fox shot 6, colour 5 (branch v1980-fox-shot, includes v1.9.7)
- Omri picked "Fox shot 6, colour 5" in the gallery (a blue teardrop) as the witch's shot. It is now one picture (assets/shots/fox-shot-6.png, 13x19 with 1 px of space, cut from the FoX71 sheet) drawn at scale 2 (26x38 px), hitbox 6x14, no animation. The old fire strip (assets/fx/fire-shot.png, blue via hue shift) is unused; to get it back set bullet.fire to { file 'fx/fire-shot.png', frameW 8, frameH 22, frames 12, fps 24, scale 2, hitW 6, hitH 16, hueShift 195 }. Credit FoX71 in CREDITS.md (the pack requires it). Verified: 6 shots on screen, about 64 px apart, 26x38 px. This branch also carries v1.9.7 (pickups above the colour wash, rays from the centre), which was not pushed yet.
- UNVERIFIED on the phone: how a static teardrop looks flying (the fire strip flickered), the size, the spacing at the slower speed.

## 2026-11-20 v1.9.9: shorter rays, front coin shine, smaller witch shot (branch v1990-shorter-rays)
- Omri: witch shot too big -> scale 2 -> 1.5 (19x28 px). Rays too long -> coin radius 20 -> 14, potion 26 -> 19, heart 24 -> 17 (still starting at the sprite centre, 2 to 5 px wide).
- Coin shine: only ONE coin has it at a time (by design, so a chest spill shows one). It is now the coin in FRONT (lowest on screen), and it keeps the shine until it is gone or another coin is more than 10 px further down; before it was simply the first coin in the pool. Verified with 6 coins: the target is the lowest one.
- UNVERIFIED on the phone: shot size, ray length.

## 2026-11-20 v1.9.10: potion tweaks, slower smaller shot (branch v1991-potion-tweaks)
- Witch shot: 10% smaller (scale 1.5 -> 1.35, 17.5 px wide) and 20% slower (speed z(520) -> z(416)).
- Rays: 1 px wide at the centre (widthStart 2 -> 1), still 5 px at the tip.
- Potion: more teal (hueShift -70 -> -85) and tilted 15 degrees to the right (sprites.weaponGem.angle; the glow and rays stay upright).
- Potion pickup ring: the old ring was a 9 px picture scaled up to 54 px, so its line was about 6 px thick. Now a thin ring (2 px) drawn at its full size that starts at a quarter of its size and grows to 76 px, in teal (config feel.potionRing: diameter, thick, color; remove the key for the old green ring). The spark burst and the level-up flash on the witch are still green: say if they should turn teal too.
- Verified in the browser: potion tilted and teal, thin ring grows around the witch, shot 17.5 px. UNVERIFIED on the phone: shot feel at the slower speed, ring size.

## 2026-11-20 v1.9.11: every coin has the shine (branch v1911-all-coins-shine)
- Omri: coins dropped by an enemy or a box should ALL have the glow and spinning rays, not just one. Every coin on screen now gets its own rays and twinkle (one picture pair per coin, made when needed; each coin twinkles at a slightly different moment). The old "front coin only" rule is gone.
- Omri also said: the green sparks and level-up flash stay colourful (not teal). Nothing changed there.
- NOT done: the heart's pack shine layer (outline_shine) is still missing; waiting for Omri's go.
- UNVERIFIED: not run in the browser (the preview pane would not open), so nothing was seen on screen. Check on the phone: a chest spill shows rays on every coin, and it does not slow the game.

## 2026-11-20 v1.9.12: heart gets the pack's shine layer (branch v1912-heart-shine, includes v1.9.11)
- The pack's "outline shine" layer (glints and highlights crossing the heart) is now drawn over the falling heart's Idle loop, frame by frame (assets/pickups/heart-shine.png, same 26x62 cut as heart-idle, which was checked to match the pack pixel for pixel; config sprites.heartPickup.shine, remove the key to hide). Every falling heart gets it (a small overlay per heart). The white twinkle cross, pink rays and bob stay.
- UNVERIFIED: not seen running yet; check on the phone that the glints are visible and do not look messy next to the white twinkle (if so, remove the twinkle: heartShine.glintMs 0).

## 2026-11-20 v1.9.13: fainter ray tips, slower witch shot (branch v1913-taper-shot-speed)
- Ray tip opacity halved (alphaEnd 0.2 -> 0.1 on coin, potion and heart rays).
- Witch shot 20% slower (speed z(416) -> z(333)).
- UNVERIFIED on the phone: ray look, shot feel and spacing at the slower speed.

## 2026-11-20 v1.9.14: rays half as bright (branch v1914-ray-opacity)
- Omri meant the WHOLE ray, not only the tip: ray opacity 0.8 -> 0.4 on coin, potion and heart (config alpha in coinShine / potionShine / heartShine). The tip fade is back to alphaEnd 0.2 (v1.9.13 had halved it to 0.1; that is undone). Potion glow rings unchanged.
- UNVERIFIED on the phone: whether 0.4 is the right strength.

## 2026-11-20 v1.9.15: tune panel gets tabs, Look and Pickups (branch v1915-tune-tabs)
- Tune panel (?tune=1, or tap the menu version 5 times) now has 3 tabs: STICK (as before), LOOK (coin / heart / potion ray brightness and length, shot size, shot speed, ray tip fade) and PICKUPS (heart / potion / coin fall speed, magnet range and speed, grab size, heart bob, potion tilt). Rows are now config paths (src/tune.js TABS).
- Ray length and tip fade redraw the ray pictures live: the ray pictures are now one fixed size (RAYS_MAX 40 px from the centre) and PlayScene.rebuildRays() draws them again. Ray look at the default numbers should be unchanged.
- COPY now puts only the numbers you changed on the clipboard, one line, e.g. `sprites.coinShine.alpha = 0.3, bullet.speed = 300`; paste it to Claude. RESET puts every tab back.
- New drops use the new fall / grab / tilt numbers; things already falling keep the old ones.
- Checked: all 25 config paths exist and are numbers; both files pass a syntax check. UNVERIFIED: nothing was seen on screen (the browser preview would not open), so the panel layout (3 tabs, 9 rows on LOOK) and the live ray redraw are untested.

## 2026-11-20 v1.9.16: clearer tune labels (branch v1916-clear-labels)
- Omri asked what HEART LENGTH / COIN LENGTH meant. Renamed: COIN/HEART/POTION RAYS -> BRIGHT, LENGTH -> LONG (how far the spinning light beams reach), RAY TIP FADE -> BEAM TIP FADE, and the stick rows are now STICK SPEED, STICK SIZE, DEAD ZONE, STICK CURVE, STICK SNAP, STOP GLIDE, STOP SETTLE, STOP DAMPING. A one-line hint sits under each tab (LOOK: "BEAMS = SPINNING LIGHT LINES"; PICKUPS: "NEW DROPS ONLY").
- UNVERIFIED: not seen on screen; check that no label touches its number and the hint fits the panel.

## 2026-11-20 v1.9.17: HARD tab in the tune panel (branch v1917-difficulty-tab)
- New 4th tab HARD with five dials, all 1.00 = normal (config.difficulty): ENEMY HEALTH (x enemy hp), ENEMY SPEED (x how fast they fly their path), SHOT SPEED (x enemy shot speed), SHOT DELAY (x time between enemy volleys; more = they shoot less), MY DAMAGE (x the witch's shot damage). Health and speed apply to enemies that appear after the change; the other three apply at once.
- Left out on purpose: wave spawn timing (needs the wave schedule changed; say if you want it) and "jump to wave / god mode" (idea 4, not built).
- Normal play is unchanged (all dials 1). COPY lists changed values, e.g. `difficulty.enemyHp = 1.5`.
- Checked: 30 tune paths exist; syntax checks pass. UNVERIFIED: not seen on screen or played; check the 4 tabs fit in the panel, and that each dial changes the game the right way.

## 2026-11-20 v1.9.18: SHOT GAP dial linked to shot speed (branch v1918-shot-gap)
- Omri: a slower shot did not give bigger gaps between shots (the shots fire on a fixed timer, so slower = closer together). New LOOK row SHOT GAP (config bullet.gap, 1 = normal). The time between volleys is now fireRateMs x gap x refSpeed / speed, so changing only the SHOT SPEED keeps the spacing the same (a slower shot also fires less often, a faster one more often) and SHOT GAP changes the spacing: more = bigger gaps and fewer shots. At the defaults (speed = refSpeed, gap 1) nothing changes.
- Side effect to know: damage per second now follows spacing (bigger gap = fewer shots = less damage; slower speed with the same gap = fewer shots too). MY DAMAGE on the HARD tab can balance it.
- UNVERIFIED: not seen or played (the browser preview would not open). Check the spacing and feel on the phone.

## 2026-11-20 v1.9.19: wider tune rows, longer names (branch v1919-wide-tune-rows)
- Omri: free space on the right of the tune panel. The - and + buttons moved to the right edge, the value sits next to them, and every row has a longer plain name (up to 20 letters), e.g. COIN BEAM OPACITY, COIN BEAM LENGTH, WITCH SHOT SPEED, GAP BETWEEN SHOTS, ENEMY SHOT DELAY (X), PICKUP GRAB SIZE. Hints reworded.
- UNVERIFIED: not seen on screen (the browser preview would not open). If a long name touches its number, tell me which one.

## 2026-11-20 v1.9.20: one shared shine for every drop (branch v1920-shared-drop-shine)
- Omri: glow and beams should be the same on all drops, with the same glow on all, and the potion's glow was 50% too big. Now coin, heart and potion share ONE look (config SHINE at the top of config.js): beam length 17, width 1 to 5 px, opacity 0.4, tip fade 0.2, and a soft glow of 3 flat rings. Only the colours (rayColor, glowColors) and the twinkle spot differ per drop. Every drop on screen has beams + glow + twinkle (before: coins had no glow, only the first heart/potion had a shine).
- Glow: now on coins and hearts too. glow.size 0.67 (the potion's glow shrinks to two thirds, since it was 1.5x too big). glow.opacity 1.
- Tune panel LOOK tab: the per-drop beam rows are replaced by shared rows that change all three drops at once: DROP BEAM OPACITY, DROP BEAM LENGTH, BEAM TIP FADE-OUT, DROP GLOW SIZE, DROP GLOW OPACITY (then witch shot size, speed, gap).
- Code: beams and glow are fixed-size canvas pictures redrawn by rebuildRays() (a CanvasTexture needs getContext() + refresh(); the first version used a source .canvas that Phaser does not have, found before the push). One pool of beams + glow + twinkle per drop kind (updateShine), replaces the old coin / heart / potion specific code.
- Side effects: potion beams are shorter now (19 -> 17), coin beams longer (14 -> 17).
- UNVERIFIED: never run (the browser preview would not open). RISK: a code mistake here could stop the game from starting; if the menu or game will not load, tell me at once and I revert to v1.9.19.

## 2026-11-20 v1.9.21: TEST tab in the tune panel (branch v1921-test-tab)
- Idea 4 from the tune-tool list. New 5th tab TEST with: START AT WAVE (1-10), START WEAPON LEVEL (-1 = by wave as before, else 0-10) and NO DAMAGE (1 = ON, works at once), plus a RESTART button that plays the stage again with those numbers; the other tuned numbers stay (scene restart, no page reload). Same as ?wave= and ?god=1 but on the phone. The tab PICKUPS is now called DROPS (5 tabs need short names). config.testing = { wave: 1, level: -1, god: 0 } = normal play.
- Bosses are not in the game yet, so there is no "jump to boss"; waves only.
- Checked: 32 tune paths exist, syntax passes. UNVERIFIED: not run (preview would not open): the 5 tabs fit, RESTART really restarts while the panel is open, no-damage works.

## 2026-11-20 v1.9.22: Omri's tuned numbers (branch v1922-tuned-numbers)
- From the tune panel COPY: stick.stopDamping 0.8 -> 0.5; shared drop shine: beam opacity 0.4 -> 0.2, beam length 17 -> 13, glow size 0.67 -> 0.52, glow opacity 1 -> 0.6 (SHINE in config.js, applies to coin, heart and potion); witch shot size 1.35 -> 1 (13x19 px).
- UNVERIFIED on the phone: how it all looks together.

## 2026-11-20 v1.9.23: size multiplier per drop (branch v1923-drop-size-mul)
- Omri: the beams and glow can not be exactly the same on every drop, because the potion is a bigger picture than the coin. Each drop now has a sizeMul that scales its beam length and its glow: coin 1, heart 1.25, potion 1.5 (config sprites.coinShine / heartShine / potionShine .sizeMul; the shared numbers stay shared). Tune panel LOOK tab: new rows HEART BEAM+GLOW X and POTION BEAM+GLOW X. I read Omri's "1/5" as 1.5; change it in the panel if he meant something else.
- New art file added by Omri: Fire Pixel Bullet 16x16 (bdragon1727), moved from the repo root into art-packs/effects-vfx/bdragon-fire-bullet-16x16/ (git-ignored) and listed in CATALOG.md; licence not checked yet, not used in the game.
- UNVERIFIED: not run (preview would not open).

## 2026-11-20 v1.9.24: separate beam and glow multipliers, faster heart, tidier panel (branch v1924-beam-glow-mul)
- Omri: potion beams looked much longer than the coin's while the glow was fine; he set the potion multiplier to 1.15. One multiplier moved both, so it is split: beamMul (beam length) and glowMul (glow size) per drop. Coin 1 / 1, heart 1.1 / 1.25, potion 1.15 / 1.5 (his 1.15 now goes to the potion beams, the glow keeps 1.5). Old key sizeMul is gone.
- Heart pickup animation quicker, 50%: idle 12 -> 18 fps, drop 14 -> 21, collect 14 -> 21. The hearts in the top bar use the same idle loop, so they speed up too; the pack's shine layer follows the idle frames.
- Tune panel: Omri could not see the two rows I added last time (names with "+" in them, or crowded). The four multiplier rows now sit on the DROPS tab with plain names (HEART / POTION BEAM LENGTH X, GLOW SIZE X); LOOK is back to 8 rows. Rows are 15 px high now (were 17) so 12 rows fit.
- UNVERIFIED: not run (preview would not open). Check the DROPS tab shows 12 rows and fits.

## 2026-11-20 v1.9.25: potion = blue round flask, simple tune panel (branch v1925-flask-simple-tune)
- Weapon potion is now the round blue flask of the Alchemy pack (Frakassets, 64 px, no outline, lit; assets/pickups/potion-flask.png, 24 frames at 12 fps, scale 0.45, no tilt: config sprites.weaponGem). The old violet potion picture is no longer used (file left in assets/pickups) and so is the hue shift. Glow, beams and twinkle stay (blue). Credited in CREDITS.md. The strip is 1536x64 (about 25 KB).
- Omri's tuned numbers (his message): tip fade 0.2 -> 0.25, heart glow x1.05, potion beam x1.1, potion glow x1.05. They are now plain per-drop numbers: coin radius 13, glow 0.52; heart radius 14, glow 0.55; potion radius 14, glow 0.55 (beam opacity 0.2, glow opacity 0.6 for all). The multipliers beamMul / glowMul are gone; every drop has its own numbers and its own glow object.
- Tune panel redone to be simpler (Omri: options repeated and confused): 5 tabs. STICK. SHOT (witch shot size, speed, gap, my damage). DROPS has a "WHICH DROP" button (coin / heart / potion, tap to switch) and below it that drop's own beam length, beam opacity, tip fade-out, glow size, glow opacity, fall speed, plus magnet range and speed (coin), bob (heart) or tilt (potion), and the grab size (all drops). ENEMY (health, fly speed, shot speed, shot delay). TEST (start wave, weapon level, no damage, RESTART). No shared rows, no multipliers.
- UNVERIFIED: never run (preview would not open): the flask look and size next to the coin, that the beams and glow sit right on the bigger picture, the DROPS tab switch. Omri's COPY output will now use paths like sprites.potionShine.radius.

## 2026-11-20 v1.9.26: potion bobs, effects lower, Omri's numbers (branch v1926-potion-bob)
- Omri's tuned numbers: coin fall speed 50 (was 45), potion fall speed 67 (was 65), potion tilt 25 degrees (was 0).
- The potion bobs like the heart: its fall speed swings +-14 px/s about once per 1.25 s (config sprites.potionShine bobAmp 14, bobSpeed 5; tune: DROPS > POTION > BOB AMOUNT).
- Beams, glow and twinkle can now be moved up or down per drop (config sprites.<drop>Shine.offsetY, tune row EFFECTS MOVE DOWN on the DROPS tab). The potion's is 3 px (the flask's cap makes it look taller than its middle); coin and heart 0.
- UNVERIFIED: never run (preview would not open): the 3 px guess may need tuning, and how the bob looks with the tilt.

## 2026-11-20 v1.9.27: potion and heart animation at 8 fps (branch v1927-slower-anim)
- Omri: the potion's first animation looked smoother; both should play at 8 fps. Potion flask 12 -> 8 fps. Heart idle loop 18 -> 8 fps (the v1.9.24 speed-up is undone; the top-bar hearts and the pack's shine layer share that loop, so they slow down too). Heart drop and collect go back to their original 14 fps.
- UNVERIFIED on the phone: how the flask and heart look at 8 fps (config sprites.weaponGem.fps, sprites.heartPickup.idle.fps).

## 2026-11-20 v1.9.28: only the front coin of a stack has the shine (branch v1928-coin-stack-front)
- Omri: coins from a chest spill stack and their effects pile up on top of each other. Now a coin has no beams, glow or twinkle when another coin is closer than 14 px and lower on screen (in front of it): only the front coin of each stack shines. Coins that are apart still all shine (v1.9.11 stays). config sprites.coinShine.groupPx 14 (0 = every coin shines again); tune: DROPS > COIN > STACK: SHINE FRONT COIN. Applies to coins only (hearts and potions come one at a time).
- UNVERIFIED: not run (preview would not open). 14 px is a guess: the beams are 13 px long, so a spill spread wider than 14 px may still overlap a little: raise the number.

## 2026-11-20 v1.9.29: potion no longer bobs (branch v1929-no-potion-bob)
- Omri: remove the bob from the potion. sprites.potionShine.bobAmp 14 -> 0 (the potion falls at its steady speed again; the tune row DROPS > POTION > BOB AMOUNT can bring it back). The heart still bobs.

## 2026-11-20 v1.9.30: soft walls, the witch slows near the edges (branch v1930-edge-slow)
- Omri: she should move slower near the edges and not fly to them so quickly. New in the stick control: when she flies TOWARD a wall she slows down smoothly inside config stick.edgeZone (50 px) of it, down to stick.edgeSpeed (0.35 = 35% of her speed) at the wall. Flying away from a wall or along it is not slowed. It only changes how far she moves each frame; the stick, the glide and the spring are untouched. edgeSpeed 1 or edgeZone 0 = off. Tune panel: STICK tab, EDGE SLOW-DOWN ZONE and SPEED AT THE WALL (X).
- Less finger travel (Omri does not want to drag far): that is the existing STICK CIRCLE SIZE (stick.radius 47): a smaller circle reaches full speed with a shorter drag.
- UNVERIFIED on the phone: all of the feel (zone size, how slow at the wall).

## 2026-11-20 v1.9.31: controls reset to RELATIVE DRAG with soft walls (branch v1931-relative-drag)
- Omri: swiping to reposition is easier than the ring stick; with the thumb down the witch sometimes went up by itself; he wanted slower near the edges and less finger travel; "reset the controls to what you think is best". Decision: config ship.controls "stick" -> "drag" (relative drag, the way most phone shooters work). The stick code is still there (?ctl=stick or ship.controls "stick").
- How it works now: touch anywhere. The witch moves by the finger's movement x dragSensitivity (1.2). Nothing pulls her toward the finger: the old "glue" that slid her to the spot 45 px above the finger is gone (that was the likely cause of her drifting up while the thumb rested). Touch dead zone: after the thumb lands it must move 4 px (ship.dragSlopPx) before she follows, so a resting or rolling thumb does nothing. Soft walls (v1.9.30) work in drag too: flying toward a wall inside 50 px she slows to 35% (stick.edgeZone, stick.edgeSpeed). She still eases toward her target with the light weight (ship.followRate 28). Lift and touch again anywhere to reposition.
- Tune panel: the first tab is now MOVE and shows the drag rows (FINGER TO WITCH X, WITCH WEIGHT (LAG), TOUCH DEAD ZONE, EDGE ZONE, SPEED AT THE WALL) when controls is drag, or the stick rows when it is stick.
- Desktop browsers still follow the mouse automatically (unchanged).
- UNVERIFIED on the phone: all the feel (gain 1.2, dead zone 4 px, edge zone). First things to tune: FINGER TO WITCH and the edge numbers.

## 2026-11-20 v1.9.32: overshoot and slow settle (branch v1932-overshoot-settle)
- Omri: she should overshoot his finger a bit and slowly come back, but move quickly again as soon as he moves. In drag mode the witch is now on a spring (config ship.spring). While the finger moves: stiff and calm (fastW 44, fastZ 0.9 = quick catch-up, about 3 px behind per 100 px/s of finger speed, no bounce). When the finger rests for idleMs (50 ms) or is lifted: soft and bouncy (slowW 5, slowZ 0.5): she coasts a little past the target and drifts back in about 0.75 s. Moving the finger again switches to the quick spring at once. spring: null in the config = the old easing.
- Checked by a small simulation (not on the game): a 300 px/s swipe that stops gives about 10 px overshoot and is back within 1 px after about 0.75 s; a fast 600 px/s swipe about 20 px. Tune panel MOVE tab: CATCH-UP STRENGTH, SETTLE STRENGTH (lower = lazier), BOUNCE (lower = more overshoot), REST DELAY (MS). The old WITCH WEIGHT row is gone (the spring replaces it). The stick mode and the desktop mouse keep the old easing.
- UNVERIFIED on the phone: whether 10 px is "a bit", and that the catch-up feels as quick as before.

## 2026-11-20 v1.9.33: no overshoot after lifting the thumb (branch v1933-overshoot-thumb-down)
- Omri: swiping made the witch overshoot, which is not wanted; he meant the overshoot while the thumb stays DOWN. Now the soft bouncy spring is used only when the thumb is down and has rested for 50 ms. When the thumb is lifted (the end of a swipe) the quick calm spring is used, so she stops where the swipe put her (under 1 px of overshoot). Moving the finger again is quick as before.
- UNVERIFIED on the phone: that a swipe now ends cleanly and the thumb-down overshoot still feels right.

## 2026-11-20 v1.9.34: fix for v1.9.33 (branch v1934-fix-syntax)
- v1.9.33 had a typo (a comment swallowed part of a line in PlayScene.js moveShip) that stops the game from loading. v1.9.34 fixes it; it was live for a few minutes. Every file under src/ now passes a syntax check before pushing; from now on a push only happens if all the checks pass.

## 2026-11-20 v1.9.35: new app icon, the light blue is gone (branch v1935-new-icon)
- Omri still saw light blue now and then when updating. Searched the code: the page, the game canvas and the menu are all dark (#000 / #14161f / dark purple sky). The old light blue only lived in (1) icon.svg, still the OLD blue-sky jet icon (#2a7bd8 and #6fb4f2): the home-screen app shows the icon on its start-up (splash) screen, which is most likely what he saw when updating; (2) config background.skyTop / skyBottom, only used by the old ?bg=sky mode (not the default). Icon replaced by a pixel witch hat on the dark game colour (#14161f). The sky colours are left (only the ?bg=sky test mode).
- Android keeps the icon saved from when the app was added to the home screen: Omri may need to remove the home-screen app and add it again (or clear its data) to see the new icon. UNVERIFIED: not seen; this is my best guess for what he saw. If light blue still shows, tell me exactly when (opening the app, pressing UPDATE, entering a stage).

## 2026-11-20 v1.9.36: more rope for the witch (branch v1936-more-rope)
- Omri: "more rope". Read as a looser leash: she trails the finger a bit more and swings further before settling (ship.spring: fastW 44 -> 36, fastZ 0.9 -> 0.85, slowW 5 -> 4.5, slowZ 0.5 -> 0.45). From the small simulation: about 12 px behind the finger at a steady 300 px/s (was 9), about 15 px overshoot when the thumb rests (was 10), back in about 0.8 s (was 0.73).
- UNVERIFIED on the phone. If "rope" meant something else (e.g. she should be allowed to lag behind much further, or hang below the finger), say so. Quick dials in the MOVE tab: CATCH-UP STRENGTH (lower = more rope while moving), SETTLE STRENGTH (lower = slower return), BOUNCE (lower = more swing).

## 2026-11-21 v1.9.37: no floating numbers (branch v1937-no-pop-numbers)
- Omri: remove the numbers after shooting an enemy and picking up coins. config feel.popText true -> false: the floating "+10" / "+5" at kills, coins and a heart picked up at full health are gone. The score at the top still counts and pops. Set popText true to bring them back.
- UNVERIFIED: not run. Check that nothing else (a heart at full health, a chest) still shows a number.

## 2026-11-21 v1.9.38: new main menu, a path of stages (branch v1938-path-menu)
- Omri's mockup: a line goes up the middle of the screen with a stage bubble left or right of it (Forest at the bottom, Swamp above it, Stage 3 at the top), the logo moved to the bottom above UPDATE, a gear in the top right corner. Built: src/scenes/MenuScene.js rewritten (the two big cards are gone); layout numbers in config.menu (path, bubble, gear, settings, lockedFill / lockedBorder / lockedText, logo, decor positions).
- Stage bubbles: name, the 4 medals and BEST score (as the cards had); a tap starts the stage (release on the same bubble). STAGE 3 is faded and says SOON, taps do nothing. Add a stage later by adding a node (and un-lock it) in config.menu.path.nodes.
- Gear (a pixel cog drawn in code) opens SETTINGS: CONTROLS (DRAG or STICK, saved on the phone and used by the game and the tune panel), TUNE PANEL (ON or OFF, the same as 5 taps on the version text), SOUND (greyed SOON: the game has no sound yet), CLOSE. While it is open the rest of the menu ignores taps.
- Omri said the pink button in the mockup is nothing (UPDATE only). The decorations moved: witch and ghost next to the logo, bat at the top (away from the gear).
- Checked with a stand-in for Phaser (a script that runs create() with fake objects): bubbles at the right places, taps start forest and swamp, stage 3 and the rest are ignored while settings are open, the controls button toggles and saves, CLOSE works. NOT checked: how it LOOKS (never run in a browser): sizes, overlaps (path line vs sky art, logo size 1.2, the gear), text fit.
- UNVERIFIED on the phone: all of the look; first things to tune are in config.menu: path.nodes cy, bubbleW / bubbleH, logo y and scale, decor x / y.

## 2026-11-21 v1.9.39: menu tweaks from Omri's screenshot (branch v1939-menu-tweaks)
- The path line and its little arms are now the bubble outline pink (config menu.path.lineColor 0xff5ac8, was a stand-in cream). The coloured tab inside the left edge of the bubbles is gone. Logo bigger (scale 1.2 -> 1.4, y 258), UPDATE lower (top 362 -> 378), the menu witch about twice as big (scale 0.667 -> 1.333, now at x 42, y 250). The gear's teeth now have 8 points (it looked like a plus sign).
- Omri is looking for pixel-art buttons to replace the code-drawn plates (not done; tell Claude the file names when they are in the folder).
- UNVERIFIED: not seen. Possible overlaps: the big witch with the forest bubble and the logo, the logo against UPDATE.

## 2026-11-21 v1.9.40: menu witch in front and bigger (branch v1940-witch-front)
- Omri: the witch should be in front of everything and bigger, like his mockup. Menu decorations can now have a depth (config menu.decor[].depth, default -5 = behind); the witch has depth 30, so she is over the bubbles and the logo. Scale 1.333 -> 1.667 (about 100 px wide), at x 52, y 266.
- UNVERIFIED: not seen; she may cover the bottom of the Forest bubble a little (hat tip) or part of the logo: move her with menu.decor witch x / y / scale.

## 2026-11-21 v1.9.41: pixel-art gold UPDATE button (branch v1941-gold-update-button)
- Omri added a button pack (ok_lavender, free pixel art button pack; licence: free to use anywhere, credit appreciated, not to be sold or redistributed). Moved from the repo root into art-packs/ui-buttons/ok-lavender-button-pack/ (git-ignored, the pack stays local). 8 colours x (normal, clicked, hover), each 48x16 art. Omri picked GOLD for the UPDATE button only (the stage bubbles and the settings buttons keep the drawn plates for now).
- Only 3 pictures are in the game (assets/ui/button-gold-normal / clicked / hover.png, about 290 bytes each); credited in CREDITS.md. The UPDATE button is the picture at scale 2 (96x32), dark brown text; pressed = the clicked picture (sits 2 art px lower); a newer version waiting = the hover picture and NEW VERSION text. Config menu.updateBtn (scale, textColor). If the pictures are missing the old drawn plate is used. UPDATE top 378 -> 372, logo up 6 px (y 252).
- Checked with the Phaser stand-in script (both with and without the pictures): button box, press and the stage tap work. UNVERIFIED: how it looks (text position on the button, overlaps with the logo and the cat / cauldron).

## 2026-11-21 v1.9.42: Fantasy UI pack: parchment settings, copper buttons, medallion gear (branch v1942-catau-ui)
- Omri wanted the parchment (from the catau-games Fantasy UI pack, now in art-packs/ui-buttons/fantasy-ui-catau/) as the settings background and asked to make sense of the buttons. That pack is a complete matching kit (panels, buttons, toggles, icons, 9-slice borders), so the menu now uses ONE family: the gold ok_lavender button is gone (files removed from assets/ui and from CREDITS.md; the pack stays local; it is in git history if wanted back).
- Pictures in the game (assets/ui, 1x, from the pack): ui-panel-parchment (96x96), ui-button-normal / pressed / hover (56x22), ui-gear (settings medallion 24x24). Drawn with Phaser 9-slice (add.nineslice): the 24 px ragged parchment border stays, the middle stretches; the button's 12 px ends stay, the middle stretches.
- Settings now: a dark veil, the parchment, brown text (ink 0x3b2410), copper buttons for DRAG/STICK, ON/OFF and CLOSE; panel y 84, h 230. UPDATE is the copper button 100x22 at y 380 (hover look when a newer version is waiting). The gear is the medallion picture. If a picture fails to load the old drawn plate / cog is used (checked with the stand-in script in both cases).
- NOT done (next): the stage bubbles still use the code-drawn purple/pink plates and do not match yet. The pack has slots (10 px borders), a stone panel, a wood panel with gold corners (24 px borders: too big for the 86x62 bubbles) and a banner; ask Omri which look he wants for the bubbles, and the path line colour.
- Checked: stand-in script (taps, modal, controls toggle, close). UNVERIFIED: how it looks (text on the parchment, button text centring, panel size, the veil).

## 2026-11-21 v1.9.43: wood stage bubbles (branch v1943-wood-bubbles)
- Omri: try the wood. The stage bubbles are now the pack's wood panel (the locked Stage 3 uses the stone panel), 9-slice with the 24 px ornate border, 100x68 (was 86x62 plates). Name sits in the top edge between the two corner gems, medals in the middle band, BEST in the bottom edge. Pressed = a slightly darker panel, 1 px lower. The path line and its arms are gold (0xf2b632) to match the gold corners. Old drawn plate stays as the fallback if the picture does not load. Added assets/ui/ui-panel-wood.png and ui-panel-stone.png (credited; CREDITS.md updated).
- UNVERIFIED: how it looks. Watch: the bubbles are 68 px high with the nodes 71 px apart (3 px gap); text on the wood (cream with dark outline); the 4 medals fit between the corner gems.
- Font (Omri does not like it): asked him what he wants; not changed.

## 2026-11-21 v1.9.44: new pixel font everywhere (branch v1944-pack-font)
- Omri did not like the old font and picked the UI pack's own pixel font, everywhere. The pack only has a glyph picture (pixel_font.png, 16 x 10 cells of 6x11, 150 glyphs; the charmap CSV its README mentions is not in the download, so the glyph order was read from the picture: A-Z, a-z, 0-9, accents, punctuation). A small script (art-packs/_tools/make-pack-font/make_font.py, local only) turns it into a real font file: assets/fonts/PackFont.ttf (35 KB), so every existing text keeps working (colour, outline, alignment). The font file was checked by loading it in Windows (GDI+) and drawing text: all letters, digits and punctuation render. NOT checked in a browser.
- Sizes: the font is drawn in whole steps only (fpx() in hud.js): any size up to 14 becomes 8 (art pixel = 1 game px, capitals 7 px high), up to 20 becomes 16 (2x), bigger becomes 24 (3x). So text that was 12 is now 8, titles 16 stay 16, big end-screen text is 24. Bold is off for this font (it has no bold; the browser would smear it).
- Safety: PackFont is the first font of the list and GameFont (the old Pixelify) the second, so if PackFont fails to load the old font shows; main.js also switches to the classic sizes in that case. Switches: settings gear > FONT button (PACK / CLASSIC, reloads the page, saved on the phone) and ?font=classic in the address. The tune panel always uses the classic font (its English labels are long).
- UNVERIFIED (never run in a browser): how the text looks at 8 and 16 (thin 1 px strokes with the dark outline), the sizes of everything (HUD score, medals text, end screens, pop-up numbers are off), spacing on the parchment. Expect to tune sizes in fpx() (hud.js) and per text.

## 2026-11-21 v1.9.45: stone stage bubbles (branch v1945-stone-bubbles)
- Omri: try the stone panels. All stage bubbles are now the stone panel (dark bricks, blue corner gems). The locked Stage 3 is the same panel tinted darker (config menu.bubble.lockedTint). One setting picks the look: menu.bubble.panel 'stone' or 'wood' (both pictures are in assets/ui).
- UNVERIFIED: how the cream text reads on the stone, and whether the locked one still looks locked enough.

## 2026-11-21 v1.9.46: bigger font, sharp sizes (branch v1946-bigger-font)
- Omri: make the font bigger. Found a mistake of mine in v1.9.44: PackFont has 11 art pixels per em (not 8), so the sizes 8 / 16 / 24 I chose gave art pixels of 2.2 / 4.4 / 6.5 canvas px: small AND uneven (blurry). Now fpx() (hud.js) works out whole canvas pixels per art pixel: p = round(asked size x config fontScale 0.38), at least 3, and returns 11 x p / 3. Asked 8 -> 11 px text (3 canvas px per art pixel), 10 -> 14.7, 12 -> 18.3, 16 -> 22, 20 -> 29.3, 24 -> 33. So all text is about 1.5 to 2.3 times bigger than in v1.9.44. fontScale is the one number to turn all text up or down (a step at a time: 0.30 = smaller, 0.45 = bigger).
- Sizes inside the menu were set so it still fits: bubble names 10 (-> 14.7), UPDATE text 10, settings labels and buttons 10, hints 8, titles 16.
- UNVERIFIED: not seen. Watch: bubble names against the stone corner gems, CONTROLS label against its button, NEW VERSION inside UPDATE, the HUD score width, the end screens.

## 2026-11-21 v1.9.47: menu witch slower, with a subtle sway (branch v1947-witch-sway)
- Omri: slow the witch animation and add a little sway in all directions, subtle. Menu witch: animation 8 -> 5 fps; up-down bob 1 -> 3 px (3.2 s), new sideways sway 3 px (4.2 s) and a tilt of +-2 degrees (about 2.9 s); the three run at different paces so the path does not repeat exactly. Config menu.decor witch: fps, bob / bobMs, swayX, swayDeg, swayMs (any decoration can use them). Smoke script still passes.
- UNVERIFIED: how it looks; if it is too much or too little change swayX / swayDeg / bob.

## 2026-11-21 v1.9.48: Medieval UI buttons and stage panels (branch v1948-medieval-ui)
- Omri: use the Medieval UI (Doktoresco). Done as he chose: buttons (UPDATE and the settings buttons) and the stage bubbles; the parchment and the gear stay from the catau pack. The Medieval PNGs are exported 64x too big; shrunk 1/64 with nearest-neighbour and trimmed with PowerShell: assets/ui/ui-med-button.png (80x25, long button 8) and ui-med-panel.png (145x44, block 5). The catau copper buttons, wood and stone panels are removed from assets (still in git history; the pack is local).
- Buttons: 9-slice (10 px round ends stay), 25 px high; pressed = darker and 1 px lower (the pack's "touch" pictures are not used); dark brown text. UPDATE 104x25 at y 376 (a newer version waiting = warmer tint).
- Stage bubbles: the tan block panel (9-slice, 6 px border), 100x68, ink-brown text (no outline), a dark strip behind the medals (so the grey pending medals show on the tan), BEST in dark red-brown. Locked Stage 3 = the same panel tinted grey with grey text. config menu.bubble: ink, bestInk, lockedInk, inset, lockedTint.
- Settings: rows adjusted for the 25 px buttons; credits updated (Doktoresco line, catau now only parchment + gear + font).
- UNVERIFIED: how it looks (tan on the stone-grey menu sky, ink text, button text centring, the medal strip).

## 2026-11-21 v1.9.49: purple and pink UI, text centred (branch v1949-purple-ui)
- Omri (from real screenshots): the tan did not fit the game, and the button text sat a little high. The two Medieval pictures use only 3 colours, so they were recoloured with a pixel swap (a script, files overwritten in assets/ui): fill -> the game's purple (0x3b1478), outline -> pink (0xff5ac8), shadow -> dark violet (0x1a0830); the panel also got a 2 px pink border all round (the original only had corner ticks). Text on them is cream (0xfff3c4) with the dark outline again (as the old plates had); BEST is cyan; the medal strip is dark violet; the locked Stage 3 is the same panel dimmed with grey-violet text. A newer version waiting: UPDATE text turns orange (it used a tint before, which went muddy on purple).
- Button text: it was centred by its line box, which puts the capitals high (the font has room for accents above). Labels are now 2 px lower (y = middle of the button, was 2 px above it).
- Parchment and gear unchanged.
- UNVERIFIED: how it looks on the phone; the text position on the buttons (1 to 2 px either way) is the thing to check.

## 2026-11-21 v1.9.50: panel restored, recolour = colour swap only (branch v1950-panel-fix)
- Omri: the v1.9.49 panels were ruined; "don't change any pixels when recolouring". In v1.9.49 I had painted an extra 2 px pink border onto the panel. The panel is now rebuilt from the pack's untouched picture (block 5, shrunk 1/64) with ONLY the 3-colour swap (fill -> purple, outline -> pink, shadow -> dark violet); checked: the transparency of every pixel is identical to the original, no pixel added, moved or removed. Same check for the button (0 differences). The panel has only the pack's own little corner marks (now pink) and no border; if it needs more contrast against the sky, change the colour map (fill lighter, for instance), not the pixels.
- UNVERIFIED: how it looks.

## 2026-11-21 v1.9.51: the phone kept the old panel picture (branch v1951-fresh-ui-pictures)
- Omri's screenshot on 1.9.50 showed the thick pink border of v1.9.49. The file in assets/ui was already the right one (checked); his phone kept an old copy of the picture because its file name did not change (the UPDATE button only refreshes the code files, not pictures). The menu now loads the UI pictures with ?v=<version> added, so every new version loads them fresh. Other pictures keep their names: if one is ever changed in place, rename it or add the same ?v= when loading.

## 2026-11-21 v1.9.52: gold panel corners, bigger logo, UPDATE lower (branch v1952-gold-corners-logo)
- Omri: the panel's pink corner marks should be the gold of the middle line. Colour swap only (outline -> 0xf2b632, the path line colour); the transparency of every pixel is identical to the original (checked). The button keeps its pink outline.
- Logo scale 1.4 -> 1.7 with the top fixed (y 252), so it grows down toward UPDATE; UPDATE top 376 -> 384; version text a little lower (versionBottom 12 -> 9).
- Omri also asked about a scrollable stage path with a fade near the witch's hat. Not built: with 3 stages nothing needs to scroll. Plan for when there are 4 or more stages: drag up/down on the path area, a little inertia, the bubbles and line fade out towards the bottom (about the hat height, y 215) and the top; medium size (one version). Say "build the scroll" then.
- UNVERIFIED: how the logo and UPDATE sit now (the logo may touch UPDATE; tune menu.logo.scale and menu.updateTop).

## 2026-11-21 v1.9.53: smaller UPDATE, ghost twice as big, cat in front (branch v1953-update-ghost-cat)
- Omri (screenshot of 1.9.52): shrink UPDATE, make the ghost 2 times bigger, something blocks the cat. UPDATE button 104 -> 80 px wide (the picture's own width, so nothing is stretched; its height stays 25 because the pixel art can not be shrunk evenly) and its text size 10 -> 8 (drawn at 11 px) so NEW VERSION still fits. Ghost scale 1 -> 2, at x 198, y 236. Cat and cauldron now have depth 25 (in front of everything in the sky): the thing over the cat's ears was most likely one of the lilac bats of the animated sky art; I could not see it move, so if it is still there, tell me exactly what it is.
- UNVERIFIED: not seen.

## 2026-11-21 v1.9.54: the four animated friends are the foreground (branch v1954-foreground-sprites)
- Omri: the 4 animated sprites (witch, ghost, cat, cauldron) are the foreground; nothing may be in front of them. They now all have depth 50 in config.menu.decor (the bubbles, logo, UPDATE button, gear and texts are at 0; the animated sky is at -10). The settings panel (depth 99 / 100) is still above them on purpose (it opens over the whole menu).

## 2026-11-21 v1.9.55: menu pop: logo glint and float, glowing path, spark, pulse, slide-in (branch v1.9.55 = v1955-menu-pop)
- Omri agreed to ideas 1, 2 and 3. Built (all in src/scenes/MenuScene.js, numbers in config.menu):
  1. Logo (makeLogo): drops in with a bounce, then floats up and down 2 px (logoShine.float / floatMs); every 4.2 s a bright band sweeps over the letters (14 pictures made from the logo's own pixels at start: only logo pixels inside the band are brightened, so it works in WebGL and CANVAS; logoShine.frames / band / strength / frameMs / everyMs / firstMs). If the logo picture cannot be read there is no glint.
  2. Path: a soft gold glow under the line that breathes (alpha 1 -> 0.55 in 1.6 s); a small white spark runs up the line every 4.4 s; the next stage to play (the lowest open stage without all four medals) has a gold edge that pulses (bubble.halo).
  3. Entry: the bubbles slide in from their sides with a small overshoot (lowest first), the witch flies in from the left (decor witch introX -130) and starts her sway when she arrives.
- Fix found on the way: the dark medal strip behind the medals was created before the panel picture so it was hidden behind it. Each bubble is now a container (panel, halo, strip, texts and medals in that order), which also makes the slide-in easy.
- Checked with the stand-in script (taps, modal, the whole create runs). NOT checked: any of the looks or timings (never run in a browser); the glint pixel code needs a real browser (it is wrapped so a failure only means no glint).
- UNVERIFIED: speed and strength of everything; tune logoShine and the tween times.

## 2026-11-21 v1.9.56: logo glint softer, logo rises from below (branch v1956-logo-from-below)
- Omri: lower the shine opacity and the logo should come from below. logoShine.strength 0.8 -> 0.45 (how white the sweeping band gets). The logo now starts just below the screen and rises with a small overshoot (Back.easeOut, 900 ms) instead of dropping from above with a bounce.

## 2026-11-21 v1.9.57: only the logo moves in (branch v1957-no-flyins)
- Omri: elements fly in together with the logo; they should just be on the background. v1.9.55 made the stage bubbles slide in from the sides and the witch fly in from the left (idea 3 of the pop list). Both are switched off now: config menu.intro.bubbles false and decor witch introX 0 (the code stays; set them back to bring the slide-in back). Only the logo rises from below. The path glow, the spark, the pulse on the next stage and the glint stay.
- If something ELSE flew in with the logo (not the bubbles or the witch), Omri should say what it is: I could not see it run.

## 2026-11-21 v1.9.58: the bottom of the path fades out (branch v1958-line-fade)
- Omri: add a fade effect on the bottom of the stage selector. The path line (and its glow) now fades from full to nothing between y 198 (config menu.path.fadeStart) and y 250 (lineBottom, was 232): the line is drawn in 2 px slices, each with its own opacity. The stage bubbles themselves are NOT faded (the Forest bubble ends at y 226, inside the fade zone: it stays solid). A fade over the bubbles themselves needs a gradient mask over the whole path area; that belongs with the scrollable path (not built yet).
- UNVERIFIED: how it looks; fadeStart / lineBottom set where it starts and ends (the witch's hat is about y 220).

## 2026-11-21 v1.9.59: the stage path scrolls (branch v1959-scroll-stages)
- Omri asked to build the scroll. config.menu.path.nodes now lists the stages from the lowest up (stage 1 first): Forest, Swamp, then Stage 3, Stage 4 and Stage 5 as locked SOON bubbles (the last two are placeholders so there is something to scroll; delete them from the list, or unlock and fill them, when real stages come). Position: bottomCy 192, step 71 px, sides alternate. With more bubbles than fit, the path can be pulled down: drag up / down anywhere above the logo area (y < viewBottom 250), it glides a little after release (friction 4) and stops at both ends (topStop 50 = where the highest bubble stops); mouse wheel works on a computer. A drag of more than 6 px is a scroll, a short tap still starts a stage.
- Fade: line, glow, arms and bubbles fade out towards the bottom (full at y 198, gone at 250, about the witch's hat) and at the top (line over 16 px, bubbles over 40 px); a bubble that is mostly faded (alpha under 0.35) can not be tapped. Bubbles fade as a whole by their centre (a soft gradient over the bubble picture itself needs a mask that does not work in CANVAS mode); the line fades slice by slice (2 px).
- With only Forest, Swamp and Stage 3 (as before) nothing scrolls (scrollMax 0). Now with 5 nodes scrollMax is 142.
- Code: MenuScene applyScroll() (places and fades everything, redraws the line) and update() (the glide); each bubble is a container moved by the scroll; hit test uses the live position (b.y) and alpha.
- Checked with the stand-in script: scroll max 142; dragging down 100 moves the path 100 (Forest fades to nothing and can not be tapped, Stage 4 comes up); gliding, the wheel, clamp at 0, tapping Swamp at scroll 0 starts it; a tap at the top edge does nothing. NOT checked: how it feels and looks (never run in a browser).
- UNVERIFIED on the phone: drag feel (6 px threshold, glide strength), the fade zones, Stage 4 / 5 look.

## 2026-11-21 v1.9.60: logo stars stay in the background, shorter fade (branch v1960-fade-logo-stars)
- Omri: stars and shines flew in with the logo; they should be on the background. Cause: the logo picture (assets/menu/logo.png, 116x83) has the crescent moon, 4 stars, 3 dots and 2 bats drawn into it, so they rose with the letters. The picture is split in two WITHOUT changing a pixel (connected pieces: the letters are one big piece, the other 10 small pieces far from the letters are the decorations; checked that every original pixel is in exactly one of the two): assets/menu/logo-text.png (letters, 3663 px, they rise, float and get the glint) and assets/menu/logo-decor.png (131 px, stays still behind). Config menu.logo.file and menu.logo.decor. The old logo.png stays in assets (unused).
- Fade shorter: the bottom fade of the path starts at y 224 (was 198) and ends at 250, so 26 px instead of 52; the top fades are 10 px (line) and 24 px (bubbles), were 16 and 40. Config menu.path.fadeStart / fadeTop / fadeTopBubble.
- UNVERIFIED: how it looks.

## 2026-11-21 v1.9.61: shorter fade, logo decorations pop up in a circle, look-ahead limit with a bounce (branch v1961-decor-pop-bounce)
- Fade shorter still: starts at y 236 (14 px above the end at 250); top 6 px (line) / 14 px (bubbles). Config menu.path.fadeStart / fadeTop / fadeTopBubble.
- The logo decorations (moon, dots, stars, bats: 10 pieces, bounding boxes listed in config menu.logo.decorParts; none overlap) now scale up one after another in a circle around the logo, clockwise starting with the moon (top left), 140 ms apart, first one 0.9 s after the menu opens (decorDelay / decorStepMs; each pop is 420 ms with a small overshoot), then stay. The letters still rise and float on their own.
- Scroll limit ("a player can see 3 stages forward before the drag bounces"): the path scrolls only as far as path.lookAhead (3) stages beyond the highest OPEN stage (the last node without locked: true). Past either end the path follows the finger only a third as far (rubber band, at most overMax 40 px) and springs back when released (glide and spring in update()). With Forest and Swamp open and 5 nodes, 142 px is the limit (Stage 3 to 5 are the 3 ahead). Unlock Stage 3 in the config and the path gets room for 3 more nodes beyond it, when they exist.
- Checked with the stand-in script: limit 142, a 290 px drag stops at 182 and settles back to 142 within 40 frames. NOT checked: feel and look.

## 2026-11-21 v1.9.62: "Fight", "&" and "Flight" fly in one after the other (branch v1962-logo-words)
- Omri asked for the words to fly in in succession. The letters picture (logo-text.png, 3663 px) is split into three pictures WITHOUT changing a pixel: assets/menu/logo-fight.png (1570 px), logo-amp.png (258 px) and logo-flight.png (1835 px). How: the bright letter pixels were grouped into pieces (12), each piece given to Fight (above y 44), & (right of x 85, above y 40) or Flight, then every dark outline / purple shadow pixel went to the nearest letter piece; checked that all 3663 pixels are in exactly one picture and looked at a colour-coded preview.
- The words rise from below in turn (Fight, then &, then Flight, 300 ms apart, each 850 ms with a small overshoot: config menu.logo.wordStepMs); when the last has settled all three float together (and the glint picture too). The decorations start popping at 1.5 s (decorDelay) and the first glint sweep is at 2.6 s (firstMs). If a part picture is missing the whole logo rises at once as before.
- Checked: the stand-in script still passes. NOT checked: how it looks.

## 2026-11-21 v1.9.63: words 0.1 s apart (branch v1963-word-step)
- Omri: the gap between Fight, & and Flight rising from 0.3 s to 0.1 s (config menu.logo.wordStepMs 300 -> 100). With each word taking 850 ms, they now overlap a lot; the floating starts about 1.0 s after the menu opens (was 1.4 s). Decorations (1.5 s) and the first glint (2.6 s) unchanged.

## 2026-11-21 v1.9.64: gentler logo landing (branch v1964-softer-settle)
- Omri: lower overshoot and a lower settle speed for the words rising. Overshoot (the Back ease strength) 1.7 (default) -> 0.6: they go past their spot by about a third as much; rise time 850 -> 1200 ms (riseMs): slower settle. Config menu.logo.overshoot / riseMs. The first glint (2.6 s) and decorations (1.5 s) start while the last word is still landing (0.1 s apart + 1.2 s = about 1.5 s): if that looks crowded, raise decorDelay.

## 2026-11-21 v1.9.65: thinner glow, endless line (branch v1965-endless-line)
- Omri: take one pixel off the middle line's glow and make the line endless so the player never sees its end. Glow: the outer layer 8 -> 6 px wider than the line (1 px less each side), the inner layer 4 -> 2 px wider. Line: it used to start a little above the highest bubble, so pulling the path down past its end (the bounce) showed the line's top end; it now runs up past the top of the screen at any scroll (applyScroll worldTop). The bottom still fades out at the witch's hat on purpose (the fade you asked for).

## 2026-11-21 v1.9.66: the line has no end at the bottom either (branch v1966-line-to-bottom)
- Omri: the line must be endless at the bottom too. The line and its glow now run from the top to the bottom of the screen at any scroll, with no fade at either end (config path.lineBottom / fadeTop no longer used for the line; the bubbles still fade by their own centre near the witch's hat). The line, its glow and the spark moved to depth -1: above the sky, behind the logo, the bubbles and the foreground friends, so it passes BEHIND the logo letters (it can show through gaps between the letters) and behind UPDATE.
- UNVERIFIED: how it looks behind the logo; if it clashes there, the options are to end the line under the logo with a short fade or to keep it endless only above it.

## 2026-11-21 v1.9.67: menu life: cauldron bubbles, witch trail, ghost, shooting star, fireflies, tap sparks, button pop, tilt parallax (branch v1967-menu-life)
- Omri picked ideas 1, 2, 3, 5, 7, 8, 10 and 15 (12 "unlock moment" and 13 "bubble previews" come later). All in src/scenes/MenuScene.js (startEffects, bit, sparks, shootingStar, bounce, setupTilt, tiltStep), numbers in config.menu.bits and menu.tilt, decor entries (par, fade).
  1. Cauldron: a pink / cyan / cream bubble rises from its mouth every 260 ms (bits.cauldron).
  2. Witch: pink, white and lilac sparks fall behind her broom every 70 ms, from her centre + (-38, 26) (bits.trail dx / dy: move it if it does not come from the broom tail).
  3. Ghost: a little smaller (scale 2 -> 1.667), floats wider (6 px up and down, 4 px sideways, slower) and fades in and out (alpha 0.7 to 1 over 2.8 s).
  5. A shooting star crosses the upper sky every 8 to 14 s, behind the path line (bits.star).
  7. Seven fireflies wander and blink around the path area (bits.fireflies), behind the line.
  8. A burst of 9 gold / pink / cream sparks wherever the player touches (bits.tap), also on taps on bubbles and buttons.
  10. UPDATE's text and the gear picture pop (scale 1.18 and back, 90 ms) when pressed.
  15. Tilt parallax: DeviceOrientation (Android works directly; an iPhone asks once on the first touch). The four friends shift up to 6 to 8 px AGAINST the tilt (they are near), the sky up to 4 px WITH it; full shift at a tilt of 20 degrees (menu.tilt.range); the zero point follows how the phone is held, so only the tilting counts. Menu.tilt.on false switches it off. The sky picture is now 5% bigger and centred so it can shift without showing an edge. The friends move through a position object (pos) so their bob / sway tweens and the tilt shift add up.
- All little effects share one pool of 2x2 square pictures (makeBits): the cauldron bubbles, trail, stars and sparks (depth 51 / 49 / -3 / 60); no particle system needed (works in WebGL and CANVAS).
- Checked with the stand-in script: every timer callback runs once without errors, the pool works (12 pictures for the first burst), the sparks, the shooting star's trail and the tilt step run, taps and scrolling still work. NOT checked: how any of it looks or feels, or the tilt on a real phone.
- UNVERIFIED: positions (trail from the broom tail, cauldron mouth), amounts (too many sparks?), tilt direction (should feel like depth: if it feels backwards, tell Claude).

## 2026-11-21 v1.9.68: the line and the stages dissolve in a gradient at the bottom (branch v1968-line-gradient)
- Omri: the middle line and the stages can hide behind a simple gradient fade; it was visible all the way to the bottom (v1.9.66). Now the line and its glow fade out smoothly between y 226 (fadeStart) and y 258 (lineBottom), just above the logo; the bubbles fade by their middle over the same range; at the top the line still has no end. The spark still starts at lineBottom. Path items are still behind the logo (depth -1).

## 2026-11-21 v1.9.69: calmer menu, gold trim, bigger tap areas, EFFECTS switch (branch v1969-menu-cleanup)
- Omri (design check): the menu is busy. He chose to remove the logo glint and the star pop-ins: config menu.logoShine.on false (not even made), menu.logo.decorPop false (the moon, stars and bats are just there; the words still fly in). Gold is OK to use more: the button outline is now gold (a pure colour swap of the pink pixels, 176 pixels, nothing added) so buttons, panel corners, path line, halo and gear all share one gold; BEST is gold (was cyan: cyan is reserved for the spell bolts).
- Bigger tap areas: the touch box of UPDATE is 8 px wider on each side and 4 px taller above and below its picture (about 50 phone px high), the settings buttons 3 px above and below and 4 px at the sides (a thumb needs about 44 phone px). The pictures did not change.
- Settings: the FONT row is replaced by EFFECTS (FULL / LOW, saved on the phone, the menu restarts): LOW switches off the cauldron bubbles, broom trail, fireflies, shooting stars, tap sparks and the tilt. (The game's own effects are not affected.) The font switch is gone: there will be one font (next version).
- Checked with the stand-in script (taps, settings, the effects run). UNVERIFIED: the look.

## 2026-11-21 v1.9.70: one font, one button (branch v1970-one-font-one-button)
- Omri (design check): use one font and one button style. FONT: PackFont only. The CLASSIC / PACK switch, ?font=classic and the saved choice are gone (hud.js); the old Pixelify Sans stays only as an emergency fallback (if PackFont cannot load, main.js switches by itself). The tune panel uses PackFont too (sizes through fpx(): its 8 px text is drawn at 11 px; the TUNE button is wider to fit the word). BUTTON: the MENU button on the stage clear / game over screens is now the menu's button picture (assets/ui/ui-med-button.png, 9-slice, gold outline) with cream text; PlayScene loads the picture itself if the menu did not (a stage started from a link). The old drawn plate stays only as the fallback when the picture cannot load. The tune panel's little -, + and tab buttons are still drawn plates (a tool, not a player screen).
- UNVERIFIED: how the tune panel labels fit with the new font (20 letters at about 6.3 px each is about 126 px of the 130 px before the number), how the MENU button looks on the end screens.

## 2026-11-21 v1.9.71: stage pictures in the tiles, DESIGN.md updated (branch v1971-stage-pictures)
- Omri liked the stage picture in the tile. Two small pictures were composed from art we already use, at native size (no scaling, no recolouring): assets/ui/stage-forest.png (88x56: night sky, the pack's two pines and a bush on grass; art from plants.png) and assets/ui/stage-swamp.png (88x56: teal dusk, reeds, a lantern post, glowing mushrooms; art from the Murky Swamp pictures in assets/swamp). Each open tile shows its picture across the whole inside of the tile at 55% opacity with a light purple tint (config menu.bubble.picAlpha / picTint) under the name, the dark medal strip and the best score. Locked stages have none. New stages: add assets/ui/stage-<theme>.png (88x56) and the node.
- DESIGN.md: a new section CURRENT LOOK at the top (it wins over the older text): colour roles, gold trim allowed in the menu, one font, one button, the recolouring rule, touch size, main menu layout and effects, controls, open items. The old sections stay as history.
- UNVERIFIED: how the pictures read behind the text (dim them with picAlpha if the names are hard to read).

## 2026-11-21 v1.9.72: bigger cauldron (branch v1972-bigger-cauldron)
- Omri asked for the cauldron 2x as big. Full x2 (scale 2.667, 77 px wide) does not fit: the logo letters end at about x 188, leaving about 45 px up to the screen edge. He chose "as big as fits": scale 1.333 -> 1.667 (48 px wide), centre x 205 -> 215, so it spans about x 191 to 239 with about 3 px to the letters. Bubbles still rise from its top (they follow its size). If he wants it bigger anyway: shrink the logo (menu.logo.scale) or let it overlap.
- UNVERIFIED: the gap to the logo and the screen edge.

## 2026-11-21 v1.9.73: the sky follows the stage scroll (branch v1973-sky-parallax)
- Omri: the background should scroll a bit with the stages, slowly, for parallax. The animated sky now moves down by 0.08 px for every px the path is pulled down (config menu.sky.scrollPar; at the furthest scroll of 142 px that is about 11 px, in the rubber band up to 15 px), with the tilt shift added. To have room the sky picture is 10% bigger than the screen (menu.sky.cover 1.1, was 1.05; the shift can be at most about 21 px up or down before an edge would show). The friends, logo, line and tiles do not move with it.
- UNVERIFIED: how it feels; a bigger scrollPar (not above about 0.12 with cover 1.1) makes a stronger depth effect.

## 2026-11-21 v1.9.74: cauldron bigger and away from the right edge (branch v1974-cauldron-left)
- Omri (screenshot of 1.9.72): the cauldron can be bigger, and it was too close to the right edge. Scale 1.667 -> 2.0 (58 px wide, 60 high), centre x 215 -> 204: it spans about x 175 to 233 (7 px from the right edge, about 16 px from UPDATE) and rises to about y 362; its top left corner may touch the bottom right of the "t" of Flight (the cauldron is in front). From the screenshot the letters end at x about 178 at that height.

## 2026-11-21 v1.9.75: the moon moves (branch v1975-moon)
- Omri circled an empty spot in a screenshot (to the right of the Forest tile, left of the ghost) and asked for the moon there. The moon is decoration 0 of the logo picture (the first of the 10 pieces); menu.logo.decorAt now lets any piece have its own screen position: { 0: [160, 203] } puts the moon's centre at x 160, y 203 (read from the screenshot: 4.37 screen px per game px, the visible part started at y 78). Other pieces stay where the logo picture has them.
- UNVERIFIED: the exact spot; tell Claude which way to nudge it. The moon is small (about 12 x 14 px); it could be scaled up later.

## 2026-11-21 v1.9.76: moon left, up and bigger (branch v1976-moon-bigger)
- Omri: the moon a bit left and up, and a little bigger. Position (160, 203) -> (149, 192); size 1.7 (the logo scale) -> 2.1 (menu.logo.decorScale, a size per piece; the moon is about 15 x 17 px now).

## 2026-11-21 v1.9.77: ghost 10 px lower (branch v1977-ghost-lower)
- Omri: ghost lower by 10 px. Centre y 236 -> 246 (config menu.decor ghost). It floats +-6 px around that.

## 2026-11-21 v1.9.78: moon bigger and a bit right (branch v1978-moon-right)
- Omri: bigger moon, a bit to the right. Size 2.1 -> 2.8 (about 20 x 22 px), centre x 149 -> 157 (y 192 unchanged).

## 2026-11-21 v1.9.79: forest purple, bigger explosions, bigger coins (branch v1979-tint-boom-coins)
- Omri: (1) the Forest stage needs a purple tint (he chose: in the game): config tint.forest alpha 0.12 -> 0.22 (colour 0x7a4fd0 unchanged; the swamp keeps 0.12). The wash lies over everything except pickups and enemy shots (depth 33 under 34 / 35). (2) Enemy explosions a little bigger (about 20%): the smoke puff sprites.poof.scale 0.6 -> 0.72 (the big one follows through bigMul 1.5), the ring deathRingScale 1.2 -> 1.45 and bigDeathRingScale 2 -> 2.4. (3) Coins 10% bigger: sprites.coin.scale 1.0 -> 1.1 (the art is 18 px, so 19.8 px; the pixels are no longer all the same size, a little uneven; pickup radius unchanged).
- UNVERIFIED on the phone: all three; the tint strength (0.22) and whether the coin edges look uneven.

## 2026-11-24 v1.9.80: high score fix, enemy glow, blue carriers, looks (branch v1980-score-fix-and-looks)
- HIGH SCORE BUG (two causes). (1) The best score was only saved on STAGE CLEAR, never on GAME OVER; now gameOver() saves it too. (2) A run counted as "debug" and saved nothing whenever the tune panel was switched ON (tuneEnabled), and Omri had it on. Now a run is only unsaved when it cheats: god mode, a jump to a later wave, a chosen weapon level, or a changed HARD / TEST row (Tune.set marks the scene tainted); the tune panel being open is fine (PlayScene.cheated()). One-time reset: medals.resetSavedOnce('2026-11-24-score-fix') (called in main.js) erases the saved medals and best scores of every stage the first time it runs on a phone (flag ff_reset_<tag>); checked in node: reset, save, second call does not erase, lower score ignored.
- Enemy aura (open item since v1.9.3): every enemy gets a soft dark warm glow behind it (rust-maroon 0x6a2418, 3 flat rings, 1.5x the enemy's size, depth -0.5; config enemies.glow, an enemy type with noGlow: true has none: use it for bosses). Pool of 40 (PlayScene glows, spawnEnemy / decorEnemy / removeEnemy). The carrier outline is stronger and unchanged in size.
- Weapon carriers' outline is blue (config enemies.haloTint.weapon 0x4f9bff, was green) like the potion they carry; heart carriers stay pink-white.
- Swamp lamp glow a bit lower: the three ring opacities x0.77 (0.6 / 0.36 / 0.18 -> 0.46 / 0.28 / 0.14).
- Menu: the broom trail is stronger: sparks every 38 ms (was 70), bigger (scale 2.8), live 0.9 to 1.5 s, NOT additive (so it shows on the light sky), 4 colours incl. gold. Stage pictures in the tiles are more visible: opacity 0.55 -> 0.85, tint nearly white (0xece4ff).
- Witch: Omri repainted the in-game witch sheet assets/witch/witch-1.png (same 72x128 size); config ship.witch 2 -> 1 so it is used.
- New art Omri added to the repo root was moved to art-packs (git-ignored): characters-and-enemies/wizard-summoner-unknown (wizard idle / fly / attack / death, summoner idle / summon / death, sorcerer villain frames), mud-enemy-unknown, floating-skull (zip), ui-buttons/kenney-ui-pixel-adventure (Kenney, CC0), fonts/DungeonFont.ttf. Not used yet; licences of the unknown packs are not checked (see CATALOG when used).
- Docs: ROADMAP.md (new: next up, goals / stars proposal, projectile ideas), NEXT-CHAT.md (a message for a new chat), memory note project-flight-state replaces the old v1.9.10 one.
- UNVERIFIED: all looks (enemy aura strength and size on every background, blue outline, trail, tile pictures, the repainted witch). If the aura makes enemies muddy: lower the ring alphas in enemies.glow.rings or set glow.on false.

## 2026-11-24 v1.9.81: STARS (3 per stage) and stars open stages (branch v1981-stars)
- Omri decided: 3 stars per stage, easy to hard: FINISH the stage (STAGE CLEAR), ALL COINS, NO HIT. The old goals "defeat 70%" and "defeat every enemy" are gone. A star is earned once and stays earned. Icons: a gold star (13x13 art px) with a small picture inside (flag, coin, heart), made in code in src/sprites.js; grey outline when not earned.
- Old saves: a stage with any saved medal counts as finished (finish star), all coins / no hit keep their value.
- Unlock: stars of all stages together open stages (config menu.path.nodes, field need): swamp 2, stage 3: 5, stage 4: 8, stage 5: 11 (stages 3 to 5 stay placeholders, locked: true). A locked tile is greyed and shows a small star and the number. Stage 1 gives at most 3 stars, so nobody gets stuck. An old player with fewer than 2 stars sees the Swamp locked until they earn them in the Forest.
- Menu tiles: 3 stars (scale 1.5) in a bigger dark strip; HUD top left: 3 stars (medalSize 13); STAGE CLEAR screen shows the 3 stars big and NEW under new ones.
- Checked: tools\check.py all green, menu smoke test runs (the swamp is locked in it, as it has no stars). UNVERIFIED: how the star pictures look at small size (the picture may be hard to read: tell Claude), the locked tile, the HUD spacing.
- Phone check: see the Forest tile (3 grey stars), play and clear it, see the stars on the end screen and the tile; with 2 stars the Swamp opens.

## 2026-11-24 v1.9.82: PAUSE menu (branch v1982-pause-menu)
- New pause button (two bars, purple square with gold edge) at the top right under the hearts (config pauseBtn, 36 px touch box). It opens PAUSED with two buttons: CONTINUE and MENU (the same button picture as the end screen). While paused the world, shots, animations and tweens all stand still; the pause screen takes every touch, so a tap beside the buttons does nothing. CONTINUE moves the "invulnerable / stunned / flash" deadlines by the paused time. MENU goes back to the stage menu and the run is lost (nothing is saved, no best score). The game also pauses by itself when the app goes to the background (Phaser "hidden").
- The tune panel gear moved down from y 34 to y 62 so it does not sit on the pause button.
- Roadmap: added "Fix soon: enemy aura looks like a dark shadow, not a glow" (Omri, v1.9.80).
- Checked: syntax of all files, tests (tools\check.py) and the menu smoke test pass. NOT run: the game itself (no way to open it here). UNVERIFIED: button position and look, that nothing keeps moving while paused (e.g. a tween or timer I did not know about), the pause when the app is in the background.
- Phone check: tap the pause button during play; see PAUSED; CONTINUE resumes exactly where it was; pause again and tap MENU: back at the stage menu; tapping beside the buttons does nothing; the button also works near the hearts without moving the witch.

## 2026-11-24 v1.9.83: RESTART in the pause menu (branch v1983-pause-restart)
- The pause screen now has CONTINUE, RESTART and MENU. RESTART starts the same stage again (same as tapping after game over); the run so far is lost and nothing is saved. UNVERIFIED: the three buttons' spacing on the phone.

## 2026-11-24 v1.9.84: goals and stars separated (branch v1984-goals, NOT pushed yet)
- Goals (what you do) and stars (the reward) now look different. GOAL icons: witch hat = finish (assets/ui/goal-hat.png from the BTL loot pack, recoloured to purples in code), the game's coin = all coins, the game's heart = no hit (cut from the coin and heart sheets at runtime, src/sprites.js makeGoalIcons). States: WHITE = open, FULL COLOUR = done, GREY = failed (no crosses). They sit top left in the game (config hud.goalScale / medalSize / medalGap).
- GOAL CARD at the start of every stage: world waits, shows GOALS with the 3 icons and names, TAP TO START (also closes by itself after 3.5 s, config goalCard). The pause button does not work while it is up.
- STAGE CLEAR: 3 rows (icon, name, star): a gold star lands (small bounce) for each goal done, a dim star for the others, NEW next to new stars; COINS / KILLS / HITS lines moved down a little.
- Stars are now plain gold stars (13 px, no picture) on the menu tiles and the end screen (textures star_earned, star_off).
- Checked: syntax, tools\check.py all green, menu smoke test. NOT run: the game itself. UNVERIFIED: everything visual (icon size and crispness, hat colours, card layout, end screen rows fitting above the MENU button), and the runtime cutting of the coin and heart frames (if the HUD shows empty or wrong pictures, tell Claude).
- The hat file's licence is not confirmed: Omri must OK pushing it (see CREDITS.md).

## 2026-11-24 v1.9.85: still life hearts, same size as the goal icons; goal card stays until tapped (branch v1985-hearts-goals)
- Omri: the life hearts must not be animated and must face front, and be the same size as the goals. The HUD hearts are now the same picture as the no-hit goal icon (the front-facing heart cut from the heart sheet), same scale (hud.goalScale); a lost heart is a dark flat shape. The animated hearts remain only as a fallback if the picture cannot be made.
- The goal card no longer closes by itself; it waits for a tap (config goalCard.showMs removed).
- Open (asked Omri): goals in a lightbox in the main menu before PLAY instead of the in-game card; when the witch hat goal should light up.
- Checked: syntax. UNVERIFIED: heart size and spacing at the top right.

## 2026-11-24 v1.9.86: gallery stars (branch v1986-gallery-stars)
- Omri: use the stars from the gallery. The stage stars (menu tiles, STAGE CLEAR, locked tile) are now the gold power-star of the Frakassets loot pack (CC BY 4.0, credit already in CREDITS.md), frame 0 (front facing), file assets/pickups/star-lit.png, cut and trimmed at runtime in sprites.js (star_earned = full colour, star_off = dim grey). The old drawn 13 px star stays only as a fallback if the picture does not load.
- Sizes (about 20 px art): tile stars hud scale config menu.bubble.medalScale 0.9, end screen 1.3, locked tile star 0.7. UNVERIFIED: how they look and fit (tile row, end screen rows).

## 2026-11-24 v1.9.87: goals = cats, coins, all enemies, no hit; goals box in the menu (branch v1987-goals-lightbox)
- Omri's star list: ALL CATS, ALL COINS, DEFEAT EVERY ENEMY, NO HIT. Built for 4 stars; a stage only has the goals listed in src/medals.js GOALS (forest and swamp: coins, kill all, no hit; add 'cats' to a stage when its cats exist, then the tile / end screen / box have room for 4: the tile row needs a smaller gap then). Finish is no longer a star: finishing a stage (saved as cleared) only shows the NAME of the next stage; before that its locked tile says ???. Locked tiles still show the stars needed.
- Goal icons: cat (menu cat, recoloured black to purples), the game's coin, a skull (BTL "skull 1", assets/ui/goal-skull.png; the witch hat file was removed), the game's heart. White = open, full colour = done, grey = failed. Menu and game load the same pictures (loadGoalArt in sprites.js).
- GOALS BOX (lightbox) in the main menu: tapping a stage opens a panel with its goals (icon, name, gold star if you have it, dim star if not) and PLAY / BACK. The in-game goal card is gone (no card on restart).
- Old saves: kill-all, all-coins and no-hit medals are kept; the old "kill 70%" and the finish star are not counted any more (stars drop by one for players who had them: unlock numbers may need a look).
- Checked: syntax, tools\check.py, the menu smoke test plus a new one for the box (scratch\lightbox-smoke.mjs: opens, BACK closes, PLAY starts the stage). NOT run: the game itself. UNVERIFIED: how everything looks (box layout, cat icon colours, skull, end screen rows).
- Phone check: tap Forest: the box opens; PLAY starts; BACK closes; the cat and skull icons are readable; the Swamp tile shows ??? until Forest is cleared.

## 2026-11-24 v1.9.88: equal icon sizes, white box text, DungeonFont for big titles (branch v1988-icons-titles)
- Omri's screenshot of the goals box: coin and heart were big, the skull tiny, text dark. Now every goal icon is fitted into the same square (sprites.js goalScale; the tiny skull is first enlarged by whole pixels): box 22 px in the goals box (config lightbox.iconBox), 16 px top left in the game (hud.goalBox, the life hearts use the same size), 20 px on the end screen. The text in the goals box is white with a dark outline.
- DungeonFont (promised earlier, only now built): FONT_TITLE in hud.js, loaded in index.html and main.js. Used for STAGE CLEAR, GAME OVER, PAUSED, SETTINGS and the stage name in the goals box (24 px and up; everything else stays PackFont). Licence unknown (CREDITS.md).
- Checked: syntax, tools\check.py, menu + goals box smoke test. NOT run: the game. UNVERIFIED: how DungeonFont reads at these sizes (SETTINGS at 24 may be too wide or tight), icon sizes, the box height.

## 2026-11-24 v1.9.89: title font in small letters (branch v1989-title-case)
- Omri: text in the new font should only have a capital at the start (Forest, not FOREST). All DungeonFont titles now go through titleCase (hud.js): Forest, Settings, Paused, Stage Clear, Game Over (each word starts with a capital). PackFont text stays in capitals. UNVERIFIED: the look.

## 2026-11-24 v1.9.90: CATS (rescue) and the ALL CATS star (branch v1990-cats)
- New file src/cats.js. 3 cats per stage (config cats.atWave [2, 5, 8] = they appear when the first enemy of that wave spawns). A cat sits worried on a grey stone (drawn in code) that scrolls with the ground (about 40 px/s, visible about 10 s). A ring (radius 30) around it: the witch's centre inside = it fills clockwise in 8 segments in 2 s (dull red-brown, pink, light green, bright green), outside = drains at half speed, a hit inside takes 25% off. Full = SAVED: two happy jumps (Run frames), a burst of small gold stars, a small heart, then a leap in an arc to the top left (config cats.hut) and gone. A cat that scrolls off the bottom is lost. The cat meows (Meow frames + puff) every few seconds, faster as the ring fills.
- Pet Cats Pack (CC0): 6 colours, 3 random ones per stage; files assets/cats/cat-N-sitting / meow / run + meow-vfx.
- Goal ALL CATS is now the first star of both stages (src/medals.js GOALS): earned when all 3 are saved, failed when one is lost. Tiles / box / end screen show 4 stars (tile star gap 3). STAGE CLEAR waits until no cat is left on the screen. A run that starts late (tune ?wave= jump) has only the cats that are still to come, or none (then no cat goal).
- Goal icons: "open" is now near white but keeps the picture's details (a flat white blob hid the coin, skull and heart).
- TESTED in the real game (browser pane works again): cat spawns and sits on its stone, the ring fills and changes colour, SAVED plays and the cat arrives at the top left, no console errors, tile and box show 4 stars. The machine ran at 8 fps, so timing and feel are UNVERIFIED. UNVERIFIED: the meow puff position (cats.fxDx / fxDy), how often cats are in a calm moment (a cat can appear while enemies are near), the hut position, the look of the ring on a phone.
- Phone check: play the Forest: after wave 3 a cat sits on a stone; fly over it (the ring fills); it jumps and leaps to the top left; losing a cat turns the cat icon grey; the 4th star shows on the tile.

## 2026-11-24 v1.9.91: cat tweaks and a real glow behind enemies (branch v1991-cat-tweaks)
- Omri's screenshot: the cat stood on my grey drawn stone, was too big, the ring was huge, the thank-you heart was big, and the enemy aura looked like a shadow.
- The cat now sits on one of the game's own small rocks (kit.rock(), the same pictures as the background; the stone drawn in code stays only as a fallback). Cat scale 2 -> 1.5.
- The ring is now a thick flat ellipse (rx 14, ry 6, 4 px thick) around the cat's feet, drawn in FRONT of its lower half. The witch counts as inside within 24 px of the cat's body (config cats.ringHitR), so it is not harder to fill than before.
- After a rescue two small hearts (9 px) float up out of the cat's head, one after the other, and fade. The star burst is smaller.
- Enemy aura: now a warm LIGHT glow (amber 0xff9a4a, additive blend, a smooth soft gradient plus the faint flat rings: both effects mixed) instead of the dark maroon rings (config enemies.glow: color, soft, blend, sizeMul). No more shadow look. UNVERIFIED on the phone: strength and colour (stacked bats make a bright streak; lower glow.soft if too bright).
- Tested in the browser pane here (8 fps): cat on the rock, the ring in front, glow behind bats. UNVERIFIED: the hearts' look (not captured), the cat's size on the phone.

## 2026-11-24 v1.9.92: ring in perspective, cat in front of the rock, enemy glow half size (branch v1992-cat-depth)
- Omri: the ring was in front of the whole cat; the cat should stand in front of the rock; the enemy glow half as big.
- Ring: drawn in two halves. The BACK half (upper part of the ellipse) is behind the cat (above the rock), the FRONT half (lower part) is in front of the cat's feet, so it reads as a ring on the ground around the cat. The fill segments are split the same way.
- The cat stands IN FRONT of its rock: its last pixel row is read from the picture (so the feet are exact) and placed 1.5 px below the rock's bottom edge (config cats.footDrop). This separates the cat from the background.
- Enemy glow size: sizeMul 1.5 -> 0.75 (config enemies.glow.sizeMul).
- Tested in the browser pane (8 fps, zoomed): ring halves and the cat in front of the rock look right. UNVERIFIED: the feel on the phone, the 1 to 2 px drop at normal size.

## 2026-11-24 v1.9.93: round ring without lines (branch v1993-round-ring)
- Omri: the ring must be a circle, not an oval, and without the lines. Now a plain circle (radius 12, 4 px thick, config cats.ringRx = ringRy): a dark translucent band for the empty ring (no outline) and ONE smooth arc for the fill, clockwise from the top, in the colour step of the fill (no segment gaps). The back half still goes behind the cat, the front half in front of it.
- Tested in the browser pane (zoomed): clean circle, no segment lines. UNVERIFIED on the phone (a very faint dot may show where the two halves meet).

## 2026-11-24 v1.9.94: first cat at the start of the level (branch v1994-cat-at-start)
- Omri could not wait half a level to test the cats: config cats.atWave [2, 5, 8] -> [0, 4, 8]: the first cat appears with the first enemies (about 2 s into the stage), the others at waves 5 and 9. A late start (tune ?wave= jump) keeps the cats from that wave on. Tested in the browser pane: the cat sits on its rock at the start. Change atWave back later if the first wave is too busy with a cat.

## 2026-11-24 v1.9.95: smaller thicker ring, cats run to the closest edge, enemy glow fades at its edge (branch v1995-run-away)
- Ring: radius 12 -> 9, thickness 4 -> 5 (config cats.ringRx / ringRy / ringW).
- After a rescue the cat does its two happy jumps, then RUNS along the ground (110 px/s, config cats.runSpeed) to the closest side edge (left if it is on the left half, else right; the picture is flipped to face the way it runs) and leaves the screen. The leap to the top left is gone (hut config removed).
- Enemy glow: the outer flat ring made a hard circle edge; it is gone (rings are now only at 0.7 and 0.45 of the radius), so the soft gradient fades to nothing at the edge.
- Tested in the browser pane (stepping the code by hand: the cat runs left, flipped, and leaves; 8 fps machine). UNVERIFIED: the look of the run and the glow edge on a phone.

## 2026-11-24 v1.9.96: enemy glow fully smooth (branch v1996-smooth-glow)
- Omri: use regular (smooth) glows for objects, not pixel art. The enemy glow had two flat pixel rings and a small picture stretched with hard pixels. Now: no flat rings, a bigger picture (texels 12 -> 32) with a smooth gradient, scaled with LINEAR filtering. Strength soft 0.22 -> 0.32 (the smooth glow is fainter at the same value). Cat ring stays a smooth vector circle (unchanged).
- Coin / heart / potion shine are still pixel-art rings (not changed; Omri only said "objects": ask if those should be smooth too).
- Tested in the browser pane: a soft warm glow around the bats with no visible edge. UNVERIFIED on the phone: strength.

## 2026-11-24 v1.9.97: cat centred in the ring, colourful ring (branch v1997-ring-colours)
- Omri (screenshot): the cat did not look centred in the ring. The cat is now drawn 2 px left and 1 px lower (config cats.catDx -2, catDy 1; also while it jumps and runs).
- The ring fill now swaps colour like the witch's trail particles (pink, lilac, blue, mint, violet, white), blending from one to the next, 3 colours per second (config cats.ringColors, ringColorSpeed). The old progress colours (brown, pink, green) are gone; the arc length still shows the progress.
- Tested in the browser pane (zoomed): a lilac ring around the cat, cat centred. UNVERIFIED: the speed of the colour swap (3 per second: lower ringColorSpeed if it flickers too much), the cat's exact centring.

## 2026-11-24 v1.9.98: the ring grows while the witch hovers (branch v1998-ring-grows)
- Omri: when the player hovers above the cat the ring should get larger so it can be seen under the witch, a bit thicker too. The ring now swells smoothly while she is inside (radius 9 -> 17, thickness 5 -> 7; config cats.ringRxBig / ringRyBig / ringWBig, speed ringGrowSpeed 6 per second) and shrinks back when she leaves. The hit area (ringHitR 24) is unchanged.
- Tested in the browser pane (witch over the cat: the big ring shows around her). UNVERIFIED: the size and the swell speed on a phone.

## 2026-11-24 v1.9.99: big ring a little smaller (branch v1999-ring-smaller)
- Omri: good width, a little smaller. The swollen ring radius 17 -> 14 (config cats.ringRxBig / ringRyBig); thickness unchanged (7). UNVERIFIED on the phone.

## 2026-11-24 v1.9.100: no spokes inside the ring (branch v1100-ring-spokes)
- Omri's screenshots showed dark spokes inside the ring. Cause: the empty ring band was see-through (opacity 0.45) and drawn as many small stroke pieces; where pieces overlap the colour doubles, which made radial lines. The band is now fully opaque (0x3f3060), so no overlaps show. The colourful fill was already opaque. Tested in the browser pane: a clean ring.

## 2026-11-24 v1.9.101: soft glow behind the cats (branch v1101-cat-glow)
- Omri: the cats need to stand out from the background more. Each cat now has a smooth round light behind it (warm white-pink, additive, 60 px across, pulsing gently; config cats.glowSize / glowAlpha / glowPulse). It sits behind the cat and its ring, above the rock, follows the cat when it jumps and runs, and goes with it. Tested in the browser pane: a black cat clearly separates from the ground. UNVERIFIED on the phone: size and strength (glowAlpha 0.9). Other ideas not built: a light outline, a bobbing marker above the cat.

## 2026-11-24 v1.9.102: ring drawn as filled pieces (no spokes), visible pink cat glow (branch v1102-ring-fill)
- Omri's phone screenshot (v1.9.101): the spokes were still there and the glow could not be seen. (The browser pane here showed neither problem: the phone's graphics chip draws thick lines differently.)
- Spokes: the ring is no longer made of thick lines. It is drawn as filled ring pieces (a band between two radii, split into the back and front halves), so there are no pieces that leave thin see-through gaps between them. Same colours, sizes and behaviour.
- Glow: white light added on a light ground cannot be seen. It is now a saturated pink (like the ring and the trail particles), normal blend (not additive), 70 px across. Tested in the browser pane at normal size: the cat shows in a clear pink haze. UNVERIFIED on the phone: whether the spokes are really gone (the cause is a guess from the screenshot) and the glow's strength (config cats.glowSize / glowAlpha).

## 2026-11-24 v1.9.103: Forest tint with MULTIPLY at 50% (branch v1103-tint-multiply)
- Omri wanted to try the Forest tint with the MULTIPLY blend mode at 50% opacity (before: normal blend, 22%). Config tint.forest: color 0x7a4fd0, alpha 0.5, blend 2 (new field: 0 = normal, 2 = multiply); the Swamp keeps normal blend 0.12. ?tint=0 still turns it off. Tested in the browser pane: the Forest is darker and more purple-grey. UNVERIFIED on the phone: taste. To go back: alpha 0.22, blend 0.

## 2026-11-24 v1.9.104: Forest tint a little more purple (branch v1104-purple-tint)
- Omri: a little more purple. With the multiply blend the colour removes light from each colour channel: a colour with less green and more red/blue gives more purple. Forest tint colour 0x7a4fd0 -> 0x8440e8 (less green 0x4f -> 0x40, more blue 0xd0 -> 0xe8); opacity stays 50%. If still not enough: lower the green number more (0x30) or raise alpha. UNVERIFIED on the phone.

## 2026-11-24 v1.9.105: sparks rising from the cat rings; enemies above the tint (branch v1105-particles-enemy-depth)
- Omri: (1) colourful particles rising from the ring: small tinted squares (the ring/trail colours) appear on the ring and rise, sway and fade (config cats.sparkRate 5/s idle, sparkRateHover 16/s while she hovers, sparkRise, sparkLife, sparkMax). They ride with the ground. (2) The wisp looked dim because the multiply tint (depth 33) darkens everything under it. Enemies are now drawn above the tint (new config enemies.depth 33.5; their glow, outline and hit flash follow; pickups are 34, enemy shots 35). Set enemies.depth to 0 to put them back under the tint. The witch is still under the tint. (3) The cats, their ring, glow and sparks are now above the tint too (cats.depth 33.6), so the tint no longer dulls the colours; the rock stays under it (cats.stoneDepth 3).
- Gallery: localhost:8123/art-packs/_tools/gallery/index.html only works while the preview server (python http.server on port 8123, "flight-and-fight" in .claude/launch.json) is running. I had been stopping it after each test; it is left running now.
- Tested in the browser pane: sparks appear around the ring, the cat and ring are brighter. NOT looked at: enemies at the new depth with their glow and outline (UNVERIFIED), and the sparks' size and count on a phone.

## 2026-11-24 v1.9.106: witch above the tint; calmer, smaller, evenly spread ring sparks (branch v1106-witch-above-tint)
- Omri: move the witch above the tint; the ring sparks were too big and busy: smaller, more space, spread across the ring, subtle but visible.
- Depths (above the tint 33): config ship.depth 33.7 (the witch, her muzzle flash +0.1, stun stars +0.2, her broom trail -0.1), bullet.depth 33.2 (her shots), enemies 33.5, cats 33.6, heart pickup animation 33.95, pickups 34, enemy shots 35. Set ship.depth back to 10 (and the others to 0..) to put things under the tint again.
- Sparks: scale 1..2.2 -> 0.45..1.05 (about 1 to 2 game px), rate 5 -> 2.5 per second idle and 16 -> 7 while she hovers, most at once 60 -> 30, rise a little slower; each new spark starts 2.4 rad (golden angle) after the last on the ring, so they spread evenly around it instead of clumping.
- Tested in the browser pane: the witch, bats and her shots are bright above the tint; a few small sparks around the rings. UNVERIFIED on the phone: sparks subtle enough but visible, and the witch's colours against the purple ground.

## 2026-11-25 v1.9.107: ring sparks get sucked into the witch (branch v1107-sparks-suck)
- Omri: when the witch hovers over the cat, the sparks should vacuum into her.
- src/cats.js updateSparks: every spark remembers its cat. While that cat is in the 'hover' state the spark flies to the witch, faster and faster (50 + 420 px/s per second), full brightness, and vanishes when it reaches her. When she leaves, the remaining sparks rise again as before.
- Syntax checked, tests 389 passed. NOT looked at on a phone (UNVERIFIED): speed and how many sparks reach her.

## 2026-11-25 v1.9.108: firework stars, enemy glow in the enemy's colour, muzzle flash under the hat (branch v1108-fireworks-glow-muzzle)
- Cat rescue: 5 bigger gold stars (was 9 small) shoot off in random directions like fireworks, slow down, spin, fade.
- Enemy glow: the glow picture is now white and each enemy tints it with its main colour (PlayScene.enemyGlowColor: average of the solid pixels, strong colours count most, stretched to full brightness, cached per picture). An enemy type can force a colour with glowColor in its config.
- Muzzle flash: PlayScene finds the top row of the witch art once and keeps the flash 3 px below it (muzzleDy, never more than config ship.muzzleY). With the current witch it is 19.5 px above her centre.
- Tested in the browser pane: grunt glow is pink-violet, muzzleDy 19.5. NOT looked at on a phone (UNVERIFIED): other enemy glow colours, star size and spread.

## 2026-11-25 v1.9.109: sparks shoot up, then dive into the witch (branch v1109-spark-suck-anim)
- Omri could not see the v1.9.107 suck. Now each spark has its own animation: it shoots up about 19 px (fast, braking, 0.22 s), then dives into the witch with a very sharp ease-in (speed 20 + 2200 * t squared). More sparks while she hovers (12 per second). Config cats: suckUpS, suckUp, suckSharp, sparkRateHover.
- NOT verified: the browser pane could not hold the witch over a cat (the controls move her back), so the new motion was only syntax-checked and read through. UNVERIFIED on screen and on a phone.

## 2026-11-25 v1.9.110: rescue stars use the gallery's spinning power-star (branch v1110-spinning-stars)
- Omri: use the spinning star from the gallery for the rescue. The 5 firework stars are now the Frakassets power-star idle spin (assets/pickups/star-lit.png, first row = 24 frames of 32x45, 24 fps), each starting at a random frame, scale 0.8 to 1.1. Texture/anim star_spin (src/cats.js).
- Tested in the browser pane: the stars animate. Size and look on a phone UNVERIFIED.

## 2026-11-25 v1.9.111: cat, ring and sparks are drawn under the witch (branch v1111-ring-under-witch)
- Bug (Omri's screenshot): the front half of the ring (depth 33.8) and the sparks (34.0) were above the witch (33.7). Now everything of a waiting cat sits between 33.61 and 33.66: glow, back ring, cat, front ring, meow puff, sparks. The witch (33.7) covers all of it. Stars and hearts after the rescue stay above her.
- Syntax checked. NOT looked at on a phone (UNVERIFIED).

## 2026-11-25 v1.9.112: sucked-in sparks are drawn over the witch (branch v1112-sparks-over-witch)
- Omri: the sparks that fly into the witch must be above her (a "juicing up" look). While a spark is pulled it gets depth ship.depth + 0.2; when it is free again it goes back under her. Syntax checked, UNVERIFIED on a phone.

## 2026-11-25 v1.9.113: the ring builds up as it fills (branch v1113-ring-builds-up)
- Omri: more and longer-lived sparks as the circle fills, and the circle shakes near the end.
- src/cats.js: spark rate x (1 + 2.5 * fill), spark life x (1 + 0.8 * fill), the cap on sparks grows up to double. The ring trembles from 60% fill, up to 1.6 px at 100%. Config cats: sparkFillMul, sparkFillLife, shakeFrom, shakePx.
- Syntax checked. UNVERIFIED on a phone (is the build-up clear, is the shake too much).

## 2026-11-25 v1.9.114: stars start small, stronger shake, faster sparks that stretch into strips (branch v1114-strips-shake)
- Rescue stars: still 5; each starts small (25%) and grows to full size in 0.35 s while flying.
- Ring shake: from 50% fill, up to 3 px (was 1.6 from 60%).
- Sparks: more (hover 18/s, fill multiplier 4, cap 45), rise faster as the ring fills (riseFillMul), suck-in is faster (suckUpS 0.16, suckSharp 3500). Near the end they stretch into strips: they turn along their flight (up, or toward the witch) and get up to 6 times longer (config streak 5, grows with fill squared).
- Syntax checked. UNVERIFIED on a phone (is it too much?).

## 2026-11-25 v1.9.115: the ring looks like it is about to burst (branch v1115-about-to-burst)
- Omri: not powerful enough. Shake up to 7 px (grows with fill squared, from 25% fill) and the cat shakes half as much (catShake). Sparks: 8x rate multiplier, rise speed up to 6.5x, suck-in speed 9000 (very sharp), strips up to 11x long (streak 10), cap 70.
- Tested in the browser pane with the ring forced to 93%: long coloured strips stream into the witch. The shake was checked by the numbers only (about 5.7 px at 93%). UNVERIFIED on a phone.

## 2026-11-25 v1.9.116: sparks fly their own spiral into the witch (branch v1116-spiral-sparks)
- Omri: too basic, uniform, straight and thick. Research (game-juice guides: charge-and-release pattern, anticipation, tight fast particles) said: layered build-up, anticipation before release, variety.
- Every pulled spark now has its OWN flight: random pop-up height/speed, a short random hang (anticipation), then a spiral around the witch (random direction, 0.5 to 1.6 turns, random size) that tightens with ease-in (radius 1 - v^2.6, angle v^1.7) and is faster the fuller the ring is (duration shrinks up to 55%). Thin (scaleY 0.5), stretched along the real speed (up to 8x, only when really fast), so lengths vary. Free sparks stretch less (streak 7, half strength) and are thinner.
- Tested in the browser pane (ring forced to 85%): many thin curved streaks of different lengths and colours spiral into the witch. Cat was far from the witch in that test, so the close-up look is UNVERIFIED, also on a phone.
- Idea not built: a flash and expanding ring when the ring completes (release).

## 2026-11-25 v1.9.117: strips removed, back to shoot-up then dive (branch v1117-no-strips)
- Omri: no strips; go back to the earlier animation. Sparks are plain dots again: shoot up, then dive straight into the witch with the sharp ease-in (the stronger speeds of v1.9.115 stay). Only some sparks (fastShare 0.35) swell by about 1 px (fastGrow 1) as they speed up. Spiral and strips removed; free sparks no longer rotate or stretch.
- Tested in the browser pane: plain dots stream to the witch. UNVERIFIED on a phone.

## 2026-11-25 v1.9.118: sucked-in sparks easier to see (branch v1118-visible-sparks)
- Omri could not see the sparks going into the witch. The depth was already above her; the likely cause is that they were small dark-ish dots popping up only about 17 px (inside her 48 px sprite). Now: they pop up 0.6x to 1.2x of 650 px/s braking over 0.22 s (about 30 to 60 px, out of her sprite), are bigger (1.5), and glow (additive blend) while pulled.
- Syntax checked. The browser pane could not hold the witch over a cat this time (she stayed outside the ring), so UNVERIFIED on screen and on a phone.

## 2026-11-25 v1.9.119: sparks pop out at every angle (branch v1119-angles)
- Omri: the sparks only flew straight up. Each pulled spark now pops out at its own random angle (0 to 360 degrees), braking, then dives into the witch. Checked in the browser pane: 38 sparks around the cat with angles from -159 to 174 degrees. Look on a phone UNVERIFIED.

## 2026-11-25 v1.9.120: sparks are born all around the witch and sucked in (branch v1120-sparks-from-all-sides)
- Omri's screenshot showed sparks only flying up. In my own test with the witch really over the cat (mouse control, ctl=mouse, scroll stopped) the v1.9.119 sparks already went in all directions, so his phone may have had an OLD cached build (check the version number at the top left). But the pop-out and the dive were short (the witch sits on the ring), so it still did not read as a vacuum.
- Now while she hovers 70% of the new sparks (farShare) are born 32 to 74 px away from the witch at a random angle, tremble outward a little, then dive in with the sharp ease-in. Tested: 11 sparks around her at relative positions all over (-65..49, -56..55).
- How to test hovering in the browser pane: ?ctl=mouse, start Play, stop scroll (scene.bgF.scroll = 0), hover the mouse over the cat (game px x 1.4 + offset).

## 2026-11-25 v1.9.121: smaller far-spark radius; ?tintblend= test switch (branch v1121-radius-overlay-test)
- Far sparks are born 16 to 42 px from the witch (was 32 to 74).
- New test parameter ?tintblend=N changes the forest tint's blend mode (2 multiply = the game's setting, 3 screen, 4 overlay). Overlay is drawn ONLY in CANVAS mode (add ?render=canvas); WebGL (phones, most browsers) has no overlay blend in Phaser and falls back to normal paint. Seen in the browser pane: overlay gives a lighter, blue-lilac wash. The game itself is unchanged (multiply).

## 2026-11-25 v1.9.122: tighter spark radius, less ring shake (branch v1122-tighter-sparks-less-shake)
- Far sparks are born 8 to 24 px from the witch (was 16 to 42). Ring shake halved (shakePx 7 to 3.5, catShake 0.5 to 0.3).
- UNVERIFIED on phone: how the tighter cloud and calmer shake feel.

## 2026-11-25 v1.9.123: calmer sparks (branch v1123-calmer-sparks)
- About half as many sparks (sparkRateHover 18 to 9, sparkFillMul 8 to 4, sparkMax 70 to 40). Pulled sparks smaller (scale 1.5 to 1) and softer (alpha 0.75).
- UNVERIFIED on phone: whether it now feels calm enough.

## 2026-11-25 v1.9.124: rescue burst = hearts and sparkles, no stars (branch v1124-rescue-hearts)
- Stars mean goals, so the rescue burst now throws 3 small hearts and 4 tiny sparkles (same fireworks motion, shorter life). The star_spin art is still loaded but unused.
- UNVERIFIED: the look on a phone.

## 2026-11-25 v1.9.125: UPDATE now refreshes cats.js (branch v1125-update-refresh-cats)
- Cause of 'new version number but old game for a few minutes': src/cats.js was missing from FILES in src/update.js, so UPDATE refreshed config.js (the number) but left the old cats.js saved. Added it. Rule: every new src file goes into FILES.
- Note: the update that brings v1.9.125 still uses the old list; it works from the update after that.
- UNVERIFIED on phone.

## 2026-11-25 v1.9.126: smoother cat run, softer shake (branch v1126-cat-run-smooth)
- Cats now face their run direction from the first jump (before: they jumped facing right, then flipped when running left).
- The run pictures lean forward and snap back (body centre swings about 7 px per cycle) on top of our steady slide = a stagger. makeArt measures the swing per frame (runOff) and updateSaved cancels it, so only the smooth slide moves the cat.
- Ring shake softer again (shakePx 3.5 to 2.5, catShake 0.3 to 0.2).
- UNVERIFIED on phone: how the run looks (the browser pane was throttled, so I could only check the numbers).

## 2026-11-25 v1.9.127: broom trail drawn over the cat ring (branch v1127-trail-over-ring)
- The broom trail sat at depth 33.6, the same as the cat parts, so the ring front (33.64) covered it. Trail is now at ship depth minus 0.02 (33.68): above the ring and cat sparks, still under the witch (33.7).
- UNVERIFIED on phone.

## 2026-11-25 v1.9.128: cat no longer runs on the spot (branch v1128-cat-run-start)
- The run cycle played during the two in-place jumps, so the cat ran without moving. Now it holds one leaping pose (run frame 3) while jumping and the run cycle starts only when it starts to move.
- UNVERIFIED on phone.

## 2026-11-25 v1.9.129: cat's celebration jumps use the reared-up picture (branch v1129-cat-jump-pose)
- The pet-cats pack has no standing-on-hind-legs picture (Idle, Meow, Sitting, Laying, Stretching = play bow, Itch, Licking, Sleeping, Run). Run frame 0 is the most upright (tallest body), so the two jumps hold it. UNVERIFIED how it looks; if poor, options: the Sitting picture, or the Meow picture.

## 2026-11-25 v1.9.130: blue power-up pills (branch v1130-blue-pills)
- The weapon-level bars (0..10) are now blue pixel pills drawn in code (rounded corners, light stripe, darker bottom, navy outline); empty ones are dark hollows. Same size and place as the old green bars (config hud.barW/barH/barGap). Colours in PILL at the top of src/hud.js.
- Checked in the browser pane at level 6. UNVERIFIED: size and look on a phone. Not built: a pulse when the level goes up, a gold full state at level 10.

## 2026-11-25 v1.9.131: horizontal, larger pills; score without the word (branch v1131-wide-pills)
- Pills are now horizontal and bigger: 8 x 5 px with 1 px gap (was 4 x 7 vertical), light stripe along the top. 10 pills are 89 px wide, centred; the wave pips start at about x 168, so they fit side by side (unverified with pips visible on a phone).
- The HUD shows only the number for the score (no 'SCORE'). The game-over screen still says SCORE.

## 2026-11-25 v1.9.132: cats and their rocks keep scrolling on the game over screen (branch v1132-cats-scroll-gameover)
- The game over branch of update() skipped cats.update, so the cats and their stones froze while the ground kept scrolling. It now calls cats.update; a cat that scrolls off on that screen is not counted as lost.
- Checked in the browser pane (cat and stone moved about 25 px in 0.6 s after game over). UNVERIFIED on phone.

## 2026-11-25 v1.9.133: hearts cannot be picked up at full health (branch v1133-full-hearts)
- With all 3 hearts, a falling heart passes through the witch and keeps falling; it can be caught after a hit. The old +50 score for a heart at full health no longer happens (config pickup.heartScoreIfFull is now unused).
- Checked in the browser pane (stays at full, collected at 2 hearts). UNVERIFIED on phone.

## 2026-11-25 v1.9.134: sound effects and music (branch v1134-sound)
- New src/sound.js (own Web Audio module; names, files, volumes at the top). assets/sfx (16 files, 456 KB), assets/music (menu, forest, 15 MB, streamed). Omri's picks; credits in CREDITS.md.
- Wired: shoot, enemy hit/die, coin, heart, potion + level up, witch hit, cat ring loop (one of 3 at random), cat rescued (2 together), game over, stage clear, taps, menu and forest music. Pause and background tab are silent. SOUND ON/OFF in settings (saved).
- No sound yet: chest, cat meow, swamp music, end-screen music.
- Checked in the browser pane: files load, no script errors, switch shows. UNVERIFIED: everything you hear (volumes, how often shoot repeats, loops).

## 2026-11-25 v1.9.135: softer sounds, pitch variety, music preload, settings stay open (branch v1135-sound-soft)
- EFFECTS button: the settings panel now opens again after the menu rebuilds (it closed before).
- Sound (src/sound.js): low-pass filter on all effects, 6 ms fade-in, compressor on the effects, lower volumes; shot cut to 0.16 s and max one per 130 ms; random pitch on shot, hit, enemy pop, coin.
- Music is fetched at game start (was fetched when the stage began, so the forest music was late). If it is still late, the track itself may have a quiet intro.
- Chest (box) hit and break have no sound yet: new slot 'chest is hit' in the local sound picker.
- UNVERIFIED: everything you hear.

## 2026-11-25 v1.9.136: music can mix with other apps; MUSIC switch (branch v1136-music-mix)
- Music now plays through Web Audio, not an <audio> player, so Android should not treat the game as a media player (a YouTube overlay should keep playing). Both tracks are unpacked at start at 22 kHz (memory cost, size not measured).
- Settings: MUSIC ON/OFF (saved), separate from SOUND. Panel a bit taller.
- Checked in the browser pane: music starts, stops, pauses and switches. UNVERIFIED on phone: mixing with YouTube, memory, sound quality.

## 2026-11-25 v1.9.137: potion magnet, shrink into the witch, pause options (branch v1137-potion-pause)
- Weapon potions are pulled by the magnet like coins. Coins and potions now shrink on the way in and are taken at her middle (feel.magnetTakeDist 8).
- Pause screen: CONTINUE, OPTIONS, RESTART, MENU. OPTIONS has SOUND, MUSIC, BACK.
- Checked in the browser pane (potion shrinks and levels up; options page shows). UNVERIFIED on phone.

## 2026-11-25 v1.9.138: volume bars instead of SOUND and MUSIC buttons (branch v1138-volume-bars)
- New src/volbar.js: a 10-pill bar, tap or drag, 0..10. In the menu settings and the pause OPTIONS page, one for SOUND and one for MUSIC. 7 = the mix as before, 10 = louder, 0 = silent; saved; an old OFF choice becomes 0.
- Checked in the browser pane (drag and tap change the level and it is saved). UNVERIFIED on phone: touch size, how the steps sound.

## 2026-11-25 v1.9.139: volume slider as a growing wedge with a handle (branch v1139-volume-wedge)
- Replaces the pills (Omri disliked them): a long triangle that gets taller to the right, blue up to a rectangular handle; drag or tap, half steps 0..10. Settings and pause OPTIONS. The finger can wander up or down while dragging.
- Checked in the browser pane. UNVERIFIED on phone.

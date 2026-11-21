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

// All tuning numbers live here. Change them and reload the page.
// Sizes and speeds below were written for a 360x640 screen. z(n) shrinks such a number by the zoom,
// so it looks the same fraction of the screen. (Sprite sizes are not shrunk: that is what makes them bigger.)
const ZOOM = 1.5;
export const z = n => Math.round(n / ZOOM);
export const hex = n => '#' + n.toString(16).padStart(6, '0'); // 0xff5ac8 -> '#ff5ac8' (for text colours)
export const snap4 = n => Math.max(8, Math.round(n / 4) * 4); // pixel font looks best at 8, 12, 16, 20, 24...

// One shot of a pattern: dx offset, angle in degrees, optional own damage.
const S = (dx, deg = 0, dmg) => ({ dx, deg, dmg });
const TWIN = [S(-5), S(5)];
// Weapon upgrades are ONLY fire rate and damage (same twin shot at every level).
// Special shots (spread, lasers...) will come later from bought power-ups / hangar upgrades.
// Level 10 does about 2.2x the damage per second of level 0. Tune the two steps below.
const WEAPON = { baseFireRateMs: 170, fireRateStep: 6, damageStep: 0.04 }; // each level: shoots 6 ms sooner, hits 4% harder
function weaponLevels() {
  const out = [];
  for (let i = 0; i <= 10; i++) {
    out.push({
      fireRateMs: WEAPON.baseFireRateMs - WEAPON.fireRateStep * i,
      pattern: TWIN,
      damage: Math.round((1 + WEAPON.damageStep * i) * 100) / 100
    });
  }
  return out;
}

export const CONFIG = {
  version: "1.5.2", // bump on every push so the player/Omri can see the build
  // Start menu (src/scenes/MenuScene.js). All sizes are logical px (game is 240x427).
  menu: {
    // UI palette (purple / pink / cyan / cream on dark; flat, no glow). Used by the menu, the end screen and the plates.
    pal: { purple: 0x3b1478, pink: 0xff5ac8, dark: 0x1a0830, cream: 0xfff3c4, orange: 0xff9a2e, cyan: 0x3df2ff, shadow: 0x12062e },
    plateDrop: 4, plateDownShift: 2, plateBorderW: 3, plateRadius: 10, tabW: 6, // chunky button plate: bottom edge height, how far a pressed plate sinks, border, corner, stage colour tab
    tabColors: { forest: 0xff9a2e, swamp: 0x3df2ff },
    bgColor: 0x14161f, titleY: 46, titleSize: 24, titleStroke: 4, // titleY..titleStroke: the old plain-text title (used only if the logo picture is missing)
    logo: { file: 'menu/logo.png', x: 120, y: 4, scale: 1 }, // the game logo (pumpkin colours), 116x83 art px; scale 1 = 3 canvas px per art px
    cardW: 200, cardH: 110, cardGap: 18, cardTop: 100, // first card top edge; the second sits cardGap below it
    cardRadius: 10, pressBrighten: 0.15, // pressed: plate fill mixed this much towards white
    numberSize: 32, nameSize: 20, bestSize: 12, // text sizes (px): pixel font looks best at multiples of 4
    medalScale: 2, medalGap: 8,   // medal icons in the row (scale of the art, px between icons)
    updateW: 120, updateH: 26, updateTop: 362, updateSize: 12, updateColor: 0x3b1478, updateHotColor: 0xff9a2e, updateHotBorder: 0x1a0830, // UPDATE button: size, top edge, text size, plate colour, plate colour + border when a newer version is waiting
    versionSize: 8, versionAlpha: 0.9, versionBottom: 12, // version text: distance of its middle from the bottom edge
    // Halloween menu art (assets/menu, Spooktober set). Sky = animated background (cells in a grid of `cols`), scaled to cover the screen width.
    sky: { file: 'menu/sky.png', frameW: 202, frameH: 360, frames: 18, cols: 6, fps: 5 },
    // Decorations around the cards (never over cards, medals, UPDATE or version; they take no input). file in assets/, frameW/frameH = one cell,
    // x/y = the point of the picture that sits at (x,y) (originX/originY 0..1), scale (multiples of 1/3 keep the pixels even), fps, bob = up-down swing in px (0 = still), bobMs = swing period, flipX.
    decor: [
      { key: 'witch',  file: 'menu/witch.png',  frameW: 61, frameH: 55, frames: 4, fps: 8, x: 40,  y: 78,  originX: 0.5, originY: 0.5, scale: 0.667, bob: 1, bobMs: 2200 },
      { key: 'ghost',  file: 'menu/ghost.png',  frameW: 29, frameH: 31, frames: 5, fps: 6, x: 204, y: 78,  originX: 0.5, originY: 0.5, scale: 1,     bob: 2, bobMs: 1800 },
      { key: 'bat',    file: 'menu/bat.png',    frameW: 32, frameH: 28, frames: 4, fps: 5, x: 196, y: 0,   originX: 0.5, originY: 0,   scale: 1,     bob: 0, bobMs: 1000 },
      { key: 'cat',    file: 'menu/cat.png',    frameW: 21, frameH: 25, frames: 5, fps: 4, x: 32,  y: 392, originX: 0.5, originY: 1,   scale: 1.333, bob: 0, bobMs: 1000 },
      { key: 'boiler', file: 'menu/boiler.png', frameW: 29, frameH: 30, frames: 4, fps: 6, x: 205, y: 422, originX: 0.5, originY: 1,   scale: 1.333, bob: 0, bobMs: 1000 }
    ]
  },
  endMenuBtn: { w: 96, h: 30, bottom: 36, size: 16, color: 0x3b1478, border: 0xff5ac8 }, // MENU button on the end screen (bottom = its middle's distance from the bottom edge)
  // zoom: 1.5 = everything looks 1.5x bigger on screen. Only this number needs to change.
  // The game is drawn on a smaller canvas (baseWidth/zoom) and Phaser stretches it to fill the phone.
  game: { zoom: ZOOM, baseWidth: 360, baseHeight: 640, width: Math.round(360 / ZOOM), height: Math.round(640 / ZOOM), pixelScale: 3, render: 3 }, // render: canvas is drawn this many times bigger than the logical size (sharp text); the camera zooms back. pixelScale: size of one art pixel in game units

  ship: {
    startY: z(520),
    dragSensitivity: 1.2, // ship moves this many times the finger movement (1 = 1:1, 1.5 = faster)
    // Weight: the ship eases toward the finger. Lag is about 1000/followRate ms (20 = 50 ms).
    // LOWER number = heavier, slower to catch up. HIGHER = lighter, closer to glued. 60+ is almost no weight.
    followRate: 28,
    glueRate: 2.5,        // per second: how fast the witch settles to the spot just above the finger (0 = pure relative drag, drift stays). Higher = stricter
    fingerOffsetY: z(45), // that spot is this far above the finger
    controls: "stick",    // "stick" = virtual stick (ring on screen, witch flies where you push) | "drag" = move by finger movement. Try both with ?ctl=stick / ?ctl=drag after the web address
    bankDeg: 8,          // max tilt in degrees when moving sideways (0 = no tilt)
    bankSpeed: z(400),   // sideways speed (units/s) that gives the full tilt
    bankEase: 14,        // how fast the tilt comes and goes (higher = snappier)
    spriteScale: 1.5,   // size of one witch art pixel. The witch sheet frame is 24x32 art px, so 1.5 = 36x48 px (about 15% of the screen width). 2 = bigger. Hitbox does not change
    witch: 2,           // which witch sheet from assets/witch: 1 = orange hair, blue cloak; 2 = blue hat, green cloak. Try with ?witch=1 / ?witch=2
    sideSpeed: z(110),  // sideways speed (px/s) from which the witch turns to her side-view frames (flying left or right)
    animFps: 8,         // wing-beat... broom-wobble speed of the flight animation
    shotY: 20,          // player shots start this far above the ship centre (at the hat tip)
    muzzleY: 22,        // muzzle flash height above the centre
    margin: 20,         // keep the ship centre this far from screen edges
    hearts: 3,
    invulnMs: 1500,
    ramKillsEnemy: true, // crashing into an enemy: it also dies (no score, no coin). false = it survives
    blinkMs: 90,
    restartDelayMs: 700, // wait after game over before a tap restarts
    hitShakeMs: 120,     // screen shake when hit
    hitShakeAmount: 0.01,
    hitRadius: 3        // the ship can only be hit in a tiny square this far (logical px) around its centre. Sprite is much bigger = fair
  },

  // Virtual stick (controls "stick"). The ring appears where the thumb lands. Sizes in logical px.
  stick: { show: false, radius: z(55), knobRadius: z(22), deadZone: 0.1, curve: 1.4, response: 40, speed: z(360), stopGlide: 0.12, stopOmega: 16, stopDamping: 0.3, restY: z(590), ringAlpha: 0.28, restAlpha: 0.14, depth: 55 }, // speed = witch speed at full push (px/s)

  // Player shots. Which shots, how fast and how hard come from weaponLevels below.
  bullet: {
    speed: z(620),
    poolSize: 90         // level 10 fires 7 shots every 145 ms and they live about 1 s: about 50 alive at once
  },

  // WEAPON LEVELS 0..10 (the 10 bars). The player starts a stage at 0; each green pickup = +1.
  // fireRateMs = time between volleys. damage = damage of each shot (a shot may set its own dmg, see S()).
  // pattern = list of shots: dx = sideways start offset (px), deg = angle (0 = straight up, + = to the right).
  // Rough damage on ONE target at close range (shots within about 7 deg): L0 12/s, L4 26/s, L8 40/s, L10 41/s.
  // The wide shots of L7+ add coverage on groups (nominal damage per second is about 3x higher than on one target).
  weaponLevels: weaponLevels(),

  background: {
    skyTop: 0x2a6fdb, skyBottom: 0x8fd3ff,
    farScroll: z(25), nearScroll: z(70), // px per second
    farCount: 14, nearCount: 7,
    // Which background: "forest" (pixel forest seen from above, default) | "swamp" (dark foggy swamp, stage 2) | "sky" (the old sky and clouds). Try with ?bg=forest / ?bg=swamp / ?bg=sky
    mode: "forest",
    forest: {
      groundColor: 0x768f5d, // the plain grass colour taken from the sheet (muted green, so red shots and gold coins stay easy to see)
      scroll: z(60),         // px per second (the same for everything, so it feels like flat ground). Faster when the witch flies up (feel.cloudBoost)
      light: { on: true, depth: -6, // leaf shadows + light shafts, drawn below all gameplay
        shadowCount: 3, shadowVariants: 3, shadowSize: 64, shadowCell: 3, shadowGapY: 300, shadowSpeedMul: 1.6, shadowDrift: 6, shadowAlpha: 0.12, shadowColor: 0x0d1f12, // shadows: how many, shapes, size in texels, game px per texel, gap above the screen, scroll speed vs floor, sideways px/s, strength, colour
        shaftCount: 3, shaftScale: [1.5, 1.8], shaftAngleDeg: 18, shaftAlpha: [0.02, 0.09], shaftPulse: 0.5, shaftDrift: 3 }, // shafts: how many, size, tilt, faintest and strongest, fade speed, sideways px/s
      treeLaneHalf: 55, treeEdge: 40, rockLaneHalf: 35, rockEdge: 52, // rocks like trees: centre at least rockLaneHalf px from the middle line, at least rockEdge px from the screen edge
      sway: { on: true, px: 4, curve: 1.6, fps: 3 }, // tree sway: top of the tree shifts up to px source-pixels left/right (whole pixels, rows shifted by (1-y/h)^curve); steps per second
      treeShadow: { on: true, angleDeg: 55, lenMul: 0.6, alpha: 0.18, color: 0x0d1f12, depth: -9 }, // tree shadows: tipped over from the base by this angle (clockwise = up and to the right), length as a share of the tree height, strength, colour
      // big trees: the tree centre stays at least treeLaneHalf px from the middle line (always to the sides) and at least treeEdge px from the screen edge
      propGap: 8, zigzag: 0.8, bushUnderTreeChance: 0.25, // path props: min gap between pictures (px), chance the next prop goes to the other side (zigzag/diagonal), chance a bush may sit under a tree
      rockCount: 3, rockScale: [0.9, 1.4], rockGapY: 300, rockMinDist: 100, // small rocks: how many, size multiplier (min, max), how far above the screen they come back, minimum distance between any two rocks (px)
      bigRockCount: 1, bigRockScale: 1.1, bigRockGapY: 1100, bigRockMinDist: 130, // big rocks: rare (comes back after up to bigRockGapY px of scrolling), cats will sit on them
      patchCount: 6,         // lighter grass blobs on the ground (flat, only for variety)
      blobVariants: 6, blobSize: [16, 34], blobCell: 2, // blob shapes made in code: size in texels (min, max); one texel = blobCell game px, so a blob is 32 to 68 px wide
      blobColor: 0x86a068, blobColor2: 0x92ad72,        // blob grass colour and its lighter specks (floor = groundColor)
      treeRows: [0, 2, 4],   // colour rows of the sheet used for trees and bushes: 0 = green, 2 = dark green, 4 = olive green (1 = khaki, 3 = autumn are not used)
      treeRowWeights: [4, 4, 1], // how often each of those rows is picked
      // EDGE WALLS: big tree tops along the left and right edge. The trunk is off screen, only the canopy shows, so a path is left between them.
      edgeCount: 14,         // tree tops per side kept alive (about 28 sprites in all). Fewer = gaps may show; more = more sprites
      edgeWidth: [100, 100],  // on-screen width of a tree top, min and max (px; the screen is 240 wide)
      edgeInset: [35, 55],   // how far a tree top reaches into the screen from its edge, min and max (px). The path edge gets wavy
      edgeStepY: [40, 52],   // distance from one tree top to the next one above it, min and max (px). Smaller than the tree height, so they overlap
      // MIDDLE PATH: only a few single props, sparse
      midMargin: 70,         // middle props stay this far from both side edges (px)
      midTreeCount: 1,       // single trees in the middle
      midBushCount: 1,       // bushes
      midSmallCount: 1,      // stumps and small firs
      midTreeWidth: [100, 100],  // on-screen width of a middle tree (px)
      midBushWidth: [36, 56],  // bush
      midSmallWidth: [30, 44], // stump / small fir
      midGapY: 450           // a middle prop that left the bottom comes back this far above the top at most (random 0..midGapY). More = emptier path
    }
  },

  // Enemy hp/score. Their movement, shooting and coins come from the wave data in src/waves.js.
  enemies: {
    grunt:   { hp: 3, score: 10 },
    zigzag:  { hp: 4, score: 20 },
    shooter: { hp: 7, score: 50 },
    vulture: { hp: 5, score: 30 }, // not in any wave yet
    poolSize: 40,
    hitFlashMs: 70,
    // Animated pictures. A type WITH an entry here uses its sheet (assets/enemies); a type WITHOUT one keeps its code-drawn picture (src/sprites.js).
    // file = sheet name, frameW/frameH = one frame in the sheet (sheet pixels), frames = frame numbers of ONE loop (never mix animations), fps = loop speed,
    // scale = size multiplier (1 = sheet pixels = logical px), hitW/hitH = hitbox in sheet pixels (trimmed to the body, times scale on screen),
    // faceVelocity = flip left/right by sideways movement (art drawn facing right), haloTint = glow colour of carriers {weapon, heart}, haloScale = glow size.
    sprites: {
      // Bat 1.3 (purple, never the red files), row S (flying towards the player), cut out as bat-S.png (3 frames = one wing flap: up, flat, down). Ping-pong 0,1,2,1.
      grunt:   { file: 'bat-S.png', frameW: 48, frameH: 64, frames: [0, 1, 2, 1], fps: 8, scale: 1.1, hitW: 27, hitH: 22, faceVelocity: false },
      // Dino IDLE sheet (4 frames = one breathing/bobbing loop, side view facing right). The long dino.png is a jump (crouch, leap, land), not a loop, so it is not used.
      shooter: { file: 'dino-idle.png', frameW: 32, frameH: 26, frames: [0, 1, 2, 3], fps: 6, scale: 1.25, hitW: 18, hitH: 20, faceVelocity: true },
      // Vulture (not used in waves yet). Frames of vulture.png: 0 = folded, 1 = wings up, 2 = wings flat/low, 3 = half. Flap loop: up, half, low, half. (Cleanest guess; check it.)
      vulture: { file: 'vulture.png', frameW: 39, frameH: 39, frames: [1, 3, 2, 3], fps: 8, scale: 0.8, hitW: 22, hitH: 22, faceVelocity: true }
    },
    haloTint: { weapon: 0x2ee86a, heart: 0xffc9e3 }, haloScaleSprite: 1.3
  },

  // Animated pictures for coins, hearts, chests and the death puff (strips cut from the packs, see CREDITS.md). Every entry is optional:
  // a thing WITHOUT an entry keeps its code-drawn picture (src/sprites.js). A strip is a row of equal cells: file (in assets/), frameW/frameH = one cell
  // (sheet pixels), frames = number of cells, fps = speed, scale = size multiplier (1 = sheet pixels = logical px). All strips of one thing share the same
  // cell size and centre, so switching animations never jumps. hitW/hitH = hitbox in sheet pixels (times scale on screen). Pickup grab radius stays coin.pickupRadius.
  sprites: {
    // Gold coin, 24 frames = one full spin, loops while it falls. Each coin starts at a random frame.
    coin: { file: 'pickups/coin.png', frameW: 18, frameH: 18, frames: 24, fps: 30, scale: 1 },
    // Falling heart (carrier drop): Drop plays once when it appears, then Idle loops while it falls; Collect plays once at the witch when she grabs it.
    heartPickup: { scale: 1, collectDepth: 12, // collectDepth: drawn over the witch (10)
      idle:    { file: 'pickups/heart-idle.png',    frameW: 26, frameH: 62, frames: 24, fps: 12 },
      drop:    { file: 'pickups/heart-drop.png',    frameW: 26, frameH: 62, frames: 11, fps: 14 },
      collect: { file: 'pickups/heart-collect.png', frameW: 26, frameH: 62, frames: 12, fps: 14 } },
    // Hearts in the top bar: the same Idle loop, scale = size (the old code-drawn heart was 14 px wide), desync = frames between neighbouring hearts.
    // A lost heart = the first Idle frame as a flat dark-grey shape (emptyTint) with emptyAlpha.
    heartHud: { scale: 0.6, desync: 8, emptyTint: 0x4a4f63, emptyAlpha: 0.6 },
    // Chest: Idle loops while it falls; Break plays once at its place when it is destroyed (coins burst at the same moment).
    // tint: the pack chest is yellow-orange, which looks like a coin, so it is multiplied toward muted brown (0xffffff = untouched, null = no tint). hit = trimmed body.
    crate: { scale: 0.75, tint: 0x9a98a8, hitW: 24, hitH: 28, breakDepth: -0.2, // breakDepth: the bursting chest is drawn just under the coins and enemies (0)
      idle:  { file: 'pickups/crate-idle.png',  frameW: 88, frameH: 40, frames: 18, fps: 12 },
      break: { file: 'pickups/crate-break.png', frameW: 88, frameH: 40, frames: 15, fps: 20 } },
    // Death puff under the sparks: 30 frames of the pack's "poof" (white pop, smoke balls, thinning; the thin tail was left out) played once.
    // scale = size, bigMul = extra size for the shooter and the chest, poolSize = puffs at once, depth = under the sparks (20) and rings (19).
    poof: { file: 'fx/poof.png', frameW: 82, frameH: 72, frames: 30, fps: 60, scale: 0.6, bigMul: 1.5, poolSize: 8, depth: 18 },
    // Weapon-upgrade pickup = green gem (4 frames of 16x16, loops, random start frame). scale 1 = 16 px (3 screen pixels per art pixel; stays even). The grab radius stays coin.pickupRadius on screen.
    weaponGem: { file: 'pickups/gem-green.png', frameW: 16, frameH: 16, frames: 4, fps: 8, scale: 1 },
    fxPoolSize: 8 // chest-break and heart-collect animations playing at once
  },

  // Enemy shots: slow red orbs. speed is the default; the wave data may set its own. hitSize = art pixels of the orb core.
  enemyBullet: { poolSize: 30, speed: 100, hitSize: 3, depth: 35 }, // depth 35: above all effects (sparks 20, texts 30), below the HUD (50)

  // pickupRadius: how close the ship must be to grab a coin (logical px). Bigger than the ship hitbox on purpose.
  coin: { fallSpeed: z(90), value: 5, poolSize: 40, pickupRadius: 10 },

  // Crates: hp, coins and speed are set per crate in src/waves.js. coinSpread = sideways speed between coins.
  // coinFadeSec: the sideways burst fades to 0 in this many seconds. poolSize: max crates at once.
  crate: { coinSpread: 4, coinFadeSec: 0.4, poolSize: 4 }, // (crate size = its art in src/sprites.js, CRATE, 7x7 art px = 21 px)

  // Pickups dropped by marked carrier enemies (drop: 'weapon' / 'heart' in src/waves.js).
  // Pickup grab radius is coin.pickupRadius. heartScoreIfFull: score given for a heart when already at full hearts.
  pickup: {
    weaponFallSpeed: z(130), heartFallSpeed: z(55), heartScoreIfFull: 50, maxLevel: 10,
    weaponPoolSize: 4, heartPoolSize: 4, // pickups on screen at once
    haloPoolSize: 12,  // glowing outlines around carriers alive at once
    haloPulseMs: 500    // one pulse of the carrier glow
  },

  stage: {
    firstWaveDelay: 1.5, // seconds before the first wave starts
    endDelayMs: 1500     // after the last enemy is gone, wait this long (coins can still be caught), then show STAGE CLEAR
  },

  particles: { poolSize: 140, perExplosion: 8, speed: z(140), lifeMs: 450 },

  // Game feel (no sound). Every number is a knob; 0 turns most things off.
  feel: {
    hitStopMs: 60,                          // freeze when the player loses a heart
    bigExplosionCount: 16, bigExplosionSpeedMul: 1.3, // shooter / crate dies
    bigShakeMs: 90, bigShakeAmount: 0.004,
    coinSparkCount: 4, coinSparkSpeedMul: 0.5,
    scorePopScale: 0.3, scorePopMs: 160,    // score text grows by this much and settles back
    muzzleMs: 45, muzzleSize: 2, muzzleSpread: 3, // flash at the nose on each volley
    levelFlashMs: 160, levelSparkCount: 8,  // green flash on the ship at a weapon upgrade

    // Sparkle trail behind the broom
    trail: true, trailPoolSize: 110, trailY: 22,   // trailY = how far below the ship centre the sparks start
    trailIdleMs: 90, trailMoveMs: 26,            // time between sparks when still / at full speed (lower = more sparks)
    trailLifeMs: 900, trailSpeed: z(75), // medium length: about speed x life = 45 px behind the witch
    trailSize: [2.2, 4], trailColors: [0xff7ad9, 0xc89cff, 0x8fb4ff, 0x5fe6d0, 0xb15bd6, 0xffffff], // spark size (art px, min..max); colours in order: pink, lilac, blue, mint, violet, white (no red or gold: those are for enemy shots and coins)
    trailSpreadX: 4, trailJitter: 8, trailCarry: 0.12, // sideways start spread (px), random sideways speed, share of the witch's speed the sparks keep

    recoilPx: 1,                            // witch squashes by about this many px on each volley (0 = off)
    recoilMs: 90,

    hitKickPx: 2, hitKickMs: 90,            // enemy is pushed back / shaken this much when hit (0 = off)
    impactSparks: 3,                        // cyan-white sparks where a shot lands (0 = off)
    impactSpeedMul: 0.45, impactSize: 2, impactLifeMul: 0.5,

    ringPoolSize: 16, ringDepth: 19, pickupRingExtraMs: 100, // rings at once; draw depth; pickup rings last this much longer
    deathRing: true, deathRingMs: 280,      // ring puff when something dies / is picked up
    deathRingScale: 1.2, bigDeathRingScale: 2, // final ring size in art pixels x PX (small enemies / imp, crate, pickups)

    popText: true, popTextMs: 650, popTextRise: z(26), popTextSize: 12, popPoolSize: 10, popTextEdge: 14, popTextOffsetY: 24, // floating "+10" at kills and coins
    magnetRadius: 34, magnetSpeed: z(300),  // coins fly to the witch from this far (0 = off)

    hitFlashMs: 140,                        // white-pink screen flash when the witch is hit (0 = off)
    hitFlashStrength: 0.3, flashColor: 0xffcdd7, flashDepth: 25, // start strength 0..1 (low so shots stay visible); depth must stay below enemyBullet.depth
    heartPopMs: 350, heartPopScale: 0.7, heartShakePx: 2, // lost heart pops and shakes in the HUD

    enemyShotPulse: 0.08, enemyShotPulseMs: 360, // enemy shots swell and shrink a little (0 = off)
    fireFlashScale: 0.9, fireFlashMs: 220, fireFlashAlpha: 0.7,                    // small white ring at an enemy when it fires (0 = off)

    endEaseMs: 300,                         // fade-in of the game over / stage clear screen (0 = instant)
    cloudBoost: 0.25, cloudEase: 4                        // clouds scroll this much faster (extra x) when the witch flies up fast (0 = off)
  },

  // HUD layout (logical px on the 240-wide screen)
  hud: {
    margin: 4,
    medalSize: 10, medalGap: 2,
    versionSize: 8, versionAlpha: 0.9, versionStroke: 3, versionGap: 2, // version text under the medals (px, 0..1, outline px, gap under medals)
    rowOffset: 22,                  // bars (and wave dots) start this far below the top margin; below the score text even when it pops
    heartStep: z(26), heartY: 6,    // distance between hearts; heart centre below the top margin
    barW: 4, barH: 7, barGap: 2,
    showWaveIndicator: false, // the 10 wave dots under the hearts: false = hidden (Omri, v0.3.2). true brings them back
    pip: 5, pipGap: 2, pipBlinkMs: 350
  }
};

// SWAMP (stage 2): the same engine as the forest (makeForest in PlayScene.js), so it starts as a copy of every forest number and
// only the numbers below are different. Pictures: "Murky Swamp" pack, see CREDITS.md. A name ending in _anim is an 8-frame strip
// (assets/swamp/<name>.png) that plays by itself; any other name is a single picture.
CONFIG.background.swamp = {
  ...CONFIG.background.forest,
  groundColor: 0x444f3c, // murky green-brown from the pack palette (mid-dark, not black, so red shots and gold coins stay easy to see)
  files: {
    trees: ['willow_0_anim', 'willow_1_anim', 'cypress_tree_0_anim', 'cypress_tree_1_anim', 'swamp_tree_0_anim', 'swamp_tree_1_anim', 'swamp_tree_2_anim', 'gnarled_oak_0_anim', 'gnarled_oak_1_anim'], // edge walls + big trees (all drawn 100 px wide)
    bushes: ['reeds_0_anim', 'reeds_1_anim', 'cattails_0_anim', 'cattails_1_anim', 'bog_cotton_0_anim', 'water_hyacinth_0_anim', 'sundew_0_anim', 'pitcher_plants_0_anim', 'glow_mushrooms_0_anim', 'skunk_cabbage_0'], // low plants on the path
    smalls: ['mossy_log_0', 'mossy_log_1', 'fallen_mossy_trunk_0', 'fallen_mossy_trunk_1', 'hollow_stump_0', 'willow_stump_0_anim', 'lily_pads_0', 'toad_pad_0', 'stepping_stones_0', 'stepping_stones_1'], // logs, stumps, pads, stones
    rocks: ['moss_lump_0', 'moss_lump_1', 'moss_boulder_0', 'moss_boulder_1'],   // small rocks
    bigRocks: ['frog_rock_0', 'frog_rock_1', 'moss_boulder_0', 'moss_boulder_1'] // rare big rocks (cat spots)
  },
  animFps: 5, animFrames: 8, // animated strips: pictures per second, frames per strip (each one starts at a random frame)
  midBushScale: [1, 1.3], midSmallScale: [1, 1.2], // swamp props keep their own size (a log stays longer than a lily pad): size multiplier (min, max) instead of a fixed width
  midBushCount: 2, midSmallCount: 1,
  rockScale: [1, 1.4], bigRockScale: 1.5,
  patchCount: 8, blobVariants: 6, blobSize: [20, 40], blobCell: 2, // dark still-water pools instead of grass blobs
  blobColor: 0x2d4745, blobColor2: 0x3a5955,                       // pool colour (dark teal) and its lighter specks
  treeShadow: { on: true, angleDeg: 55, lenMul: 0.6, alpha: 0.28, color: 0x0a120c, depth: -9 },
  light: { on: true, depth: -6, // fog: big, very soft, pale grey-green patches (same code as the forest cloud shadows) drifting over the floor
    shadowCount: 5, shadowVariants: 3, shadowSize: 64, shadowCell: 4, shadowGapY: 300, shadowSpeedMul: 1.5, shadowDrift: 5, shadowAlpha: 0.12, shadowColor: 0xb4c2b0,
    shaftCount: 0, shaftScale: [1, 1], shaftAngleDeg: 0, shaftAlpha: [0, 0], shaftPulse: 0, shaftDrift: 0 } // no light shafts in the swamp
};

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
const SINGLE = [S(0)]; // one shot straight up (the fire shot); it hits twice as hard as one twin shot, so damage per second stays the same
// Weapon upgrades are ONLY fire rate and damage (same twin shot at every level).
// Special shots (spread, lasers...) will come later from bought power-ups / hangar upgrades.
// Level 10 does about 2.2x the damage per second of level 0. Tune the two steps below.
const WEAPON = { baseFireRateMs: 170, fireRateStep: 6, damageStep: 0.04, shotDamageMul: 2 }; // each level: shoots 6 ms sooner, hits 4% harder
function weaponLevels() {
  const out = [];
  for (let i = 0; i <= 10; i++) {
    out.push({
      fireRateMs: WEAPON.baseFireRateMs - WEAPON.fireRateStep * i,
      pattern: SINGLE,
      damage: Math.round((1 + WEAPON.damageStep * i) * WEAPON.shotDamageMul * 100) / 100
    });
  }
  return out;
}

// Shared shine look of coins, hearts and potions (see sprites.coinShine / heartShine / potionShine). glow.size scales the glow (1 = rings of 5, 8, 11 pixels; the potion's glow was 50% too big, so 0.67),
// glow.opacity scales how strong it is. Each drop has its own beam length (radius), opacity (alpha), tip fade (alphaEnd) and glow numbers: change them per drop in the tune panel (DROPS tab).
const SHINE = { radius: 13, offsetY: 0, inner: 1, widthStart: 1, widthEnd: 5, alphaEnd: 0.25, fps: 6, alpha: 0.2, glintEveryMs: 1200, glintMs: 200,
  glow: { cell: 2, size: 0.52, opacity: 0.6, rings: [{ r: 5, a: 0.55 }, { r: 8, a: 0.38 }, { r: 11, a: 0.2 }], flicker: [1, 0.85, 1, 0.7, 0.95], stepFps: 6 } };
const shine = own => ({ ...SHINE, ...own, glow: { ...SHINE.glow, ...(own.glowOver || {}) } }); // every drop has its OWN numbers (own glow object too); glowOver = the glow numbers that differ

export const CONFIG = {
  version: "1.9.71", // bump on every push so the player/Omri can see the build
  // Start menu (src/scenes/MenuScene.js). All sizes are logical px (game is 240x427).
  menu: {
    // UI palette (purple / pink / cyan / cream on dark; flat, no glow). Used by the menu, the end screen and the plates.
    pal: { purple: 0x3b1478, pink: 0xff5ac8, dark: 0x1a0830, cream: 0xfff3c4, orange: 0xff9a2e, cyan: 0x3df2ff, shadow: 0x12062e },
    plateDrop: 4, plateDownShift: 2, plateBorderW: 3, plateRadius: 10, tabW: 6, // chunky button plate: bottom edge height, how far a pressed plate sinks, border, corner, stage colour tab
    tabColors: { forest: 0xff9a2e, swamp: 0x3df2ff },
    bgColor: 0x14161f, titleY: 46, titleSize: 24, titleStroke: 4, // titleY..titleStroke: the old plain-text title (used only if the logo picture is missing)
    logo: { file: 'menu/logo-text.png', decor: 'menu/logo-decor.png', decorParts: [[2,1,7,8],[26,8,1,1],[39,3,5,5],[52,7,1,1],[64,2,5,5],[81,6,1,1],[102,2,11,5],[111,73,5,5],[4,67,11,5],[8,53,5,5]], decorPop: false, decorDelay: 1500, decorStepMs: 140, wordStepMs: 100, riseMs: 1200, overshoot: 0.6, x: 120, y: 252, scale: 1.7 }, // the game logo (pumpkin colours), 116x83 art px; scale 1 = 3 canvas px per art px
    // Small effects of the menu (src/scenes/MenuScene.js startEffects): cauldron bubbles, sparks behind the witch's broom (dx, dy from her centre), fireflies, shooting stars (every ms [min, max],
    // start x / y ranges, travel dx / dy, ms) and the sparks on a touch (count, how far, ms). tilt: the sky and the friends shift when the phone is tilted (range = degrees for the full shift, sky = px).
    bits: {
      cauldron: { every: 260, dy: 8, tints: [0xff5ac8, 0x3df2ff, 0xfff3c4] },
      trail: { every: 70, dx: -38, dy: 26, tints: [0xff5ac8, 0xffffff, 0xc89cff] },
      fireflies: { count: 7, area: [24, 16, 216, 236], color: 0xfff3a0 },
      star: { everyMs: [8000, 14000], x: [130, 250], y: [8, 80], dx: -110, dy: 55, ms: 650 },
      tap: { count: 9, dist: [12, 26], ms: 420, tints: [0xf2b632, 0xff5ac8, 0xfff3c4] }
    },
    tilt: { on: true, range: 20, sky: 4 },
    intro: { bubbles: false }, // true: the stage bubbles slide in from the sides when the menu opens (the witch does it with decor witch introX, a number of px to fly in from, 0 = off). Off: only the logo moves in; everything else is just there
    logoShine: { on: false, frames: 14, band: 26, strength: 0.45, frameMs: 45, everyMs: 4200, firstMs: 2600, float: 2, floatMs: 2800 }, // glint sweep over the logo (frames, band width in art px, brightness 0..1, ms per frame, ms between sweeps, ms until the first one) and the float (px, ms for a full swing)
    // Stage path (the main menu): a line up the middle, a bubble left or right of it at height cy. side L / R. A node with locked: true is faded, says SOON and takes no taps.
    // Stage path (the main menu): a line up the middle, a bubble left or right of it. nodes go from the LOWEST stage up (stage 1 first); bubble i sits step px above the one below,
    // starting at bottomCy. A node with locked: true is faded, says SOON and takes no taps. With more nodes than fit the path scrolls (drag up / down, mouse wheel): topStop = where the highest bubble
    // stops, friction = how fast it stops gliding. Bubbles and line fade out below fadeStart (to nothing at lineBottom = about the witch's hat) and at the top (fadeTop px / fadeTopBubble px).
    path: { x: 120, lineColor: 0xf2b632, lineW: 4, lineTop: 0, lineBottom: 258, fadeStart: 226, fadeTop: 6, fadeTopBubble: 14, viewBottom: 250, gap: 8, bubbleW: 100, bubbleH: 68,
      lookAhead: 3, overMax: 40, step: 71, bottomCy: 192, topStop: 50, friction: 4, nodes: [
      { theme: 'forest', name: 'FOREST', side: 'L' },
      { theme: 'swamp', name: 'SWAMP', side: 'R' },
      { theme: 'stage3', name: 'STAGE 3', side: 'L', locked: true },
      { theme: 'stage4', name: 'STAGE 4', side: 'R', locked: true },
      { theme: 'stage5', name: 'STAGE 5', side: 'L', locked: true }] },
    bubble: { picAlpha: 0.55, picTint: 0xc8b8e8, lockedTint: 0x9a9a9a, ink: 0xfff3c4, bestInk: 0xf2b632, lockedInk: 0x8a80a8, inset: 0x1a0830, nameSize: 10, medalScale: 1.333, medalGap: 3, bestSize: 8 }, // text and medal sizes inside a stage bubble
    lockedFill: 0x241c3a, lockedBorder: 0x6b5a90, lockedText: 0x9a90b8, // a locked stage bubble
    gear: { x: 215, y: 24, hit: 32, scale: 1, art: 12, px: 2, color: 0x38b6f5, shade: 0x1c6fb5 }, // settings gear: the medallion picture at scale (the art / px / colour numbers are only for the code-drawn fallback cog)
    settings: { x: 20, y: 84, w: 200, h: 262, btnW: 60, btnSize: 10, titleSize: 16, ink: 0x3b2410, hintInk: 0x7a5a3a, depth: 100 }, // settings panel (parchment): position, size, button width, text sizes, ink colours
    cardW: 200, cardH: 110, cardGap: 18, cardTop: 100, // first card top edge; the second sits cardGap below it
    cardRadius: 10, pressBrighten: 0.15, // pressed: plate fill mixed this much towards white
    numberSize: 32, nameSize: 20, bestSize: 12, // text sizes (px): pixel font looks best at multiples of 4
    medalScale: 2, medalGap: 8,   // medal icons in the row (scale of the art, px between icons)
    updateBtn: { w: 80, textColor: 0xfff3c4 }, // UPDATE button: the button of the Medieval UI pack (recoloured to the game's purple and pink) (assets/ui), 25 px high, w px wide (the middle stretches), dark brown text
    updateW: 120, updateH: 26, updateTop: 384, updateSize: 8, updateColor: 0x3b1478, updateHotColor: 0xff9a2e, updateHotBorder: 0x1a0830, // UPDATE button: size, top edge, text size, plate colour, plate colour + border when a newer version is waiting
    versionSize: 8, versionAlpha: 0.9, versionBottom: 9, // version text: distance of its middle from the bottom edge
    // Halloween menu art (assets/menu, Spooktober set). Sky = animated background (cells in a grid of `cols`), scaled to cover the screen width.
    sky: { file: 'menu/sky.png', frameW: 202, frameH: 360, frames: 18, cols: 6, fps: 5 },
    // Decorations around the cards (never over cards, medals, UPDATE or version; they take no input). file in assets/, frameW/frameH = one cell,
    // x/y = the point of the picture that sits at (x,y) (originX/originY 0..1), scale (multiples of 1/3 keep the pixels even), fps, bob = up-down swing in px (0 = still), bobMs = swing period, flipX.
    decor: [
      { key: 'witch',  file: 'menu/witch.png',  frameW: 61, frameH: 55, frames: 4, fps: 5, x: 52,  y: 266,  originX: 0.5, originY: 0.5, scale: 1.667, depth: 50, bob: 3, bobMs: 3200, swayX: 3, swayDeg: 2, swayMs: 4200, introX: 0, par: 6 },
      { key: 'ghost',  file: 'menu/ghost.png',  frameW: 29, frameH: 31, frames: 5, fps: 6, x: 198, y: 236,  originX: 0.5, originY: 0.5, scale: 1.667, depth: 50, bob: 6, bobMs: 3400, swayX: 4, swayMs: 5200, fade: [0.7, 1], fadeMs: 2800, par: 8 },
      { key: 'bat',    file: 'menu/bat.png',    frameW: 32, frameH: 28, frames: 4, fps: 5, x: 160, y: 0,   originX: 0.5, originY: 0,   scale: 1,     bob: 0, bobMs: 1000 },
      { key: 'cat',    file: 'menu/cat.png',    frameW: 21, frameH: 25, frames: 5, fps: 4, x: 32,  y: 392, originX: 0.5, originY: 1,   scale: 1.333, depth: 50, bob: 0, bobMs: 1000, par: 6 },
      { key: 'boiler', file: 'menu/boiler.png', frameW: 29, frameH: 30, frames: 4, fps: 6, x: 205, y: 422, originX: 0.5, originY: 1,   scale: 1.333, depth: 50, bob: 0, bobMs: 1000, par: 6 }
    ]
  },
  endMenuBtn: { w: 96, h: 30, bottom: 36, size: 10, color: 0x3b1478, border: 0xff5ac8 }, // MENU button on the end screen (bottom = its middle's distance from the bottom edge)
  // zoom: 1.5 = everything looks 1.5x bigger on screen. Only this number needs to change.
  // The game is drawn on a smaller canvas (baseWidth/zoom) and Phaser stretches it to fill the phone.
  fontScale: 0.38, // pixel font size steps: asked text size x this = canvas px per art pixel (rounded, at least 3). Bigger = bigger text everywhere (see fpx in hud.js)
  game: { zoom: ZOOM, baseWidth: 360, baseHeight: 640, width: Math.round(360 / ZOOM), height: Math.round(640 / ZOOM), pixelScale: 3, render: 3 }, // render: canvas is drawn this many times bigger than the logical size (sharp text); the camera zooms back. pixelScale: size of one art pixel in game units

  ship: {
    startY: z(520),
    dragSensitivity: 1.2, // ship moves this many times the finger movement (1 = 1:1, 1.5 = faster)
    // Drag feel (spring). While the finger MOVES the witch catches up quickly (fastW strength, fastZ damping, no bounce). When the thumb is DOWN and the finger STOPS for idleMs she coasts a little past it (when the thumb is lifted she stops where the swipe put her, no overshoot)
    // and slowly settles back (slowW low = lazy return, slowZ low = more bounce). Moving the finger again switches back to the quick catch-up at once. spring: null = the old easing (followRate).
    spring: { fastW: 36, fastZ: 0.85, slowW: 4.5, slowZ: 0.45, idleMs: 50 },
    dragSlopPx: 4,        // touch dead zone: after the thumb lands it must move this far before the witch follows (a resting thumb never moves her)
    // Weight: the ship eases toward the finger. Lag is about 1000/followRate ms (20 = 50 ms).
    // LOWER number = heavier, slower to catch up. HIGHER = lighter, closer to glued. 60+ is almost no weight.
    followRate: 28,
    glueRate: 2.5,        // per second: how fast the witch settles to the spot just above the finger (0 = pure relative drag, drift stays). Higher = stricter
    fingerOffsetY: z(45), // that spot is this far above the finger
    mouseOnDesktop: true, // on a desktop browser (a real mouse) the witch follows the mouse pointer automatically; phones keep "controls" below. ?ctl=mouse / stick / drag overrides
    controls: "drag",     // "stick" = virtual stick (ring on screen, witch flies where you push) | "drag" = move by finger movement. Try both with ?ctl=stick / ?ctl=drag after the web address
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
  stick: { show: false, radius: 47, knobRadius: z(22), deadZone: 0.1, curve: 1, response: 44, speed: 200, stopGlide: 0.12, stopOmega: 11, stopDamping: 0.5, edgeZone: 50, edgeSpeed: 0.35, restY: z(590), ringAlpha: 0.28, restAlpha: 0.14, depth: 55 }, // speed = witch speed at full push (px/s). edgeZone = distance from a wall (px) where she starts to slow down when flying TOWARD it, edgeSpeed = her speed at the wall as a fraction (1 = no slowing, 0.35 = 35%)

  // Player shots. Which shots, how fast and how hard come from weaponLevels below.
  bullet: {
    speed: z(333), // witch shot speed (was z(620), z(520), z(416))
    refSpeed: z(333), gap: 1, // gap = spacing between shots (1 = normal). The time between volleys is fireRateMs x gap x refSpeed / speed, so a faster or slower shot keeps the same spacing unless you change gap; keep refSpeed equal to the normal speed above
    // The witch's shot: one orange fire bolt straight up ("flight_smooth" of the SovDigital fire pack, north row, shrunk 5x and cut to 6 fire colours). Delete this entry to get the old twin code-drawn shots back (then set pattern TWIN).
    fire: { file: 'shots/fox-shot-6.png', frameW: 13, frameH: 19, frames: 1, fps: 1, scale: 1, hitW: 6, hitH: 14 }, // the witch's shot: Fox shot 6, colour 5 (a blue teardrop, one picture) from the FoX71 shot sheet. Old fire strip: fx/fire-shot.png (frameW 8, frameH 22, frames 12, fps 24, hueShift 195)
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
      sway: { on: true, px: 4, curve: 1.6, fps: 1.5 }, // tree sway: top of the tree shifts up to px source-pixels left/right (whole pixels, rows shifted by (1-y/h)^curve); steps per second
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
    hitFlashMs: 110,    // white flash of a hit enemy (ms)
    // Animated pictures. A type WITH an entry here uses its sheet (assets/enemies); a type WITHOUT one keeps its code-drawn picture (src/sprites.js).
    // file = sheet name, frameW/frameH = one frame in the sheet (sheet pixels), frames = frame numbers of ONE loop (never mix animations), fps = loop speed,
    // scale = size multiplier (1 = sheet pixels = logical px), hitW/hitH = hitbox in sheet pixels (trimmed to the body, times scale on screen),
    // faceVelocity = flip left/right by sideways movement (art drawn facing right), haloTint = glow colour of carriers {weapon, heart}, haloScale = glow size.
    sprites: {
      // Bat 1.3 (purple, never the red files), row S (flying towards the player), cut out as bat-S.png (3 frames = one wing flap: up, flat, down). Ping-pong 0,1,2,1.
      grunt:   { file: 'bat-S.png', frameW: 48, frameH: 64, frames: [0, 1, 2, 1], fps: 8, scale: 1.1, hitW: 27, hitH: 22, faceVelocity: false },
      // Dino IDLE sheet (4 frames = one breathing/bobbing loop, side view facing right). The long dino.png is a jump (crouch, leap, land), not a loop, so it is not used.
      // Ghost = the green pixel ghost, animation 'column 3' of gosth.png (gallery numbering, x=50) (4 frames of 25x25, read top to bottom), replaces the code-drawn swaying ghost.
    zigzag:  { file: 'ghost-sway.png', frameW: 25, frameH: 25, frames: [0, 1, 2, 3], fps: 8, scale: 2.1, hitW: 14, hitH: 16, faceVelocity: false },
    shooter: { file: 'wisp.png', frameW: 96, frameH: 96, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], fps: 12, scale: 0.5, hitW: 44, hitH: 52, faceVelocity: false }, // fire wisp (10 frames of 96 px, drawn at half size)
      // Vulture (not used in waves yet). Frames of vulture.png: 0 = folded, 1 = wings up, 2 = wings flat/low, 3 = half. Flap loop: up, half, low, half. (Cleanest guess; check it.)
      vulture: { file: 'vulture.png', frameW: 39, frameH: 39, frames: [1, 3, 2, 3], fps: 8, scale: 0.8, hitW: 22, hitH: 22, faceVelocity: true }
    },
    haloTint: { weapon: 0x2ee86a, heart: 0xffc9e3 }, haloPx: 2 // outline thickness of a carrier in game px (4 shifted copies of its frame)
  },

  // Animated pictures for coins, hearts, chests and the death puff (strips cut from the packs, see CREDITS.md). Every entry is optional:
  // a thing WITHOUT an entry keeps its code-drawn picture (src/sprites.js). A strip is a row of equal cells: file (in assets/), frameW/frameH = one cell
  // (sheet pixels), frames = number of cells, fps = speed, scale = size multiplier (1 = sheet pixels = logical px). All strips of one thing share the same
  // cell size and centre, so switching animations never jumps. hitW/hitH = hitbox in sheet pixels (times scale on screen). Pickup grab radius stays coin.pickupRadius.
  sprites: {
    // Gold coin, 24 frames = one full spin, loops while it falls. Each coin starts at a random frame.
    coin: { file: 'pickups/coin.png', frameW: 18, frameH: 18, frames: 24, fps: 30, scale: 1.0 },
    // Falling heart (carrier drop): Drop plays once when it appears, then Idle loops while it falls; Collect plays once at the witch when she grabs it.
    heartPickup: { scale: 1, collectDepth: 12, // collectDepth: drawn over the witch (10)
      idle:    { file: 'pickups/heart-idle.png',    frameW: 26, frameH: 62, frames: 24, fps: 8 },
      shine:   { file: 'pickups/heart-shine.png',   frameW: 26, frameH: 62, frames: 24 }, // the pack's outline_shine layer, drawn over Idle (same frames); remove the key to hide it
      drop:    { file: 'pickups/heart-drop.png',    frameW: 26, frameH: 62, frames: 11, fps: 14 },
      collect: { file: 'pickups/heart-collect.png', frameW: 26, frameH: 62, frames: 12, fps: 14 } },
    // Hearts in the top bar: the same Idle loop, scale = size (the old code-drawn heart was 14 px wide), desync = frames between neighbouring hearts.
    // A lost heart = the first Idle frame as a flat dark-grey shape (emptyTint) with emptyAlpha.
    heartHud: { scale: 0.6, desync: 8, emptyTint: 0x4a4f63, emptyAlpha: 0.6 },
    // Chest: Idle loops while it falls; Break plays once at its place when it is destroyed (coins burst at the same moment).
    // tint: the pack chest is yellow-orange, which looks like a coin, so it is multiplied toward muted brown (0xffffff = untouched, null = no tint). hit = trimmed body.
    crate: { scale: 0.75, tint: 0x9a98a8, hitW: 24, hitH: 28, breakDepth: -8.1, // breakDepth: the bursting chest is drawn just under the coins and enemies (0)
      idle:  { file: 'pickups/crate-idle.png',  frameW: 88, frameH: 40, frames: 18, fps: 12 },
      break: { file: 'pickups/crate-break.png', frameW: 88, frameH: 40, frames: 15, fps: 20 } },
    // Death puff under the sparks: 30 frames of the pack's "poof" (white pop, smoke balls, thinning; the thin tail was left out) played once.
    // scale = size, bigMul = extra size for the shooter and the chest, poolSize = puffs at once, depth = under the sparks (20) and rings (19).
    poof: { file: 'fx/poof.png', frameW: 82, frameH: 72, frames: 30, fps: 60, scale: 0.6, bigMul: 1.5, poolSize: 8, depth: 18, originX: 0.45, originY: 0.57 }, // origin = the middle of the smoke inside its picture (found from the pixels), so a random turn spins it in place
    // Weapon-upgrade pickup = green gem (4 frames of 16x16, loops, random start frame). scale 1 = 16 px (3 screen pixels per art pixel; stays even). The grab radius stays coin.pickupRadius on screen.
    // Stars circling over her head after a hit ("stunned" of the free spell pack, MIT, 60 frames of 60x64, loops). offsetY = from her centre (negative = up; the stars sit just above her head), fadeMs = fade-out at the end. It lasts as long as she blinks after a hit (ship.invulnMs).
    // SHINE of every drop (coin, heart, potion): ONE shared look (SHINE above): spinning beams (3 pictures at fps, alpha = opacity, radius = length, widths in px) and a soft glow of flat rings behind it,
    // plus a little white twinkle. Only the colours and the twinkle spot differ per drop. Every drop on screen has it. The tune panel changes the shared numbers for all three at once.
    coinShine: shine({ groupPx: 14, rayColor: '#ffe9a0', glowColors: [0xfff3c0, 0xffd04a, 0xc98a1a], glintDx: 5, glintDy: -6 }),
    potionShine: shine({ radius: 14, glowOver: { size: 0.55 }, bobAmp: 0, bobSpeed: 5, offsetY: 3, rayColor: '#cfe4ff', glowColors: [0xb8d8ff, 0x4f8fe0, 0x2f5fbf], glintDx: 6, glintDy: -9 }),
    heartShine: shine({ radius: 14, glowOver: { size: 0.55 }, rayColor: '#ffc4e2', glowColors: [0xffe3f0, 0xff8fc0, 0xc0407a], glintDx: 6, glintDy: -8, bobAmp: 14, bobSpeed: 5 }), // bobAmp px/s fall-speed swing, bobSpeed radians/s
    stunned: { file: 'fx/stunned.png', frameW: 60, frameH: 64, frames: 60, fps: 30, scale: 0.8, offsetY: -7, fadeMs: 300 },
    weaponGem: { file: 'pickups/potion-flask.png', frameW: 64, frameH: 64, frames: 24, fps: 8, scale: 0.45, angle: 25 }, // the weapon potion: round blue flask of the Alchemy pack (Frakassets, 64 px, no outline, lit; 24 frames at 12 fps). scale 0.45 = about the old size. angle = tilt in degrees
    fxPoolSize: 8 // chest-break and heart-collect animations playing at once
  },

  // Enemy shots: slow red orbs. speed is the default; the wave data may set its own. hitSize = art pixels of the orb core.
  // Colour wash (easy tint): one flat colour over the play field at low strength, so pictures from different packs sit closer together. Per stage: color, alpha (0 = none, 0.2 = strong).
  // depth 33: over the play field and its effects, under the enemy shots (35), coins' pop texts are under it too, and the HUD (50). Try off with ?tint=0.
  tint: { on: true, depth: 33, forest: { color: 0x7a4fd0, alpha: 0.12 }, swamp: { color: 0x2a9a8a, alpha: 0.12 } },
  // Test helpers of the tune panel (TEST tab). wave = stage starts at this wave (1-10), level = weapon level at the start (-1 = by wave), god = 1: no damage taken. Normal play: 1, -1, 0.
  testing: { wave: 1, level: -1, god: 0 },
  // Difficulty dials (1 = normal). The tune panel (HARD tab) changes them. enemyHp / enemySpeed apply to enemies that spawn after the change; the rest apply at once.
  difficulty: { enemyHp: 1, enemySpeed: 1, shotSpeed: 1, shotDelay: 1, myDamage: 1 }, // shotDelay: more = enemies shoot less often
  enemyBullet: { poolSize: 30, speed: 100, hitSize: 3, depth: 35, scale: 1.5, file: 'shots/orb-red.png' }, // the red orb of the "Shmup Shots, Explosions and Pickups 16x16" pack (16x16 drawn at 1.5x = 24 px, half of the 48 px it was shown at by mistake: the swell effect forced every shot to 3x). Remove `file` to get the code-drawn pink orb back (it then uses scale 2) // depth 35: above all effects (sparks 20, texts 30), below the HUD (50)

  // pickupRadius: how close the ship must be to grab a coin (logical px). Bigger than the ship hitbox on purpose.
  coin: { fallSpeed: 50, value: 5, poolSize: 40, pickupRadius: 10 },

  // Crates: hp, coins and speed are set per crate in src/waves.js. coinSpread = sideways speed between coins.
  // coinFadeSec: the sideways burst fades to 0 in this many seconds. poolSize: max crates at once.
  crate: { coinSpread: 4, coinFadeSec: 0.4, poolSize: 4,
    depth: -8.2, onGround: true, // depth: under the tree tops, above shadows and rocks. onGround: the chest scrolls at the ground speed (false = its own speed from waves.js)
    fadeHoldMs: 150, fadeMs: 600 }, // opened chest: stays on its last frame this long, then fades out over fadeMs (0 = vanish at once) // (crate size = its art in src/sprites.js, CRATE, 7x7 art px = 21 px)

  // Pickups dropped by marked carrier enemies (drop: 'weapon' / 'heart' in src/waves.js).
  // Pickup grab radius is coin.pickupRadius. heartScoreIfFull: score given for a heart when already at full hearts.
  pickup: {
    depth: 34, // coins, hearts and the potion (and their shine) draw above the colour wash (33) so the wash does not dim them; enemy shots are at 35
    weaponFallSpeed: 67, heartFallSpeed: z(55), heartScoreIfFull: 50, maxLevel: 10,
    weaponPoolSize: 4, heartPoolSize: 4, // pickups on screen at once
    haloPoolSize: 48,  // glow pictures alive at once (an animated carrier uses 4, a code-drawn one 1)
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
    muzzleMs: 70, muzzleAlpha: 0.8, muzzleSize: 2, muzzleSpread: 3, // muzzleMs: how long the flash shows (a big burst, then a small one); muzzleSpread is unused now (one flash in the middle)
    // flash at the nose on each volley
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
    potionRing: { diameter: 76, thick: 2, color: 0x56d6e0 }, // the ring when you grab the weapon potion: a thin (2 px) line that grows to 76 px, in the potion's teal-blue. Remove it for the old thick green ring
    deathRing: true, deathRingMs: 280,      // ring puff when something dies / is picked up
    deathRingScale: 1.2, bigDeathRingScale: 2, // final ring size in art pixels x PX (small enemies / imp, crate, pickups)

    popText: false, popTextMs: 650, popTextRise: z(26), popTextSize: 12, popPoolSize: 10, popTextEdge: 14, popTextOffsetY: 24, // floating "+10" at kills and coins
    magnetRadius: 34, magnetSpeed: z(300),  // coins fly to the witch from this far (0 = off)

    hitFlashMs: 140,                        // white-pink screen flash when the witch is hit (0 = off)
    hitFlashStrength: 0.3, flashColor: 0xffcdd7, flashDepth: 25, // start strength 0..1 (low so shots stay visible); depth must stay below enemyBullet.depth
    heartPopMs: 350, heartPopScale: 0.7, heartShakePx: 2, // lost heart pops and shakes in the HUD

    enemyShotPulse: 0, enemyShotPulseMs: 360, // enemy shots swell and shrink a little (0 = off)
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
  animFps: 2.5, animFrames: 8, // animated strips: pictures per second, frames per strip (each one starts at a random frame)
  midBushScale: [1, 1.3], midSmallScale: [1, 1.2], // swamp props keep their own size (a log stays longer than a lily pad): size multiplier (min, max) instead of a fixed width
  midBushCount: 2, midSmallCount: 1,
  rockScale: [1, 1.4], bigRockScale: 1.5,
  patchCount: 8, blobVariants: 6, blobSize: [20, 40], blobCell: 2, // dark still-water pools instead of grass blobs
  blobColor: 0x2d4745, blobColor2: 0x3a5955,                       // pool colour (dark teal) and its lighter specks
  treeShadow: { on: true, angleDeg: 55, lenMul: 0.6, alpha: 0.28, color: 0x0a120c, depth: -9 },
  // Lanterns beside the path (swamp only; depth -8.2 = like the chests: under the tree tops, above shadows and rocks): file = strip in assets/swamp (8 frames), w/h = one frame, glowDx/glowDy = where the lamp is (art px from the picture centre, found from its brightest green pixels; dx flips with the picture).
  // Glow = flat rings, added as light (r in texels, one texel = glow.cell px) in green, flickering in steps (alpha list, stepFps per second). bugs = little lights flying around, bugSize px.
  lanterns: { on: true, count: 3, scale: 0.75, fps: 4, stepFps: 6, depth: -8.2, laneX: [[52, 84], [156, 188]], gapY: [220, 480],
    files: [
      { file: 'bog_lantern_post_1_anim', w: 24, h: 29, glowDx: -2.8, glowDy: -1.8 },
      { file: 'buoy_lantern_0_anim', w: 26, h: 26, glowDx: 0, glowDy: -4.3 },
      { file: 'buoy_lantern_1_anim', w: 26, h: 20, glowDx: 0.6, glowDy: -4.6 },
      { file: 'lantern_1_anim', w: 24, h: 52, glowDx: 1.3, glowDy: -0.6 },
      { file: 'witch_lantern_0_anim', w: 24, h: 41, glowDx: -1.2, glowDy: -7.3 }
    ],
    glow: { cell: 2, rings: [{ r: 2, color: 0xb8ff90, alpha: 0.6 }, { r: 4, color: 0x4fe070, alpha: 0.36 }, { r: 7, color: 0x2fbf6a, alpha: 0.18 }], flicker: [1, 0.8, 1, 0.65, 0.9, 1, 0.75] },
    bugs: 3, bugSize: 1.5, bugSpeed: 0.3, bugColor: 0xe6ff8a }, // bugSize in px (a bit smaller than 2), bugSpeed = how fast they circle (was 0.5)
  light: { on: true, depth: -6, // fog: big, very soft, pale grey-green patches (same code as the forest cloud shadows) drifting over the floor
    shadowCount: 5, shadowVariants: 3, shadowSize: 64, shadowCell: 4, shadowGapY: 300, shadowSpeedMul: 1.5, shadowDrift: 5, shadowAlpha: 0.12, shadowColor: 0xb4c2b0,
    shaftCount: 0, shaftScale: [1, 1], shaftAngleDeg: 0, shaftAlpha: [0, 0], shaftPulse: 0, shaftDrift: 0 } // no light shafts in the swamp
};

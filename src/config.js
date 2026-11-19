// All tuning numbers live here. Change them and reload the page.
// Sizes and speeds below were written for a 360x640 screen. z(n) shrinks such a number by the zoom,
// so it looks the same fraction of the screen. (Sprite sizes are not shrunk: that is what makes them bigger.)
const ZOOM = 1.5;
export const z = n => Math.round(n / ZOOM);

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
  version: "0.6.0", // bump on every push so the player/Omri can see the build
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
  stick: { radius: z(45), knobRadius: z(20), deadZone: 0.08, curve: 0.8, response: 60, speed: z(600), restY: z(590), ringAlpha: 0.28, restAlpha: 0.14, depth: 55 }, // speed = witch speed at full push (px/s)

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
    farCount: 14, nearCount: 7
  },

  // Enemy hp/score. Their movement, shooting and coins come from the wave data in src/waves.js.
  enemies: {
    grunt:   { hp: 3, score: 10 },
    zigzag:  { hp: 4, score: 20 },
    shooter: { hp: 7, score: 50 },
    poolSize: 40,
    hitFlashMs: 70
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
    trail: true, trailPoolSize: 40, trailY: 22,   // trailY = how far below the ship centre the sparks start
    trailIdleMs: 140, trailMoveMs: 35,            // time between sparks when still / at full speed (lower = more sparks)
    trailLifeMs: 420, trailSpeed: z(40),
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
    cloudBoost: 1.2, cloudEase: 4                         // clouds scroll this much faster (extra x) when the witch flies up fast (0 = off)
  },

  // HUD layout (logical px on the 240-wide screen)
  hud: {
    margin: 4,
    medalSize: 10, medalGap: 2,
    versionSize: 10, versionAlpha: 0.9, versionStroke: 3, versionGap: 2, // version text under the medals (px, 0..1, outline px, gap under medals)
    rowOffset: 22,                  // bars (and wave dots) start this far below the top margin; below the score text even when it pops
    heartStep: z(26), heartY: 6,    // distance between hearts; heart centre below the top margin
    barW: 4, barH: 7, barGap: 2,
    showWaveIndicator: false, // the 10 wave dots under the hearts: false = hidden (Omri, v0.3.2). true brings them back
    pip: 5, pipGap: 2, pipBlinkMs: 350
  }
};

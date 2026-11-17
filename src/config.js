// All tuning numbers live here. Change them and reload the page.
// Sizes and speeds below were written for a 360x640 screen. z(n) shrinks such a number by the zoom,
// so it looks the same fraction of the screen. (Sprite sizes are not shrunk: that is what makes them bigger.)
const ZOOM = 1.5;
export const z = n => Math.round(n / ZOOM);

// One shot of a pattern: dx offset, angle in degrees, optional own damage.
const S = (dx, deg = 0, dmg) => ({ dx, deg, dmg });
const TWIN = [S(-5), S(5)];
const TRI = [S(-5), S(0), S(5)];
const TRI_C2 = [S(-5), S(0, 0, 2), S(5)];                                           // centre shot hits for 2
const FAN5 = [S(-6, -8), S(-3, -4), S(0, 0, 2), S(3, 4), S(6, 8)];                  // narrow fan
const FAN7 = [S(-9, -12), ...FAN5.slice(0, 2), S(0, 0, 2), ...FAN5.slice(3), S(9, 12)]; // narrow fan + side shots at 12 deg
const WIDE7 = [-21, -14, -7, 0, 7, 14, 21].map(a => S(a / 2, a, 2));                // wide 7-shot fan
function weaponLevels() {
  const L = (fireRateMs, pattern, damage = 1) => ({ fireRateMs, pattern, damage });
  return [
    L(170, TWIN),        // 0 today's gun
    L(160, TWIN),        // 1 faster
    L(160, TRI),         // 2 third (centre) shot
    L(155, TRI),         // 3 faster
    L(155, TRI_C2),      // 4 centre shot does 2
    L(155, FAN5),        // 5 five-shot narrow fan
    L(150, FAN5),        // 6 faster
    L(150, FAN7),        // 7 side shots at 12 deg
    L(150, FAN7, 2),     // 8 every shot does 2
    L(145, FAN7, 2),     // 9 faster
    L(145, WIDE7, 2)     // 10 wide 7-shot fan
  ];
}

export const CONFIG = {
  version: "0.3.0", // bump on every push so the player/Omri can see the build
  // zoom: 1.5 = everything looks 1.5x bigger on screen. Only this number needs to change.
  // The game is drawn on a smaller canvas (baseWidth/zoom) and Phaser stretches it to fill the phone.
  game: { zoom: ZOOM, baseWidth: 360, baseHeight: 640, width: Math.round(360 / ZOOM), height: Math.round(640 / ZOOM), pixelScale: 3 }, // pixelScale: size of one art pixel in game units

  ship: {
    startY: z(520),
    dragSensitivity: 1.0, // ship moves this many times the finger movement (1 = 1:1, 1.5 = faster)
    // Weight: the ship eases toward the finger. Lag is about 1000/followRate ms (20 = 50 ms).
    // LOWER number = heavier, slower to catch up. HIGHER = lighter, closer to glued. 60+ is almost no weight.
    followRate: 20,
    bankDeg: 8,          // max tilt in degrees when moving sideways (0 = no tilt)
    bankSpeed: z(400),   // sideways speed (units/s) that gives the full tilt
    bankEase: 14,        // how fast the tilt comes and goes (higher = snappier)
    margin: 18,         // keep this far from screen edges
    hearts: 3,
    invulnMs: 1500,
    ramKillsEnemy: true, // crashing into an enemy: it also dies (no score, no coin). false = it survives
    blinkMs: 90,
    restartDelayMs: 700, // wait after game over before a tap restarts
    hitShakeMs: 120,     // screen shake when hit
    hitShakeAmount: 0.01,
    hitRadius: 3        // the ship can only be hit in a tiny square this far (logical px) around its centre. Sprite is much bigger = fair
  },

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
  enemyBullet: { poolSize: 30, speed: 100, hitSize: 3 },

  // pickupRadius: how close the ship must be to grab a coin (logical px). Bigger than the ship hitbox on purpose.
  coin: { fallSpeed: z(90), value: 5, poolSize: 40, pickupRadius: 10 },

  // Crates: hp, coins and speed are set per crate in src/waves.js. coinSpread = sideways speed between coins.
  // coinFadeSec: the sideways burst fades to 0 in this many seconds. poolSize: max crates at once.
  crate: { coinSpread: 4, coinFadeSec: 0.4, poolSize: 4 }, // (crate size = its art in src/sprites.js, CRATE, 7x7 art px = 21 px)

  // Pickups dropped by marked carrier enemies (drop: 'weapon' / 'heart' in src/waves.js).
  // Pickup grab radius is coin.pickupRadius. heartScoreIfFull: score given for a heart when already at full hearts.
  pickup: {
    weaponFallSpeed: z(130), heartFallSpeed: z(55), heartScoreIfFull: 50, maxLevel: 10,
    haloPoolSize: 12,   // glowing outlines around carriers alive at once
    haloPulseMs: 500    // one pulse of the carrier glow
  },

  stage: {
    firstWaveDelay: 1.5, // seconds before the first wave starts
    endDelayMs: 1500     // after the last enemy is gone, wait this long (coins can still be caught), then show STAGE CLEAR
  },

  particles: { poolSize: 90, perExplosion: 8, speed: z(140), lifeMs: 450 },

  // Game feel
  feel: {
    hitStopMs: 60,                          // freeze when the player loses a heart
    bigExplosionCount: 16, bigExplosionSpeedMul: 1.3, // shooter / crate dies
    bigShakeMs: 90, bigShakeAmount: 0.004,
    coinSparkCount: 4, coinSparkSpeedMul: 0.5,
    scorePopScale: 0.3, scorePopMs: 160,    // score text grows by this much and settles back
    muzzleMs: 45, muzzleSize: 2, muzzleSpread: 3, // flash at the nose on each volley
    levelFlashMs: 160, levelSparkCount: 8   // green flash on the ship at a weapon upgrade
  },

  // HUD layout (logical px on the 240-wide screen)
  hud: {
    margin: 4,
    medalSize: 10, medalGap: 2,
    barW: 4, barH: 7, barGap: 2,
    pip: 5, pipGap: 2, pipBlinkMs: 350
  }
};

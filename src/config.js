// All tuning numbers live here. Change them and reload the page.
// Sizes and speeds below were written for a 360x640 screen. z(n) shrinks such a number by the zoom,
// so it looks the same fraction of the screen. (Sprite sizes are not shrunk: that is what makes them bigger.)
const ZOOM = 1.5;
export const z = n => Math.round(n / ZOOM);

export const CONFIG = {
  version: "0.2.1", // bump on every push so the player/Omri can see the build
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

  bullet: {
    fireRateMs: 170,    // time between shots
    speed: z(620),
    poolSize: 40,
    damage: 1,
    twinOffset: 5        // two guns, side distance (bullet art is 2 px wide: see PBULLET in src/sprites.js; hitbox follows the art)
  },

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
  crate: { coinSpread: 4, coinFadeSec: 0.4, poolSize: 4 },

  stage: {
    firstWaveDelay: 1.5, // seconds before the first wave starts
    endDelayMs: 1500     // after the last enemy is gone, wait this long (coins can still be caught), then show STAGE CLEAR
  },

  particles: { poolSize: 60, perExplosion: 8, speed: z(140), lifeMs: 450 }
};

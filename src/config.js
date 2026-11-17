// All tuning numbers live here. Change them and reload the page.
// Sizes and speeds below were written for a 360x640 screen. z(n) shrinks such a number by the zoom,
// so it looks the same fraction of the screen. (Sprite sizes are not shrunk: that is what makes them bigger.)
const ZOOM = 1.5;
export const z = n => Math.round(n / ZOOM);

export const CONFIG = {
  version: "0.1.4", // bump on every push so the player/Omri can see the build
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
    hitbox: 5           // hit box size in art pixels (smaller than the sprite = fairer)
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

  enemies: {
    grunt:   { hp: 3, speed: z(110), score: 10, coinChance: 0.25 },
    zigzag:  { hp: 4, speed: z(90), swayAmp: z(70), swayFreq: 2.2, score: 20, coinChance: 0.35 },
    shooter: { hp: 7, speed: z(100), stopY: z(110), stayMs: 4500, fireMs: 1400, bulletSpeed: z(150), firstShotMs: 500, hoverMs: 700, hoverAmp: z(20), leaveSpeedMul: 1.5, score: 50, coinChance: 0.7 },
    poolSize: 24,
    hitFlashMs: 70
  },

  enemyBullet: { poolSize: 30 },

  coin: { fallSpeed: z(90), value: 5, poolSize: 20 },

  particles: { poolSize: 60, perExplosion: 8, speed: z(140), lifeMs: 450 },

  // Wave timeline: at time t (seconds) spawn `count` enemies of `type`, `gap` seconds apart.
  // x is 0..1 across the screen (-1 = random). It loops when finished.
  waves: [
    { t: 1.0,  type: 'grunt',   count: 4, gap: 0.6, x: 0.25 },
    { t: 4.5,  type: 'grunt',   count: 4, gap: 0.6, x: 0.75 },
    { t: 8.0,  type: 'zigzag',  count: 3, gap: 0.9, x: 0.5 },
    { t: 12.0, type: 'grunt',   count: 6, gap: 0.4, x: -1 },
    { t: 14.0, type: 'shooter', count: 1, gap: 0,   x: 0.3 },
    { t: 15.5, type: 'shooter', count: 1, gap: 0,   x: 0.7 },
    { t: 19.0, type: 'zigzag',  count: 5, gap: 0.7, x: 0.5 },
    { t: 24.0, type: 'grunt',   count: 8, gap: 0.35, x: -1 }
  ],
  loopLength: 30 // seconds, then the timeline starts again
};

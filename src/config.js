// All tuning numbers live here. Change them and reload the page.
export const CONFIG = {
  version: "0.1.1", // bump on every push so the player/Omri can see the build
  game: { width: 360, height: 640, pixelScale: 3 }, // pixelScale: size of one art pixel on screen

  ship: {
    startY: 520,
    fingerOffsetY: 28,   // ship hovers this far ABOVE the finger (just over the thumb tip)
    followSmoothing: 16, // higher = snappier (1 = very floaty, 30 = almost glued)
    maxSpeed: 900,       // px per second, limit for the follow
    margin: 18,          // keep this far from screen edges
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
    fireRateMs: 130,     // time between shots
    speed: 620,
    poolSize: 40,
    damage: 1,
    twinOffset: 6        // two guns, side distance
  },

  background: {
    skyTop: 0x2a6fdb, skyBottom: 0x8fd3ff,
    farScroll: 25, nearScroll: 70, // px per second
    farCount: 14, nearCount: 7
  },

  enemies: {
    grunt:   { hp: 3, speed: 110, score: 10, coinChance: 0.25 },
    zigzag:  { hp: 4, speed: 90, swayAmp: 70, swayFreq: 2.2, score: 20, coinChance: 0.35 },
    shooter: { hp: 7, speed: 100, stopY: 110, stayMs: 4500, fireMs: 1400, bulletSpeed: 150, firstShotMs: 500, hoverMs: 700, hoverAmp: 20, leaveSpeedMul: 1.5, score: 50, coinChance: 0.7 },
    poolSize: 24,
    hitFlashMs: 70
  },

  enemyBullet: { poolSize: 30 },

  coin: { fallSpeed: 90, value: 5, poolSize: 20 },

  particles: { poolSize: 60, perExplosion: 8, speed: 140, lifeMs: 450 },

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

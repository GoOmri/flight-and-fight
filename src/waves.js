// Stage 1 wave DATA only (see DESIGN.md "Stage 1 waves"). Positions are logical px on the 240x427 screen.
// The code that runs this data is src/waves-runner.js. Change numbers here to tune the stage.
//
// Wave:  { start:{after:'clear'|'spawnEnd', delay:s}, groups:[...], crate? }
// Group: { type, n, gap, at, spd, path, mirror?, coinEvery?, fire? }
// Path steps (first step = spawn point, enemy is removed after the last step):
//   ['L', x, y, {stop:s}?]            straight line to (x,y), optional stop-and-fire time
//   ['A', cx, cy, r, a0, a1]          arc (degrees, 0 = right, 90 = down; a1 < a0 turns the other way)
//   ['SIN', cx, amp, wave, yEnd, ph]  sway around x = cx while moving down to yEnd
// mirror:true flips the path left-right. Off-screen points: -20 / 260 / 447.
// Crate: { at: seconds after wave start | 'clear', spd, path, hp, coins }

const FIRE = (first, every, aim, shots = 1, spread = 0) => ({ first, every, aim, shots, spread });
// a shooter that drops in at x, stops at y for `stop` seconds (shooting), then flies back up
const gunner = (x, at, stop, fire, y = 70) =>
  ({ type: 'shooter', n: 1, gap: 0, at, spd: 80, path: [['L', x, -20], ['L', x, y, { stop }], ['L', x, -30]], fire });
const sway = (cx, amp, wave, phase = 0) => [['L', cx, -20], ['SIN', cx, amp, wave, 447, phase]];
const HORSESHOE = [['L', 220, 447], ['L', 220, 230], ['A', 120, 230, 100, 0, -180], ['L', 20, 447]];
const LOOP = [['L', 60, -20], ['L', 60, 100], ['A', 90, 100, 30, 180, -180], ['L', 60, 230], ['L', 200, 270], ['L', 260, 270]];
const DOWN = x => [['L', x, -20], ['L', x, 447]];

export const STAGE1 = [
  { // 1 Two Lines (the first wave always waits stage.firstWaveDelay from config.js instead)
    start: { after: 'clear', delay: 2 },
    groups: [
      { type: 'grunt', n: 5, gap: 0.5, at: 0, spd: 80, path: DOWN(180), coinEvery: 2 },
      { type: 'grunt', n: 5, gap: 0.5, at: 3.5, spd: 80, path: DOWN(60), coinEvery: 2 }
    ]
  },
  { // 2 Crossing Slides
    start: { after: 'spawnEnd', delay: 5 },
    groups: [
      { type: 'grunt', n: 5, gap: 0.45, at: 0, spd: 90, path: [['L', -20, 50], ['L', 260, 210]], coinEvery: 2 },
      { type: 'grunt', n: 5, gap: 0.45, at: 2.5, spd: 90, mirror: true, path: [['L', -20, 100], ['L', 260, 260]], coinEvery: 2 }
    ]
  },
  { // 3 Sway Pair + crate 1
    start: { after: 'spawnEnd', delay: 4 },
    groups: [
      { type: 'zigzag', n: 3, gap: 1.0, at: 0, spd: 70, path: sway(70, 40, 200), coinEvery: 2 },
      { type: 'zigzag', n: 3, gap: 1.0, at: 0, spd: 70, path: sway(170, 40, 200), coinEvery: 2 }
    ],
    crate: { at: 2.0, spd: 45, path: DOWN(120), hp: 6, coins: 6 }
  },
  { // 4 First Gunners
    start: { after: 'spawnEnd', delay: 3 },
    groups: [
      gunner(50, 0, 4, FIRE(0.6, 1.8, 'down'), 75),
      gunner(190, 1.5, 4, FIRE(0.6, 1.8, 'down'), 75),
      { type: 'grunt', n: 5, gap: 0.5, at: 3.0, spd: 85, path: DOWN(120), coinEvery: 2 }
    ]
  },
  { // 5 Horseshoe
    start: { after: 'spawnEnd', delay: 4 },
    groups: [
      { type: 'grunt', n: 7, gap: 0.45, at: 0, spd: 100, path: HORSESHOE, coinEvery: 3 },
      gunner(120, 1.0, 5, FIRE(0.8, 1.6, 'player'), 55)
    ]
  },
  { // 6 Weave and Guard + crate 2
    start: { after: 'spawnEnd', delay: 6 },
    groups: [
      { type: 'zigzag', n: 3, gap: 1.0, at: 0, spd: 70, path: sway(120, 65, 220, 0), coinEvery: 2 },
      { type: 'zigzag', n: 3, gap: 1.0, at: 0, spd: 70, path: sway(120, 65, 220, 180), coinEvery: 2 },
      gunner(25, 1.5, 4.5, FIRE(0.8, 1.8, 'player'), 60),
      gunner(215, 3.0, 4.5, FIRE(0.8, 1.8, 'player'), 60)
    ],
    crate: { at: 0.5, spd: 40, path: DOWN(215), hp: 6, coins: 6 }
  },
  { // 7 Three Gunners
    start: { after: 'spawnEnd', delay: 6 },
    groups: [
      gunner(40, 0, 4.5, FIRE(0.6, 2.0, 'down')),
      gunner(120, 0.8, 4.5, FIRE(0.6, 1.6, 'player')),
      gunner(200, 1.6, 4.5, FIRE(0.6, 2.0, 'down')),
      { type: 'zigzag', n: 6, gap: 0.8, at: 2.0, spd: 75, path: sway(120, 50, 200), coinEvery: 2 }
    ]
  },
  { // 8 Loop-de-loop
    start: { after: 'spawnEnd', delay: 5 },
    groups: [
      { type: 'grunt', n: 6, gap: 0.6, at: 0, spd: 100, path: LOOP, coinEvery: 3 },
      { type: 'grunt', n: 6, gap: 0.6, at: 3.0, spd: 100, mirror: true, path: LOOP, coinEvery: 3 }
    ]
  },
  { // 9 Gauntlet
    start: { after: 'spawnEnd', delay: 3 },
    groups: [
      { type: 'grunt', n: 5, gap: 0.5, at: 0, spd: 110, mirror: true, path: HORSESHOE, coinEvery: 3 },
      { type: 'zigzag', n: 3, gap: 0.8, at: 2.0, spd: 80, path: sway(120, 65, 220, 0), coinEvery: 2 },
      { type: 'zigzag', n: 3, gap: 0.8, at: 2.0, spd: 80, path: sway(120, 65, 220, 180), coinEvery: 2 },
      gunner(70, 3.0, 5, FIRE(0.8, 1.4, 'player'), 60),
      gunner(170, 3.0, 5, FIRE(0.8, 1.4, 'player'), 60),
      { type: 'grunt', n: 6, gap: 0.35, at: 7.0, spd: 130, path: [['L', -20, 100], ['L', 260, 300]], coinEvery: 3 }
    ]
  },
  { // 10 Last Rush (crate 3 falls during the calm before it)
    start: { after: 'clear', delay: 4 },
    groups: [
      gunner(40, 0, 5.5, FIRE(0.6, 1.5, 'down')),
      gunner(120, 0.6, 5.5, FIRE(1.0, 2.2, 'player', 3, 20)),
      gunner(200, 1.2, 5.5, FIRE(0.6, 1.5, 'down')),
      { type: 'zigzag', n: 4, gap: 0.8, at: 1.5, spd: 85, path: sway(120, 70, 220, 0), coinEvery: 2 },
      { type: 'zigzag', n: 4, gap: 0.8, at: 1.5, spd: 85, path: sway(120, 70, 220, 180), coinEvery: 2 },
      { type: 'grunt', n: 6, gap: 0.5, at: 5.0, spd: 110, path: LOOP, coinEvery: 3 },
      { type: 'grunt', n: 6, gap: 0.5, at: 8.0, spd: 110, mirror: true, path: LOOP, coinEvery: 3 },
      { type: 'grunt', n: 5, gap: 0.3, at: 12.0, spd: 150, path: DOWN(45), coinEvery: 2 },
      { type: 'grunt', n: 5, gap: 0.3, at: 12.0, spd: 150, path: DOWN(195), coinEvery: 2 }
    ],
    crate: { at: 'clear', spd: 40, path: DOWN(120), hp: 10, coins: 10 }
  }
];

// Sound effects and music. A small module on the browser's own audio (no Phaser), shared by both scenes.
// Effects (assets/sfx) are decoded once and played through Web Audio. Music (assets/music) is streamed by <audio> so the big files
// never delay the start. Phones only allow sound after the first tap: the first tap wakes everything. SOUND ON/OFF is in the settings.
// Which sounds and how loud are all here. gap = shortest time in ms between two plays of the same effect (shots repeat very fast).
// v = volume, gap = shortest ms between plays, pv = random pitch change (0.08 = up to 8% higher or lower), lp = cut the sharp highs above this many Hz (default LP), len = fade out after this many seconds
const SFX = {
  shoot: { f: ['shoot'], v: 0.08, gap: 130, pv: 0.08, lp: 2200, len: 0.16 },
  enemyHit: { f: ['enemy-hit'], v: 0.18, gap: 70, pv: 0.1, lp: 3500 },
  enemyDie: { f: ['enemy-die'], v: 0.34, gap: 60, pv: 0.12, lp: 4500 },
  coin: { f: ['coin'], v: 0.28, gap: 50, pv: 0.04 },
  heart: { f: ['heart'], v: 0.45 },
  potion: { f: ['potion'], v: 0.4 },
  levelUp: { f: ['level-up'], v: 0.4 },
  hurt: { f: ['hurt'], v: 0.38, lp: 3500 },
  rescue: { f: ['rescue-a', 'rescue-b'], v: 0.45 }, // both together
  gameOver: { f: ['game-over'], v: 0.5 },
  stageClear: { f: ['stage-clear'], v: 0.5 },
  tap: { f: ['tap'], v: 0.3 }
};
const LP = 6000, ATTACK = 0.006; // every effect: softer highs and a very short fade-in (no click)
const RING = { f: ['ring-a', 'ring-b', 'ring-c'], v: 0.3 }; // while a cat's ring fills: one of the three, picked each time she starts hovering, looped
const MUSIC = { menu: 0.35, forest: 0.3 }; // name = assets/music/<name>.ogg, value = volume
const KEY = 'ff_sound';

const WEB = typeof window !== 'undefined';
let on = true;
try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* sound on */ }
let ctx = null, out = null, ringNode = null, paused = false;
let want = null; // the music that should be playing now (a name of MUSIC, or null)
const buffers = {}, last = {}, tracks = {};

export const soundOn = () => on;
export function toggleSound() {
  on = !on;
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* not saved */ }
  if (!on) ringSound(false);
  syncMusic();
  return on;
}

export function initSound() {
  if (!WEB || ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  out = ctx.createDynamicsCompressor(); // when many effects pile up this squeezes the loud peaks down
  out.threshold.value = -18; out.knee.value = 12; out.ratio.value = 6; out.attack.value = 0.004; out.release.value = 0.18;
  out.connect(ctx.destination);
  for (const n of Object.keys(MUSIC)) track(n); // fetch the music right away so it starts without a wait
  const names = new Set([...Object.values(SFX).flatMap(s => s.f), ...RING.f]);
  for (const n of names) {
    fetch('assets/sfx/' + n + '.ogg').then(r => (r.ok ? r.arrayBuffer() : null)).then(a => a && ctx.decodeAudioData(a, b => { buffers[n] = b; }, () => {})).catch(() => {});
  }
  const wake = () => { if (document.hidden) return; if (ctx.state === 'suspended') ctx.resume(); syncMusic(); };
  window.addEventListener('pointerdown', wake, true);
  window.addEventListener('keydown', wake, true);
  document.addEventListener('visibilitychange', () => { // the app goes to the background: silence
    if (document.hidden) { ctx.suspend(); for (const t of Object.values(tracks)) t.pause(); } else wake();
  });
}

function play(name, volume, loop = false, o = {}) {
  const b = buffers[name];
  if (!b) return null;
  const src = ctx.createBufferSource(), gain = ctx.createGain(), low = ctx.createBiquadFilter(), t = ctx.currentTime;
  src.buffer = b; src.loop = loop;
  if (o.pv) src.playbackRate.value = 1 + (Math.random() * 2 - 1) * o.pv; // a slightly different pitch every time
  low.type = 'lowpass'; low.frequency.value = o.lp || LP;
  gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(volume, t + ATTACK);
  src.connect(low); low.connect(gain); gain.connect(out); src.start();
  if (o.len) { gain.gain.setValueAtTime(volume, t + o.len * 0.5); gain.gain.linearRampToValueAtTime(0, t + o.len); src.stop(t + o.len); }
  return { src, gain };
}

export function sfx(name, delayMs = 0) {
  const s = SFX[name];
  if (!s || !on || !ctx || ctx.state !== 'running') return;
  if (delayMs) { setTimeout(() => sfx(name), delayMs); return; }
  const now = performance.now();
  if (s.gap && now - (last[name] || 0) < s.gap) return;
  last[name] = now;
  for (const f of s.f) play(f, s.v, false, s);
}

export function ringSound(active) {
  if (active && on && !paused && ctx && ctx.state === 'running') {
    if (!ringNode) ringNode = play(RING.f[Math.floor(Math.random() * RING.f.length)], RING.v, true);
  } else if (ringNode) {
    const n = ringNode; ringNode = null;
    n.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05); n.src.stop(ctx.currentTime + 0.25); // a short fade, no click
  }
}

function track(n) {
  if (!tracks[n]) { const t = tracks[n] = new Audio(); t.preload = 'auto'; t.loop = true; t.volume = MUSIC[n]; t.src = 'assets/music/' + n + '.ogg'; }
  return tracks[n];
}

function syncMusic() {
  if (!WEB) return;
  for (const [n, t] of Object.entries(tracks)) if (n !== want) t.pause();
  if (!want || !on || paused || document.hidden) { if (want && tracks[want]) tracks[want].pause(); return; }
  const t = track(want);
  if (t.paused) { const p = t.play(); if (p && p.catch) p.catch(() => {}); } // refused before the first tap: the tap tries again
}

export function music(name) {
  const next = MUSIC[name] !== undefined ? name : null;
  if (next !== want && next && tracks[next]) tracks[next].currentTime = 0;
  want = next;
  syncMusic();
}

export function pauseSound(p) {
  paused = p;
  if (p) ringSound(false);
  syncMusic();
}

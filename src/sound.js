// Sound effects and music. A small module on the browser's own audio (no Phaser), shared by both scenes.
// Effects (assets/sfx) and music (assets/music) are decoded once and played through Web Audio. Phones only allow sound after the first tap: the first tap wakes everything. The volume bars are in the settings and on the pause screen.
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
const WEB = typeof window !== 'undefined';
// Volumes 0..10 (the bars in the settings and on the pause screen), saved. 7 = the mix as designed, 10 = louder, 0 = silent.
const DEF = 7, level = {};
for (const k of ['sound', 'music']) {
  let v = DEF;
  try {
    const s = localStorage.getItem('ff_vol_' + k);
    if (s !== null) v = Number(s); else if (localStorage.getItem('ff_' + k) === 'off') v = 0; // the old ON/OFF choice
  } catch (e) { /* default */ }
  level[k] = v >= 0 && v <= 10 ? v : DEF;
}
const gainOf = k => (level[k] / DEF) ** 2; // squared: even steps to the ear
let ctx = null, out = null, sfxMaster = null, musicMaster = null, node = null, ringNode = null, paused = false;
let want = null; // the music that should be playing now (a name of MUSIC, or null)
const buffers = {}, last = {}, tracks = {}, at = {};

export const volume = k => level[k];
export function setVolume(k, v) {
  if (level[k] === v) return false;
  level[k] = v;
  try { localStorage.setItem('ff_vol_' + k, String(v)); } catch (e) { /* not saved */ }
  if (ctx) (k === 'music' ? musicMaster : sfxMaster).gain.value = gainOf(k);
  if (k === 'sound' && !v) ringSound(false);
  if (k === 'music') syncMusic();
  return true;
}

export function initSound() {
  if (!WEB || ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  out = ctx.createDynamicsCompressor(); // when many effects pile up this squeezes the loud peaks down
  out.threshold.value = -18; out.knee.value = 12; out.ratio.value = 6; out.attack.value = 0.004; out.release.value = 0.18;
  sfxMaster = ctx.createGain(); sfxMaster.gain.value = gainOf('sound');
  musicMaster = ctx.createGain(); musicMaster.gain.value = gainOf('music');
  out.connect(sfxMaster); sfxMaster.connect(ctx.destination); musicMaster.connect(ctx.destination);
  for (const n of Object.keys(MUSIC)) loadTrack(n); // fetch and unpack the music right away so it starts without a wait
  const names = new Set([...Object.values(SFX).flatMap(s => s.f), ...RING.f]);
  for (const n of names) {
    fetch('assets/sfx/' + n + '.ogg').then(r => (r.ok ? r.arrayBuffer() : null)).then(a => a && ctx.decodeAudioData(a, b => { buffers[n] = b; }, () => {})).catch(() => {});
  }
  const wake = () => { if (document.hidden) return; if (ctx.state === 'suspended') ctx.resume(); syncMusic(); };
  window.addEventListener('pointerdown', wake, true);
  window.addEventListener('keydown', wake, true);
  document.addEventListener('visibilitychange', () => { // the app goes to the background: silence
    if (document.hidden) ctx.suspend(); else wake();
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
  if (!s || !level.sound || !ctx || ctx.state !== 'running') return;
  if (delayMs) { setTimeout(() => sfx(name), delayMs); return; }
  const now = performance.now();
  if (s.gap && now - (last[name] || 0) < s.gap) return;
  last[name] = now;
  for (const f of s.f) play(f, s.v, false, s);
}

export function ringSound(active) {
  if (active && level.sound && !paused && ctx && ctx.state === 'running') {
    if (!ringNode) ringNode = play(RING.f[Math.floor(Math.random() * RING.f.length)], RING.v, true);
  } else if (ringNode) {
    const n = ringNode; ringNode = null;
    n.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05); n.src.stop(ctx.currentTime + 0.25); // a short fade, no click
  }
}

// Music goes through Web Audio too (not through an <audio> player): Android then does not treat the game as a "media player",
// so a video or music app can keep playing at the same time. A track is unpacked once, at 22 kHz mono to save memory.
function loadTrack(n) {
  const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const dec = OC ? new OC(2, 1, 22050) : ctx;
  fetch('assets/music/' + n + '.ogg').then(r => (r.ok ? r.arrayBuffer() : null))
    .then(a => a && dec.decodeAudioData(a, b => { tracks[n] = mono(b); syncMusic(); }, () => {})).catch(() => {});
}

// both channels mixed into one: half the memory (a phone speaker is nearly mono anyway)
function mono(b) {
  if (b.numberOfChannels < 2) return b;
  const m = ctx.createBuffer(1, b.length, b.sampleRate), out = m.getChannelData(0), l = b.getChannelData(0), r = b.getChannelData(1);
  for (let i = 0; i < out.length; i++) out[i] = (l[i] + r[i]) / 2;
  return m;
}

function stopTrack() {
  if (!node) return;
  const n = node; node = null;
  at[n.name] = (ctx.currentTime - n.start) % n.src.buffer.duration; // remember where it was (pause)
  n.src.stop();
}

function syncMusic() {
  if (!ctx) return;
  const play = want && level.music && !paused && tracks[want] ? want : null;
  if (node && node.name === play) return;
  stopTrack();
  if (!play) return;
  const src = ctx.createBufferSource(), gain = ctx.createGain(), from = at[play] || 0;
  src.buffer = tracks[play]; src.loop = true; gain.gain.value = MUSIC[play];
  src.connect(gain); gain.connect(musicMaster); src.start(0, from);
  node = { src, name: play, start: ctx.currentTime - from };
}

export function music(name) {
  const next = MUSIC[name] !== undefined ? name : null;
  if (next !== want && next) at[next] = 0; // a new scene's music starts from the beginning
  want = next;
  syncMusic();
}

export function pauseSound(p) {
  paused = p;
  if (p) ringSound(false);
  syncMusic();
}

// Generic "follow a path" system + wave scheduler. It runs ANY wave from the data in src/waves.js.
// No Phaser in here: the scene gives hooks that spawn the things. Nothing is created per frame.
import { CONFIG } from './config.js';

const W = CONFIG.game.width, RAD = Math.PI / 180, TAU = Math.PI * 2;

// Turn a path (array of steps) into ready-to-use segments. Mirror = x -> W - x.
function compile(path, mirror) {
  const mx = x => (mirror ? W - x : x);
  const out = { sx: mx(path[0][1]), sy: path[0][2], segs: [] };
  let cx = out.sx, cy = out.sy;
  for (let i = 1; i < path.length; i++) {
    const s = path[i];
    if (s[0] === 'L') {
      const x = mx(s[1]), y = s[2];
      out.segs.push({ k: 0, x0: cx, y0: cy, x1: x, y1: y, len: Math.hypot(x - cx, y - cy), stop: (s[3] && s[3].stop) || 0 });
      cx = x; cy = y;
    } else if (s[0] === 'A') {
      const ax = mx(s[1]), ay = s[2], r = s[3];
      const a0 = (mirror ? 180 - s[4] : s[4]) * RAD, a1 = (mirror ? 180 - s[5] : s[5]) * RAD;
      out.segs.push({ k: 1, cx: ax, cy: ay, r, a0, da: a1 - a0, len: r * Math.abs(a1 - a0), stop: 0 });
      cx = ax + r * Math.cos(a1); cy = ay + r * Math.sin(a1);
    } else { // SIN
      const sx = mx(s[1]), ph = (s[5] + (mirror ? 180 : 0)) * RAD, len = s[4] - cy;
      out.segs.push({ k: 2, cx: sx, amp: s[2], wave: s[3], y0: cy, len, ph, stop: 0 });
      cx = sx + s[2] * Math.sin(TAU * len / s[3] + ph); cy = s[4];
    }
  }
  return out;
}

function place(o, s, d) {
  if (s.k === 0) {
    const t = s.len > 0 ? d / s.len : 1;
    o.x = s.x0 + (s.x1 - s.x0) * t; o.y = s.y0 + (s.y1 - s.y0) * t;
  } else if (s.k === 1) {
    const a = s.a0 + s.da * (d / s.len);
    o.x = s.cx + s.r * Math.cos(a); o.y = s.cy + s.r * Math.sin(a);
  } else {
    o.x = s.cx + s.amp * Math.sin(TAU * d / s.wave + s.ph); o.y = s.y0 + d;
  }
}

// Give an object (enemy or crate) a compiled path `p` and a speed (px/s). It must be put at p.sx, p.sy by the caller.
export function initPath(o, p, spd) { o.segs = p.segs; o.spd = spd; o.si = 0; o.sd = 0; o.wait = 0; }

// Move the object along its path. Returns false when the path is finished (the object should be removed).
// While o.wait > 0 the object is stopped (shooters fire then).
export function followPath(o, dt) {
  if (o.wait > 0) { o.wait -= dt; return true; }
  let move = o.spd * dt;
  for (;;) {
    const s = o.segs[o.si], left = s.len - o.sd;
    if (move < left) { o.sd += move; place(o, s, o.sd); return true; }
    move -= left; place(o, s, s.len); o.si++; o.sd = 0;
    if (o.si >= o.segs.length) return false;
    if (s.stop > 0) { o.wait = s.stop; return true; }
  }
}

// Schedules the waves. All spawn events of a wave are made when its start time is known, then fired by the clock.
export class WaveRunner {
  constructor(waves, startIndex, firstDelay) {
    this.cw = waves.map(def => ({
      def,
      groups: def.groups.map(g => ({ g, p: compile(g.path, g.mirror) })),
      crate: def.crate ? { c: def.crate, p: compile(def.crate.path, false) } : null
    }));
    this.next = startIndex; // next wave to schedule
    this.first = true;
    this.firstDelay = firstDelay;
    this.clock = 0;
    this.ev = [];           // spawn events sorted by time: { t, cg, i, cc }
    this.ptr = 0;           // next event to fire
    this.last = 0;          // time of the last enemy spawn scheduled so far
  }

  // true when every wave is scheduled and every spawn has happened
  get finished() { return this.next >= this.cw.length && this.ptr >= this.ev.length; }

  addWave(cw, clearT, start) {
    cw.groups.forEach(cg => {
      for (let i = 0; i < cg.g.n; i++) {
        const t = start + cg.g.at + i * cg.g.gap;
        this.ev.push({ t, cg, i, cc: null });
        if (t > this.last) this.last = t;
      }
    });
    if (cw.crate) this.ev.push({ t: cw.crate.c.at === 'clear' ? clearT : start + cw.crate.c.at, cg: null, i: 0, cc: cw.crate });
    this.ev.sort((a, b) => a.t - b.t);
  }

  // alive = number of enemies still alive. hooks = { enemy(cg, i), crate(cc) }
  update(dt, alive, hooks) {
    this.clock += dt;
    while (this.next < this.cw.length) {
      const cw = this.cw[this.next], st = cw.def.start;
      if (this.first || st.after === 'clear') {
        if (!this.first && (this.ptr < this.ev.length || alive > 0)) break; // wait for the field to be clear
        this.addWave(cw, this.clock, this.clock + (this.first ? this.firstDelay : st.delay));
      } else {
        this.addWave(cw, null, this.last + st.delay); // overlap: counted from the last spawn of the wave before
      }
      this.first = false; this.next++;
    }
    while (this.ptr < this.ev.length && this.ev[this.ptr].t <= this.clock) {
      const e = this.ev[this.ptr++];
      if (e.cc) hooks.crate(e.cc); else hooks.enemy(e.cg, e.i);
    }
  }
}

// Tuning panel (phone friendly). Only exists when the web address has ?tune=1. A small gear sits under the hearts; a tap opens a panel
// at the top and PAUSES the game. Each row has - and + buttons (hold to repeat). Changes apply at once to the live CONFIG.stick numbers.
// COPY puts all values on the clipboard (and shows them in the panel) so they can be pasted into src/config.js.
import { CONFIG as C, hex } from './config.js';
import { FONT, drawPlate } from './hud.js';

const W = C.game.width; // logical width (240)
const P = C.menu.pal;
// Tabs. Each row: label, path in CONFIG, step, min, max, decimals, [rebuild = the ray pictures must be drawn again]
const TABS = [
  ['STICK', [
    ['SPEED', 'stick.speed', 10, 60, 600, 0],
    ['RADIUS', 'stick.radius', 2, 10, 120, 0],
    ['DEADZONE', 'stick.deadZone', 0.02, 0, 0.4, 2],
    ['CURVE', 'stick.curve', 0.1, 0.5, 3, 1],
    ['RESPONSE', 'stick.response', 2, 5, 100, 0],
    ['GLIDE', 'stick.stopGlide', 0.02, 0, 0.4, 2],
    ['SETTLE', 'stick.stopOmega', 1, 4, 40, 0],
    ['DAMPING', 'stick.stopDamping', 0.05, 0.1, 1, 2]]],
  ['LOOK', [
    ['COIN RAYS', 'sprites.coinShine.alpha', 0.05, 0, 1, 2],
    ['COIN LENGTH', 'sprites.coinShine.radius', 1, 4, 40, 0, true],
    ['HEART RAYS', 'sprites.heartShine.alpha', 0.05, 0, 1, 2],
    ['HEART LENGTH', 'sprites.heartShine.radius', 1, 4, 40, 0, true],
    ['POTION RAYS', 'sprites.potionShine.alpha', 0.05, 0, 1, 2],
    ['POTION LENGTH', 'sprites.potionShine.radius', 1, 4, 40, 0, true],
    ['SHOT SIZE', 'bullet.fire.scale', 0.05, 0.5, 3, 2],
    ['SHOT SPEED', 'bullet.speed', 10, 100, 900, 0],
    ['RAY TIP FADE', 'sprites.coinShine.alphaEnd', 0.05, 0, 1, 2, true]]], // the fade changes all three rays together (see set())
  ['PICKUPS', [
    ['HEART FALL', 'pickup.heartFallSpeed', 5, 10, 200, 0],
    ['POTION FALL', 'pickup.weaponFallSpeed', 5, 10, 300, 0],
    ['COIN FALL', 'coin.fallSpeed', 5, 10, 300, 0],
    ['MAGNET RANGE', 'feel.magnetRadius', 2, 0, 120, 0],
    ['MAGNET SPEED', 'feel.magnetSpeed', 10, 50, 900, 0],
    ['GRAB SIZE', 'coin.pickupRadius', 1, 4, 40, 0],
    ['HEART BOB', 'sprites.heartShine.bobAmp', 1, 0, 40, 0],
    ['POTION TILT', 'sprites.weaponGem.angle', 5, -45, 45, 0]]]
];
// New drops use the fall / grab / tilt numbers (things already falling keep the old ones).
const ALL = TABS.flatMap(t => t[1]);
const getp = path => path.split('.').reduce((o, k) => o[k], C);
const setp = (path, v) => { const ks = path.split('.'), last = ks.pop(); ks.reduce((o, k) => o[k], C)[last] = v; };
const GEAR = { x: W - 16, y: 34, w: 22, h: 20 };          // gear button (centre), just under the hearts
const PANEL = { x: 6, y: 46, w: W - 12, rowH: 17, pad: 6 };
const BTN = { w: 22, h: 14 };
const DEPTH = 70;

// Is the tuning panel on? ?tune=1 turns it on and remembers it, ?tune=0 turns it off, otherwise the remembered choice is used.
// Also used by the menu: tapping the version text 5 times toggles it (for the installed app, which has no address bar).
export function tuneEnabled() {
  try {
    const t = new URLSearchParams(window.location.search).get('tune');
    if (t === '1') localStorage.setItem('ff_tune', '1');
    else if (t === '0') localStorage.removeItem('ff_tune');
    return t === '1' || (t !== '0' && localStorage.getItem('ff_tune') === '1');
  } catch (e) { return new URLSearchParams(window.location.search).get('tune') === '1'; }
}
export function toggleTune() {
  try { const on = localStorage.getItem('ff_tune') === '1'; if (on) localStorage.removeItem('ff_tune'); else localStorage.setItem('ff_tune', '1'); return !on; } catch (e) { return false; }
}

export class Tune {
  constructor(scene, onOpen, onClose) {
    this.scene = scene; this.onOpen = onOpen; this.onClose = onClose;
    this.open = false;
    this.tab = 0;
    this.start = {}; ALL.forEach(r => { this.start[r[1]] = getp(r[1]); }); // for RESET
    this.hold = null; this.holdAt = 0; // button being held: { fn }
    this.hits = [];                    // clickable boxes while the panel is open: { x, y, w, h, fn, hold }
    this.g = scene.add.graphics().setDepth(DEPTH);
    this.texts = [];
    this.gearTxt = this.text(GEAR.x, GEAR.y, 'TUNE', 8, P.cream, 0.5).setVisible(false);
    this.draw();
  }

  text(x, y, s, size, color, ox = 0) {
    const t = this.scene.add.text(x, y, s, { ...FONT, fontSize: size + 'px', color: hex(color), stroke: hex(P.shadow), strokeThickness: 2 }).setOrigin(ox, 0.5).setDepth(DEPTH + 1);
    this.texts.push(t); return t;
  }

  val(r) { return getp(r[1]).toFixed(r[5]); }

  set(r, v) {
    v = Math.round(Math.min(r[4], Math.max(r[3], v)) * 1000) / 1000;
    setp(r[1], v);
    if (r[1] === 'sprites.coinShine.alphaEnd') { C.sprites.heartShine.alphaEnd = v; C.sprites.potionShine.alphaEnd = v; } // one tip fade for all three rays
    if (r[6] && this.scene.rebuildRays) this.scene.rebuildRays();
  }

  change(r, dir) { this.set(r, getp(r[1]) + dir * r[2]); this.draw(); }

  reset() { ALL.forEach(r => this.set(r, this.start[r[1]])); this.draw(); }

  // Only the numbers you changed, ready to paste to Claude
  summary() { const ch = ALL.filter(r => getp(r[1]) !== this.start[r[1]]); return ch.length ? ch.map(r => r[1] + ' = ' + getp(r[1])).join(', ') : 'nothing changed'; }

  async copy() {
    let ok = false;
    try { await navigator.clipboard.writeText(this.summary()); ok = true; } catch (e) { ok = false; }
    this.note = ok ? 'COPIED' : 'COPY FAILED';
    this.draw();
  }

  // Redraws the whole thing (cheap: it only runs on a tap or a held repeat, not every frame).
  draw() {
    const g = this.g; g.clear();
    this.texts.forEach(t => t.setVisible(false));
    this.tn = 0; this.hits = [];
    const T = (x, y, s, size, color, ox) => { // reuse text objects by index
      const t = this.texts[this.tn + 1] || this.text(0, 0, '', size, color, ox); // index 0 is the gear label
      this.tn++;
      t.setPosition(x, y).setText(s).setFontSize(size + 'px').setColor(hex(color)).setOrigin(ox, 0.5).setVisible(true); return t;
    };
    const button = (x, y, w, h, label, fn, hold, fill = P.purple) => {
      g.fillStyle(P.dark, 1).fillRect(x, y + 2, w, h);
      g.fillStyle(fill, 1).fillRect(x, y, w, h);
      g.lineStyle(2, P.pink, 1).strokeRect(x, y, w, h);
      T(x + w / 2, y + h / 2, label, 8, P.cream, 0.5);
      this.hits.push({ x, y, w, h, fn, hold });
    };
    // gear (always there)
    button(GEAR.x - GEAR.w / 2, GEAR.y - GEAR.h / 2, GEAR.w, GEAR.h, this.open ? 'X' : 'TUNE', () => this.toggle(), false, this.open ? P.pink : P.purple);
    if (!this.open) { this.hits = this.hits.slice(0, 1); return; }
    // panel
    const ROWS = TABS[this.tab][1], TABH = 18;
    const h = PANEL.pad * 2 + TABH + ROWS.length * PANEL.rowH + 24;
    g.fillStyle(P.dark, 0.92).fillRect(PANEL.x, PANEL.y, PANEL.w, h);
    g.lineStyle(2, P.pink, 1).strokeRect(PANEL.x, PANEL.y, PANEL.w, h);
    const tw = (PANEL.w - 12) / TABS.length; // tab buttons
    TABS.forEach((t, i) => button(PANEL.x + 6 + i * tw, PANEL.y + 4, tw - 4, 14, t[0], () => { this.tab = i; this.draw(); }, false, i === this.tab ? P.pink : P.purple));
    ROWS.forEach((r, i) => {
      const y = PANEL.y + PANEL.pad + TABH + i * PANEL.rowH, cy = y + PANEL.rowH / 2;
      T(PANEL.x + 8, cy, r[0], 8, P.cream, 0);
      T(PANEL.x + 112, cy, this.val(r), 8, P.cyan, 1);
      button(PANEL.x + 120, y + 1, BTN.w, BTN.h, '-', () => this.change(r, -1), true);
      button(PANEL.x + 148, y + 1, BTN.w, BTN.h, '+', () => this.change(r, 1), true);
    });
    const by = PANEL.y + PANEL.pad + TABH + ROWS.length * PANEL.rowH + 2;
    button(PANEL.x + 8, by, 52, BTN.h + 2, 'COPY', () => this.copy(), false);
    button(PANEL.x + 66, by, 52, BTN.h + 2, 'RESET', () => this.reset(), false);
    T(PANEL.x + 128, by + 8, this.note || '', 8, P.orange, 0);
  }

  toggle() {
    this.open = !this.open; this.note = ''; this.hold = null;
    this.draw();
    if (this.open) this.onOpen(); else this.onClose();
  }

  // A touch at logical (x, y). Returns true when the panel used it (so the game must ignore it).
  press(x, y) {
    for (const b of this.hits) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        b.fn();
        if (b.hold) { this.hold = b; this.holdAt = this.scene.time.now + 350; }
        return true;
      }
    }
    return this.open; // panel open: it swallows every touch (the game is paused)
  }

  release() { this.hold = null; }

  update(now) {
    if (this.hold && now >= this.holdAt) { this.hold.fn(); this.holdAt = now + 70; } // hold a button = repeat
  }
}

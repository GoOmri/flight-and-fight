// Tuning panel (phone friendly). Only exists when the web address has ?tune=1. A small gear sits under the hearts; a tap opens a panel
// at the top and PAUSES the game. Each row has - and + buttons (hold to repeat). Changes apply at once to the live CONFIG.stick numbers.
// COPY puts all values on the clipboard (and shows them in the panel) so they can be pasted into src/config.js.
import { CONFIG as C, hex } from './config.js';
import { FONT, drawPlate } from './hud.js';

const W = C.game.width; // logical width (240)
const P = C.menu.pal;
// label, key in CONFIG.stick, step, min, max, decimals
const ROWS = [
  ['SPEED', 'speed', 10, 60, 600, 0],
  ['RADIUS', 'radius', 2, 10, 120, 0],
  ['DEADZONE', 'deadZone', 0.02, 0, 0.4, 2],
  ['CURVE', 'curve', 0.1, 0.5, 3, 1],
  ['RESPONSE', 'response', 2, 5, 100, 0],
  ['GLIDE', 'stopGlide', 0.02, 0, 0.4, 2],
  ['SETTLE', 'stopOmega', 1, 4, 40, 0],
  ['DAMPING', 'stopDamping', 0.05, 0.1, 1, 2]
];
const GEAR = { x: W - 16, y: 34, w: 22, h: 20 };          // gear button (centre), just under the hearts
const PANEL = { x: 6, y: 46, w: W - 12, rowH: 17, pad: 6 };
const BTN = { w: 22, h: 14 };
const DEPTH = 70;

export class Tune {
  constructor(scene, onOpen, onClose) {
    this.scene = scene; this.onOpen = onOpen; this.onClose = onClose;
    this.open = false;
    this.start = {}; ROWS.forEach(r => { this.start[r[1]] = C.stick[r[1]]; }); // for RESET
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

  val(r) { return C.stick[r[1]].toFixed(r[5]); }

  change(r, dir) {
    const v = C.stick[r[1]] + dir * r[2];
    C.stick[r[1]] = Math.round(Math.min(r[4], Math.max(r[3], v)) * 1000) / 1000;
    this.draw();
  }

  reset() { ROWS.forEach(r => { C.stick[r[1]] = this.start[r[1]]; }); this.draw(); }

  summary() { return 'stick: { ' + ROWS.map(r => r[1] + ': ' + C.stick[r[1]]).join(', ') + ' }'; }

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
    const h = PANEL.pad * 2 + ROWS.length * PANEL.rowH + 24;
    g.fillStyle(P.dark, 0.92).fillRect(PANEL.x, PANEL.y, PANEL.w, h);
    g.lineStyle(2, P.pink, 1).strokeRect(PANEL.x, PANEL.y, PANEL.w, h);
    ROWS.forEach((r, i) => {
      const y = PANEL.y + PANEL.pad + i * PANEL.rowH, cy = y + PANEL.rowH / 2;
      T(PANEL.x + 8, cy, r[0], 8, P.cream, 0);
      T(PANEL.x + 108, cy, this.val(r), 8, P.cyan, 1);
      button(PANEL.x + 116, y + 1, BTN.w, BTN.h, '-', () => this.change(r, -1), true);
      button(PANEL.x + 144, y + 1, BTN.w, BTN.h, '+', () => this.change(r, 1), true);
    });
    const by = PANEL.y + PANEL.pad + ROWS.length * PANEL.rowH + 2;
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

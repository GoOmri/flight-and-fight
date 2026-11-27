// The test panel (phone friendly). Only exists when it is switched on: 5 taps on the version number in the menu, or ?tune=1 in the
// web address. A small button sits under the hearts; a tap opens the panel and PAUSES the game.
// Kept small on purpose (Omri, 2026-11-27): jump to a wave, no damage, finish / lose the run, reset all progress, and for now
// the switch for the new enemy shots. Balance numbers are changed in src/config.js.
import { CONFIG as C, hex } from './config.js';
import { shotsOn, toggleShots } from './shots.js';
import { FONT } from './hud.js';
import { resetBank, resetUpgrades } from './bank.js';
import { resetStages } from './medals.js';

const W = C.game.width; // logical width (240)
const P = C.menu.pal;
// Each row: label, path in CONFIG, step, min, max
const ROWS = [
  ['Start at wave', 'testing.wave', 1, 1, 10],
  ['No damage (1 = on)', 'testing.god', 1, 0, 1]
];
const getp = path => path.split('.').reduce((o, k) => o[k], C);
const setp = (path, v) => { const ks = path.split('.'), last = ks.pop(); ks.reduce((o, k) => o[k], C)[last] = v; };
const GEAR = { x: W - 18, y: 62, w: 32, h: 20 };  // the TUNE button (centre), just under the hearts
const PANEL = { x: 6, y: 46, w: W - 12, top: 30, rowH: 24 };
const CHEAT = { w: 108, h: 26, gap: 6 };          // the big thumb buttons (two per line)
const BTN = { w: 28, h: 20 };                     // - and +
const CONFIRM_MS = 3000;                          // Reset all: the second tap must come within this time
const DEPTH = 70;

// Is the test panel on? ?tune=1 turns it on and remembers it, ?tune=0 turns it off, otherwise the remembered choice is used.
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
    this.sureUntil = 0;  // Reset all was tapped once: a second tap before this time does it
    this.hits = [];      // clickable boxes: { x, y, w, h, fn }
    this.g = scene.add.graphics().setDepth(DEPTH);
    this.texts = [];
    this.draw();
  }

  text() {
    const t = this.scene.add.text(0, 0, '', { ...FONT, fontSize: C.smallPx + 'px', color: hex(P.cream) }).setDepth(DEPTH + 1);
    this.texts.push(t); return t;
  }

  change(r, dir) { setp(r[1], Math.min(r[4], Math.max(r[3], getp(r[1]) + dir * r[2]))); this.draw(); }

  restart() { this.scene.physics.world.resume(); this.scene.scene.restart(this.scene.startData); } // play again with the numbers above

  // Finish stage / Lose now: close the panel and let the scene end the run. Nothing happens when the run has already ended (or is paused).
  endRun(win) {
    const s = this.scene;
    if (s.over || s.paused || (!win && s.leaving)) return; // flying off the top = already won, she cannot lose any more
    this.toggle();
    if (win) s.testFinish(); else s.testLose();
  }

  isSure() { return this.scene.time.now < this.sureUntil; }

  // all game progress: coins, upgrades, stars and best scores. Settings (volume, controls, effects, tune on) stay. First tap asks.
  resetAll() {
    if (this.isSure()) { this.sureUntil = 0; resetBank(); resetUpgrades(); resetStages(); this.scene.progressReset(); }
    else this.sureUntil = this.scene.time.now + CONFIRM_MS;
    this.draw();
  }

  // Redraws the whole thing (cheap: it only runs on a tap, not every frame).
  draw() {
    const g = this.g; g.clear();
    this.texts.forEach(t => t.setVisible(false));
    this.hits = [];
    let n = 0;
    const T = (x, y, s, ox) => { const t = this.texts[n] || this.text(); n++; t.setPosition(x, y).setText(s).setOrigin(ox, 0.5).setVisible(true); };
    const button = (x, y, w, h, label, fn, fill = P.purple) => {
      g.fillStyle(P.dark, 1).fillRect(x, y + 2, w, h);
      g.fillStyle(fill, 1).fillRect(x, y, w, h);
      g.lineStyle(2, P.pink, 1).strokeRect(x, y, w, h);
      T(x + w / 2, y + h / 2, label, 0.5);
      this.hits.push({ x, y, w, h, fn });
    };
    const gear = () => button(GEAR.x - GEAR.w / 2, GEAR.y - GEAR.h / 2, GEAR.w, GEAR.h, this.open ? 'X' : 'Tune', () => this.toggle(), this.open ? P.pink : P.purple);
    if (!this.open) { gear(); return; }
    const rowsEnd = PANEL.y + PANEL.top + ROWS.length * PANEL.rowH;
    const h = rowsEnd - PANEL.y + 3 * (CHEAT.h + CHEAT.gap) + CHEAT.gap;
    g.fillStyle(P.dark, 0.92).fillRect(PANEL.x, PANEL.y, PANEL.w, h);
    g.lineStyle(2, P.pink, 1).strokeRect(PANEL.x, PANEL.y, PANEL.w, h);
    gear();
    T(PANEL.x + 8, GEAR.y, 'Test tools', 0);
    ROWS.forEach((r, i) => {
      const y = PANEL.y + PANEL.top + i * PANEL.rowH, cy = y + PANEL.rowH / 2;
      T(PANEL.x + 8, cy, r[0], 0);
      T(PANEL.x + 150, cy, String(getp(r[1])), 1);
      button(PANEL.x + 158, y + 2, BTN.w, BTN.h, '-', () => this.change(r, -1));
      button(PANEL.x + 192, y + 2, BTN.w, BTN.h, '+', () => this.change(r, 1));
    });
    const x1 = PANEL.x + (PANEL.w - 2 * CHEAT.w - CHEAT.gap) / 2, x2 = x1 + CHEAT.w + CHEAT.gap;
    const y1 = rowsEnd + CHEAT.gap, y2 = y1 + CHEAT.h + CHEAT.gap, y3 = y2 + CHEAT.h + CHEAT.gap, sure = this.isSure();
    button(x1, y1, CHEAT.w, CHEAT.h, 'Finish stage', () => this.endRun(true));
    button(x2, y1, CHEAT.w, CHEAT.h, 'Lose now', () => this.endRun(false));
    button(x1, y2, CHEAT.w, CHEAT.h, 'Restart stage', () => this.restart());
    button(x2, y2, CHEAT.w, CHEAT.h, sure ? 'Sure? Tap again' : 'Reset all', () => this.resetAll(), sure ? P.pink : P.purple);
    button(x1, y3, 2 * CHEAT.w + CHEAT.gap, CHEAT.h, 'New enemy shots: ' + (shotsOn() ? 'on' : 'off'), () => { toggleShots(); this.draw(); }, shotsOn() ? P.pink : P.purple);
  }

  toggle() {
    this.open = !this.open; this.sureUntil = 0;
    this.draw();
    if (this.open) this.onOpen(); else this.onClose();
  }

  // a finger went down at (x, y): returns true when the panel used it
  press(x, y) {
    const b = this.hits.find(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
    if (b) { b.fn(); return true; }
    return this.open; // the open panel takes every touch
  }

  release() { /* nothing is held any more */ }

  update() { if (this.open && this.sureUntil && !this.isSure()) { this.sureUntil = 0; this.draw(); } } // "Sure?" goes back after a while
}

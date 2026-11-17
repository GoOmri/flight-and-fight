// The HUD: medals + version (left), score + weapon bars (centre), hearts + wave pips (right).
// Everything is created once. Graphics are only redrawn when something changed.
import { CONFIG as C, z } from './config.js';
import { PX } from './sprites.js';
import { MEDAL_KEYS } from './medals.js';

export const FONT = { fontFamily: '"Courier New", monospace', fontStyle: 'bold', resolution: 2 }; // resolution 2 = crisper text
const W = C.game.width;
const DARK = 0x1b1b2b, GREEN = 0x2ee86a;
const PIP_COMING = 0, PIP_ON = 1, PIP_OFF = 2, PIP_DONE = 3, PIP_DIRTY = 4; // pip look codes (DIRTY = done, but an enemy escaped)

export class Hud {
  constructor(scene, waveTotals, startWave) {
    const H = C.hud, depth = 50;
    this.scene = scene;
    this.startWave = startWave;
    // per wave counters for the pips
    this.total = waveTotals; this.spawned = waveTotals.map(() => 0); this.alive = waveTotals.map(() => 0); this.escaped = waveTotals.map(() => false);

    // LEFT: medals, version under them
    this.medalImgs = MEDAL_KEYS.map((k, i) =>
      scene.add.image(H.margin + i * (H.medalSize + H.medalGap), H.margin, 'medal_' + k + '_pending').setOrigin(0, 0).setDepth(depth));
    this.medalLook = MEDAL_KEYS.map(() => 'pending');
    this.versionText = scene.add.text(H.margin, H.margin + H.medalSize + 3, 'v' + C.version, { ...FONT, fontSize: z(11) + 'px', color: '#ffffff', stroke: '#1b1b2b', strokeThickness: 1 }).setAlpha(0.6).setDepth(depth);

    // CENTRE: score, weapon bars under it
    this.scoreText = scene.add.text(W / 2, H.margin, 'SCORE 0', { ...FONT, fontSize: z(18) + 'px', color: '#ffffff', stroke: '#1b1b2b', strokeThickness: z(4) }).setOrigin(0.5, 0).setDepth(depth);
    this.pop = 0; // 1 right after the score changed, falls to 0
    this.rowY = H.margin + 18; // the bars and the pips share this line
    this.bars = scene.add.graphics().setDepth(depth);
    this.barLevel = -1;

    // RIGHT: hearts, wave pips under them
    this.heartIcons = [];
    for (let i = 0; i < C.ship.hearts; i++) {
      this.heartIcons.push(scene.add.image(W - H.margin - i * z(26), H.margin + 6, 'heart').setScale(PX / C.game.zoom).setOrigin(1, 0.5).setDepth(depth));
    }
    this.pips = scene.add.graphics().setDepth(depth);
    this.pipLook = this.total.map(() => -1);
    this.setLevel(0);
  }

  setScore(n, pop) {
    this.scoreText.setText('SCORE ' + n);
    if (pop) this.pop = 1;
  }

  setHearts(n) {
    // icon 0 is the rightmost; hearts are lost from the right
    const max = C.ship.hearts;
    this.heartIcons.forEach((ic, i) => ic.setTexture(max - 1 - i < n ? 'heart' : 'heartEmpty'));
  }

  // state = { kill70: 'pending'|'earned'|'failed', ... }
  setMedals(state) {
    MEDAL_KEYS.forEach((k, i) => {
      if (this.medalLook[i] === state[k]) return;
      this.medalLook[i] = state[k];
      this.medalImgs[i].setTexture('medal_' + k + '_' + state[k]);
    });
  }

  // weapon level 0..10 = number of filled bars
  setLevel(level) {
    if (level === this.barLevel) return;
    this.barLevel = level;
    const H = C.hud, g = this.bars, n = C.pickup.maxLevel;
    const x0 = Math.round(W / 2 - (n * H.barW + (n - 1) * H.barGap) / 2);
    g.clear();
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (H.barW + H.barGap), y = this.rowY;
      if (i < level) { g.fillStyle(GREEN, 1); g.fillRect(x, y, H.barW, H.barH); }
      else { g.fillStyle(0x000000, 0.3); g.fillRect(x, y, H.barW, H.barH); }
      g.lineStyle(1, DARK, 1); g.strokeRect(x + 0.5, y + 0.5, H.barW - 1, H.barH - 1);
    }
  }

  // ---- wave pips ----
  waveSpawned(w) { this.spawned[w]++; }
  waveAlive(w, d) { this.alive[w] += d; }
  waveEscaped(w) { this.escaped[w] = true; }

  pipCode(i, time) {
    if (i < this.startWave) return PIP_DONE;
    if (this.spawned[i] === 0) return PIP_COMING;
    if (this.spawned[i] < this.total[i] || this.alive[i] > 0) return Math.floor(time / C.hud.pipBlinkMs) % 2 ? PIP_OFF : PIP_ON;
    return this.escaped[i] ? PIP_DIRTY : PIP_DONE;
  }

  drawPip(g, i, code, x, y) {
    const s = C.hud.pip, diamond = i === this.total.length - 1;
    const h = s / 2; // the 10th pip is a diamond, a bit larger
    const poly = diamond ? [{ x: x + h, y: y - 1 }, { x: x + s + 1, y: y + h }, { x: x + h, y: y + s + 1 }, { x: x - 1, y: y + h }] : null;
    if (code === PIP_COMING || code === PIP_OFF) {
      g.lineStyle(1, 0xffffff, code === PIP_OFF ? 0.35 : 0.8);
      if (poly) g.strokePoints(poly, true); else g.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
      return;
    }
    g.fillStyle(0xffffff, 1);
    if (poly) g.fillPoints(poly, true); else g.fillRect(x, y, s, s);
    if (code === PIP_DIRTY) { g.fillStyle(DARK, 1); g.fillRect(x + s - 2, y + s - 2, 2, 2); } // a notch: an enemy of this wave escaped
  }

  update(dt, time) {
    if (this.pop > 0) {
      this.pop = Math.max(0, this.pop - dt * 1000 / C.feel.scorePopMs);
      this.scoreText.setScale(1 + C.feel.scorePopScale * this.pop);
    }
    if (!C.hud.showWaveIndicator) return; // wave dots are switched off in config (hud.showWaveIndicator)
    // redraw the pips only when one of them changed its look
    let changed = false;
    for (let i = 0; i < this.total.length; i++) {
      const c = this.pipCode(i, time);
      if (c !== this.pipLook[i]) { this.pipLook[i] = c; changed = true; }
    }
    if (!changed) return;
    const H = C.hud, g = this.pips, n = this.total.length, step = H.pip + H.pipGap;
    const x0 = W - H.margin - n * step + H.pipGap;
    g.clear();
    for (let i = 0; i < n; i++) this.drawPip(g, i, this.pipLook[i], x0 + i * step, this.rowY + 1);
  }
}

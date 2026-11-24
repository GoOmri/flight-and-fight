// The HUD: medals + version (left), score + weapon bars (centre), hearts + wave pips (right).
// Everything is created once. Graphics are only redrawn when something changed.
import { CONFIG as C, z, hex } from './config.js';
import { PX } from './sprites.js';
const GOAL_TEX = { pending: 'open', earned: 'earned', failed: 'failed' }; // goal icon look per state

// ONE font for the whole game: PackFont (the pixel font of the Fantasy UI pack, made from its glyph sheet, see CREDITS.md). Only if the file cannot be loaded at all the old
// Pixelify Sans + Jersey 10 take over by themselves (main.js checks), so text never disappears.
let packOn = true;
const CLASSIC = { fontFamily: '"GameFont", monospace', fontStyle: 'bold', resolution: C.game.render };
export const FONT = { fontFamily: '"PackFont", "GameFont", monospace', fontStyle: 'normal', resolution: C.game.render }; // text drawn at canvas resolution = sharp
export const packFontOn = () => packOn;
export const useClassicFont = () => { packOn = false; Object.assign(FONT, CLASSIC); };
// A text size in game px for the pixel font. PackFont has 11 art pixels per em, so a size S draws every art pixel S * 3 / 11 canvas px wide (render x3):
// only sizes with a WHOLE number of canvas px per art pixel stay sharp. fpx() picks p = whole canvas px per art pixel from the size the code asked for
// (p = size * C.fontScale, at least 3) and returns S = 11 * p / 3: asked 8 -> p 3 (S 11), 10 -> 4 (14.7), 12 -> 5 (18.3), 16 -> 6 (22), 20 -> 8, 24 -> 9 (33). Classic fonts keep the size they were given.
export const fpx = size => (!packOn ? size : +(11 * Math.max(3, Math.round(size * C.fontScale)) / 3).toFixed(3));
const W = C.game.width;

// Chunky button plate (flat, no glow): dark bottom edge, plate with a border on top. down = pressed: plate sinks, bottom edge shrinks, fill lighter.
// Plate + edge fill exactly the box x,y,w,h. Returns how far the plate sank (so text can follow).
export function drawPlate(g, x, y, w, h, o) {
  const M = C.menu, P = M.pal, drop = M.plateDrop, sink = o.down ? M.plateDownShift : 0, r = o.radius ?? M.plateRadius;
  const light = (c, k) => { const ch = s => Math.round(((c >> s) & 255) + (255 - ((c >> s) & 255)) * k); return (ch(16) << 16) | (ch(8) << 8) | ch(0); };
  const ph = h - drop;
  g.fillStyle(P.dark, 1).fillRoundedRect(x, y + drop, w, ph, r);
  g.fillStyle(o.down ? light(o.fill, M.pressBrighten) : o.fill, 1).fillRoundedRect(x, y + sink, w, ph, r);
  g.lineStyle(M.plateBorderW, o.border, 1).strokeRoundedRect(x, y + sink, w, ph, r);
  return sink;
}
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
    let gx = H.margin; // the 3 goal icons in a row (witch hat, coin, heart), each centred in the row
    this.goalKeys = scene.goalKeys;
    this.medalImgs = this.goalKeys.map(k => {
      const im = scene.add.image(0, H.margin + H.medalSize / 2, 'goal_' + k + '_open').setOrigin(0, 0.5).setScale(H.goalScale).setDepth(depth);
      im.x = gx; gx += im.displayWidth + H.medalGap; return im;
    });
    this.medalLook = this.goalKeys.map(() => 'pending');
    this.versionText = scene.add.text(H.margin, H.margin + H.medalSize + H.versionGap, 'v' + C.version, { ...FONT, fontSize: fpx(H.versionSize) + 'px', color: hex(C.menu.pal.cream), stroke: hex(C.menu.pal.shadow), strokeThickness: H.versionStroke }).setAlpha(H.versionAlpha).setDepth(depth);

    // CENTRE: score, weapon bars under it
    this.scoreText = scene.add.text(W / 2, H.margin, 'SCORE 0', { ...FONT, fontSize: fpx(z(18)) + 'px', color: hex(C.menu.pal.cream), stroke: hex(C.menu.pal.shadow), strokeThickness: z(4) }).setOrigin(0.5, 0.5).setDepth(depth);
    this.scoreText.y = H.margin + this.scoreText.height / 2; // anchored at its middle so the pop grows in place
    this.pop = 0; // 1 right after the score changed, falls to 0
    this.rowY = H.margin + H.rowOffset; // the bars and the pips share this line
    this.bars = scene.add.graphics().setDepth(depth);
    this.barLevel = -1;

    // RIGHT: hearts, wave pips under them
    this.heartIcons = [];
    this.still = scene.textures.exists('goal_noHit_earned'); // life hearts are the SAME still picture as the no-hit goal icon: front facing, not animated, same size
    this.hs = !this.still && C.sprites.heartPickup && C.sprites.heartHud ? C.sprites.heartHud : null; // (fallback) animated hearts or the old code-drawn ones
    for (let i = 0; i < C.ship.hearts; i++) {
      const x = W - H.margin - i * H.heartStep, y = H.margin + H.heartY;
      const ic = this.still ? scene.add.image(x, y, 'goal_noHit_earned').setScale(H.goalScale) : this.hs ? scene.add.sprite(x, y, 'sp_heart_idle', 0).setScale(this.hs.scale) : scene.add.image(x, y, 'heart').setScale(PX / C.game.zoom);
      ic.setOrigin(1, 0.5).setDepth(depth);
      if (this.hs) { ic.play('heart_idle'); ic.anims.setCurrentFrame(ic.anims.currentAnim.frames[(i * this.hs.desync) % C.sprites.heartPickup.idle.frames]); } // each heart beats a little out of step
      ic.full = true;
      ic.baseX = ic.x; ic.baseScale = ic.scaleX; ic.pop = 0; // pop = 1 when the heart was just lost, falls to 0
      this.heartIcons.push(ic);
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
    this.heartIcons.forEach((ic, i) => {
      const full = max - 1 - i < n, key = full ? 'heart' : 'heartEmpty';
      if (this.still) { // still heart: a lost one is a dark flat shape
        if (ic.full === full) return;
        ic.full = full;
        if (full) ic.clearTint().setAlpha(1); else ic.setTintFill(C.sprites.heartHud.emptyTint).setAlpha(C.sprites.heartHud.emptyAlpha);
        return;
      }
      if (this.hs) { // animated heart: full = beating loop, empty = first frame as a dark flat shape
        if (ic.full === full) return;
        ic.full = full;
        if (full) { ic.clearTint().setAlpha(1); ic.play('heart_idle'); } else { ic.anims.stop(); ic.setFrame(0).setTintFill(this.hs.emptyTint).setAlpha(this.hs.emptyAlpha); }
      } else {
        if (ic.texture.key === key) return;
        ic.setTexture(key);
      }
      if (!full && C.feel.heartPopMs > 0) ic.pop = 1; // a heart was just lost: pop and shake
    });
  }

  // state = { kill70: 'pending'|'earned'|'failed', ... }
  setMedals(state) {
    this.goalKeys.forEach((k, i) => {
      if (this.medalLook[i] === state[k]) return;
      this.medalLook[i] = state[k];
      this.medalImgs[i].setTexture('goal_' + k + '_' + GOAL_TEX[state[k]]);
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
    const F = C.feel;
    for (const ic of this.heartIcons) {
      if (ic.pop <= 0) continue;
      ic.pop = Math.max(0, ic.pop - dt * 1000 / F.heartPopMs);
      ic.setScale(ic.baseScale * (1 + F.heartPopScale * ic.pop));
      ic.x = ic.baseX + (Math.random() - 0.5) * 2 * F.heartShakePx * ic.pop;
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

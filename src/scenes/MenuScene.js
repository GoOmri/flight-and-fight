import { CONFIG as C } from '../config.js';
import { makeAllTextures } from '../sprites.js';
import { FONT } from '../hud.js';
import { MEDAL_KEYS, loadMedals, loadBest } from '../medals.js';
import { latestVersion, refreshFiles } from '../update.js';

const W = C.game.width, H = C.game.height, R = C.game.render;
const M = C.menu;
const DEBUG_PARAMS = ['wave', 'god', 'bg', 'ctl']; // any of these in the web address: skip the menu (old behaviour)
const STAGES = [
  { theme: 'forest', name: 'FOREST', num: '1', color: C.background.forest.groundColor },
  { theme: 'swamp', name: 'SWAMP', num: '2', color: C.background.swamp.groundColor }
];
const mix = (c, k) => { // mix colour c towards white by k (0..1)
  const ch = s => Math.round(((c >> s) & 255) + (255 - ((c >> s) & 255)) * k);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

// Start menu: two big cards (Forest, Swamp). Press = brighter, release on the same card = start that stage.
export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const q = new URLSearchParams(window.location.search);
    if (DEBUG_PARAMS.some(k => q.has(k))) { this.scene.start('Play'); return; }
    makeAllTextures(this); // medal pictures (made once, skipped when they exist)
    this.cameras.main.setZoom(R).centerOn(W / 2, H / 2).setBackgroundColor(M.bgColor);
    const txt = (x, y, s, size, stroke, align = 0.5) => this.add.text(x, y, s, { ...FONT, fontSize: size + 'px', color: '#ffffff', stroke: '#1b1b2b', strokeThickness: stroke }).setOrigin(align, 0.5);
    txt(W / 2, M.titleY, 'Flight and Fight', M.titleSize, M.titleStroke);
    txt(W / 2, H - M.versionBottom, 'v' + C.version, M.versionSize, 2).setAlpha(M.versionAlpha);

    this.cards = STAGES.map((st, i) => {
      const x = (W - M.cardW) / 2, y = M.cardTop + i * (M.cardH + M.cardGap);
      const g = this.add.graphics();
      const card = { st, x, y, g, down: false };
      card.draw = () => {
        const k = card.down ? M.pressBrighten : 0;
        g.clear();
        g.fillStyle(mix(st.color, k), 1).fillRoundedRect(x, y, M.cardW, M.cardH, M.cardRadius);
        g.lineStyle(M.borderW, mix(M.borderColor, k), 1).strokeRoundedRect(x, y, M.cardW, M.cardH, M.cardRadius);
      };
      card.draw();
      txt(x + 24, y + 28, st.num, M.numberSize, 4);
      txt(x + 48, y + 28, st.name, M.nameSize, 4, 0);
      const medals = loadMedals(st.theme), best = loadBest(st.theme);
      const n = MEDAL_KEYS.length, sz = 12 * M.medalScale; // medal art is about 12 px wide
      MEDAL_KEYS.forEach((k, j) => {
        const img = this.add.image(0, y + 66, 'medal_' + k + '_' + (medals[k] ? 'earned' : 'pending')).setScale(M.medalScale);
        img.x = W / 2 + (j - (n - 1) / 2) * (img.displayWidth + M.medalGap);
      });
      if (best > 0) txt(W / 2, y + M.cardH - 16, 'BEST ' + best, M.bestSize, 2);
      return card;
    });

    // UPDATE button: gets fresh copies of all game files and reloads (also fixes an old saved copy in the browser or the installed app).
    // When the menu opens it asks the server for the newest version number; if it is newer the button lights up green.
    const bx = (W - M.updateW) / 2, by = M.updateTop;
    const btn = { btn: true, x: bx, y: by, w: M.updateW, h: M.updateH, g: this.add.graphics(), down: false, hot: false, busy: false };
    btn.label = this.add.text(W / 2, by + M.updateH / 2, 'UPDATE', { ...FONT, fontSize: M.updateSize + 'px', color: '#ffffff', stroke: '#1b1b2b', strokeThickness: 3 }).setOrigin(0.5);
    btn.draw = () => {
      const k = btn.down ? M.pressBrighten : 0, fill = btn.hot ? M.updateHotColor : M.updateColor;
      btn.g.clear().fillStyle(mix(fill, k), 1).fillRoundedRect(bx, by, M.updateW, M.updateH, 8)
        .lineStyle(3, mix(M.borderColor, k), 1).strokeRoundedRect(bx, by, M.updateW, M.updateH, 8);
    };
    btn.draw();
    btn.action = async () => {
      if (btn.busy) return;
      btn.busy = true; btn.label.setText('UPDATING...');
      try { await refreshFiles(); window.location.reload(); }
      catch (e) { btn.label.setText('NO INTERNET'); this.time.delayedCall(2200, () => { btn.busy = false; btn.label.setText(btn.hot ? 'NEW VERSION' : 'UPDATE'); }); }
    };
    latestVersion().then(v => {
      if (!v || v === C.version || !btn.label.active) return; // same version, offline, or the menu was already left
      btn.hot = true; btn.label.setText('NEW VERSION'); btn.draw();
    });
    this.buttons = [...this.cards, btn];

    // Input: remember which card was pressed; release on the same card starts it. Handlers are removed on shutdown.
    const hit = p => this.buttons.find(c => { const px = p.x / R, py = p.y / R; return px >= c.x && px <= c.x + (c.w || M.cardW) && py >= c.y && py <= c.y + (c.h || M.cardH); });
    this.pressed = null;
    const setPressed = c => { if (this.pressed) { this.pressed.down = false; this.pressed.draw(); } this.pressed = c; if (c) { c.down = true; c.draw(); } };
    const onDown = p => setPressed(hit(p) || null);
    const onMove = p => { if (this.pressed && hit(p) !== this.pressed) setPressed(null); }; // finger slid off: cancel
    const onUp = p => {
      const c = this.pressed, same = c && hit(p) === c;
      setPressed(null);
      if (same) { if (c.btn) c.action(); else this.scene.start('Play', { theme: c.st.theme }); }
    };
    this.input.on('pointerdown', onDown);
    this.input.on('pointermove', onMove);
    this.input.on('pointerup', onUp);
    this.input.on('pointerupoutside', setPressed.bind(null, null));
    this.events.once('shutdown', () => {
      this.input.off('pointerdown', onDown); this.input.off('pointermove', onMove);
      this.input.off('pointerup', onUp); this.input.off('pointerupoutside');
      this.pressed = null;
    });
  }
}

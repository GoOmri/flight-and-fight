import { CONFIG as C, hex } from '../config.js';
import { makeAllTextures } from '../sprites.js';
import { FONT, drawPlate } from '../hud.js';
import { MEDAL_KEYS, loadMedals, loadBest } from '../medals.js';
import { latestVersion, refreshFiles } from '../update.js';

const W = C.game.width, H = C.game.height, R = C.game.render;
const M = C.menu;
import { toggleTune } from '../tune.js';
const DEBUG_PARAMS = ['wave', 'god', 'bg', 'ctl']; // any of these in the web address: skip the menu (old behaviour)
const P = M.pal;
const STAGES = [
  { theme: 'forest', name: 'FOREST', num: '1', tab: M.tabColors.forest },
  { theme: 'swamp', name: 'SWAMP', num: '2', tab: M.tabColors.swamp }
];

// Start menu: two big cards (Forest, Swamp). Press = brighter, release on the same card = start that stage.
export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  // The menu is the first scene, so it loads its own Halloween pictures (assets/menu, see CREDITS.md).
  preload() {
    const sky = M.sky;
    this.load.spritesheet('menu_sky', 'assets/' + sky.file, { frameWidth: sky.frameW, frameHeight: sky.frameH });
    for (const d of M.decor) this.load.spritesheet('menu_' + d.key, 'assets/' + d.file, { frameWidth: d.frameW, frameHeight: d.frameH });
    this.load.image('menu_logo', 'assets/' + M.logo.file);
  }

  create() {
    const q = new URLSearchParams(window.location.search);
    if (DEBUG_PARAMS.some(k => q.has(k))) { this.scene.start('Play'); return; }
    makeAllTextures(this); // medal pictures (made once, skipped when they exist)
    this.cameras.main.setZoom(R).centerOn(W / 2, H / 2).setBackgroundColor(M.bgColor);
    this.addArt();
    const txt = (x, y, s, size, stroke, align = 0.5, color = P.cream) => this.add.text(x, y, s, { ...FONT, fontSize: size + 'px', color: hex(color), stroke: hex(P.shadow), strokeThickness: stroke }).setOrigin(align, 0.5);
    if (this.textures.exists('menu_logo')) this.add.image(M.logo.x, M.logo.y, 'menu_logo').setOrigin(0.5, 0).setScale(M.logo.scale); // pixel logo: "Fight & Flight", tilted up in perspective
    else txt(W / 2, M.titleY, 'Flight and Fight', M.titleSize, M.titleStroke);
    const verTxt = txt(W / 2, H - M.versionBottom, 'v' + C.version, M.versionSize, 2).setAlpha(M.versionAlpha);
    let verTaps = 0, verAt = 0; // 5 quick taps on the version text turn the tuning panel on or off (see tune.js)

    this.cards = STAGES.map((st, i) => {
      const x = (W - M.cardW) / 2, y = M.cardTop + i * (M.cardH + M.cardGap);
      const g = this.add.graphics();
      const card = { st, x, y, g, down: false, items: [] };
      const add = (o, oy) => { card.items.push({ o, oy }); return o; }; // texts and medals sink with the plate when pressed
      card.draw = () => {
        g.clear();
        const sink = drawPlate(g, x, y, M.cardW, M.cardH, { fill: P.purple, border: P.pink, down: card.down, radius: M.cardRadius });
        const b = M.plateBorderW, ph = M.cardH - M.plateDrop;
        g.fillStyle(st.tab, 1).fillRect(x + b, y + sink + M.cardRadius, M.tabW, ph - 2 * M.cardRadius); // colour tab inside the left border
        card.items.forEach(i => i.o.setY(i.oy + sink));
      };
      add(txt(x + 24, y + 28, st.num, M.numberSize, 3, 0.5, P.orange), y + 28);
      add(txt(x + 48, y + 28, st.name, M.nameSize, 3, 0), y + 28);
      const medals = loadMedals(st.theme), best = loadBest(st.theme);
      const n = MEDAL_KEYS.length;
      MEDAL_KEYS.forEach((k, j) => {
        const img = add(this.add.image(0, y + 66, 'medal_' + k + '_' + (medals[k] ? 'earned' : 'pending')).setScale(M.medalScale), y + 66);
        img.x = W / 2 + (j - (n - 1) / 2) * (img.displayWidth + M.medalGap);
      });
      if (best > 0) add(txt(W / 2, y + M.cardH - 16, 'BEST ' + best, M.bestSize, 2, 0.5, P.cyan), y + M.cardH - 16);
      card.draw();
      return card;
    });

    // UPDATE button: gets fresh copies of all game files and reloads (also fixes an old saved copy in the browser or the installed app).
    // When the menu opens it asks the server for the newest version number; if it is newer the button turns orange.
    const bx = (W - M.updateW) / 2, by = M.updateTop;
    const btn = { btn: true, x: bx, y: by, w: M.updateW, h: M.updateH, g: this.add.graphics(), down: false, hot: false, busy: false };
    btn.label = this.add.text(W / 2, by + M.updateH / 2, 'UPDATE', { ...FONT, fontSize: M.updateSize + 'px', color: hex(P.cream), stroke: hex(P.shadow), strokeThickness: 3 }).setOrigin(0.5);
    btn.draw = () => {
      btn.g.clear();
      const sink = drawPlate(btn.g, bx, by, M.updateW, M.updateH, { fill: btn.hot ? M.updateHotColor : M.updateColor, border: btn.hot ? M.updateHotBorder : P.pink, down: btn.down, radius: 8 });
      btn.label.setColor(btn.hot ? hex(P.dark) : hex(P.cream)).setStroke(hex(P.shadow), btn.hot ? 0 : 3); // dark text on the orange plate
      btn.label.setY(by + (M.updateH - M.plateDrop) / 2 + sink + 1);
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
    const onDown = p => {
      if (Math.abs(p.x / R - W / 2) < 40 && Math.abs(p.y / R - (H - M.versionBottom)) < 12) {
        verTaps = this.time.now - verAt < 800 ? verTaps + 1 : 1; verAt = this.time.now;
        if (verTaps >= 5) { verTaps = 0; verTxt.setText(toggleTune() ? 'TUNE ON' : 'TUNE OFF'); this.time.delayedCall(1500, () => verTxt.active && verTxt.setText('v' + C.version)); }
      }
      setPressed(hit(p) || null);
    };
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

  // Animated sky and the little Halloween friends. They sit around the cards and take no input. Animations are made once.
  addArt() {
    const mk = (key, tex, fps, frames) => { if (!this.anims.exists(key)) this.anims.create({ key, frames: this.anims.generateFrameNumbers(tex, { start: 0, end: frames - 1 }), frameRate: fps, repeat: -1 }); };
    const sky = M.sky;
    mk('menu_sky', 'menu_sky', sky.fps, sky.frames);
    this.add.sprite(0, 0, 'menu_sky').setOrigin(0, 0).setScale(W / sky.frameW).setDepth(-10).play('menu_sky');
    for (const d of M.decor) {
      mk('menu_' + d.key, 'menu_' + d.key, d.fps, d.frames);
      const s = this.add.sprite(d.x, d.y, 'menu_' + d.key).setOrigin(d.originX, d.originY).setScale(d.scale).setFlipX(!!d.flipX).setDepth(-5);
      s.play('menu_' + d.key);
      s.anims.setCurrentFrame(s.anims.currentAnim.frames[Phaser.Math.Between(0, d.frames - 1)]);
      if (d.bob) this.tweens.add({ targets: s, y: d.y + d.bob, duration: d.bobMs / 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Phaser.Math.Between(0, 600) });
    }
  }
}

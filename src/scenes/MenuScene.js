import { CONFIG as C, hex } from '../config.js';
import { makeAllTextures } from '../sprites.js';
import { FONT, drawPlate } from '../hud.js';
import { MEDAL_KEYS, loadMedals, loadBest } from '../medals.js';
import { latestVersion, refreshFiles } from '../update.js';
import { toggleTune, tuneEnabled } from '../tune.js';

const W = C.game.width, H = C.game.height, R = C.game.render;
const M = C.menu;
const DEBUG_PARAMS = ['wave', 'god', 'bg', 'ctl']; // any of these in the web address: skip the menu (old behaviour)
const P = M.pal;
const CTL_KEY = 'ff_controls'; // saved choice of the settings panel: 'drag' or 'stick'

// Start menu: a path of stage bubbles going up the screen (Forest at the bottom, then Swamp, then Stage 3, still locked), the logo and UPDATE at the bottom,
// a gear in the top right corner that opens the settings. Press = brighter, release on the same bubble = start that stage.
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
    try { const s = localStorage.getItem(CTL_KEY); if (s === 'drag' || s === 'stick') C.ship.controls = s; } catch (e) { /* no saved choice */ }
    makeAllTextures(this); // medal pictures (made once, skipped when they exist)
    this.cameras.main.setZoom(R).centerOn(W / 2, H / 2).setBackgroundColor(M.bgColor);
    this.addArt();
    const txt = (x, y, s, size, stroke, align = 0.5, color = P.cream) => this.add.text(x, y, s, { ...FONT, fontSize: size + 'px', color: hex(color), stroke: hex(P.shadow), strokeThickness: stroke }).setOrigin(align, 0.5);
    this.txt = txt;
    if (this.textures.exists('menu_logo')) this.add.image(M.logo.x, M.logo.y, 'menu_logo').setOrigin(0.5, 0).setScale(M.logo.scale); // pixel logo: "Fight & Flight", tilted up in perspective
    else txt(W / 2, M.titleY, 'Flight and Fight', M.titleSize, M.titleStroke);
    const verTxt = txt(W / 2, H - M.versionBottom, 'v' + C.version, M.versionSize, 2).setAlpha(M.versionAlpha);
    let verTaps = 0, verAt = 0; // 5 quick taps on the version text turn the tuning panel on or off (see tune.js)

    // ---- the path: a line up the middle, bubbles left and right of it
    const PA = M.path, bw = PA.bubbleW, bh = PA.bubbleH;
    const line = this.add.graphics();
    line.fillStyle(PA.lineColor, 1).fillRect(PA.x - PA.lineW / 2, PA.lineTop, PA.lineW, PA.lineBottom - PA.lineTop);
    this.bubbles = [];
    for (const nd of PA.nodes) {
      const left = nd.side === 'L', x = left ? PA.x - PA.gap - bw : PA.x + PA.gap, y = nd.cy - bh / 2;
      line.fillStyle(PA.lineColor, 1).fillRect(left ? x + bw : PA.x, nd.cy - PA.lineW / 2, PA.gap, PA.lineW); // little arm from the line to the bubble
      const b = this.makeBubble(nd, x, y, bw, bh, txt);
      this.bubbles.push(b);
    }

    // ---- UPDATE button: gets fresh copies of all game files and reloads (also fixes an old saved copy in the browser or the installed app).
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

    // ---- gear (top right): opens the settings panel
    const GE = M.gear, gear = { btn: true, x: GE.x - GE.hit / 2, y: GE.y - GE.hit / 2, w: GE.hit, h: GE.hit, g: this.add.graphics(), down: false };
    this.drawGear(gear.g, GE);
    gear.draw = () => gear.g.setAlpha(gear.down ? 0.65 : 1);
    gear.action = () => this.openSettings(true);

    this.modal = false;
    this.buttons = [...this.bubbles.filter(b => !b.locked), btn, gear];
    this.makeSettings();

    // Input: remember which button was pressed; release on the same button uses it. Handlers are removed on shutdown.
    const hit = p => (this.modal ? this.panelButtons : this.buttons).find(c => { const px = p.x / R, py = p.y / R; return px >= c.x && px <= c.x + c.w && py >= c.y && py <= c.y + c.h; });
    this.pressed = null;
    const setPressed = c => { if (this.pressed) { this.pressed.down = false; this.pressed.draw(); } this.pressed = c; if (c) { c.down = true; c.draw(); } };
    const onDown = p => {
      if (!this.modal && Math.abs(p.x / R - W / 2) < 40 && Math.abs(p.y / R - (H - M.versionBottom)) < 12) {
        verTaps = this.time.now - verAt < 800 ? verTaps + 1 : 1; verAt = this.time.now;
        if (verTaps >= 5) { verTaps = 0; verTxt.setText(toggleTune() ? 'TUNE ON' : 'TUNE OFF'); this.time.delayedCall(1500, () => verTxt.active && verTxt.setText('v' + C.version)); }
      }
      setPressed(hit(p) || null);
    };
    const onMove = p => { if (this.pressed && hit(p) !== this.pressed) setPressed(null); }; // finger slid off: cancel
    const onUp = p => {
      const c = this.pressed, same = c && hit(p) === c;
      setPressed(null);
      if (!same) return;
      if (c.action) c.action(); else if (c.st) this.scene.start('Play', { theme: c.st.theme });
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

  // One stage bubble: a plate with a colour tab, the name, the earned medals and the best score. A locked stage is faded and says SOON.
  makeBubble(nd, x, y, w, h, txt) {
    const g = this.add.graphics();
    const b = { st: { theme: nd.theme }, locked: !!nd.locked, x, y, w, h, g, down: false, items: [] };
    const add = (o, oy) => { b.items.push({ o, oy }); return o; }; // texts and medals sink with the plate when pressed
    const B = M.bubble, cx = x + w / 2;
    b.draw = () => {
      g.clear();
      const sink = drawPlate(g, x, y, w, h, { fill: b.locked ? M.lockedFill : P.purple, border: b.locked ? M.lockedBorder : P.pink, down: b.down, radius: M.cardRadius });
      b.items.forEach(i => i.o.setY(i.oy + sink));
    };
    if (b.locked) {
      add(txt(cx, y + 22, nd.name, B.nameSize, 3, 0.5, M.lockedText), y + 22);
      add(txt(cx, y + 42, 'SOON', B.nameSize, 3, 0.5, M.lockedText), y + 42);
    } else {
      add(txt(cx, y + 14, nd.name, B.nameSize, 3), y + 14);
      const medals = loadMedals(nd.theme), best = loadBest(nd.theme), n = MEDAL_KEYS.length;
      MEDAL_KEYS.forEach((k, j) => {
        const img = add(this.add.image(0, y + 34, 'medal_' + k + '_' + (medals[k] ? 'earned' : 'pending')).setScale(B.medalScale), y + 34);
        img.x = cx + (j - (n - 1) / 2) * (img.displayWidth + B.medalGap);
      });
      if (best > 0) add(txt(cx, y + h - 12, 'BEST ' + best, B.bestSize, 2, 0.5, P.cyan), y + h - 12);
    }
    b.draw();
    return b;
  }

  // The gear: a small pixel-art cog drawn in code (art pixel = GE.px game px).
  drawGear(g, GE) {
    const n = GE.art, c = (n - 1) / 2, px = GE.px, x0 = GE.x - n * px / 2, y0 = GE.y - n * px / 2;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const dx = i - c, dy = j - c, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      const body = d <= n * 0.38 && d >= n * 0.16, tooth = d > n * 0.38 && d <= n * 0.5 && Math.cos(8 * a) > 0.2;
      if (!body && !tooth) continue;
      g.fillStyle(dx + dy > 1 ? GE.shade : GE.color, 1).fillRect(x0 + i * px, y0 + j * px, px, px);
    }
  }

  // The settings panel (closed at first): CONTROLS (drag / stick, saved), TUNE PANEL (on / off), SOUND (not in the game yet), CLOSE.
  makeSettings() {
    const S = M.settings, txt = this.txt, objs = [];
    const keep = o => { o.setDepth(S.depth).setVisible(false); objs.push(o); return o; };
    const back = keep(this.add.graphics());
    back.fillStyle(P.dark, 0.96).fillRoundedRect(S.x, S.y, S.w, S.h, M.plateRadius);
    back.lineStyle(M.plateBorderW, P.pink, 1).strokeRoundedRect(S.x, S.y, S.w, S.h, M.plateRadius);
    keep(txt(S.x + S.w / 2, S.y + 16, 'SETTINGS', S.titleSize, 3));
    this.panelButtons = [];
    const mkBtn = (x, y, w, h, label, action, fill = P.purple, color = P.cream) => {
      const bt = { btn: true, x, y, w, h, g: keep(this.add.graphics()), down: false, action, fill, shown: false };
      bt.label = keep(txt(x + w / 2, y + h / 2, label, M.settings.btnSize, 3, 0.5, color));
      bt.draw = () => {
        bt.g.clear();
        if (!bt.shown) return;
        const sink = drawPlate(bt.g, x, y, w, h, { fill: bt.fill, border: P.pink, down: bt.down, radius: 6 });
        bt.label.setY(y + (h - M.plateDrop) / 2 + sink + 1);
      };
      this.panelButtons.push(bt);
      return bt;
    };
    const rowY = i => S.y + 40 + i * S.rowH;
    // CONTROLS
    keep(txt(S.x + 12, rowY(0) + 11, 'CONTROLS', M.settings.btnSize, 3, 0));
    const ctl = mkBtn(S.x + S.w - 12 - S.btnW, rowY(0), S.btnW, 22, C.ship.controls === 'stick' ? 'STICK' : 'DRAG', () => {
      const v = C.ship.controls === 'stick' ? 'drag' : 'stick';
      C.ship.controls = v;
      try { localStorage.setItem(CTL_KEY, v); } catch (e) { /* not saved */ }
      ctl.label.setText(v === 'stick' ? 'STICK' : 'DRAG'); hint.setText(v === 'stick' ? 'RING STICK UNDER YOUR THUMB' : 'SWIPE ANYWHERE TO MOVE');
    });
    const hint = keep(txt(S.x + 12, rowY(0) + 32, C.ship.controls === 'stick' ? 'RING STICK UNDER YOUR THUMB' : 'SWIPE ANYWHERE TO MOVE', 8, 2, 0, P.cyan));
    // TUNE PANEL
    keep(txt(S.x + 12, rowY(1) + 11 + 10, 'TUNE PANEL', M.settings.btnSize, 3, 0));
    const tn = mkBtn(S.x + S.w - 12 - S.btnW, rowY(1) + 10, S.btnW, 22, tuneEnabled() ? 'ON' : 'OFF', () => { tn.label.setText(toggleTune() ? 'ON' : 'OFF'); });
    // SOUND
    keep(txt(S.x + 12, rowY(2) + 11 + 10, 'SOUND', M.settings.btnSize, 3, 0, M.lockedText));
    keep(txt(S.x + S.w - 12 - S.btnW / 2, rowY(2) + 11 + 10, 'SOON', M.settings.btnSize, 3, 0.5, M.lockedText));
    // CLOSE
    mkBtn(S.x + (S.w - 90) / 2, S.y + S.h - 34, 90, 24, 'CLOSE', () => this.openSettings(false), P.purple);
    this.panelObjs = objs;
  }

  openSettings(on) {
    this.modal = on;
    this.panelObjs.forEach(o => o.setVisible(on));
    this.panelButtons.forEach(b => { b.shown = on; b.label.setVisible(on); b.draw(); });
  }

  // Animated sky and the little Halloween friends. They sit around the path and take no input. Animations are made once.
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

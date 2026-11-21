import { CONFIG as C, hex } from '../config.js';
import { makeAllTextures } from '../sprites.js';
import { FONT, fpx, drawPlate, packFontOn, savePackFont } from '../hud.js';
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
    for (const k of ['panel-parchment', 'panel-wood', 'panel-stone', 'button-normal', 'button-pressed', 'button-hover', 'gear']) this.load.image('ui_' + k, 'assets/ui/ui-' + k + '.png'); // Fantasy UI pack (catau-games): parchment panel, copper button (3 looks), settings medallion
  }

  create() {
    const q = new URLSearchParams(window.location.search);
    if (DEBUG_PARAMS.some(k => q.has(k))) { this.scene.start('Play'); return; }
    try { const s = localStorage.getItem(CTL_KEY); if (s === 'drag' || s === 'stick') C.ship.controls = s; } catch (e) { /* no saved choice */ }
    makeAllTextures(this); // medal pictures (made once, skipped when they exist)
    this.cameras.main.setZoom(R).centerOn(W / 2, H / 2).setBackgroundColor(M.bgColor);
    this.addArt();
    const txt = (x, y, s, size, stroke, align = 0.5, color = P.cream) => this.add.text(x, y, s, { ...FONT, fontSize: fpx(size) + 'px', color: hex(color), stroke: hex(P.shadow), strokeThickness: stroke }).setOrigin(align, 0.5);
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
    const art = this.textures.exists('ui_button-normal'), UB = M.updateBtn; // the copper button (9-slice: the ends stay, the middle stretches); without the pictures the old drawn plate is used
    const ubw = art ? UB.w : M.updateW, ubh = art ? 22 : M.updateH, bx = (W - ubw) / 2, by = M.updateTop;
    const btn = { btn: true, x: bx, y: by, w: ubw, h: ubh, g: this.add.graphics(), down: false, hot: false, busy: false };
    btn.img = art ? this.add.nineslice(bx, by, 'ui_button-normal', undefined, ubw, 22, 12, 12, 0, 0).setOrigin(0, 0) : null;
    btn.label = this.add.text(W / 2, by + ubh / 2, 'UPDATE', { ...FONT, fontSize: fpx(M.updateSize) + 'px', color: hex(P.cream), stroke: hex(P.shadow), strokeThickness: 3 }).setOrigin(0.5);
    btn.draw = () => {
      btn.g.clear();
      if (art) { // normal, pressed, or hover (a newer version is waiting); dark brown text
        btn.img.setTexture('ui_button-' + (btn.down ? 'pressed' : (btn.hot ? 'hover' : 'normal')));
        btn.label.setColor(hex(UB.textColor)).setStroke(hex(P.shadow), 0);
        btn.label.setY(by + ubh / 2 - 1 + (btn.down ? 1 : 0));
        return;
      }
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
    const GE = M.gear, gear = { btn: true, x: GE.x - GE.hit / 2, y: GE.y - GE.hit / 2, w: GE.hit, h: GE.hit, down: false };
    gear.img = this.textures.exists('ui_gear') ? this.add.image(GE.x, GE.y, 'ui_gear').setScale(GE.scale) : null; // the medallion; without the picture a code-drawn cog
    if (!gear.img) { gear.g = this.add.graphics(); this.drawGear(gear.g, GE); }
    gear.draw = () => (gear.img || gear.g).setAlpha(gear.down ? 0.65 : 1);
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
    const key = 'ui_panel-' + M.bubble.panel, art = this.textures.exists(key); // the panel picture (config menu.bubble.panel: 'stone' or 'wood'), 9-slice with the 24 px ornate border; a locked stage is the same panel, darker; without the picture the old drawn plate
    const g = this.add.graphics();
    const b = { st: { theme: nd.theme }, locked: !!nd.locked, x, y, w, h, g, down: false, items: [] };
    const img = art ? this.add.nineslice(x, y, key, undefined, w, h, 24, 24, 24, 24).setOrigin(0, 0) : null;
    const add = (o, oy) => { b.items.push({ o, oy }); return o; }; // texts and medals sink with the plate when pressed
    const B = M.bubble, cx = x + w / 2;
    b.draw = () => {
      g.clear();
      const sink = art ? (b.down ? 1 : 0) : drawPlate(g, x, y, w, h, { fill: b.locked ? M.lockedFill : P.purple, border: b.locked ? M.lockedBorder : P.pink, down: b.down, radius: M.cardRadius });
      if (art) { img.setTint(b.down ? 0xcccccc : (b.locked ? M.bubble.lockedTint : 0xffffff)); img.y = y + sink; }
      b.items.forEach(i => i.o.setY(i.oy + sink));
    };
    if (b.locked) {
      add(txt(cx, y + 24, nd.name, B.nameSize, 3, 0.5, M.lockedText), y + 24);
      add(txt(cx, y + 44, 'SOON', B.nameSize, 3, 0.5, M.lockedText), y + 44);
    } else {
      add(txt(cx, y + 14, nd.name, B.nameSize, 3), y + 14);
      const medals = loadMedals(nd.theme), best = loadBest(nd.theme), n = MEDAL_KEYS.length;
      MEDAL_KEYS.forEach((k, j) => {
        const im = add(this.add.image(0, y + 34, 'medal_' + k + '_' + (medals[k] ? 'earned' : 'pending')).setScale(B.medalScale), y + 34);
        im.x = cx + (j - (n - 1) / 2) * (im.displayWidth + B.medalGap);
      });
      if (best > 0) add(txt(cx, y + h - 13, 'BEST ' + best, B.bestSize, 2, 0.5, P.cyan), y + h - 13);
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
    const S = M.settings, objs = [], ink = S.ink;
    const keep = o => { o.setDepth(S.depth).setVisible(false); objs.push(o); return o; };
    const art = this.textures.exists('ui_panel-parchment'), T = (x, y, s, size, align = 0.5, color = ink) => keep(this.add.text(x, y, s, { ...FONT, fontSize: fpx(size) + 'px', color: hex(color) }).setOrigin(align, 0.5));
    // a dark veil over the menu, then the parchment (9-slice: the 24 px ragged border stays, the middle stretches); without the picture a drawn dark plate
    const veil = keep(this.add.graphics()); veil.fillStyle(0x000000, 0.55).fillRect(0, 0, W, H); veil.setDepth(S.depth - 1);
    if (art) keep(this.add.nineslice(S.x, S.y, 'ui_panel-parchment', undefined, S.w, S.h, 24, 24, 24, 24).setOrigin(0, 0));
    else { const back = keep(this.add.graphics()); back.fillStyle(P.dark, 0.96).fillRoundedRect(S.x, S.y, S.w, S.h, M.plateRadius); back.lineStyle(M.plateBorderW, P.pink, 1).strokeRoundedRect(S.x, S.y, S.w, S.h, M.plateRadius); }
    T(S.x + S.w / 2, S.y + 36, 'SETTINGS', S.titleSize, 0.5, art ? ink : P.cream);
    this.panelButtons = [];
    const mkBtn = (x, y, w, label, action) => { // a copper button: 9-slice picture (normal / pressed) with dark text
      const h = 22, bt = { btn: true, x, y, w, h, down: false, action, shown: false };
      bt.img = art ? keep(this.add.nineslice(x, y, 'ui_button-normal', undefined, w, h, 12, 12, 0, 0).setOrigin(0, 0)) : null;
      bt.g = keep(this.add.graphics());
      bt.label = T(x + w / 2, y + h / 2 - 1, label, S.btnSize, 0.5, art ? ink : P.cream);
      bt.draw = () => {
        bt.g.clear();
        if (art) { bt.img.setTexture('ui_button-' + (bt.down ? 'pressed' : 'normal')); bt.label.setY(y + h / 2 - 1 + (bt.down ? 1 : 0)); return; }
        if (!bt.shown) return;
        const sink = drawPlate(bt.g, x, y, w, h, { fill: P.purple, border: P.pink, down: bt.down, radius: 6 });
        bt.label.setY(y + (h - M.plateDrop) / 2 + sink + 1);
      };
      this.panelButtons.push(bt);
      return bt;
    };
    const left = S.x + 30, right = S.x + S.w - 30, bwid = S.btnW, lc = art ? ink : P.cream, hc = art ? S.hintInk : P.cyan;
    // CONTROLS
    T(left, S.y + 66, 'CONTROLS', S.btnSize, 0, lc);
    const ctl = mkBtn(right - bwid, S.y + 55, bwid, C.ship.controls === 'stick' ? 'STICK' : 'DRAG', () => {
      const v = C.ship.controls === 'stick' ? 'drag' : 'stick';
      C.ship.controls = v;
      try { localStorage.setItem(CTL_KEY, v); } catch (e) { /* not saved */ }
      ctl.label.setText(v === 'stick' ? 'STICK' : 'DRAG'); hint.setText(v === 'stick' ? 'RING STICK UNDER YOUR THUMB' : 'SWIPE ANYWHERE TO MOVE');
    });
    const hint = T(left, S.y + 92, C.ship.controls === 'stick' ? 'RING STICK UNDER YOUR THUMB' : 'SWIPE ANYWHERE TO MOVE', 8, 0, hc);
    // TUNE PANEL
    T(left, S.y + 125, 'TUNE PANEL', S.btnSize, 0, lc);
    const tn = mkBtn(right - bwid, S.y + 114, bwid, tuneEnabled() ? 'ON' : 'OFF', () => { tn.label.setText(toggleTune() ? 'ON' : 'OFF'); });
    // FONT (the page reloads to use the other one)
    T(left, S.y + 155, 'FONT', S.btnSize, 0, lc);
    mkBtn(right - bwid - 20, S.y + 144, bwid + 20, packFontOn() ? 'PACK' : 'CLASSIC', () => { savePackFont(!packFontOn()); window.location.reload(); });
    // SOUND
    T(left, S.y + 186, 'SOUND', S.btnSize, 0, hc);
    T(right - bwid / 2, S.y + 186, 'SOON', S.btnSize, 0.5, hc);
    // CLOSE
    mkBtn(S.x + (S.w - 90) / 2, S.y + S.h - 56, 90, 'CLOSE', () => this.openSettings(false));
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
      const s = this.add.sprite(d.x, d.y, 'menu_' + d.key).setOrigin(d.originX, d.originY).setScale(d.scale).setFlipX(!!d.flipX).setDepth(d.depth ?? -5); // depth: higher = in front (the witch is in front of everything)
      s.play('menu_' + d.key);
      s.anims.setCurrentFrame(s.anims.currentAnim.frames[Phaser.Math.Between(0, d.frames - 1)]);
      if (d.bob) this.tweens.add({ targets: s, y: d.y + d.bob, duration: d.bobMs / 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Phaser.Math.Between(0, 600) });
      // a little sway in every direction (sideways, tilt) on top of the up-down bob; each runs at its own pace so the path never repeats exactly. swayX = px, swayDeg = degrees, swayMs = full swing time.
      if (d.swayX) this.tweens.add({ targets: s, x: d.x + d.swayX, duration: d.swayMs / 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Phaser.Math.Between(0, 600) });
      if (d.swayDeg) { s.setAngle(-d.swayDeg); this.tweens.add({ targets: s, angle: d.swayDeg, duration: d.swayMs * 0.7, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
    }
  }
}

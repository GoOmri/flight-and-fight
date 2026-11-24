import { CONFIG as C, hex } from '../config.js';
import { makeAllTextures, makeGoalIcons, loadGoalArt } from '../sprites.js';
import { FONT, fpx, drawPlate } from '../hud.js';
import { goalsOf, loadMedals, loadBest, totalStars, isCleared } from '../medals.js';
import { latestVersion, refreshFiles } from '../update.js';
import { toggleTune, tuneEnabled } from '../tune.js';

const W = C.game.width, H = C.game.height, R = C.game.render;
const M = C.menu;
const DEBUG_PARAMS = ['wave', 'god', 'bg', 'ctl']; // any of these in the web address: skip the menu (old behaviour)
const P = M.pal;
const CTL_KEY = 'ff_controls'; // saved choice of the settings panel: 'drag' or 'stick'
const FX_KEY = 'ff_fx'; // 'low' = reduced effects

// Start menu: a path of stage bubbles going up the screen (Forest at the bottom, then Swamp, then Stage 3, still locked), the logo and UPDATE at the bottom,
// a gear in the top right corner that opens the settings. Press = brighter, release on the same bubble = start that stage.
export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  // The menu is the first scene, so it loads its own Halloween pictures (assets/menu, see CREDITS.md).
  preload() {
    const sky = M.sky;
    this.load.spritesheet('menu_sky', 'assets/' + sky.file, { frameWidth: sky.frameW, frameHeight: sky.frameH });
    for (const d of M.decor) this.load.spritesheet('menu_' + d.key, 'assets/' + d.file, { frameWidth: d.frameW, frameHeight: d.frameH });
    this.load.image('menu_logo', 'assets/' + M.logo.file); // only the letters: they rise and float
    for (const k of ['fight', 'amp', 'flight']) this.load.image('menu_logo_' + k, 'assets/menu/logo-' + k + '.png'); // the three parts of the letters: "Fight", "&", "Flight" (together they are menu_logo)
    for (const nd of M.path.nodes) if (!nd.locked) this.load.image('stage_' + nd.theme, 'assets/ui/stage-' + nd.theme + '.png?v=' + C.version); // a small picture of each open stage (shown dimmed inside its tile)
    loadGoalArt(this, C.version); // the gold star and the goal icons (made into textures in sprites.js; the game uses the same ones)
    if (M.logo.decor) this.load.image('menu_logo_decor', 'assets/' + M.logo.decor); // the moon, stars and bats of the logo picture: they stay in the background
    for (const k of ['panel-parchment', 'med-panel', 'med-button', 'gear']) this.load.image('ui_' + k, 'assets/ui/ui-' + k + '.png?v=' + C.version); // ?v= = the phone must load the newest picture after an update (it kept an old copy of a picture with the same file name) // UI pictures: parchment panel and gear (Fantasy UI pack, catau-games), tan panel and button (Medieval UI pack, Doktoresco)
  }

  create() {
    const q = new URLSearchParams(window.location.search);
    if (DEBUG_PARAMS.some(k => q.has(k))) { this.scene.start('Play'); return; }
    try { const s = localStorage.getItem(CTL_KEY); if (s === 'drag' || s === 'stick') C.ship.controls = s; } catch (e) { /* no saved choice */ }
    this.fxLow = false; try { this.fxLow = localStorage.getItem(FX_KEY) === 'low'; } catch (e) { /* full effects */ } // settings: EFFECTS LOW keeps the menu calm (no sparks, bubbles, fireflies, shooting stars, tilt)
    makeAllTextures(this); // star pictures (made once, skipped when they exist)
    makeGoalIcons(this);   // goal pictures (the lightbox shows them)
    this.cameras.main.setZoom(R).centerOn(W / 2, H / 2).setBackgroundColor(M.bgColor);
    this.addArt();
    this.makeBits(); this.startEffects(); this.setupTilt(); // little pictures for the sparks, then cauldron bubbles, witch trail, fireflies, shooting stars, and the tilt parallax
    const txt = (x, y, s, size, stroke, align = 0.5, color = P.cream) => this.add.text(x, y, s, { ...FONT, fontSize: fpx(size) + 'px', color: hex(color), stroke: hex(P.shadow), strokeThickness: stroke }).setOrigin(align, 0.5);
    this.txt = txt;
    if (this.textures.exists('menu_logo')) this.makeLogo(); // pixel logo: "Fight & Flight", tilted up in perspective: drops in, floats, and a glint sweeps over it now and then
    else txt(W / 2, M.titleY, 'Flight and Fight', M.titleSize, M.titleStroke);
    const verTxt = txt(W / 2, H - M.versionBottom, 'v' + C.version, M.versionSize, 2).setAlpha(M.versionAlpha);
    let verTaps = 0, verAt = 0; // 5 quick taps on the version text turn the tuning panel on or off (see tune.js)

    // ---- the path: a line up the middle, bubbles left and right of it. Stage 1 is at the bottom; with more stages than fit, drag up / down to scroll (applyScroll).
    const PA = M.path, bw = PA.bubbleW, bh = PA.bubbleH, stars = totalStars();
    const nodes = PA.nodes.map((nd, i) => ({ ...nd, locked: !!nd.locked || stars < (nd.need || 0), named: i === 0 || isCleared(PA.nodes[i - 1].theme) })); // a stage shows its name once the stage before it was finished (before that: ???) // a stage opens when the stars of all stages together reach its need
    const lastOpen = nodes.reduce((m, nd, i) => (nd.locked ? m : i), 0), farthest = Math.min(nodes.length - 1, lastOpen + PA.lookAhead); // a player can look PA.lookAhead stages beyond the highest open one, no further
    this.scrollMax = Math.max(0, PA.topStop - (PA.bottomCy - farthest * PA.step)); // how far the path can be pulled down (0 = everything fits, no scrolling)
    this.scroll = 0; this.scrollV = 0; this.drag = null;
    const glow = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD).setDepth(-1); // a soft gold glow along the line, breathing slowly (depth -1: behind the logo and the bubbles, above the sky)
    this.tweens.add({ targets: glow, alpha: 0.55, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const line = this.add.graphics().setDepth(-1);
    this.pathGfx = { glow, line };
    this.bubbles = nodes.map((nd, i) => {
      const cy = PA.bottomCy - i * PA.step, left = nd.side === 'L', x = left ? PA.x - PA.gap - bw : PA.x + PA.gap, y = cy - bh / 2;
      const b = this.makeBubble(nd, x, y, bw, bh, txt);
      b.baseY = y; b.cy = cy; b.left = left; b.alpha = 1;
      return b;
    });
    this.applyScroll(); // draws the line, places and fades the bubbles
    // a little spark runs up the line now and then
    if (!this.textures.exists('menu_spark')) { const cv = this.textures.createCanvas('menu_spark', 5, 5), cx = cv.getContext(); cx.fillStyle = '#ffffff'; cx.fillRect(2, 0, 1, 5); cx.fillRect(0, 2, 5, 1); cv.refresh(); }
    const spark = this.add.image(PA.x, PA.lineBottom, 'menu_spark').setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(-1);
    this.tweens.add({ targets: spark, y: PA.lineTop + 6, duration: 2600, repeat: -1, repeatDelay: 1800, delay: 1500, ease: 'Sine.easeInOut', onUpdate: tw => spark.setAlpha(Math.sin(Math.PI * tw.progress)) });
    // the next stage to play (the lowest open stage that does not have all medals yet) pulses with a gold edge
    const next = this.bubbles.find(b => !b.locked && !b.complete);
    if (next && next.halo) { next.halo.setVisible(true); this.tweens.add({ targets: next.halo, alpha: 0.25, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
    // the bubbles slide in from their sides, the lowest one first
    if (M.intro.bubbles) this.bubbles.forEach((b, i) => {
      b.cont.x = b.left ? -140 : 140;
      this.tweens.add({ targets: b.cont, x: 0, duration: 650, delay: 200 + i * 140, ease: 'Back.easeOut' });
    });

    // ---- UPDATE button: gets fresh copies of all game files and reloads (also fixes an old saved copy in the browser or the installed app).
    // When the menu opens it asks the server for the newest version number; if it is newer the button turns orange.
    const art = this.textures.exists('ui_med-button'), UB = M.updateBtn; // the tan button of the Medieval UI pack (9-slice: the round ends stay, the middle stretches); without the picture the old drawn plate is used
    const ubw = art ? UB.w : M.updateW, ubh = art ? 25 : M.updateH, bx = (W - ubw) / 2, by = M.updateTop;
    const btn = { btn: true, x: bx - 8, y: by - 4, w: ubw + 16, h: ubh + 8, g: this.add.graphics(), down: false, hot: false, busy: false }; // x / y / w / h = the touch area, bigger than the picture (a thumb needs about 44 phone px)
    btn.img = art ? this.add.nineslice(bx, by, 'ui_med-button', undefined, ubw, 25, 10, 10, 0, 0).setOrigin(0, 0) : null;
    btn.label = this.add.text(W / 2, by + ubh / 2, 'UPDATE', { ...FONT, fontSize: fpx(M.updateSize) + 'px', color: hex(P.cream), stroke: hex(P.shadow), strokeThickness: 3 }).setOrigin(0.5);
    btn.draw = () => {
      btn.g.clear();
      if (art) { // normal, pressed, or hover (a newer version is waiting); dark brown text
        btn.img.setTint(btn.down ? 0xbbbbbb : 0xffffff).setY(by + (btn.down ? 1 : 0)); // pressed: darker and 1 px lower
        btn.label.setColor(btn.hot ? hex(M.updateHotColor) : hex(UB.textColor)).setStroke(hex(P.shadow), 3); // a newer version waiting: orange text
        btn.label.setY(by + ubh / 2 + (btn.down ? 1 : 0));
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
    this.settingsButtons = this.panelButtons;

    // Input: remember which button was pressed; release on the same button uses it. Handlers are removed on shutdown.
    const hit = p => (this.modal ? this.panelButtons : this.buttons).find(c => { const px = p.x / R, py = p.y / R; return px >= c.x && px <= c.x + c.w && py >= c.y && py <= c.y + c.h && (c.st === undefined || (c.alpha > 0.35 && py < PA.viewBottom)); }); // a stage bubble can only be hit while it is visible enough and above the fade
    this.pressed = null;
    const setPressed = c => { if (this.pressed) { this.pressed.down = false; this.pressed.draw(); } this.pressed = c; if (c) { c.down = true; c.draw(); } };
    const onDown = p => {
      if (!this.modal && Math.abs(p.x / R - W / 2) < 40 && Math.abs(p.y / R - (H - M.versionBottom)) < 12) {
        verTaps = this.time.now - verAt < 800 ? verTaps + 1 : 1; verAt = this.time.now;
        if (verTaps >= 5) { verTaps = 0; verTxt.setText(toggleTune() ? 'TUNE ON' : 'TUNE OFF'); this.time.delayedCall(1500, () => verTxt.active && verTxt.setText('v' + C.version)); }
      }
      if (!this.modal) this.sparks(p.x / R, p.y / R); // a small burst of sparks wherever the player touches
      setPressed(hit(p) || null);
      this.scrollV = 0;
      if (!this.modal && this.scrollMax > 0 && p.y / R < PA.viewBottom) this.drag = { y0: p.y / R, s0: this.scroll, moved: false, last: p.y / R, lastT: this.time.now }; // maybe the start of a scroll
    };
    const onMove = p => {
      const d = this.drag;
      if (d) {
        const py = p.y / R, dy = py - d.y0;
        if (!d.moved && Math.abs(dy) > 6) { d.moved = true; setPressed(null); } // dragged: it is a scroll, not a tap
        if (d.moved) {
          const raw = d.s0 + dy, over = M.path.overMax; // past either end the path follows the finger only a third as far (a rubber band), and springs back on release
          this.scroll = raw < 0 ? Math.max(-over, raw * 0.35) : (raw > this.scrollMax ? Math.min(this.scrollMax + over, this.scrollMax + (raw - this.scrollMax) * 0.35) : raw);
          const now = this.time.now, dt = (now - d.lastT) / 1000;
          if (dt > 0) this.scrollV = 0.6 * this.scrollV + 0.4 * ((py - d.last) / dt);
          d.last = py; d.lastT = now;
          this.applyScroll();
          return;
        }
      }
      if (this.pressed && hit(p) !== this.pressed) setPressed(null); // finger slid off: cancel
    };
    const onWheel = (p, over, dx, dy) => { if (!this.modal && this.scrollMax > 0) { this.scroll = Phaser.Math.Clamp(this.scroll - dy * 0.4, 0, this.scrollMax); this.applyScroll(); } }; // mouse wheel on a computer
    const onUp = p => {
      const d = this.drag; this.drag = null;
      if (d && d.moved) { if (this.time.now - d.lastT > 90) this.scrollV = 0; setPressed(null); return; } // the finger lifts: the path keeps gliding a little (update)
      const c = this.pressed, same = c && hit(p) === c;
      setPressed(null);
      if (!same) return;
      if (c.btn && !this.modal) this.bounce(c); // a little pop on UPDATE and the gear
      if (c.action) c.action(); else if (c.st) this.openGoals(c.st.theme); // a stage tile opens the goals box, PLAY starts the stage
    };
    this.input.on('pointerdown', onDown);
    this.input.on('pointermove', onMove);
    this.input.on('pointerup', onUp);
    this.input.on('wheel', onWheel);
    this.input.on('pointerupoutside', () => { this.drag = null; setPressed(null); });
    this.events.once('shutdown', () => {
      this.input.off('pointerdown', onDown); this.input.off('pointermove', onMove);
      this.input.off('pointerup', onUp); this.input.off('pointerupoutside'); this.input.off('wheel', onWheel);
      this.pressed = null;
    });
  }

  // Places everything that scrolls: the line (drawn in thin slices so each has its own opacity), the little arms and the bubbles. Anything near the top or the bottom (the witch's hat) fades out.
  applyScroll() {
    const PA = M.path, S = this.scroll, g = this.pathGfx.line, gl = this.pathGfx.glow, bh = PA.bubbleH;
    const bottomAt = y => (y < PA.fadeStart ? 1 : Math.max(0, 1 - (y - PA.fadeStart) / (PA.lineBottom - PA.fadeStart))); // 1 = full, 0 = gone
    const topAt = (y, len) => Math.min(1, Math.max(0, y / len));
    g.clear(); gl.clear();
    for (let y = 0; y < PA.lineBottom; y += 2) { // the line has no top end (it runs off the screen); at the bottom it dissolves in a smooth gradient (fadeStart to lineBottom) just above the logo
      const k = bottomAt(y + 1);
      if (k <= 0.01) continue;
      g.fillStyle(PA.lineColor, k).fillRect(PA.x - PA.lineW / 2, y, PA.lineW, 2);
      gl.fillStyle(PA.lineColor, 0.14 * k).fillRect(PA.x - PA.lineW / 2 - 3, y, PA.lineW + 6, 2); // glow: 1 px less on each side than before
      gl.fillStyle(PA.lineColor, 0.22 * k).fillRect(PA.x - PA.lineW / 2 - 1, y, PA.lineW + 2, 2);
    }
    for (const b of this.bubbles) {
      const cy = b.cy + S, a = bottomAt(cy) * topAt(cy, PA.fadeTopBubble);
      b.cont.y = S; b.cont.setAlpha(a); b.cont.setVisible(a > 0.01);
      b.y = b.baseY + S; b.alpha = a;
      if (a > 0.01) g.fillStyle(PA.lineColor, a).fillRect(b.left ? b.x + b.w : PA.x, cy - PA.lineW / 2, PA.gap, PA.lineW); // little arm from the line to the bubble
    }
  }

  // Every frame (no finger down): the path keeps gliding after a drag and slows down; past an end it is pulled back to the end (the bounce).
  update(time, delta) {
    this.tiltStep(delta);
    if (!this.scrollMax || this.drag) return;
    const hi = this.scrollMax, out = this.scroll < 0 || this.scroll > hi;
    if (!out && Math.abs(this.scrollV) < 2) return;
    const dt = Math.min(delta, 50) / 1000;
    this.scroll += this.scrollV * dt;
    if (this.scroll < 0 || this.scroll > hi) {
      const target = Phaser.Math.Clamp(this.scroll, 0, hi);
      this.scrollV *= Math.exp(-14 * dt);
      this.scroll += (target - this.scroll) * (1 - Math.exp(-10 * dt));
      if (Math.abs(this.scroll - target) < 0.2) { this.scroll = target; this.scrollV = 0; }
    } else this.scrollV *= Math.exp(-M.path.friction * dt);
    this.applyScroll();
  }

  // One stage bubble: a plate with a colour tab, the name, the earned medals and the best score. A locked stage is faded and says SOON.
  makeBubble(nd, x, y, w, h, txt) {
    const key = 'ui_med-panel', art = this.textures.exists(key); // the tan panel of the Medieval UI pack, 9-slice (6 px border); a locked stage is the same panel, darker; without the picture the old drawn plate
    const g = this.add.graphics();
    const b = { st: { theme: nd.theme }, locked: !!nd.locked, x, y, w, h, g, down: false, items: [] };
    const img = art ? this.add.nineslice(x, y, key, undefined, w, h, 6, 6, 6, 6).setOrigin(0, 0) : null;
    const pic = art && !b.locked && this.textures.exists('stage_' + nd.theme) ? this.add.image(x + 6, y + 6, 'stage_' + nd.theme).setOrigin(0, 0).setAlpha(M.bubble.picAlpha).setTint(M.bubble.picTint) : null; // the stage picture fills the inside of the tile, dimmed so the text stays readable
    const add = (o, oy) => { b.items.push({ o, oy }); return o; }; // texts and medals sink with the plate when pressed
    const B = M.bubble, cx = x + w / 2, ink = art ? B.ink : P.cream, shadow = 3;
    b.draw = () => {
      g.clear();
      const sink = art ? (b.down ? 1 : 0) : drawPlate(g, x, y, w, h, { fill: b.locked ? M.lockedFill : P.purple, border: b.locked ? M.lockedBorder : P.pink, down: b.down, radius: M.cardRadius });
      if (art) {
        img.setTint(b.down ? 0xcccccc : (b.locked ? B.lockedTint : 0xffffff)); img.y = y + sink;
        if (pic) pic.y = y + 6 + sink;
        if (!b.locked) g.fillStyle(B.inset, 1).fillRoundedRect(x + 8, y + 24 + sink, w - 16, 22, 3); // a dark strip behind the medals so the grey ones can be seen on the tan
      }
      b.items.forEach(i => i.o.setY(i.oy + sink));
    };
    if (b.locked) {
      add(txt(cx, y + 24, nd.named ? nd.name : '???', B.nameSize, shadow, 0.5, art ? B.lockedInk : M.lockedText), y + 24);
      if (nd.need) { // the stars still needed: a small star and a number, no words
        const star = add(this.add.image(cx - 12, y + 45, 'star_earned').setScale(0.7).setTint(0x9a9a9a), y + 45);
        add(txt(cx + 10, y + 45, String(nd.need), B.nameSize + 2, shadow, 0.5, art ? B.lockedInk : M.lockedText), y + 45);
      }
    } else {
      add(txt(cx, y + 14, nd.name, B.nameSize, shadow, 0.5, ink), y + 14);
      const medals = loadMedals(nd.theme), best = loadBest(nd.theme), keys = goalsOf(nd.theme), n = keys.length;
      keys.forEach((k, j) => {
        const im = add(this.add.image(0, y + 35, 'star_' + (medals[k] ? 'earned' : 'off')).setScale(B.medalScale), y + 35);
        im.x = cx + (j - (n - 1) / 2) * (im.displayWidth + B.medalGap);
      });
      if (best > 0) add(txt(cx, y + h - 13, 'BEST ' + best, B.bestSize, shadow, 0.5, art ? B.bestInk : P.cyan), y + h - 13);
    }
    b.complete = !b.locked && goalsOf(nd.theme).every(k => loadMedals(nd.theme)[k]);
    b.halo = art && !b.locked ? this.add.graphics().setVisible(false) : null; // gold edge, shown only on the next stage to play
    if (b.halo) b.halo.lineStyle(3, M.path.lineColor, 1).strokeRoundedRect(x - 2, y - 2, w + 4, h + 4, 5);
    b.cont = this.add.container(0, 0, [img, pic, b.halo, g, ...b.items.map(i => i.o)].filter(Boolean)); // order: panel, stage picture, halo, strip, texts and medals
    b.draw();
    return b;
  }

  // The logo: drops in with a bounce, then floats up and down; every few seconds a bright band sweeps over its letters (pre-drawn frames made from the logo itself, so it works in WebGL and CANVAS).
  makeLogo() {
    const L = M.logo, SH = M.logoShine, src = this.textures.get('menu_logo').getSourceImage();
    if (this.textures.exists('menu_logo_decor')) { // the moon, stars, dots and bats of the logo picture: not part of the letters, they pop up one after the other in a circle (clockwise from the moon), then stay in the background
      const tex = this.textures.get('menu_logo_decor');
      (L.decorParts || []).forEach((r, i) => {
        const key = 'decor' + i; if (!tex.has(key)) tex.add(key, 0, r[0], r[1], r[2], r[3]);
        const at = L.decorAt && L.decorAt[i]; // a decoration can be moved to its own spot (screen x, y of its centre), e.g. the moon
        const im = this.add.image(at ? at[0] : L.x + (r[0] + r[2] / 2 - src.width / 2) * L.scale, at ? at[1] : L.y + (r[1] + r[3] / 2) * L.scale, 'menu_logo_decor', key).setScale(0);
        const sc = (L.decorScale && L.decorScale[i]) || L.scale; // a piece can have its own size too (the moon)
        if (L.decorPop) this.tweens.add({ targets: im, scale: sc, duration: 420, delay: L.decorDelay + i * L.decorStepMs, ease: 'Back.easeOut' }); else im.setScale(sc); // off: the moon and stars are simply there
      });
      if (!L.decorParts) this.add.image(L.x, L.y, 'menu_logo_decor').setOrigin(0.5, 0).setScale(L.scale);
    }
    const parts = ['fight', 'amp', 'flight'].map(k => 'menu_logo_' + k).filter(k => this.textures.exists(k)); // the words fly in one after the other; without the parts the whole logo rises at once
    const words = (parts.length === 3 ? parts : ['menu_logo']).map(k => this.add.image(L.x, H + 10, k).setOrigin(0.5, 0).setScale(L.scale));
    const keys = [];
    if (SH.on) try {
      const w = src.width, h = src.height, base = document.createElement('canvas'); base.width = w; base.height = h;
      const bx = base.getContext('2d'); bx.drawImage(src, 0, 0);
      const px = bx.getImageData(0, 0, w, h).data, span = w + h * 0.5 + SH.band * 2;
      for (let f = 0; f < SH.frames; f++) {
        const key = 'logo_shine_' + f; keys.push(key);
        if (this.textures.exists(key)) continue;
        const cv = this.textures.createCanvas(key, w, h), ctx = cv.getContext(), out = ctx.createImageData(w, h), c = -SH.band + span * f / (SH.frames - 1);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4, a = px[i + 3], t = Math.abs(x + y * 0.5 - c) / (SH.band / 2);
          if (a < 20 || t >= 1) continue; // only logo pixels inside the band
          const k = (1 - t) * SH.strength;
          out.data[i] = px[i] + (255 - px[i]) * k; out.data[i + 1] = px[i + 1] + (255 - px[i + 1]) * k; out.data[i + 2] = px[i + 2] + (255 - px[i + 2]) * k; out.data[i + 3] = a;
        }
        ctx.putImageData(out, 0, 0); cv.refresh();
      }
    } catch (e) { keys.length = 0; } // no shine if the picture cannot be read
    const shine = keys.length ? this.add.image(L.x, H + 10, keys[0]).setOrigin(0.5, 0).setScale(L.scale).setVisible(false) : null;
    const all = shine ? [...words, shine] : words; // everything that floats together
    words.forEach((im, i) => this.tweens.add({ targets: im, y: L.y, duration: L.riseMs, delay: 150 + i * L.wordStepMs, ease: 'Back.easeOut', easeParams: [L.overshoot], // each word rises from below the screen and settles with a little overshoot
      onComplete: () => { if (i === words.length - 1) this.tweens.add({ targets: all, y: L.y + SH.float, duration: SH.floatMs / 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); } }));
    if (shine) shine.y = L.y; // (the glint picture sits at the final spot, hidden until the first sweep)
    if (shine) this.time.addEvent({ delay: SH.everyMs, startAt: SH.everyMs - SH.firstMs, loop: true, callback: () => {
      let k = 0; shine.setVisible(true).setTexture(keys[0]);
      this.time.addEvent({ delay: SH.frameMs, repeat: keys.length - 1, callback: () => { shine.setTexture(keys[Math.min(k++, keys.length - 1)]); } });
      this.time.delayedCall(SH.frameMs * (keys.length + 1), () => shine.setVisible(false));
    } });
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
    const art = this.textures.exists('ui_panel-parchment'), T = (x, y, s, size, align = 0.5, color = ink, stroke = 0) => keep(this.add.text(x, y, s, { ...FONT, fontSize: fpx(size) + 'px', color: hex(color), stroke: hex(P.shadow), strokeThickness: stroke }).setOrigin(align, 0.5));
    // a dark veil over the menu, then the parchment (9-slice: the 24 px ragged border stays, the middle stretches); without the picture a drawn dark plate
    const veil = keep(this.add.graphics()); veil.fillStyle(0x000000, 0.55).fillRect(0, 0, W, H); veil.setDepth(S.depth - 1);
    if (art) keep(this.add.nineslice(S.x, S.y, 'ui_panel-parchment', undefined, S.w, S.h, 24, 24, 24, 24).setOrigin(0, 0));
    else { const back = keep(this.add.graphics()); back.fillStyle(P.dark, 0.96).fillRoundedRect(S.x, S.y, S.w, S.h, M.plateRadius); back.lineStyle(M.plateBorderW, P.pink, 1).strokeRoundedRect(S.x, S.y, S.w, S.h, M.plateRadius); }
    T(S.x + S.w / 2, S.y + 36, 'SETTINGS', S.titleSize, 0.5, art ? ink : P.cream);
    this.panelButtons = [];
    const mkBtn = (x, y, w, label, action) => { // a copper button: 9-slice picture (normal / pressed) with dark text
      const h = 25, bt = { btn: true, x: x - 4, y: y - 3, w: w + 8, h: h + 6, down: false, action, shown: false }; // the touch area is a little bigger than the picture
      bt.img = art ? keep(this.add.nineslice(x, y, 'ui_med-button', undefined, w, h, 10, 10, 0, 0).setOrigin(0, 0)) : null;
      bt.g = keep(this.add.graphics());
      bt.label = T(x + w / 2, y + h / 2, label, S.btnSize, 0.5, P.cream, 3);
      bt.draw = () => {
        bt.g.clear();
        if (art) { bt.img.setTint(bt.down ? 0xbbbbbb : 0xffffff).setY(y + (bt.down ? 1 : 0)); bt.label.setY(y + h / 2 + (bt.down ? 1 : 0)); return; }
        if (!bt.shown) return;
        const sink = drawPlate(bt.g, x, y, w, h, { fill: P.purple, border: P.pink, down: bt.down, radius: 6 });
        bt.label.setY(y + (h - M.plateDrop) / 2 + sink + 1);
      };
      this.panelButtons.push(bt);
      return bt;
    };
    const left = S.x + 30, right = S.x + S.w - 30, bwid = S.btnW, lc = art ? ink : P.cream, hc = art ? S.hintInk : P.cyan;
    // CONTROLS
    T(left, S.y + 67, 'CONTROLS', S.btnSize, 0, lc);
    const ctl = mkBtn(right - bwid, S.y + 55, bwid, C.ship.controls === 'stick' ? 'STICK' : 'DRAG', () => {
      const v = C.ship.controls === 'stick' ? 'drag' : 'stick';
      C.ship.controls = v;
      try { localStorage.setItem(CTL_KEY, v); } catch (e) { /* not saved */ }
      ctl.label.setText(v === 'stick' ? 'STICK' : 'DRAG'); hint.setText(v === 'stick' ? 'RING STICK UNDER YOUR THUMB' : 'SWIPE ANYWHERE TO MOVE');
    });
    const hint = T(left, S.y + 92, C.ship.controls === 'stick' ? 'RING STICK UNDER YOUR THUMB' : 'SWIPE ANYWHERE TO MOVE', 8, 0, hc);
    // TUNE PANEL
    T(left, S.y + 126, 'TUNE PANEL', S.btnSize, 0, lc);
    const tn = mkBtn(right - bwid, S.y + 114, bwid, tuneEnabled() ? 'ON' : 'OFF', () => { tn.label.setText(toggleTune() ? 'ON' : 'OFF'); });
    // EFFECTS (the menu starts again with the new setting)
    T(left, S.y + 156, 'EFFECTS', S.btnSize, 0, lc);
    mkBtn(right - bwid - 20, S.y + 144, bwid + 20, this.fxLow ? 'LOW' : 'FULL', () => { try { localStorage.setItem(FX_KEY, this.fxLow ? 'full' : 'low'); } catch (e) { /* not saved */ } this.scene.restart(); });
    // SOUND
    T(left, S.y + 186, 'SOUND', S.btnSize, 0, hc);
    T(right - bwid / 2, S.y + 186, 'SOON', S.btnSize, 0.5, hc);
    // CLOSE
    mkBtn(S.x + (S.w - 90) / 2, S.y + S.h - 56, 90, 'CLOSE', () => this.openSettings(false));
    this.panelObjs = objs;
  }

  // The goals box (lightbox): tap a stage, see its goals with the stars you already have, then PLAY (or BACK).
  openGoals(theme) {
    if (this.modal) return;
    const L = C.lightbox, node = M.path.nodes.find(n => n.theme === theme), keys = goalsOf(theme), saved = loadMedals(theme), objs = [];
    const D = L.depth, ink = L.ink, h = 34 + keys.length * L.rowGap + 46, y0 = Math.round((H - 40 - h) / 2), art = this.textures.exists('ui_med-panel');
    const keep = (o, dz = 0) => { o.setDepth(D + dz); objs.push(o); return o; };
    const T = (x, y, s, size, align, color) => keep(this.add.text(x, y, s, { ...FONT, fontSize: fpx(size) + 'px', color: hex(color), stroke: hex(P.shadow), strokeThickness: 0 }).setOrigin(align, 0.5), 2);
    keep(this.add.graphics().fillStyle(0x000000, 0.55).fillRect(0, 0, W, H), -1);
    if (art) keep(this.add.nineslice(L.x, y0, 'ui_med-panel', undefined, L.w, h, 6, 6, 6, 6).setOrigin(0, 0), 0);
    else { const g = keep(this.add.graphics()); g.fillStyle(P.dark, 0.96).fillRoundedRect(L.x, y0, L.w, h, 10); g.lineStyle(3, P.pink, 1).strokeRoundedRect(L.x, y0, L.w, h, 10); }
    const tc = art ? ink : P.cream, names = { cats: 'ALL CATS', allCoins: 'ALL COINS', killAll: 'ALL ENEMIES', noHit: 'NO HIT' };
    T(W / 2, y0 + 18, node ? node.name : '', 12, 0.5, tc);
    keys.forEach((k, i) => {
      const y = y0 + 34 + i * L.rowGap + L.rowGap / 2 - 4, done = saved[k];
      keep(this.add.image(L.x + 26, y, 'goal_' + k + '_' + (done ? 'earned' : 'open')).setScale(L.iconScale), 2);
      T(L.x + 46, y, names[k], L.textSize, 0, tc);
      keep(this.add.image(L.x + L.w - 24, y, done ? 'star_earned' : 'star_off').setScale(1), 2);
    });
    const bw = 80, by = y0 + h - 38, mk = (x, label, action) => { // two buttons: the same picture as the other buttons
      const bt = { btn: true, x: x - 4, y: by - 3, w: bw + 8, h: 31, down: false, action, shown: true };
      bt.img = art2 ? keep(this.add.nineslice(x, by, 'ui_med-button', undefined, bw, 25, 10, 10, 0, 0).setOrigin(0, 0), 1) : null;
      bt.g = keep(this.add.graphics(), 1);
      bt.label = T(x + bw / 2, by + 12, label, 10, 0.5, P.cream); bt.label.setStroke(hex(P.shadow), 3);
      bt.draw = () => { if (bt.img) bt.img.setTint(bt.down ? 0xbbbbbb : 0xffffff).setY(by + (bt.down ? 1 : 0)); bt.label.setY(by + 12 + (bt.down ? 1 : 0)); };
      return bt;
    }, art2 = this.textures.exists('ui_med-button');
    const close = () => { objs.forEach(o => o.destroy()); this.goalsObjs = null; this.modal = false; this.panelButtons = this.settingsButtons; };
    const back = mk(L.x + 14, 'BACK', close), play = mk(L.x + L.w - 14 - bw, 'PLAY', () => { close(); this.scene.start('Play', { theme }); });
    this.goalsObjs = objs; this.modal = true; this.panelButtons = [play, back];
  }

  openSettings(on) {
    this.modal = on;
    this.panelButtons = this.settingsButtons;
    this.panelObjs.forEach(o => o.setVisible(on));
    this.panelButtons.forEach(b => { b.shown = on; b.label.setVisible(on); b.draw(); });
  }

  // Animated sky and the little Halloween friends. They sit around the path and take no input. Animations are made once.
  // Each friend moves through a small position object (pos): the bob / sway tweens change pos, and update() puts pos + the tilt shift on the sprite.
  addArt() {
    const mk = (key, tex, fps, frames) => { if (!this.anims.exists(key)) this.anims.create({ key, frames: this.anims.generateFrameNumbers(tex, { start: 0, end: frames - 1 }), frameRate: fps, repeat: -1 }); };
    const sky = M.sky;
    mk('menu_sky', 'menu_sky', sky.fps, sky.frames);
    this.skySprite = this.add.sprite(W / 2, H / 2, 'menu_sky').setScale(W / sky.frameW * sky.cover).setDepth(-10).play('menu_sky'); // bigger than the screen (sky.cover) so the tilt and the stage scroll can shift it without showing an edge
    this.decorItems = [];
    for (const d of M.decor) {
      mk('menu_' + d.key, 'menu_' + d.key, d.fps, d.frames);
      const s = this.add.sprite(d.x, d.y, 'menu_' + d.key).setOrigin(d.originX, d.originY).setScale(d.scale).setFlipX(!!d.flipX).setDepth(d.depth ?? -5); // depth: higher = in front (the four friends are in front of everything)
      s.play('menu_' + d.key);
      s.anims.setCurrentFrame(s.anims.currentAnim.frames[Phaser.Math.Between(0, d.frames - 1)]);
      const pos = { x: d.x, y: d.y };
      this.decorItems.push({ s, pos, par: d.par || 0, key: d.key });
      const motion = () => { // the little constant motion (bob, sway, tilt, fade); starts after a fly-in
        if (d.bob) this.tweens.add({ targets: pos, y: d.y + d.bob, duration: d.bobMs / 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Phaser.Math.Between(0, 600) });
        // a little sway in every direction (sideways, tilt) on top of the up-down bob; each runs at its own pace so the path never repeats exactly. swayX = px, swayDeg = degrees, swayMs = full swing time.
        if (d.swayX) this.tweens.add({ targets: pos, x: d.x + d.swayX, duration: d.swayMs / 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Phaser.Math.Between(0, 600) });
        if (d.swayDeg) { s.setAngle(-d.swayDeg); this.tweens.add({ targets: s, angle: d.swayDeg, duration: d.swayMs * 0.7, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
        if (d.fade) { s.setAlpha(d.fade[1]); this.tweens.add({ targets: s, alpha: d.fade[0], duration: d.fadeMs / 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Phaser.Math.Between(0, 800) }); } // fades in and out a little (the ghost)
      };
      if (d.introX) { pos.x = d.x + d.introX; this.tweens.add({ targets: pos, x: d.x, duration: 1100, delay: 350, ease: 'Cubic.easeOut', onComplete: motion }); } else motion();
    }
  }

  // ---- little pictures and effects -------------------------------------------------------------------------------------------------
  // One 2x2 white square, tinted and scaled for every spark, bubble, firefly and star (pooled: the same few pictures are used again and again).
  makeBits() {
    if (!this.textures.exists('menu_px')) { const cv = this.textures.createCanvas('menu_px', 2, 2), cx = cv.getContext(); cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, 2, 2); cv.refresh(); }
    this.bitPool = [];
  }

  // One bit flies from (x, y) with speed (vx, vy) px/s for life ms, shrinking from scale s0 to s1 and fading from alpha a0 to 0.
  bit(x, y, o) {
    let im = this.bitPool.find(b => !b.busy);
    if (!im) { im = this.add.image(0, 0, 'menu_px'); im.busy = false; this.bitPool.push(im); }
    im.busy = true;
    im.setVisible(true).setPosition(x, y).setTint(o.tint).setScale(o.s0).setAlpha(o.a0).setDepth(o.depth === undefined ? 51 : o.depth).setBlendMode(o.add ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL);
    this.tweens.add({ targets: im, x: x + o.vx * o.life / 1000, y: y + o.vy * o.life / 1000, alpha: 0, scale: o.s1, duration: o.life, ease: 'Sine.easeOut', onComplete: () => { im.busy = false; im.setVisible(false); } });
  }

  startEffects() {
    if (this.fxLow) return;
    const B = M.bits, rnd = (a, b) => Phaser.Math.Between(a, b), pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const boiler = this.decorItems.find(i => i.key === 'boiler'), witch = this.decorItems.find(i => i.key === 'witch');
    if (boiler) this.time.addEvent({ delay: B.cauldron.every, loop: true, callback: () => { // bubbles rise from the cauldron
      const s = boiler.s;
      this.bit(s.x + rnd(-7, 7), s.y - s.displayHeight + B.cauldron.dy, { tint: pick(B.cauldron.tints), vx: rnd(-6, 6), vy: -rnd(20, 34), life: rnd(1200, 1900), s0: 1.6, s1: 0.5, a0: 0.9, add: true, depth: 51 });
    } });
    if (witch) this.time.addEvent({ delay: B.trail.every, loop: true, callback: () => { // sparks fall behind her broom
      const s = witch.s;
      this.bit(s.x + B.trail.dx + rnd(-4, 4), s.y + B.trail.dy + rnd(-4, 4), { tint: pick(B.trail.tints), vx: -rnd(10, 26), vy: rnd(2, 18), life: rnd(900, 1500), s0: B.trail.size, s1: 0.6, a0: 1, add: B.trail.add, depth: 49 }); // bigger, longer lived and (not additive) clearly visible on the light sky
    } });
    // fireflies: a few dots wander slowly and blink
    const F = B.fireflies;
    for (let i = 0; i < F.count; i++) {
      const f = this.add.image(rnd(F.area[0], F.area[2]), rnd(F.area[1], F.area[3]), 'menu_px').setTint(F.color).setScale(1.5).setDepth(-2).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.1);
      const wander = () => this.tweens.add({ targets: f, x: Phaser.Math.Clamp(f.x + rnd(-34, 34), F.area[0], F.area[2]), y: Phaser.Math.Clamp(f.y + rnd(-34, 34), F.area[1], F.area[3]), duration: rnd(2200, 4200), ease: 'Sine.easeInOut', onComplete: wander });
      wander();
      this.tweens.add({ targets: f, alpha: 0.9, duration: rnd(700, 1500), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rnd(0, 1500) });
    }
    // a shooting star every now and then
    const next = () => this.time.delayedCall(rnd(B.star.everyMs[0], B.star.everyMs[1]), () => { this.shootingStar(); next(); });
    next();
  }

  // A streak across the sky: a bright head flies, and leaves a short trail that fades (behind the path line).
  shootingStar() {
    const S = M.bits.star, x0 = Phaser.Math.Between(S.x[0], S.x[1]), y0 = Phaser.Math.Between(S.y[0], S.y[1]), head = { t: 0 };
    this.tweens.add({ targets: head, t: 1, duration: S.ms, ease: 'Sine.easeIn', onUpdate: () => this.bit(x0 + S.dx * head.t, y0 + S.dy * head.t, { tint: 0xffffff, vx: 0, vy: 0, life: 380, s0: 1.6, s1: 0.2, a0: 1, add: true, depth: -3 }) });
  }

  // A burst of little sparks where the player touches.
  sparks(x, y) {
    if (this.fxLow) return;
    const T = M.bits.tap;
    for (let i = 0; i < T.count; i++) {
      const a = (i / T.count) * Math.PI * 2 + Math.random() * 0.6, dist = Phaser.Math.Between(T.dist[0], T.dist[1]), speed = dist / (T.ms / 1000);
      this.bit(x, y, { tint: T.tints[i % T.tints.length], vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: T.ms, s0: 1.8, s1: 0.4, a0: 1, add: true, depth: 60 });
    }
  }

  // A small pop on a pressed button (UPDATE's text, the gear picture).
  bounce(c) {
    const t = [c.label, c.img && c.img.type !== 'NineSlice' ? c.img : null].filter(Boolean);
    if (t.length) this.tweens.add({ targets: t, scale: 1.18, duration: 90, yoyo: true, ease: 'Sine.easeOut' });
  }

  // ---- tilt parallax: when the phone is tilted the friends and the sky shift a few pixels (near ones more, and the other way)
  setupTilt() {
    const T = M.tilt;
    this.tilt = { x: 0, y: 0 }; this.tiltTarget = { x: 0, y: 0 }; this.tiltRef = null;
    if (!T.on || this.fxLow || typeof window === 'undefined' || !window.addEventListener) return;
    const on = e => {
      if (e.gamma == null || e.beta == null) return;
      if (!this.tiltRef) this.tiltRef = { g: e.gamma, b: e.beta };
      this.tiltRef.g += (e.gamma - this.tiltRef.g) * 0.02; this.tiltRef.b += (e.beta - this.tiltRef.b) * 0.02; // the reference follows slowly: how the phone is held does not matter, only the tilting
      this.tiltTarget.x = Phaser.Math.Clamp((e.gamma - this.tiltRef.g) / T.range, -1, 1);
      this.tiltTarget.y = Phaser.Math.Clamp((e.beta - this.tiltRef.b) / T.range, -1, 1);
    };
    window.addEventListener('deviceorientation', on);
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') this.input.once('pointerdown', () => { try { DeviceOrientationEvent.requestPermission().catch(() => {}); } catch (e) { /* no permission */ } }); // iPhones ask once
    this.events.once('shutdown', () => window.removeEventListener('deviceorientation', on));
  }

  tiltStep(delta) {
    if (!this.tilt || !this.decorItems) return;
    const T = M.tilt, k = 1 - Math.exp(-6 * Math.min(delta, 50) / 1000);
    this.tilt.x += (this.tiltTarget.x - this.tilt.x) * k; this.tilt.y += (this.tiltTarget.y - this.tilt.y) * k;
    for (const it of this.decorItems) it.s.setPosition(it.pos.x - this.tilt.x * it.par, it.pos.y - this.tilt.y * it.par);
    if (this.skySprite) this.skySprite.setPosition(W / 2 + this.tilt.x * T.sky, H / 2 + this.tilt.y * T.sky + this.scroll * M.sky.scrollPar); // the sky follows the stage scroll, slowly: parallax
  }
}

import { buttonKey, addSlice, BTN_INK, BTN_HOT, parchmentKey, tileKey } from '../buttons.js';
import { sfx, music, ringSound, pauseSound, volume, setVolume } from '../sound.js';
import { drawVolBar, volFrom, volHit, VOL_W } from '../volbar.js';
import { CONFIG as C, hex } from '../config.js';
import { makeAllTextures, makeGoalIcons, loadGoalArt, goalScale } from '../sprites.js';
import { FONT, FONT_TITLE, FONT_MONO, titleCase, fpx, drawPlate } from '../hud.js';
import { goalsOf, loadMedals, loadBest, totalStars, isCleared } from '../medals.js';
import { loadBank, loadLevel, nextPrice, buyUpgrade, canBuyAny } from '../bank.js';
import { latestVersion, refreshFiles } from '../update.js';
import { toggleTune } from '../tune.js';
import { CREDITS } from '../credits.js';

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
    for (const k of ['panel-parchment', 'med-panel', 'med-button', 'med-button2', 'gear']) this.load.image('ui_' + k, 'assets/ui/ui-' + k + '.png?v=' + C.version); // ?v= = the phone must load the newest picture after an update (it kept an old copy of a picture with the same file name) // UI pictures: parchment panel and gear (Fantasy UI pack, catau-games), tan panel and button (Medieval UI pack, Doktoresco)
    this.load.image('ui_flat1', 'assets/ui/regular-scroll-button.png?v=' + C.version); this.load.image('ui_flat2', 'assets/ui/regular-scroll-button-02.png?v=' + C.version); // the flat parchment buttons of the settings
  }

  create() {
    const q = new URLSearchParams(window.location.search);
    if (DEBUG_PARAMS.some(k => q.has(k))) { this.scene.start('Play'); return; }
    try { const s = localStorage.getItem(CTL_KEY); if (s === 'drag' || s === 'stick') C.ship.controls = s; } catch (e) { /* no saved choice */ }
    ringSound(null); pauseSound(false); music('menu');
    this.fxLow = false; try { this.fxLow = localStorage.getItem(FX_KEY) === 'low'; } catch (e) { /* full effects */ } // settings: EFFECTS LOW keeps the menu calm (no sparks, bubbles, fireflies, shooting stars, tilt)
    makeAllTextures(this); // star pictures (made once, skipped when they exist)
    makeGoalIcons(this);   // goal pictures (the lightbox shows them)
    this.cameras.main.setZoom(R).centerOn(W / 2, H / 2).setBackgroundColor(M.bgColor);
    this.addArt();
    this.makeShopSign();
    this.makeBits(); this.startEffects(); this.setupTilt(); // little pictures for the sparks, then cauldron bubbles, witch trail, fireflies, shooting stars, and the tilt parallax
    const txt = (x, y, s, size, stroke, align = 0.5, color = P.cream) => this.add.text(x, y, s, { ...FONT, fontSize: fpx(size) + 'px', color: hex(color), stroke: hex(P.shadow), strokeThickness: 0}).setOrigin(align, 0.5);
    this.txt = txt;
    if (this.textures.exists('menu_logo')) this.makeLogo(); // pixel logo: "Fight & Flight", tilted up in perspective: drops in, floats, and a glint sweeps over it now and then
    else txt(W / 2, M.titleY, 'Flight and Fight', M.titleSize, M.titleStroke);
    const verTxt = txt(W / 2, H - M.versionBottom, 'v' + C.version, M.versionSize, 2).setFontSize(C.smallPx).setAlpha(M.versionAlpha);
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

    // ---- saved coins, top left (drawn over the path, so a bubble scrolled under it does not hide it)
    const bankBack = this.add.graphics(), bankCoin = this.textures.exists('sp_coin') ? this.add.image(M.bankX + 4, M.bankY, 'sp_coin', 0).setScale(0.6) : null; // a coin picture instead of the word
    const bankX = M.bankX + (bankCoin ? 11 : 0), bankTxt = txt(bankX, M.bankY + 1, '', M.bankSize, 2, 0, P.cream).setFontSize(C.smallPx);
    this.showBank = () => { // drawn again after a purchase
      this.shopGlow.setVisible(canBuyAny()); // the cauldron glows only while something can be bought
      bankTxt.setText(String(loadBank()));
      bankBack.clear().fillStyle(P.dark, 0.8).fillRoundedRect(M.bankX - 3, M.bankY - 7, bankX - M.bankX + bankTxt.width + 6, 14, 4);
    };
    this.showBank();

    // ---- gear (top right): opens the settings panel
    const GE = M.gear, gear = { btn: true, x: GE.x - GE.hit / 2, y: GE.y - GE.hit / 2, w: GE.hit, h: GE.hit, down: false };
    gear.img = this.textures.exists('ui_gear') ? this.add.image(GE.x, GE.y, 'ui_gear').setScale(GE.scale) : null; // the medallion; without the picture a code-drawn cog
    if (!gear.img) { gear.g = this.add.graphics(); this.drawGear(gear.g, GE); }
    gear.draw = () => (gear.img || gear.g).setAlpha(gear.down ? 0.65 : 1);
    gear.action = () => this.openSettings(true);
    // a small red pixel mark with a white "!" on the cog while a newer version is waiting (see makeUpdate)
    const bang = this.add.graphics();
    const px = (color, rows) => rows.forEach(([x, y, w, h]) => bang.fillStyle(color, 1).fillRect(x, y, w, h));
    px(P.shadow, [[-3, -5, 6, 10], [-5, -3, 10, 6], [-4, -4, 8, 8]]); // dark rim
    px(0xd8402a, [[-3, -4, 6, 8], [-4, -3, 8, 6]]);                    // red
    px(0xffffff, [[-1, -3, 2, 4], [-1, 2, 2, 2]]);                     // !
    this.gearBadge = this.add.container(GE.x + 9, GE.y - 9, [bang]).setVisible(false);

    // ---- the cauldron (bottom left) and its SHOP word open the shop
    const boiler = this.decorItems.find(i => i.key === 'boiler'), shop = { ...C.shop.button, down: false };
    shop.draw = () => { boiler.s.setTint(shop.down ? 0xbbbbbb : 0xffffff); this.shopSign.setAlpha(shop.down ? 0.65 : 1); }; // alpha: text tint does not work in canvas mode
    shop.action = () => this.openShop();

    this.modal = false; this.boxObjs = null; // boxObjs: set while the goals box or the shop is open
    this.buyAt = -Infinity; // time of the last purchase
    this.buttons = [...this.bubbles.filter(b => !b.locked), gear, shop];
    this.makeSettings();
    this.settingsButtons = this.panelButtons;
    if (this.scene.settings.data && this.scene.settings.data.settings) { this.scene.settings.data = {}; this.openSettings(true, false); } // reopened after EFFECTS changed: no pop

    // Input: remember which button was pressed; release on the same button uses it. Handlers are removed on shutdown.
    const hit = p => (this.modal ? this.panelButtons : this.buttons).find(c => { const px = p.x / R, py = p.y / R; return px >= c.x && px <= c.x + c.w && py >= c.y && py <= c.y + c.h && (c.st === undefined || (c.alpha > 0.35 && py < PA.viewBottom)); }); // a stage bubble can only be hit while it is visible enough and above the fade
    this.pressed = null;
    const setPressed = c => { if (this.pressed) { this.pressed.down = false; this.pressed.draw(); } this.pressed = c; if (c) { c.down = true; c.draw(); } };
    let held = null; // the volume slider under the finger
    const volTouch = p => {
      if (!held) return;
      const v = volFrom(p.x / R, held.x);
      if (setVolume(held.key, v)) { drawVolBar(held.g, held.x, held.y, v); if (held.key === 'sound') sfx('coin'); }
    };
    const onDown = p => {
      held = this.modal && !this.boxObjs ? this.volBars.find(b => volHit(p.x / R, p.y / R, b.x, b.y)) || null : null;
      volTouch(p);
      const sc = this.scroller, py0 = p.y / R;
      if (sc && py0 > sc.top && py0 < sc.bottom && p.x / R > sc.x0 && p.x / R < sc.x1) { sc.held = true; sc.v = 0; sc.last = py0; sc.lastT = this.time.now; } // the credits list is picked up
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
      if (p.isDown) volTouch(p);
      const sc = this.scroller;
      if (sc && sc.held && p.isDown) {
        const py = p.y / R, dy = sc.last - py, now = this.time.now, dt = (now - sc.lastT) / 1000;
        sc.move(dy); if (dt > 0) sc.v = 0.6 * sc.v + 0.4 * (dy / dt); sc.last = py; sc.lastT = now;
        return;
      }
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
    const onWheel = (p, over, dx, dy) => { if (this.scroller) { this.scroller.move(dy * 0.4); return; } if (!this.modal && this.scrollMax > 0) { this.scroll = Phaser.Math.Clamp(this.scroll - dy * 0.4, 0, this.scrollMax); this.applyScroll(); } }; // mouse wheel on a computer
    const onUp = p => {
      held = null;
      if (this.scroller && this.scroller.held) { this.scroller.held = false; if (this.time.now - this.scroller.lastT > 90) this.scroller.v = 0; }
      const d = this.drag; this.drag = null;
      if (d && d.moved) { if (this.time.now - d.lastT > 90) this.scrollV = 0; setPressed(null); return; } // the finger lifts: the path keeps gliding a little (update)
      const c = this.pressed, same = c && hit(p) === c;
      setPressed(null);
      if (!same) return;
      if (c.btn && !this.modal) this.bounce(c); // a little pop on UPDATE and the gear
      sfx('tap'); if (c.action) c.action(); else if (c.st) this.openGoals(c.st.theme); // a stage tile opens the goals box, PLAY starts the stage
    };
    this.input.on('pointerdown', onDown);
    this.input.on('pointermove', onMove);
    this.input.on('pointerup', onUp);
    this.input.on('wheel', onWheel);
    this.input.on('pointerupoutside', () => { this.drag = null; if (this.scroller) this.scroller.held = false; setPressed(null); });
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
    const art = this.textures.exists('ui_panel-parchment'); // the purple parchment (same as the settings); a locked stage is the same, darker; without the picture the old drawn plate
    const g = this.add.graphics();
    const b = { st: { theme: nd.theme }, locked: !!nd.locked, x, y, w, h, g, down: false, items: [] };
    // an open stage: its picture sits inside the ragged edge (tilePicture)
    const pictured = art && !b.locked && this.textures.exists('stage_' + nd.theme);
    const img = art ? this.add.image(x, y, pictured ? this.tilePicture(nd.theme, w, h) : this.parchment(w, h)).setOrigin(0, 0) : null;
    const add = (o, oy) => { b.items.push({ o, oy }); return o; }; // texts and medals sink with the plate when pressed
    const B = M.bubble, cx = x + w / 2, ink = art ? B.ink : P.cream, shadow = 0; // no outline: the thin font stays thin
    const title = (ty, s, color) => this.add.text(cx, ty, titleCase(s), { ...FONT_TITLE, fontSize: B.titleSize + 'px', color: hex(color) }).setOrigin(0.5); // stage names
    b.draw = () => {
      g.clear();
      const sink = art ? (b.down ? 1 : 0) : drawPlate(g, x, y, w, h, { fill: b.locked ? M.lockedFill : P.purple, border: b.locked ? M.lockedBorder : P.pink, down: b.down, radius: M.cardRadius });
      if (art) {
        img.setTint(b.down ? 0xcccccc : (b.locked ? B.lockedTint : 0xffffff)); img.y = y + sink;
        if (!b.locked) g.fillStyle(B.inset, 1).fillRoundedRect(x + 8, y + 24 + sink, w - 16, 22, 3); // a dark strip behind the medals so the grey ones can be seen on the tan
      }
      b.items.forEach(i => i.o.setY(i.oy + sink));
    };
    if (b.locked) {
      add(nd.named ? title(y + 24, nd.name, art ? B.lockedInk : M.lockedText) : txt(cx, y + 24, '???', B.nameSize, shadow, 0.5, art ? B.lockedInk : M.lockedText), y + 24); // '???' stays in the plain font (unreadable in the ornate one)
      if (nd.need) { // the stars still needed: a small star and a number, no words
        const star = add(this.add.image(cx - 12, y + 45, 'star_earned').setScale(0.7).setTint(0x9a9a9a), y + 45);
        add(txt(cx + 10, y + 45, String(nd.need), B.nameSize + 2, shadow, 0.5, art ? B.lockedInk : M.lockedText), y + 45);
      }
    } else {
      add(title(y + 16, nd.name, B.nameShadow), y + 16); // drop shadow: a dark copy 2 px lower, behind the name
      add(title(y + 14, nd.name, ink), y + 14);
      const medals = loadMedals(nd.theme), best = loadBest(nd.theme), keys = goalsOf(nd.theme), n = keys.length;
      keys.forEach((k, j) => {
        const im = add(this.add.image(0, y + 35, 'star_' + (medals[k] ? 'earned' : 'off')).setScale(B.medalScale), y + 35);
        im.x = cx + (j - (n - 1) / 2) * (im.displayWidth + B.medalGap);
      });
      if (best > 0) add(txt(cx, y + h - 13, 'Best ' + best, 10, shadow, 0.5, art ? B.bestInk : P.cyan).setFontSize(16 * B.bestPx / 3), y + h - 13);
    }
    b.complete = !b.locked && goalsOf(nd.theme).every(k => loadMedals(nd.theme)[k]);
    b.halo = art && !b.locked ? this.add.graphics().setVisible(false) : null; // gold edge, shown only on the next stage to play
    if (b.halo) b.halo.lineStyle(3, M.path.lineColor, 1).strokeRoundedRect(x - 2, y - 2, w + 4, h + 4, 5);
    b.cont = this.add.container(0, 0, [img, b.halo, g, ...b.items.map(i => i.o)].filter(Boolean)); // order: panel, stage picture, halo, strip, texts and medals
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

  // A box that has just opened grows from 70% to full size with a small bounce, around (cx, cy). Its objects sit in one container
  // (kept at their normal places), so only the container is scaled; the dark veil behind it just fades in.
  popIn(box, veil, cx, cy) {
    if (this.popTween) this.popTween.remove();
    const set = k => { if (box.active) box.setScale(k).setPosition(cx * (1 - k), cy * (1 - k)); };
    set(0.7); veil.setAlpha(0);
    this.tweens.add({ targets: veil, alpha: 1, duration: 150 });
    this.popTween = this.tweens.addCounter({ from: 0.7, to: 1, duration: 240, ease: 'Back.easeOut', onUpdate: t => set(t.getValue()), onComplete: () => set(1) });
  }

  parchment(w, h) { return parchmentKey(this, w, h); }

  tilePicture(theme, w, h) { return tileKey(this, theme, w, h); }

  // The UPDATE button (in the settings): gets fresh copies of all game files and reloads (also fixes an old saved copy in the browser
  // or the installed app). When the menu opens it asks the server for the newest version number; if it is newer, the button turns
  // red and the cog gets a !.
  makeUpdate(y, keep) {
    const art = this.textures.exists('ui_med-button'), UB = M.updateBtn; // the tan button of the Medieval UI pack (9-slice: the round ends stay, the middle stretches); without the picture the old drawn plate is used
    const ubw = art ? UB.w : M.updateW, ubh = art ? 26 : M.updateH, bx = (W - ubw) / 2, by = y;
    const btn = { btn: true, x: bx - 8, y: by - 4, w: ubw + 16, h: ubh + 8, g: keep(this.add.graphics(), 1), down: false, hot: false, busy: false }; // x / y / w / h = the touch area, bigger than the picture (a thumb needs about 44 phone px)
    btn.img = art ? keep(addSlice(this, bx, by, buttonKey(this), ubw, 26, 10, 10, 0, 0).setOrigin(0, 0), 1) : null;
    btn.label = keep(this.add.text(W / 2, by + ubh / 2, 'Update', { ...FONT, fontSize: fpx(M.updateSize) + 'px', color: hex(P.cream), stroke: hex(P.shadow), strokeThickness: 0}).setOrigin(0.5), 2);
    btn.draw = () => {
      btn.g.clear();
      if (art) {
        const w = Math.max(ubw, 2 * Math.ceil((btn.label.width + 28) / 2)), x = (W - w) / 2; // the button widens when its text needs it (the scroll ends take about 14 px each side)
        btn.img.setSize(w, 26).setX(x); btn.x = x - 8; btn.w = w + 16; // normal, pressed, or hover (a newer version is waiting); dark brown text
        btn.img.setTint(btn.down ? 0xbbbbbb : 0xffffff).setY(by + (btn.down ? 1 : 0)); // pressed: darker and 1 px lower
        btn.label.setColor(btn.hot ? BTN_HOT : BTN_INK).setStroke(BTN_INK, 0); // a newer version waiting: red text
        btn.label.setY(by + ubh / 2 + C.btnTextDy + (btn.down ? 1 : 0));
        return;
      }
      const sink = drawPlate(btn.g, bx, by, M.updateW, M.updateH, { fill: btn.hot ? M.updateHotColor : M.updateColor, border: btn.hot ? M.updateHotBorder : P.pink, down: btn.down, radius: 8 });
      btn.label.setColor(btn.hot ? hex(P.dark) : hex(P.cream)).setStroke(hex(P.shadow), 0); // dark text on the orange plate
      btn.label.setY(by + (M.updateH - M.plateDrop) / 2 + sink + 1);
    };
    btn.draw();
    btn.action = async () => {
      if (btn.busy) return;
      btn.busy = true; btn.label.setText('Updating...'); btn.draw();
      try { await refreshFiles(); window.location.reload(); }
      catch (e) { btn.label.setText('No internet'); btn.draw(); this.time.delayedCall(2200, () => { btn.busy = false; btn.label.setText(btn.hot ? 'New version' : 'Update'); btn.draw(); }); }
    };
    latestVersion().then(v => {
      if (!v || v === C.version || !btn.label.active) return; // same version, offline, or the menu was already left
      btn.hot = true; btn.label.setText('New version'); btn.draw();
      this.gearBadge.setVisible(true); // the ! on the cog
    });
    return btn;
  }

  // The close button of every box: a small scroll with an X in the top right corner (its tap area is bigger than the picture).
  // (right, top) = the box's own right edge and top; keep = the box's way of collecting its objects.
  closeX(right, top, keep, action) {
    const w = 24, x = right - w - 8, y = top + 8, art = this.textures.exists('ui_med-button');
    const bt = { btn: true, x: x - 8, y: y - 7, w: w + 16, h: 40, down: false, shown: true, action };
    bt.img = art ? keep(addSlice(this, x, y, 'ui_med-button', w, 26, 10, 10, 0, 0).setOrigin(0, 0), 1) : null;
    const g = keep(this.add.graphics(), 2), cx = x + w / 2, cy = y + 13; // a drawn pixel X (the text font's X reads as another letter)
    g.fillStyle(art ? Phaser.Display.Color.HexStringToColor(BTN_INK).color : P.cream, 1);
    for (let i = 0; i < 7; i++) g.fillRect(cx - 4 + i, cy - 4 + i, 2, 2).fillRect(cx + 2 - i, cy - 4 + i, 2, 2);
    bt.label = g;
    bt.draw = () => { const sink = bt.down ? 1 : 0; if (bt.img) bt.img.setTint(bt.down ? 0xbbbbbb : 0xffffff).setY(y + sink); g.setY(sink); };
    bt.draw();
    return bt;
  }

  // The settings panel (closed at first), everything centred: CONTROLS (drag / stick) and EFFECTS (full / low) as two buttons side by side,
  // SOUND and MUSIC volume sliders (music at 0: your own music or video can play alone), UPDATE; X closes. All saved. (Tune panel: 5 taps on the version number.)
  makeSettings() {
    const S = M.settings, objs = [], mid = S.x + S.w / 2, ink = hex(S.ink);
    const keep = (o, dz = 0) => { o.setDepth(S.depth + dz).setVisible(false); objs.push(o); return o; };
    const cream = hex(P.cream); // light text on the purple panel; the words on the light buttons stay dark (ink)
    const T = (x, y, s, color = cream) => keep(this.add.text(x, y, s, { ...FONT_MONO, color }).setOrigin(0.5), 2);
    const veil = keep(this.add.graphics(), -1); veil.fillStyle(0x000000, 0.55).fillRect(0, 0, W, H);
    if (this.textures.exists('ui_panel-parchment')) keep(this.add.image(S.x, S.y, this.parchment(S.w, S.h)).setOrigin(0, 0));
    else { const back = keep(this.add.graphics()); back.fillStyle(0x3a1a72, 1).fillRoundedRect(S.x, S.y, S.w, S.h, M.plateRadius); }
    keep(this.add.text(mid, S.y + 30, 'Settings', { ...FONT_TITLE, fontSize: '24px', color: hex(P.title) }).setOrigin(0.5), 2); // the ornate title font
    this.panelButtons = [];
    // Omri's flat parchment buttons (80 x 26, 10 px ends). isOn = null: a plain button; else a choice, faded when it is not the chosen one
    const mkBtn = (x, y, w, key, label, action, isOn = null) => {
      const h = 26, bt = { btn: true, x: x - 2, y: y - 4, w: w + 4, h: h + 8, down: false, action, shown: false };
      bt.img = keep(addSlice(this, x, y, key, w, h, 10, 10, 0, 0).setOrigin(0, 0), 1);
      bt.label = T(x + w / 2, y + 12 + C.btnTextDy, label, ink);
      bt.draw = () => {
        const on = !isOn || isOn(), sink = bt.down ? 1 : 0;
        bt.img.setTint(bt.down ? 0xbbbbbb : 0xffffff).setAlpha(on ? 1 : 0.45).setY(y + sink);
        bt.label.setAlpha(on ? 1 : 0.5).setY(y + 12 + C.btnTextDy + sink);
      };
      this.panelButtons.push(bt);
      return bt;
    };
    const pair = (y, options, current, choose) => { // two buttons side by side
      const w = 62, gap = 6, list = options.map(([value, label], i) => mkBtn(mid - w - gap / 2 + i * (w + gap), y, w, i ? 'ui_flat2' : 'ui_flat1', label, () => { choose(value); list.forEach(b => b.draw()); }, () => current() === value));
    };
    T(mid, S.y + 56, 'Controls');
    pair(S.y + 66, [['drag', 'Drag'], ['stick', 'Stick']], () => (C.ship.controls === 'stick' ? 'stick' : 'drag'), v => {
      C.ship.controls = v;
      try { localStorage.setItem(CTL_KEY, v); } catch (e) { /* not saved */ }
    });
    T(mid, S.y + 104, 'Effects');
    pair(S.y + 114, [['full', 'Full'], ['low', 'Low']], () => (this.fxLow ? 'low' : 'full'), v => {
      if (v === (this.fxLow ? 'low' : 'full')) return;
      try { localStorage.setItem(FX_KEY, v); } catch (e) { /* not saved */ }
      this.scene.restart({ settings: true }); // the menu is rebuilt with the new setting, then the settings open again
    });
    this.volBars = [['sound', 'Sound', S.y + 154], ['music', 'Music', S.y + 193]].map(([key, label, y]) => {
      T(mid, y, label);
      const bar = { key, x: Math.round(mid - VOL_W / 2), y: y + 16, g: keep(this.add.graphics(), 1) };
      drawVolBar(bar.g, bar.x, bar.y, volume(key));
      return bar;
    });
    this.panelButtons.push(this.makeUpdate(S.y + 238, keep));
    const credits = mkBtn(mid - 40, S.y + 272, 80, 'ui_med-button', 'Credits', () => this.openCredits()); credits.btn = false; // (btn = the little pop, which is for Update and the cog)
    this.panelButtons.push(this.closeX(S.x + S.w, S.y, keep, () => this.popOut(this.panelBox, this.panelVeil, S.x + S.w / 2, S.y + S.h / 2, () => this.openSettings(false))));
    this.panelVeil = veil; this.panelBox = this.add.container(0, 0, objs.filter(o => o !== veil)).setDepth(S.depth);
    this.panelObjs = objs;
  }

  // The stage box: tap a stage, see its picture and name, its goals with the stars you already have, then a big Play; X closes.
  // The same purple parchment as the shop, settings and end screen.
  openGoals(theme) {
    if (this.modal) return;
    const L = C.lightbox, node = M.path.nodes.find(n => n.theme === theme), keys = goalsOf(theme), saved = loadMedals(theme), objs = [];
    const D = L.depth, h = 70 + L.picH + keys.length * L.rowGap, y0 = Math.round((H - h) / 2), art = this.textures.exists('ui_panel-parchment');
    const keep = (o, dz = 0) => { o.setDepth(D + dz); objs.push(o); return o; };
    const T = (x, y, s, size, align, color) => keep(this.add.text(x, y, s, { ...FONT, fontSize: fpx(size) + 'px', color: hex(color), stroke: hex(P.shadow), strokeThickness: 0}).setOrigin(align, 0.5), 2);
    const veil = keep(this.add.graphics().fillStyle(0x000000, 0.55).fillRect(0, 0, W, H), -1);
    if (art) keep(this.add.image(L.x, y0, this.parchment(L.w, h)).setOrigin(0, 0), 0);
    else keep(this.add.graphics().fillStyle(0x3a1a72, 1).fillRoundedRect(L.x, y0, L.w, h, 10), 0);
    // the stage picture in its own ragged frame, the name on it
    if (art && this.textures.exists('stage_' + theme)) keep(this.add.image(W / 2, y0 + 14, this.tilePicture(theme, L.picW, L.picH)).setOrigin(0.5, 0), 1);
    keep(this.add.text(W / 2, y0 + 14 + L.picH / 2, titleCase(node ? node.name : ''), { ...FONT_TITLE, fontSize: L.titleSize + 'px', color: hex(P.title), stroke: hex(P.shadow), strokeThickness: 0}).setOrigin(0.5), 2); // the ornate title font
    const names = { cats: 'Cats', allCoins: 'Coins', killAll: 'Enemies', noHit: 'No hit' };
    keys.forEach((k, i) => { // a goal not earned yet: the same icon, faded
      const y = y0 + 30 + L.picH + i * L.rowGap, done = saved[k];
      keep(this.add.image(L.x + 34, y, 'goal_' + k + '_earned').setScale(goalScale(this, k, L.iconBox)).setAlpha(done ? 1 : L.dim), 2);
      T(L.x + 52, y, names[k], L.textSize, 0, done ? P.cream : 0xa89cd0);
      keep(this.add.image(L.x + L.w - 30, y, done ? 'star_earned' : 'star_off').setScale(1), 2);
    });
    const art2 = this.textures.exists('ui_med-button');
    const mk = (by, bw, size, label, action) => { // a centred button, the same picture as the other buttons
      const x = (W - bw) / 2, bt = { btn: true, x: x - 4, y: by - 2, w: bw + 8, h: 30, down: false, action, shown: true };
      bt.img = art2 ? keep(addSlice(this, x, by, buttonKey(this), bw, 26, 10, 10, 0, 0).setOrigin(0, 0), 1) : null;
      bt.g = keep(this.add.graphics(), 1);
      bt.label = T(W / 2, by + 12 + C.btnTextDy, label, size, 0.5, P.cream); if (art2) bt.label.setColor(BTN_INK).setStroke(BTN_INK, 0); else bt.label.setStroke(hex(P.shadow), 0);
      bt.draw = () => { if (bt.img) bt.img.setTint(bt.down ? 0xbbbbbb : 0xffffff).setY(by + (bt.down ? 1 : 0)); bt.label.setY(by + 12 + C.btnTextDy + (bt.down ? 1 : 0)); };
      return bt;
    };
    let box = null;
    const close = () => { if (this.popTween) this.popTween.remove(); objs.forEach(o => o.destroy()); box.destroy(); this.boxObjs = null; this.modal = false; this.panelButtons = this.settingsButtons; };
    const by = y0 + 24 + L.picH + keys.length * L.rowGap;
    const play = mk(by, L.playW, L.playSize, 'Play', () => { close(); this.scene.start('Play', { theme }); });
    const back = this.closeX(L.x + L.w, y0, keep, () => this.popOut(box, veil, W / 2, y0 + h / 2, close));
    box = this.add.container(0, 0, objs.filter(o => o !== veil)).setDepth(D);
    this.popIn(box, veil, W / 2, y0 + h / 2);
    this.boxObjs = objs; this.modal = true; this.panelButtons = [play, back];
  }

  // The shop (tap the cauldron): the coin total, one row per upgrade of CONFIG.shop.upgrades (name, level bar, price, BUY), CLOSE.
  // It is built when opened and thrown away when closed. While it is open only its own buttons take taps.
  openShop() {
    if (this.modal) return;
    const S = C.shop, B = S.panel, list = S.upgrades, h = B.headH + list.length * B.rowH + B.footH, y0 = Math.round((H - h) / 2), mid = B.x + B.w / 2;
    const objs = [], buttons = [], rows = [], cream = hex(P.cream), gold = hex(P.cream), ink = hex(M.settings.ink);
    const keep = (o, dz = 0) => { o.setDepth(B.depth + dz); objs.push(o); return o; }; // made from back to front
    const T = (x, y, s, color = cream, ox = 0.5) => keep(this.add.text(x, y, s, { ...FONT_MONO, color }).setFontSize(C.smallPx).setOrigin(ox, 0.5), 2);
    const veil = keep(this.add.graphics().fillStyle(0x000000, 0.55).fillRect(0, 0, W, H), -1);
    if (this.textures.exists('ui_panel-parchment')) keep(this.add.image(B.x, y0, this.parchment(B.w, h)).setOrigin(0, 0));
    else keep(this.add.graphics().fillStyle(0x3a1a72, 1).fillRoundedRect(B.x, y0, B.w, h, M.plateRadius));
    keep(this.add.text(B.x + 16, y0 + 44, 'Upgrades', { ...FONT_TITLE, fontSize: '28px', color: hex(P.title) }).setOrigin(0, 0.5), 2); // left, on the coin counter's line
    const total = T(0, y0 + 46, '', gold, 0).setFontSize(16); // the saved coins: a coin picture and the number, centred above the price buttons (text 1.5 px low: the font draws high)
    const totalCoin = this.textures.exists('sp_coin') ? keep(this.add.image(0, y0 + 44, 'sp_coin', 0).setScale(0.9), 2) : null;
    const mkBtn = (x, y, w, label, action) => { // the flat parchment button of the settings; off = faded
      const bt = { x: x - 4, y: y - 5, w: w + 8, h: 36, down: false, off: false, action };
      const img = keep(addSlice(this, x, y, 'ui_flat1', w, 26, 10, 10, 0, 0).setOrigin(0, 0), 1), text = T(x + w / 2, y + 12 + C.btnTextDy, label, ink);
      bt.text = text; bt.coin = null;
      bt.draw = () => {
        const sink = bt.down && !bt.off ? 1 : 0;
        img.setTint(sink ? 0xbbbbbb : 0xffffff).setAlpha(bt.off ? 0.4 : 1).setY(y + sink);
        text.setAlpha(bt.off ? 0.4 : 1).setY(y + 12 + C.btnTextDy + sink);
        if (bt.coin) bt.coin.setAlpha(bt.off ? 0.4 : 1).setY(y + 13 + sink);
      };
      buttons.push(bt);
      return bt;
    };
    const left = B.x + 16, right = B.x + B.w - 16;
    const refresh = () => {
      total.setText(String(loadBank()));
      const cw = totalCoin ? totalCoin.displayWidth + 3 : 0, from = right - B.buyW / 2 - (cw + total.width) / 2; // centre of the button column
      total.setX(from + cw);
      if (totalCoin) totalCoin.setX(from + totalCoin.displayWidth / 2);
      for (const r of rows) {
        const level = loadLevel(r.u.id), price = nextPrice(r.u.id);
        this.drawTube(r.tube, left, r.tubeY, level / r.u.prices.length);
        r.count.setText(level + '/' + r.u.prices.length);
        const coin = r.buy.coin, text = r.buy.text, mx = right - B.buyW / 2; // the middle of the scroll
        text.setText(price === null ? 'Max' : String(price)).setX(mx + (price === null || !coin ? 0 : 6));
        if (coin) coin.setVisible(price !== null).setX(text.x - text.width / 2 - 7);
        r.buy.off = price === null || loadBank() < price;
        r.buy.draw();
      }
      this.showBank();
    };
    list.forEach((u, i) => {
      const y = y0 + B.headH + i * B.rowH;
      T(left, y + 12, u.name, cream, 0);
      const row = { u, tubeY: y + 23, tube: keep(this.add.graphics(), 1) };
      row.count = T(left + B.tube.w, y + 12, '', gold, 1);
      row.buy = mkBtn(right - B.buyW, y + 8, B.buyW, '', () => {
        if (this.time.now - this.buyAt < S.buyGapMs || !buyUpgrade(u.id)) return; // a double tap buys once
        this.buyAt = this.time.now; sfx('coin'); refresh();
      });
      if (this.textures.exists('sp_coin')) row.buy.coin = keep(this.add.image(0, y + 21, 'sp_coin', 0).setScale(0.6), 2);
      rows.push(row);
    });
    let box = null;
    buttons.push(this.closeX(B.x + B.w, y0, keep, () => this.popOut(box, veil, mid, y0 + h / 2, () => {
      objs.forEach(o => o.destroy()); box.destroy(); this.boxObjs = null; this.modal = false; this.panelButtons = this.settingsButtons;
      this.showBank();
    })));
    refresh();
    box = this.add.container(0, 0, objs.filter(o => o !== veil)).setDepth(B.depth);
    this.popIn(box, veil, mid, y0 + h / 2);
    this.boxObjs = objs; this.modal = true; this.panelButtons = buttons;
  }

  // An upgrade level as a glass tube of glowing potion: filled = 0 (empty) to 1 (full). Plain rectangles, so it also works in canvas mode.
  drawTube(g, x, y, filled) {
    const U = C.shop.panel.tube, w = U.w, h = U.h, inX = x + 2, inY = y + 2, inW = w - 4, inH = h - 4;
    const R = (color, rx, ry, rw, rh, alpha = 1) => g.fillStyle(color, alpha).fillRect(rx, ry, rw, rh);
    const fw = Math.round(inW * filled);
    g.clear();
    if (fw) { R(U.liquid, x - 1, y - 2, fw + 6, h + 4, 0.18); R(U.liquid, x - 3, y, fw + 10, h, 0.12); } // soft glow around the filled part
    R(U.rim, x + 2, y, w - 4, h); R(U.rim, x, y + 2, w, h - 4); // the glass, corners cut
    R(U.empty, inX, inY, inW, inH);
    if (!fw) return;
    R(U.liquid, inX, inY, fw, inH);
    R(U.shine, inX, inY + 1, fw, 1);
    if (filled < 1) R(U.edge, inX + Math.max(0, fw - 2), inY, Math.min(2, fw), inH);
    for (const [bx, by] of [[7, 4], [22, 3], [36, 5], [51, 4], [67, 3], [82, 5], [96, 4]]) if (bx + 2 < fw) R(U.bubble, inX + bx, inY + by, 2, 2);
  }

  // Closing a box = popIn played backwards (a little bigger, then down to 70%; the veil fades out at the end). No taps meanwhile; done() removes it.
  popOut(box, veil, cx, cy, done) {
    if (this.popTween) this.popTween.remove();
    this.panelButtons = [];
    this.tweens.killTweensOf(veil);
    this.tweens.add({ targets: veil, alpha: 0, duration: 150, delay: 90 });
    this.popTween = this.tweens.addCounter({ from: 1, to: 0.7, duration: 240, ease: 'Back.easeIn', onUpdate: t => { const k = t.getValue(); if (box.active) box.setScale(k).setPosition(cx * (1 - k), cy * (1 - k)); }, onComplete: done });
  }

  // The credits box (settings > Credits): the makers of the art, sounds and fonts (src/credits.js) in one list that scrolls (drag or
  // mouse wheel). It opens ON TOP of the settings, which stay open behind it; X takes only this box away.
  openCredits() {
    const w = 190, h = 270, x = (W - w) / 2, y0 = Math.round((H - h) / 2), mid = W / 2, D = M.settings.depth + 10, objs = [];
    const top = y0 + 52, view = h - 70; // the window the list shows through
    const keep = (o, dz = 0) => { o.setDepth(D + dz); objs.push(o); return o; };
    const veil = keep(this.add.graphics().fillStyle(0x000000, 0.45).fillRect(0, 0, W, H), -1);
    if (this.textures.exists('ui_panel-parchment')) keep(this.add.image(x, y0, this.parchment(w, h)).setOrigin(0, 0));
    else keep(this.add.graphics().fillStyle(0x3a1a72, 1).fillRoundedRect(x, y0, w, h, M.plateRadius));
    keep(this.add.text(mid, y0 + 30, 'Credits', { ...FONT_TITLE, fontSize: '24px', color: hex(P.title) }).setOrigin(0.5), 2);
    // the list is its own container so it can be clipped to the window; the list, its window and the scroll bar grow and shrink with the box
    const lines = []; let y = top + 6;
    const T = (s, color) => lines.push(this.add.text(mid, y, s, { ...FONT_MONO, color }).setFontSize(C.smallPx).setOrigin(0.5));
    CREDITS.forEach(([what, who]) => {
      if (what) { T(what, '#a89cd0'); y += 11; }
      who.forEach(line => { T(line, hex(P.cream)); y += 11; });
      y += 6;
    });
    const max = Math.max(0, y - top - view);
    const list = this.add.container(0, 0, lines).setDepth(D + 3);
    const clip = this.make.graphics({ add: false }).fillStyle(0xffffff, 1).fillRect(x + 6, top, w - 12, view);
    list.setMask(clip.createGeometryMask());
    const bar = keep(this.add.graphics(), 3);
    const sc = { top, bottom: top + view, x0: x, x1: x + w, at: 0, v: 0, held: false };
    let box = null;
    sc.move = dy => { sc.at = Phaser.Math.Clamp(sc.at + dy, 0, max); };
    const follow = (time, delta) => {
      if (!sc.held && sc.v) { sc.move(sc.v * delta / 1000); sc.v *= Math.exp(-4 * delta / 1000); if (Math.abs(sc.v) < 4) sc.v = 0; } // a little glide after the finger lifts
      const k = box.scaleX;
      list.setScale(k).setPosition(box.x, box.y - sc.at * k);
      lines.forEach(t => { // fade near an edge only while there is more text beyond it
        const ty = t.y - sc.at, up = sc.at > 1 ? (ty - top - 4) / 30 : 1, down = sc.at < max - 1 ? (top + view - 4 - ty) / 30 : 1;
        t.setAlpha(Phaser.Math.Clamp(Math.min(up, down), 0, 1));
      });
      clip.setScale(k).setPosition(box.x, box.y); bar.setScale(k).setPosition(box.x, box.y);
      const th = Math.max(14, view * view / (view + max));
      bar.clear();
      if (max) bar.fillStyle(0xa89cd0, 0.8).fillRect(x + w - 18, top + (view - th) * sc.at / max, 2, th); // where you are in the list
    };
    const gone = () => { this.events.off('update', follow); this.events.off('shutdown', gone); this.scroller = null; };
    const close = () => { gone(); objs.forEach(o => o.destroy()); box.destroy(); list.destroy(); clip.destroy(); this.boxObjs = null; this.panelButtons = this.settingsButtons; };
    const back = this.closeX(x + w, y0, keep, () => { sc.v = 0; this.popOut(box, veil, mid, y0 + h / 2, close); });
    box = this.add.container(0, 0, objs.filter(o => o !== veil && o !== bar)).setDepth(D);
    this.popIn(box, veil, mid, y0 + h / 2);
    follow(0, 0);
    this.events.on('update', follow); this.events.once('shutdown', gone);
    this.scroller = sc; this.boxObjs = objs; this.panelButtons = [back];
  }

  openSettings(on, pop = true) {
    if (on && pop) this.popIn(this.panelBox, this.panelVeil, M.settings.x + M.settings.w / 2, M.settings.y + M.settings.h / 2);
    else { if (this.popTween) this.popTween.remove(); this.panelBox.setScale(1).setPosition(0, 0); this.panelVeil.setAlpha(1); }
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
    this.cutMoon();
    mk('menu_sky', 'menu_sky', sky.fps, sky.frames);
    this.skySprite = this.add.sprite(W / 2, H / 2, 'menu_sky').setScale(W / sky.frameW * sky.cover).setDepth(-10).play('menu_sky'); // bigger than the screen (sky.cover) so the tilt and the stage scroll can shift it without showing an edge
    this.moon = this.add.image(sky.moon.x, sky.moon.y, 'menu_moon').setScale(this.skySprite.scaleX).setDepth(-9);
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

  // The orange moon is painted into every frame of the sky: paint it out (with the sky colour beside it) and keep one copy as its own
  // picture 'menu_moon', so it can sit anywhere. Done once; the textures stay for later visits to the menu.
  cutMoon() {
    const T = this.textures, S = M.sky, [bx, by, bw, bh] = S.moon.box;
    if (T.exists('menu_moon')) return;
    const src = T.get('menu_sky').getSourceImage(), cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height;
    const cx = cv.getContext('2d'); cx.drawImage(src, 0, 0);
    const moon = T.createCanvas('menu_moon', bw, bh), mx = moon.getContext(), out = mx.createImageData(bw, bh);
    for (let f = 0; f < S.frames; f++) {
      const fx = (f % S.cols) * S.frameW + bx, fy = Math.floor(f / S.cols) * S.frameH + by, d = cx.getImageData(fx, fy, bw, bh), p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        if (p[i] < 200 || p[i + 1] < 100) continue; // not moon orange
        if (f === 0) out.data.set(p.slice(i, i + 4), i);
        const edge = i - (i % (bw * 4)); // the first pixel of this row: plain sky
        p.set(p.slice(edge, edge + 4), i);
      }
      cx.putImageData(d, fx, fy);
    }
    mx.putImageData(out, 0, 0); moon.refresh();
    T.remove('menu_sky'); T.addSpriteSheet('menu_sky', cv, { frameWidth: S.frameW, frameHeight: S.frameH });
  }

  // The word SHOP on the cauldron's pot (title font) and the gold glow behind it (showBank turns the glow on and off). Both move with the cauldron when the phone tilts.
  // The glow is a picture painted once (a radial fade), so it also works in canvas mode.
  makeShopSign() {
    const S = C.shop.sign, G = C.shop.glow, par = this.decorItems.find(i => i.key === 'boiler').par;
    if (!this.textures.exists('menu_shopglow')) {
      const cv = this.textures.createCanvas('menu_shopglow', 64, 64), c = cv.getContext(), f = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      const rgb = [(G.color >> 16) & 255, (G.color >> 8) & 255, G.color & 255].join(',');
      f.addColorStop(0, 'rgba(' + rgb + ',1)'); f.addColorStop(0.55, 'rgba(' + rgb + ',0.65)'); f.addColorStop(1, 'rgba(' + rgb + ',0)');
      c.fillStyle = f; c.fillRect(0, 0, 64, 64); cv.refresh();
    }
    this.shopGlow = this.add.image(G.x, G.y, 'menu_shopglow').setDisplaySize(G.rx * 2, G.ry * 2).setDepth(49).setAlpha(G.alphaMin).setVisible(false); // just behind the cauldron (50)
    this.tweens.add({ targets: this.shopGlow, alpha: G.alphaMax, duration: G.ms, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.shopSign = this.add.text(S.x, S.y, 'Shop', { ...FONT_TITLE, fontSize: S.size + 'px', color: hex(S.color), stroke: hex(P.shadow), strokeThickness: 0}).setOrigin(0.5).setDepth(52).setPadding(0, 0, 0, 2).setShadow(0, C.game.render, hex(P.shadow), 0, false, true); // drop shadow: 1 game px (shadow offsets are in canvas pixels)
    this.decorItems.push({ s: this.shopGlow, pos: { x: G.x, y: G.y }, par, key: 'shopglow' }, { s: this.shopSign, pos: { x: S.x, y: S.y }, par, key: 'shopsign' });
    const WG = C.shop.wordGlow; // its own picture: canvas mode cannot tint the gold one
    if (!this.textures.exists('menu_wordglow')) {
      const cv = this.textures.createCanvas('menu_wordglow', 64, 64), c = cv.getContext(), f = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      const rgb = [(WG.color >> 16) & 255, (WG.color >> 8) & 255, WG.color & 255].join(',');
      f.addColorStop(0, 'rgba(' + rgb + ',1)'); f.addColorStop(0.5, 'rgba(' + rgb + ',0.6)'); f.addColorStop(1, 'rgba(' + rgb + ',0)');
      c.fillStyle = f; c.fillRect(0, 0, 64, 64); cv.refresh();
    }
    const glow = this.add.image(S.x, S.y, 'menu_wordglow').setDisplaySize(WG.rx * 2, WG.ry * 2).setDepth(51.5).setAlpha(WG.alphaMin); // over the pot and its bubbles, under the word
    this.tweens.add({ targets: glow, alpha: WG.alphaMax, duration: C.shop.glow.ms, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.decorItems.push({ s: glow, pos: { x: S.x, y: S.y }, par, key: 'wordglow' });
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
      const front = Math.random() < B.trail.front; // in front: starts on the bristles and is drawn over the witch (depth 50)
      this.bit(s.x + B.trail.dx + (front ? rnd(-2, 14) : rnd(-4, 4)), s.y + B.trail.dy + (front ? rnd(-6, 3) : rnd(-4, 4)), { tint: pick(B.trail.tints), vx: -rnd(10, 26), vy: rnd(2, 18), life: rnd(900, 1500), s0: B.trail.size, s1: 0.6, a0: 1, add: B.trail.add, depth: front ? 50.5 : 49 }); // bigger, longer lived and (not additive) clearly visible on the light sky
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
    const t = [c.label, c.img && !c.img.sliced ? c.img : null].filter(Boolean);
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
    if (this.skySprite && this.moon) this.moon.setPosition(M.sky.moon.x + this.skySprite.x - W / 2, M.sky.moon.y + this.skySprite.y - H / 2); // the moon belongs to the sky
    if (this.moon) this.moon.setPosition(M.sky.moon.x + this.skySprite.x - W / 2, M.sky.moon.y + this.skySprite.y - H / 2); // the moon moves with the sky
  }
}

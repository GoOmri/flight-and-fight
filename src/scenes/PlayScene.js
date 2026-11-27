import { popIn, popOut } from '../popin.js';
import { buttonKey, addSlice, parchmentKey, BTN_INK } from '../buttons.js';
import { sfx, music, ringSound, pauseSound, volume, setVolume } from '../sound.js';
import { drawVolBar, volFrom, volHit, VOL_W } from '../volbar.js';
import { CONFIG as C, z, hex, snap4 } from '../config.js';
import { makeAllTextures, makeGoalIcons, loadGoalArt, goalScale, PX } from '../sprites.js';
import { STAGE1 } from '../waves.js';
import { WaveRunner, initPath, followPath } from '../waves-runner.js';
import { Cats, loadCatArt } from '../cats.js';
import { Hud, FONT, FONT_TITLE, titleCase, fpx, drawPlate } from '../hud.js';
import { findSprites } from '../forestArt.js';
import { ROCKS } from '../rocks.js';
import { Tune, tuneEnabled } from '../tune.js';
import { Medals, goalsOf, saveMedals, saveBest } from '../medals.js';
import { loadBank, addBank, loadLevel, upgradeValue } from '../bank.js';

// Which background is shown: ?bg=forest | swamp | sky in the web address, else config.background.mode.
// The menu passes data.theme ('forest' | 'swamp'); ?bg still wins, with no data config.background.mode is used.
const bgName = theme => new URLSearchParams(window.location.search).get('bg') || theme || C.background.mode;
const ANIM_FRAMES = ['a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10', 'a11']; // frame names of an animated strip (made once, so nothing is built per frame)
const SHINE_KINDS = [['coin', 'rays'], ['heart', 'raysh'], ['potion', 'praysg']]; // drop kind, name of its beam pictures
const GLOW_MAX = 20; // glow pictures are this many px from the centre (the biggest glow the tune panel can make)
const RAYS_MAX = 40; // ray pictures are this many px from the centre (the longest ray the tune panel can make)
const W = C.game.width, H = C.game.height, R = C.game.render, DEG = Math.PI / 180, TAU = Math.PI * 2;
// Spark colours. Death pops match the creature; no red and no gold on anything that is not a shot / coin.
const DEATH_TINTS = {
  grunt: [0x3c3a8c, 0x8f86d8, 0xffffff],   // bat: indigo
  zigzag: [0xc9c3e8, 0xffffff, 0xd98fb8],  // ghost: lavender
  shooter: [0x8a1f6b, 0xe0369e, 0xffffff], // dino: magenta
  vulture: [0x8a5a2b, 0xc58f4f, 0xe0369e], // vulture: brown + pink
  crate: [0xc58f4f, 0x8a5a2b, 0x8a93a6]    // chest: wood + steel
};
const WITCH_TINTS = [0xff7ad9, 0xb15bd6, 0xffffff], SHOT_TINTS = [0xffffff, 0x7fe0ff], TRAIL_TINTS = [0xff7ad9, 0xc89cff, 0xffffff];
const GREEN_TINTS = [0x2ee86a, 0xffffff], COIN_TINTS = [0xfff2a0, 0xffc928]; // coin sparkle is gold (coins only)

export class PlayScene extends Phaser.Scene {
  constructor() { super('Play'); }

  init(data) {
    this.startData = data && data.theme ? { theme: data.theme } : undefined; // passed again on restart
    this.bg = bgName(this.startData && this.startData.theme);
    this.stageTheme = this.bg === 'swamp' ? 'swamp' : 'forest'; // which saved medals / best score belong to this run
  }

  // Loads the witch sheet (assets/witch, art by Svetlana Kushnariova and Jordan Irwin, see CREDITS.md).
  preload() {
    const w = new URLSearchParams(window.location.search).get('witch') === '1' ? 1 : (new URLSearchParams(window.location.search).get('witch') === '2' ? 2 : C.ship.witch);
    const SP = C.enemies.sprites; // animated enemy sheets (assets/enemies); types without an entry keep the code-drawn picture
    for (const t in SP) this.load.spritesheet('en_' + t, 'assets/enemies/' + SP[t].file, { frameWidth: SP[t].frameW, frameHeight: SP[t].frameH });
    this.load.spritesheet('witch', 'assets/witch/witch-' + w + '.png', { frameWidth: 24, frameHeight: 32 });
    loadCatArt(this, C.version); // the cats (assets/cats)
    loadGoalArt(this, C.version); // goal icons and the star (the menu loads them too)
    if (!this.textures.exists('ui_panel-parchment')) this.load.image('ui_panel-parchment', 'assets/ui/ui-panel-parchment.png?v=' + C.version); // the box of the end screen
    if (!this.textures.exists('ui_med-button')) this.load.image('ui_med-button', 'assets/ui/ui-med-button.png?v=' + C.version); // the menu's button (a stage started from the menu has it already)
    if (!this.textures.exists('ui_med-button2')) this.load.image('ui_med-button2', 'assets/ui/ui-med-button2.png?v=' + C.version);
    const K = C.sprites; // coin / heart / chest / puff strips (assets/pickups, assets/fx); a thing without an entry keeps its code-drawn picture
    const strip = (key, d) => this.textures.exists(key) || this.load.spritesheet(key, 'assets/' + d.file, { frameWidth: d.frameW, frameHeight: d.frameH });
    if (K.coin) strip('sp_coin', K.coin);
    if (K.heartPickup) for (const n of ['idle', 'drop', 'collect', 'shine']) if (K.heartPickup[n]) strip('sp_heart_' + n, K.heartPickup[n]);
    if (K.crate) { strip('sp_crate_idle', K.crate.idle); strip('sp_crate_break', K.crate.break); }
    if (K.poof) strip('sp_poof', K.poof);
    if (K.weaponGem) strip('sp_gem', K.weaponGem);
    if (K.stunned) strip('sp_stunned', K.stunned);
    if (C.bullet.fire) strip('sp_fire', C.bullet.fire);
    if (C.enemyBullet.file) this.load.image('eb_pic', 'assets/' + C.enemyBullet.file); // enemy shot picture (shmup pack, capttainjack); without it the code-drawn orb is used
    const LN = this.bg === 'swamp' ? C.background.swamp.lanterns : null; // swamp lanterns (8-frame strips, see makeLanterns)
    if (LN) LN.files.forEach((f, i) => this.load.spritesheet('lan_' + i, 'assets/swamp/' + f.file + '.png', { frameWidth: f.w, frameHeight: f.h }));
    if (this.bg === 'swamp') { // swamp pictures (assets/swamp, pack "Murky Swamp", see CREDITS.md): only the ones listed in config are loaded
      const A = C.background.swamp.files;
      new Set([...A.trees, ...A.bushes, ...A.smalls, ...A.rocks, ...A.bigRocks]).forEach(n => this.load.image('sw-' + n, 'assets/swamp/' + n + '.png'));
    } else {
      // Forest background sheets (assets/forest, licence UNKNOWN for now, see NOTES.md)
      this.load.image('forestPlants', 'assets/forest/plants.png');
      this.load.image('forestRocks', 'assets/forest/rocks.png');
    }
  }

  create() {
    makeAllTextures(this);
    ringSound(null); pauseSound(false); music(this.bg === 'forest' ? 'forest' : null); // only the forest has its own music so far
    if (C.sprites.poof) { // death smoke in the main colour of each enemy (and the chest): a tinted copy of the poof sheet per type, made once (no tint at draw time, so it also works in CANVAS mode)
      const smoke = { ...Object.fromEntries(Object.keys(C.enemies.sprites).map(t => [t, C.enemies.sprites[t].smokeColor !== undefined ? C.enemies.sprites[t].smokeColor : this.mainColour('en_' + t)])), crate: DEATH_TINTS.crate[0] };
      for (const t in smoke) {
        this.makeTintSheet('sp_poof', 'sp_poof_' + t, smoke[t]);
        if (!this.anims.exists('poof_' + t)) this.anims.create({ key: 'poof_' + t, frames: this.anims.generateFrameNumbers('sp_poof_' + t, { start: 0, end: C.sprites.poof.frames - 1 }), frameRate: C.sprites.poof.fps, repeat: 0 });
      }
    }
    this.makeShineTextures(); // muzzle flash and coin shine pictures (pixel patterns drawn once)
    const WG = C.sprites.weaponGem; // the weapon potion is turned green by shifting every colour's hue once (a recoloured copy, so it works in WebGL and CANVAS)
    if (WG && WG.hueShift) this.makeHueSheet('sp_gem', 'sp_gem_g', WG.hueShift, WG.hueRange, WG.valueMul, WG.satMul);
    if (C.bullet.fire && C.bullet.fire.hueShift) this.makeHueSheet('sp_fire', 'sp_fire_b', C.bullet.fire.hueShift);
    for (const t in C.enemies.sprites) this.makeWhiteSheet('en_' + t); // white copies of the enemy sheets for the hit flash (works in WebGL and in the older CANVAS mode)
    for (const t in C.enemies.sprites) { // one flap/bob loop per sprite type, made once (textures and animations persist across restarts)
      const d = C.enemies.sprites[t], key = 'en_' + t + '_loop';
      if (!this.anims.exists(key)) this.anims.create({ key, frames: d.frames.map(f => ({ key: 'en_' + t, frame: f })), frameRate: d.fps, repeat: -1 });
    }
    const K = C.sprites, mkAnim = (key, tex, d, repeat) => { // pickup / fx animations, made once
      if (!this.anims.exists(key)) this.anims.create({ key, frames: this.anims.generateFrameNumbers(tex, { start: 0, end: d.frames - 1 }), frameRate: d.fps, repeat });
    };
    if (K.stunned) mkAnim('stunned', 'sp_stunned', K.stunned, -1);
    if (C.bullet.fire) mkAnim('fire_shot', this.textures.exists('sp_fire_b') ? 'sp_fire_b' : 'sp_fire', C.bullet.fire, -1);
    if (K.coin) mkAnim('coin_spin', 'sp_coin', K.coin, -1);
    if (K.heartPickup) { mkAnim('heart_idle', 'sp_heart_idle', K.heartPickup.idle, -1); mkAnim('heart_drop', 'sp_heart_drop', K.heartPickup.drop, 0); mkAnim('heart_collect', 'sp_heart_collect', K.heartPickup.collect, 0); }
    if (K.crate) { mkAnim('crate_idle', 'sp_crate_idle', K.crate.idle, -1); mkAnim('crate_break', 'sp_crate_break', K.crate.break, 0); }
    if (K.poof) mkAnim('poof', 'sp_poof', K.poof, 0);
    if (K.weaponGem) mkAnim('gem_spin', this.textures.exists('sp_gem_g') ? 'sp_gem_g' : 'sp_gem', K.weaponGem, -1);
    // The canvas is R times bigger than the game (sharp text); the camera zooms back so all numbers stay logical.
    this.cameras.main.setZoom(R).centerOn(W / 2, H / 2);
    this.score = 0;
    this.freezeMs = 0;    // hit-stop: game is frozen while > 0
    this.shipFlashUntil = 0; this.muzzleUntil = 0;
    this.recoil = 0; this.trailT = 0; this.trailN = 0; this.vx = 0; this.vy = 0; this.cloudMul = 1; // feel state
    this.hearts = C.ship.hearts;
    this.over = false; this.endBtns = []; this.bankDraw = null; this.newTags = [];
    this.invulnUntil = 0;
    this.nextShot = 0;
    // Debug helpers (type them after the web address): ?wave=N starts the stage at wave N (1-10); ?god=1 = no damage (hits still counted).
    const q = new URLSearchParams(window.location.search);
    this.god = q.get('god') === '1';
    const startWave = Phaser.Math.Clamp(parseInt(q.get('wave'), 10) || C.testing.wave, 1, STAGE1.length) - 1; // ?wave=N, or the tune panel's TEST tab
    this.weaponLevel = C.testing.level >= 0 ? Math.min(C.pickup.maxLevel, C.testing.level) : Math.min(C.pickup.maxLevel, startWave); // wave=N starts with weapon level N-1 so later waves can be tried fairly
    this.runner = new WaveRunner(STAGE1, startWave, C.stage.firstWaveDelay);
    this.hooks = { enemy: (cg, i) => { if (this.cats) this.cats.onWave(cg.w); this.spawnEnemy(cg, i); }, // a cat appears when the first enemy of its wave spawns
       crate: cc => this.spawnCrate(cc) };
    this.enemyCount = 0;  // enemies alive now
    this.leaving = false; // true while she flies off the top at the end of the stage
    this.clearAt = 0;     // time when STAGE CLEAR shows (0 = not yet)
    // Counters for the medals later (shown only on the result screen for now)
    this.enemiesSpawned = 0; this.enemiesKilled = 0; this.coinsSpawned = 0; this.coinsCollected = 0; this.hitsTaken = 0;
    this.coinsBanked = 0; // coins of this run that went into the saved bank
    this.refreshUpgrades(); // bought levels (Cauldron shop)

    this.makeBackground();
    this.makeLanterns();
    this.makePools();
    this.makeShip();
    const waveTotals = STAGE1.map(w => w.groups.reduce((n, g) => n + g.n, 0));
    this.goalKeys = goalsOf(this.stageTheme).filter(k => k !== 'cats' || C.cats.atWave.some(w => w >= startWave)); // the goals (stars) of this stage (a run that starts late, by the tune jump, has no cats)
    this.medals = new Medals(waveTotals.slice(startWave).reduce((a, b) => a + b, 0), this.goalKeys);
    makeGoalIcons(this); // goal pictures (after the coin and heart sheets are loaded)
    this.hud = new Hud(this, waveTotals, startWave);
    this.hud.setLevel(this.weaponLevel);
    this.cats = new Cats(this, startWave); // 3 cats to rescue (src/cats.js)

    // Input: relative drag. The ship moves by the same amount as the finger (or held mouse) moves.
    // Touching somewhere else does not move the ship. Only one pointer steers; others are ignored.
    this.dragId = null;
    this.dragFrom = new Phaser.Math.Vector2();  // finger position at touch start
    this.lastFinger = new Phaser.Math.Vector2(); this.dragLive = false; // drag control: finger position last frame, and whether the touch dead zone has been left
    this.shipFrom = new Phaser.Math.Vector2();  // ship position at touch start
    this.finger = new Phaser.Math.Vector2();    // finger position now
    // Controls: 'stick' = virtual stick (the ring appears where the thumb lands, the witch flies where you push),
    // 'drag' = the code above. Choose in config.ship.controls or with ?ctl=stick / ?ctl=drag.
    // 'mouse' = the witch follows the mouse pointer (no click needed). It is the automatic choice on a desktop browser (a mouse: hover + fine pointer), never on a phone. ?ctl=mouse forces it, ?ctl=stick / ?ctl=drag force the others.
    const desktop = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    const ctl = q.get('ctl') || (C.ship.mouseOnDesktop && desktop ? 'mouse' : C.ship.controls);
    this.stickMode = ctl === 'stick';
    this.mouseMode = ctl === 'mouse';
    this.mouseSeen = false; // the witch waits where she is until the mouse has moved over the game
    this.stickC = new Phaser.Math.Vector2(W / 2, C.stick.restY); // ring centre
    this.stickV = new Phaser.Math.Vector2();                     // witch speed from the stick
    this.stopT = new Phaser.Math.Vector2(); this.stopping = false; // soft stop: where she settles after the thumb is lifted
    this.makeStickArt();
    // Tuning panel (only with ?tune=1): gear under the hearts, opens a panel and pauses the game
    this.tune = tuneEnabled() ? new Tune(this,
      () => { this.physics.world.pause(); this.dragId = null; this.stickV.set(0, 0); this.stopping = false; this.stickC.set(W / 2, C.stick.restY); },
      () => this.physics.world.resume()) : null;
    this.paused = false; this.pauseUi = null;
    this.makePauseButton();
    this.game.events.on('hidden', this.pauseGame, this); // the phone app goes to the background: pause by itself
    this.events.once('shutdown', () => { this.game.events.off('hidden', this.pauseGame, this); this.anims.resumeAll(); });
    this.input.on('pointerdown', p => {
      if (this.paused) { this.pauseTap(p.x / R, p.y / R); return; } // the pause screen takes every touch
      if (this.tune && this.tune.press(p.x / R, p.y / R)) return; // the panel used this touch
      if (!this.over && this.pauseHit(p.x / R, p.y / R)) { this.pauseGame(); return; }
      if (this.over) { // the end screen: only its two buttons do something
        if (this.time.now <= this.restartAt) return;
        const b = this.endBtns.find(b => Math.abs(p.x / R - b.x) <= b.w / 2 && Math.abs(p.y / R - b.y) <= b.h / 2);
        if (b) { sfx('tap'); b.action(); }
        return;
      }
      if (this.dragId !== null) return;
      this.dragId = p.id;
      this.dragFrom.set(p.x / R, p.y / R); // pointer is in canvas pixels, the game is R times smaller
      this.finger.copy(this.dragFrom);
      this.shipFrom.set(this.target.x, this.target.y); // from the target, so no jump while the ship is still catching up
      this.lastFinger.copy(this.finger); this.dragLive = false; // drag: the witch only follows after the thumb has moved dragSlopPx
      if (this.stickMode) this.stickC.copy(this.finger); // the ring appears under the thumb
    });
    this.input.on('pointermove', p => {
      if (this.paused) { if (p.isDown && this.pauseUi) this.pauseVolume(p.x / R); return; } // drag a volume slider
      if (this.mouseMode) { this.mouseSeen = true; return; }
      if (p.id !== this.dragId || !p.isDown || this.over) return;
      this.finger.set(p.x / R, p.y / R);
      // (drag: the witch is moved in moveShip from the finger's movement each frame)
    });
    const release = p => { if (this.tune) this.tune.release(); if (p.id === this.dragId) { this.dragId = null; if (this.stickMode) this.stickC.set(W / 2, C.stick.restY); } };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    // ?debug=1: a small line under the version (drawing mode, speed, controls) so a problem on one device can be read off the screen
    this.dbg = q.get('debug') ? this.add.text(4, 38, '', { fontSize: '8px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }).setDepth(90) : null;
    this.dbgAt = 0;
    const glOk = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })(); // can this browser make a WebGL picture at all?
    this.dbgInfo = () => 'v' + C.version + ' ' + (this.game.config.renderType === Phaser.WEBGL ? 'WEBGL' : 'CANVAS') + ' gl:' + (glOk ? 'yes' : 'no') + ' ' + Math.round(this.game.loop.actualFps) + 'fps ' + (this.mouseMode ? 'mouse' : (this.stickMode ? 'stick' : 'drag'));

    // Collisions
    this.physics.add.overlap(this.bullets, this.enemies, (b, e) => this.bulletHitsEnemy(b, e));
    this.physics.add.overlap(this.bullets, this.crates, (b, c) => this.bulletHitsCrate(b, c));
    this.physics.add.overlap(this.ship, this.enemyBullets, (s, b) => { this.kill(b); this.hurtPlayer(); });
    this.physics.add.overlap(this.ship, this.enemies, (s, e) => { if (e.onScreen && this.hurtPlayer() && C.ship.ramKillsEnemy) this.crashEnemy(e); });
    this.physics.add.overlap(this.ship, this.coins, (s, c) => {
      this.kill(c); sfx('coin'); this.coinsCollected++; this.addScore(C.coin.value);
      addBank(1); this.coinsBanked++; // saved at once, so dying or leaving keeps it
      this.pop(c.x, c.y, '+' + C.coin.value);
      this.burst(c.x, c.y, C.feel.coinSparkCount, COIN_TINTS, C.feel.coinSparkSpeedMul, 3); // coin pop
    }, (s, c) => this.pulledIn(c));
    this.physics.add.overlap(this.ship, this.weaponUps, (s, p) => { this.kill(p); this.weaponUp(); }, (s, p) => this.pulledIn(p));
    this.physics.add.overlap(this.ship, this.heartUps, (s, p) => { this.kill(p); this.heartUp(p.x, p.y); }, (s, p) => this.hearts < C.ship.hearts && this.pulledIn(p)); // with all hearts full the heart is not picked up: it keeps falling and can be caught after a hit
    // (crates are in no ship overlap: the ship flies through them)
  }

  // ---------- setup ----------
  makeBackground() {
    const B = C.background;
    const bg = this.bg;
    if (bg !== 'sky') { this.makeForest(bg === 'swamp' ? 'swamp' : 'forest'); return; }
    const sky = this.add.graphics().setDepth(-10);
    const steps = 32;
    for (let i = 0; i < steps; i++) {
      const col = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(B.skyTop), Phaser.Display.Color.IntegerToColor(B.skyBottom), steps, i);
      sky.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1);
      sky.fillRect(0, (H / steps) * i, W, H / steps + 1);
    }
    const layer = (key, count, scale, alpha, speed, depth) => {
      const items = [];
      for (let i = 0; i < count; i++) {
        const s = this.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), key)
          .setScale(scale).setAlpha(alpha).setDepth(depth);
        items.push(s);
      }
      return { items, speed };
    };
    this.layers = [
      layer('cloudFar', B.farCount, 4, 0.35, B.farScroll, -9),
      layer('cloudNear', B.nearCount, 6, 0.6, B.nearScroll, -8)
    ];
  }

  // Lighter grass blobs for the forest floor: random roundish shapes with a grainy edge, drawn once as small pixel textures
  // (one texel = F.blobCell game px). Several variants, each a wobbly oval; the edge cells are dropped at random so it looks like grass, not a stamp.
  makeBlobTextures() {
    const F = this.bgF;
    for (let v = 0; v < F.blobVariants; v++) {
      const key = 'blob-' + v;
      if (this.textures.exists(key)) continue;
      const wTex = Phaser.Math.Between(F.blobSize[0], F.blobSize[1]), hTex = Math.round(wTex * Phaser.Math.FloatBetween(0.55, 1.0));
      const cv = this.textures.createCanvas(key, wTex, hTex), ctx = cv.getContext('2d');
      const p1 = Math.random() * TAU, p2 = Math.random() * TAU, p3 = Math.random() * TAU;
      const col = '#' + F.blobColor.toString(16).padStart(6, '0'), col2 = '#' + F.blobColor2.toString(16).padStart(6, '0');
      for (let y = 0; y < hTex; y++) for (let x = 0; x < wTex; x++) {
        const dx = (x + 0.5 - wTex / 2) / (wTex / 2), dy = (y + 0.5 - hTex / 2) / (hTex / 2);
        const a = Math.atan2(dy, dx), r = Math.hypot(dx, dy);
        const edge = 0.72 + 0.14 * Math.sin(2 * a + p1) + 0.1 * Math.sin(3 * a + p2) + 0.06 * Math.sin(5 * a + p3); // wobbly outline
        if (r > edge) continue;
        if (r > edge - 0.16 && Math.random() < (r - (edge - 0.16)) / 0.16 * 0.8) continue; // grainy edge
        ctx.fillStyle = (r < edge * 0.55 && Math.random() < 0.12) ? col2 : col; // a few lighter specks inside
        ctx.fillRect(x, y, 1, 1);
      }
      cv.refresh();
    }
  }

  // Forest seen from above: a plain green floor with props (patches, bushes, stumps, trees) that scroll down and are reused.
  // theme = 'forest' or 'swamp': the numbers come from config.background[theme]. The swamp has F.files (its own pictures, some animated).
  makeForest(theme) {
    const F = C.background[theme];
    this.bgF = F;
    this.add.rectangle(0, 0, W, H, F.groundColor).setOrigin(0, 0).setDepth(-10);
    // The kit hands out pictures: kit.tree() / bush() / small() / rock() / bigRock() each return {key, frame, sway (forest tree), n (frames of an animation)}.
    let kit;
    const pick = a => a[Math.floor(Math.random() * a.length)];
    if (F.files) kit = this.makeSwampKit(F, pick);
    else kit = this.makeForestKit(F, pick);
    this.makeBlobTextures();
    const range = r => r[0] + Math.random() * (r[1] - r[0]);
    // scaleRange (swamp props) = multiplier of the picture size; else the picture is scaled to this width on screen
    const sized = (s, wRange, scaleRange) => s.setScale(scaleRange ? range(scaleRange) : range(wRange) / s.width);
    // Gives the sprite a picture of the kit (and tells the scroll code whether it sways / animates).
    const use = (s, e) => {
      s.setTexture(e.key, e.frame); s.treeName = e.sway || null; s.animN = e.n || 0;
      if (s.swayPh === undefined) s.swayPh = Math.random() * 8;
    };
    this.rockKit = kit; // the cats sit on the same rocks as the background
    this.makeBackgroundLayers(F, kit, use, sized, range, pick);
  }

  // Forest pictures: cut the sheet once, build the tree sway atlas, return the kit.
  makeForestKit(F, pick) {
    const tex = this.textures.get('forestPlants');
    if (!tex.has('tree-0-0')) {
      const img = tex.getSourceImage();
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, cv.width, cv.height).data;
      const add = (name, b) => tex.add(name, 0, b.x, b.y, b.w, b.h);
      findSprites(d, cv.width, cv.height, 0, 690).forEach((row, r) => row.forEach((b, i) => add('tree-' + r + '-' + i, b)));
      findSprites(d, cv.width, cv.height, 690, cv.width).forEach((row, k) => row.forEach((b, i) => add((k % 2 === 0 ? 'bush-' : 'small-') + (k >> 1) + '-' + i, b)));
    }
    const rows = F.treeRows, wts = F.treeRowWeights, wsum = wts.reduce((a, b) => a + b, 0);
    const pickRow = () => { let n = Math.random() * wsum; for (let i = 0; i < rows.length; i++) { n -= wts[i]; if (n < 0) return rows[i]; } return rows[0]; };
    const frames = (key, prefix) => this.textures.get(key).getFrameNames().filter(n => n.startsWith(prefix));
    const treeNames = frames('forestPlants', 'tree-'), bushNames = frames('forestPlants', 'bush-'), smallNames = frames('forestPlants', 'small-');
    // Tree sway: every tree picture has 3 versions (leaning left, straight, leaning right) made by shifting whole pixel rows (top the most).
    // The trees step between them a few times a second, each with its own timing, so the sway stays pixel-sharp (no smooth rotation).
    this.makeTreeSwayAtlas(treeNames.filter(n => rows.includes(+n.split('-')[1])));
    const rockTex = this.textures.get('forestRocks');
    if (!rockTex.has('big-0')) {
      ROCKS.big.forEach((r, i) => rockTex.add('big-' + i, 0, r[0], r[1], r[2], r[3]));
      ROCKS.small.forEach((r, i) => rockTex.add('small-' + i, 0, r[0], r[1], r[2], r[3]));
    }
    // Entries are made once here, so picking one later allocates nothing. By colour row: {0: [...], 2: [...], 4: [...]}.
    const byRow = (names, mk) => { const o = {}; rows.forEach(r => { o[r] = names.filter(n => +n.split('-')[1] === r).map(mk); }); return o; };
    const treeE = byRow(treeNames, n => ({ key: 'treeSway', frame: n + '|1', sway: n }));
    const bushE = byRow(bushNames, n => ({ key: 'forestPlants', frame: n })), smallE = byRow(smallNames, n => ({ key: 'forestPlants', frame: n }));
    const rockE = ROCKS.small.map((r, i) => ({ key: 'forestRocks', frame: 'small-' + i })), bigE = ROCKS.big.map((r, i) => ({ key: 'forestRocks', frame: 'big-' + i }));
    return { tree: () => pick(treeE[pickRow()]), bush: () => pick(bushE[pickRow()]), small: () => pick(smallE[pickRow()]), rock: () => pick(rockE), bigRock: () => pick(bigE) };
  }

  // Swamp pictures: every file of config.background.swamp.files is a texture 'sw-<name>'. A name ending in _anim is a strip of
  // animFrames pictures side by side: cut it into frames a0, a1, ... (the strip is as high as one picture).
  makeSwampKit(F, pick) {
    const made = {};
    const ent = n => {
      if (made[n]) return made[n];
      const key = 'sw-' + n, tex = this.textures.get(key);
      if (!n.endsWith('_anim')) return (made[n] = { key, frame: '__BASE', n: 0 });
      const img = tex.getSourceImage(), fw = img.width / F.animFrames;
      if (!tex.has('a0')) for (let i = 0; i < F.animFrames; i++) tex.add('a' + i, 0, i * fw, 0, fw, img.height);
      return (made[n] = { key, frame: 'a0', n: F.animFrames });
    };
    const list = names => names.map(ent);
    const treeE = list(F.files.trees), bushE = list(F.files.bushes), smallE = list(F.files.smalls), rockE = list(F.files.rocks), bigE = list(F.files.bigRocks);
    return { tree: () => pick(treeE), bush: () => pick(bushE), small: () => pick(smallE), rock: () => pick(rockE), bigRock: () => pick(bigE) };
  }

  // The scrolling background itself (floor, pools, edge walls, path props, rocks, light), the same for every theme.
  makeBackgroundLayers(F, kit, use, sized, range, pick) {
    // EDGE WALLS: tree tops on the left (side -1) and right (side +1). The tree centre is off screen, only the canopy reaches in.
    const edgeItems = [];
    const placeEdge = (s, first, i) => {
      use(s, kit.tree());
      sized(s, F.edgeWidth);
      const inset = range(F.edgeInset);
      s.x = s.side < 0 ? inset - s.displayWidth / 2 : W - inset + s.displayWidth / 2;
      s.setFlipX(Math.random() < 0.5);
      if (first) { s.y = H + 60 - i * (F.edgeStepY[0] + F.edgeStepY[1]) / 2 + Phaser.Math.Between(-6, 6); return; }
      let top = Infinity; // the highest tree top of this side: the new one goes above it (and fully above the screen)
      for (const o of edgeItems) if (o !== s && o.side === s.side && o.y < top) top = o.y;
      s.y = Math.min(top - range(F.edgeStepY), -s.displayHeight / 2);
    };
    for (const side of [-1, 1]) for (let i = 0; i < F.edgeCount; i++) {
      const e0 = kit.tree();
      const s = this.add.image(0, 0, e0.key, e0.frame).setDepth(-8);
      s.side = side;
      placeEdge(s, true, i);
      this.addTreeShadow(s);
      edgeItems.push(s);
    }

    // MIDDLE PATH: a few single props that come back from above after a random gap.
    // One function places every single prop of the path (rocks, trees, bushes, stumps, firs) so that they do not sit on top of
    // each other (only a bush under a tree now and then, F.bushUnderTreeChance) and so that neighbours zigzag left and right
    // (diagonal look, F.zigzag = chance that the next prop goes to the other side of the path than the last one).
    const placed = [];
    let lastSide = 1;
    const isRock = o => o.kind === 'rock' || o.kind === 'bigrock';
    const placeFree = (s, first, gap) => {
      const under = Math.random() < F.bushUnderTreeChance;
      const clash = (x, y) => placed.some(o => {
        if (o === s) return false;
        if (under && ((s.kind === 'bush' && o.kind === 'tree') || (s.kind === 'tree' && o.kind === 'bush'))) return false;
        if (isRock(s) && isRock(o) && Math.hypot(o.x - x, o.y - y) < Math.max(s.kind === 'bigrock' ? F.bigRockMinDist : F.rockMinDist, o.kind === 'bigrock' ? F.bigRockMinDist : F.rockMinDist)) return true;
        return Math.abs(o.x - x) < (s.displayWidth + o.displayWidth) / 2 + F.propGap && Math.abs(o.y - y) < (s.displayHeight + o.displayHeight) / 2 + F.propGap;
      });
      const x0 = F.midMargin + s.displayWidth / 2, x1 = W - F.midMargin - s.displayWidth / 2;
      let x = 0, y = 0, side = 1;
      for (let t = 0; t < 30; t++) {
        side = Math.random() < F.zigzag ? -lastSide : (Math.random() < 0.5 ? -1 : 1);
        // left third / right third, the middle is left free. Big trees keep their whole picture out of the centre lane (F.treeLaneHalf).
        if (s.kind === 'tree') { // the tree's centre is at least treeLaneHalf from the middle line and at least treeEdge from the screen edge
          x = side < 0 ? Phaser.Math.Between(F.treeEdge, W / 2 - F.treeLaneHalf) : Phaser.Math.Between(W / 2 + F.treeLaneHalf, W - F.treeEdge);
        } else if (isRock(s)) { // rocks too stay to the sides: centre at least rockLaneHalf from the middle line (they may sit under the canopy edge)
          x = side < 0 ? Phaser.Math.Between(F.rockEdge, W / 2 - F.rockLaneHalf) : Phaser.Math.Between(W / 2 + F.rockLaneHalf, W - F.rockEdge);
        } else {
          x = side < 0 ? Phaser.Math.Between(x0, Math.max(x0, W * 0.44)) : Phaser.Math.Between(Math.min(x1, W * 0.56), x1);
        }
        y = first ? Phaser.Math.Between(-20, H) : -s.displayHeight / 2 - Math.random() * gap;
        if (!clash(x, y)) break;
        if (t === 29) y -= 200; // no free spot found: wait a bit longer above the screen
      }
      lastSide = side; s.x = x; s.y = y;
    };
    const placeMid = (s, first) => placeFree(s, first, F.midGapY);
    const mid = (count, next, wRange, scaleRange, depth, kind) => { // next() = the kit function that gives a picture
      const items = [];
      const choose = s => { use(s, next()); sized(s, wRange, scaleRange); s.setFlipX(Math.random() < 0.5); };
      for (let i = 0; i < count; i++) {
        const e0 = next();
        const s = this.add.image(0, 0, e0.key, e0.frame).setDepth(depth);
        s.kind = kind; placed.push(s);
        choose(s); placeMid(s, true);
        if (kind === 'tree') this.addTreeShadow(s);
        items.push(s);
      }
      return { items, speed: F.scroll, respawn: s => { choose(s); placeMid(s, false); }, depth };
    };
    const patch = () => 'blob-' + Math.floor(Math.random() * F.blobVariants);
    const patches = [];
    for (let i = 0; i < F.patchCount; i++) {
      const s = this.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), patch()).setScale(F.blobCell).setDepth(-9.5);
      patches.push(s);
    }
    // ROCKS on the path floor: a few small ones, kept apart from each other, and a big one only now and then (cats will sit on the big ones).
    const rocks = [];
    const chooseRock = s => {
      use(s, s.big ? kit.bigRock() : kit.rock());
      s.setScale(s.big ? F.bigRockScale : range(F.rockScale)).setFlipX(Math.random() < 0.5);
    };
    const placeRock = (s, first) => placeFree(s, first, s.big ? F.bigRockGapY : F.rockGapY);
    const addRocks = (count, big) => {
      for (let i = 0; i < count; i++) {
        const e0 = big ? kit.bigRock() : kit.rock();
        const s = this.add.image(0, 0, e0.key, e0.frame).setDepth(big ? -9.1 : -9.2);
        s.big = big; s.kind = big ? 'bigrock' : 'rock'; chooseRock(s);
        rocks.push(s); placed.push(s);
        if (big) placeFree(s, false, F.bigRockGapY * 0.5); // the first big rock comes soon, later ones are rarer
        else placeRock(s, true);
      }
    };
    addRocks(F.rockCount, false);
    addRocks(F.bigRockCount, true);
    this.layers = [
      { items: rocks, speed: F.scroll, respawn: s => { chooseRock(s); placeRock(s, false); } },
      { items: patches, speed: F.scroll, respawn: s => { s.setFrame(patch()).setFlipX(Math.random() < 0.5); s.x = Phaser.Math.Between(0, W); s.y = -s.displayHeight / 2 - Math.random() * 140; } },
      mid(F.midSmallCount, kit.small, F.midSmallWidth, F.midSmallScale, -9, "small"),
      mid(F.midBushCount, kit.bush, F.midBushWidth, F.midBushScale, -8.5, "bush"),
      mid(F.midTreeCount, kit.tree, F.midTreeWidth, null, -7.5, "tree"),
      { items: edgeItems, speed: F.scroll, respawn: s => placeEdge(s, false), depth: -8, depthK: 0.0003 } // depthK: lower on screen = drawn in front
    ];

    // LIGHT: soft cloud shadows drifting over the floor (they scroll faster than the floor, like clouds high above) and a few
    // pale light shafts that fade in and out. All below the witch, enemies and shots, so nothing gameplay is ever darkened or hidden.
    const Lt = F.light;
    this.shafts = [];
    if (Lt.on) {
      this.makeLightTextures();
      const leaf = () => 'cloud-' + Math.floor(Math.random() * Lt.shadowVariants);
      const placeShadow = (s, first) => { s.x = Phaser.Math.Between(0, W); s.y = first ? Phaser.Math.Between(0, H) : -s.displayHeight / 2 - Math.random() * Lt.shadowGapY; };
      const shadows = [];
      for (let i = 0; i < Lt.shadowCount; i++) {
        const s = this.add.image(0, 0, leaf()).setScale(Lt.shadowCell).setAlpha(Lt.shadowAlpha).setDepth(Lt.depth);
        placeShadow(s, true); shadows.push(s);
      }
      this.layers.push({ items: shadows, speed: F.scroll * Lt.shadowSpeedMul, dx: Lt.shadowDrift, respawn: s => { s.setTexture(leaf()).setFlip(Math.random() < 0.5, Math.random() < 0.5); placeShadow(s, false); } });
      for (let i = 0; i < Lt.shaftCount; i++) {
        const s = this.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(60, H - 60), 'shaft').setScale(Lt.shaftScale[0], Lt.shaftScale[1])
          .setRotation(Phaser.Math.DegToRad(Lt.shaftAngleDeg)).setAlpha(0).setDepth(Lt.depth + 0.1);
        s.phase = Math.random() * TAU; s.rate = Lt.shaftPulse * (0.7 + Math.random() * 0.6);
        this.shafts.push(s);
      }
    }
  }

  // Textures for the light effects, drawn once in code. Cloud shadow = overlapping big soft discs (one texel = shadowCell game px).
  // Shaft = a narrow soft-edged pale stripe that fades out at both ends.
  makeLightTextures() {
    const Lt = this.bgF.light;
    for (let v = 0; v < Lt.shadowVariants; v++) {
      const key = 'cloud-' + v;
      if (this.textures.exists(key)) continue;
      // A cloud shadow: 4-6 overlapping big discs with soft edges (alpha falls off towards the rim), drawn in a few strength steps.
      const n = Lt.shadowSize, cv = this.textures.createCanvas(key, n, n), ctx = cv.getContext('2d');
      const discs = [];
      const cnt = Phaser.Math.Between(4, 6);
      for (let i = 0; i < cnt; i++) discs.push({ x: n * (0.3 + Math.random() * 0.4), y: n * (0.3 + Math.random() * 0.4), r: n * (0.16 + Math.random() * 0.14) });
      const rgb = [(Lt.shadowColor >> 16) & 255, (Lt.shadowColor >> 8) & 255, Lt.shadowColor & 255].join(',');
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        let a = 0;
        for (const c of discs) a = Math.max(a, 1 - Math.hypot(x + 0.5 - c.x, y + 0.5 - c.y) / c.r); // 1 in the middle of a disc, 0 at its rim
        if (a <= 0) continue;
        a = Math.min(1, a * 2.2); // a wide even middle, a soft edge
        ctx.fillStyle = 'rgba(' + rgb + ',' + (Math.round(a * 5) / 5).toFixed(2) + ')'; // 5 steps: a gentle pixel-art banding
        ctx.fillRect(x, y, 1, 1);
      }
      cv.refresh();
    }
    if (!this.textures.exists('shaft')) {
      const w = 16, h = 128, cv = this.textures.createCanvas('shaft', w, h), ctx = cv.getContext('2d');
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const a = (1 - Math.abs(x + 0.5 - w / 2) / (w / 2)) * Math.sin(Math.PI * (y + 0.5) / h); // soft in x and at both ends in y
        ctx.fillStyle = 'rgba(255,244,200,' + Math.max(0, a).toFixed(3) + ')';
        ctx.fillRect(x, y, 1, 1);
      }
      cv.refresh();
    }
  }

  // One atlas with 3 versions of every tree picture we use: leaning left (-), straight, leaning right (+). Row y of the picture is shifted
  // sideways by a whole number of pixels: px x ((1 - y/height) ^ curve), so the top moves most and the foot stays put. Made once.
  makeTreeSwayAtlas(names) {
    const S = this.bgF.sway;
    if (this.textures.exists('treeSway')) return;
    const src = this.textures.get('forestPlants'), img = src.getSourceImage();
    const fr = names.map(n => { const f = src.get(n); return { n, x: f.cutX, y: f.cutY, w: f.cutWidth, h: f.cutHeight }; });
    const pad = S.px, cw = Math.max(...fr.map(f => f.w)) + 2 * pad, ch = Math.max(...fr.map(f => f.h)) + 2;
    const per = Math.floor(2048 / cw), rowsN = Math.ceil(fr.length * 3 / per);
    const cv = this.textures.createCanvas('treeSway', per * cw, rowsN * ch), ctx = cv.getContext('2d');
    const cuts = [];
    let k = 0;
    fr.forEach(f => [-1, 0, 1].forEach((dir, v) => {
      const ox = (k % per) * cw, oy = Math.floor(k / per) * ch; k++;
      for (let y = 0; y < f.h; y++) {
        const shift = Math.round(dir * S.px * Math.pow(1 - y / f.h, S.curve));
        ctx.drawImage(img, f.x, f.y + y, f.w, 1, ox + pad + shift, oy + y, f.w, 1);
      }
      cuts.push([f.n + '|' + v, ox, oy, f.w + 2 * pad, f.h]);
    }));
    cv.refresh();
    cuts.forEach(c => cv.add(c[0], 0, c[1], c[2], c[3], c[4]));
  }

  // The tree steps through left - straight - right - straight - left ...; every tree has its own start (swayPh).
  swayTree(s) {
    const S = this.bgF.sway;
    if (s.animN) { // animated strip: all frames in a loop, each sprite with its own start
      const f = ANIM_FRAMES[Math.floor(this.time.now / 1000 * this.bgF.animFps + s.swayPh) % s.animN];
      if (s.frame.name !== f) s.setFrame(f);
      return;
    }
    if (!S.on) return;
    const name = s.treeName + '|' + [1, 2, 1, 0][Math.floor(this.time.now / 1000 * S.fps + s.swayPh) & 3];
    if (s.frame.name !== name) s.setFrame(name);
  }

  // Tree shadows: the tree's own picture, filled dark, flattened and tipped over from its base so it lies up and to the side (the sun is
  // low in the lower left). It follows the tree, so it moves down with the scroll. Below the trees, above the floor.
  addTreeShadow(tree) {
    const TS = this.bgF.treeShadow;
    if (!TS.on) return;
    tree.shadow = this.add.image(0, 0, tree.texture.key, tree.frame.name).setOrigin(0.5, 1).setTintFill(TS.color).setAlpha(TS.alpha).setDepth(TS.depth);
    this.syncTreeShadow(tree);
  }

  syncTreeShadow(tree) {
    const TS = this.bgF.treeShadow, sh = tree.shadow;
    if (!sh) return;
    if (sh.texture !== tree.texture) sh.setTexture(tree.texture.key, tree.frame.name);
    else if (sh.frame.name !== tree.frame.name) sh.setFrame(tree.frame.name);
    sh.setFlipX(tree.flipX).setScale(tree.scaleX, tree.scaleY * TS.lenMul).setRotation(Phaser.Math.DegToRad(TS.angleDeg))
      .setPosition(tree.x, tree.y + tree.displayHeight / 2); // pivot = the bottom centre of the tree picture
  }

  // Light shafts fade in and out slowly and drift sideways.
  updateShafts(dt) {
    const Lt = this.bgF.light;
    for (const s of this.shafts) {
      s.phase += dt * s.rate;
      s.setAlpha(Lt.shaftAlpha[0] + (Math.sin(s.phase) + 1) / 2 * (Lt.shaftAlpha[1] - Lt.shaftAlpha[0]));
      s.x += Lt.shaftDrift * dt;
      if (s.x > W + 40) s.x = -40;
    }
  }

  makePools() {
    const mk = (key, size) => this.physics.add.group({ defaultKey: key, maxSize: size });
    this.bullets = mk('pbullet', C.bullet.poolSize);
    this.enemyBullets = mk('ebullet', C.enemyBullet.poolSize);
    this.enemies = mk('grunt', C.enemies.poolSize);
    this.coins = mk('coin', C.coin.poolSize);
    if (this.shinePost) this.events.off('postupdate', this.shinePost); // (never call off() without the function: it would remove EVERY postupdate listener, physics included)
    // the shine follows its coin / potion / heart AFTER physics moved them (before, it was one frame behind: visible on fast coins)
    this.shinePost = () => { if (!this.coins) return; const t = this.time.now; this.updateShine(t); this.updateHeartShine(t); };
    this.events.on('postupdate', this.shinePost);
    this.shinePools = { coin: [], heart: [], potion: [] }; this.heartShineSp = null; // beams + glow + twinkle for every drop, made on demand
    this.crates = mk('crate', C.crate.poolSize);
    this.weaponUps = mk('weaponUp', C.pickup.weaponPoolSize);
    this.heartUps = mk('heartUp', C.pickup.heartPoolSize);
    this.sparks = this.add.group({ defaultKey: 'square', maxSize: C.particles.poolSize });
    this.flashPool = this.add.group({ defaultKey: 'square', maxSize: 30 }); // white hit-flash copies of enemies
    this.halos = this.add.group({ defaultKey: 'square', maxSize: C.pickup.haloPoolSize }); // glowing outlines of carriers
    this.glows = this.add.group({ defaultKey: 'enemyGlow', maxSize: C.enemies.glow.poolSize }); // a soft dark aura behind every enemy (not bosses)
    this.trail = this.add.group({ defaultKey: 'square', maxSize: C.feel.trailPoolSize }); // broom sparkles (own pool so bursts never starve it)
    this.fxGroups = [this.sparks, this.trail];
    // screen flash: one reused rectangle, below the enemy shots so it never hides them
    this.flash = this.add.rectangle(W / 2, H / 2, W, H, C.feel.flashColor, 1).setDepth(C.feel.flashDepth).setAlpha(0);
    this.flashT = 0;
    // colour wash over the whole play field so art from different packs looks like one palette (a flat colour at low strength; shots, coins and the HUD stay above it). ?tint=0 turns it off.
    const TN = C.tint, tq = new URLSearchParams(window.location.search).get('tint'), tb = new URLSearchParams(window.location.search).get('tintblend');
    if (TN && TN.on && tq !== '0' && TN[this.stageTheme]) this.add.rectangle(W / 2, H / 2, W, H, TN[this.stageTheme].color, TN[this.stageTheme].alpha).setBlendMode(tb !== null ? Number(tb) : (TN[this.stageTheme].blend || 0)).setDepth(TN.depth); // ?tintblend=4 = OVERLAY (only the CANVAS mode draws it: use ?render=canvas), 2 = multiply, 3 = screen
    this.rings = this.add.group({ defaultKey: 'fxRing', maxSize: C.feel.ringPoolSize });  // expanding ring puffs
    const K = C.sprites, mkFx = (n, tex) => { // one-shot animation sprites, made once; each hides itself when its animation ends
      const a = [];
      for (let i = 0; i < n; i++) a.push(this.add.sprite(0, 0, tex, 0).setActive(false).setVisible(false).on('animationcomplete', (anim, frame, sp) => { // a broken chest stays on its last frame, then fades out (crate.fadeHoldMs / fadeMs); everything else hides at once
        const hide = () => sp.setActive(false).setVisible(false);
        if (anim.key === 'crate_break' && C.crate.fadeMs > 0) this.tweens.add({ targets: sp, alpha: 0, delay: C.crate.fadeHoldMs, duration: C.crate.fadeMs, onComplete: hide });
        else hide();
      }));
      return a;
    };
    this.poofPool = K.poof ? mkFx(K.poof.poolSize, 'sp_poof') : [];
    this.fxPool = K.crate || K.heartPickup ? mkFx(K.fxPoolSize, K.crate ? 'sp_crate_break' : 'sp_heart_collect') : [];
    this.pops = []; // floating score texts, made once and reused
    for (let i = 0; i < C.feel.popPoolSize; i++) {
      this.pops.push(this.add.text(0, 0, '', { ...FONT, fontSize: fpx(C.feel.popTextSize) + 'px', color: hex(C.menu.pal.cream), stroke: hex(C.menu.pal.shadow), strokeThickness: 3 })
        .setOrigin(0.5).setDepth(30).setVisible(false));
    }
    // muzzle flash: two small white pixels at the nose, shown for a few ms on every volley
    this.muzzle = [0].map(() => this.add.image(0, 0, 'muzzleA').setScale(C.feel.muzzleSize).setAlpha(C.feel.muzzleAlpha).setDepth(C.ship.depth + 0.1).setVisible(false));
  }

  makeShip() {
    const SS = C.ship.spriteScale;
    // The witch is an animated sheet (3 columns x 4 rows of 24x32; rows: back view, flying right, front, flying left).
    const A = this.anims, fps = C.ship.animFps;
    const defs = { witch_n: [0, 1, 2, 1], witch_e: [3, 4, 5, 4], witch_w: [9, 10, 11, 10] };
    for (const key in defs) {
      if (!A.exists(key)) A.create({ key, frames: defs[key].map(f => ({ key: 'witch', frame: f })), frameRate: fps, repeat: -1 });
    }
    this.witchAnim = 'witch_n';
    this.ship = this.physics.add.sprite(W / 2, C.ship.startY, 'witch', 1).setScale(SS).setDepth(C.ship.depth); // above the colour tint (33)
    { // the muzzle flash must never sit above her sprite (a taller hat): find the top row of the art once and keep the flash a few px below it
      this.muzzleDy = C.ship.muzzleY;
      try {
        const fr = this.textures.getFrame('witch', 1), cv = document.createElement('canvas'); cv.width = fr.cutWidth; cv.height = fr.cutHeight;
        const cx = cv.getContext('2d'); cx.drawImage(fr.source.image, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, 0, 0, fr.cutWidth, fr.cutHeight);
        const d = cx.getImageData(0, 0, cv.width, cv.height).data; let top = 0;
        outer: for (; top < cv.height; top++) for (let x = 0; x < cv.width; x++) if (d[(top * cv.width + x) * 4 + 3] > 20) break outer;
        this.muzzleDy = Math.min(C.ship.muzzleY, (cv.height / 2 - top) * SS - 3);
      } catch (e) { /* keep the config value */ }
    }
    this.ship.play('witch_n');
    const ST = C.sprites.stunned; // stars and sparks circling over her head for a moment after a hit
    this.stunUntil = 0;
    this.stunFx = ST ? this.add.sprite(0, 0, 'sp_stunned', 0).setScale(ST.scale).setDepth(C.ship.depth + 0.2).setVisible(false) : null;
    const hb = 2 * C.ship.hitRadius / SS; // body size is in art pixels; centred on the sprite (hitbox stays tiny whatever the sprite size)
    this.ship.body.setSize(hb, hb);
    this.target = new Phaser.Math.Vector2(this.ship.x, this.ship.y); // where the finger wants the ship
  }

  // Ease the ship toward the target (light inertia, no overshoot) and bank it a little.
  // The finger sets the TARGET: ship start + finger movement x sensitivity. The ship eases toward it in moveShip().
  aimTarget() {
    const S = C.ship;
    this.target.x = Phaser.Math.Clamp(this.shipFrom.x + (this.finger.x - this.dragFrom.x) * S.dragSensitivity, S.margin, W - S.margin);
    this.target.y = Phaser.Math.Clamp(this.shipFrom.y + (this.finger.y - this.dragFrom.y) * S.dragSensitivity, S.margin, H - S.margin);
  }

  // Virtual stick art: a faint ring and a knob, above the game, below the end screen.
  // SWAMP LANTERNS: a few lanterns (all 5 pictures, mixed) stand beside the path and scroll with the ground. Each has a soft GREEN glow
  // (stepped rings, hard edges, flickers in steps) and 3 little bugs flying around it on whole pixels. Everything snaps to the pixel grid.
  makeLanterns() {
    this.lanterns = [];
    const LN = this.bg === 'swamp' ? C.background.swamp.lanterns : null;
    if (!LN || !LN.on) return;
    LN.files.forEach((f, i) => { if (!this.anims.exists('lan_' + i)) this.anims.create({ key: 'lan_' + i, frames: this.anims.generateFrameNumbers('lan_' + i, { start: 0, end: 7 }), frameRate: LN.fps, repeat: -1 }); });
    if (!this.textures.exists('lanternGlow')) { // rings of flat colour, one texel = glowCell game px (so the edges are chunky pixels, never smooth)
      const G = LN.glow, n = G.rings[G.rings.length - 1].r * 2 + 1, cv = this.textures.createCanvas('lanternGlow', n, n), ctx = cv.getContext('2d');
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const d = Math.hypot(x - (n - 1) / 2, y - (n - 1) / 2), ring = G.rings.find(r => d <= r.r);
        if (!ring) continue;
        ctx.fillStyle = hex(ring.color); ctx.globalAlpha = ring.alpha; ctx.fillRect(x, y, 1, 1);
      }
      cv.refresh();
    }
    if (!this.textures.exists('bugDot')) { const bc = this.textures.createCanvas('bugDot', 1, 1); bc.getContext('2d').fillStyle = hex(LN.bugColor); bc.getContext('2d').fillRect(0, 0, 1, 1); bc.refresh(); } // a coloured dot made once (no tint, so it is coloured in CANVAS too)
    for (let i = 0; i < LN.count; i++) {
      const L = { spr: this.add.sprite(0, 0, 'lan_0', 0).setDepth(LN.depth), glow: this.add.image(0, 0, 'lanternGlow').setScale(LN.glow.cell).setBlendMode(Phaser.BlendModes.ADD).setDepth(LN.depth - 0.05), bugs: [], ph: Math.random() * 10, side: i % 2 ? 1 : -1 };
      for (let b = 0; b < LN.bugs; b++) L.bugs.push({ s: this.add.image(0, 0, 'bugDot').setScale(LN.bugSize).setDepth(LN.depth + 0.1), r: 4 + Math.random() * 5, w: (0.8 + Math.random() * 1.2) * (Math.random() < 0.5 ? -1 : 1), p: Math.random() * TAU, k: 1 + Math.random() * 0.8 });
      this.lanterns.push(L);
      this.placeLantern(L, true, i);
    }
  }

  placeLantern(L, first, i = 0) {
    const LN = C.background.swamp.lanterns, k = Phaser.Math.Between(0, LN.files.length - 1), f = LN.files[k];
    L.f = f; L.spr.setTexture('lan_' + k, 0).play('lan_' + k); L.spr.anims.setCurrentFrame(L.spr.anims.currentAnim.frames[Phaser.Math.Between(0, 7)]);
    L.spr.setScale(LN.scale).setFlipX(Math.random() < 0.5);
    L.side = -L.side;
    const lane = LN.laneX[L.side < 0 ? 0 : 1];
    L.fx = Phaser.Math.Between(lane[0], lane[1]);
    L.fy = first ? H * (0.15 + 0.35 * i) + Phaser.Math.Between(-20, 20) : -f.h * LN.scale - Phaser.Math.Between(LN.gapY[0], LN.gapY[1]);
  }

  updateLanterns(dt, time) {
    const LN = C.background.swamp.lanterns, G = LN.glow;
    const step = Math.floor(time / 1000 * LN.stepFps); // everything that wiggles changes in steps, like pixel art frames
    for (const L of this.lanterns) {
      L.fy += this.bgF.scroll * this.cloudMul * dt; // the exact position is kept here: the sprite only gets the rounded one (writing it back made the lantern drift against the ground)
      if (L.fy > H + L.f.h * LN.scale) this.placeLantern(L, false);
      const x = Math.round(L.fx), y = Math.round(L.fy), gy = Math.round(y + L.f.glowDy * LN.scale), gx = Math.round(x + L.f.glowDx * LN.scale * (L.spr.flipX ? -1 : 1));
      L.spr.setPosition(x, y);
      L.glow.setPosition(gx, gy).setAlpha(G.flicker[(step + Math.floor(L.ph)) % G.flicker.length]);
      for (const b of L.bugs) {
        const a = b.p + step * b.w * LN.bugSpeed;
        b.s.setPosition(Math.round(gx + Math.cos(a) * b.r), Math.round(gy + Math.sin(a * b.k) * b.r * 0.7)).setAlpha(((step + Math.floor(b.p * 3)) % 5 === 0) ? 0.35 : 1);
      }
    }
  }

  makeStickArt() {
    const T = C.stick;
    this.stickRing = this.add.graphics().setDepth(T.depth);
    this.stickRing.lineStyle(1.5, 0xffffff, 1).strokeCircle(0, 0, T.radius);
    this.stickKnob = this.add.graphics().setDepth(T.depth);
    this.stickKnob.fillStyle(0xffffff, 1).fillCircle(0, 0, T.knobRadius);
    this.stickRing.setVisible(this.stickMode && T.show); this.stickKnob.setVisible(this.stickMode && T.show); // T.show false = invisible stick (it still works)
  }

  // Soft walls: 1 = full speed; flying toward a wall (v points at it) inside stick.edgeZone px of it the speed eases down to stick.edgeSpeed at the wall. Used by the stick and by the drag.
  softWall(pos, v, lo, hi) { const T = C.stick; if (!(T.edgeZone > 0) || T.edgeSpeed >= 1 || !v) return 1; const d = v > 0 ? hi - pos : pos - lo, k = Phaser.Math.Clamp(d / T.edgeZone, 0, 1); return T.edgeSpeed + (1 - T.edgeSpeed) * k * k * (3 - 2 * k); }

  // Stick: pushing the knob away from the ring centre sets a speed. The ship's easing and tilt below still apply.
  stickTarget(dt) {
    const T = C.stick, S = C.ship, held = this.dragId !== null && !this.over;
    let dx = 0, dy = 0, len = 0;
    if (held) { dx = this.finger.x - this.stickC.x; dy = this.finger.y - this.stickC.y; len = Math.hypot(dx, dy); }
    const push = Math.min(len / T.radius, 1);
    // Wanted speed from the push (0 inside the dead zone). The witch follows it directly: only a very short ramp, no extra easing.
    let wx = 0, wy = 0;
    if (held && push > T.deadZone) {
      const m = Math.pow((push - T.deadZone) / (1 - T.deadZone), T.curve); // 0..1 after the dead zone
      wx = dx / len * m * T.speed; wy = dy / len * m * T.speed;
    }
    const s = this.ship;
    if (wx || wy) {
      this.stopping = false;
      const a = 1 - Math.exp(-T.response * dt);
      this.stickV.x += (wx - this.stickV.x) * a; this.stickV.y += (wy - this.stickV.y) * a;
    } else {
      // Thumb lifted (or resting in the dead zone): she glides a little further and settles with a small overshoot, like a soft spring,
      // instead of stopping dead. The rest point is where she would be after stopGlide seconds; a damped spring (stopOmega, stopDamping) pulls her there.
      if (!this.stopping) {
        this.stopping = true;
        this.stopDirX = Math.sign(this.stickV.x); // remember which way she was flying: the bounce back must not turn her
        this.stopT.set(Phaser.Math.Clamp(s.x + this.stickV.x * T.stopGlide, S.margin, W - S.margin), Phaser.Math.Clamp(s.y + this.stickV.y * T.stopGlide, S.margin, H - S.margin));
      }
      const sd = Math.min(dt, 0.04), w2 = T.stopOmega * T.stopOmega, c = 2 * T.stopDamping * T.stopOmega;
      this.stickV.x += (w2 * (this.stopT.x - s.x) - c * this.stickV.x) * sd;
      this.stickV.y += (w2 * (this.stopT.y - s.y) - c * this.stickV.y) * sd;
      if (Math.abs(this.stickV.x) < 1 && Math.abs(this.stickV.y) < 1 && Math.hypot(this.stopT.x - s.x, this.stopT.y - s.y) < 0.5) this.stickV.set(0, 0);
    }
    // Soft walls: flying TOWARD an edge she slows down smoothly inside edgeZone px of it (down to edgeSpeed at the wall); flying away or along is not slowed.
    const soft = (pos, v, lo, hi) => this.softWall(pos, v, lo, hi);
    this.target.x = Phaser.Math.Clamp(s.x + this.stickV.x * dt * soft(s.x, this.stickV.x, S.margin, W - S.margin), S.margin, W - S.margin);
    this.target.y = Phaser.Math.Clamp(s.y + this.stickV.y * dt * soft(s.y, this.stickV.y, S.margin, H - S.margin), S.margin, H - S.margin);
    const k = len > T.radius ? T.radius / len : 1; // knob stays inside the ring
    this.stickRing.setPosition(this.stickC.x, this.stickC.y).setAlpha(held ? T.ringAlpha : T.restAlpha);
    this.stickKnob.setPosition(this.stickC.x + dx * k, this.stickC.y + dy * k).setAlpha(held ? T.ringAlpha + 0.1 : T.restAlpha);
  }

  moveShip(dt) {
    const S = C.ship, s = this.ship;
    if (this.stickMode) this.stickTarget(dt);
    else if (this.mouseMode) {
      if (this.mouseSeen && !this.over) { const m = this.input.activePointer; this.target.x = Phaser.Math.Clamp(m.x / R, S.margin, W - S.margin); this.target.y = Phaser.Math.Clamp(m.y / R, S.margin, H - S.margin); }
    } else if (this.dragId !== null && !this.over) {
      // RELATIVE DRAG: the witch moves by the finger's movement x dragSensitivity (touch anywhere, swipe to reposition, a resting thumb moves nothing),
      // slowed near the walls when she flies toward them. No pull toward the finger, so she never drifts by herself.
      if (!this.dragLive) { if (Math.hypot(this.finger.x - this.dragFrom.x, this.finger.y - this.dragFrom.y) > S.dragSlopPx) this.dragLive = true; this.lastFinger.copy(this.finger); }
      else {
        const fx = (this.finger.x - this.lastFinger.x) * S.dragSensitivity, fy = (this.finger.y - this.lastFinger.y) * S.dragSensitivity;
        if (Math.abs(fx) + Math.abs(fy) > 0.2) this.lastMoveAt = this.time.now; // the finger is moving (the spring below catches up fast; it settles lazily when the finger rests)
        this.lastFinger.copy(this.finger);
        this.target.x = Phaser.Math.Clamp(this.target.x + fx * this.softWall(this.target.x, fx, S.margin, W - S.margin), S.margin, W - S.margin);
        this.target.y = Phaser.Math.Clamp(this.target.y + fy * this.softWall(this.target.y, fy, S.margin, H - S.margin), S.margin, H - S.margin);
      }
    }
    const SPR = S.spring, spring = SPR && !this.stickMode && !this.mouseMode;
    const px = s.x, py = s.y;
    if (spring) {
      // Spring toward the target: stiff and calm while the finger moves or after it is lifted, soft and a little bouncy only while the thumb is DOWN and resting (she coasts past, then drifts back slowly).
      const moving = this.dragId === null || this.time.now - (this.lastMoveAt || 0) < SPR.idleMs, w = moving ? SPR.fastW : SPR.slowW, z = moving ? SPR.fastZ : SPR.slowZ; // thumb lifted = the quick calm spring (she stops where the swipe put her); the soft bouncy one is only for a thumb that is down but resting
      this.shipV = this.shipV || { x: 0, y: 0 };
      const n = Math.max(1, Math.ceil(dt / 0.01)), h = dt / n;
      for (let i = 0; i < n; i++) {
        this.shipV.x += (w * w * (this.target.x - s.x) - 2 * z * w * this.shipV.x) * h;
        this.shipV.y += (w * w * (this.target.y - s.y) - 2 * z * w * this.shipV.y) * h;
        s.x += this.shipV.x * h; s.y += this.shipV.y * h;
      }
      if (s.x < S.margin) { s.x = S.margin; this.shipV.x = 0; } else if (s.x > W - S.margin) { s.x = W - S.margin; this.shipV.x = 0; }
      if (s.y < S.margin) { s.y = S.margin; this.shipV.y = 0; } else if (s.y > H - S.margin) { s.y = H - S.margin; this.shipV.y = 0; }
      if (Math.abs(this.target.x - s.x) < 0.1 && Math.abs(this.shipV.x) < 2) { s.x = this.target.x; this.shipV.x = 0; }
      if (Math.abs(this.target.y - s.y) < 0.1 && Math.abs(this.shipV.y) < 2) { s.y = this.target.y; this.shipV.y = 0; }
    } else {
      const k = this.stickMode ? 1 : 1 - Math.exp(-S.followRate * dt); // stick: no extra easing, the stick already sets the speed
      s.x += (this.target.x - s.x) * k;
      s.y += (this.target.y - s.y) * k;
      if (Math.abs(this.target.x - s.x) < 0.25) s.x = this.target.x;
      if (Math.abs(this.target.y - s.y) < 0.25) s.y = this.target.y;
    }
    const vx = dt > 0 ? (s.x - px) / dt : 0;
    this.vx = vx; this.vy = dt > 0 ? (s.y - py) / dt : 0;
    // Look (side view + tilt): during the soft stop only the forward glide counts, never the bounce back (it would turn her the other way).
    const vl = (this.stickMode && this.stopping && vx * this.stopDirX <= 0) ? 0 : vx;
    const dirKey = vl > S.sideSpeed ? 'witch_e' : (vl < -S.sideSpeed ? 'witch_w' : 'witch_n'); // side view when she flies sideways
    if (dirKey !== this.witchAnim) { this.witchAnim = dirKey; s.play(dirKey, true); }
    const want = Phaser.Math.Clamp(vl / S.bankSpeed, -1, 1) * Phaser.Math.DegToRad(S.bankDeg);
    s.rotation += (want - s.rotation) * (1 - Math.exp(-S.bankEase * dt));
  }

  // ---------- helpers ----------
  spawn(group, key, x, y, scale = PX) {
    const o = group.get(x, y, key);
    if (!o) return null; // pool full: skip, never create more
    o.setTexture(key).setActive(true).setVisible(true).setScale(scale).clearTint().setAlpha(1);
    o.kick = 0; o.ox = 0; o.oy = 0; // hit knock-back state
    o.body.enable = true;
    o.body.reset(x, y);
    o.body.setSize(o.width, o.height);
    return o;
  }

  kill(o) {
    o.setActive(false).setVisible(false);
    o.body.enable = false;
    o.body.setVelocity(0, 0);
  }

  // Start a one-shot animation sprite from a pool (no new objects). Returns it, or null when the pool is busy.
  playFx(pool, tex, anim, x, y, scale, depth, tint) {
    for (let i = 0; i < pool.length; i++) {
      const s = pool[i];
      if (s.active) continue;
      s.setTexture(tex).setPosition(x, y).setScale(scale).setDepth(depth).setAlpha(1).setActive(true).setVisible(true);
      if (tint === null || tint === undefined) s.clearTint(); else s.setTint(tint);
      s.play(anim);
      return s;
    }
    return null;
  }

  // ---------- pause ----------
  makePauseButton() {
    const B = C.pauseBtn, P = C.menu.pal, s = B.size;
    const g = this.add.graphics().setDepth(52);
    g.fillStyle(B.fill, 0.85).fillRoundedRect(B.x - s / 2, B.y - s / 2, s, s, 4);
    g.lineStyle(1, B.border, 1).strokeRoundedRect(B.x - s / 2 + 0.5, B.y - s / 2 + 0.5, s - 1, s - 1, 4);
    g.fillStyle(B.ink, 1).fillRect(B.x - 4, B.y - 4, 3, 8).fillRect(B.x + 1, B.y - 4, 3, 8); // two bars
    this.pauseBtnGfx = g;
  }

  pauseHit(x, y) { const B = C.pauseBtn; return Math.abs(x - B.x) <= B.hit / 2 && Math.abs(y - B.y) <= B.hit / 2; }

  pauseGame() {
    if (this.paused || this.over) return;
    this.paused = true; this.pauseAt = this.time.now;
    pauseSound(true); sfx('tap');
    this.physics.world.pause(); this.tweens.pauseAll(); this.anims.pauseAll();
    this.dragId = null; this.stickV.set(0, 0); this.stopping = false; this.stickC.set(W / 2, C.stick.restY);
    const P = C.menu.pal, ui = [];
    ui.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(70));
    ui.push(this.add.text(W / 2, H / 2 - 80, 'Paused', { ...FONT_TITLE, fontSize: '36px', color: hex(P.cream), stroke: hex(P.shadow), strokeThickness: z(5), align: 'center' }).setOrigin(0.5).setDepth(71));
    const box = this.add.container(0, 0, ui.slice(1)).setDepth(71); // everything but the dark veil
    this.pauseUi = { objs: ui, btnObjs: [], list: [], box };
    this.pauseButtons('main');
  }

  // the buttons of the pause screen: the main page, or the options page (sound, music)
  pauseButtons(page) {
    const B = C.pauseBtn, P = C.menu.pal, CR = hex(P.cream), ui = this.pauseUi.btnObjs;
    ui.forEach(o => o.destroy()); ui.length = 0;
    const rows = page === 'main' ? [['cont', 'Continue'], ['options', 'Options'], ['restart', 'Restart'], ['menu', 'Menu']]
      : [['sound', 'Sound'], ['music', 'Music'], ['back', 'Back']];
    this.pauseUi.list = rows.map(([id, label], i) => {
      const y = H / 2 - 25 + i * (B.btnH + B.gap);
      if (id === 'sound' || id === 'music') { // a label with a volume bar under it
        const bx = Math.round(W / 2 - VOL_W / 2), by = y + 6, g = this.add.graphics().setDepth(72);
        drawVolBar(g, bx, by, volume(id));
        ui.push(g, this.add.text(W / 2, y - 9, label, { ...FONT, fontSize: fpx(B.textSize) + 'px', color: CR, stroke: hex(P.shadow), strokeThickness: 3 }).setOrigin(0.5).setDepth(72));
        return { id, bar: true, bx, by, g };
      }
      if (this.textures.exists('ui_med-button')) ui.push(addSlice(this, W / 2 - B.btnW / 2, y - 12, buttonKey(this), B.btnW, 26, 10, 10, 0, 0).setOrigin(0, 0).setDepth(71));
      else { const gg = this.add.graphics().setDepth(71); drawPlate(gg, W / 2 - B.btnW / 2, y - B.btnH / 2, B.btnW, B.btnH, { fill: B.fill, border: B.border, down: false }); ui.push(gg); }
      const art = this.textures.exists('ui_med-button');
      ui.push(this.add.text(W / 2, y, label, { ...FONT, fontSize: fpx(B.textSize) + 'px', color: art ? BTN_INK : CR, stroke: hex(P.shadow), strokeThickness: art ? 0 : 3, align: 'center' }).setOrigin(0.5).setDepth(72));
      return { id, x: W / 2, y, w: B.btnW, h: B.btnH };
    });
    this.pauseUi.box.add(ui);
    popIn(this, this.pauseUi.box, W / 2, H / 2);
  }

  // a drag of the volume slider that was taken hold of (pause screen)
  pauseVolume(x) {
    const b = this.pauseUi.held;
    if (!b) return;
    const v = volFrom(x, b.bx);
    if (setVolume(b.id, v)) { drawVolBar(b.g, b.bx, b.by, v); if (b.id === 'sound') sfx('coin'); }
  }

  pauseTap(x, y) {
    if (this.pauseUi.closing) return;
    this.pauseUi.held = this.pauseUi.list.find(b => b.bar && volHit(x, y, b.bx, b.by)) || null;
    this.pauseVolume(x);
    const b = this.pauseUi.list.find(b => !b.bar && Math.abs(x - b.x) <= b.w / 2 && Math.abs(y - b.y) <= b.h / 2);
    if (!b) return;
    sfx('tap');
    if (b.id === 'cont') { this.pauseUi.closing = true; this.pauseUi.held = null; popOut(this, this.pauseUi.box, W / 2, H / 2, () => this.resumeGame()); } // the box shrinks away, then the game goes on
    else if (b.id === 'options') this.pauseButtons('options');
    else if (b.id === 'back') this.pauseButtons('main');
    else if (b.id === 'restart') { this.anims.resumeAll(); this.scene.restart(this.startData); } // start the stage again (the run so far is lost, nothing saved)
    else if (b.id === 'menu') { this.anims.resumeAll(); this.scene.start('Menu'); } // a pause never saves anything: leaving loses the run
  }

  resumeGame() {
    if (!this.paused) return;
    const d = this.time.now - this.pauseAt; // time deadlines move by the time spent paused
    this.invulnUntil += d; this.stunUntil += d; this.shipFlashUntil += d;
    [...this.pauseUi.objs, ...this.pauseUi.btnObjs, this.pauseUi.box].forEach(o => o.destroy()); this.pauseUi = null;
    this.physics.world.resume(); this.tweens.resumeAll(); this.anims.resumeAll();
    this.paused = false;
    pauseSound(false);
  }

  addScore(n) { this.score += n; this.hud.setScore(this.score, true); }
  syncMedals() { this.hud.setMedals(this.medals.state); }

  // ---------- gameplay ----------
  update(time, delta) {
    if (this.paused) return; // pause screen open: everything waits
    if (this.tune) { this.tune.update(time); if (this.tune.open) return; } // panel open = game paused
    if (this.freezeMs > 0 && !this.over) { // hit-stop: everything waits
      this.freezeMs -= delta;
      if (this.freezeMs <= 0) this.physics.world.resume();
      return;
    }
    const dt = Math.min(delta, 50) / 1000;
    this.scrollBackground(dt);
    this.updateLanterns(dt, time); // world things scroll with the ground ALWAYS (also on the game over screen)
    this.hud.update(dt, time);
    if (this.dbg && time > this.dbgAt) { this.dbgAt = time + 500; this.dbg.setText(this.dbgInfo()); }
    if (this.over) { // game over: the world keeps scrolling, so chests (not pickups, not enemies) keep moving with it too
      const ground = this.bgF.scroll * this.cloudMul * dt;
      this.crates.children.iterate(c => { if (c && c.active) { c.y += ground; c.body.reset(c.x, c.y); } });
      this.enemies.children.iterate(e => { if (e && e.active) this.decorEnemy(e, time); }); // outlines and flash copies keep following their enemies
      this.cats.update(dt); // cats and their rocks keep scrolling with the ground too (a cat that scrolls off now is not counted as lost)
      this.updateFx(dt); return;
    }

    if (this.leaving) { this.flyOff(time, dt); return; }
    this.moveShip(dt);
    this.updateShipFeel(dt);
    this.autoFire(time);
    this.runner.update(dt, this.enemyCount, this.hooks);
    this.cats.update(dt);
    this.updateEnemies(time, dt);
    this.updateCrates(time, dt);
    this.updateCoins(dt);
    this.cullOffscreen(time);
    if (!this.clearAt && this.runner.finished && this.cats.idle() && this.enemyCount === 0 && this.crates.countActive(true) === 0 && this.coins.countActive(true) === 0 && this.weaponUps.countActive(true) === 0 && this.heartUps.countActive(true) === 0) this.clearAt = time + C.stage.endDelayMs;
    if (this.clearAt && time >= this.clearAt) this.startFlyOff();
    this.updateFx(dt);

    // invulnerability blink
    if (time < this.invulnUntil) {
      this.ship.setAlpha(Math.floor(time / C.ship.blinkMs) % 2 ? 0.25 : 1);
    } else this.ship.setAlpha(1);
    if (time < this.shipFlashUntil) this.ship.setTintFill(0xb8ffd0); else this.ship.clearTint(); // level-up flash
    if (this.muzzle[0].visible) { if (time >= this.muzzleUntil) this.muzzle.forEach(m => m.setVisible(false)); else this.muzzle[0].setTexture(this.muzzleUntil - time > C.feel.muzzleMs / 2 ? 'muzzleA' : 'muzzleB'); } // big burst, then a small one
  }

  // End of the stage (last wave done, nothing left to pick up): the player lets go, she stops shooting, dips a little and shoots off the top.
  startFlyOff() {
    this.leaving = true;
    this.leaveV = C.stage.flyOffDip; // px/s, positive = down: the small wind-up
    this.dragId = null; if (this.stickC) this.stickC.set(W / 2, C.stick.restY);
    this.vx = this.vy = 0; this.recoil = 0;
    this.muzzle.forEach(m => m.setVisible(false));
    this.enemyBullets.children.iterate(b => { if (b && b.active) this.kill(b); }); // nothing can hit her now
    this.ship.setAlpha(1).clearTint().setFrame(1).setAngle(0).setScale(C.ship.spriteScale);
  }

  flyOff(time, dt) {
    this.leaveV -= C.stage.flyOffAccel * dt;
    this.ship.y += this.leaveV * dt;
    this.vy = Math.min(0, this.leaveV); // the clouds rush by and the broom trail thickens as she speeds up
    this.updateShipFeel(dt);
    this.cats.update(dt);
    this.updateFx(dt);
    if (this.ship.y < -C.stage.flyOffGone) this.stageClear();
  }

  scrollBackground(dt) {
    const F = C.feel; // clouds rush by faster when the witch flies up
    const want = 1 + F.cloudBoost * Phaser.Math.Clamp(-this.vy / C.ship.bankSpeed, 0, 1);
    this.cloudMul += (want - this.cloudMul) * (1 - Math.exp(-F.cloudEase * dt));
    for (const L of this.layers) for (const s of L.items) {
      s.y += L.speed * this.cloudMul * dt;
      if (L.dx) { s.x += L.dx * dt; if (s.x > W + 40) s.x = -40; } // slow sideways drift (leaf shadows)
      if (L.depthK) s.setDepth(L.depth + s.y * L.depthK);
      if (L.respawn) { if (s.y - s.displayHeight / 2 > H) L.respawn(s); } // forest: reuse the picture at the top
      if (s.treeName || s.animN) this.swayTree(s);
      if (s.shadow) this.syncTreeShadow(s);
      else if (s.y > H + 40) { s.y = -40; s.x = Phaser.Math.Between(0, W); }
    }
    if (this.shafts && this.shafts.length) this.updateShafts(dt);
  }

  // Broom sparkle trail (more sparks when moving) and the small recoil squash.
  updateShipFeel(dt) {
    const F = C.feel, S = C.ship, SS = S.spriteScale, sh = this.ship;
    if (F.recoilPx > 0) {
      this.recoil = Math.max(0, this.recoil - dt * 1000 / F.recoilMs);
      const k = F.recoilPx / (this.ship.height * SS) * this.recoil; // ship.height = witch art height in art px; k = fraction of the height
      sh.setScale(SS * (1 + k * 0.7), SS * (1 - k));
    }
    if (!F.trail) return;
    this.trailT -= dt;
    if (this.trailT > 0) return;
    const speed = Phaser.Math.Clamp(Math.hypot(this.vx, this.vy) / S.bankSpeed, 0, 1);
    this.trailT = Phaser.Math.Linear(F.trailIdleMs, F.trailMoveMs, speed) / 1000;
    this.emit(this.trail, sh.x + Phaser.Math.Between(-F.trailSpreadX, F.trailSpreadX), sh.y + F.trailY, -this.vx * F.trailCarry + Phaser.Math.Between(-F.trailJitter, F.trailJitter), F.trailSpeed - this.vy * F.trailCarry,
      F.trailLifeMs / 1000, Phaser.Math.FloatBetween(F.trailSize[0], F.trailSize[1]) * SS, F.trailColors[this.trailN++ % F.trailColors.length], C.ship.depth - 0.02, true); // colours go round in order, so the stream looks striped and colourful
  }

  // The saved upgrade levels, read at the start of a run (and again when the tune panel resets them).
  refreshUpgrades() {
    this.magnetLevel = loadLevel('magnet');
    this.damageMul = upgradeValue('damage', loadLevel('damage'), 1);
    this.fireMul = upgradeValue('fire', loadLevel('fire'), 1); // x the time between shots
  }
  magnetRadius() { const base = C.feel.magnetRadius; return base > 0 ? Math.max(base, upgradeValue('magnet', this.magnetLevel, base)) : 0; }

  // Coins, potions and (when a heart is missing) hearts close to the witch fly to her (magnet).
  updateCoins(dt) {
    const F = C.feel, R = this.magnetRadius();
    this.coins.children.iterate(c => { // the little hop of scattered coins turns back into the normal fall
      if (!c || !c.active || !c.hopping || c.mag) return;
      const vy = Math.min(C.coin.fallSpeed, c.body.velocity.y + C.coin.hopGravity * dt);
      c.body.setVelocityY(vy);
      c.hopping = vy < C.coin.fallSpeed;
    });
    if (R <= 0) return;
    const sh = this.ship;
    const need = this.hearts < C.ship.hearts;
    for (const grp of [this.coins, this.weaponUps, this.heartUps]) grp.children.iterate(c => {
      if (!c || !c.active) return;
      if (grp === this.heartUps && !need) { // all hearts full: no pull; one already on its way falls on again
        if (c.mag) { c.mag = false; c.setScale(c.s0); c.body.setVelocity(0, c.baseV); }
        return;
      }
      const dx = sh.x - c.x, dy = sh.y - c.y, d = Math.hypot(dx, dy);
      if (!c.mag && d < R) { c.mag = true; c.s0 = c.scaleX; c.body.setDragX(0); }
      if (!c.mag) return;
      if (d > 0.5) c.body.setVelocity(dx / d * F.magnetSpeed, dy / d * F.magnetSpeed);
      c.setScale(c.s0 * Phaser.Math.Clamp(0.3 + 0.7 * d / R, 0.3, 1)); // it shrinks as it is sucked into her
    });
  }

  // a magnet-pulled pickup is only taken once it has reached the middle of the witch
  pulledIn(o) { return !o.mag || Math.hypot(this.ship.x - o.x, this.ship.y - o.y) <= C.feel.magnetTakeDist; }

  // Fire one volley of the current weapon level (see weaponLevels in config.js).
  autoFire(time) {
    if (time < this.nextShot) return;
    const lv = C.weaponLevels[this.weaponLevel], sp = C.bullet.speed;
    const wait = lv.fireRateMs * this.fireMul * C.bullet.gap * C.bullet.refSpeed / sp; // spacing stays the same when only the speed changes
    // Shots only leave on a screen frame. Counting from when this shot was DUE (not from this frame) keeps the average right, so every FIRE SPEED level counts.
    this.nextShot = (time - this.nextShot < wait ? this.nextShot : time) + wait;
    for (const sh of lv.pattern) {
      const fs = C.bullet.fire;
      const b = this.spawn(this.bullets, fs ? (this.textures.exists('sp_fire_b') ? 'sp_fire_b' : 'sp_fire') : 'pbullet', this.ship.x + sh.dx, this.ship.y - C.ship.shotY, fs ? fs.scale : PX);
      if (!b) continue;
      b.setDepth(C.bullet.depth); // the witch's shots are above the colour tint too
      if (fs) { b.body.setSize(fs.hitW, fs.hitH); b.play('fire_shot'); } else b.anims.stop();
      const a = sh.deg * DEG;
      b.setRotation(a);
      b.dmg = (sh.dmg === undefined ? lv.damage : sh.dmg) * this.damageMul * C.difficulty.myDamage;
      b.body.setVelocity(Math.sin(a) * sp, -Math.cos(a) * sp);
    }
    const F = C.feel;
    this.muzzle.forEach((m, i) => m.setPosition(this.ship.x + (this.muzzle.length > 1 ? (i ? F.muzzleSpread : -F.muzzleSpread) : 0), this.ship.y - this.muzzleDy).setVisible(true));
    this.muzzleUntil = time + F.muzzleMs;
    sfx('shoot');
    this.recoil = 1;
  }

  spawnEnemy(cg, i) {
    const g = cg.g, cfg = C.enemies[g.type];
    this.hud.waveSpawned(cg.w);
    const sp = C.enemies.sprites[g.type]; // animated sheet or null (code-drawn)
    const e = this.spawn(this.enemies, sp ? 'en_' + g.type : g.type, cg.p.sx, cg.p.sy);
    if (!e) return;
    e.sp = sp || null; e.lastX = e.x; e.setDepth(C.enemies.depth); // above the colour tint
    if (sp) {
      e.setScale(sp.scale).setFlipX(false);
      e.body.setSize(sp.hitW, sp.hitH);
      e.play('en_' + g.type + '_loop');
    } else e.anims.stop(); // pooled sprite may still hold an animation from an earlier life
    initPath(e, cg.p, g.spd * C.difficulty.enemySpeed);
    e.kind = g.type; e.hp = Math.max(1, Math.round(cfg.hp * C.difficulty.enemyHp)); e.flashUntil = 0; e.flashSpr = null; e.onScreen = false;
    e.fire = g.fire || null; e.armed = false; e.fireT = 0;
    e.coin = g.type === 'shooter' || (g.coinEvery > 0 && (i + 1) % g.coinEvery === 0); // shooters always drop coins; how many is in config enemies
    e.wave = cg.w;
    e.drop = g.drop && i === g.n - 1 ? g.drop : null; // the last enemy of a marked group is the carrier
    e.halo = null; e.halos = null; e.glow = null;
    const GL = C.enemies.glow;
    if (GL.on && !cfg.noGlow) { // soft aura behind the enemy; the carrier outline stays stronger
      e.glow = this.glows.get(e.x, e.y, 'enemyGlow');
      if (e.glow) e.glow.setTexture('enemyGlow').setActive(true).setVisible(true).setBlendMode(GL.blend).setDepth(C.enemies.depth + GL.depth).setAlpha(GL.alpha).setScale(Math.max(e.displayWidth, e.displayHeight) * GL.sizeMul / (GL.texels * 2)).setTint(cfg.glowColor != null ? cfg.glowColor : this.enemyGlowColor(e, GL.color));
    }
    if (e.drop) {
      const key = 'ring_' + g.type + '_' + e.drop;
      if (sp) { // animated enemy: the outline is 4 solid-colour copies of its current frame, pushed up/down/left/right by haloPx. They follow the real shape, so the outline always fits (green = weapon, pink-white = heart)
        const H = C.enemies.haloPx, offs = [[-H, 0], [H, 0], [0, -H], [0, H]];
        e.halos = offs.map(o => { const h = this.halos.get(e.x, e.y, key); if (!h) return null; h.ox = o[0]; h.oy = o[1]; return h.setTexture('en_' + g.type, e.frame.name).setActive(true).setVisible(true).setScale(sp.scale).setTintFill(C.enemies.haloTint[e.drop]).setDepth(C.enemies.depth - 0.5); }).filter(Boolean);
      } else {
        e.halo = this.halos.get(e.x, e.y, key);
        if (e.halo) e.halo.setTexture(key).setActive(true).setVisible(true).setScale(PX).clearTint().setDepth(C.enemies.depth);
      }
    }
    this.hud.waveAlive(cg.w, 1);
    this.enemyCount++; this.enemiesSpawned++;
  }

  spawnCrate(cc) {
    const sp = C.sprites.crate;
    const c = this.spawn(this.crates, sp ? 'sp_crate_idle' : 'crate', cc.p.sx, cc.p.sy, sp ? sp.scale : PX);
    if (!c) return;
    if (sp) { c.body.setSize(sp.hitW, sp.hitH); c.play('crate_idle'); c.anims.setCurrentFrame(c.anims.currentAnim.frames[Phaser.Math.Between(0, sp.idle.frames - 1)]); } else c.anims.stop();
    c.setDepth(C.crate.depth); // on the ground: under the tree tops (they are at -8 and up), above shadows and rocks
    initPath(c, cc.p, C.crate.onGround ? this.bgF.scroll : cc.c.spd); // on the ground: moves exactly like the ground scrolls
    c.hp = cc.c.hp; c.coins = cc.c.coins; c.flashUntil = 0; c.onScreen = false;
  }

  // A copy of a sprite sheet with every visible pixel white (same frames). The hit flash shows it on top of the enemy.
  // (setTintFill, the usual way, only works in WebGL; some browsers draw in CANVAS mode, where it does nothing.)
  makeWhiteSheet(key) {
    const wk = key + '_w';
    if (this.textures.exists(wk)) return;
    const src = this.textures.get(key), img = src.getSourceImage(), cv = this.textures.createCanvas(wk, img.width, img.height), ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0); ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, img.width, img.height);
    cv.refresh();
    src.getFrameNames().forEach(n => { const f = src.get(n); cv.add(n, 0, f.cutX, f.cutY, f.cutWidth, f.cutHeight); });
  }

  // A copy of a sheet with every colour's hue turned by `deg` degrees (same frames, same brightness and see-through parts).
  makeHueSheet(key, newKey, deg, range = null, valueMul = 1, satMul = 1) { // range = [from, to] degrees: only colours with a hue inside it are turned (the cork and ribbon keep their colour)
    if (this.textures.exists(newKey)) return;
    const src = this.textures.get(key), img = src.getSourceImage(), cv = this.textures.createCanvas(newKey, img.width, img.height), ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, img.width, img.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const r = p[i] / 255, g = p[i + 1] / 255, b = p[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), c = mx - mn;
      if (c === 0) continue; // grey stays grey
      let h = mx === r ? ((g - b) / c) % 6 : (mx === g ? (b - r) / c + 2 : (r - g) / c + 4); h = (h * 60 + 360) % 360;
      if (range && (h < range[0] || h > range[1])) continue;
      h = ((h + deg) % 360 + 360) % 360;
      const v = mx * valueMul, sat = Math.min(1, (c / mx) * satMul), c2 = v * sat, x = c2 * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c2;
      const [rr, gg, bb] = h < 60 ? [c2, x, 0] : h < 120 ? [x, c2, 0] : h < 180 ? [0, c2, x] : h < 240 ? [0, x, c2] : h < 300 ? [x, 0, c2] : [c2, 0, x];
      p[i] = Math.round((rr + m) * 255); p[i + 1] = Math.round((gg + m) * 255); p[i + 2] = Math.round((bb + m) * 255);
    }
    ctx.putImageData(d, 0, 0); cv.refresh();
    src.getFrameNames().forEach(n => { const f = src.get(n); cv.add(n, 0, f.cutX, f.cutY, f.cutWidth, f.cutHeight); });
  }

  // Spinning rays: 8 wedges drawn as whole pixels. Next to the sprite a ray is S.widthStart px wide, at the tip S.widthEnd px, and it fades toward the tip (S.alphaEnd).
  // A pixel belongs to a ray when it lies along the ray (between inner and radius) and within half the ray's width at that distance. f = 0..2 turns the rays a bit further each picture.
  drawRays(ctx, S, f, color) {
    const n = ctx.canvas.width, M = (n - 1) / 2, R = Math.min(S.radius, M), w0 = S.widthStart || 2, w1 = S.widthEnd || 6, a1 = S.alphaEnd === undefined ? 0.2 : S.alphaEnd; // M = centre pixel of the fixed-size picture (so the tune panel can change the length live)
    ctx.clearRect(0, 0, n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const dx = x + 0.5 - (M + 0.5), dy = y + 0.5 - (M + 0.5), r = Math.hypot(dx, dy);
      if (r < S.inner || r > R) continue;
      const t = (r - S.inner) / (R - S.inner), width = w0 + (w1 - w0) * t;
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4 + f * Math.PI / 12, along = dx * Math.cos(a) + dy * Math.sin(a), perp = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));
        if (along > 0 && perp <= width / 2) { ctx.globalAlpha = 0.95 + (a1 - 0.95) * t; ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); break; }
      }
    }
    ctx.globalAlpha = 1;
  }

  // Draws the beams and glow of coin / heart / potion again from the current config numbers (the tune panel calls this after a change).
  rebuildRays() {
    for (const [kind, pre] of SHINE_KINDS) {
      const S = C.sprites[kind + 'Shine'];
      if (!S) continue;
      for (let f = 0; f < 3; f++) { const t = this.textures.get(pre + f); if (t && t.getContext) { this.drawRays(t.getContext(), S, f, S.rayColor); t.refresh(); } } // CanvasTexture: getContext() + refresh()
      const g = this.textures.get(kind + 'Glow');
      if (g && g.getContext) { this.drawGlow(g.getContext(), S); g.refresh(); }
    }
  }

  // The main colour of an enemy picture (cached per picture): the average of its solid pixels, weighted so strong colours count more than grey, then brightened a little for the glow.
  enemyGlowColor(e, fallback) {
    this.glowCache = this.glowCache || {};
    const fr = e.frame, key = e.texture.key + ':' + fr.name;
    if (this.glowCache[key] != null) return this.glowCache[key];
    let col = fallback;
    try {
      const cv = document.createElement('canvas'); cv.width = fr.cutWidth; cv.height = fr.cutHeight;
      const cx = cv.getContext('2d'); cx.drawImage(fr.source.image, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, 0, 0, fr.cutWidth, fr.cutHeight);
      const d = cx.getImageData(0, 0, cv.width, cv.height).data; let r = 0, g = 0, b = 0, w = 0;
      for (let k = 0; k < d.length; k += 4) {
        if (d[k + 3] < 200) continue;
        const mx = Math.max(d[k], d[k + 1], d[k + 2]), mn = Math.min(d[k], d[k + 1], d[k + 2]), sat = mx ? (mx - mn) / mx : 0, wt = 0.05 + sat * sat * (mx / 255); // bright, saturated pixels decide; dark outlines and grey barely count
        r += d[k] * wt; g += d[k + 1] * wt; b += d[k + 2] * wt; w += wt;
      }
      if (w > 0) {
        r /= w; g /= w; b /= w; const mx = Math.max(r, g, b) || 1, f = 255 / mx; // stretch to full brightness (keeps the hue)
        col = (Math.min(255, Math.round(r * f)) << 16) | (Math.min(255, Math.round(g * f)) << 8) | Math.min(255, Math.round(b * f));
      }
    } catch (err) { /* keep the fallback */ }
    return (this.glowCache[key] = col);
  }

  // Small pixel-art pictures made in code (no files): the muzzle flash at the wand and the shine behind a coin.
  makeShineTextures() {
    const pix = (key, rows, pal) => { // rows of characters, '.' = empty
      if (this.textures.exists(key)) return;
      const w = rows[0].length, h = rows.length, cv = this.textures.createCanvas(key, w, h), ctx = cv.getContext('2d');
      rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') { ctx.fillStyle = pal[ch]; ctx.fillRect(x, y, 1, 1); } }));
      cv.refresh();
    };
    const PR = C.feel.potionRing; // a thin big ring for the weapon pickup: a 1-2 px line drawn at its full size (the old ring picture was 9 px scaled up, so its line got thick)
    if (PR && !this.textures.exists('fxRingFine')) {
      const n = PR.diameter + 2, cv = this.textures.createCanvas('fxRingFine', n, n), ctx = cv.getContext('2d'); ctx.fillStyle = '#ffffff';
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const d = Math.hypot(x + 0.5 - n / 2, y + 0.5 - n / 2); if (Math.abs(d - PR.diameter / 2) <= PR.thick / 2) ctx.fillRect(x, y, 1, 1); }
      cv.refresh();
    }
    const GL = C.enemies.glow; // soft aura behind enemies: flat rings (like the lantern glow) of one warm dark colour, made once
    if (GL.on && !this.textures.exists('enemyGlow')) {
      const n = GL.texels * 2 + 1, cv = this.textures.createCanvas('enemyGlow', n, n), cx = cv.getContext();
      const rgb = '255,255,255'; // the glow picture is white: every enemy tints it with its own main colour (enemyGlowColor)
      const grad = cx.createRadialGradient(GL.texels, GL.texels, 0, GL.texels, GL.texels, GL.texels); // a smooth soft glow (the lantern style rings are added on top: both effects mixed)
      grad.addColorStop(0, 'rgba(' + rgb + ',' + GL.soft + ')'); grad.addColorStop(0.35, 'rgba(' + rgb + ',' + GL.soft * 0.55 + ')'); grad.addColorStop(0.7, 'rgba(' + rgb + ',' + GL.soft * 0.15 + ')'); grad.addColorStop(1, 'rgba(' + rgb + ',0)');
      cx.fillStyle = grad; cx.fillRect(0, 0, n, n);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const d = Math.hypot(x - GL.texels, y - GL.texels), ring = GL.rings.find(r => d <= r.r * GL.texels);
        if (ring) { cx.fillStyle = hex(GL.color); cx.globalAlpha = ring.a; cx.fillRect(x, y, 1, 1); }
      }
      cx.globalAlpha = 1; cv.refresh();
      cv.setFilter(Phaser.Textures.FilterMode.LINEAR); // a regular smooth glow (not pixel art): the picture is smoothed when it is scaled up
    }
    const fire = { y: '#bfe9ff', o: '#4aa3ff', w: '#ffffff' }; // the muzzle burst matches the blue shot
    pix('muzzleA', ['..y..', '.yoy.', 'yowoy', '.yoy.', '..y..'], fire); // smaller than before: the old 7x7 burst on every shot looked like flashing
    pix('muzzleB', ['...', '.y.', '...'].map((r, i) => i === 1 ? 'ywy' : '.y.'), fire);
    pix('glint0', ['..w..', '..w..', 'wwwww', '..w..', '..w..'], { w: '#ffffff' });
    pix('glint1', ['.w.', 'www', '.w.'], { w: '#ffffff' });
    for (const [kind, pre] of SHINE_KINDS) { // beams (3 turned pictures) and glow, one set per drop kind; fixed size so the tune panel can redraw them
      const S = C.sprites[kind + 'Shine'];
      if (!S || this.textures.exists(pre + '0')) continue;
      for (let f = 0; f < 3; f++) this.textures.createCanvas(pre + f, RAYS_MAX * 2 + 1, RAYS_MAX * 2 + 1);
      this.textures.createCanvas(kind + 'Glow', GLOW_MAX * 2 + 1, GLOW_MAX * 2 + 1);
    }
    this.rebuildRays();
  }

  // Draws the soft glow (flat rings, colours per drop) into its fixed-size picture.
  drawGlow(ctx, S) {
    const G = S.glow, n = ctx.canvas.width, M = (n - 1) / 2;
    ctx.clearRect(0, 0, n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const dd = Math.hypot(x - M, y - M), i = G.rings.findIndex(r => dd <= r.r * G.size);
      if (i >= 0) { ctx.fillStyle = hex(S.glowColors[i]); ctx.globalAlpha = Math.min(1, G.rings[i].a * G.opacity); ctx.fillRect(x, y, 1, 1); }
    }
    ctx.globalAlpha = 1;
  }

  // EVERY drop on screen (coins, hearts, potions) gets the same shine: soft glow, spinning beams and a little twinkle.
  // One glow + beams + twinkle picture set per drop in a pool; each drop twinkles at its own moment.
  updateShine(time) {
    for (const [kind, pre, group] of [['coin', 'rays', this.coins], ['heart', 'raysh', this.heartUps], ['potion', 'praysg', this.weaponUps]]) {
      const S = C.sprites[kind + 'Shine'], pool = this.shinePools[kind];
      if (!S || !group) continue;
      let n = 0;
      const live = []; group.children.iterate(c => { if (c && c.active && c.y > -10 && c.y < H) live.push(c); });
      // coins in a stack (a chest spill): only the coin in FRONT (lowest on screen) of its stack gets the shine, so the effects do not pile up
      const front = kind === 'coin' && S.groupPx > 0 ? live.filter((c, i) => !live.some((d, j) => j !== i && (d.y > c.y || (d.y === c.y && j > i)) && Math.hypot(d.x - c.x, d.y - c.y) < S.groupPx)) : live;
      front.forEach(c => {
        let sh = pool[n];
        if (!sh) sh = pool[n] = {
          rays: this.add.image(0, 0, pre + '0').setBlendMode(Phaser.BlendModes.ADD).setDepth(C.pickup.depth - 0.5),
          glow: this.add.image(0, 0, kind + 'Glow').setScale(S.glow.cell).setBlendMode(Phaser.BlendModes.ADD).setDepth(C.pickup.depth - 0.6),
          glint: this.add.image(0, 0, 'glint0').setDepth(C.pickup.depth + 0.1) };
        n++;
        const x = Math.round(c.x), y = Math.round(c.y) + (S.offsetY || 0); // offsetY: move beams and glow down/up (the potion's cap makes it look taller than it is)
        sh.glow.setVisible(true).setPosition(x, y).setAlpha(S.glow.flicker[Math.floor(time / 1000 * S.glow.stepFps) % S.glow.flicker.length]);
        sh.rays.setVisible(true).setTexture(pre + (Math.floor(time / 1000 * S.fps) % 3)).setPosition(x, y).setAlpha(S.alpha);
        const t = (time + n * 370) % S.glintEveryMs; // the twinkle: bigger for a moment, then smaller, then gone
        if (t < S.glintMs) sh.glint.setTexture(t < S.glintMs / 2 ? 'glint0' : 'glint1').setPosition(x + S.glintDx, y + S.glintDy).setVisible(true);
        else sh.glint.setVisible(false);
      });
      for (let i = n; i < pool.length; i++) { pool[i].rays.setVisible(false); pool[i].glow.setVisible(false); pool[i].glint.setVisible(false); }
    }
  }

  // The falling heart pickup: every heart bobs (its fall speed swings a little up and down) and carries the pack's own shine layer over its idle loop.
  updateHeartShine(time) {
    const HS = C.sprites.heartShine;
    if (!HS) return;
    const shSp = C.sprites.heartPickup && C.sprites.heartPickup.shine ? (this.heartShineSp = this.heartShineSp || []) : null; // the pack's own shine layer: glints crossing the heart, same frame as the heart's Idle loop
    let ns = 0;
    const PB = C.sprites.potionShine; // the potion bobs like the heart
    if (PB && PB.bobAmp) this.weaponUps.children.iterate(p => { if (p && p.active && p.baseV && !p.mag) p.body.setVelocityY(p.baseV + PB.bobAmp * Math.sin(time / 1000 * PB.bobSpeed + p.bobPh)); });
    this.heartUps.children.iterate(p => {
      if (!p || !p.active) return;
      if (p.baseV && !p.mag) p.body.setVelocityY(p.baseV + HS.bobAmp * Math.sin(time / 1000 * HS.bobSpeed + p.bobPh));
      if (!shSp || !p.anims.currentAnim || p.anims.currentAnim.key !== 'heart_idle') return;
      const o = shSp[ns] || (shSp[ns] = this.add.image(0, 0, 'sp_heart_shine').setDepth(C.pickup.depth + 0.05));
      ns++;
      o.setFrame(Number(p.frame.name) || 0).setScale(p.scaleX).setPosition(p.x, p.y).setVisible(true);
    });
    if (shSp) for (let i = ns; i < shSp.length; i++) shSp[i].setVisible(false);
  }

  // The main colour of a sprite sheet: average of its solid pixels, favouring colourful ones over grey outlines, then brightened so smoke stays readable.
  mainColour(key) {
    const img = this.textures.get(key).getSourceImage(), cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let r = 0, g = 0, b = 0, w = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 200) continue;
      const wt = Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) + 20; // colourful pixels count more
      r += d[i] * wt; g += d[i + 1] * wt; b += d[i + 2] * wt; w += wt;
    }
    if (!w) return 0xffffff;
    const k = 235 / Math.max(r / w, g / w, b / w, 1);
    return (Math.min(255, Math.round(r / w * k)) << 16) | (Math.min(255, Math.round(g / w * k)) << 8) | Math.min(255, Math.round(b / w * k));
  }

  // A copy of a sheet multiplied by a colour (the same frames). Not a game-object tint, so it works in WebGL and CANVAS alike.
  makeTintSheet(key, newKey, color) {
    if (this.textures.exists(newKey)) return;
    const src = this.textures.get(key), img = src.getSourceImage(), cv = this.textures.createCanvas(newKey, img.width, img.height), ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = hex(color); ctx.fillRect(0, 0, img.width, img.height);
    ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(img, 0, 0); // keep only the shape (and softness) of the original
    cv.refresh();
    src.getFrameNames().forEach(n => { const f = src.get(n); cv.add(n, 0, f.cutX, f.cutY, f.cutWidth, f.cutHeight); });
  }

  // Show / move the white copy over a flashing enemy (same frame, flip, size, place).
  syncFlash(e) {
    if (!e.flashSpr) { e.flashSpr = this.flashPool.get(e.x, e.y, 'en_' + e.kind + '_w'); if (!e.flashSpr) return; e.flashSpr.setActive(true).setVisible(true); }
    e.flashSpr.setTexture('en_' + e.kind + '_w', e.frame.name).setPosition(e.x, e.y).setScale(e.scaleX, e.scaleY).setFlipX(e.flipX).setRotation(e.rotation).setDepth(e.depth + 0.01);
  }

  removeEnemy(e) {
    if (e.flashSpr) { e.flashSpr.setActive(false).setVisible(false); e.flashSpr = null; }
    if (e.glow) { e.glow.setActive(false).setVisible(false); e.glow = null; }
    if (e.halo) { e.halo.setActive(false).setVisible(false); e.halo = null; }
    if (e.halos) { e.halos.forEach(h => h.setActive(false).setVisible(false)); e.halos = null; }
    this.hud.waveAlive(e.wave, -1);
    this.kill(e); this.enemyCount--;
  }

  // An enemy flew away or crashed: it was not killed (no kill-all medal, a notch on its wave pip).
  enemyLost(e) {
    this.medals.enemyLost(); this.hud.waveEscaped(e.wave); this.syncMedals();
    this.removeEnemy(e);
  }

  // An enemy can only be hit or hurt while its centre is inside the screen.
  inside(o) { return o.x > 0 && o.x < W && o.y > 0 && o.y < H; }

  // Everything that rides on an enemy: its white hit flash copy and its carrier outline. Runs every frame, also on the game over screen
  // (the enemy keeps animating there, so these must keep following it).
  decorEnemy(e, time) {
    const flashing = time < e.flashUntil;
    if (e.sp) { if (flashing) this.syncFlash(e); else if (e.flashSpr) { e.flashSpr.setActive(false).setVisible(false); e.flashSpr = null; } }
    else if (flashing) e.setTintFill(0xffffff); else e.clearTint();
    const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * TAU / C.pickup.haloPulseMs));
    if (e.halos) e.halos.forEach(h => h.setFrame(e.frame.name).setFlipX(e.flipX).setPosition(e.x + h.ox, e.y + h.oy).setAlpha(pulse)); // same frame and flip as the enemy, shifted 4 ways
    if (e.halo) e.halo.setPosition(e.x, e.y).setAlpha(pulse);
    if (e.glow) e.glow.setPosition(e.x, e.y);
  }

  updateEnemies(time, dt) {
    this.enemies.children.iterate(e => {
      if (!e || !e.active) return;
      if (!this.kickMove(e, dt)) { this.enemyLost(e); return; } // flew away
      e.onScreen = this.inside(e);
      if (e.fire && e.wait > 0 && e.onScreen) { // shooters fire only while stopped
        if (!e.armed) { e.armed = true; e.fireT = e.fire.first * C.difficulty.shotDelay; }
        e.fireT -= dt;
        if (e.fireT <= 0) { this.enemyShoot(e); e.fireT += e.fire.every * C.difficulty.shotDelay; }
      }
      if (e.sp && e.sp.faceVelocity) { // side-view art faces right: flip when moving left (the hit shake is left out)
        const bx = e.x - e.ox, dx = bx - e.lastX; e.lastX = bx;
        if (dx > 0.05) e.setFlipX(false); else if (dx < -0.05) e.setFlipX(true);
      }
      this.decorEnemy(e, time);
    });
  }

  // followPath plus the little knock-back / shake after a hit. The offset is taken off first, so it never builds up.
  kickMove(o, dt) {
    const F = C.feel;
    o.x -= o.ox; o.y -= o.oy;
    const ok = followPath(o, dt);
    if (o.kick > 0 && ok) {
      o.kick = Math.max(0, o.kick - dt * 1000 / F.hitKickMs);
      o.ox = (Math.random() - 0.5) * F.hitKickPx * o.kick; o.oy = -F.hitKickPx * o.kick;
    } else { o.ox = 0; o.oy = 0; }
    o.x += o.ox; o.y += o.oy;
    return ok;
  }

  updateCrates(time, dt) {
    const ground = this.bgF.scroll * this.cloudMul; // the ground's speed right now (it rushes when she flies up)
    const tint = C.sprites.crate ? C.sprites.crate.tint : null;
    this.crates.children.iterate(c => {
      if (!c || !c.active) return;
      if (C.crate.onGround) c.spd = ground; // stuck to the ground
      if (!this.kickMove(c, dt)) { this.kill(c); this.coinLost(); return; } // fell off the bottom: lost with its coins
      c.onScreen = this.inside(c);
      if (time < c.flashUntil) c.setTintFill(0xffffff);
      else if (tint !== null && tint !== undefined) c.setTint(tint); else c.clearTint();
    });
  }

  enemyShoot(e) {
    const f = e.fire, n = f.shots;
    const base = f.aim === 'player' ? Math.atan2(this.ship.y - (e.y + 14), this.ship.x - e.x) : Math.PI / 2;
    const hit = C.enemyBullet.hitSize;
    if (C.feel.fireFlashScale > 0) this.ring(e.x, e.y + 14, 0xffffff, C.feel.fireFlashScale, C.feel.fireFlashMs, C.feel.fireFlashAlpha); // telegraph
    for (let i = 0; i < n; i++) {
      const b = this.spawn(this.enemyBullets, this.textures.exists('eb_pic') ? 'eb_pic' : 'ebullet', e.x, e.y + 14, this.textures.exists('eb_pic') ? C.enemyBullet.scale : 2);
      if (!b) return;
      b.setDepth(C.enemyBullet.depth); // above all play effects, below the HUD
      b.body.setSize(hit, hit); // only the bright core hurts
      const a = base + (i - (n - 1) / 2) * Phaser.Math.DegToRad(f.spread || 0), v = (f.spd || C.enemyBullet.speed) * C.difficulty.shotSpeed;
      b.body.setVelocity(Math.cos(a) * v, Math.sin(a) * v);
    }
  }

  // The coins of one dead enemy or opened box (cfg = { coins, coinSpread, coinHop }): a fan to both sides with a small hop. The whole fan is
  // pushed inward near a screen edge, so no coin ends up off screen.
  dropEnemyCoins(x, y, cfg) {
    const n = cfg.coins, K = C.coin, m = C.ship.margin, fade = K.scatterFadeSec;
    const rnd = () => 1 + K.scatterJitter * (Math.random() * 2 - 1);
    const x0 = Phaser.Math.Clamp(x, m, W - m);
    const reach = n > 1 ? cfg.coinSpread * (1 + K.scatterJitter) * fade / 2 : 0; // farthest a coin can drift sideways (px)
    const shift = (Math.max(0, m - (x0 - reach)) - Math.max(0, x0 + reach - (W - m))) * 2 / fade; // as a speed
    const maxHop = Math.sqrt(2 * K.hopGravity * Math.max(0, y - m)); // never hop out of the top
    for (let i = 0; i < n; i++) {
      const vx = n > 1 ? cfg.coinSpread * (2 * i / (n - 1) - 1) * rnd() + shift : 0;
      this.dropCoin(x, y, vx, fade, Math.min(cfg.coinHop * rnd(), maxHop));
    }
  }

  dropCoin(x, y, vx, fadeSec, hop = 0) {
    const m = C.ship.margin;
    const sp = C.sprites.coin;
    const c = this.spawn(this.coins, sp ? 'sp_coin' : 'coin', Phaser.Math.Clamp(x, m, W - m), y, sp ? sp.scale : PX);
    if (!c) return;
    c.setDepth(C.pickup.depth); // above the colour wash
    if (sp) { c.play('coin_spin'); c.anims.setCurrentFrame(c.anims.currentAnim.frames[Phaser.Math.Between(0, sp.frames - 1)]); } else c.anims.stop(); // each coin starts at a random frame
    const hb = 2 * C.coin.pickupRadius / (sp ? sp.scale : PX); // generous pickup area (same size on screen whatever the picture)
    c.body.setSize(hb, hb);
    c.body.setVelocity(vx, hop > 0 ? -hop : C.coin.fallSpeed);
    c.mag = false; c.hopping = hop > 0;
    c.body.setDragX(Math.abs(vx) / fadeSec); // sideways speed fades to 0 in fadeSec
    this.coinsSpawned++;
  }

  coinLost() { this.medals.coinLost(); this.syncMedals(); }

  // A pickup (weapon badge / heart) that falls like a coin. Same generous grab radius.
  dropPickup(group, key, fallSpeed, x, y) {
    const m = C.ship.margin;
    const gem = group === this.weaponUps ? C.sprites.weaponGem : null; // animated green gem (weapon upgrade) or the code-drawn potion
    const sp = group === this.heartUps ? C.sprites.heartPickup : gem; // animated heart (Drop, then Idle), gem, or the code-drawn picture
    const p = this.spawn(group, gem ? (this.textures.exists('sp_gem_g') ? 'sp_gem_g' : 'sp_gem') : sp ? 'sp_heart_drop' : key, Phaser.Math.Clamp(x, m, W - m), y, sp ? sp.scale : PX);
    if (!p) return;
    p.setDepth(C.pickup.depth); // above the colour wash
    p.mag = false;
    if (gem && gem.angle) p.setAngle(gem.angle); // the weapon potion is tilted to the right
    const hb = 2 * C.coin.pickupRadius / (sp ? sp.scale : PX);
    p.body.setSize(hb, hb);
    p.dropping = !!sp && !gem;
    if (gem) { p.play('gem_spin'); p.anims.setCurrentFrame(p.anims.currentAnim.frames[Phaser.Math.Between(0, gem.frames - 1)]); } // loops, random start frame
    else if (sp) p.play('heart_drop'); else p.anims.stop();
    p.body.setVelocity(0, fallSpeed); p.baseV = fallSpeed; p.bobPh = Math.random() * TAU;
  }

  weaponUp() {
    sfx('potion');
    if (this.weaponLevel < C.pickup.maxLevel) { this.weaponLevel++; sfx('levelUp', 180); }
    this.hud.setLevel(this.weaponLevel);
    this.shipFlashUntil = this.time.now + C.feel.levelFlashMs;
    this.burst(this.ship.x, this.ship.y, C.feel.levelSparkCount, GREEN_TINTS, 1, 3);
    if (C.feel.potionRing) this.ring(this.ship.x, this.ship.y, C.feel.potionRing.color, 1, C.feel.deathRingMs + C.feel.pickupRingExtraMs + 80, 0.9, 'fxRingFine'); // thin ring that grows big
    else if (C.feel.deathRing) this.ring(this.ship.x, this.ship.y, 0x2ee86a, C.feel.bigDeathRingScale, C.feel.deathRingMs + C.feel.pickupRingExtraMs);
  }

  heartUp(px, py) {
    sfx('heart');
    const sp = C.sprites.heartPickup;
    if (this.hearts < C.ship.hearts) { this.hearts++; this.hud.setHearts(this.hearts); } else { this.addScore(C.pickup.heartScoreIfFull); this.pop(this.ship.x, this.ship.y - C.feel.popTextOffsetY, '+' + C.pickup.heartScoreIfFull); }
    if (sp) this.playFx(this.fxPool, 'sp_heart_collect', 'heart_collect', px, py, sp.scale, sp.collectDepth, null); // the heart jumps and bursts where it was grabbed (replaces the pink ring)
    else if (C.feel.deathRing) this.ring(this.ship.x, this.ship.y, 0xffc9e3, C.feel.bigDeathRingScale, C.feel.deathRingMs + C.feel.pickupRingExtraMs);
  }

  cullOffscreen(time) {
    this.bullets.children.iterate(b => { if (b && b.active && b.y < -20) this.kill(b); });
    const pulse = C.feel.enemyShotPulse, pm = C.feel.enemyShotPulseMs;
    this.enemyBullets.children.iterate(b => {
      if (b && b.active && pulse > 0) b.setScale((this.textures.exists('eb_pic') ? C.enemyBullet.scale : PX) * (1 + pulse * Math.sin(time * TAU / pm + b.x * 0.2))); // gentle swell around the shot's OWN size (it used to reset every shot to 3x)
      if (b && b.active && (b.y > H + 20 || b.y < -20 || b.x < -20 || b.x > W + 20)) this.kill(b);
    });
    this.coins.children.iterate(c => { if (c && c.active && c.y > H + 20) { this.kill(c); this.coinLost(); } });
    for (const grp of [this.weaponUps, this.heartUps]) grp.children.iterate(p => {
      if (!p || !p.active) return;
      if (p.y > H + 20) this.kill(p);
      else if (p.dropping && !p.anims.isPlaying) { p.dropping = false; p.play('heart_idle'); } // the Drop animation ended: loop Idle while it keeps falling
    });
  }

  bulletHitsEnemy(b, e) {
    if (!b.active || !e.active || !e.onScreen) return;
    this.impact(b.x, b.y);
    this.kill(b);
    this.damageEnemy(e, b.dmg, true);
  }

  damageEnemy(e, dmg, flash) {
    if (!e.active) return;
    e.hp -= dmg;
    sfx(e.hp > 0 ? 'enemyHit' : 'enemyDie');
    if (e.hp > 0) { if (flash) { e.flashUntil = this.time.now + C.enemies.hitFlashMs; if (e.sp) this.syncFlash(e); else e.setTintFill(0xffffff); } if (C.feel.hitKickPx > 0) e.kick = 1; return; } // white at once, not only on the next update
    const big = e.kind === 'shooter';
    this.explode(e.x, e.y, big, DEATH_TINTS[e.kind], true, e.kind);
    this.pop(e.x, e.y - 6, '+' + C.enemies[e.kind].score);
    if (big) this.bigShake();
    if (e.coin) this.dropEnemyCoins(e.x, e.y, C.enemies[e.kind]);
    if (e.drop === 'weapon') this.dropPickup(this.weaponUps, 'weaponUp', C.pickup.weaponFallSpeed, e.x, e.y);
    else if (e.drop === 'heart') this.dropPickup(this.heartUps, 'heartUp', C.pickup.heartFallSpeed, e.x, e.y);
    this.addScore(C.enemies[e.kind].score);
    this.enemiesKilled++;
    this.medals.onKill(this.enemiesKilled); this.syncMedals();
    this.removeEnemy(e);
  }

  // Crates are not enemies: no score, no kill count. Opening one spills its coins.
  bulletHitsCrate(b, c) {
    if (!b.active || !c.active || !c.onScreen) return;
    this.impact(b.x, b.y);
    this.kill(b);
    c.hp -= b.dmg;
    if (c.hp > 0) { c.flashUntil = this.time.now + C.enemies.hitFlashMs; if (C.feel.hitKickPx > 0) c.kick = 1; return; }
    sfx('boxOpen');
    this.explode(c.x, c.y, true, DEATH_TINTS.crate, true, 'crate');
    const cs = C.sprites.crate;
    if (cs) this.playFx(this.fxPool, 'sp_crate_break', 'crate_break', c.x, c.y, cs.scale, cs.breakDepth, cs.tint); // chest bursts at the same moment as the coins
    this.bigShake();
    this.dropEnemyCoins(c.x, c.y, { coins: c.coins, coinSpread: C.crate.coinSpread, coinHop: C.crate.coinHop });
    this.kill(c);
  }

  crashEnemy(e) {
    if (!e.active) return;
    this.explode(e.x, e.y, false, DEATH_TINTS[e.kind], true, e.kind);
    this.enemyLost(e); // no score, no coin, not a kill
  }

  // returns true only if a heart was really lost
  // a cat was saved / lost (called by src/cats.js)
  onCatSaved(n, total) { if (n >= total && this.medals.state.cats === 'pending') this.medals.state.cats = 'earned'; this.syncMedals(); }
  onCatLost() { this.medals.catLost(); this.syncMedals(); }

  hurtPlayer() {
    if (this.over || this.leaving || this.time.now < this.invulnUntil) return false;
    this.hitsTaken++;
    sfx('hurt');
    this.cats.hurt(); // a hit while hovering over a cat costs its ring a part
    this.medals.playerHit(); this.syncMedals();
    if (!this.god && !(C.testing.god > 0)) { this.hearts--; this.hud.setHearts(this.hearts); }
    this.invulnUntil = this.time.now + C.ship.invulnMs;
    if (this.stunFx && this.hearts > 0) { this.stunUntil = this.time.now + C.ship.invulnMs; this.stunFx.play('stunned'); } // stars last as long as she blinks
    this.cameras.main.shake(C.ship.hitShakeMs, C.ship.hitShakeAmount);
    this.explode(this.ship.x, this.ship.y, false, WITCH_TINTS, false); // no smoke puff for the witch
    if (C.feel.hitFlashMs > 0) this.flashT = 1; // white-pink screen flash (own rectangle, fades out in updateFx)
    if (this.hearts <= 0) this.gameOver();
    else { this.freezeMs = C.feel.hitStopMs; this.physics.world.pause(); } // hit-stop
    return true;
  }

  bigShake() { this.cameras.main.shake(C.feel.bigShakeMs, C.feel.bigShakeAmount); }

  // Pop in the creature's colours plus a ring puff. big = imp / chest (more sparks, bigger ring).
  explode(x, y, big, tints, puff = true, smokeType = null) {
    const F = C.feel, P = C.sprites.poof;
    if (P && puff) { // smoke puff under the sparks: in the colour of what died, turned a random way
      const has = smokeType && this.textures.exists('sp_poof_' + smokeType);
      const sm = this.playFx(this.poofPool, has ? 'sp_poof_' + smokeType : 'sp_poof', has ? 'poof_' + smokeType : 'poof', x, y, P.scale * (big ? P.bigMul : 1), P.depth, null);
      if (sm) sm.setOrigin(P.originX, P.originY).setRotation(Math.random() * TAU); // turn around the middle of the smoke itself, so it stays where the sparks start
    }
    this.burst(x, y, big ? F.bigExplosionCount : C.particles.perExplosion, tints, big ? F.bigExplosionSpeedMul : 1, big ? 5 : 4);
    if (F.deathRing) this.ring(x, y, tints[1], big ? F.bigDeathRingScale : F.deathRingScale, F.deathRingMs);
  }

  // Cyan-white sparks where a player shot lands.
  impact(x, y) {
    if (C.feel.impactSparks > 0) this.burst(x, y, C.feel.impactSparks, SHOT_TINTS, C.feel.impactSpeedMul, C.feel.impactSize, C.feel.impactLifeMul);
  }

  // n little squares flying out of (x, y); they come from a pool and fade out.
  burst(x, y, n, tints, speedMul, maxScale, lifeMul = 1) {
    const P = C.particles;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = P.speed * speedMul * (0.4 + Math.random() * 0.6);
      this.emit(this.sparks, x, y, Math.cos(a) * v, Math.sin(a) * v, P.lifeMs / 1000 * lifeMul, Phaser.Math.Between(2, maxScale),
        tints[(Math.random() * tints.length) | 0], 20, false);
    }
  }

  updateFx(dt) {
    for (const f of this.fxPool) if (f.active && f.anims.currentAnim && f.anims.currentAnim.key === 'crate_break') f.y += this.bgF.scroll * this.cloudMul * dt; // the opened chest keeps scrolling with the ground (also while it fades)
    if (this.stunFx) { // stars over the witch's head, fading out at the end
      const left = this.stunUntil - this.time.now, on = left > 0 && !this.over;
      this.stunFx.setVisible(on);
      if (on) this.stunFx.setPosition(this.ship.x, this.ship.y + C.sprites.stunned.offsetY).setAlpha(Math.min(1, left / C.sprites.stunned.fadeMs));
    }
    for (const grp of this.fxGroups) grp.children.iterate(s => {
      if (!s || !s.active) return;
      s.life -= dt;
      if (s.life <= 0) { s.setActive(false).setVisible(false); return; }
      const f = s.life / s.max;
      s.x += s.vx * dt; s.y += s.vy * dt; s.setAlpha(f);
      if (s.shrink) s.setScale(s.s0 * (0.35 + 0.65 * f));
    });
    this.rings.children.iterate(r => {
      if (!r || !r.active) return;
      r.life -= dt;
      if (r.life <= 0) { r.setActive(false).setVisible(false); return; }
      const f = 1 - r.life / r.max, e = 1 - (1 - f) * (1 - f); // grows fast, then slows
      r.setScale(r.s1 * (0.25 + 0.75 * e)).setAlpha(r.a0 * (1 - f));
    });
    if (this.flashT > 0) {
      this.flashT = Math.max(0, this.flashT - dt * 1000 / C.feel.hitFlashMs);
      this.flash.setAlpha(C.feel.hitFlashStrength * this.flashT);
    }
    const F = C.feel, speed = F.popTextRise / (F.popTextMs / 1000);
    for (const p of this.pops) {
      if (!p.visible) continue;
      p.life -= dt;
      if (p.life <= 0) { p.setVisible(false); continue; }
      p.y -= speed * dt; p.setAlpha(Math.min(1, p.life / (F.popTextMs / 3000)));
    }
  }

  // A tiny square particle from a pool. shrink = it shrinks as it fades.
  emit(group, x, y, vx, vy, life, scale, tint, depth, shrink) {
    const s = group.get(x, y, 'square');
    if (!s) return;
    s.setActive(true).setVisible(true).setScale(scale).setPosition(x, y).setTint(tint).setAlpha(1).setDepth(depth);
    s.vx = vx; s.vy = vy; s.life = s.max = life; s.s0 = scale; s.shrink = shrink;
  }

  // An expanding, fading ring. size = final scale in art pixels (PX each).
  ring(x, y, tint, size, ms, alpha = 0.9, tex = null) { // tex: another ring picture (then size is its final scale, not x PX)
    const r = this.rings.get(x, y, 'fxRing');
    if (!r) return;
    r.setTexture(tex || 'fxRing').setActive(true).setVisible(true).setPosition(x, y).setTint(tint).setDepth(C.feel.ringDepth).setAlpha(alpha);
    r.s1 = tex ? size : size * PX; r.a0 = alpha; r.life = r.max = ms / 1000;
  }

  // Floating text that drifts up and fades.
  pop(x, y, str) {
    if (!C.feel.popText) return;
    const p = this.pops.find(t => !t.visible);
    if (!p) return;
    p.setText(str).setPosition(Phaser.Math.Clamp(x, C.feel.popTextEdge, W - C.feel.popTextEdge), y).setAlpha(1).setVisible(true);
    p.life = C.feel.popTextMs / 1000;
  }

  // Tune panel, TEST tab (it checks first that the run has not ended).
  testFinish() { this.ship.setVisible(false); this.stageClear(); } // hidden: in a real clear she has flown off the top
  testLose() { this.hearts = 0; this.hud.setHearts(0); this.gameOver(); }
  refreshBank() { if (this.bankDraw) this.bankDraw(); } // the end screen shows the new total
  // the tune panel erased all saved progress: forget what this run already put in the bank, drop the upgrades, update the end screen
  progressReset() {
    this.coinsBanked = 0;
    this.refreshUpgrades();
    this.refreshBank();
    this.newTags.forEach(o => o.setVisible(false)); // NEW beside a star: it is not saved any more
  }

  gameOver() {
    music(null); ringSound(null); sfx('gameOver', 350); // after the hit sound
    this.vx = this.vy = 0; // clouds stop boosting
    saveBest(this.score, this.stageTheme); // the high score also counts when the run ends in a game over (it was only saved on STAGE CLEAR before)
    this.endScreen('GAME OVER', hex(C.menu.pal.pink), false);
    this.ship.setVisible(false).setAlpha(1);
  }

  stageClear() {
    music(null); ringSound(null); sfx('stageClear');
    this.vx = this.vy = 0;
    this.medals.finish(this.enemiesKilled, this.cats.allSaved());
    this.syncMedals();
    const isNew = saveMedals(this.medals.state, this.stageTheme);
    saveBest(this.score, this.stageTheme);
    this.endScreen('STAGE CLEAR', hex(C.menu.pal.cyan), true, isNew);
    this.ship.setAlpha(1);
  }

  // Shared end screen (game over / stage clear): a purple parchment box. Stage clear: the stars on top, one row per goal with
  // what was done, then score and coins. Game over: score and coins. Buttons AGAIN and MENU (a tap elsewhere does nothing).
  endScreen(title, col, stats, isNew) {
    this.over = true;
    this.restartAt = this.time.now + C.ship.restartDelayMs;
    this.ship.body.enable = false;
    this.enemies.children.iterate(e => { if (e && e.active) e.body.setVelocity(0, 0); });
    this.enemyBullets.children.iterate(b => { if (b && b.active) this.kill(b); });
    this.bullets.children.iterate(b => { if (b && b.active) this.kill(b); });
    this.muzzle.forEach(m => m.setVisible(false));
    const E = C.endScreen, P = C.menu.pal, CR = hex(P.cream), GOLD = hex(0xf2b632), DIM = '#a89cd0';
    const ease = C.feel.endEaseMs, live = ease > 0; // live = things move (stars land, numbers count)
    const keys = stats ? this.goalKeys : [];
    const h = stats ? 222 + keys.length * E.rowGap : 170, y0 = Math.round((H - h) / 2), left = E.x + 20, right = E.x + E.w - 20, mid = E.x + E.w / 2;
    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setDepth(60);
    const parts = [], add = o => { parts.push(o); return o; }; // everything in the box, drawn in this order
    const t = (x, y, s, size, color, ox = 0.5) => add(this.add.text(x, y, s, { ...FONT, fontSize: fpx(size) + 'px', color, stroke: hex(P.shadow), strokeThickness: 3 }).setOrigin(ox, 0.5));
    if (this.textures.exists('ui_panel-parchment')) add(this.add.image(E.x, y0, parchmentKey(this, E.w, h)).setOrigin(0, 0));
    else add(this.add.rectangle(E.x, y0, E.w, h, 0x3a1a72).setOrigin(0, 0));
    add(this.add.text(mid, y0 + 28, titleCase(title), { ...FONT_TITLE, fontSize: '28px', color: col, stroke: hex(P.shadow), strokeThickness: z(5) }).setOrigin(0.5));
    const node = C.menu.path.nodes.find(n => n.theme === this.stageTheme);
    add(this.add.text(mid, y0 + 52, node ? titleCase(node.name) : '', { ...FONT_TITLE, fontSize: C.menu.bubble.titleSize + 'px', color: GOLD, stroke: hex(P.shadow), strokeThickness: 3 }).setOrigin(0.5)); // the stage name, ornate font
    let y = y0 + 80, starsDone = 0;
    if (stats) {
      const V = C.coin.value, hits = this.hitsTaken;
      const names = { cats: 'All cats', allCoins: 'All coins', killAll: 'All enemies', noHit: 'No hit' };
      const values = { cats: this.cats.saved + '/' + this.cats.total, allCoins: this.coinsCollected * V + '/' + this.coinsSpawned * V,
        killAll: this.enemiesKilled + '/' + this.enemiesSpawned, noHit: hits + (hits === 1 ? ' hit' : ' hits') };
      keys.forEach((k, i) => { // the stars: one per goal, in the order of the rows
        const done = this.medals.state[k] === 'earned', sx = mid + (i - (keys.length - 1) / 2) * 42;
        const star = add(this.add.image(sx, y, done ? 'star_earned' : 'star_off').setScale(E.starScale));
        if (done && live) {
          star.setVisible(false);
          this.time.delayedCall(ease + starsDone * E.starGapMs, () => { star.setVisible(true); sfx('coin'); this.tweens.add({ targets: star, scale: { from: E.starScale * 2, to: E.starScale }, duration: 260, ease: 'Back.easeOut' }); });
        }
        if (done) starsDone++;
        if (isNew && isNew[k]) this.newTags.push(t(sx, y + 22, 'New', 8, hex(P.orange)));
      });
      y += 42;
      keys.forEach(k => {
        const done = this.medals.state[k] === 'earned';
        add(this.add.image(left + 8, y, 'goal_' + k + '_' + (done ? 'earned' : 'failed')).setScale(goalScale(this, k, 18)));
        t(left + 22, y, names[k], 10, done ? CR : DIM, 0);
        t(right, y, values[k], 10, done ? GOLD : DIM, 1);
        y += E.rowGap;
      });
      add(this.add.rectangle(mid, y - 6, E.w - 40, 1, 0x9a6ad8));
      y += 12;
    }
    // the score and the saved coins, both counting up
    const count = (from, to, delay, show, end) => {
      if (!live || from === to) { show(to); return null; }
      show(from);
      return this.tweens.addCounter({ from, to, delay, duration: E.countMs, onUpdate: tw => show(Math.round(tw.getValue())), onComplete: () => { show(to); if (end) end(); } });
    };
    t(left, y, 'Score', 12, CR, 0);
    const scoreText = t(right, y, '', 12, CR, 1);
    count(0, this.score, ease, v => scoreText.setText(String(v)));
    y += 24;
    t(left, y, 'Bank', 12, GOLD, 0);
    const gainText = t(right, y, '', 12, hex(P.orange), 1), totalText = t(right, y, '', 12, GOLD, 1);
    const coin = this.textures.exists('sp_coin') ? add(this.add.image(right, y, 'sp_coin', 0).setScale(0.7)) : null;
    const showTotal = v => { // from the right: +gained, the total, the coin picture
      gainText.setText(this.coinsBanked ? '+' + this.coinsBanked : '');
      totalText.setText(String(v)).setX(right - (gainText.text ? gainText.width + 8 : 0));
      if (coin) coin.setX(totalText.x - totalText.width - 8);
    };
    const bank = loadBank(), gained = this.coinsBanked, countDelay = ease + starsDone * E.starGapMs;
    const counting = count(bank - gained, bank, countDelay, showTotal, () => sfx('coin'));
    const flying = [];
    if (live && coin) for (let n = 0; n < Math.min(E.coinsFly, gained); n++) { // coins fly into the total
      const f = add(this.add.image(mid - 20 + (n % 3) * 20, y + 28, 'sp_coin', 0).setScale(0.6).setVisible(false));
      flying.push(f);
      this.tweens.add({ targets: f, x: coin.x, y, delay: countDelay + n * 70, duration: 320, ease: 'Quad.easeIn', onStart: () => f.setVisible(true), onComplete: () => f.setVisible(false) });
    }
    // a run that stops counting while the box is open (a test cheat): drop the animation and show the final numbers
    this.bankDraw = () => { if (counting) counting.remove(); flying.forEach(f => { this.tweens.killTweensOf(f); f.setVisible(false); }); showTotal(loadBank()); };
    // the buttons
    const by = y + 36, art = this.textures.exists('ui_med-button');
    this.endBtns = [['Again', mid - E.btnW / 2 - 4, () => this.scene.restart(this.startData)], ['Menu', mid + E.btnW / 2 + 4, () => this.scene.start('Menu')]].map(([label, x, action]) => {
      if (art) add(addSlice(this, x - E.btnW / 2, by - 13, buttonKey(this), E.btnW, 26, 10, 10, 0, 0).setOrigin(0, 0));
      else add(this.add.rectangle(x, by, E.btnW, 26, 0x3b1478));
      const l = t(x, by - 1, label, 10, art ? BTN_INK : CR); if (art) l.setStroke(BTN_INK, 0);
      return { x, y: by, w: E.btnW, h: 32, action };
    });
    const box = this.add.container(0, 0, parts).setDepth(61);
    if (live) {
      veil.setAlpha(0); box.setAlpha(0);
      this.tweens.add({ targets: veil, alpha: 0.55, duration: ease });
      this.tweens.add({ targets: box, alpha: 1, duration: ease, ease: 'Quad.easeOut' });
    }
    popIn(this, box, W / 2, H / 2, ease + 240); // it pops in while it fades in
  }
}

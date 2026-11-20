import { CONFIG as C, z, hex, snap4 } from '../config.js';
import { makeAllTextures, PX } from '../sprites.js';
import { STAGE1 } from '../waves.js';
import { WaveRunner, initPath, followPath } from '../waves-runner.js';
import { Hud, FONT, drawPlate } from '../hud.js';
import { findSprites } from '../forestArt.js';
import { ROCKS } from '../rocks.js';
import { Tune, tuneEnabled } from '../tune.js';
import { Medals, MEDAL_KEYS, saveMedals, saveBest } from '../medals.js';

// Which background is shown: ?bg=forest | swamp | sky in the web address, else config.background.mode.
// The menu passes data.theme ('forest' | 'swamp'); ?bg still wins, with no data config.background.mode is used.
const bgName = theme => new URLSearchParams(window.location.search).get('bg') || theme || C.background.mode;
const ANIM_FRAMES = ['a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10', 'a11']; // frame names of an animated strip (made once, so nothing is built per frame)
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
    const K = C.sprites; // coin / heart / chest / puff strips (assets/pickups, assets/fx); a thing without an entry keeps its code-drawn picture
    const strip = (key, d) => this.load.spritesheet(key, 'assets/' + d.file, { frameWidth: d.frameW, frameHeight: d.frameH });
    if (K.coin) strip('sp_coin', K.coin);
    if (K.heartPickup) for (const n of ['idle', 'drop', 'collect']) strip('sp_heart_' + n, K.heartPickup[n]);
    if (K.crate) { strip('sp_crate_idle', K.crate.idle); strip('sp_crate_break', K.crate.break); }
    if (K.poof) strip('sp_poof', K.poof);
    if (K.weaponGem) strip('sp_gem', K.weaponGem);
    if (K.stunned) strip('sp_stunned', K.stunned);
    if (C.bullet.fire) strip('sp_fire', C.bullet.fire);
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
    for (const t in C.enemies.sprites) { // one flap/bob loop per sprite type, made once (textures and animations persist across restarts)
      const d = C.enemies.sprites[t], key = 'en_' + t + '_loop';
      if (!this.anims.exists(key)) this.anims.create({ key, frames: d.frames.map(f => ({ key: 'en_' + t, frame: f })), frameRate: d.fps, repeat: -1 });
    }
    const K = C.sprites, mkAnim = (key, tex, d, repeat) => { // pickup / fx animations, made once
      if (!this.anims.exists(key)) this.anims.create({ key, frames: this.anims.generateFrameNumbers(tex, { start: 0, end: d.frames - 1 }), frameRate: d.fps, repeat });
    };
    if (K.stunned) mkAnim('stunned', 'sp_stunned', K.stunned, -1);
    if (C.bullet.fire) mkAnim('fire_shot', 'sp_fire', C.bullet.fire, -1);
    if (K.coin) mkAnim('coin_spin', 'sp_coin', K.coin, -1);
    if (K.heartPickup) { mkAnim('heart_idle', 'sp_heart_idle', K.heartPickup.idle, -1); mkAnim('heart_drop', 'sp_heart_drop', K.heartPickup.drop, 0); mkAnim('heart_collect', 'sp_heart_collect', K.heartPickup.collect, 0); }
    if (K.crate) { mkAnim('crate_idle', 'sp_crate_idle', K.crate.idle, -1); mkAnim('crate_break', 'sp_crate_break', K.crate.break, 0); }
    if (K.poof) mkAnim('poof', 'sp_poof', K.poof, 0);
    if (K.weaponGem) mkAnim('gem_spin', 'sp_gem', K.weaponGem, -1);
    // The canvas is R times bigger than the game (sharp text); the camera zooms back so all numbers stay logical.
    this.cameras.main.setZoom(R).centerOn(W / 2, H / 2);
    this.score = 0;
    this.freezeMs = 0;    // hit-stop: game is frozen while > 0
    this.shipFlashUntil = 0; this.muzzleUntil = 0;
    this.recoil = 0; this.trailT = 0; this.trailN = 0; this.vx = 0; this.vy = 0; this.cloudMul = 1; // feel state
    this.hearts = C.ship.hearts;
    this.over = false; this.menuBtn = null;
    this.invulnUntil = 0;
    this.nextShot = 0;
    // Debug helpers (type them after the web address): ?wave=N starts the stage at wave N (1-10); ?god=1 = no damage (hits still counted).
    const q = new URLSearchParams(window.location.search);
    this.god = q.get('god') === '1';
    const startWave = Phaser.Math.Clamp(parseInt(q.get('wave'), 10) || 1, 1, STAGE1.length) - 1;
    this.debug = this.god || startWave > 0 || tuneEnabled(); // debug runs do not touch the saved medals
    this.weaponLevel = Math.min(C.pickup.maxLevel, startWave); // wave=N starts with weapon level N-1 so later waves can be tried fairly
    this.runner = new WaveRunner(STAGE1, startWave, C.stage.firstWaveDelay);
    this.hooks = { enemy: (cg, i) => this.spawnEnemy(cg, i), crate: cc => this.spawnCrate(cc) };
    this.enemyCount = 0;  // enemies alive now
    this.clearAt = 0;     // time when STAGE CLEAR shows (0 = not yet)
    // Counters for the medals later (shown only on the result screen for now)
    this.enemiesSpawned = 0; this.enemiesKilled = 0; this.coinsSpawned = 0; this.coinsCollected = 0; this.hitsTaken = 0;

    this.makeBackground();
    this.makeLanterns();
    this.makePools();
    this.makeShip();
    const waveTotals = STAGE1.map(w => w.groups.reduce((n, g) => n + g.n, 0));
    this.medals = new Medals(waveTotals.slice(startWave).reduce((a, b) => a + b, 0));
    this.hud = new Hud(this, waveTotals, startWave);
    this.hud.setLevel(this.weaponLevel);

    // Input: relative drag. The ship moves by the same amount as the finger (or held mouse) moves.
    // Touching somewhere else does not move the ship. Only one pointer steers; others are ignored.
    this.dragId = null;
    this.dragFrom = new Phaser.Math.Vector2();  // finger position at touch start
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
    this.input.on('pointerdown', p => {
      if (this.tune && this.tune.press(p.x / R, p.y / R)) return; // the panel used this touch
      if (this.over) {
      if (this.time.now <= this.restartAt) return;
      const b = this.menuBtn; // the MENU button is checked first, so it never also restarts the stage
      if (b && Math.abs(p.x / R - b.x) <= b.w / 2 && Math.abs(p.y / R - b.y) <= b.h / 2) this.scene.start('Menu');
      else this.scene.restart(this.startData);
      return;
    }
      if (this.dragId !== null) return;
      this.dragId = p.id;
      this.dragFrom.set(p.x / R, p.y / R); // pointer is in canvas pixels, the game is R times smaller
      this.finger.copy(this.dragFrom);
      this.shipFrom.set(this.target.x, this.target.y); // from the target, so no jump while the ship is still catching up
      if (this.stickMode) this.stickC.copy(this.finger); // the ring appears under the thumb
    });
    this.input.on('pointermove', p => {
      if (this.mouseMode) { this.mouseSeen = true; return; }
      if (p.id !== this.dragId || !p.isDown || this.over) return;
      this.finger.set(p.x / R, p.y / R);
      if (!this.stickMode) this.aimTarget();
    });
    const release = p => { if (this.tune) this.tune.release(); if (p.id === this.dragId) { this.dragId = null; if (this.stickMode) this.stickC.set(W / 2, C.stick.restY); } };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    // Collisions
    this.physics.add.overlap(this.bullets, this.enemies, (b, e) => this.bulletHitsEnemy(b, e));
    this.physics.add.overlap(this.bullets, this.crates, (b, c) => this.bulletHitsCrate(b, c));
    this.physics.add.overlap(this.ship, this.enemyBullets, (s, b) => { this.kill(b); this.hurtPlayer(); });
    this.physics.add.overlap(this.ship, this.enemies, (s, e) => { if (e.onScreen && this.hurtPlayer() && C.ship.ramKillsEnemy) this.crashEnemy(e); });
    this.physics.add.overlap(this.ship, this.coins, (s, c) => {
      this.kill(c); this.coinsCollected++; this.addScore(C.coin.value);
      this.pop(c.x, c.y, '+' + C.coin.value);
      this.burst(c.x, c.y, C.feel.coinSparkCount, COIN_TINTS, C.feel.coinSparkSpeedMul, 3); // coin pop
    });
    this.physics.add.overlap(this.ship, this.weaponUps, (s, p) => { this.kill(p); this.weaponUp(); });
    this.physics.add.overlap(this.ship, this.heartUps, (s, p) => { this.kill(p); this.heartUp(p.x, p.y); });
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
    this.crates = mk('crate', C.crate.poolSize);
    this.weaponUps = mk('weaponUp', C.pickup.weaponPoolSize);
    this.heartUps = mk('heartUp', C.pickup.heartPoolSize);
    this.sparks = this.add.group({ defaultKey: 'square', maxSize: C.particles.poolSize });
    this.halos = this.add.group({ defaultKey: 'square', maxSize: C.pickup.haloPoolSize }); // glowing outlines of carriers
    this.trail = this.add.group({ defaultKey: 'square', maxSize: C.feel.trailPoolSize }); // broom sparkles (own pool so bursts never starve it)
    this.fxGroups = [this.sparks, this.trail];
    // screen flash: one reused rectangle, below the enemy shots so it never hides them
    this.flash = this.add.rectangle(W / 2, H / 2, W, H, C.feel.flashColor, 1).setDepth(C.feel.flashDepth).setAlpha(0);
    this.flashT = 0;
    // colour wash over the whole play field so art from different packs looks like one palette (a flat colour at low strength; shots, coins and the HUD stay above it). ?tint=0 turns it off.
    const TN = C.tint, tq = new URLSearchParams(window.location.search).get('tint');
    if (TN && TN.on && tq !== '0' && TN[this.stageTheme]) this.add.rectangle(W / 2, H / 2, W, H, TN[this.stageTheme].color, TN[this.stageTheme].alpha).setDepth(TN.depth);
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
      this.pops.push(this.add.text(0, 0, '', { ...FONT, fontSize: C.feel.popTextSize + 'px', color: hex(C.menu.pal.cream), stroke: hex(C.menu.pal.shadow), strokeThickness: 3 })
        .setOrigin(0.5).setDepth(30).setVisible(false));
    }
    // muzzle flash: two small white pixels at the nose, shown for a few ms on every volley
    this.muzzle = [0, 1].map(() => this.add.image(0, 0, 'square').setScale(C.feel.muzzleSize).setDepth(11).setVisible(false));
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
    this.ship = this.physics.add.sprite(W / 2, C.ship.startY, 'witch', 1).setScale(SS).setDepth(10);
    this.ship.play('witch_n');
    const ST = C.sprites.stunned; // stars and sparks circling over her head for a moment after a hit
    this.stunUntil = 0;
    this.stunFx = ST ? this.add.sprite(0, 0, 'sp_stunned', 0).setScale(ST.scale).setDepth(12).setVisible(false) : null;
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
    for (let i = 0; i < LN.count; i++) {
      const L = { spr: this.add.sprite(0, 0, 'lan_0', 0).setDepth(LN.depth), glow: this.add.image(0, 0, 'lanternGlow').setScale(LN.glow.cell).setBlendMode(Phaser.BlendModes.ADD).setDepth(LN.depth - 0.05), bugs: [], ph: Math.random() * 10, side: i % 2 ? 1 : -1 };
      for (let b = 0; b < LN.bugs; b++) L.bugs.push({ s: this.add.image(0, 0, 'square').setScale(LN.bugSize).setTint(LN.bugColor).setDepth(LN.depth + 0.1), r: 7 + Math.random() * 7, w: (0.8 + Math.random() * 1.2) * (Math.random() < 0.5 ? -1 : 1), p: Math.random() * TAU, k: 1 + Math.random() * 0.8 });
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
    L.spr.x = Phaser.Math.Between(lane[0], lane[1]);
    L.spr.y = first ? H * (0.15 + 0.35 * i) + Phaser.Math.Between(-20, 20) : -f.h * LN.scale - Phaser.Math.Between(LN.gapY[0], LN.gapY[1]);
  }

  updateLanterns(dt, time) {
    const LN = C.background.swamp.lanterns, G = LN.glow;
    const step = Math.floor(time / 1000 * LN.stepFps); // everything that wiggles changes in steps, like pixel art frames
    for (const L of this.lanterns) {
      L.spr.y += this.bgF.scroll * this.cloudMul * dt;
      if (L.spr.y > H + L.f.h * LN.scale) this.placeLantern(L, false);
      const x = Math.round(L.spr.x), y = Math.round(L.spr.y), gx = x, gy = y + L.f.glowDy * LN.scale;
      L.spr.setPosition(x, y);
      L.glow.setPosition(gx, gy).setAlpha(G.flicker[(step + Math.floor(L.ph)) % G.flicker.length]);
      for (const b of L.bugs) {
        const a = b.p + step * b.w * 0.5;
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
    this.target.x = Phaser.Math.Clamp(s.x + this.stickV.x * dt, S.margin, W - S.margin);
    this.target.y = Phaser.Math.Clamp(s.y + this.stickV.y * dt, S.margin, H - S.margin);
    const k = len > T.radius ? T.radius / len : 1; // knob stays inside the ring
    this.stickRing.setPosition(this.stickC.x, this.stickC.y).setAlpha(held ? T.ringAlpha : T.restAlpha);
    this.stickKnob.setPosition(this.stickC.x + dx * k, this.stickC.y + dy * k).setAlpha(held ? T.ringAlpha + 0.1 : T.restAlpha);
  }

  moveShip(dt) {
    const S = C.ship, s = this.ship;
    if (this.stickMode) this.stickTarget(dt);
    else if (this.mouseMode) {
      if (this.mouseSeen && !this.over) { const m = this.input.activePointer; this.target.x = Phaser.Math.Clamp(m.x / R, S.margin, W - S.margin); this.target.y = Phaser.Math.Clamp(m.y / R, S.margin, H - S.margin); }
    } else if (this.dragId !== null && !this.over && S.glueRate > 0) {
      // Slowly slide the start point so the target settles just above the finger: the drift (finger far from the ship) heals itself.
      const g = 1 - Math.exp(-S.glueRate * dt);
      const ix = Phaser.Math.Clamp(this.finger.x, S.margin, W - S.margin), iy = Phaser.Math.Clamp(this.finger.y - S.fingerOffsetY, S.margin, H - S.margin);
      this.shipFrom.x += (ix - this.target.x) * g;
      this.shipFrom.y += (iy - this.target.y) * g;
      this.aimTarget();
    }
    const k = this.stickMode ? 1 : 1 - Math.exp(-S.followRate * dt); // stick: no extra easing, the stick already sets the speed
    const px = s.x, py = s.y;
    s.x += (this.target.x - s.x) * k;
    s.y += (this.target.y - s.y) * k;
    if (Math.abs(this.target.x - s.x) < 0.25) s.x = this.target.x;
    if (Math.abs(this.target.y - s.y) < 0.25) s.y = this.target.y;
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

  addScore(n) { this.score += n; this.hud.setScore(this.score, true); }
  syncMedals() { this.hud.setMedals(this.medals.state); }

  // ---------- gameplay ----------
  update(time, delta) {
    if (this.tune) { this.tune.update(time); if (this.tune.open) return; } // panel open = game paused
    if (this.freezeMs > 0 && !this.over) { // hit-stop: everything waits
      this.freezeMs -= delta;
      if (this.freezeMs <= 0) this.physics.world.resume();
      return;
    }
    const dt = Math.min(delta, 50) / 1000;
    this.scrollBackground(dt);
    this.hud.update(dt, time);
    if (this.over) { this.updateFx(dt); return; }

    this.moveShip(dt);
    this.updateShipFeel(dt);
    this.autoFire(time);
    this.runner.update(dt, this.enemyCount, this.hooks);
    this.updateEnemies(time, dt);
    this.updateCrates(time, dt);
    this.updateCoins(dt);
    this.cullOffscreen(time);
    if (!this.clearAt && this.runner.finished && this.enemyCount === 0 && this.crates.countActive(true) === 0 && this.coins.countActive(true) === 0 && this.weaponUps.countActive(true) === 0 && this.heartUps.countActive(true) === 0) this.clearAt = time + C.stage.endDelayMs;
    if (this.clearAt && time >= this.clearAt) { this.stageClear(); return; }
    this.updateFx(dt);
    this.updateLanterns(dt, time);

    // invulnerability blink
    if (time < this.invulnUntil) {
      this.ship.setAlpha(Math.floor(time / C.ship.blinkMs) % 2 ? 0.25 : 1);
    } else this.ship.setAlpha(1);
    if (time < this.shipFlashUntil) this.ship.setTintFill(0xb8ffd0); else this.ship.clearTint(); // level-up flash
    if (this.muzzle[0].visible && time >= this.muzzleUntil) this.muzzle.forEach(m => m.setVisible(false));
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
      F.trailLifeMs / 1000, Phaser.Math.FloatBetween(F.trailSize[0], F.trailSize[1]) * SS, F.trailColors[this.trailN++ % F.trailColors.length], 9, true); // colours go round in order, so the stream looks striped and colourful
  }

  // Coins close to the witch fly to her (magnet).
  updateCoins(dt) {
    const F = C.feel, R = F.magnetRadius;
    if (R <= 0) return;
    const sh = this.ship;
    this.coins.children.iterate(c => {
      if (!c || !c.active) return;
      const dx = sh.x - c.x, dy = sh.y - c.y, d = Math.hypot(dx, dy);
      if (!c.mag && d < R) { c.mag = true; c.body.setDragX(0); }
      if (c.mag && d > 0.5) c.body.setVelocity(dx / d * F.magnetSpeed, dy / d * F.magnetSpeed);
    });
  }

  // Fire one volley of the current weapon level (see weaponLevels in config.js).
  autoFire(time) {
    if (time < this.nextShot) return;
    const lv = C.weaponLevels[this.weaponLevel], sp = C.bullet.speed;
    this.nextShot = time + lv.fireRateMs;
    for (const sh of lv.pattern) {
      const fs = C.bullet.fire;
      const b = this.spawn(this.bullets, fs ? 'sp_fire' : 'pbullet', this.ship.x + sh.dx, this.ship.y - C.ship.shotY, fs ? fs.scale : PX);
      if (!b) continue;
      if (fs) { b.body.setSize(fs.hitW, fs.hitH); b.play('fire_shot'); } else b.anims.stop();
      const a = sh.deg * DEG;
      b.setRotation(a);
      b.dmg = sh.dmg === undefined ? lv.damage : sh.dmg;
      b.body.setVelocity(Math.sin(a) * sp, -Math.cos(a) * sp);
    }
    const F = C.feel;
    this.muzzle.forEach((m, i) => m.setPosition(this.ship.x + (i ? F.muzzleSpread : -F.muzzleSpread), this.ship.y - C.ship.muzzleY).setVisible(true));
    this.muzzleUntil = time + F.muzzleMs;
    this.recoil = 1;
  }

  spawnEnemy(cg, i) {
    const g = cg.g, cfg = C.enemies[g.type];
    this.hud.waveSpawned(cg.w);
    const sp = C.enemies.sprites[g.type]; // animated sheet or null (code-drawn)
    const e = this.spawn(this.enemies, sp ? 'en_' + g.type : g.type, cg.p.sx, cg.p.sy);
    if (!e) return;
    e.sp = sp || null; e.lastX = e.x;
    if (sp) {
      e.setScale(sp.scale).setFlipX(false);
      e.body.setSize(sp.hitW, sp.hitH);
      e.play('en_' + g.type + '_loop');
    } else e.anims.stop(); // pooled sprite may still hold an animation from an earlier life
    initPath(e, cg.p, g.spd);
    e.kind = g.type; e.hp = cfg.hp; e.flashUntil = 0; e.onScreen = false;
    e.fire = g.fire || null; e.armed = false; e.fireT = 0;
    e.coin = g.type === 'shooter' || (g.coinEvery > 0 && (i + 1) % g.coinEvery === 0); // shooters always drop 1 coin
    e.wave = cg.w;
    e.drop = g.drop && i === g.n - 1 ? g.drop : null; // the last enemy of a marked group is the carrier
    e.halo = null; e.halos = null;
    if (e.drop) {
      const key = 'ring_' + g.type + '_' + e.drop;
      if (sp) { // animated enemy: the outline is 4 solid-colour copies of its current frame, pushed up/down/left/right by haloPx. They follow the real shape, so the outline always fits (green = weapon, pink-white = heart)
        const H = C.enemies.haloPx, offs = [[-H, 0], [H, 0], [0, -H], [0, H]];
        e.halos = offs.map(o => { const h = this.halos.get(e.x, e.y, key); if (!h) return null; h.ox = o[0]; h.oy = o[1]; return h.setTexture('en_' + g.type, e.frame.name).setActive(true).setVisible(true).setScale(sp.scale).setTintFill(C.enemies.haloTint[e.drop]).setDepth(-0.5); }).filter(Boolean);
      } else {
        e.halo = this.halos.get(e.x, e.y, key);
        if (e.halo) e.halo.setTexture(key).setActive(true).setVisible(true).setScale(PX).clearTint().setDepth(0);
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

  removeEnemy(e) {
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

  updateEnemies(time, dt) {
    this.enemies.children.iterate(e => {
      if (!e || !e.active) return;
      if (!this.kickMove(e, dt)) { this.enemyLost(e); return; } // flew away
      e.onScreen = this.inside(e);
      if (e.fire && e.wait > 0 && e.onScreen) { // shooters fire only while stopped
        if (!e.armed) { e.armed = true; e.fireT = e.fire.first; }
        e.fireT -= dt;
        if (e.fireT <= 0) { this.enemyShoot(e); e.fireT += e.fire.every; }
      }
      if (e.sp && e.sp.faceVelocity) { // side-view art faces right: flip when moving left (the hit shake is left out)
        const bx = e.x - e.ox, dx = bx - e.lastX; e.lastX = bx;
        if (dx > 0.05) e.setFlipX(false); else if (dx < -0.05) e.setFlipX(true);
      }
      if (time < e.flashUntil) e.setTintFill(0xffffff); else e.clearTint();
      const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * TAU / C.pickup.haloPulseMs));
      if (e.halos) e.halos.forEach(h => h.setFrame(e.frame.name).setFlipX(e.flipX).setPosition(e.x + h.ox, e.y + h.oy).setAlpha(pulse)); // same frame and flip as the enemy, shifted 4 ways
      if (e.halo) e.halo.setPosition(e.x, e.y).setAlpha(pulse);
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
    const tint = C.sprites.crate ? C.sprites.crate.tint : null;
    this.crates.children.iterate(c => {
      if (!c || !c.active) return;
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
      const b = this.spawn(this.enemyBullets, 'ebullet', e.x, e.y + 14);
      if (!b) return;
      b.setDepth(C.enemyBullet.depth); // above all play effects, below the HUD
      b.body.setSize(hit, hit); // only the bright core hurts
      const a = base + (i - (n - 1) / 2) * Phaser.Math.DegToRad(f.spread || 0), v = f.spd || C.enemyBullet.speed;
      b.body.setVelocity(Math.cos(a) * v, Math.sin(a) * v);
    }
  }

  dropCoin(x, y, vx) {
    const m = C.ship.margin;
    const sp = C.sprites.coin;
    const c = this.spawn(this.coins, sp ? 'sp_coin' : 'coin', Phaser.Math.Clamp(x, m, W - m), y, sp ? sp.scale : PX);
    if (!c) return;
    if (sp) { c.play('coin_spin'); c.anims.setCurrentFrame(c.anims.currentAnim.frames[Phaser.Math.Between(0, sp.frames - 1)]); } else c.anims.stop(); // each coin starts at a random frame
    const hb = 2 * C.coin.pickupRadius / (sp ? sp.scale : PX); // generous pickup area (same size on screen whatever the picture)
    c.body.setSize(hb, hb);
    c.body.setVelocity(vx, C.coin.fallSpeed);
    c.mag = false;
    c.body.setDragX(Math.abs(vx) / C.crate.coinFadeSec); // sideways speed fades to 0 in coinFadeSec
    this.coinsSpawned++;
  }

  coinLost() { this.medals.coinLost(); this.syncMedals(); }

  // A pickup (weapon badge / heart) that falls like a coin. Same generous grab radius.
  dropPickup(group, key, fallSpeed, x, y) {
    const m = C.ship.margin;
    const gem = group === this.weaponUps ? C.sprites.weaponGem : null; // animated green gem (weapon upgrade) or the code-drawn potion
    const sp = group === this.heartUps ? C.sprites.heartPickup : gem; // animated heart (Drop, then Idle), gem, or the code-drawn picture
    const p = this.spawn(group, gem ? 'sp_gem' : sp ? 'sp_heart_drop' : key, Phaser.Math.Clamp(x, m, W - m), y, sp ? sp.scale : PX);
    if (!p) return;
    const hb = 2 * C.coin.pickupRadius / (sp ? sp.scale : PX);
    p.body.setSize(hb, hb);
    p.dropping = !!sp && !gem;
    if (gem) { p.play('gem_spin'); p.anims.setCurrentFrame(p.anims.currentAnim.frames[Phaser.Math.Between(0, gem.frames - 1)]); } // loops, random start frame
    else if (sp) p.play('heart_drop'); else p.anims.stop();
    p.body.setVelocity(0, fallSpeed);
  }

  weaponUp() {
    if (this.weaponLevel < C.pickup.maxLevel) this.weaponLevel++;
    this.hud.setLevel(this.weaponLevel);
    this.shipFlashUntil = this.time.now + C.feel.levelFlashMs;
    this.burst(this.ship.x, this.ship.y, C.feel.levelSparkCount, GREEN_TINTS, 1, 3);
    if (C.feel.deathRing) this.ring(this.ship.x, this.ship.y, 0x2ee86a, C.feel.bigDeathRingScale, C.feel.deathRingMs + C.feel.pickupRingExtraMs);
  }

  heartUp(px, py) {
    const sp = C.sprites.heartPickup;
    if (this.hearts < C.ship.hearts) { this.hearts++; this.hud.setHearts(this.hearts); } else { this.addScore(C.pickup.heartScoreIfFull); this.pop(this.ship.x, this.ship.y - C.feel.popTextOffsetY, '+' + C.pickup.heartScoreIfFull); }
    if (sp) this.playFx(this.fxPool, 'sp_heart_collect', 'heart_collect', px, py, sp.scale, sp.collectDepth, null); // the heart jumps and bursts where it was grabbed (replaces the pink ring)
    else if (C.feel.deathRing) this.ring(this.ship.x, this.ship.y, 0xffc9e3, C.feel.bigDeathRingScale, C.feel.deathRingMs + C.feel.pickupRingExtraMs);
  }

  cullOffscreen(time) {
    this.bullets.children.iterate(b => { if (b && b.active && b.y < -20) this.kill(b); });
    const pulse = C.feel.enemyShotPulse, pm = C.feel.enemyShotPulseMs;
    this.enemyBullets.children.iterate(b => {
      if (b && b.active && pulse > 0) b.setScale(PX * (1 + pulse * Math.sin(time * TAU / pm + b.x * 0.2))); // gentle swell
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
    if (e.hp > 0) { if (flash) e.flashUntil = this.time.now + C.enemies.hitFlashMs; if (C.feel.hitKickPx > 0) e.kick = 1; return; }
    const big = e.kind === 'shooter';
    this.explode(e.x, e.y, big, DEATH_TINTS[e.kind]);
    this.pop(e.x, e.y - 6, '+' + C.enemies[e.kind].score);
    if (big) this.bigShake();
    if (e.coin) this.dropCoin(e.x, e.y, 0);
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
    this.explode(c.x, c.y, true, DEATH_TINTS.crate);
    const cs = C.sprites.crate;
    if (cs) this.playFx(this.fxPool, 'sp_crate_break', 'crate_break', c.x, c.y, cs.scale, cs.breakDepth, cs.tint); // chest bursts at the same moment as the coins
    this.bigShake();
    for (let i = 0; i < c.coins; i++) this.dropCoin(c.x, c.y, (i - (c.coins - 1) / 2) * C.crate.coinSpread);
    this.kill(c);
  }

  crashEnemy(e) {
    if (!e.active) return;
    this.explode(e.x, e.y, false, DEATH_TINTS[e.kind]);
    this.enemyLost(e); // no score, no coin, not a kill
  }

  // returns true only if a heart was really lost
  hurtPlayer() {
    if (this.over || this.time.now < this.invulnUntil) return false;
    this.hitsTaken++;
    this.medals.playerHit(); this.syncMedals();
    if (!this.god) { this.hearts--; this.hud.setHearts(this.hearts); }
    this.invulnUntil = this.time.now + C.ship.invulnMs;
    if (this.stunFx && this.hearts > 0) { this.stunUntil = this.time.now + C.sprites.stunned.showMs; this.stunFx.play('stunned'); }
    this.cameras.main.shake(C.ship.hitShakeMs, C.ship.hitShakeAmount);
    this.explode(this.ship.x, this.ship.y, false, WITCH_TINTS, false); // no smoke puff for the witch
    if (C.feel.hitFlashMs > 0) this.flashT = 1; // white-pink screen flash (own rectangle, fades out in updateFx)
    if (this.hearts <= 0) this.gameOver();
    else { this.freezeMs = C.feel.hitStopMs; this.physics.world.pause(); } // hit-stop
    return true;
  }

  bigShake() { this.cameras.main.shake(C.feel.bigShakeMs, C.feel.bigShakeAmount); }

  // Pop in the creature's colours plus a ring puff. big = imp / chest (more sparks, bigger ring).
  explode(x, y, big, tints, puff = true) {
    const F = C.feel, P = C.sprites.poof;
    if (P && puff) this.playFx(this.poofPool, 'sp_poof', 'poof', x, y, P.scale * (big ? P.bigMul : 1), P.depth, null); // smoke puff under the sparks
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
  ring(x, y, tint, size, ms, alpha = 0.9) {
    const r = this.rings.get(x, y, 'fxRing');
    if (!r) return;
    r.setActive(true).setVisible(true).setPosition(x, y).setTint(tint).setDepth(C.feel.ringDepth).setAlpha(alpha);
    r.s1 = size * PX; r.a0 = alpha; r.life = r.max = ms / 1000;
  }

  // Floating text that drifts up and fades.
  pop(x, y, str) {
    if (!C.feel.popText) return;
    const p = this.pops.find(t => !t.visible);
    if (!p) return;
    p.setText(str).setPosition(Phaser.Math.Clamp(x, C.feel.popTextEdge, W - C.feel.popTextEdge), y).setAlpha(1).setVisible(true);
    p.life = C.feel.popTextMs / 1000;
  }

  gameOver() {
    this.vx = this.vy = 0; // clouds stop boosting
    this.endScreen('GAME OVER', hex(C.menu.pal.pink), false);
    this.ship.setVisible(false).setAlpha(1);
  }

  stageClear() {
    this.vx = this.vy = 0;
    this.medals.finish(this.enemiesKilled);
    this.syncMedals();
    const isNew = this.debug ? null : saveMedals(this.medals.state, this.stageTheme); // debug runs are not saved
    if (!this.debug) saveBest(this.score, this.stageTheme);
    this.endScreen('STAGE CLEAR', hex(C.menu.pal.cyan), true, isNew);
    this.ship.setAlpha(1);
  }

  // Shared end screen (game over / stage clear). A tap after the delay restarts the stage.
  endScreen(title, col, stats, isNew) {
    this.over = true;
    this.restartAt = this.time.now + C.ship.restartDelayMs;
    this.ship.body.enable = false;
    this.enemies.children.iterate(e => { if (e && e.active) e.body.setVelocity(0, 0); });
    this.enemyBullets.children.iterate(b => { if (b && b.active) this.kill(b); });
    this.bullets.children.iterate(b => { if (b && b.active) this.kill(b); });
    this.muzzle.forEach(m => m.setVisible(false));
    const ease = C.feel.endEaseMs, fade = []; // everything on the end screen fades in
    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setDepth(60);
    const P = C.menu.pal, CR = hex(P.cream);
    const t = (y, s, size, c, stroke = z(5)) => {
      const o = this.add.text(W / 2, y, s, { ...FONT, fontSize: snap4(z(size)) + 'px', color: c, stroke: hex(P.shadow), strokeThickness: stroke, align: 'center' }).setOrigin(0.5).setDepth(61);
      fade.push(o); return o;
    };
    let tapY = H / 2 + z(60);
    if (!stats) {
      t(H / 2 - z(70), title, 36, col);
      t(H / 2 - z(10), 'SCORE ' + this.score, 26, CR);
    } else {
      t(100, title, 36, col);
      t(138, 'SCORE ' + this.score, 26, CR);
      MEDAL_KEYS.forEach((k, i) => { // the 4 medals, big; NEW under a medal earned for the first time
        const x = W / 2 + (i - 1.5) * 46;
        fade.push(this.add.image(x, 185, 'medal_' + k + '_' + this.medals.state[k]).setScale(3).setDepth(61));
        if (isNew && isNew[k]) t(206, 'NEW', 12, hex(P.orange), 2).setX(x);
      });
      const V = C.coin.value;
      t(228, 'KILLS ' + this.enemiesKilled + '/' + this.enemiesSpawned, 16, CR);
      t(243, 'COINS ' + this.coinsCollected * V + '/' + this.coinsSpawned * V, 16, CR);
      t(258, 'HITS ' + this.hitsTaken, 16, CR);
      tapY = 300;
    }
    const tap = t(tapY, 'TAP TO PLAY AGAIN', 18, hex(P.pink));
    fade.pop(); // the tap text blinks on its own
    const M = C.endMenuBtn, my = H - M.bottom; // MENU button: back to the stage menu
    this.menuBtn = { x: W / 2, y: my, w: M.w, h: M.h };
    const plate = this.add.graphics().setDepth(61); // same purple plate with pink border and dark bottom edge as the menu buttons
    drawPlate(plate, W / 2 - M.w / 2, my - M.h / 2, M.w, M.h, { fill: M.color, border: M.border, down: false });
    fade.push(plate);
    t(my - C.menu.plateDrop / 2, 'MENU', M.size, CR, 2);
    if (ease > 0) {
      veil.setAlpha(0); fade.forEach(o => o.setAlpha(0)); tap.setAlpha(0);
      this.tweens.add({ targets: veil, alpha: 0.55, duration: ease });
      this.tweens.add({ targets: fade, alpha: 1, duration: ease, delay: ease / 3, ease: 'Quad.easeOut' });
    }
    this.tweens.add({ targets: tap, alpha: { from: 1, to: 0.3 }, yoyo: true, repeat: -1, duration: 600, delay: ease });
  }
}

import { CONFIG as C, z } from '../config.js';
import { makeAllTextures, PX } from '../sprites.js';
import { STAGE1 } from '../waves.js';
import { WaveRunner, initPath, followPath } from '../waves-runner.js';
import { Hud, FONT } from '../hud.js';
import { findSprites } from '../forestArt.js';
import { Medals, MEDAL_KEYS, saveMedals } from '../medals.js';

const W = C.game.width, H = C.game.height, R = C.game.render, DEG = Math.PI / 180, TAU = Math.PI * 2;
// Spark colours. Death pops match the creature; no red and no gold on anything that is not a shot / coin.
const DEATH_TINTS = {
  grunt: [0x3c3a8c, 0x8f86d8, 0xffffff],   // bat: indigo
  zigzag: [0xc9c3e8, 0xffffff, 0xd98fb8],  // ghost: lavender
  shooter: [0x1f6b5a, 0x3fb59a, 0xffffff], // imp: teal
  crate: [0xc58f4f, 0x8a5a2b, 0x8a93a6]    // chest: wood + steel
};
const WITCH_TINTS = [0xff7ad9, 0xb15bd6, 0xffffff], SHOT_TINTS = [0xffffff, 0x7fe0ff], TRAIL_TINTS = [0xff7ad9, 0xc89cff, 0xffffff];
const GREEN_TINTS = [0x2ee86a, 0xffffff], COIN_TINTS = [0xfff2a0, 0xffc928]; // coin sparkle is gold (coins only)

export class PlayScene extends Phaser.Scene {
  constructor() { super('Play'); }

  // Loads the witch sheet (assets/witch, art by Svetlana Kushnariova and Jordan Irwin, see CREDITS.md).
  preload() {
    const w = new URLSearchParams(window.location.search).get('witch') === '1' ? 1 : (new URLSearchParams(window.location.search).get('witch') === '2' ? 2 : C.ship.witch);
    this.load.spritesheet('witch', 'assets/witch/witch-' + w + '.png', { frameWidth: 24, frameHeight: 32 });
    // Forest background sheets (assets/forest, licence UNKNOWN for now, see NOTES.md)
    this.load.image('forestPlants', 'assets/forest/plants.png');
    this.load.image('forestGrass', 'assets/forest/grass.png');
  }

  create() {
    makeAllTextures(this);
    // The canvas is R times bigger than the game (sharp text); the camera zooms back so all numbers stay logical.
    this.cameras.main.setZoom(R).centerOn(W / 2, H / 2);
    this.score = 0;
    this.freezeMs = 0;    // hit-stop: game is frozen while > 0
    this.shipFlashUntil = 0; this.muzzleUntil = 0;
    this.recoil = 0; this.trailT = 0; this.vx = 0; this.vy = 0; this.cloudMul = 1; // feel state
    this.hearts = C.ship.hearts;
    this.over = false;
    this.invulnUntil = 0;
    this.nextShot = 0;
    // Debug helpers (type them after the web address): ?wave=N starts the stage at wave N (1-10); ?god=1 = no damage (hits still counted).
    const q = new URLSearchParams(window.location.search);
    this.god = q.get('god') === '1';
    const startWave = Phaser.Math.Clamp(parseInt(q.get('wave'), 10) || 1, 1, STAGE1.length) - 1;
    this.debug = this.god || startWave > 0; // debug runs do not touch the saved medals
    this.weaponLevel = Math.min(C.pickup.maxLevel, startWave); // wave=N starts with weapon level N-1 so later waves can be tried fairly
    this.runner = new WaveRunner(STAGE1, startWave, C.stage.firstWaveDelay);
    this.hooks = { enemy: (cg, i) => this.spawnEnemy(cg, i), crate: cc => this.spawnCrate(cc) };
    this.enemyCount = 0;  // enemies alive now
    this.clearAt = 0;     // time when STAGE CLEAR shows (0 = not yet)
    // Counters for the medals later (shown only on the result screen for now)
    this.enemiesSpawned = 0; this.enemiesKilled = 0; this.coinsSpawned = 0; this.coinsCollected = 0; this.hitsTaken = 0;

    this.makeBackground();
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
    this.stickMode = (q.get('ctl') || C.ship.controls) === 'stick';
    this.stickC = new Phaser.Math.Vector2(W / 2, C.stick.restY); // ring centre
    this.stickV = new Phaser.Math.Vector2();                     // witch speed from the stick
    this.makeStickArt();
    this.input.on('pointerdown', p => {
      if (this.over) { if (this.time.now > this.restartAt) this.scene.restart(); return; }
      if (this.dragId !== null) return;
      this.dragId = p.id;
      this.dragFrom.set(p.x / R, p.y / R); // pointer is in canvas pixels, the game is R times smaller
      this.finger.copy(this.dragFrom);
      this.shipFrom.set(this.target.x, this.target.y); // from the target, so no jump while the ship is still catching up
      if (this.stickMode) this.stickC.copy(this.finger); // the ring appears under the thumb
    });
    this.input.on('pointermove', p => {
      if (p.id !== this.dragId || !p.isDown || this.over) return;
      this.finger.set(p.x / R, p.y / R);
      if (!this.stickMode) this.aimTarget();
    });
    const release = p => { if (p.id === this.dragId) { this.dragId = null; if (this.stickMode) this.stickC.set(W / 2, C.stick.restY); } };
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
    this.physics.add.overlap(this.ship, this.heartUps, (s, p) => { this.kill(p); this.heartUp(); });
    // (crates are in no ship overlap: the ship flies through them)
  }

  // ---------- setup ----------
  makeBackground() {
    const B = C.background;
    const bg = new URLSearchParams(window.location.search).get('bg') || B.mode;
    if (bg !== 'sky') { this.makeForest(); return; }
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

  // Forest seen from above: a plain green floor with props (patches, bushes, stumps, trees) that scroll down and are reused.
  makeForest() {
    const F = C.background.forest;
    this.add.rectangle(0, 0, W, H, F.groundColor).setOrigin(0, 0).setDepth(-10);
    // Cut the sheet into pictures once (the sheet is 1024 x 1024: trees on the left, bushes/stumps/firs on the right).
    const tex = this.textures.get('forestPlants');
    if (!tex.has('tree-0-0')) {
      const img = tex.getSourceImage();
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, cv.width, cv.height).data;
      const add = (name, b) => tex.add(name, 0, b.x, b.y, b.w, b.h);
      findSprites(d, cv.width, cv.height, 0, 690).forEach((row, r) => row.forEach((b, i) => add('tree-' + r + '-' + i, b)));
      findSprites(d, cv.width, cv.height, 690, cv.width).forEach((row, k) => row.forEach((b, i) => add((k % 2 === 0 ? 'bush-' : 'small-') + (k >> 1) + '-' + i, b)));
      const g = this.textures.get('forestGrass'); // two lighter grass patches on the plain green (their edges are the floor colour)
      g.add('patch-0', 0, 43, 8, 43, 43); g.add('patch-1', 0, 96, 10, 94, 44);
    }
    const rows = F.treeRows, wts = F.treeRowWeights, wsum = wts.reduce((a, b) => a + b, 0);
    const pickRow = () => { let n = Math.random() * wsum; for (let i = 0; i < rows.length; i++) { n -= wts[i]; if (n < 0) return rows[i]; } return rows[0]; };
    const frames = (key, prefix) => this.textures.get(key).getFrameNames().filter(n => n.startsWith(prefix));
    const treeNames = frames('forestPlants', 'tree-'), bushNames = frames('forestPlants', 'bush-'), smallNames = frames('forestPlants', 'small-');
    const inRows = (names, r) => names.filter(n => +n.split('-')[1] === r);
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const place = (s, top) => { // choose a new picture, size and spot; top = false for the first fill of the screen
      const hh = s.displayHeight;
      let x = Phaser.Math.Between(0, W);
      if (Math.abs(x - W / 2) < F.laneHalf && Math.random() < F.laneKeep) x = W / 2 + (Math.random() < 0.5 ? -1 : 1) * Phaser.Math.Between(F.laneHalf, W / 2);
      s.x = x; s.y = top ? -hh / 2 - Math.random() * F.gapY : Phaser.Math.Between(0, H);
    };
    const layer = (count, key, depth, chooser, flip) => {
      const items = [];
      for (let i = 0; i < count; i++) {
        const s = this.add.image(0, 0, key, chooser()).setScale(F.scale).setDepth(depth);
        place(s, false);
        items.push(s);
      }
      const respawn = s => {
        s.setFrame(chooser());
        if (flip) s.setFlipX(Math.random() < 0.5);
        place(s, true);
      };
      return { items, speed: F.scroll, respawn, depth };
    };
    this.layers = [
      layer(F.patchCount, 'forestGrass', -9.5, () => 'patch-' + Math.floor(Math.random() * 2), true),
      layer(F.smallCount, 'forestPlants', -9, () => pick(inRows(smallNames, pickRow())), true),
      layer(F.bushCount, 'forestPlants', -8.5, () => pick(inRows(bushNames, pickRow())), true),
      layer(F.treeCount, 'forestPlants', -8, () => pick(inRows(treeNames, pickRow())), true)
    ];
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
    this.rings = this.add.group({ defaultKey: 'fxRing', maxSize: C.feel.ringPoolSize });  // expanding ring puffs
    this.pops = []; // floating score texts, made once and reused
    for (let i = 0; i < C.feel.popPoolSize; i++) {
      this.pops.push(this.add.text(0, 0, '', { ...FONT, fontSize: C.feel.popTextSize + 'px', color: '#ffffff', stroke: '#1b1b2b', strokeThickness: 3 })
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
  makeStickArt() {
    const T = C.stick;
    this.stickRing = this.add.graphics().setDepth(T.depth);
    this.stickRing.lineStyle(1.5, 0xffffff, 1).strokeCircle(0, 0, T.radius);
    this.stickKnob = this.add.graphics().setDepth(T.depth);
    this.stickKnob.fillStyle(0xffffff, 1).fillCircle(0, 0, T.knobRadius);
    this.stickRing.setVisible(this.stickMode); this.stickKnob.setVisible(this.stickMode);
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
    const a = 1 - Math.exp(-T.response * dt);
    this.stickV.x += (wx - this.stickV.x) * a; this.stickV.y += (wy - this.stickV.y) * a;
    const s = this.ship;
    this.target.x = Phaser.Math.Clamp(s.x + this.stickV.x * dt, S.margin, W - S.margin);
    this.target.y = Phaser.Math.Clamp(s.y + this.stickV.y * dt, S.margin, H - S.margin);
    const k = len > T.radius ? T.radius / len : 1; // knob stays inside the ring
    this.stickRing.setPosition(this.stickC.x, this.stickC.y).setAlpha(held ? T.ringAlpha : T.restAlpha);
    this.stickKnob.setPosition(this.stickC.x + dx * k, this.stickC.y + dy * k).setAlpha(held ? T.ringAlpha + 0.1 : T.restAlpha);
  }

  moveShip(dt) {
    const S = C.ship, s = this.ship;
    if (this.stickMode) this.stickTarget(dt);
    else if (this.dragId !== null && !this.over && S.glueRate > 0) {
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
    const dirKey = vx > S.sideSpeed ? 'witch_e' : (vx < -S.sideSpeed ? 'witch_w' : 'witch_n'); // side view when she flies sideways
    if (dirKey !== this.witchAnim) { this.witchAnim = dirKey; s.play(dirKey, true); }
    const want = Phaser.Math.Clamp(vx / S.bankSpeed, -1, 1) * Phaser.Math.DegToRad(S.bankDeg);
    s.rotation += (want - s.rotation) * (1 - Math.exp(-S.bankEase * dt));
  }

  // ---------- helpers ----------
  spawn(group, key, x, y) {
    const o = group.get(x, y, key);
    if (!o) return null; // pool full: skip, never create more
    o.setTexture(key).setActive(true).setVisible(true).setScale(PX).clearTint().setAlpha(1);
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

  addScore(n) { this.score += n; this.hud.setScore(this.score, true); }
  syncMedals() { this.hud.setMedals(this.medals.state); }

  // ---------- gameplay ----------
  update(time, delta) {
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
      if (L.respawn) { if (s.y - s.displayHeight / 2 > H) L.respawn(s); } // forest: reuse the picture at the top
      else if (s.y > H + 40) { s.y = -40; s.x = Phaser.Math.Between(0, W); }
    }
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
      F.trailLifeMs / 1000, Phaser.Math.Between(1, 2) * SS, TRAIL_TINTS[(Math.random() * TRAIL_TINTS.length) | 0], 9, true);
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
      const b = this.spawn(this.bullets, 'pbullet', this.ship.x + sh.dx, this.ship.y - C.ship.shotY);
      if (!b) continue;
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
    const e = this.spawn(this.enemies, g.type, cg.p.sx, cg.p.sy);
    if (!e) return;
    initPath(e, cg.p, g.spd);
    e.kind = g.type; e.hp = cfg.hp; e.flashUntil = 0; e.onScreen = false;
    e.fire = g.fire || null; e.armed = false; e.fireT = 0;
    e.coin = g.type === 'shooter' || (g.coinEvery > 0 && (i + 1) % g.coinEvery === 0); // shooters always drop 1 coin
    e.wave = cg.w;
    e.drop = g.drop && i === g.n - 1 ? g.drop : null; // the last enemy of a marked group is the carrier
    e.halo = null;
    if (e.drop) {
      const key = 'ring_' + g.type + '_' + e.drop;
      e.halo = this.halos.get(e.x, e.y, key);
      if (e.halo) e.halo.setTexture(key).setActive(true).setVisible(true).setScale(PX);
    }
    this.hud.waveAlive(cg.w, 1);
    this.enemyCount++; this.enemiesSpawned++;
  }

  spawnCrate(cc) {
    const c = this.spawn(this.crates, 'crate', cc.p.sx, cc.p.sy);
    if (!c) return;
    initPath(c, cc.p, cc.c.spd);
    c.hp = cc.c.hp; c.coins = cc.c.coins; c.flashUntil = 0; c.onScreen = false;
  }

  removeEnemy(e) {
    if (e.halo) { e.halo.setActive(false).setVisible(false); e.halo = null; }
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
      if (time < e.flashUntil) e.setTintFill(0xffffff); else e.clearTint();
      if (e.halo) e.halo.setPosition(e.x, e.y).setAlpha(0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * TAU / C.pickup.haloPulseMs)));
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
    this.crates.children.iterate(c => {
      if (!c || !c.active) return;
      if (!this.kickMove(c, dt)) { this.kill(c); this.coinLost(); return; } // fell off the bottom: lost with its coins
      c.onScreen = this.inside(c);
      if (time < c.flashUntil) c.setTintFill(0xffffff); else c.clearTint();
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
    const c = this.spawn(this.coins, 'coin', Phaser.Math.Clamp(x, m, W - m), y);
    if (!c) return;
    const hb = 2 * C.coin.pickupRadius / PX; // generous pickup area
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
    const p = this.spawn(group, key, Phaser.Math.Clamp(x, m, W - m), y);
    if (!p) return;
    const hb = 2 * C.coin.pickupRadius / PX;
    p.body.setSize(hb, hb);
    p.body.setVelocity(0, fallSpeed);
  }

  weaponUp() {
    if (this.weaponLevel < C.pickup.maxLevel) this.weaponLevel++;
    this.hud.setLevel(this.weaponLevel);
    this.shipFlashUntil = this.time.now + C.feel.levelFlashMs;
    this.burst(this.ship.x, this.ship.y, C.feel.levelSparkCount, GREEN_TINTS, 1, 3);
    if (C.feel.deathRing) this.ring(this.ship.x, this.ship.y, 0x2ee86a, C.feel.bigDeathRingScale, C.feel.deathRingMs + C.feel.pickupRingExtraMs);
  }

  heartUp() {
    if (this.hearts < C.ship.hearts) { this.hearts++; this.hud.setHearts(this.hearts); } else { this.addScore(C.pickup.heartScoreIfFull); this.pop(this.ship.x, this.ship.y - C.feel.popTextOffsetY, '+' + C.pickup.heartScoreIfFull); }
    if (C.feel.deathRing) this.ring(this.ship.x, this.ship.y, 0xffc9e3, C.feel.bigDeathRingScale, C.feel.deathRingMs + C.feel.pickupRingExtraMs);
  }

  cullOffscreen(time) {
    this.bullets.children.iterate(b => { if (b && b.active && b.y < -20) this.kill(b); });
    const pulse = C.feel.enemyShotPulse, pm = C.feel.enemyShotPulseMs;
    this.enemyBullets.children.iterate(b => {
      if (b && b.active && pulse > 0) b.setScale(PX * (1 + pulse * Math.sin(time * TAU / pm + b.x * 0.2))); // gentle swell
      if (b && b.active && (b.y > H + 20 || b.y < -20 || b.x < -20 || b.x > W + 20)) this.kill(b);
    });
    this.coins.children.iterate(c => { if (c && c.active && c.y > H + 20) { this.kill(c); this.coinLost(); } });
    for (const grp of [this.weaponUps, this.heartUps]) grp.children.iterate(p => { if (p && p.active && p.y > H + 20) this.kill(p); });
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
    this.cameras.main.shake(C.ship.hitShakeMs, C.ship.hitShakeAmount);
    this.explode(this.ship.x, this.ship.y, false, WITCH_TINTS);
    if (C.feel.hitFlashMs > 0) this.flashT = 1; // white-pink screen flash (own rectangle, fades out in updateFx)
    if (this.hearts <= 0) this.gameOver();
    else { this.freezeMs = C.feel.hitStopMs; this.physics.world.pause(); } // hit-stop
    return true;
  }

  bigShake() { this.cameras.main.shake(C.feel.bigShakeMs, C.feel.bigShakeAmount); }

  // Pop in the creature's colours plus a ring puff. big = imp / chest (more sparks, bigger ring).
  explode(x, y, big, tints) {
    const F = C.feel;
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
    this.endScreen('GAME OVER', '#ff5a5a', false);
    this.ship.setVisible(false).setAlpha(1);
  }

  stageClear() {
    this.vx = this.vy = 0;
    this.medals.finish(this.enemiesKilled);
    this.syncMedals();
    const isNew = this.debug ? null : saveMedals(this.medals.state); // debug runs are not saved
    this.endScreen('STAGE CLEAR', '#8dff6a', true, isNew);
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
    const t = (y, s, size, c, stroke = z(5)) => {
      const o = this.add.text(W / 2, y, s, { ...FONT, fontSize: z(size) + 'px', color: c, stroke: '#1b1b2b', strokeThickness: stroke, align: 'center' }).setOrigin(0.5).setDepth(61);
      fade.push(o); return o;
    };
    let tapY = H / 2 + z(60);
    if (!stats) {
      t(H / 2 - z(70), title, 36, col);
      t(H / 2 - z(10), 'SCORE ' + this.score, 26, '#ffffff');
    } else {
      t(100, title, 36, col);
      t(138, 'SCORE ' + this.score, 26, '#ffffff');
      MEDAL_KEYS.forEach((k, i) => { // the 4 medals, big; NEW under a medal earned for the first time
        const x = W / 2 + (i - 1.5) * 46;
        fade.push(this.add.image(x, 185, 'medal_' + k + '_' + this.medals.state[k]).setScale(3).setDepth(61));
        if (isNew && isNew[k]) t(206, 'NEW', 12, '#8dff6a', 2).setX(x);
      });
      const V = C.coin.value;
      t(228, 'KILLS ' + this.enemiesKilled + '/' + this.enemiesSpawned, 16, '#ffffff');
      t(243, 'COINS ' + this.coinsCollected * V + '/' + this.coinsSpawned * V, 16, '#ffffff');
      t(258, 'HITS ' + this.hitsTaken, 16, '#ffffff');
      tapY = 300;
    }
    const tap = t(tapY, 'TAP TO PLAY AGAIN', 18, '#ffffff');
    fade.pop(); // the tap text blinks on its own
    if (ease > 0) {
      veil.setAlpha(0); fade.forEach(o => o.setAlpha(0)); tap.setAlpha(0);
      this.tweens.add({ targets: veil, alpha: 0.55, duration: ease });
      this.tweens.add({ targets: fade, alpha: 1, duration: ease, delay: ease / 3, ease: 'Quad.easeOut' });
    }
    this.tweens.add({ targets: tap, alpha: { from: 1, to: 0.3 }, yoyo: true, repeat: -1, duration: 600, delay: ease });
  }
}

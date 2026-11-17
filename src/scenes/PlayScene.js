import { CONFIG as C, z } from '../config.js';
import { makeAllTextures, PX } from '../sprites.js';
import { STAGE1 } from '../waves.js';
import { WaveRunner, initPath, followPath } from '../waves-runner.js';
import { Hud, FONT } from '../hud.js';
import { Medals, MEDAL_KEYS, saveMedals } from '../medals.js';

const W = C.game.width, H = C.game.height, DEG = Math.PI / 180, TAU = Math.PI * 2;
const FIRE_TINTS = [0xffe14d, 0xff7a1c], GREEN_TINTS = [0x2ee86a, 0xffffff], COIN_TINTS = [0xe6b8ff, 0xffffff];

export class PlayScene extends Phaser.Scene {
  constructor() { super('Play'); }

  create() {
    makeAllTextures(this);
    this.score = 0;
    this.freezeMs = 0;    // hit-stop: game is frozen while > 0
    this.shipFlashUntil = 0; this.muzzleUntil = 0;
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
    this.input.on('pointerdown', p => {
      if (this.over) { if (this.time.now > this.restartAt) this.scene.restart(); return; }
      if (this.dragId !== null) return;
      this.dragId = p.id;
      this.dragFrom.set(p.x, p.y);
      this.shipFrom.set(this.target.x, this.target.y); // from the target, so no jump while the ship is still catching up
    });
    this.input.on('pointermove', p => {
      if (p.id !== this.dragId || !p.isDown || this.over) return;
      const S = C.ship;
      // The finger sets the TARGET (1:1). The ship eases toward it in update().
      this.target.x = Phaser.Math.Clamp(this.shipFrom.x + (p.x - this.dragFrom.x) * S.dragSensitivity, S.margin, W - S.margin);
      this.target.y = Phaser.Math.Clamp(this.shipFrom.y + (p.y - this.dragFrom.y) * S.dragSensitivity, S.margin, H - S.margin);
    });
    const release = p => { if (p.id === this.dragId) this.dragId = null; };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    // Collisions
    this.physics.add.overlap(this.bullets, this.enemies, (b, e) => this.bulletHitsEnemy(b, e));
    this.physics.add.overlap(this.bullets, this.crates, (b, c) => this.bulletHitsCrate(b, c));
    this.physics.add.overlap(this.ship, this.enemyBullets, (s, b) => { this.kill(b); this.hurtPlayer(); });
    this.physics.add.overlap(this.ship, this.enemies, (s, e) => { if (e.onScreen && this.hurtPlayer() && C.ship.ramKillsEnemy) this.crashEnemy(e); });
    this.physics.add.overlap(this.ship, this.coins, (s, c) => {
      this.kill(c); this.coinsCollected++; this.addScore(C.coin.value);
      this.burst(c.x, c.y, C.feel.coinSparkCount, COIN_TINTS, C.feel.coinSparkSpeedMul, 3); // coin pop
    });
    this.physics.add.overlap(this.ship, this.weaponUps, (s, p) => { this.kill(p); this.weaponUp(); });
    this.physics.add.overlap(this.ship, this.heartUps, (s, p) => { this.kill(p); this.heartUp(); });
    // (crates are in no ship overlap: the ship flies through them)
  }

  // ---------- setup ----------
  makeBackground() {
    const B = C.background;
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

  makePools() {
    const mk = (key, size) => this.physics.add.group({ defaultKey: key, maxSize: size });
    this.bullets = mk('pbullet', C.bullet.poolSize);
    this.enemyBullets = mk('ebullet', C.enemyBullet.poolSize);
    this.enemies = mk('grunt', C.enemies.poolSize);
    this.coins = mk('coin', C.coin.poolSize);
    this.crates = mk('crate', C.crate.poolSize);
    this.weaponUps = mk('weaponUp', 4);
    this.heartUps = mk('heartUp', 4);
    this.sparks = this.add.group({ defaultKey: 'square', maxSize: C.particles.poolSize });
    this.halos = this.add.group({ defaultKey: 'square', maxSize: C.pickup.haloPoolSize }); // glowing outlines of carriers
    // muzzle flash: two small white pixels at the nose, shown for a few ms on every volley
    this.muzzle = [0, 1].map(() => this.add.image(0, 0, 'square').setScale(C.feel.muzzleSize).setDepth(11).setVisible(false));
  }

  makeShip() {
    this.ship = this.physics.add.image(W / 2, C.ship.startY, 'hero').setScale(PX).setDepth(10);
    const hb = 2 * C.ship.hitRadius / PX; // body size is in art pixels; centred on the sprite
    this.ship.body.setSize(hb, hb);
    this.target = new Phaser.Math.Vector2(this.ship.x, this.ship.y); // where the finger wants the ship
  }

  // Ease the ship toward the target (light inertia, no overshoot) and bank it a little.
  moveShip(dt) {
    const S = C.ship, s = this.ship;
    const k = 1 - Math.exp(-S.followRate * dt);
    const px = s.x;
    s.x += (this.target.x - s.x) * k;
    s.y += (this.target.y - s.y) * k;
    if (Math.abs(this.target.x - s.x) < 0.25) s.x = this.target.x;
    if (Math.abs(this.target.y - s.y) < 0.25) s.y = this.target.y;
    const vx = dt > 0 ? (s.x - px) / dt : 0;
    const want = Phaser.Math.Clamp(vx / S.bankSpeed, -1, 1) * Phaser.Math.DegToRad(S.bankDeg);
    s.rotation += (want - s.rotation) * (1 - Math.exp(-S.bankEase * dt));
  }

  // ---------- helpers ----------
  spawn(group, key, x, y) {
    const o = group.get(x, y, key);
    if (!o) return null; // pool full: skip, never create more
    o.setTexture(key).setActive(true).setVisible(true).setScale(PX).clearTint().setAlpha(1);
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
    if (this.over) { this.updateSparks(dt); return; }

    this.moveShip(dt);
    this.autoFire(time);
    this.runner.update(dt, this.enemyCount, this.hooks);
    this.updateEnemies(time, dt);
    this.updateCrates(time, dt);
    this.cullOffscreen();
    if (!this.clearAt && this.runner.finished && this.enemyCount === 0 && this.crates.countActive(true) === 0 && this.coins.countActive(true) === 0 && this.weaponUps.countActive(true) === 0 && this.heartUps.countActive(true) === 0) this.clearAt = time + C.stage.endDelayMs;
    if (this.clearAt && time >= this.clearAt) { this.stageClear(); return; }
    this.updateSparks(dt);

    // invulnerability blink
    if (time < this.invulnUntil) {
      this.ship.setAlpha(Math.floor(time / C.ship.blinkMs) % 2 ? 0.25 : 1);
    } else this.ship.setAlpha(1);
    if (time < this.shipFlashUntil) this.ship.setTintFill(0xb8ffd0); else this.ship.clearTint(); // level-up flash
    if (this.muzzle[0].visible && time >= this.muzzleUntil) this.muzzle.forEach(m => m.setVisible(false));
  }

  scrollBackground(dt) {
    for (const L of this.layers) for (const s of L.items) {
      s.y += L.speed * dt;
      if (s.y > H + 40) { s.y = -40; s.x = Phaser.Math.Between(0, W); }
    }
  }

  // Fire one volley of the current weapon level (see weaponLevels in config.js).
  autoFire(time) {
    if (time < this.nextShot) return;
    const lv = C.weaponLevels[this.weaponLevel], sp = C.bullet.speed;
    this.nextShot = time + lv.fireRateMs;
    for (const sh of lv.pattern) {
      const b = this.spawn(this.bullets, 'pbullet', this.ship.x + sh.dx, this.ship.y - 18);
      if (!b) continue;
      const a = sh.deg * DEG;
      b.setRotation(a);
      b.dmg = sh.dmg === undefined ? lv.damage : sh.dmg;
      b.body.setVelocity(Math.sin(a) * sp, -Math.cos(a) * sp);
    }
    const F = C.feel;
    this.muzzle.forEach((m, i) => m.setPosition(this.ship.x + (i ? F.muzzleSpread : -F.muzzleSpread), this.ship.y - 21).setVisible(true));
    this.muzzleUntil = time + F.muzzleMs;
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
      if (!followPath(e, dt)) { this.enemyLost(e); return; } // flew away
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

  updateCrates(time, dt) {
    this.crates.children.iterate(c => {
      if (!c || !c.active) return;
      if (!followPath(c, dt)) { this.kill(c); this.coinLost(); return; } // fell off the bottom: lost with its coins
      c.onScreen = this.inside(c);
      if (time < c.flashUntil) c.setTintFill(0xffffff); else c.clearTint();
    });
  }

  enemyShoot(e) {
    const f = e.fire, n = f.shots;
    const base = f.aim === 'player' ? Math.atan2(this.ship.y - (e.y + 14), this.ship.x - e.x) : Math.PI / 2;
    const hit = C.enemyBullet.hitSize;
    for (let i = 0; i < n; i++) {
      const b = this.spawn(this.enemyBullets, 'ebullet', e.x, e.y + 14);
      if (!b) return;
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
  }

  heartUp() {
    if (this.hearts < C.ship.hearts) { this.hearts++; this.hud.setHearts(this.hearts); } else this.addScore(C.pickup.heartScoreIfFull);
  }

  cullOffscreen() {
    this.bullets.children.iterate(b => { if (b && b.active && b.y < -20) this.kill(b); });
    this.enemyBullets.children.iterate(b => {
      if (b && b.active && (b.y > H + 20 || b.y < -20 || b.x < -20 || b.x > W + 20)) this.kill(b);
    });
    this.coins.children.iterate(c => { if (c && c.active && c.y > H + 20) { this.kill(c); this.coinLost(); } });
    for (const grp of [this.weaponUps, this.heartUps]) grp.children.iterate(p => { if (p && p.active && p.y > H + 20) this.kill(p); });
  }

  bulletHitsEnemy(b, e) {
    if (!b.active || !e.active || !e.onScreen) return;
    this.kill(b);
    this.damageEnemy(e, b.dmg, true);
  }

  damageEnemy(e, dmg, flash) {
    if (!e.active) return;
    e.hp -= dmg;
    if (e.hp > 0) { if (flash) e.flashUntil = this.time.now + C.enemies.hitFlashMs; return; }
    const big = e.kind === 'shooter';
    this.explode(e.x, e.y, big);
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
    this.kill(b);
    c.hp -= b.dmg;
    if (c.hp > 0) { c.flashUntil = this.time.now + C.enemies.hitFlashMs; return; }
    this.explode(c.x, c.y, true);
    this.bigShake();
    for (let i = 0; i < c.coins; i++) this.dropCoin(c.x, c.y, (i - (c.coins - 1) / 2) * C.crate.coinSpread);
    this.kill(c);
  }

  crashEnemy(e) {
    if (!e.active) return;
    this.explode(e.x, e.y);
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
    this.explode(this.ship.x, this.ship.y);
    if (this.hearts <= 0) this.gameOver();
    else { this.freezeMs = C.feel.hitStopMs; this.physics.world.pause(); } // hit-stop
    return true;
  }

  bigShake() { this.cameras.main.shake(C.feel.bigShakeMs, C.feel.bigShakeAmount); }

  explode(x, y, big = false) {
    const F = C.feel;
    this.burst(x, y, big ? F.bigExplosionCount : C.particles.perExplosion, FIRE_TINTS, big ? F.bigExplosionSpeedMul : 1, big ? 5 : 4);
  }

  // n little squares flying out of (x, y); they come from a pool and fade out.
  burst(x, y, n, tints, speedMul, maxScale) {
    const P = C.particles;
    for (let i = 0; i < n; i++) {
      const s = this.sparks.get(x, y, 'square');
      if (!s) return;
      const a = Math.random() * TAU, v = P.speed * speedMul * (0.4 + Math.random() * 0.6);
      s.setActive(true).setVisible(true).setScale(Phaser.Math.Between(2, maxScale)).setPosition(x, y);
      s.setTint(tints[(Math.random() * tints.length) | 0]).setAlpha(1).setDepth(20);
      s.vx = Math.cos(a) * v; s.vy = Math.sin(a) * v; s.life = P.lifeMs / 1000; s.max = s.life;
    }
  }

  updateSparks(dt) {
    this.sparks.children.iterate(s => {
      if (!s || !s.active) return;
      s.life -= dt;
      if (s.life <= 0) { s.setActive(false).setVisible(false); return; }
      s.x += s.vx * dt; s.y += s.vy * dt; s.setAlpha(s.life / s.max);
    });
  }

  gameOver() {
    this.endScreen('GAME OVER', '#ff5a5a', false);
    this.ship.setVisible(false).setAlpha(1);
  }

  stageClear() {
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
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setDepth(60);
    const t = (y, s, size, c, stroke = z(5)) => this.add.text(W / 2, y, s, { ...FONT, fontSize: z(size) + 'px', color: c, stroke: '#1b1b2b', strokeThickness: stroke, align: 'center' }).setOrigin(0.5).setDepth(61);
    let tapY = H / 2 + z(60);
    if (!stats) {
      t(H / 2 - z(70), title, 36, col);
      t(H / 2 - z(10), 'SCORE ' + this.score, 26, '#ffe14d');
    } else {
      t(100, title, 36, col);
      t(138, 'SCORE ' + this.score, 26, '#ffe14d');
      MEDAL_KEYS.forEach((k, i) => { // the 4 medals, big; NEW under a medal earned for the first time
        const x = W / 2 + (i - 1.5) * 46;
        this.add.image(x, 185, 'medal_' + k + '_' + this.medals.state[k]).setScale(3).setDepth(61);
        if (isNew && isNew[k]) t(206, 'NEW', 12, '#8dff6a', 2).setX(x);
      });
      const V = C.coin.value;
      t(228, 'KILLS ' + this.enemiesKilled + '/' + this.enemiesSpawned, 16, '#ffffff');
      t(243, 'COINS ' + this.coinsCollected * V + '/' + this.coinsSpawned * V, 16, '#ffffff');
      t(258, 'HITS ' + this.hitsTaken, 16, '#ffffff');
      tapY = 300;
    }
    const tap = t(tapY, 'TAP TO PLAY AGAIN', 18, '#ffffff');
    this.tweens.add({ targets: tap, alpha: 0.3, yoyo: true, repeat: -1, duration: 600 });
  }
}

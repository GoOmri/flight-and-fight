import { CONFIG as C, z } from '../config.js';
import { makeAllTextures, PX } from '../sprites.js';
import { STAGE1 } from '../waves.js';
import { WaveRunner, initPath, followPath } from '../waves-runner.js';

const W = C.game.width, H = C.game.height;
const FONT = { fontFamily: '"Courier New", monospace', fontStyle: 'bold', resolution: 2 }; // resolution 2 = crisper text
// HUD sizes were written for 360x640; z() keeps them the same size on the phone screen.

export class PlayScene extends Phaser.Scene {
  constructor() { super('Play'); }

  create() {
    makeAllTextures(this);
    this.score = 0;
    this.hearts = C.ship.hearts;
    this.over = false;
    this.invulnUntil = 0;
    this.nextShot = 0;
    // Debug helpers (type them after the web address): ?wave=N starts the stage at wave N (1-10); ?god=1 = no damage (hits still counted).
    const q = new URLSearchParams(window.location.search);
    this.god = q.get('god') === '1';
    const startWave = Phaser.Math.Clamp(parseInt(q.get('wave'), 10) || 1, 1, STAGE1.length) - 1;
    this.runner = new WaveRunner(STAGE1, startWave, C.stage.firstWaveDelay);
    this.hooks = { enemy: (cg, i) => this.spawnEnemy(cg, i), crate: cc => this.spawnCrate(cc) };
    this.enemyCount = 0;  // enemies alive now
    this.clearAt = 0;     // time when STAGE CLEAR shows (0 = not yet)
    // Counters for the medals later (shown only on the result screen for now)
    this.enemiesSpawned = 0; this.enemiesKilled = 0; this.coinsSpawned = 0; this.coinsCollected = 0; this.hitsTaken = 0;

    this.makeBackground();
    this.makePools();
    this.makeShip();
    this.makeHud();

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
    this.physics.add.overlap(this.ship, this.coins, (s, c) => { this.kill(c); this.coinsCollected++; this.addScore(C.coin.value); });
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
    this.sparks = this.add.group({ defaultKey: 'square', maxSize: C.particles.poolSize });
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

  makeHud() {
    this.scoreText = this.add.text(z(8), z(6), 'SCORE 0', { ...FONT, fontSize: z(18) + 'px', color: '#ffffff', stroke: '#1b1b2b', strokeThickness: z(4) }).setDepth(50);
    this.versionText = this.add.text(z(8), z(30), 'v' + C.version, { ...FONT, fontSize: z(11) + 'px', color: '#ffffff', stroke: '#1b1b2b', strokeThickness: 1 }).setAlpha(0.6).setDepth(50);
    this.heartIcons = [];
    for (let i = 0; i < C.ship.hearts; i++) {
      this.heartIcons.push(this.add.image(W - z(12) - i * z(26), z(16), 'heart').setScale(PX / C.game.zoom).setOrigin(1, 0.5).setDepth(50));
    }
    this.refreshHearts();
  }

  refreshHearts() {
    // icon 0 is the rightmost; hearts are lost from the right
    const n = C.ship.hearts;
    this.heartIcons.forEach((ic, i) => ic.setTexture(n - 1 - i < this.hearts ? 'heart' : 'heartEmpty'));
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

  addScore(n) { this.score += n; this.scoreText.setText('SCORE ' + this.score); }

  // ---------- gameplay ----------
  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.scrollBackground(dt);
    if (this.over) { this.updateSparks(dt); return; }

    this.moveShip(dt);
    this.autoFire(time);
    this.runner.update(dt, this.enemyCount, this.hooks);
    this.updateEnemies(time, dt);
    this.updateCrates(time, dt);
    this.cullOffscreen();
    if (!this.clearAt && this.runner.finished && this.enemyCount === 0 && this.crates.countActive(true) === 0 && this.coins.countActive(true) === 0) this.clearAt = time + C.stage.endDelayMs;
    if (this.clearAt && time >= this.clearAt) { this.stageClear(); return; }
    this.updateSparks(dt);

    // invulnerability blink
    if (time < this.invulnUntil) {
      this.ship.setAlpha(Math.floor(time / C.ship.blinkMs) % 2 ? 0.25 : 1);
    } else this.ship.setAlpha(1);
  }

  scrollBackground(dt) {
    for (const L of this.layers) for (const s of L.items) {
      s.y += L.speed * dt;
      if (s.y > H + 40) { s.y = -40; s.x = Phaser.Math.Between(0, W); }
    }
  }

  autoFire(time) {
    if (time < this.nextShot) return;
    this.nextShot = time + C.bullet.fireRateMs;
    for (const side of [-1, 1]) {
      const b = this.spawn(this.bullets, 'pbullet', this.ship.x + side * C.bullet.twinOffset, this.ship.y - 18);
      if (b) b.body.setVelocity(0, -C.bullet.speed);
    }
  }

  spawnEnemy(cg, i) {
    const g = cg.g, cfg = C.enemies[g.type];
    const e = this.spawn(this.enemies, g.type, cg.p.sx, cg.p.sy);
    if (!e) return;
    initPath(e, cg.p, g.spd);
    e.kind = g.type; e.hp = cfg.hp; e.flashUntil = 0; e.onScreen = false;
    e.fire = g.fire || null; e.armed = false; e.fireT = 0;
    e.coin = g.type === 'shooter' || (g.coinEvery > 0 && (i + 1) % g.coinEvery === 0); // shooters always drop 1 coin
    this.enemyCount++; this.enemiesSpawned++;
  }

  spawnCrate(cc) {
    const c = this.spawn(this.crates, 'crate', cc.p.sx, cc.p.sy);
    if (!c) return;
    initPath(c, cc.p, cc.c.spd);
    c.hp = cc.c.hp; c.coins = cc.c.coins; c.flashUntil = 0; c.onScreen = false;
  }

  removeEnemy(e) { this.kill(e); this.enemyCount--; }

  // An enemy can only be hit or hurt while its centre is inside the screen.
  inside(o) { return o.x > 0 && o.x < W && o.y > 0 && o.y < H; }

  updateEnemies(time, dt) {
    this.enemies.children.iterate(e => {
      if (!e || !e.active) return;
      if (!followPath(e, dt)) { this.removeEnemy(e); return; } // flew away
      e.onScreen = this.inside(e);
      if (e.fire && e.wait > 0 && e.onScreen) { // shooters fire only while stopped
        if (!e.armed) { e.armed = true; e.fireT = e.fire.first; }
        e.fireT -= dt;
        if (e.fireT <= 0) { this.enemyShoot(e); e.fireT += e.fire.every; }
      }
      if (time < e.flashUntil) e.setTintFill(0xffffff); else e.clearTint();
    });
  }

  updateCrates(time, dt) {
    this.crates.children.iterate(c => {
      if (!c || !c.active) return;
      if (!followPath(c, dt)) { this.kill(c); return; } // fell off the bottom: lost with its coins
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

  cullOffscreen() {
    this.bullets.children.iterate(b => { if (b && b.active && b.y < -20) this.kill(b); });
    this.enemyBullets.children.iterate(b => {
      if (b && b.active && (b.y > H + 20 || b.y < -20 || b.x < -20 || b.x > W + 20)) this.kill(b);
    });
    this.coins.children.iterate(c => { if (c && c.active && c.y > H + 20) this.kill(c); });
  }

  bulletHitsEnemy(b, e) {
    if (!b.active || !e.active || !e.onScreen) return;
    this.kill(b);
    this.damageEnemy(e, C.bullet.damage, true);
  }

  damageEnemy(e, dmg, flash) {
    if (!e.active) return;
    e.hp -= dmg;
    if (e.hp > 0) { if (flash) e.flashUntil = this.time.now + C.enemies.hitFlashMs; return; }
    this.explode(e.x, e.y);
    if (e.coin) this.dropCoin(e.x, e.y, 0);
    this.addScore(C.enemies[e.kind].score);
    this.enemiesKilled++;
    this.removeEnemy(e);
  }

  // Crates are not enemies: no score, no kill count. Opening one spills its coins.
  bulletHitsCrate(b, c) {
    if (!b.active || !c.active || !c.onScreen) return;
    this.kill(b);
    c.hp -= C.bullet.damage;
    if (c.hp > 0) { c.flashUntil = this.time.now + C.enemies.hitFlashMs; return; }
    this.explode(c.x, c.y);
    for (let i = 0; i < c.coins; i++) this.dropCoin(c.x, c.y, (i - (c.coins - 1) / 2) * C.crate.coinSpread);
    this.kill(c);
  }

  crashEnemy(e) {
    if (!e.active) return;
    this.explode(e.x, e.y);
    this.removeEnemy(e); // no score, no coin, not a kill
  }

  // returns true only if a heart was really lost
  hurtPlayer() {
    if (this.over || this.time.now < this.invulnUntil) return false;
    this.hitsTaken++;
    if (!this.god) { this.hearts--; this.refreshHearts(); }
    this.invulnUntil = this.time.now + C.ship.invulnMs;
    this.cameras.main.shake(C.ship.hitShakeMs, C.ship.hitShakeAmount);
    this.explode(this.ship.x, this.ship.y);
    if (this.hearts <= 0) this.gameOver();
    return true;
  }

  explode(x, y) {
    const P = C.particles;
    for (let i = 0; i < P.perExplosion; i++) {
      const s = this.sparks.get(x, y, 'square');
      if (!s) return;
      const a = Math.random() * Math.PI * 2, v = P.speed * (0.4 + Math.random() * 0.6);
      s.setActive(true).setVisible(true).setScale(Phaser.Math.Between(2, 4)).setPosition(x, y);
      s.setTint(Math.random() < 0.5 ? 0xffe14d : 0xff7a1c).setAlpha(1).setDepth(20);
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

  stageClear() { this.endScreen('STAGE CLEAR', '#8dff6a', true); this.ship.setAlpha(1); }

  // Shared end screen (game over / stage clear). A tap after the delay restarts the stage.
  endScreen(title, col, stats) {
    this.over = true;
    this.restartAt = this.time.now + C.ship.restartDelayMs;
    this.ship.body.enable = false;
    this.enemies.children.iterate(e => { if (e && e.active) e.body.setVelocity(0, 0); });
    this.enemyBullets.children.iterate(b => { if (b && b.active) this.kill(b); });
    this.bullets.children.iterate(b => { if (b && b.active) this.kill(b); });
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setDepth(60);
    const t = (y, s, size, c) => this.add.text(W / 2, y, s, { ...FONT, fontSize: z(size) + 'px', color: c, stroke: '#1b1b2b', strokeThickness: z(5), align: 'center' }).setOrigin(0.5).setDepth(61);
    const dy = stats ? 50 : 0;
    t(H / 2 - z(70 + dy), title, 36, col);
    t(H / 2 - z(10 + dy), 'SCORE ' + this.score, 26, '#ffe14d');
    if (stats) {
      const V = C.coin.value, small = (y, s) => t(H / 2 + z(y), s, 16, '#ffffff');
      small(-12, 'KILLS ' + this.enemiesKilled + '/' + this.enemiesSpawned);
      small(10, 'COINS ' + this.coinsCollected * V + '/' + this.coinsSpawned * V);
      small(32, 'HITS ' + this.hitsTaken);
    }
    const tap = t(H / 2 + z(60 + dy), 'TAP TO PLAY AGAIN', 18, '#ffffff');
    this.tweens.add({ targets: tap, alpha: 0.3, yoyo: true, repeat: -1, duration: 600 });
  }
}

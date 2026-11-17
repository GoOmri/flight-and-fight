import { CONFIG as C, z } from '../config.js';
import { makeAllTextures, PX } from '../sprites.js';

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
    this.clock = 0;       // game time in seconds (for the wave timeline)
    this.spawnQueue = [];
    this.waveIndex = 0;
    this.loopOffset = 0;

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
    this.physics.add.overlap(this.ship, this.enemyBullets, (s, b) => { this.kill(b); this.hurtPlayer(); });
    this.physics.add.overlap(this.ship, this.enemies, (s, e) => { if (this.hurtPlayer() && C.ship.ramKillsEnemy) this.crashEnemy(e); });
    this.physics.add.overlap(this.ship, this.coins, (s, c) => { this.kill(c); this.addScore(C.coin.value); });
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
    this.sparks = this.add.group({ defaultKey: 'square', maxSize: C.particles.poolSize });
  }

  makeShip() {
    this.ship = this.physics.add.image(W / 2, C.ship.startY, 'hero').setScale(PX).setDepth(10);
    this.ship.body.setSize(C.ship.hitbox, C.ship.hitbox);
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
    this.runWaves(dt);
    this.updateEnemies(time, dt);
    this.cullOffscreen();
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

  runWaves(dt) {
    this.clock += dt;
    const waves = C.waves;
    while (this.waveIndex < waves.length && this.clock >= this.loopOffset + waves[this.waveIndex].t) {
      const w = waves[this.waveIndex++];
      for (let i = 0; i < w.count; i++) {
        this.spawnQueue.push({ at: this.loopOffset + w.t + i * w.gap, type: w.type, x: w.x });
      }
    }
    if (this.waveIndex >= waves.length && this.clock >= this.loopOffset + C.loopLength) {
      this.loopOffset += C.loopLength; this.waveIndex = 0;
    }
    this.spawnQueue = this.spawnQueue.filter(q => {
      if (this.clock < q.at) return true;
      this.spawnEnemy(q.type, q.x);
      return false;
    });
  }

  spawnEnemy(type, fx) {
    const cfg = C.enemies[type];
    const x = fx < 0 ? Phaser.Math.Between(30, W - 30) : fx * W;
    const e = this.spawn(this.enemies, type, x, -20);
    if (!e) return;
    e.kind = type; e.hp = cfg.hp; e.baseX = x; e.age = 0; e.flashUntil = 0; e.nextShot = 0; e.leaving = false; e.stopAt = 0;
    e.body.setVelocity(0, cfg.speed);
  }

  updateEnemies(time, dt) {
    this.enemies.children.iterate(e => {
      if (!e || !e.active) return;
      const cfg = C.enemies[e.kind];
      e.age += dt;
      if (e.kind === 'zigzag') {
        e.x = e.baseX + Math.sin(e.age * cfg.swayFreq) * cfg.swayAmp;
      } else if (e.kind === 'shooter') {
        if (!e.leaving && e.y >= cfg.stopY && e.body.velocity.y > 0) {
          e.body.setVelocity(0, 0); e.stopAt = time; e.baseX = e.x; e.nextShot = time + cfg.firstShotMs;
        }
        if (e.body.velocity.y === 0 && !e.leaving) {
          e.x = e.baseX + Math.sin((time - e.stopAt) / cfg.hoverMs) * cfg.hoverAmp; // gentle hover
          if (time >= e.nextShot) { this.enemyShoot(e, cfg); e.nextShot = time + cfg.fireMs; }
          if (time - e.stopAt > cfg.stayMs) { e.leaving = true; e.body.setVelocity(0, cfg.speed * cfg.leaveSpeedMul); }
        }
      }
      if (time < e.flashUntil) e.setTintFill(0xffffff); else e.clearTint();
    });
  }

  enemyShoot(e, cfg) {
    const b = this.spawn(this.enemyBullets, 'ebullet', e.x, e.y + 16);
    if (!b) return;
    const a = Math.atan2(this.ship.y - b.y, this.ship.x - b.x);
    b.body.setVelocity(Math.cos(a) * cfg.bulletSpeed, Math.sin(a) * cfg.bulletSpeed);
  }

  cullOffscreen() {
    this.bullets.children.iterate(b => { if (b && b.active && b.y < -20) this.kill(b); });
    this.enemyBullets.children.iterate(b => {
      if (b && b.active && (b.y > H + 20 || b.y < -20 || b.x < -20 || b.x > W + 20)) this.kill(b);
    });
    this.enemies.children.iterate(e => { if (e && e.active && e.y > H + 30) this.kill(e); });
    this.coins.children.iterate(c => { if (c && c.active && c.y > H + 20) this.kill(c); });
  }

  bulletHitsEnemy(b, e) {
    if (!b.active || !e.active) return;
    this.kill(b);
    this.damageEnemy(e, C.bullet.damage, true);
  }

  damageEnemy(e, dmg, flash) {
    if (!e.active) return;
    e.hp -= dmg;
    if (e.hp > 0) { if (flash) e.flashUntil = this.time.now + C.enemies.hitFlashMs; return; }
    const cfg = C.enemies[e.kind];
    this.explode(e.x, e.y);
    if (Math.random() < cfg.coinChance) {
      const c = this.spawn(this.coins, 'coin', e.x, e.y);
      if (c) c.body.setVelocity(0, C.coin.fallSpeed);
    }
    this.addScore(cfg.score);
    this.kill(e);
  }

  crashEnemy(e) {
    if (!e.active) return;
    this.explode(e.x, e.y);
    this.kill(e); // no score, no coin
  }

  // returns true only if a heart was really lost
  hurtPlayer() {
    if (this.over || this.time.now < this.invulnUntil) return false;
    this.hearts--;
    this.refreshHearts();
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
    this.over = true;
    this.restartAt = this.time.now + C.ship.restartDelayMs;
    this.ship.setVisible(false).setAlpha(1);
    this.ship.body.enable = false;
    this.enemies.children.iterate(e => { if (e && e.active) e.body.setVelocity(0, 0); });
    this.enemyBullets.children.iterate(b => { if (b && b.active) this.kill(b); });
    this.bullets.children.iterate(b => { if (b && b.active) this.kill(b); });
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setDepth(60);
    const t = (y, s, size, col) => this.add.text(W / 2, y, s, { ...FONT, fontSize: z(size) + 'px', color: col, stroke: '#1b1b2b', strokeThickness: z(5), align: 'center' }).setOrigin(0.5).setDepth(61);
    t(H / 2 - z(70), 'GAME OVER', 36, '#ff5a5a');
    t(H / 2 - z(10), 'SCORE ' + this.score, 26, '#ffe14d');
    const tap = t(H / 2 + z(60), 'TAP TO PLAY AGAIN', 18, '#ffffff');
    this.tweens.add({ targets: tap, alpha: 0.3, yoyo: true, repeat: -1, duration: 600 });
  }
}

// Cat rescue (v1.9.90): a worried cat sits on a stone that scrolls down with the ground. The witch hovers over it: a ring around it fills (about 2 s),
// drains slowly when she leaves, and loses a bit when she is hit inside. Full = the cat jumps happily and leaps to the top left. A cat that scrolls off the bottom is lost.
// Pictures: the CC0 "Pet Cats Pack" (assets/cats): Sitting (waiting), Meow (+ puff), Run (the happy jumps). Same strips for all 6 colours.
import { CONFIG as C } from './config.js';
import { goalScale } from './sprites.js';

const CC = C.cats, W = C.game.width, H = C.game.height;
export const CAT_COLORS = [1, 2, 3, 4, 5, 6]; // Siamese, black, ginger, grey tabby, fluffy white, sphynx

export function loadCatArt(scene, v) {
  const L = scene.load, T = scene.textures;
  for (const n of CAT_COLORS) {
    if (!T.exists('cat' + n + '_sit')) {
      L.spritesheet('cat' + n + '_sit', 'assets/cats/cat-' + n + '-sitting.png?v=' + v, { frameWidth: 50, frameHeight: 50 });
      L.spritesheet('cat' + n + '_meow', 'assets/cats/cat-' + n + '-meow.png?v=' + v, { frameWidth: 50, frameHeight: 50 });
      L.spritesheet('cat' + n + '_run', 'assets/cats/cat-' + n + '-run.png?v=' + v, { frameWidth: 50, frameHeight: 50 });
    }
  }
  if (!T.exists('cat_meowfx')) L.spritesheet('cat_meowfx', 'assets/cats/meow-vfx.png?v=' + v, { frameWidth: 16, frameHeight: 16 });
}

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ringColor = f => (f < 0.25 ? 0x8a5560 : f < 0.5 ? 0xff7ac8 : f < 0.75 ? 0xa8ff9d : 0x3dff7a); // dull red-brown, pink, light green, bright green (no gold, no bright red)

export class Cats {
  constructor(scene, startWave) {
    this.s = scene;
    this.list = [];
    this.waves = CC.atWave.filter(w => w > startWave); // the (0-based) stage waves at whose first enemy a cat appears
    this.total = this.waves.length;
    this.spawned = 0; this.saved = 0; this.lost = 0;
    this.colors = CAT_COLORS.slice().sort(() => Math.random() - 0.5); // 3 random colours per stage
    this.makeArt();
  }

  makeArt() {
    const s = this.s;
    for (const n of CAT_COLORS) {
      if (!s.anims.exists('cat' + n + '_meow')) {
        s.anims.create({ key: 'cat' + n + '_meow', frames: s.anims.generateFrameNumbers('cat' + n + '_meow', { start: 0, end: 3 }), frameRate: 8, repeat: 0 });
        s.anims.create({ key: 'cat' + n + '_run', frames: s.anims.generateFrameNumbers('cat' + n + '_run', { start: 0, end: 7 }), frameRate: 16, repeat: -1 });
      }
    }
    if (!s.anims.exists('cat_meowfx')) s.anims.create({ key: 'cat_meowfx', frames: s.anims.generateFrameNumbers('cat_meowfx', { start: 0, end: 2 }), frameRate: 8, repeat: 0 });
    if (!s.textures.exists('cat_stone')) { // the spot the cat sits on: a flat grey stone drawn in code (14 x 7 art px)
      const g = s.make.graphics({ x: 0, y: 0, add: false }), col = { k: 0x2a2540, a: 0x9a9eb5, b: 0x6b6f8a };
      const rows = ['....kkkkkk....', '..kkaaaaaakk..', '.kaaaaaaaaaak.', 'kaaaabbbbaaaak', 'kabbbbbbbbbbak', 'kbbbbbbbbbbbbk', '.kkkkkkkkkkkk.'];
      rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') { g.fillStyle(col[ch], 1); g.fillRect(x, y, 1, 1); } }));
      g.generateTexture('cat_stone', 14, 7); g.destroy();
    }
  }

  // Called when an enemy of wave w spawns: starts the next cat when its wave begins.
  onWave(n) {
    while (this.spawned < this.total && n >= this.waves[this.spawned]) this.spawn();
  }

  spawn() {
    const s = this.s, id = this.colors[this.spawned % 6], x = Phaser.Math.Between(CC.ringRx + 20, W - CC.ringRx - 20), y = -30;
    const e = s.rockKit ? s.rockKit.rock() : null; // the cat sits on one of the game's own rocks
    const stone = e ? s.add.image(x, y, e.key, e.frame).setScale(CC.stoneScale).setFlipX(Math.random() < 0.5) : s.add.image(x, y, 'cat_stone').setScale(CC.scale);
    stone.setDepth(CC.depth);
    const top = e ? Math.round(stone.displayHeight * CC.stoneTop) : 4; // how far above the stone's middle the cat's feet are
    const cat = s.add.sprite(x, y - top, 'cat' + id + '_sit', 0).setScale(CC.scale).setOrigin(0.5, CC.footY).setDepth(CC.depth + 0.1);
    const ring = s.add.graphics().setDepth(CC.depth + 0.2); // drawn in front of the cat's lower half
    const fx = s.add.sprite(x, y, 'cat_meowfx', 0).setScale(CC.scale).setDepth(CC.depth + 0.3).setVisible(false);
    this.list.push({ id, x, y, top, stone, cat, ring, fx, state: 'wait', fill: 0, inside: false, meowT: 1.2, t: 0, bits: [], hearts: [] });
    this.spawned++;
  }

  update(dt) {
    const s = this.s, ground = s.bgF.scroll * s.cloudMul * dt;
    for (const c of this.list) {
      if (c.state === 'gone') continue;
      if (c.state === 'leftover') { c.sy += ground; c.stone.setPosition(Math.round(c.x0), Math.round(c.sy)); if (c.sy > H + 20) { c.stone.destroy(); c.state = 'gone'; } continue; } // the empty stone scrolls away
      if (c.state === 'saved') { this.updateSaved(c, dt, ground); continue; }
      c.y += ground; // sits on the ground: moves exactly like it
      const cy = c.y - c.top - 3; // the ring sits at the cat's feet; the witch counts as inside when her centre is within ringHitR of the cat's body
      c.inside = !s.over && Math.hypot(s.ship.x - c.x, s.ship.y - (cy - 4)) <= CC.ringHitR;
      c.fill = clamp(c.fill + (c.inside ? dt / CC.fillS : -dt * CC.drainMul / CC.fillS), 0, 1);
      c.state = c.inside ? 'hover' : 'wait';
      c.meowT -= dt; // the cat calls for help, more often as the ring fills
      if (c.meowT <= 0) { this.meow(c); c.meowT = CC.meowSlowS + (CC.meowFastS - CC.meowSlowS) * c.fill + Math.random() * 0.8; }
      c.stone.setPosition(Math.round(c.x), Math.round(c.y));
      c.cat.setPosition(Math.round(c.x), Math.round(c.y - c.top));
      this.drawRing(c, cy);
      if (c.fill >= 1) { this.save(c); continue; }
      if (c.y > H + 40) this.lose(c);
    }
  }

  meow(c) {
    c.cat.play('cat' + c.id + '_meow');
    c.cat.once('animationcomplete', () => { if (c.state !== 'saved' && c.state !== 'gone') c.cat.setTexture('cat' + c.id + '_sit', 0); });
    c.fx.setPosition(Math.round(c.x + CC.fxDx), Math.round(c.y - c.top + CC.fxDy)).setVisible(true).play('cat_meowfx');
    c.fx.once('animationcomplete', () => c.fx.setVisible(false));
  }

  // The ring is a flat ellipse around the cat's feet (seen from above at an angle), thick, in front of the cat's lower half.
  drawRing(c, cy) {
    const g = c.ring, rx = CC.ringRx, ry = CC.ringRy; g.clear();
    const arc = (a0, a1) => { g.beginPath(); const n = Math.max(2, Math.ceil((a1 - a0) / 0.15)); for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, px = c.x + Math.cos(a) * rx, py = cy + Math.sin(a) * ry; if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.strokePath(); };
    g.lineStyle(CC.ringW + 2, 0x1a0830, 0.6); arc(0, Math.PI * 2); // empty ring: a dark band
    const col = ringColor(c.fill);
    for (let i = 0; i < 8; i++) { // 8 segments, clockwise from the top
      const f = clamp(c.fill * 8 - i, 0, 1);
      if (f <= 0) continue;
      const a0 = -Math.PI / 2 + i * Math.PI / 4;
      g.lineStyle(CC.ringW, col, 1); arc(a0, a0 + f * Math.PI / 4 - 0.03);
    }
  }

  save(c) {
    const s = this.s;
    c.state = 'saved'; c.t = 0; c.x0 = c.x; c.sy = c.y; // sy = the stone's y (it stays on the ground)
    c.ring.clear(); c.fx.setVisible(false);
    c.cat.anims.stop(); c.cat.play('cat' + c.id + '_run');
    for (let i = 0; i < 9; i++) { // a burst of small gold stars
      const a = (i / 9) * Math.PI * 2, im = s.add.image(c.x, c.y - c.top - 10, 'star_earned').setScale(0.5).setDepth(CC.depth + 0.5);
      c.bits.push({ im, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70 - 20, life: 0.8 });
    }
    for (let i = 0; i < 2; i++) { // small thank-you hearts float out of the cat's head
      const h = s.add.image(c.x + (i ? 5 : -2), c.y - c.top + CC.headDy, 'goal_noHit_earned').setScale(goalScale(s, 'noHit', 9)).setDepth(CC.depth + 0.5).setAlpha(0);
      c.hearts.push({ im: h, d: i * 0.3, x0: h.x });
    }
    this.saved++;
    s.onCatSaved(this.saved, this.total);
  }

  updateSaved(c, dt, ground) {
    c.t += dt; c.sy += ground;
    const J = CC.jumpS, T = CC.leapS;
    for (const b of c.bits) { b.life -= dt; b.im.x += b.vx * dt; b.im.y += b.vy * dt; b.vy += 120 * dt; b.im.setAlpha(clamp(b.life / 0.5, 0, 1)); }
    for (const h of c.hearts) { const u = c.t - h.d; if (u < 0) continue; h.im.y -= 14 * dt; h.im.x = h.x0 + Math.sin(u * 6) * 2; h.im.setAlpha(clamp(Math.min(u * 6, 1.2 - u), 0, 1)); }
    let x, y, sc = CC.scale;
    if (c.t < J) { // two happy jumps in place (the cat stays above its stone)
      x = c.x0; y = c.sy - c.top - Math.abs(Math.sin(Math.PI * 2 * c.t / J)) * CC.jumpPx;
    } else { // a leap in an arc to the top left (the hut)
      const u = clamp((c.t - J) / T, 0, 1), e = u * u * (3 - 2 * u), y0 = c.sy - c.top;
      x = c.x0 + (CC.hut.x - c.x0) * e; y = y0 + (CC.hut.y - y0) * e - Math.sin(Math.PI * e) * CC.arcPx; sc = CC.scale * (1 - 0.6 * e);
      c.cat.setFlipX(CC.hut.x < c.x0);
      if (u >= 1) { this.finish(c); return; }
    }
    c.cat.setPosition(Math.round(x), Math.round(y)).setScale(sc);
    c.stone.setPosition(Math.round(c.x0), Math.round(c.sy)); // the stone stays on the ground and scrolls away
  }

  finish(c) {
    c.state = 'leftover';
    [c.cat, c.ring, c.fx, ...c.hearts.map(h => h.im), ...c.bits.map(b => b.im)].forEach(o => o && o.destroy());
  }

  lose(c) {
    c.state = 'gone'; this.lost++;
    [c.cat, c.stone, c.ring, c.fx].forEach(o => o && o.destroy());
    this.s.onCatLost();
  }

  // a hit while hovering costs the ring a part of its fill
  hurt() { for (const c of this.list) if (c.inside && c.state !== 'saved' && c.state !== 'gone') c.fill = Math.max(0, c.fill - CC.hitLoss); }

  idle() { return this.spawned >= this.total && this.list.every(c => c.state === 'gone' || c.state === 'leftover'); } // all cats are done (saved or lost)
  allSaved() { return this.saved >= this.total; }
}

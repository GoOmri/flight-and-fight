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
  if (!T.exists('star_spin')) L.spritesheet('star_spin', 'assets/pickups/star-lit.png?v=' + v, { frameWidth: 32, frameHeight: 45 }); // the gallery's spinning power-star: first row = 24 idle frames
  if (!T.exists('cat_meowfx')) L.spritesheet('cat_meowfx', 'assets/cats/meow-vfx.png?v=' + v, { frameWidth: 16, frameHeight: 16 });
}

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// The fill colour swaps through the same colours as the witch's trail particles (pink, lilac, blue, mint, violet, white), blending smoothly from one to the next.
const mix = (a, b, t) => { const ch = s => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t); return (ch(16) << 16) | (ch(8) << 8) | ch(0); };
const ringColor = clock => { const P = CC.ringColors, x = clock * CC.ringColorSpeed, i = Math.floor(x) % P.length; return mix(P[i], P[(i + 1) % P.length], x - Math.floor(x)); };

export class Cats {
  constructor(scene, startWave) {
    this.s = scene;
    this.list = [];
    this.waves = CC.atWave.filter(w => w >= startWave); // the (0-based) stage waves at whose first enemy a cat appears
    this.total = this.waves.length;
    this.spawned = 0; this.saved = 0; this.lost = 0; this.clock = 0;
    this.parts = []; this.emit = 0; // colourful sparks rising from the rings
    this.colors = CAT_COLORS.slice().sort(() => Math.random() - 0.5); // 3 random colours per stage
    this.makeArt();
  }

  // The row of the cat's last pixel (0..1 of the 50 px picture): the sprite's origin, so its feet stand exactly at the spot.
  footOf(id) {
    this.foot = this.foot || {};
    if (this.foot[id] !== undefined) return this.foot[id];
    let f = CC.footY;
    try {
      const img = this.s.textures.get('cat' + id + '_sit').getSourceImage(), cv = document.createElement('canvas'); cv.width = 50; cv.height = 50;
      const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, 50, 50, 0, 0, 50, 50);
      const d = cx.getImageData(0, 0, 50, 50).data;
      for (let y = 49; y >= 0; y--) { let any = false; for (let x = 0; x < 50; x++) if (d[(y * 50 + x) * 4 + 3] > 20) { any = true; break; } if (any) { f = (y + 1) / 50; break; } }
    } catch (e) { /* keep the default */ }
    return (this.foot[id] = f);
  }

  makeArt() {
    const s = this.s;
    for (const n of CAT_COLORS) {
      if (!s.anims.exists('cat' + n + '_meow')) {
        s.anims.create({ key: 'cat' + n + '_meow', frames: s.anims.generateFrameNumbers('cat' + n + '_meow', { start: 0, end: 3 }), frameRate: 8, repeat: 0 });
        s.anims.create({ key: 'cat' + n + '_run', frames: s.anims.generateFrameNumbers('cat' + n + '_run', { start: 0, end: 7 }), frameRate: 16, repeat: -1 });
      }
    }
    this.runOff = this.runOff || {}; // per colour: how far the cat's body centre sits from its average centre in each run frame (the pictures lean forward and snap back: we cancel that, and only the smooth slide moves the cat)
    for (const n of CAT_COLORS) {
      if (this.runOff[n]) continue;
      try {
        const img = s.textures.get('cat' + n + '_run').getSourceImage(), cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
        const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0); const cs = [];
        for (let i = 0; i < img.width / 50; i++) { const d = cx.getImageData(i * 50, 0, 50, 50).data; let a = 99, b = -1; for (let q = 0; q < 2500; q++) if (d[q * 4 + 3] > 0) { const px = q % 50; if (px < a) a = px; if (px > b) b = px; } cs.push(b < 0 ? 25 : (a + b) / 2); }
        const m = cs.reduce((u, v) => u + v, 0) / cs.length; this.runOff[n] = cs.map(v => v - m);
      } catch (e) { this.runOff[n] = null; }
    }
    if (!s.anims.exists('star_spin')) s.anims.create({ key: 'star_spin', frames: s.anims.generateFrameNumbers('star_spin', { start: 0, end: 23 }), frameRate: 24, repeat: -1 });
    if (!s.anims.exists('cat_meowfx')) s.anims.create({ key: 'cat_meowfx', frames: s.anims.generateFrameNumbers('cat_meowfx', { start: 0, end: 2 }), frameRate: 8, repeat: 0 });
    if (!s.textures.exists('cat_glow')) { // a smooth round light, used additively behind every cat so it stands out from the ground
      const cv = s.textures.createCanvas('cat_glow', 64, 64), cx = cv.getContext(), g = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,110,215,0.8)'); g.addColorStop(0.4, 'rgba(255,110,215,0.45)'); g.addColorStop(0.75, 'rgba(255,110,215,0.14)'); g.addColorStop(1, 'rgba(255,110,215,0)'); // a saturated pink: white added on a light ground was invisible
      cx.fillStyle = g; cx.fillRect(0, 0, 64, 64); cv.refresh(); cv.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    if (!s.textures.exists('cat_spark')) { // a tiny white square, tinted per spark
      const g = s.make.graphics({ x: 0, y: 0, add: false }); g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 2, 2); g.generateTexture('cat_spark', 2, 2); g.destroy();
    }
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
    stone.setDepth(CC.stoneDepth); // the rock stays under the colour tint like the background; the cat, ring, glow and sparks are above it (so the tint does not dull them)
    const top = -Math.round(stone.displayHeight / 2 + CC.footDrop); // the cat stands IN FRONT of the rock: its last pixel row is a little lower than the rock's bottom edge (negative = below the rock's middle)
    const cat = s.add.sprite(x, y - top, 'cat' + id + '_sit', 0).setScale(CC.scale).setOrigin(0.5, this.footOf(id)).setDepth(CC.depth + 0.03);
    const glow = s.add.image(x, y, 'cat_glow').setDepth(CC.depth + 0.01); // behind the cat and its ring, above the rock (normal blend: it shows on any ground)
    const ringBack = s.add.graphics().setDepth(CC.depth + 0.02); // the back half of the ring: behind the cat, above the rock
    const ring = s.add.graphics().setDepth(CC.depth + 0.04); // the front half: in front of the cat's feet
    const fx = s.add.sprite(x, y, 'cat_meowfx', 0).setScale(CC.scale).setDepth(CC.depth + 0.05).setVisible(false);
    this.list.push({ id, x, y, top, stone, cat, glow, ring, ringBack, fx, state: 'wait', fill: 0, inside: false, meowT: 1.2, t: 0, bits: [], hearts: [] });
    this.spawned++;
  }

  update(dt) {
    this.clock += dt;
    const s = this.s, ground = s.bgF.scroll * s.cloudMul * dt;
    this.updateSparks(dt, ground);
    for (const c of this.list) {
      if (c.state === 'gone') continue;
      if (c.state === 'leftover') { c.sy += ground; c.stone.setPosition(Math.round(c.x0), Math.round(c.sy)); if (c.sy > H + 20) { c.stone.destroy(); c.state = 'gone'; } continue; } // the empty stone scrolls away
      if (c.state === 'saved') { this.updateSaved(c, dt, ground); continue; }
      c.y += ground; // sits on the ground: moves exactly like it
      const cy = c.y - c.top - 1; // the ring is centred on the cat's feet; the witch counts as inside when her centre is within ringHitR of the cat's body
      c.inside = !s.over && Math.hypot(s.ship.x - c.x, s.ship.y - (cy - 8)) <= CC.ringHitR;
      c.fill = clamp(c.fill + (c.inside ? dt / CC.fillS : -dt * CC.drainMul / CC.fillS), 0, 1);
      c.state = c.inside ? 'hover' : 'wait';
      c.grow = clamp((c.grow || 0) + (c.inside ? 1 : -1) * dt * CC.ringGrowSpeed, 0, 1); // the ring swells while she hovers and shrinks back when she leaves
      c.meowT -= dt; // the cat calls for help, more often as the ring fills
      if (c.meowT <= 0) { this.meow(c); c.meowT = CC.meowSlowS + (CC.meowFastS - CC.meowSlowS) * c.fill + Math.random() * 0.8; }
      c.stone.setPosition(Math.round(c.x), Math.round(c.y));
      this.placeGlow(c);
      c.cat.setPosition(Math.round(c.x) + CC.catDx, Math.round(c.y - c.top) + CC.catDy); // the cat sits a little left and lower than the ring's middle (looks centred)
      this.drawRing(c, cy);
      c.cat.x += c.shx; c.cat.y += c.shy;
      if (c.fill >= 1) { this.save(c); continue; }
      if (c.y > H + 40) this.lose(c);
    }
  }

  // Colourful sparks (the trail colours) rise from every ring, more of them while the witch hovers.
  updateSparks(dt, ground) {
    const s = this.s;
    let rate = 0;
    for (const c of this.list) if (c.state === 'wait' || c.state === 'hover') rate += (CC.sparkRate + (CC.sparkRateHover - CC.sparkRate) * (c.grow || 0)) * (1 + CC.sparkFillMul * c.fill); // more sparks as the ring fills
    this.emit += rate * dt;
    while (this.emit >= 1) {
      this.emit -= 1;
      const live = this.list.filter(c => c.state === 'wait' || c.state === 'hover');
      if (!live.length || this.parts.length >= CC.sparkMax * (1 + Math.max(...live.map(q => q.fill)))) break;
      const c = live[Math.floor(Math.random() * live.length)], k = c.grow || 0, r = CC.ringRx + (CC.ringRxBig - CC.ringRx) * k, a = (this.sparkA = (this.sparkA || 0) + 2.4); // each spark starts 2.4 rad (the golden angle) after the last one: they spread evenly all around the ring
      let sx = c.x + Math.cos(a) * r, sy = c.y - c.top - 1 + Math.sin(a) * r, far = false;
      if (c.state === 'hover' && Math.random() < CC.farShare) { const R = 8 + Math.random() * 16, A = Math.random() * Math.PI * 2; sx = s.ship.x + Math.cos(A) * R; sy = s.ship.y + Math.sin(A) * R; far = A; } // while she hovers many sparks are born far out around her, from every direction, and get sucked in
      const im = s.add.image(sx, sy, 'cat_spark').setDepth(CC.depth + 0.06).setTint(CC.ringColors[Math.floor(Math.random() * CC.ringColors.length)]);
      this.parts.push({ far, c, im, vy: -(CC.sparkRise * (0.7 + Math.random() * 0.6)), life: CC.sparkLife * (1 + CC.sparkFillLife * c.fill) * (0.7 + Math.random() * 0.6), max: 0, ph: Math.random() * 6 });
      this.parts[this.parts.length - 1].max = this.parts[this.parts.length - 1].life;
    }
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i]; p.life -= dt;
      if (p.life <= 0) { p.im.destroy(); this.parts.splice(i, 1); continue; }
      if (p.c.state === 'hover' && !s.over) { // she hovers over the cat: each spark first shoots up (fast, braking), then dives into the witch with a very sharp ease-in
        if (!p.pull) { p.big = Math.random() < CC.fastShare; p.upMul = 0.6 + Math.random() * 0.6; p.la = p.far !== false ? p.far : Math.random() * Math.PI * 2; if (p.far !== false) p.upMul = 0.12; // far sparks: a tiny outward tremble, then the dive // every spark pops out at its own angle (any direction)
           p.im.setBlendMode(1); } // additive: the sparks glow, so they show on the dark witch // only some sparks swell when they go fast
        p.pull = (p.pull || 0) + dt;
        p.im.setDepth(s.ship.depth + 0.2); // pulled sparks are drawn over the witch: you see them flow into her
        const U = CC.suckUpS, u = p.pull;
        p.life = Math.max(p.life, 0.3); // a pulled spark lives until it arrives
        p.im.setRotation(0);
        if (u < U) { const k = 1 - u / U; const v = CC.suckUp * p.upMul * k * k * dt; p.im.x += Math.cos(p.la) * v; p.im.y += Math.sin(p.la) * v; p.im.setAlpha(0.75).setScale(1); continue; }
        const w = u - U, dx = s.ship.x - p.im.x, dy = s.ship.y - p.im.y, d = Math.hypot(dx, dy), spd = 20 + CC.suckSharp * w * w, step = spd * dt;
        if (d <= step + 4) { p.im.destroy(); this.parts.splice(i, 1); continue; }
        p.im.x += dx / d * step; p.im.y += dy / d * step;
        p.im.setAlpha(0.75).setScale(Math.min(1, 0.6 + d / 80) + (p.big ? CC.fastGrow * Math.min(1, spd / 900) : 0)); // the fast ones grow by a pixel or two
        continue;
      }
      if (p.pull) p.im.setBlendMode(0);
      p.pull = 0;
      p.im.setDepth(CC.depth + 0.06);
      p.im.y += (p.vy * (1 + CC.riseFillMul * p.c.fill) * dt) + ground; p.im.x += Math.sin(p.ph + p.life * 5) * 6 * dt; // rises, sways a little and rides with the ground
      p.im.setAlpha(clamp(p.life / (p.max * 0.5), 0, 1)).setScale(0.45 + 0.6 * clamp(p.life / p.max, 0, 1)).setRotation(0); // faster near the end, and so fast they stretch into strips
    }
  }

  // The light behind the cat follows its body and pulses gently.
  placeGlow(c) {
    const p = 1 + 0.12 * Math.sin(this.clock * CC.glowPulse);
    c.glow.setPosition(c.cat.x, c.cat.y - 9).setScale(CC.glowSize / 64 * p).setAlpha(CC.glowAlpha * (0.88 + 0.12 * Math.sin(this.clock * CC.glowPulse)));
  }

  meow(c) {
    c.cat.play('cat' + c.id + '_meow');
    c.cat.once('animationcomplete', () => { if (c.state !== 'saved' && c.state !== 'gone') c.cat.setTexture('cat' + c.id + '_sit', 0); });
    c.fx.setPosition(Math.round(c.x + CC.fxDx), Math.round(c.y - c.top + CC.fxDy)).setVisible(true).play('cat_meowfx');
    c.fx.once('animationcomplete', () => c.fx.setVisible(false));
  }

  // The ring is a plain circle around the cat's feet: its BACK half (upper) is drawn behind the cat, its FRONT half (lower) in front of the cat's feet.
  // It is drawn as filled ring pieces (not thick lines): thick lines left thin see-through gaps (spokes) between their pieces on some phones.
  drawRing(c, cy) {
    const k = c.grow || 0, r = CC.ringRx + (CC.ringRxBig - CC.ringRx) * k, w = CC.ringW + (CC.ringWBig - CC.ringW) * k; // bigger and thicker while the witch hovers, so it can be seen around her
    const r0 = r - w / 2, r1 = r + w / 2;
    const sk = clamp((c.fill - CC.shakeFrom) / (1 - CC.shakeFrom), 0, 1), sh = sk * sk * CC.shakePx, ox = (Math.random() - 0.5) * 2 * sh, oy = (Math.random() - 0.5) * 2 * sh; c.shx = ox * CC.catShake; c.shy = oy * CC.catShake; // the ring (and the cat a little) tremble more and more as it nears the end: about to burst
    c.ring.clear(); c.ringBack.clear();
    const piece = (g, a0, a1, col) => { // one filled piece of the ring between two angles
      const n = Math.max(2, Math.ceil((a1 - a0) / 0.1)); g.fillStyle(col, 1); g.beginPath();
      for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, x = c.x + ox + Math.cos(a) * r1, y = cy + oy + Math.sin(a) * r1; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      for (let i = n; i >= 0; i--) { const a = a0 + (a1 - a0) * i / n; g.lineTo(c.x + ox + Math.cos(a) * r0, cy + oy + Math.sin(a) * r0); }
      g.closePath(); g.fillPath();
    };
    const draw = (a0, a1, col) => { // split at the left and right ends: the lower half (sin >= 0) is the front, the upper half the back
      for (const [lo, hi, g] of [[0, Math.PI, c.ring], [Math.PI, Math.PI * 2, c.ringBack], [Math.PI * 2, Math.PI * 3, c.ring], [-Math.PI, 0, c.ringBack]]) {
        const s0 = Math.max(a0, lo), s1 = Math.min(a1, hi);
        if (s1 - s0 > 0.001) piece(g, s0, s1, col);
      }
    };
    draw(0, Math.PI * 2, 0x3f3060); // the empty ring: one plain dark band
    if (c.fill > 0.005) draw(-Math.PI / 2, -Math.PI / 2 + c.fill * Math.PI * 2, ringColor(this.clock)); // the fill: clockwise from the top
  }

  save(c) {
    const s = this.s;
    c.state = 'saved'; c.t = 0; c.x0 = c.x; c.sy = c.y; // sy = the stone's y (it stays on the ground)
    c.ring.clear(); c.ringBack.clear(); c.fx.setVisible(false);
    c.cat.anims.stop(); c.cat.setTexture('cat' + c.id + '_run', 3); c.running = false; // while it jumps in place it holds one leaping pose; the run cycle starts only when it really starts to run
    c.dir = c.x < W / 2 ? -1 : 1; c.cat.setFlipX(c.dir < 0); // face the way it will run from the very first jump (the pictures face right)
    for (let i = 0; i < 7; i++) { // 3 small hearts and 4 tiny sparkles shoot off like fireworks (no stars: a gold star means a goal), slow down and fade
      const heart = i < 3, a = Math.random() * Math.PI * 2, v = (heart ? 70 : 90) + Math.random() * 70, x = c.x, y = c.y - c.top - 10;
      const im = (heart ? s.add.image(x, y, 'goal_noHit_earned') : s.add.image(x, y, 'cat_spark').setTint([0xffd0e8, 0xffffff, 0xffe9a8][i % 3])).setDepth(CC.depth + 0.5);
      c.bits.push({ im, s1: heart ? goalScale(s, 'noHit', 8) * (0.9 + Math.random() * 0.3) : 1.5 + Math.random(), age: 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 25, life: 0.8 + Math.random() * 0.3 });
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
    const J = CC.jumpS;
    for (const b of c.bits) { b.life -= dt; b.age += dt; b.im.setScale(b.s1 * (0.25 + 0.75 * Math.min(1, b.age / 0.35))); // starts small and grows as it flies
      b.im.x += b.vx * dt; b.im.y += b.vy * dt + ground; const f = Math.max(0, 1 - 3.2 * dt); b.vx *= f; b.vy = b.vy * f + 30 * dt; b.im.setAlpha(clamp(b.life / 0.5, 0, 1)); } // fireworks: fast at first, slowing down, a little fall
    for (const h of c.hearts) { const u = c.t - h.d; if (u < 0) continue; h.im.y -= 14 * dt; h.im.x = h.x0 + Math.sin(u * 6) * 2; h.im.setAlpha(clamp(Math.min(u * 6, 1.2 - u), 0, 1)); }
    let x, y;
    if (c.t < J) { // two happy jumps in place (the cat stays above its stone)
      x = c.x0; y = c.sy - c.top - Math.abs(Math.sin(Math.PI * 2 * c.t / J)) * CC.jumpPx;
    } else { // then it runs along the ground to the closest side edge and out of the screen
      const dir = c.dir, run = (c.t - J) * CC.runSpeed;
      if (!c.running) { c.running = true; c.cat.play('cat' + c.id + '_run'); }
      x = c.x0 + dir * run; y = c.sy - c.top;
      if (x < -30 || x > W + 30) { this.finish(c); return; }
    }
    const ro = this.runOff && this.runOff[c.id], fr = c.running ? c.cat.anims.currentFrame : null;
    if (ro && fr) x -= (ro[parseInt(fr.textureFrame, 10)] || 0) * c.cat.scaleX * (c.dir < 0 ? -1 : 1); // cancel the picture's own forward lean so the run is one smooth slide
    c.cat.setPosition(Math.round(x) + CC.catDx, Math.round(y) + CC.catDy);
    this.placeGlow(c);
    c.stone.setPosition(Math.round(c.x0), Math.round(c.sy)); // the stone stays on the ground and scrolls away
  }

  finish(c) {
    c.state = 'leftover';
    [c.cat, c.glow, c.ring, c.ringBack, c.fx, ...c.hearts.map(h => h.im), ...c.bits.map(b => b.im)].forEach(o => o && o.destroy());
  }

  lose(c) {
    c.state = 'gone'; this.lost++;
    [c.cat, c.glow, c.stone, c.ring, c.ringBack, c.fx].forEach(o => o && o.destroy());
    this.s.onCatLost();
  }

  // a hit while hovering costs the ring a part of its fill
  hurt() { for (const c of this.list) if (c.inside && c.state !== 'saved' && c.state !== 'gone') c.fill = Math.max(0, c.fill - CC.hitLoss); }

  idle() { return this.spawned >= this.total && this.list.every(c => c.state === 'gone' || c.state === 'leftover'); } // all cats are done (saved or lost)
  allSaved() { return this.saved >= this.total; }
}

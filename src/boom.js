// The bigger death explosion (all enemies), built from the game's usual effects, only bigger: several of our smoke
// puffs, our sparks (these fall) and our ring, plus a short white flash and smoke that stays a while. All in the colours of
// what died (never red or gold: those belong to shots and coins), drawn in front of the enemies and under the enemy shots.
// TUNE > TEST has an on / off switch (saved), to compare with the old, smaller one.
import { CONFIG as C } from './config.js';

const KEY = 'ff_boom';
export const boomOn = () => { try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; } };
export const toggleBoom = () => { try { localStorage.setItem(KEY, boomOn() ? '0' : '1'); } catch (e) { /* not saved */ } return boomOn(); };

// Plays the whole thing at (x, y). Returns false when it should not (switch off, kind not in the test, no puff picture).
export function boom(scene, x, y, kind, tints, big = false) {
  const B = C.boom, P = C.sprites.poof, mul = big ? B.bigMul : 1;
  if (!B.kinds.includes(kind) || !boomOn() || !P || !scene.textures.exists('sp_poof_' + kind)) return false;
  // puffs: a big one in the middle at once, smaller ones a moment later off centre, and a quick white one in the heart of it
  const puff = (tex, anim, px, py, scale, depth, wait) => {
    const s = scene.boomPool.find(o => !o.active);
    if (!s) return; // all busy: skip (keeps a big fight from slowing the phone)
    s.setTexture(tex).setPosition(px, py).setScale(scale).setDepth(depth).setAlpha(1).setOrigin(P.originX, P.originY)
      .setRotation(Math.random() * Math.PI * 2).setActive(true).setVisible(true);
    const how = { key: anim, frameRate: B.fps };
    if (wait) s.playAfterDelay(how, wait); else s.play(how);
  };
  for (let n = 0; n < B.puffs; n++) {
    const off = n ? B.spread : 0;
    puff('sp_poof_' + kind, 'poof_' + kind, x + Phaser.Math.Between(-off, off), y + Phaser.Math.Between(-off, off), P.scale * mul * (n ? B.sideScale : B.mainScale), B.depth + n * 0.001, n * B.gapMs);
  }
  puff('sp_poof_core', 'poof_core', x, y, P.scale * mul * B.coreScale, B.depth + 0.01, 0);
  // white flash
  const flash = scene.add.circle(x, y, B.flashR * mul, 0xffffff, 0.9).setDepth(B.depth + 0.02);
  scene.tweens.add({ targets: flash, alpha: 0, scale: 1.6, duration: B.flashMs, onComplete: () => flash.destroy() });
  // our sparks, more of them, falling; and our ring
  for (let i = 0; i < B.bits; i++) {
    const a = Math.random() * Math.PI * 2, v = B.bitSpeed * (0.4 + Math.random() * 0.6);
    scene.emit(scene.sparks, x, y, Math.cos(a) * v, Math.sin(a) * v - B.bitSpeed * 0.35, B.bitLife * (0.6 + Math.random() * 0.4), Phaser.Math.Between(2, 4), tints[1 + ((Math.random() * 2) | 0)], B.depth + 0.015, true, B.gravity);
  }
  const ring = scene.ring(x, y, tints[1], B.ringScale * mul, B.ringMs);
  if (ring) ring.setDepth(B.depth + 0.012);
  // smoke that stays a while and drifts down like the ground
  for (let i = 0; i < B.smoke; i++) {
    const r = scene.add.circle(x + Phaser.Math.Between(-B.spread, B.spread), y + Phaser.Math.Between(-B.spread, B.spread), B.smokeR, tints[0], 0.45).setDepth(B.depth - 0.5);
    scene.tweens.add({ targets: r, y: r.y + B.smokeDrift, scale: 2, alpha: 0, delay: i * 60, duration: B.smokeMs, ease: 'Quad.easeOut', onComplete: () => r.destroy() });
  }
  return true;
}

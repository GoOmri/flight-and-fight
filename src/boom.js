// The bigger death explosion (a test on the bat first): white flash, fireballs, falling bits and lingering smoke, all in the
// colours of what died with a white-hot middle (never red or gold: those belong to shots and coins).
// Frames: "Shmup Shots, Explosions and Pickups 16x16" by capttainjack (assets/fx/boom-0..7.png, see CREDITS.md), colours swapped only.
// TUNE > TEST has an on / off switch (saved), to compare with the old puff.
import { CONFIG as C, hex } from './config.js';

const KEY = 'ff_boom';
export const boomOn = () => { try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; } };
export const toggleBoom = () => { try { localStorage.setItem(KEY, boomOn() ? '0' : '1'); } catch (e) { /* not saved */ } return boomOn(); };

export function loadBoomArt(scene) {
  for (let i = 0; i < C.boom.frames; i++) if (!scene.textures.exists('boom_' + i)) scene.load.image('boom_' + i, 'assets/fx/boom-' + i + '.png?v=' + C.version);
}

// One recoloured copy of the frames and one animation per kind: the brightest pixels stay white, the rest become the kind's
// light, middle and dark colour (tints = [dark, middle, white]). Grey smoke pixels stay grey. Made once.
export function makeBoom(scene, kind, tints) {
  const key = 'boom_' + kind;
  if (scene.anims.exists(key)) return;
  const rgb = c => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  const dark = rgb(tints[0]), mid = rgb(tints[1]), white = [255, 255, 255], light = mid.map(v => Math.round((v + 255) / 2));
  const frames = [];
  for (let i = 0; i < C.boom.frames; i++) {
    if (!scene.textures.exists('boom_' + i)) return; // the picture did not load: the old puff is used
    const img = scene.textures.get('boom_' + i).getSourceImage(), cv = scene.textures.createCanvas(key + '_' + i, img.width, img.height), ctx = cv.getContext();
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, img.width, img.height), d = px.data;
    for (let p = 0; p < d.length; p += 4) {
      if (!d[p + 3]) continue;
      const max = Math.max(d[p], d[p + 1], d[p + 2]), min = Math.min(d[p], d[p + 1], d[p + 2]), lum = d[p] * 0.3 + d[p + 1] * 0.59 + d[p + 2] * 0.11;
      if (max - min < 45 && lum < 140) continue; // smoke
      const to = lum > 215 ? white : lum > 150 ? light : lum > 85 ? mid : dark;
      d[p] = to[0]; d[p + 1] = to[1]; d[p + 2] = to[2];
    }
    ctx.putImageData(px, 0, 0); cv.refresh();
    frames.push({ key: key + '_' + i });
  }
  scene.anims.create({ key, frames, frameRate: C.boom.fps, repeat: 0 });
}

// Plays the whole thing at (x, y). Returns false when it cannot (switch off, kind not in the test, no pictures).
export function boom(scene, x, y, kind, tints) {
  const B = C.boom;
  if (!B.kinds.includes(kind) || !boomOn() || !scene.anims.exists('boom_' + kind)) return false;
  // fireballs: one in the middle at once, the others a moment later, a bit off centre
  for (let n = 0; n < B.balls; n++) {
    const s = scene.boomPool.find(o => !o.active);
    if (!s) break; // all busy: skip (keeps a big fight from slowing the phone)
    const off = n ? B.spread : 0;
    s.setTexture('boom_' + kind + '_0').setPosition(x + Phaser.Math.Between(-off, off), y + Phaser.Math.Between(-off, off)).setScale(B.scale * (n ? 0.7 : 1))
      .setDepth(B.depth + n * 0.01).setAlpha(1).setActive(true).setVisible(true);
    if (n) s.playAfterDelay('boom_' + kind, n * B.gapMs); else s.play('boom_' + kind);
  }
  // white flash
  const flash = scene.add.circle(x, y, B.flashR, 0xffffff, 0.9).setDepth(B.depth + 0.05);
  scene.tweens.add({ targets: flash, alpha: 0, scale: 1.6, duration: B.flashMs, onComplete: () => flash.destroy() });
  // bits that fly out and fall
  for (let i = 0; i < B.bits; i++) {
    const a = Math.random() * Math.PI * 2, v = B.bitSpeed * (0.4 + Math.random() * 0.6);
    scene.emit(scene.sparks, x, y, Math.cos(a) * v, Math.sin(a) * v - B.bitSpeed * 0.35, B.bitLife * (0.6 + Math.random() * 0.4), Phaser.Math.Between(2, 4), tints[1 + ((Math.random() * 2) | 0)], B.depth + 0.02, true, B.gravity);
  }
  // smoke that stays a while and drifts down like the ground
  for (let i = 0; i < B.smoke; i++) {
    const r = scene.add.circle(x + Phaser.Math.Between(-B.spread, B.spread), y + Phaser.Math.Between(-B.spread, B.spread), B.smokeR, tints[0], 0.45).setDepth(B.depth - 0.5);
    scene.tweens.add({ targets: r, y: r.y + B.smokeDrift, scale: 2, alpha: 0, delay: i * 60, duration: B.smokeMs, ease: 'Quad.easeOut', onComplete: () => r.destroy() });
  }
  return true;
}

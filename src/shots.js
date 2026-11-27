// Enemy shots that stand out: a copy of the red orb with a dark ring around it and a near-white middle, pulsing a bit faster.
// The art file is not edited and the hit box stays the same size. TUNE has an on / off switch (saved) to compare.
const KEY = 'ff_shots';
export const shotsOn = () => { try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; } };
export const toggleShots = () => { try { localStorage.setItem(KEY, shotsOn() ? '0' : '1'); } catch (e) { /* not saved */ } return shotsOn(); };

const RING = 1; // ring width in art pixels

// Makes the texture 'eb_bold' once from 'eb_pic' (the plain orb stays for "off").
export function makeBoldShot(scene) {
  if (scene.textures.exists('eb_bold') || !scene.textures.exists('eb_pic')) return;
  const img = scene.textures.get('eb_pic').getSourceImage(), w = img.width + 2 * RING, h = img.height + 2 * RING;
  const cv = scene.textures.createCanvas('eb_bold', w, h), ctx = cv.getContext();
  ctx.drawImage(img, RING, RING);
  const px = ctx.getImageData(0, 0, w, h), d = px.data, solid = new Uint8Array(w * h);
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 128) { solid[y * w + x] = 1; sx += x; sy += y; n++; }
  const cx = sx / n, cy = sy / n, set = (i, r, g, b, a) => { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (solid[y * w + x]) { // near-white middle
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < 1.8) set(i, 255, 255, 255, 255); else if (dist < 2.8) set(i, 255, 200, 200, 255);
      continue;
    }
    let near = false; // a see-through pixel close to the orb becomes the dark ring
    for (let dy = -RING; dy <= RING && !near; dy++) for (let dx = -RING; dx <= RING; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && Math.abs(dx) + Math.abs(dy) <= RING && solid[ny * w + nx]) { near = true; break; }
    }
    if (near) set(i, 26, 0, 18, 235);
  }
  ctx.putImageData(px, 0, 0); cv.refresh();
}

// The wide buttons are Omri's two scroll pictures (assets/ui/ui-med-button.png and ui-med-button2.png, 80 x 26), each also mirrored
// left-right: 4 looks, handed out one after another so buttons next to each other differ. Never flipped upside down: the scrolls face up.
const BASE = 'ui_med-button', SECOND = 'ui_med-button2';
export const BTN_INK = '#5a3416', BTN_HOT = '#c0331c'; // dark brown text on the light scroll; red when a newer version waits
let n = 0;

function make(scene, i) {
  const key = BASE + '_v' + i, from = i & 2 && scene.textures.exists(SECOND) ? SECOND : BASE;
  if (scene.textures.exists(key)) return key;
  const img = scene.textures.get(from).getSourceImage(), w = img.width, h = img.height;
  const cv = scene.textures.createCanvas(key, w, h), c = cv.getContext();
  c.imageSmoothingEnabled = false;
  if (i & 1) { c.translate(w, 0); c.scale(-1, 1); } // mirrored
  c.drawImage(img, 0, 0);
  cv.refresh();
  return key;
}

// the texture for the next button: each call gives the next of the 4 looks
export function buttonKey(scene) {
  if (!scene.textures.exists(BASE)) return BASE;
  return make(scene, n++ % 4);
}

// A stretched 9-part picture: the ends keep their size (l, r, t, b px), the middle stretches. t = b = 0: only left, middle, right.
// Phaser's NineSlice draws nothing in canvas mode (?render=canvas, some desktops). There the same picture is painted once per
// key + size + tint into its own texture and shown as a normal image. Canvas mode cannot tint either, so setTint is painted too.
export function addSlice(scene, x, y, key, w, h, l, r, t, b) {
  if (scene.sys.renderer.type === Phaser.WEBGL) {
    const img = scene.add.nineslice(x, y, key, undefined, w, h, l, r, t, b);
    img.sliced = true;
    return img;
  }
  let cw = w, ch = h, tint = 0xffffff;
  const img = scene.add.image(x, y, sliceTexture(scene, key, cw, ch, l, r, t, b, tint));
  const redraw = () => img.setTexture(sliceTexture(scene, key, cw, ch, l, r, t, b, tint));
  img.sliced = true;
  img.setSize = (nw, nh) => { if (nw !== cw || nh !== ch) { cw = nw; ch = nh; redraw(); } return img; };
  img.setTint = (c = 0xffffff) => { if (c !== tint) { tint = c; redraw(); } return img; };
  return img;
}

function sliceTexture(scene, key, w, h, l, r, t, b, tint) {
  w = Math.round(w); h = Math.round(h);
  const out = key + '_9_' + [w, h, l, r, t, b, tint].join('_');
  if (scene.textures.exists(out)) return out;
  const src = scene.textures.get(key).getSourceImage(), sw = src.width, sh = src.height;
  const cv = scene.textures.createCanvas(out, w, h), c = cv.getContext();
  c.imageSmoothingEnabled = false;
  const cols = [[0, l, 0, l], [l, sw - l - r, l, w - l - r], [sw - r, r, w - r, r]]; // from x, from width, to x, to width
  const rows = t || b ? [[0, t, 0, t], [t, sh - t - b, t, h - t - b], [sh - b, b, h - b, b]] : [[0, sh, 0, h]];
  for (const [sy, shh, dy, dh] of rows) for (const [sx, sww, dx, dw] of cols) if (sww > 0 && shh > 0 && dw > 0 && dh > 0) c.drawImage(src, sx, sy, sww, shh, dx, dy, dw, dh);
  if (tint !== 0xffffff) { // multiply by the tint, then cut back to the picture's own shape
    const shape = document.createElement('canvas'); shape.width = w; shape.height = h; shape.getContext('2d').drawImage(cv.canvas, 0, 0);
    c.globalCompositeOperation = 'multiply'; c.fillStyle = '#' + tint.toString(16).padStart(6, '0'); c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'destination-in'; c.drawImage(shape, 0, 0);
    c.globalCompositeOperation = 'source-over';
  }
  cv.refresh();
  return out;
}

// The parchment picture as a bigger PURPLE panel: its 24 px ragged edges and its middle are REPEATED, never stretched (stretching smeared its specks into dashes)
export function parchmentKey(scene, w, h) {
  const key = 'ui_parchment_' + w + 'x' + h, B = 24, N = 96, M2 = N - 2 * B;
  if (scene.textures.exists(key)) return key;
  const img = scene.textures.get('ui_panel-parchment').getSourceImage(), cv = scene.textures.createCanvas(key, w, h), c = cv.getContext();
  const tile = (sx, sy, sw, sh, dx, dy, dw, dh) => {
    for (let y = 0; y < dh; y += sh) for (let x = 0; x < dw; x += sw) { const cw = Math.min(sw, dw - x), ch = Math.min(sh, dh - y); c.drawImage(img, sx, sy, cw, ch, dx + x, dy + y, cw, ch); }
  };
  tile(B, B, M2, M2, B, B, w - 2 * B, h - 2 * B);
  tile(B, 0, M2, B, B, 0, w - 2 * B, B); tile(B, N - B, M2, B, B, h - B, w - 2 * B, B);
  tile(0, B, B, M2, 0, B, B, h - 2 * B); tile(N - B, B, B, M2, w - B, B, B, h - 2 * B);
  for (const [sx, sy, dx, dy] of [[0, 0, 0, 0], [N - B, 0, w - B, 0], [0, N - B, 0, h - B], [N - B, N - B, w - B, h - B]]) c.drawImage(img, sx, sy, B, B, dx, dy, B, B);
  // colour swap only (no pixel moves): each of the picture's 8 colours becomes one of our purples, light stays light and dark stays dark
  const SWAP = { 0xead4aa: 0x3a1a72, 0xe8b796: 0x452180, 0xe4a672: 0x52288f, 0xc28569: 0x7b43b8, 0xb86f50: 0x6630a0, 0x733e39: 0x2c1058, 0x3e2731: 0x1e0a40, 0x181425: 0x120622 };
  const px = c.getImageData(0, 0, w, h), d = px.data;
  for (let i = 0; i < d.length; i += 4) {
    const to = SWAP[(d[i] << 16) | (d[i + 1] << 8) | d[i + 2]];
    if (d[i + 3] && to !== undefined) { d[i] = to >> 16; d[i + 1] = (to >> 8) & 255; d[i + 2] = to & 255; }
  }
  c.putImageData(px, 0, 0);
  cv.refresh();
  return key;
}

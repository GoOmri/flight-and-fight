// The wide buttons are Omri's two scroll pictures (assets/ui/ui-med-button.png and ui-med-button2.png, 80 x 25), each also mirrored
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

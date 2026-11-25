// The wide button picture (assets/ui/ui-med-button.png, 80 x 25) in 4 looks, so buttons next to each other do not repeat the same
// specks: as drawn, mirrored left-right, face flipped upside down, and both. Only rows 1..20 (the face between the two gold lines)
// are flipped upside down: the drop shadow (rows 21..24) always stays at the bottom.
const BASE = 'ui_med-button', FACE_TOP = 1, FACE_H = 20;
let n = 0;

function make(scene, i) {
  const key = BASE + '_v' + i;
  if (scene.textures.exists(key)) return key;
  const img = scene.textures.get(BASE).getSourceImage(), w = img.width, h = img.height;
  const cv = scene.textures.createCanvas(key, w, h), c = cv.getContext();
  c.imageSmoothingEnabled = false;
  if (i & 1) { c.translate(w, 0); c.scale(-1, 1); } // mirrored
  c.drawImage(img, 0, 0);
  if (i & 2) { // face upside down
    c.clearRect(0, FACE_TOP, w, FACE_H);
    c.save(); c.translate(0, FACE_TOP * 2 + FACE_H); c.scale(1, -1);
    c.drawImage(img, 0, FACE_TOP, w, FACE_H, 0, FACE_TOP, w, FACE_H);
    c.restore();
  }
  cv.refresh();
  return key;
}

// the texture for the next button: each call gives the next of the 4 looks
export function buttonKey(scene) {
  if (!scene.textures.exists(BASE)) return BASE;
  return make(scene, n++ % 4);
}

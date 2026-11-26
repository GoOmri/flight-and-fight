// Tiny pixel sprites drawn in code. Each row is a string; each letter is a colour.
// Swap the hero by editing HERO_ART (or replacing drawHero).
import { CONFIG } from './config.js';

const PAL = {
  '.': null,
  w: 0xffffff, k: 0x1b1b2b, g: 0x8a93a6, d: 0x555d73,
  r: 0xe63946, o: 0xff9f1c, b: 0x3a86ff, c: 0x7fe0ff,
  n: 0x3bb54a, p: 0xb15bd6, m: 0x7a2fa0,
  // COLOUR RULE (witch theme; what each colour is reserved for, never mix):
  //  RED (e,h,q)           = danger: enemy shots only (and the small heart icons). Nothing else red/orange.
  //  GOLD (Q,A,U,K)        = coins only (also the coin sparkle and the 'all coins' medal icon).
  //  CYAN-WHITE (c,w)      = player shots (thin bolt, keep exactly). White is also used for small shines/eyes.
  //  BRIGHT GREEN (E,H)    = weapon upgrade only: the potion, the pulsing outline of a weapon carrier, the HUD bars.
  //  PINK-WHITE (P)        = pulsing outline of a heart carrier. The heart pickup has a white outline.
  //  VIOLET is FREE: the witch (hat plum V, band v, cloak magenta-violet m, face f, hair B), the bat (I, belly u), the ghost (L), sparkles (y, p).
  //  Creatures (dark/mid tones + dark outline k so they read on the light sky): BAT = indigo, GHOST = pale lavender-grey,
  //   IMP = dark teal-green with tan horns and a lime wand tip (M). Never red, orange, gold or cyan-white on enemies.
  //  Chest = brown wood (T,B) with grey steel bands (g,d), outline X. No gold/yellow, so it is never mistaken for coins.
  //  HUD medal icons: bone-white skulls, blue shield, gold coin (coin colour). Never red or gold except the coin.
  // (Explosion sparks are tinted white / light grey / red-orange in code: never yellow or gold, so they never look like coins.)
  e: 0x7a0a0a, h: 0xff2a2a, q: 0xff7a7a, // (old enemy shot colours, kept)
  R: 0xff3d9a, O: 0x3a0a2e, // enemy shot now: hot pink rim (R) and dark plum outline (O), with a white core (w)
  Q: 0xffc928, A: 0xfff2a0, U: 0xb36b00, K: 0x5a3200, // coin: gold body, light shine, brown rim, dark outline
  V: 0x5a2184, v: 0xc89cff, f: 0xf6cfa6, i: 0x2a1a55, y: 0xff7ad9, // witch: hat, hat band, skin, cloak/hair, pink sparkle
  I: 0x3c3a8c, u: 0x8f86d8,                                       // bat: indigo body, lighter belly
  L: 0xc9c3e8, z: 0xd98fb8,                                       // ghost: pale lavender-grey, blush
  t: 0x1f6b5a, M: 0xa6ff3c,                                       // imp: dark teal-green skin, lime wand tip
  T: 0xc58f4f, B: 0x8a5a2b, X: 0x3b2412,                          // wood: tan, brown, dark outline (chest, broom, horns)
  E: 0x2ee86a, H: 0x0b7d3a, P: 0xffc9e3,                          // upgrade green, its shade, carrier pink-white
  J: 0xeceef5, j: 0x8a90a6                            // skull bone, bone shade (medal icons)
};

function makeTexture(scene, key, rows) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const c = PAL[ch];
      if (c !== null && c !== undefined) { g.fillStyle(c, 1); g.fillRect(x, y, 1, 1); }
    });
  });
  g.generateTexture(key, rows[0].length, rows.length);
  g.destroy();
}

// Hero: cute witch on a broom (18x22 art px, drawn at ship.spriteScale): plum hat with a light band and white buckle,
// brown hair, skin face with eyes, smile and blush, magenta-violet cloak with a clasp, a small hand on the broom,
// tan broom bar with straw bristles at the back, pink/violet sparkles. Hitbox is NOT the sprite (see ship.hitRadius).
const HERO_ART = [
  '........kk........',
  '.......kVVk.......',
  '......kVVVVk......',
  '......kvVVVk......',
  '.....kVVVVVVk.....',
  '.....kVVVVVVk.....',
  '....kvvvwwvvvk....',
  '....kvvvvvvvvk....',
  '.kVVVVVVVVVVVVVVk.',
  '.kkkkkkkkkkkkkkkk.',
  '....kBffffffBk....',
  '....kBfkffkfBk....',
  '....kBfkffkfBk....',
  '....kBzfkkfzBk....',
  '.....kkffffkk.....',
  '....kmmmvvmmmk....',
  '...kmmmmmmmmmmk...',
  '..kmmmmmmmmmffmk..',
  '.XTTTTTTTTTTffTTX.',
  '.XBBBBBBBBBBBBBBX.',
  '..y.XTBTBTBTBX.p..',
  '.p.XTBTTBTBTTBX.y.'
];
export function drawHero(scene) { makeTexture(scene, 'hero', HERO_ART); }

// grunt = BAT
const GRUNT = [
  '..k...k..',
  '.kIkkkIk.',
  'kIIwIwIIk',
  'kIIkukIIk',
  'kIkIuIkIk',
  '.k.kuk.k.',
  '.k..k..k.'
];
// zigzag = GHOST
const ZIGZAG = [
  '..kkkkk..',
  '.kLLLLLk.',
  'kLLLLLLLk',
  'kLkLLLkLk',
  'kzkLLLkzk',
  'kLLLkLLLk',
  'k.kLk.kLk'
];
// shooter = IMP, the biggest enemy: dark teal-green skin, tan horns, wand with a lime glowing tip
const SHOOTER = [
  '.k.......k.',
  'kTk.....kTk',
  'kTTktttkTTk',
  'kttwwtwwttk',
  'kttwktkwttk',
  'kkttkkkttkk',
  '.kttttttk.B',
  '..kk...kk.M'
];
// crate = small wooden TREASURE CHEST with grey steel bands and clasp (not gold). 7x7 art px = 21 px on screen (also its hitbox).
const CRATE = [
  '.XXXXX.',
  'XgTTTgX',
  'XgggggX',
  'XgBdBgX',
  'XgBBBgX',
  'XgBBBgX',
  'XXXXXXX'
];
const EBULLET = ['..OOO..', '.ORRRO.', 'ORRwRRO', 'ORwwwRO', 'ORRwRRO', '.ORRRO.', '..OOO..']; // round hot-pink orb with a white core and a dark plum outline (7x7, drawn at scale C.enemyBullet.scale)
// Player bolt size lives here: 2 x 5 art pixels (white head, cyan tail). Hitbox = texture size.
const PBULLET = ['ww', 'ww', 'ww', 'cc', 'cc'];
// coin: round gold coin (7x7): gold body, light shine top-left, brown rim, dark outline
const COIN = [
  '..KKK..',
  '.KAAQK.',
  'KAAQQUK',
  'KAQQQUK',
  'KQQQQUK',
  '.KUUUK.',
  '..KKK..'
];
const HEART = ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'];
const HEART_EMPTY = ['.dd.dd.', 'd..d..d', 'd.....d', '.d...d.', '..d.d..', '...d...'];
const SQUARE = ['w'];
// weapon upgrade = green POTION bottle, cork, white shine and up-arrow, dark outline (9x9)
const WEAPON_UP = [
  '...kkk...',
  '...kBk...',
  '...kwk...',
  '..kEEEk..',
  '.kEEwEEk.',
  'kwEwwwEEk',
  'kEEEwEEEk',
  '.kHHHHHk.',
  '..kkkkk..'
];

// Padded copy of rows with a 1-pixel ring `ch` around the shape. keep = keep the shape, else ring only.
function ringRows(rows, ch, keep) {
  const h = rows.length, w = rows[0].length;
  const filled = (x, y) => x >= 0 && y >= 0 && x < w && y < h && rows[y][x] !== '.';
  const out = [];
  for (let y = -1; y <= h; y++) {
    let line = '';
    for (let x = -1; x <= w; x++) {
      if (filled(x, y)) { line += keep ? rows[y][x] : '.'; continue; }
      let near = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (filled(x + dx, y + dy)) near = true;
      line += near ? ch : '.';
    }
    out.push(line);
  }
  return out;
}

// STAR icons (the reward, shown in the menu and on the end screen): a plain gold star, 13x13 art px (K = brown outline, Q = gold). Textures star_earned and star_off.
const STAR = [
  '......K......', '.....KQK.....', '.....KQK.....', 'KKKKKKQKKKKKK', 'KQQQQQQQQQQQK',
  '.KQQQQQQQQQK.', '..KQQQQQQQK..', '..KQQQQQQQK..', '.KQQQQQQQQQK.', '.KQQQQQQQQQK.',
  '.KQQQKKKQQQK.', 'KQQQK...KQQQK', 'KKKK.....KKKK'
];
function makeStarIcons(scene) {
  if (scene.textures.exists('star_src') && !scene.textures.exists('star_earned')) { // the gold power-star of the Frakassets pack (frame 0, front facing): star_earned = full colour, star_off = dim grey
    const img = scene.textures.get('star_src').getSourceImage(), FW = 32, FH = 43;
    const c0 = document.createElement('canvas'); c0.width = FW; c0.height = FH;
    const x0 = c0.getContext('2d'); x0.drawImage(img, 0, 0, FW, FH, 0, 0, FW, FH);
    const d0 = x0.getImageData(0, 0, FW, FH).data;
    let x1 = FW, y1 = FH, x2 = -1, y2 = -1;
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (d0[(y * FW + x) * 4 + 3] > 20) { x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y); }
    if (x2 >= 0) {
      const w = x2 - x1 + 1, h = y2 - y1 + 1, px = x0.getImageData(x1, y1, w, h).data;
      for (const st of ['earned', 'off']) {
        const cv = scene.textures.createCanvas('star_' + st, w, h), cx = cv.getContext(), out = cx.createImageData(w, h), o = out.data;
        for (let i = 0; i < px.length; i += 4) {
          let r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3];
          if (st === 'off') { const v = (r * 0.3 + g * 0.59 + b * 0.11) * 0.5 + 40; r = g = b = v; a *= 0.45; }
          o[i] = r; o[i + 1] = g; o[i + 2] = b; o[i + 3] = a;
        }
        cx.putImageData(out, 0, 0); cv.refresh();
      }
      return;
    }
  }
  const look = {
    earned: ch => [PAL[ch], 1],
    off: ch => (ch === 'K' ? [0xdfe8ff, 0.65] : [0xffffff, 0.14]) // not earned: a dim outline only
  };
  for (const st of Object.keys(look)) {
    const tex = 'star_' + st;
    if (scene.textures.exists(tex)) continue;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    STAR.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '.') return;
      const [c, a] = look[st](ch);
      g.fillStyle(c, a); g.fillRect(x, y, 1, 1);
    }));
    g.generateTexture(tex, 13, 13);
    g.destroy();
  }
}

// GOAL icons (what the player does): the black cat (cat pack) = all cats, the game's coin = all coins, a skull (BTL pack) = defeat every enemy, the game's heart = no hit. Textures goal_<key>_<open|earned|failed>:
// open = near white (keeps the details), earned = full colour, failed = grey (no cross). Cut from pictures the game already loads (coin and heart sheets) and the hat (assets/ui/goal-hat.png),
// trimmed to the visible pixels.
// goalScale(scene, key, box) = the scale that fits a goal icon into a box x box px square (so coin, skull and heart look equally big).
export const goalScale = (scene, key, box) => { const k = 'goal_' + key + '_open', f = scene.textures.exists(k) ? scene.textures.get(k).get() : null; return f && typeof f.width === 'number' && f.width > 0 ? box / Math.max(f.width, f.height) : 1; };
// Both scenes load the pictures with loadGoalArt (textures are shared, so the menu and the game use the same icons).
export function loadGoalArt(scene, v) {
  const L = scene.load, T = scene.textures, S = CONFIG.sprites;
  if (!T.exists('star_src')) L.image('star_src', 'assets/pickups/star-lit.png?v=' + v);
  if (!T.exists('goal_skull')) L.image('goal_skull', 'assets/ui/goal-skull.png?v=' + v);
  if (!T.exists('goal_cat_src')) L.spritesheet('goal_cat_src', 'assets/cats/cat-2-sitting.png?v=' + v, { frameWidth: 50, frameHeight: 50 }); // the black cat of the cat pack
  if (S.coin && !T.exists('sp_coin')) L.spritesheet('sp_coin', 'assets/' + S.coin.file, { frameWidth: S.coin.frameW, frameHeight: S.coin.frameH });
  const h = S.heartPickup && S.heartPickup.idle;
  if (h && !T.exists('sp_heart_idle')) L.spritesheet('sp_heart_idle', 'assets/' + h.file, { frameWidth: h.frameW, frameHeight: h.frameH });
}
export function makeGoalIcons(scene) {
  const src = {
    cats: { tex: 'goal_cat_src', lift: 75, eyes: true }, // lift: a black cat's failed grey would vanish on the dark panels; eyes: keep them dark on the white 'open' icon so it reads as a cat
    killAll: { tex: 'goal_skull' },
    allCoins: { tex: scene.textures.exists('sp_coin') ? 'sp_coin' : 'coin' },
    noHit: { tex: scene.textures.exists('sp_heart_idle') ? 'sp_heart_idle' : 'heart' }
  };
  for (const key of Object.keys(src)) {
    if (scene.textures.exists('goal_' + key + '_open') || !scene.textures.exists(src[key].tex)) continue;
    const t = scene.textures.get(src[key].tex), fr = t.has(0) ? t.get(0) : t.get(), img = t.getSourceImage(); // frame 0 of a sheet (the coin faces front there), or the whole picture
    const c0 = document.createElement('canvas'); c0.width = fr.cutWidth; c0.height = fr.cutHeight;
    const x0 = c0.getContext('2d'); x0.drawImage(img, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, 0, 0, fr.cutWidth, fr.cutHeight);
    const d0 = x0.getImageData(0, 0, c0.width, c0.height).data;
    let x1 = c0.width, y1 = c0.height, x2 = -1, y2 = -1;
    for (let y = 0; y < c0.height; y++) for (let x = 0; x < c0.width; x++) if (d0[(y * c0.width + x) * 4 + 3] > 20) { x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y); }
    if (x2 < 0) continue;
    let w = x2 - x1 + 1, h = y2 - y1 + 1, px = x0.getImageData(x1, y1, w, h).data;
    const k = Math.max(w, h) <= 12 ? Math.round(18 / Math.max(w, h)) : 1; // a tiny picture (the skull) is enlarged by whole pixels so every icon is about the same size
    if (k > 1) {
      const w2 = w * k, h2 = h * k, p2 = new Uint8ClampedArray(w2 * h2 * 4);
      for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) for (let c = 0; c < 4; c++) p2[(y * w2 + x) * 4 + c] = px[(Math.floor(y / k) * w + Math.floor(x / k)) * 4 + c];
      px = p2; w = w2; h = h2;
    }
    for (const st of ['open', 'earned', 'failed']) {
      const cv = scene.textures.createCanvas('goal_' + key + '_' + st, w, h), cx = cv.getContext(), out = cx.createImageData(w, h), o = out.data;
      for (let i = 0; i < px.length; i += 4) {
        let r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3];
        if (st === 'open') { const v = src[key].eyes && r - b > 40 ? 60 : 175 + 80 * ((r * 0.3 + g * 0.59 + b * 0.11) / 255); r = g = b = v; } // open = light grey-white that keeps the picture's details (a flat white blob hid them)
        else if (st === 'failed') { const v = (r * 0.3 + g * 0.59 + b * 0.11) * 0.55 + (src[key].lift || 0); r = g = b = v; a *= 0.8; }
        else if (src[key].eyes) { if (r - b > 40) { r = 255; g = 214; b = 64; } else { r += 48; g += 44; b += 72; } } // earned black cat: black on the dark screens was invisible, so a night-blue black with bright yellow eyes (colour swap only)
        o[i] = r; o[i + 1] = g; o[i + 2] = b; o[i + 3] = a;
      }
      cx.putImageData(out, 0, 0); cv.refresh();
    }
  }
}

export function makeAllTextures(scene) {
  drawHero(scene);
  makeTexture(scene, 'grunt', GRUNT);
  makeTexture(scene, 'zigzag', ZIGZAG);
  makeTexture(scene, 'shooter', SHOOTER);
  makeTexture(scene, 'crate', CRATE);
  makeTexture(scene, 'ebullet', EBULLET);
  makeTexture(scene, 'pbullet', PBULLET);
  makeTexture(scene, 'coin', COIN);
  makeTexture(scene, 'heart', HEART);
  makeTexture(scene, 'heartEmpty', HEART_EMPTY);
  makeTexture(scene, 'square', SQUARE);
  makeTexture(scene, 'weaponUp', WEAPON_UP);
  makeTexture(scene, 'heartUp', ringRows(HEART, 'w', true)); // the HUD heart with a white outline
  // glowing outline of a carrier (drawn behind it, pulses in code): green = weapon, pink-white = heart
  for (const [type, rows] of [['grunt', GRUNT], ['zigzag', ZIGZAG], ['shooter', SHOOTER]]) {
    makeTexture(scene, 'ring_' + type + '_weapon', ringRows(rows, 'E', false));
    makeTexture(scene, 'ring_' + type + '_heart', ringRows(rows, 'P', false));
  }
  makeStarIcons(scene);
  makeTexture(scene, 'cloudFar', ['..www...', '.wwwww..', 'wwwwwwww', '.wwwwww.']);
  makeTexture(scene, 'star', ['w']);
  makeTexture(scene, 'fxRing', ['..wwwww..', '.ww...ww.', 'ww.....ww', 'w.......w', 'w.......w', 'w.......w', 'ww.....ww', '.ww...ww.', '..wwwww..']); // puff ring, tinted + scaled in code
  makeTexture(scene, 'cloudNear', ['...wwww....', '..wwwwwww..', '.wwwwwwwwww', 'wwwwwwwwwww', '.wwwwwwwww.']);
}

export const PX = CONFIG.game.pixelScale;

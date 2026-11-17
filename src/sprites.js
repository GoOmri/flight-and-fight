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
  e: 0x7a0a0a, h: 0xff2a2a, q: 0xff7a7a, // enemy shot: dark red outline, bright red, lighter red core
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
const EBULLET = ['.eee.', 'ehqhe', 'ehqhe', 'ehhhe', '.eee.']; // round red orb, dark red outline
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

// HUD medal icons, 10x10 art px, drawn 1:1. Keys match src/medals.js. Each gets 3 textures: _earned, _pending, _failed.
const SKULL = [
  '..kkkkkk..', '.kJJJJJJk.', 'kJJJJJJJJk', 'kJkkJJkkJk', 'kJkkJJkkJk',
  'kJJJkkJJJk', '.kJJJJJJk.', '..kJkJkJk.', '..kJkJkJk.', '...kkkkk..'
];
const MEDAL_ART = {
  kill70: SKULL.map(r => r.slice(0, 5) + r.slice(5).replace(/J/g, 'j')), // half skull: right half is shaded
  killAll: SKULL,
  allCoins: ['...KKKK...', '..KAAQQK..', '.KAAQQQUK.', 'KAAQQQQQUK', 'KAQQQQQQUK', 'KQQQQQQQUK', 'KQQQQQQUUK', '.KQQQUUUK.', '..KUUUUK..', '...KKKK...'],
  noHit: ['kkkkkkkkkk', 'kbbbbbbbbk', 'kbwwbbwwbk', 'kbwwwwwwbk', 'kbwwwwwwbk', '.kbwwwwbk.', '.kbbwwbbk.', '..kbbbbk..', '...kbbk...', '....kk....']
};
function makeMedalIcons(scene) {
  const look = {
    earned: ch => [PAL[ch], 1],
    pending: ch => (ch === 'k' || ch === 'D' ? [0xdfe8ff, 0.65] : [0xffffff, 0.14]), // dim outline only
    failed: ch => (ch === 'k' || ch === 'D' ? [0x23232e, 1] : [0x4f5565, 1])        // dark grey + small cross
  };
  for (const key of Object.keys(MEDAL_ART)) {
    const rows = MEDAL_ART[key], w = rows[0].length, h = rows.length;
    for (const st of Object.keys(look)) {
      const tex = 'medal_' + key + '_' + st;
      if (scene.textures.exists(tex)) continue;
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch === '.') return;
        const [c, a] = look[st](ch);
        g.fillStyle(c, a); g.fillRect(x, y, 1, 1);
      }));
      if (st === 'failed') { // small cross, bottom right
        g.fillStyle(0xd9deea, 1);
        [[-4, -4], [-2, -4], [-3, -3], [-4, -2], [-2, -2]].forEach(([dx, dy]) => g.fillRect(w + dx, h + dy, 1, 1));
      }
      g.generateTexture(tex, w, h);
      g.destroy();
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
  makeMedalIcons(scene);
  makeTexture(scene, 'cloudFar', ['..www...', '.wwwww..', 'wwwwwwww', '.wwwwww.']);
  makeTexture(scene, 'star', ['w']);
  makeTexture(scene, 'fxRing', ['..wwwww..', '.ww...ww.', 'ww.....ww', 'w.......w', 'w.......w', 'w.......w', 'ww.....ww', '.ww...ww.', '..wwwww..']); // puff ring, tinted + scaled in code
  makeTexture(scene, 'cloudNear', ['...wwww....', '..wwwwwww..', '.wwwwwwwwww', 'wwwwwwwwwww', '.wwwwwwwww.']);
}

export const PX = CONFIG.game.pixelScale;

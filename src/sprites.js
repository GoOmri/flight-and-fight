// Tiny pixel sprites drawn in code. Each row is a string; each letter is a colour.
// Swap the hero by editing HERO_ART (or replacing drawHero).
import { CONFIG } from './config.js';

const PAL = {
  '.': null,
  w: 0xffffff, k: 0x1b1b2b, g: 0x8a93a6, d: 0x555d73,
  r: 0xe63946, o: 0xff9f1c, b: 0x3a86ff, c: 0x7fe0ff,
  n: 0x3bb54a, p: 0xb15bd6, m: 0x7a2fa0,
  // COLOUR RULE (what each colour is reserved for, never mix):
  //  RED (e,h,q)           = danger: enemy shots only (hero flame and hearts use red too, they are small).
  //  GOLD (Q,A,U,K)        = coins only (also the coin sparkle and the 'all coins' medal icon). Violet is now unused/free.
  //  CYAN-WHITE (c,w)      = player shots (and the hero's nose).
  //  Enemies use ONLY dark / earth / military tones: steel grey (S,s), olive/dark green (O,F,l), brown/black-grey (N,Z)
  //   with a dark outline (k). Lime (M) is the shooter gun. No red, pink, orange, yellow, gold, purple or cyan on enemies.
  //  Crate = wood: brown/tan (T,B,Y) with a dark outline (X). No yellow/gold.
  //  BRIGHT GREEN (E,H)    = weapon upgrade only: the pickup badge, the pulsing outline of a weapon carrier and the filled bars in the HUD.
  //  PINK-WHITE (P)        = pulsing outline of a heart carrier. The heart pickup has a white outline.
  //  HUD medal icons: bone-white skulls, blue shield, gold coin (coin colour). Never red or gold except the coin.
  // (Explosion sparks are tinted white / light grey / red-orange in code: never yellow or gold, so they never look like coins.)
  e: 0x7a0a0a, h: 0xff2a2a, q: 0xff7a7a, // enemy shot: dark red outline, bright red, lighter red core
  Q: 0xffc928, A: 0xfff2a0, U: 0xb36b00, K: 0x5a3200, // coin: gold body, light shine, brown rim, dark outline
  S: 0x6a7a92, s: 0x3a4558, G: 0x3fa34d, // grunt: steel grey, dark steel, green canopy
  O: 0x6b7a2e, F: 0x34562a, l: 0x8fc45a, // zigzag: olive, dark green, light green accent
  N: 0x5a3f2c, Z: 0x2b2b32, M: 0xa6ff3c, // shooter: brown, black-grey, lime gun/eye
  T: 0xc58f4f, B: 0x8a5a2b, X: 0x3b2412, Y: 0xe8cf9a, // crate: tan, brown, dark outline, light lid
  E: 0x2ee86a, H: 0x0b7d3a, P: 0xffc9e3,              // upgrade green, its shade, carrier pink-white
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

// Neutral placeholder plane (hero not decided yet). Swap this function's art later.
const HERO_ART = [
  '.....o.....',
  '.....w.....',
  '....cwc....',
  '....bwb....',
  '...bbwbb...',
  '..gbbbbbg..',
  '.ggbbbbbgg.',
  'ggggbbbgggg',
  'g.dgbbbgd.g',
  '..d.rrr.d..',
  '....oro....'
];
export function drawHero(scene) { makeTexture(scene, 'hero', HERO_ART); }

const GRUNT = [
  '.k.....k.',
  'kSk...kSk',
  'kSSkkkSSk',
  'kSsGGGsSk',
  '.kSGGGSk.',
  '..kSSSk..',
  '...kkk...'
];
const ZIGZAG = [
  '..k...k..',
  '.kOk.kOk.',
  'kOOOkOOOk',
  'kOlOFOlOk',
  'kOOFFFOOk',
  '.kOk.kOk.',
  '.k.....k.'
];
// the biggest enemy: dark body, bright lime gun/eye
const SHOOTER = [
  '.k.......k.',
  'kNk.....kNk',
  'kNNkkkkkNNk',
  'kNZZZZZZZNk',
  'kNZMMMMMZNk',
  'kNZZMMMZZNk',
  '.kNZZMZZNk.',
  '..kk.M.kk..'
];
// crate: wooden box, light lid with a tiny shine, dark outline. 7x7 art px = 21 px on screen (also its hitbox).
const CRATE = [
  'XXXXXXX',
  'XYwYYYX',
  'XXXXXXX',
  'XTTBTTX',
  'XBBBBBX',
  'XTTBTTX',
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
// weapon upgrade: round green badge, white up-arrow, dark outline (9x9)
const WEAPON_UP = [
  '..kkkkk..',
  '.kEEEEEk.',
  'kEEEwEEEk',
  'kEEwwwEEk',
  'kEwwwwwEk',
  'kEEEwEEEk',
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
  makeTexture(scene, 'cloudNear', ['...wwww....', '..wwwwwww..', '.wwwwwwwwww', 'wwwwwwwwwww', '.wwwwwwwww.']);
}

export const PX = CONFIG.game.pixelScale;

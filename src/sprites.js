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
  //  PURPLE/VIOLET (V,L,D) = coins only.
  //  CYAN-WHITE (c,w)      = player shots (and the hero's nose).
  //  Enemies use ONLY dark / earth / military tones: steel grey (S,s), olive/dark green (O,F,l), brown/black-grey (N,Z)
  //   with a dark outline (k). Lime (M) is the shooter gun. No red, pink, orange, yellow, gold, purple or cyan on enemies.
  //  Crate = wood: brown/tan (T,B,Y) with a dark outline (X). No yellow/gold.
  // (Explosion sparks are tinted yellow/orange in code: small squares, OK.)
  e: 0x7a0a0a, h: 0xff2a2a, q: 0xff7a7a, // enemy shot: dark red outline, bright red, lighter red core
  V: 0xb24bf3, L: 0xe6b8ff, D: 0x2a0a4a, // coin: violet fill, light highlight, dark outline
  S: 0x6a7a92, s: 0x3a4558, G: 0x3fa34d, // grunt: steel grey, dark steel, green canopy
  O: 0x6b7a2e, F: 0x34562a, l: 0x8fc45a, // zigzag: olive, dark green, light green accent
  N: 0x5a3f2c, Z: 0x2b2b32, M: 0xa6ff3c, // shooter: brown, black-grey, lime gun/eye
  T: 0xc58f4f, B: 0x8a5a2b, X: 0x3b2412, Y: 0xe8cf9a // crate: tan, brown, dark outline, light lid
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
// crate: wooden box, light lid with a tiny shine, dark outline (11x11)
const CRATE = [
  'XXXXXXXXXXX',
  'XYwYYYYYYYX',
  'XYYYYYYYYYX',
  'XXXXXXXXXXX',
  'XTTTBBBTTTX',
  'XTTTBBBTTTX',
  'XBBBBBBBBBX',
  'XTTTBBBTTTX',
  'XTTTBBBTTTX',
  'XTTTBBBTTBX',
  'XXXXXXXXXXX'
];
const EBULLET = ['.eee.', 'ehqhe', 'ehqhe', 'ehhhe', '.eee.']; // round red orb, dark red outline
// Player bolt size lives here: 2 x 5 art pixels (white head, cyan tail). Hitbox = texture size.
const PBULLET = ['ww', 'ww', 'ww', 'cc', 'cc'];
// coin: bigger diamond gem (7x7), violet with outline and highlight
const COIN = [
  '...D...',
  '..DLD..',
  '.DLVVD.',
  'DLVVVVD',
  '.DVVVD.',
  '..DVD..',
  '...D...'
];
const HEART = ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'];
const HEART_EMPTY = ['.dd.dd.', 'd..d..d', 'd.....d', '.d...d.', '..d.d..', '...d...'];
const SQUARE = ['w'];

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
  makeTexture(scene, 'cloudFar', ['..www...', '.wwwww..', 'wwwwwwww', '.wwwwww.']);
  makeTexture(scene, 'star', ['w']);
  makeTexture(scene, 'cloudNear', ['...wwww....', '..wwwwwww..', '.wwwwwwwwww', 'wwwwwwwwwww', '.wwwwwwwww.']);
}

export const PX = CONFIG.game.pixelScale;

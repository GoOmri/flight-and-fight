// Tiny pixel sprites drawn in code. Each row is a string; each letter is a colour.
// Swap the hero by editing HERO_ART (or replacing drawHero).
import { CONFIG } from './config.js';

const PAL = {
  '.': null,
  w: 0xffffff, k: 0x1b1b2b, g: 0x8a93a6, d: 0x555d73,
  r: 0xe63946, o: 0xff9f1c, b: 0x3a86ff, c: 0x7fe0ff,
  n: 0x3bb54a, p: 0xb15bd6, m: 0x7a2fa0,
  // COLOUR RULE: no yellow/gold anywhere except nothing; coins purple only (V, L, D below).
  // Enemy shots: RED only. Coins: PURPLE only. Player shots: CYAN-WHITE (c, w). Never mix these.
  // (Explosion sparks are tinted yellow/orange in code: small squares, OK.)
  e: 0x7a0a0a, h: 0xff2a2a, q: 0xff7a7a, // enemy shot: dark red outline, bright red, lighter red core
  V: 0xb24bf3, L: 0xe6b8ff, D: 0x2a0a4a // coin: violet fill, light highlight, dark outline
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
  'r.......r',
  'rr.....rr',
  'rrrrrrrrr',
  'rkwrrrwkr',
  '.rrrrrrr.',
  '..rrrrr..',
  '...r.r...'
];
const ZIGZAG = [
  '..n...n..',
  '.nnn.nnn.',
  'nnnnnnnnn',
  'nwknnnkwn',
  'nnnnnnnnn',
  '.nn.n.nn.',
  '.n.....n.'
];
const SHOOTER = [
  '..m.....m..',
  '.mpm...mpm.',
  'mppppppppm.',
  'mpwwpppwwpm',
  'mpwkpppkwpm',
  'mppppppppp.',
  '.mpp.o.ppm.',
  '..m..o..m..'
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

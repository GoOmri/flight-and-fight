// Tiny pixel sprites drawn in code. Each row is a string; each letter is a colour.
// Swap the hero by editing HERO_ART (or replacing drawHero).
import { CONFIG } from './config.js';

const PAL = {
  '.': null,
  w: 0xffffff, k: 0x1b1b2b, g: 0x8a93a6, d: 0x555d73,
  r: 0xe63946, o: 0xff9f1c, y: 0xffe14d, b: 0x3a86ff, c: 0x7fe0ff,
  n: 0x3bb54a, p: 0xb15bd6, m: 0x7a2fa0
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
  '....oyo....'
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
const EBULLET = ['.oo.', 'oyyo', 'oyyo', '.oo.'];
const PBULLET = ['y', 'y', 'w', 'y'];
const COIN = ['.yy.', 'yoOy', 'yooy', '.yy.'].map(r => r.replace('O', 'y'));
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

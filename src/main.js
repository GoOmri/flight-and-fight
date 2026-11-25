import { CONFIG, hex } from './config.js';
import { useClassicFont, packFontOn } from './hud.js';
import { resetSavedOnce } from './medals.js';
import { initSound } from './sound.js';
initSound();
resetSavedOnce('2026-11-24-score-fix'); // best scores were not saved correctly before v1.9.80: start clean once
import { MenuScene } from './scenes/MenuScene.js';
import { PlayScene } from './scenes/PlayScene.js';

// Phaser draws text on a canvas, so the pixel font must be ready before the first scene makes text (2 s limit: start anyway).
const fontReady = Promise.race([
  Promise.all([ // both fonts: the pixel font of the UI pack and the old one (the fallback)
    document.fonts.load('700 16px "GameFont"', 'A0').then(() => document.fonts.load('400 16px "GameFont"', 'A0')).catch(() => null),
    document.fonts.load('400 16px "PackFont"', 'A0').catch(() => null),
    document.fonts.load('400 32px "DungeonFont"', 'A').catch(() => null)
  ]),
  new Promise(r => setTimeout(r, 2000))
]);
fontReady.then(() => {
  if (packFontOn() && !document.fonts.check('16px "PackFont"', 'A')) useClassicFont(); // the new font did not load: the old one it is
  window.__game = new Phaser.Game({
  type: new URLSearchParams(window.location.search).get('render') === 'canvas' ? Phaser.CANVAS : Phaser.AUTO, // ?render=canvas forces the older drawing mode (to test browsers without WebGL)
  width: CONFIG.game.width * CONFIG.game.render,
  height: CONFIG.game.height * CONFIG.game.render,
  backgroundColor: hex(CONFIG.menu.bgColor), // the dark menu colour (was the old sky blue, which flashed on every start and scene change while pictures loaded)
  pixelArt: true,      // sharp pixels (no smoothing) inside the game
  roundPixels: true,   // sprites sit on whole pixels, no shimmer
  input: { activePointers: 1 },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [MenuScene, PlayScene]
}); });

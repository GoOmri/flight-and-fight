import { CONFIG } from './config.js';
import { MenuScene } from './scenes/MenuScene.js';
import { PlayScene } from './scenes/PlayScene.js';

// Phaser draws text on a canvas, so the pixel font must be ready before the first scene makes text (2 s limit: start anyway).
const fontReady = Promise.race([
  document.fonts.load('700 16px "GameFont"', 'A0').then(() => document.fonts.load('400 16px "GameFont"', 'A0')).catch(() => null),
  new Promise(r => setTimeout(r, 2000))
]);
fontReady.then(() => { window.__game = new Phaser.Game({
  type: new URLSearchParams(window.location.search).get('render') === 'canvas' ? Phaser.CANVAS : Phaser.AUTO, // ?render=canvas forces the older drawing mode (to test browsers without WebGL)
  width: CONFIG.game.width * CONFIG.game.render,
  height: CONFIG.game.height * CONFIG.game.render,
  backgroundColor: '#2a6fdb',
  pixelArt: true,      // sharp pixels (no smoothing) inside the game
  roundPixels: true,   // sprites sit on whole pixels, no shimmer
  input: { activePointers: 1 },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [MenuScene, PlayScene]
}); });

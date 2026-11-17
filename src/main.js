import { CONFIG } from './config.js';
import { PlayScene } from './scenes/PlayScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: CONFIG.game.width,
  height: CONFIG.game.height,
  backgroundColor: '#2a6fdb',
  pixelArt: true,
  input: { activePointers: 1 },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [PlayScene]
});

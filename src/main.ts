import MenuScene from './menu.js';
import Level1Scene from './level1.js';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1200,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a1a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x:0 , y: 800 },
            debug: false
        }
    },
    scene: [MenuScene, Level1Scene]
};

new Phaser.Game(config);
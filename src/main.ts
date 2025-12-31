import MenuScene from './menu.js';
import Level1Scene from './level1Scene.js';
import Credits from './creditsScene.js';
import ChurchScene from './churchScene.js';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1200,
    height: 600,
    parent: 'game-container',
    dom: {
        createContainer: true
    },
    pixelArt: true,
    backgroundColor: '#1a1a1a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 800 },
            debug: false
        }
    },
    scene: [MenuScene, Credits, Level1Scene, ChurchScene]
};

new Phaser.Game(config);
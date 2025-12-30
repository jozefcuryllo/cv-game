import 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');

        this.add.text(600, 150, 'MY PROGRAMMING JOURNEY', {
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(600, 250, 'A platformer game about my career', {
            fontSize: '24px',
            color: '#cccccc'
        }).setOrigin(0.5);

        const startButton = this.add.rectangle(600, 350, 200, 60, 0x4a90e2)
            .setInteractive({ useHandCursor: true });

        const startText = this.add.text(600, 350, 'START GAME', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        startButton.on('pointerover', () => {
            startButton.setFillStyle(0x5ba3ff);
        });

        startButton.on('pointerout', () => {
            startButton.setFillStyle(0x4a90e2);
        });

        startButton.on('pointerdown', () => {
            this.scene.start('Level1Scene');
        });

        this.add.text(600, 450, 'Use Arrow Keys or WASD to move\nPress SPACE or W to jump', {
            fontSize: '18px',
            color: '#888888',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(600, 550, 'Press ESC to return to menu', {
            fontSize: '14px',
            color: '#666666'
        }).setOrigin(0.5);
    }
}
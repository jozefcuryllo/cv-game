import Phaser from 'phaser';

export class FinalScene extends Phaser.Scene {
    constructor() {
        super('FinalScene');
    }

    create() {
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height / 2;

        this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.9);

        this.add.text(centerX, centerY - 150, 'THANKS FOR PLAYING!', {
            fontSize: '42px',
            color: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(centerX, centerY - 70,
            "If you're looking for someone who combines technical skills\n" +
            "with a creative mindset, let's get in touch!", {
            fontSize: '20px',
            color: '#dddddd',
            align: 'center',
            lineSpacing: 10,
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.createLinkButton(centerX, centerY + 50, 'CHECK MY GITHUB', 'https://github.com/jozefcuryllo', '#333333');
        this.createLinkButton(centerX, centerY + 120, 'LET\'S TALK ON LINKEDIN', 'https://www.linkedin.com/in/jozef-curyllo/', '#0077b5');

        const restartBtn = this.add.text(centerX, centerY + 200, 'Back to start', {
            fontSize: '16px',
            color: '#888888',
            fontFamily: 'Arial',
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.registry.set('score', 0);
                this.registry.set('labelData', []);

                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                    this.scene.stop('FinalScene');
                    this.scene.start('MenuScene');
                });
            });
    }

    private createLinkButton(x: number, y: number, label: string, url: string, color: string) {
        const btnWidth = 350;
        const btnHeight = 55;

        const bg = this.add.rectangle(0, 0, btnWidth, btnHeight, Phaser.Display.Color.HexStringToColor(color).color)
            .setStrokeStyle(2, 0xffffff);

        const txt = this.add.text(0, 0, label, {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const container = this.add.container(x, y, [bg, txt])
            .setInteractive(new Phaser.Geom.Rectangle(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight), Phaser.Geom.Rectangle.Contains)
            .on('pointerdown', () => window.open(url, '_blank'))
            .on('pointerover', () => container.setScale(1.05))
            .on('pointerout', () => container.setScale(1));

        return container;
    }
}
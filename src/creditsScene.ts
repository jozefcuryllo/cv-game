import 'phaser';

export default class Credits extends Phaser.Scene {
    constructor() {
        super({ key: 'CreditsScene' });
    }

    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor('#1a1a2e');

        const htmlContent = `
            <div style="color: white; font-family: Arial; text-align: center; width: 400px; user-select: none;">
                <h1 style="font-size: 32px; margin-bottom: 20px;">CREDITS</h1>
                <p>Game Design & Code: Jozef Curyllo</p>
                <br>
                <p><b>MUSIC:</b></p>
                <p>Track 1 - Music by <a href="https://pixabay.com/users/robloxeur-43206746/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=296273">Robloxeur</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=296273">Pixabay</a></p>
                <p>Track 2 - Music by <a href="https://pixabay.com/users/bouncyrunner-44731320/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=445782">BouncyRunner</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=445782">Pixabay</a></p>
                <p>Organ fugue - Yubatake - <a href="https://opengameart.org/content/fugue-in-b-minor">https://opengameart.org/content/fugue-in-b-minor</a>
                <br>
                <p><b>SFX:</b></p>
                <p>
                    Coin sound - Sound Effect by 
                    Sound Effect by <a href="https://pixabay.com/users/chieuk-46505609/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=257878">chieuk</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=257878">Pixabay</a>
                </p>
                <p><b>GRAPHICS:</b></p>
                <p>Main character - <a href="https://opengameart.org/content/mv-platformer-male-32x64">https://opengameart.org/content/mv-platformer-male-32x64</a></p>
                <p>Cat - Shepardskin - <a href="https://twitter.com/Shepardskin">https://twitter.com/Shepardskin</a></p>
                <p>Pipe organ - AI
                <p>Everything else - Platformer Art Complete Pack - <a href="https://Kenney.nl">Kenney.nl</a></p>
                <br>
                <p>THANK YOU FOR PLAYING!</p>
            </div>
        `;

        const creditsDOM = this.add.dom(width / 2, height + 50).createFromHTML(htmlContent);

        this.tweens.add({
            targets: creditsDOM,
            y: 0,
            duration: 15000,
            onComplete: () => this.scene.start('MenuScene')
        });

        const backButton = this.add.text(width - 50, 50, 'X', {
            fontSize: '32px',
            color: '#ff4444',
            fontStyle: 'bold'
        }).setInteractive({ useHandCursor: true });

        backButton.on('pointerdown', () => this.scene.start('MenuScene'));
    }

}
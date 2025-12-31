export abstract class BaseScene extends Phaser.Scene {
    protected player!: Phaser.Physics.Arcade.Sprite;
    protected cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    protected wasd!: any;
    protected esc!: any;

    protected score = 0;
    protected scoreText!: Phaser.GameObjects.Text;
    protected isRespawning = false;

    protected tile: number = 70;
    protected playlist: string[] = ['track1', 'track2'];
    protected currentTrackIndex: number = 0;
    protected music!: Phaser.Sound.BaseSound;
    protected worldWidth = 1000;


    constructor(config?: string | Phaser.Types.Scenes.SettingsConfig | undefined) {
        super(config);
    }

    preload() {
        this.load.spritesheet('player', '/assets/sprites/maleBase/full/advnt_full.png', { frameWidth: 32, frameHeight: 64 });
    }

    protected createPlayer(x: number, y: number) {
        this.player = this.physics.add.sprite(x, y, 'player').setScale(3);
        this.player.setCollideWorldBounds(true);
        this.player.body.setGravityY(1200);
        this.player.setDragX(1500);
        this.player.setMaxVelocity(400, 1000);
        this.player.body?.setSize(12, 64);
        this.player.setDepth(100);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D,SPACE');
        this.esc = this.input.keyboard.addKeys('ESC');

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '20px', color: '#FFF' }).setScrollFactor(0);


        this.createAnimations();

        this.input.keyboard.on('keydown-M', () => {
            this.sound.mute = !this.sound.mute;

            const status = !this.sound.mute ? 'MUTED' : 'UNMUTED';
            const indicator = this.add.text(this.cameras.main.width / 2, 50, status, {
                fontSize: '24px',
                color: '#ff4444',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setScrollFactor(0);

            this.time.delayedCall(1000, () => indicator.destroy());
        });
    }

    protected createAnimations() {
        if (this.anims.exists('idle')) return;
        this.anims.create({ key: 'idle', frames: [{ key: 'player', frame: 0 }], frameRate: 1 });
        this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('player', { start: 1, end: 6 }), frameRate: 12, repeat: -1 });
        this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('player', { start: 17, end: 19 }), frameRate: 10 });
        this.anims.create({ key: 'crouch', frames: this.anims.generateFrameNumbers('player', { start: 7, end: 9 }), frameRate: 6, repeat: -1 });
    }

    protected playAnimations(body: Phaser.Physics.Arcade.Body, isCrouching: boolean) {
        if (!body.blocked.down) {
            this.player.anims.play('jump', true);
        } else if (isCrouching) {
            this.player.anims.play('crouch', true);
        } else if (Math.abs(body.velocity.x) > 20) {
            this.player.anims.play('walk', true);
        } else {
            this.player.anims.play('idle', true);
        }
    }

    protected handleDeath() {
        if (this.isRespawning) return;
        this.isRespawning = true;

        this.player.setTint(0xff0000);
        this.time.delayedCall(800, () => this.scene.restart());
    }


    update() {
        if (this.esc.ESC.isDown) {
            if (this.music) {
                this.music.stop();
            }
            this.scene.stop();
            this.scene.start('MenuScene');
        }

        if (!this.player) return;

        if (this.isRespawning) return;


        if (this.player.y > this.cameras.main.height + 50) {
            this.handleDeath();
            return;
        }


        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const accel = 1000;


        const isCrouchKeyDown = this.cursors.down.isDown || this.wasd.S.isDown;
        const isCrouching = isCrouchKeyDown && body.blocked.down;

        if (isCrouching) {
            body.setAccelerationX(0);
            body.setDragX(500);
        } else {
            body.setDragX(1500);

            if (this.cursors.left.isDown || this.wasd.A.isDown) {
                body.setAccelerationX(-accel);
                this.player.flipX = true;
            } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
                body.setAccelerationX(accel);
                this.player.flipX = false;
            } else {
                body.setAccelerationX(0);
            }
        }

        const jumpPressed =
            Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.wasd.W) ||
            Phaser.Input.Keyboard.JustDown(this.wasd.SPACE);

        const jumpReleased =
            Phaser.Input.Keyboard.JustUp(this.cursors.up) ||
            Phaser.Input.Keyboard.JustUp(this.wasd.W) ||
            Phaser.Input.Keyboard.JustUp(this.wasd.SPACE);

        if (jumpPressed && body.blocked.down) {
            body.setVelocityY(-700);
        }

        if (jumpReleased && body.velocity.y < 0) {
            body.setVelocityY(body.velocity.y * 0.4);
        }

        this.playAnimations(body, isCrouching);
    }

    protected playNextTrack() {
        const trackKey = this.playlist[this.currentTrackIndex];
        if (trackKey) {
            this.music = this.sound.add(trackKey, { volume: 0.5 });

            this.music.once('complete', () => {
                this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
                this.playNextTrack();
            });

            this.music.play();
        }
    }
}
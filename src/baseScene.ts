import { predefinedInfos } from "./level1_config.js";

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
        this.load.image('sign', '/assets/sprites/Platformer Art Complete Pack/Base pack/Tiles/sign.png');
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

        if (this.music) {
            this.music.stop();
            this.music.destroy();
        }

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
        console.log('playlist:', this.playlist);
        console.log('index:', this.currentTrackIndex);
        console.log('trackey:', trackKey);
        if (trackKey) {
            this.music = this.sound.add(trackKey, { volume: 0.5 });

            this.music.once('complete', () => {
                this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
                this.playNextTrack();
            });

            this.music.play();
        }
    }

    protected createSign(x: number, y: number, index: number) {
        const text = predefinedInfos[index] ?? '';
        console.log(index, text);
        this.add.image(x, y, 'sign')
            .setScale(1)
            .setOrigin(1, 1)
            .setDepth(0);

        const trigger = this.add.rectangle(x - this.tile / 2, y - this.tile / 2, this.tile * 1.5, this.tile, 0x000000, 0);
        this.physics.add.existing(trigger, true);

        const dialog = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY)
            .setScrollFactor(0)
            .setDepth(105)
            .setVisible(false);

        const bg = this.add.rectangle(0, 0, 600, 400, 0x000000, 0.9)
            .setStrokeStyle(4, 0x555555);

        const content = this.add.text(-270, -180, text, {
            fontSize: '20px',
            color: '#ffffff',
            wordWrap: { width: 520 },
            lineSpacing: 10
        }).setOrigin(0, 0);

        const maskShape = this.make.graphics();

        const maskX = this.cameras.main.centerX - 280;
        const maskY = this.cameras.main.centerY - 180;

        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(maskX, maskY, 560, 360);

        maskShape.setScrollFactor(0);

        const mask = maskShape.createGeometryMask();
        content.setMask(mask);

        const track = this.add.rectangle(285, 0, 10, 360, 0x333333)
            .setInteractive();
        const bar = this.add.rectangle(285, -180, 10, 50, 0xffffff)
            .setOrigin(0.5, 0)
            .setInteractive();

        dialog.add([bg, track, bar, content]);

        const keys = this.input.keyboard.addKeys('E,UP') as any;

        this.physics.add.overlap(this.player, trigger, () => {
            if (dialog.visible) return;

            if (Phaser.Input.Keyboard.JustDown(keys.E) || Phaser.Input.Keyboard.JustDown(keys.UP)) {
                this.player.body.setVelocity(0, 0);
                this.input.keyboard.enabled = false;
                dialog.setVisible(true);
                content.y = -180;

                console.log(content.text)

                const updateBar = () => {
                    const range = content.height - 360;
                    if (range <= 0) {
                        bar.setVisible(false);
                        track.setVisible(false);
                        return;
                    }
                    const progress = (content.y + 180) / -range;
                    const barRange = 360 - bar.displayHeight;
                    bar.y = -180 + (progress * barRange);
                };

                bar.displayHeight = Math.max(20, (360 / content.height) * 360);
                updateBar();

                const scrollHandler = (e: KeyboardEvent) => {
                    const scrollSpeed = 20;
                    const minY = -180;
                    const maxY = Math.min(minY, 180 - content.height);

                    if (e.key === 'ArrowUp' || e.key === 'w') content.y += scrollSpeed;
                    else if (e.key === 'ArrowDown' || e.key === 's') content.y -= scrollSpeed;

                    content.y = Phaser.Math.Clamp(content.y, maxY, minY);
                    updateBar();
                };

                const wheelHandler = (e: WheelEvent) => {
                    e.preventDefault();
                    const scrollSpeed = 1;
                    const minY = -180;
                    const maxY = Math.min(minY, 180 - content.height);

                    content.y -= e.deltaY * scrollSpeed;
                    content.y = Phaser.Math.Clamp(content.y, maxY, minY);
                    updateBar();
                };

                let isDragging = false;
                let dragStartY = 0;
                let barStartY = 0;

                bar.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                    isDragging = true;
                    dragStartY = pointer.y;
                    barStartY = bar.y;
                });

                this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
                    if (!isDragging) return;

                    const deltaY = pointer.y - dragStartY;
                    const newBarY = barStartY + deltaY;
                    const barRange = 360 - bar.displayHeight;
                    const clampedBarY = Phaser.Math.Clamp(newBarY, -180, -180 + barRange);

                    bar.y = clampedBarY;

                    const progress = (clampedBarY + 180) / barRange;
                    const contentRange = content.height - 360;
                    content.y = -180 - (progress * contentRange);
                });

                this.input.on('pointerup', () => {
                    isDragging = false;
                });

                track.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                    const localY = pointer.y - this.cameras.main.centerY;
                    const barRange = 360 - bar.displayHeight;
                    const newBarY = Phaser.Math.Clamp(localY - bar.displayHeight / 2, -180, -180 + barRange);

                    bar.y = newBarY;

                    const progress = (newBarY + 180) / barRange;
                    const contentRange = content.height - 360;
                    content.y = -180 - (progress * contentRange);
                });

                window.addEventListener('keydown', scrollHandler);
                window.addEventListener('wheel', wheelHandler, { passive: false });

                setTimeout(() => {
                    const closeHandler = (e: KeyboardEvent) => {
                        if (['ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key)) return;
                        dialog.setVisible(false);
                        this.input.keyboard.enabled = true;
                        isDragging = false;
                        window.removeEventListener('keydown', scrollHandler);
                        window.removeEventListener('wheel', wheelHandler);
                        window.removeEventListener('keydown', closeHandler);
                        bar.off('pointerdown');
                        track.off('pointerdown');
                        this.input.off('pointermove');
                        this.input.off('pointerup');
                    };
                    window.addEventListener('keydown', closeHandler);
                }, 100);
            }
        });
    }
}
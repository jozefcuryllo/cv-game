import { predefinedInfos, predefinedStars } from "./level1_config.js";

export abstract class BaseScene extends Phaser.Scene {
    protected player!: Phaser.Physics.Arcade.Sprite;
    protected stars!: Phaser.Physics.Arcade.Group;
    protected cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    protected wasd!: any;
    protected esc!: any;

    protected scoreText!: Phaser.GameObjects.Text;
    protected isRespawning = false;

    protected tile: number = 70;
    protected playlist: string[] = ['track1', 'track2'];
    protected currentTrackIndex: number = 0;
    protected music!: Phaser.Sound.BaseSound;
    protected worldWidth = 1000;
    protected touchState: { [key: string]: boolean } = {
        left: false,
        right: false,
        up: false,
        down: false
    };
    protected jumpInProcess = false;
    protected maxLabels = 5;
    protected activeLabels: Phaser.GameObjects.Text[] = [];
    protected playerCanMove: boolean = true;

    constructor(config?: string | Phaser.Types.Scenes.SettingsConfig | undefined) {
        super(config);
    }

    preload() {
        const loadingText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'LOADING...', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);


        this.load.spritesheet('player', '/assets/sprites/maleBase/full/advnt_full.png', { frameWidth: 32, frameHeight: 64 });
        this.load.image('star', '/assets/sprites/Platformer Art Complete Pack/Base pack/Items/star.png');
        this.load.audio('star_sound', 'assets/audio/star.mp3');
        this.load.image('sign', '/assets/sprites/Platformer Art Complete Pack/Base pack/Tiles/sign.png');

        this.load.on('complete', function () {
            loadingText.destroy()
        });
    }

    protected create() {

        const w = this.cameras.main.width;
        const margin = 20;

        const muteBtn = this.add.text(w - margin, margin, this.sound.mute ? '🔇' : '🔊', {
            fontSize: '32px',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        })
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(200);

        muteBtn.on('pointerdown', () => {
            const newVal = this.switchMute();
            muteBtn.setText(newVal ? '🔇' : '🔊');
        });

        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-M', () => {
                const newVal = this.switchMute();
                muteBtn.setText(newVal ? '🔇' : '🔊');
            });
        }

        const menuBtn = this.add.text(w - margin - 70, margin, 'MENU', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            fixedHeight: muteBtn.displayHeight,
            padding: { x: 10, y: 10 }
        })
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(200);

        menuBtn.on('pointerdown', () => {
            this.sound.stopAll();
            this.scene.start('MenuScene');
        });

        [muteBtn, menuBtn].forEach(btn => {
            btn.on('pointerover', () => btn.setStyle({ fill: '#ff0' }));
            btn.on('pointerout', () => btn.setStyle({ fill: '#fff' }));
        });

        this.setupControls();

        this.stars = this.physics.add.group({ allowGravity: false });
        this.refreshLabelDisplay();
    }

    protected setupControls() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        const createZone = (x: number, y: number, width: number, height: number, key: string) => {
            const zone = this.add.zone(x, y, width, height)
                .setOrigin(0)
                .setInteractive()
                .setScrollFactor(0)
                .setDepth(10);

            zone.on('pointerdown', () => { this.touchState[key] = true; });
            zone.on('pointerup', () => { this.touchState[key] = false; });
            zone.on('pointerout', () => { this.touchState[key] = false; });
        };

        createZone(0, 0, w, h * 0.25, 'up');
        createZone(0, h * 0.75, w, h * 0.25, 'down');
        createZone(0, h * 0.25, w * 0.5, h * 0.5, 'left');
        createZone(w * 0.5, h * 0.25, w * 0.5, h * 0.5, 'right');
    }

    protected createPlayer(x: number, y: number) {
        this.player = this.physics.add.sprite(x, y, 'player').setScale(3);
        this.player.setCollideWorldBounds(true);
        this.player.setGravity(0, 1200);
        this.player.setDragX(1500);
        this.player.setMaxVelocity(400, 1000);
        this.player.body?.setSize(12, 64);
        this.player.setDepth(100);

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        this.scoreText = this.add.text(20, 20, `Score: ${this.registry.get('score')}`, { fontSize: '20px', color: '#FFF' })
            .setScrollFactor(0);

        this.createAnimations();

        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = this.input.keyboard.addKeys('W,A,S,D,SPACE');
            this.esc = this.input.keyboard.addKeys('ESC');
        }

        this.physics.add.overlap(this.player, this.stars, this.collectStar as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    }

    protected switchMute(): boolean {
        const old = this.sound.mute;
        this.sound.mute = !this.sound.mute;

        const status = !this.sound.mute ? 'MUTED' : 'UNMUTED';
        const indicator = this.add.text(
            this.cameras.main.width / 2, 50,
            status,
            {
                fontSize: '24px',
                color: '#ff4444',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            })
            .setOrigin(0.5)
            .setScrollFactor(0);

        this.time.delayedCall(1000, () => indicator.destroy());

        return !old;
    }

    protected createAnimations() {
        if (this.anims.exists('idle')) return;
        this.anims.create({ key: 'idle', frames: [{ key: 'player', frame: 0 }], frameRate: 1 });
        this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('player', { start: 1, end: 6 }), frameRate: 12, repeat: -1 });
        this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('player', { start: 17, end: 19 }), frameRate: 10 });
        this.anims.create({ key: 'crouch', frames: this.anims.generateFrameNumbers('player', { start: 7, end: 9 }), frameRate: 6, repeat: 0 });
    }

    protected playAnimations(body: Phaser.Physics.Arcade.Body, isCrouching: boolean) {
        if (!body.blocked.down) {
            this.player.anims.play('jump', true);
        } else if (isCrouching) {
            if (this.player.anims.currentAnim?.key === 'crouch' && this.player.anims.isPlaying === false) {
                return;
            }
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
        this.registry.set('score', 0);
        this.registry.set('labels', []);
        this.refreshLabelDisplay()
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

        const moveLeft = this.cursors.left.isDown || this.wasd.A.isDown || this.touchState.left;
        const moveRight = this.cursors.right.isDown || this.wasd.D.isDown || this.touchState.right;
        const moveDown = this.cursors.down.isDown || this.wasd.S.isDown || this.touchState.down;

        const jumpJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.wasd.W) ||
            Phaser.Input.Keyboard.JustDown(this.wasd.SPACE) ||
            (this.touchState.up && !this.jumpInProcess);

        if (this.playerCanMove) {
            if (this.touchState.up) this.jumpInProcess = true;
            else this.jumpInProcess = false;

            const isCrouching = moveDown && body.blocked.down;

            if (isCrouching) {
                body.setAccelerationX(0);
                body.setVelocityX(0);
                body.setDragX(1200);

                if (moveLeft) this.player.flipX = true;
                else if (moveRight) this.player.flipX = false;

            } else {
                body.setDragX(1500);
                if (moveLeft) {
                    body.setAccelerationX(-accel);
                    this.player.flipX = true;
                } else if (moveRight) {
                    body.setAccelerationX(accel);
                    this.player.flipX = false;
                } else {
                    body.setAccelerationX(0);
                }
            }

            if (jumpJustPressed && body.blocked.down) {
                body.setVelocityY(-700);
            }

            const isStillHoldingJump = this.cursors.up.isDown ||
                this.wasd.W.isDown ||
                this.wasd.SPACE.isDown ||
                this.touchState.up;

            if (!isStillHoldingJump && body.velocity.y < 0) {
                body.setVelocityY(body.velocity.y * 0.4);
            }

            this.playAnimations(body, isCrouching);
        }
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

    protected createSign(x: number, y: number, index: number) {
        const text = predefinedInfos[index] ?? '';

        this.add.image(x, y, 'sign')
            .setScale(1)
            .setOrigin(1, 1)
            .setDepth(0);

        const trigger = this.add.rectangle(x - this.tile / 2, y - this.tile / 2, this.tile * 1.5, this.tile, 0x000000, 0);
        this.physics.add.existing(trigger, true);
        trigger
            .setInteractive({ useHandCursor: true })
            .setDepth(20);

        const dialog = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY)
            .setScrollFactor(0)
            .setDepth(105)
            .setVisible(false);

        const bg = this.add.rectangle(0, 0, 600, 400, 0x000000, 0.9).setStrokeStyle(4, 0x555555);
        const content = this.add.text(-270, -180, text, {
            fontSize: '20px',
            color: '#ffffff',
            wordWrap: { width: 520 },
            lineSpacing: 10
        }).setOrigin(0, 0);

        const maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff).fillRect(this.cameras.main.centerX - 280, this.cameras.main.centerY - 180, 560, 360).setScrollFactor(0);
        content.setMask(maskShape.createGeometryMask());

        const track = this.add.rectangle(285, 0, 10, 360, 0x333333).setInteractive();
        const bar = this.add.rectangle(285, -180, 10, 50, 0xffffff).setOrigin(0.5, 0).setInteractive();
        dialog.add([bg, track, bar, content]);

        const keys = this.input.keyboard ? this.input.keyboard.addKeys('E,UP') as any : null;

        const openDialog = () => {
            if (dialog.visible) return;

            const speed = Math.sqrt(
                Math.pow((this.player.body as Phaser.Physics.Arcade.Body)?.velocity.x, 2) + Math.pow((this.player.body as Phaser.Physics.Arcade.Body)?.velocity?.y, 2)
            );
            if (speed > 200) return;

            this.player.setVelocity(0, 0);
            if (this.input.keyboard) this.input.keyboard.enabled = false;

            dialog.setVisible(true);
            content.y = -180;

            const updateBar = () => {
                const range = content.height - 360;
                if (range <= 0) { bar.setVisible(false); track.setVisible(false); return; }
                const progress = (content.y + 180) / -range;
                bar.y = -180 + (progress * (360 - bar.displayHeight));
            };

            bar.displayHeight = Math.max(20, (360 / content.height) * 360);
            updateBar();

            const scrollHandler = (e: KeyboardEvent) => {
                const minY = -180;
                const maxY = Math.min(minY, 180 - content.height);
                if (e.key === 'ArrowUp' || e.key === 'w') content.y += 20;
                else if (e.key === 'ArrowDown' || e.key === 's') content.y -= 20;
                content.y = Phaser.Math.Clamp(content.y, maxY, minY);
                updateBar();
            };

            const wheelHandler = (e: WheelEvent) => {
                e.preventDefault();
                const minY = -180;
                const maxY = Math.min(minY, 180 - content.height);
                content.y -= e.deltaY;
                content.y = Phaser.Math.Clamp(content.y, maxY, minY);
                updateBar();
            };

            const pointerMoveHandler = (pointer: Phaser.Input.Pointer) => {
                if (!isDragging) return;
                const barRange = 360 - bar.displayHeight;
                bar.y = Phaser.Math.Clamp(barStartY + (pointer.y - dragStartY), -180, -180 + barRange);
                content.y = -180 - (((bar.y + 180) / barRange) * (content.height - 360));
            };

            let isDragging = false, dragStartY = 0, barStartY = 0;
            bar.on('pointerdown', (p: Phaser.Input.Pointer) => { isDragging = true; dragStartY = p.y; barStartY = bar.y; });
            this.input.on('pointermove', pointerMoveHandler);
            this.input.on('pointerup', () => isDragging = false);

            window.addEventListener('keydown', scrollHandler);
            window.addEventListener('wheel', wheelHandler, { passive: false });

            setTimeout(() => {
                const closeHandler = () => {
                    dialog.setVisible(false);
                    if (this.input.keyboard) {
                        this.input.keyboard.enabled = true;
                        this.input.keyboard.resetKeys();
                    }
                    window.removeEventListener('keydown', scrollHandler);
                    window.removeEventListener('wheel', wheelHandler);
                    window.removeEventListener('keydown', keyCloseHandler);
                    this.input.off('pointermove', pointerMoveHandler);
                };
                const keyCloseHandler = (e: KeyboardEvent) => {
                    if (!['ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key)) closeHandler();
                };
                window.addEventListener('keydown', keyCloseHandler);
                bg.once('pointerdown', closeHandler);
                bg.setInteractive();
            }, 100);
        };

        trigger.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            pointer.event.stopPropagation();
            openDialog();
        });

        this.physics.add.overlap(this.player, trigger, () => {
            if (keys && (Phaser.Input.Keyboard.JustDown(keys.E) || Phaser.Input.Keyboard.JustDown(keys.UP))) {
                openDialog();
            }
        });

    }

    protected createStar(x: number, y: number, index: number | null, text: string | null = null) {

        const _text = index !== null ? predefinedStars[index] ?? "" : text ?? ""
        const star = this.stars.create(x, y, 'star')
            .setScale(1.5);

        star.body.setSize(this.tile / 2, this.tile / 2);
        star.refreshBody();
        const label = this.add.text(x, y - 50, _text,
            {
                fontSize: '18px',
                color: '#fff',
                stroke: '#000',
                strokeThickness: 0
            })
            .setOrigin(0.5)
            .setAlpha(0.6);
        star.setData('label', label);

        this.tweens.add({
            targets: star,
            y: star.y - 15,
            scale: { from: 1, to: 1.2 },
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        this.tweens.add({
            targets: star,
            angle: { from: -5, to: 5 },
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

    }

    protected addLabelToList(content: string): void {
        let labelData: string[] = this.registry.get('labelData') || [];
        labelData.unshift(content);

        if (labelData.length > (this.maxLabels || 5)) {
            labelData.pop();
        }
        this.registry.set('labelData', labelData);

        const startX = 20;
        const startY = 80;
        const spacing = 22;

        this.activeLabels.forEach((label, index) => {
            this.tweens.add({
                targets: label,
                y: startY + ((index + 1) * spacing),
                duration: 150
            });
        });

        const newLabel = this.add.text(startX, startY, content, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff'
        });
        newLabel.setAlpha(0).setScrollFactor(0);

        this.tweens.add({
            targets: newLabel,
            alpha: 0.7,
            duration: 150
        });

        this.activeLabels.unshift(newLabel);

        if (this.activeLabels.length > (this.maxLabels || 5)) {
            const oldLabel = this.activeLabels.pop();
            oldLabel?.destroy();
        }
    }

    protected refreshLabelDisplay(): void {
        const startX = 20;
        const startY = 80;
        const spacing = 22;

        this.activeLabels.forEach(l => l.destroy());
        this.activeLabels = [];

        const labelData: string[] = this.registry.get('labels') || [];

        labelData.forEach((text, index) => {
            const label = this.add.text(startX, startY + (index * spacing), text, {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#ffffff'
            });
            label.setAlpha(0.7).setScrollFactor(0);
            this.activeLabels.push(label);
        });
    }

    collectStar(player: any, star: Phaser.Physics.Arcade.Sprite): void {
        this.sound.play('star_sound', { volume: 0.6 });
        const label = star.getData('label') as Phaser.GameObjects.Text;

        if (label) {
            this.addLabelToList(label.text);

            this.tweens.add({
                targets: label,
                y: label.y - 40,
                alpha: 0,
                duration: 600,
                onComplete: () => label.destroy()
            });
        }

        star.destroy();

        const newScore = this.registry.get('score') + 1;
        this.registry.set('score', newScore);
        this.scoreText.setText(`Score: ${newScore}`);
    }
}
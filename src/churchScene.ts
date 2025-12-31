import 'phaser';
import { BaseScene } from './baseScene.js';

export default class ChurchScene extends BaseScene {

    protected worldWidth: number = 1400;
    constructor() {
        super('ChurchScene');
    }

    preload() {
        super.preload();

        const path = '/assets/sprites/Platformer Art Complete Pack/Buildings expansion/Tiles/';
        const files = [
            'houseGray', 'houseGrayAlt', 'houseGrayAlt2',
            'houseGrayBottomLeft', 'houseGrayBottomMid', 'houseGrayBottomRight',
            'houseGrayMidLeft', 'houseGrayMidRight',
            'houseGrayTopLeft', 'houseGrayTopMid', 'houseGrayTopRight',
            'doorKnob', 'doorTop', 'windowCheckered'
        ];

        files.forEach(file => {
            this.load.image(file, `${path}${file}.png`);
        });

        this.load.image('organ1', '/assets/sprites/organ3.png');
        this.load.image('sign', '/assets/sprites/Platformer Art Complete Pack/Base pack/Tiles/sign.png');

    }

    create() {

        const h = this.cameras.main.height;

        this.cameras.main.setBackgroundColor('#6db3f2');
        this.physics.world.setBounds(0, 0, this.worldWidth, h + 200);
        this.cameras.main.setBounds(0, 0, this.worldWidth, h);
        const bottomY = h;
        this.createPlayer(250, bottomY - 400);

        const centerX = this.cameras.main.centerX - (12 * this.tile) / 2;

        this.createSigns(600, bottomY - this.tile / 2,
            "Pipe organs were the most complex machines built by humans before the invention of the steam engine. They combine mechanics, acoustics, and architecture into a single instrument. \nAn organist plays them with both hands and feet, while also controlling numerous stops and switches that shape the sound.\n\nThis unique coordination strongly engages the brain, enhancing cognition, focus, and spatial thinking.\n\nI was an organist for over than 5 years. I've also created a website Musicam Sacram, to gather polish organists in one place. Nowadays, it's one of the biggest websites of that topic in Europe."
        );
        this.createInterior(bottomY);
        this.createOrgans(centerX + 17 * this.tile, bottomY - this.tile / 2);

        const doorX = centerX + this.tile;
        this.createChurchDoor(doorX, bottomY - this.tile / 2);

        const exitTrigger = this.add.rectangle(centerX + this.tile, bottomY, this.tile, this.tile * 2, 0x000000, 0);
        this.physics.add.existing(exitTrigger, true);
    }

    update() {
        super.update()
    }

    protected createSigns(x: number, y: number, text: string) {
        this.add.image(x, y, 'sign').setScale(1).setOrigin(1, 1).setDepth(-1);

        const trigger = this.add.rectangle(x - this.tile / 2, y - this.tile / 2, this.tile * 1.5, this.tile, 0x000000, 0);
        this.physics.add.existing(trigger, true);

        const dialog = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY)
            .setScrollFactor(0).setDepth(100).setVisible(false);

        const bg = this.add.rectangle(0, 0, 600, 400, 0x000000, 0.9).setStrokeStyle(4, 0x555555);
        const content = this.add.text(-270, -180, text, {
            fontSize: '20px',
            wordWrap: { width: 520 },
            lineSpacing: 10
        }).setOrigin(0, 0);

        const maskShape = this.add.graphics()
            .fillRect(this.cameras.main.centerX - 280, this.cameras.main.centerY - 180, 560, 360)
            .setVisible(false);
        content.setMask(maskShape.createGeometryMask());

        const track = this.add.rectangle(285, 0, 10, 360, 0x333333).setInteractive();
        const bar = this.add.rectangle(285, -180, 10, 50, 0xffffff).setOrigin(0.5, 0).setInteractive();

        dialog.add([bg, track, bar, content]);

        const keys = this.input.keyboard.addKeys('E,UP') as any;

        this.physics.add.overlap(this.player, trigger, () => {
            if (dialog.visible) return;

            if (Phaser.Input.Keyboard.JustDown(keys.E) || Phaser.Input.Keyboard.JustDown(keys.UP)) {
                this.player.body.setVelocity(0, 0);
                this.input.keyboard.enabled = false;
                dialog.setVisible(true);
                content.y = -180;

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
    protected createInterior(y: number) {
        const w = Math.ceil(this.worldWidth / this.tile);
        const h = 10;
        const startX = 0;
        const worldBounds = this.physics.add.staticGroup();

        for (let row = 0; row < h; row++) {
            const py = y - (row + 1) * this.tile;

            for (let col = 0; col < w; col++) {
                const px = startX + col * this.tile;
                let key = 'houseGray';

                if (Math.random() > 0.6)
                    key = 'houseGrayAlt2';
                if (Math.random() > 0.8)
                    key = 'houseGrayAlt';

                if (row === 0) {
                    key = 'houseGrayBottomMid';
                    if (col === 0) key = 'houseGrayBottomLeft';
                    else if (col === w - 1) key = 'houseGrayBottomRight';

                    this.add.image(px, y - this.tile, key).setOrigin(0).setDepth(-5);

                    const floorRect = this.add.rectangle(px + this.tile / 2, y, this.tile, this.tile);
                    worldBounds.add(floorRect);
                }
                else if (row === h - 1) {
                    if (col === 0) key = 'houseGrayTopLeft';
                    else if (col === w - 1) key = 'houseGrayTopRight';
                    else key = 'houseGrayTopMid';
                    this.add.image(px, py, key).setOrigin(0).setDepth(-5);
                }
                else {
                    if (col === 0) {
                        key = 'houseGrayMidLeft';
                        const wallRect = this.add.rectangle(px, py + this.tile / 2, this.tile, this.tile);
                        worldBounds.add(wallRect);
                    }
                    else if (col === w - 1) {
                        key = 'houseGrayMidRight';
                        const wallRect = this.add.rectangle(px + this.tile, py + this.tile / 2, this.tile, this.tile);
                        worldBounds.add(wallRect);
                    }
                    this.add.image(px, py, key).setOrigin(0).setDepth(-2);
                }
            }
        }

        this.physics.add.collider(this.player, worldBounds);
        this.physics.world.setBounds(0, y - (h * this.tile), 2000, h * this.tile + this.tile);

        for (let i = 200; i < this.worldWidth; i += 600) {
            this.add.image(i, y - 6 * this.tile, 'windowCheckered')
                .setOrigin(0.5)
                .setDepth(-1);
        }
    }


    protected createChurchDoor(x: number, y: number) {

        this.add.image(x, y + this.tile / 2 - 2 * this.tile, 'doorTop')
            .setOrigin(1, 1)
            .setScale(1.5, 1.5)
            .setDepth(0);

        this.add.image(x, y, 'doorKnob')
            .setOrigin(1, 1)
            .setScale(1.5, 1.5)
            .setDepth(0);

        const doorTrigger = this.add.rectangle(
            x,
            y,
            this.tile,
            this.tile * 2,
            0x000000,
            0
        );
        this.physics.add.existing(doorTrigger, true);

        const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        const upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        this.physics.add.overlap(this.player, doorTrigger, () => {
            if (Phaser.Input.Keyboard.JustDown(enterKey) || Phaser.Input.Keyboard.JustDown(upKey)) {
                this.scene.switch('Level1Scene');
            }
        }, undefined, this);
    }

    protected createOrgans(x: number, y: number) {

        this.add.image(x, y, 'organ1')
            .setScale(0.4)
            .setOrigin(1, 1)
            .setDepth(-1);
    }

}
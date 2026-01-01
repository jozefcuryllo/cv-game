import 'phaser';
import { BaseScene } from './baseScene.js';

export default class ChurchScene extends BaseScene {

    protected worldWidth: number = 1400;
    protected playlist: string[] = ['fugue1'];
    protected currentTrackIndex: number = 0;

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
        this.load.audio('fugue1', '/assets/audio/fugueinbminor/FugueInBMinor.flac');
    }

    create() {

        const h = this.cameras.main.height;

        this.cameras.main.setBackgroundColor('#6db3f2');
        this.physics.world.setBounds(0, 0, this.worldWidth, h + 200);
        this.cameras.main.setBounds(0, 0, this.worldWidth, h);
        const bottomY = h;
        this.createPlayer(250, bottomY - 400);
        this.score = this.registry.get('score');
        this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, { fontSize: '20px', color: '#FFF' }).setScrollFactor(0);

        const centerX = this.cameras.main.centerX - (12 * this.tile) / 2;

        this.createSign(600, bottomY - this.tile / 2, 0);
        this.createInterior(bottomY);
        this.createOrgans(centerX + 17 * this.tile, bottomY - this.tile / 2);

        const doorX = centerX + this.tile;
        this.createChurchDoor(doorX, bottomY - this.tile / 2);

        const exitTrigger = this.add.rectangle(centerX + this.tile, bottomY, this.tile, this.tile * 2, 0x000000, 0);
        this.physics.add.existing(exitTrigger, true);

        this.playNextTrack();
    }

    update() {
        super.update()
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
                this.music.stop();
                this.music.destroy();
                this.scene.switch('Level1Scene');
            }
        }, undefined, this);
    }

    protected restore() {
        this.playNextTrack();
    }

    protected createOrgans(x: number, y: number) {

        this.add.image(x, y, 'organ1')
            .setScale(0.4)
            .setOrigin(1, 1)
            .setDepth(-1);
    }

}
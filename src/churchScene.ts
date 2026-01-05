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

        const path = 'assets/sprites/PlatformerArtCompletePack/BuildingsExpansion/Tiles/';
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

        this.load.image('organ1', 'assets/sprites/organ3.png');
        this.load.audio('fugue1', 'assets/audio/fugueinbminor/FugueInBMinor.mp3');
    }

    create() {
        super.create();
        const h = this.cameras.main.height;

        this.cameras.main.setBackgroundColor('#6db3f2');
        this.physics.world.setBounds(0, 0, this.worldWidth, h + 200);
        this.cameras.main.setBounds(0, 0, this.worldWidth, h);
        const bottomY = h;
        this.createPlayer(250, bottomY - 400);

        this.createSign(600, bottomY - this.tile / 2, 0);
        this.createInterior(bottomY);
        this.createOrgans(1200, bottomY - this.tile / 2);
        this.createChurchDoor(300, bottomY - this.tile / 2);

        this.createStar(300, bottomY - 2 * this.tile, null, "Bimanual coordination")
        this.createStar(600, bottomY - 2 * this.tile, null, "Sight-reading")
        this.createStar(900, bottomY - 2 * this.tile, null, "Divided attention")
        this.createStar(1200, bottomY - 2 * this.tile, null, "Performance monitoring")

        this.playNextTrack();

        this.events.on('wake', () => {
            this.scoreText.setText(`Score: ${this.registry.get('score')}`);
            this.refreshLabelDisplay();
            this.playNextTrack();
        });
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


        this.add.image(300, y - 6 * this.tile, 'windowCheckered')
            .setScale(2)
            .setOrigin(0.5)
            .setDepth(-1);
        this.add.image(1100, y - 6 * this.tile, 'windowCheckered')
            .setScale(2)
            .setOrigin(0.5)
            .setDepth(-1);
    }


    protected createChurchDoor(x: number, y: number) {

        const dX = x;
        const doorSizeFactor = 1.5;
        const doorSize = this.tile * doorSizeFactor;


        const doorKnob = this.add.image(dX, y - 2 * this.tile, 'doorKnob')
            .setOrigin(0)
            .setScale(2)
            .setDepth(0);

        this.add.image(dX, doorKnob.y - doorKnob.displayHeight, 'doorTop')
            .setOrigin(0)
            .setScale(2)
            .setDepth(0);

        const doorTrigger = this.add.rectangle(
            dX - this.tile / 2,
            y - 3 * this.tile,
            doorSize * 2,
            doorSize * 2,
            0x000000,
            0
        ).setOrigin(0);

        this.physics.add.existing(doorTrigger, true);

        const enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        const upKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

        const goToLevel1 = () => {
            if (this.music) {
                this.music.stop();
                this.music.destroy();
            }
            this.scene.switch('Level1Scene');
        };

        doorTrigger
            .setInteractive({ useHandCursor: true })
            .setDepth(20);

        doorTrigger.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            pointer.event.stopPropagation();
            if (this.physics.overlap(this.player, doorTrigger)) {
                goToLevel1();
            }
        });

        this.physics.add.overlap(this.player, doorTrigger, () => {
            const eDown = enterKey && Phaser.Input.Keyboard.JustDown(enterKey);
            const upDown = upKey && Phaser.Input.Keyboard.JustDown(upKey);

            if (eDown || upDown) {
                goToLevel1();
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
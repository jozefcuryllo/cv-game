import 'phaser';
import { predefinedSpikes } from './level1_config.js';
import { BaseScene } from './baseScene.js';

interface PathPoint {
    x: number;
    y: number;
    anim: string;
    flipX: boolean;
}
export default class Level1Scene extends BaseScene {

    protected cat!: Phaser.Physics.Arcade.Sprite;
    protected catNameText!: Phaser.GameObjects.Text;

    protected ground!: Phaser.Physics.Arcade.StaticGroup;
    protected spikes!: Phaser.Physics.Arcade.StaticGroup;
    protected boxes!: Phaser.Physics.Arcade.StaticGroup;

    protected isRespawning = false;
    protected worldWidth = 25000;

    protected playerHistory: PathPoint[] = [];
    protected historyLength: number = 20;
    protected catSpawned: boolean = false;
    protected catArrivesAtX = 13000;

    protected playlist: string[] = ['track1', 'track2'];
    private spikePositions: number[] = [];

    protected milestones = [
        { year: "1993 - 2009", city: "Tarnow", description: "Early life", x: 200 },
        { year: "2009 - 2012", city: "Tarnow", description: "Highschool - computer science specialisation", x: 2000 },
        { year: "2012 - 2015", city: "Krakow (Cracow)", description: "Tadeusz Kosciuszko University - BSc (inzynier) - computer science", x: 3500 },
        { year: "2015 - 2017", city: "Wroclaw", description: "Wroclaw University of Science and Technology - MSc (magister inzynier) - computer science", x: 7000 },
        { year: "2016 - 2017", city: "Las Palmas de Gran Canaria (Spain)", description: "Erasmus+ programme - computer science", x: 9000 },
        { year: "2017 - 2025", city: "Work history", description: "Details are hidden, generalized or mixed according to the NDAs. \nThe priority of achievements is mixed. \nSome clients or employers are hidden.", x: 12000 },
        { year: "2017 - 2022", city: "Vexigo sp. z o.o.", description: "Katowice / Warsaw", x: 14000 },
        { year: "2017 - 2022", city: "Overlord - self-employed", description: "Olecko", x: 15000 },
        { year: "2022", city: "NASK - PIB", description: "Warsaw", x: 16000 },
        { year: "2024 - 2025", city: "AGH University of Technology", description: "Krakow (Cracow)", x: 17000 },
        { year: "2024 - 2025", city: "1000i sp. z o.o.", description: "Krakow (Cracow)", x: 18000 },

    ];

    constructor() {
        super({ key: 'Level1Scene' });
    }

    preload() {
        super.preload();

        const loadingText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'LOADING...', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.load.text('levelData', 'assets/level.txt');

        this.load.spritesheet('cat', '/assets/sprites/cat sprite/catspritesx4_no_bg.gif', { frameWidth: 84, frameHeight: 68 });

        this.load.image('grassMid', '/assets/sprites/Platformer Art Complete Pack/Base pack/Tiles/grassMid.png');
        this.load.image('grassCenter', '/assets/sprites/Platformer Art Complete Pack/Base pack/Tiles/grassCenter.png');
        this.load.image('spikes', '/assets/sprites/Platformer Art Complete Pack/Base pack/Items/spikes.png');
        this.load.image('bush', '/assets/sprites/Platformer Art Complete Pack/Base pack/Items/bush.png');
        this.load.image('plant', '/assets/sprites/Platformer Art Complete Pack/Base pack/Items/plant.png');

        this.load.image('box', '/assets/sprites/Platformer Art Complete Pack/Base pack/Tiles/box.png');
        this.load.image('boxAlt', '/assets/sprites/Platformer Art Complete Pack/Base pack/Tiles/boxAlt.png');

        this.load.image('cloud1', '/assets/sprites/Platformer Art Complete Pack/Base pack/Items/cloud1.png');
        this.load.image('cloud2', '/assets/sprites/Platformer Art Complete Pack/Base pack/Items/cloud2.png');
        this.load.image('cloud3', '/assets/sprites/Platformer Art Complete Pack/Base pack/Items/cloud3.png');

        const path = '/assets/sprites/Platformer Art Complete Pack/Buildings expansion/Tiles/';
        const files = [
            'doorKnob', 'doorOpen', 'doorOpenTop', 'doorTop',
            'houseBeige', 'houseBeigeAlt', 'houseBeigeAlt2',
            'houseBeigeBottomLeft', 'houseBeigeBottomMid', 'houseBeigeBottomRight',
            'houseBeigeMidLeft', 'houseBeigeMidRight',
            'houseBeigeTopLeft', 'houseBeigeTopMid', 'houseBeigeTopRight',
            'roofRedLeft', 'roofRedMid', 'roofRedRight',
            'roofRedTopLeft', 'roofRedTopMid', 'roofRedTopRight',
            'windowCheckered'
        ];

        files.forEach(file => {
            this.load.image(file, `${path}${file}.png`);
        });
        this.load.audio('track1', 'assets/audio/track1.mp3');
        this.load.audio('track2', 'assets/audio/track2.mp3');

        this.load.on('complete', function () {
            loadingText.destroy()
        });
    }

    create() {
        super.create();

        const h = this.cameras.main.height;

        this.cameras.main.setBackgroundColor('#6db3f2');
        this.physics.world.setBounds(0, 0, this.worldWidth, h + 200);
        this.cameras.main.setBounds(0, 0, this.worldWidth, h);

        this.createPlayer(150, h - 200);

        this.ground = this.physics.add.staticGroup();
        this.boxes = this.physics.add.staticGroup();
        this.spikes = this.physics.add.staticGroup();

        const rawData = this.cache.text.get('levelData');
        const lines = rawData
            .split('\n')
            .map((line: string) => line.replace('\r', ''))
            .filter((line: string) => !line.trim().startsWith('//'));
        const rowCount = lines.length;
        const colCount = Math.max(...lines.map((l: string) => l.length));

        let milestonesIndex = 0;
        let starsIndex = 0;
        let spikesIndex = 0;
        let infosIndex = 1;

        for (let colIndex = 0; colIndex < colCount; colIndex++) {
            for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                const char = lines[rowIndex][colIndex] || ' ';
                const x = colIndex * this.tile;
                const y = rowIndex * this.tile;
                const adjustedY = y + 2 * this.tile;

                if (char === 'M') {
                    this.createMilestone(x, milestonesIndex++);
                } else if (char === '*') {
                    this.createStar(x, adjustedY, starsIndex++);
                } else if (char === '#') {
                    this.createBox(x, adjustedY);
                } else if (char === '=') {
                    this.createGround(x, adjustedY);
                } else if (char === '^') {
                    const leftChar = colIndex > 0 ? lines[rowIndex][colIndex - 1] : ' ';

                    this.createSpike(x, adjustedY);

                    this.spikePositions.push(x);

                    if (leftChar !== '^') {

                        let groupLength = 1;
                        while (lines[rowIndex][colIndex + groupLength] === '^') {
                            groupLength++;
                        }

                        const offsetX = ((groupLength - 1) * this.tile) / 2;

                        this.createSpikeLabel(x + offsetX, adjustedY, spikesIndex++);
                    }
                }
                else if (char === 'C') {
                    this.createChurch(x, h - 2 * this.tile);
                }
                else if (char === 'S') {
                    this.createSign(x, h - this.tile, infosIndex++);
                }
            }
        }

        this.createTreesAndBushes();
        this.createClouds();

        this.cat = this.physics.add.sprite(100, h - 200, 'cat');
        this.cat.setFlipX(true);
        (this.cat.body as Phaser.Physics.Arcade.Body)?.setAllowGravity(false);
        this.cat.setScale(0);
        this.cat.setAlpha(0);
        this.cat.setDepth(101);

        this.catNameText = this.add.text(0, 0, 'Migotka!', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#FFD700',
            stroke: '#de8686ff',
            strokeThickness: 4
        });
        this.catNameText.setOrigin(0.5);
        this.catNameText.setVisible(false);

        this.createCatAnimations();

        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.player, this.boxes);
        this.physics.add.overlap(this.player, this.spikes, this.handleDeath, undefined, this);

        this.playNextTrack();

        this.events.on('wake', () => {
            this.scoreText.setText(`Score: ${this.registry.get('score')}`);
            this.refreshLabelDisplay();
            this.playNextTrack();
        });
    }

    protected createTreesAndBushes() {
        const h = this.cameras.main.height;
        const groundY = h - this.tile;

        const isNearSpike = (x: number, distance: number) => {
            return this.spikePositions.some(spikeX => Math.abs(x - spikeX) < distance);
        };

        for (let x = 0; x < this.worldWidth; x += 250) {
            const randomX = x + Phaser.Math.Between(-200, 200);

            if (isNearSpike(randomX, 7 * this.tile))
                continue;

            this.add.image(randomX, groundY, 'bush')
                .setOrigin(0.5, 1)
                .setDepth(-1)
                .setAlpha(0.8)
                .setScrollFactor(1)
                .setScale(Phaser.Math.Between(0.4, 4.0))
                .setFlipX(Math.random() > 0.5);
        }

        for (let x = 0; x < this.worldWidth; x += 150) {
            const randomX = x + Phaser.Math.Between(-100, 100);

            if (isNearSpike(randomX, 3 * this.tile))
                continue;

            this.add.image(randomX, groundY, 'plant')
                .setOrigin(0.5, 1)
                .setDepth(-1)
                .setAlpha(0.7)
                .setScrollFactor(1)
                .setScale(Phaser.Math.Between(0.9, 2.0))
                .setFlipX(Math.random() > 0.5);
        }

    }

    protected createClouds() {
        const cloudKeys = ['cloud1', 'cloud2', 'cloud3'];

        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(0, this.worldWidth);
            const y = Phaser.Math.Between(20, 250);
            const key = Phaser.Utils.Array.GetRandom(cloudKeys);
            const scrollFactor = Phaser.Math.FloatBetween(0.1, 0.4);

            this.add.image(x, y, key)
                .setScale(Phaser.Math.FloatBetween(0.5, 1.2))
                .setAlpha(Phaser.Math.FloatBetween(0.4, 0.7))
                .setDepth(-3)
                .setScrollFactor(scrollFactor);
        }
    }



    protected createChurch(x: number, y: number) {
        const tile = this.tile;
        const width = 7;
        const height = 5;
        const doorCol = 1;

        for (let col = -1; col <= width; col++) {
            const roofX = x + (col * tile);
            const roofBaseY = y - (height * tile);

            let topKey = 'roofRedTopMid';
            let midKey = 'roofRedMid';

            if (col === -1) {
                topKey = 'roofRedTopRight';
                midKey = 'roofRedRight';
            } else if (col === width) {
                topKey = 'roofRedTopLeft';
                midKey = 'roofRedLeft';

            }

            this.add.image(roofX, roofBaseY - tile, topKey).setOrigin(0).setDepth(-1);
            this.add.image(roofX, roofBaseY, midKey).setOrigin(0).setDepth(-1);
        }

        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const posX = x + (col * tile);
                const posY = y - ((height - 1 - row) * tile);
                let key = 'houseBeige';

                if (row === 0) {
                    if (col === 0) key = 'houseBeigeTopLeft';
                    else if (col === width - 1) key = 'houseBeigeTopRight';
                    else key = 'houseBeigeTopMid';
                } else if (row === height - 1) {
                    if (col === 0) key = 'houseBeigeBottomLeft';
                    else if (col === width - 1) key = 'houseBeigeBottomRight';
                    else key = 'houseBeigeBottomMid';
                } else {
                    if (col === 0) key = 'houseBeigeMidLeft';
                    else if (col === width - 1) key = 'houseBeigeMidRight';
                }

                this.add.image(posX, posY, key)
                    .setOrigin(0)
                    .setDepth(0);
            }
        }

        const dX = x + (doorCol * tile);


        this.add.image(dX + 2 * tile, y + tile / 2 - 2 * tile, 'doorTop')
            .setOrigin(0.5)
            .setScale(1.5, 1.5)
            .setDepth(0);
        this.add.image(dX + 2 * tile, y, 'doorKnob')
            .setOrigin(0.5)
            .setScale(1.5, 1.5)
            .setDepth(0);

        this.add.image(dX + 1, y - 3 * tile, 'windowCheckered')
            .setOrigin(0.5)
            .setDepth(0);

        this.add.image(dX + 2.5 * tile, y - 3 * tile, 'windowCheckered')
            .setOrigin(0.5)
            .setDepth(0);

        this.add.image(dX + 5 * tile, y - 3 * tile, 'windowCheckered')
            .setOrigin(0.5)
            .setDepth(0);


        const doorTrigger = this.add.rectangle(
            dX + 2 * tile,
            y,
            tile * 1,
            tile * 2,
            0x000000,
            0
        );
        this.physics.add.existing(doorTrigger, true);
        const enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        const upKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

        const goToChurch = () => {
            if (this.music) {
                this.music.stop();
                this.music.destroy();
            }
            this.scene.switch('ChurchScene');
        };

        doorTrigger
            .setInteractive({ useHandCursor: true })
            .setDepth(20);

        doorTrigger.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            pointer.event.stopPropagation();
            if (this.physics.overlap(this.player, doorTrigger)) {
                goToChurch();
            }
        });

        this.physics.add.overlap(this.player, doorTrigger, () => {
            const eDown = enterKey && Phaser.Input.Keyboard.JustDown(enterKey);
            const upDown = upKey && Phaser.Input.Keyboard.JustDown(upKey);

            if (eDown || upDown) {
                goToChurch();
            }
        }, undefined, this);
    }

    protected createMilestone(x: number, index: number) {
        const milestone = this.milestones[index];
        if (!milestone) return;
        this.add.text(
            x,
            100,
            `${milestone.year}\n${milestone.city}`,
            {
                fontSize: '40px',
                color: '#ffffff',
                align: 'center',
                fontStyle: 'bold'
            }
        )
            .setOrigin(0.5, 0)
            .setAlpha(0.3)
            .setDepth(-2);

        this.add.text(
            x,
            200,
            milestone.description,
            {
                fontSize: '20px',
                color: '#ffffff',
                align: 'center',
                fontStyle: 'bold'

            }
        )
            .setOrigin(0.5, 0)
            .setAlpha(0.3)
            .setDepth(-2);
    }

    protected createGround(x: number, y: number) {
        const ground = this.ground.create(x, y, 'grassMid')
            .setDisplaySize(this.tile, this.tile)
            .setScale(0.5)
            .setTint(0xcccccc)
            .setScale(1.0);
        ground.body.setSize(this.tile, this.tile);
        ground.refreshBody();
    }

    protected createBox(x: number, y: number) {
        this.boxes.create(x, y, "box")
            .setDisplaySize(this.tile, this.tile)
            .refreshBody();
    }

    protected createSpike(x: number, y: number) {
        const spike = this.spikes.create(x, y, 'spikes')
            .setDisplaySize(this.tile, this.tile);
        spike.body.setSize(this.tile, this.tile);
        spike.refreshBody();
    }

    protected createSpikeLabel(x: number, y: number, index: number) {
        const mySpike = predefinedSpikes[index];
        if (!mySpike) return;

        const label = this.add.text(x, y - 60,
            mySpike,
            {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 0,
                align: 'center'
            })
            .setOrigin(0.5)
            .setAlpha(0.9);

        this.tweens.add({
            targets: label,
            y: label.y - 15,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        this.tweens.add({
            targets: label,
            angle: { from: -3, to: 3 },
            duration: 500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

    }

    handleDeath() {
        super.handleDeath();

        this.playerHistory = [];
        this.registry.set('score', 0);

        this.isRespawning = false;
    }

    update() {
        super.update();

        this.playerHistory.unshift({
            x: this.player.x,
            y: this.player.y,
            anim: this.player.anims.currentAnim ? this.player.anims.currentAnim.key : 'cat_idle',
            flipX: this.player.flipX
        });

        if (this.playerHistory.length > this.historyLength) {

            let oldPosition = this.playerHistory.pop();
            if (oldPosition) {
                this.cat.setPosition(oldPosition.x, oldPosition.y + this.tile);
                this.cat.setFlipX(!oldPosition.flipX);
                this.matchCatAnimation(oldPosition.anim);
            }
        }

        if (!this.catSpawned && this.player.x >= this.catArrivesAtX) {
            this.catSpawned = true;

            this.tweens.add({
                targets: this.cat,
                alpha: 1,
                scale: 1.2,
                angle: 0,
                duration: 600,
                ease: 'Back.easeOut',
                onStart: () => {
                    this.cat.setTint(0x00ffff);


                    this.catNameText.x = this.cat.x;
                    this.catNameText.y = this.cat.y - this.cat.height / 2 - 40;
                    this.catNameText.setVisible(true);
                    this.catNameText.setAlpha(1);
                    this.catNameText.setScale(1);

                    this.tweens.add({
                        targets: this.catNameText,
                        y: this.cat.y - this.cat.height / 2 - 100,
                        alpha: 0,
                        scale: 1.2,
                        duration: 1500,
                        ease: 'Power1.easeOut',
                        onComplete: () => {
                            this.catNameText.setVisible(false);
                        }
                    });

                },
                onComplete: () => {
                    this.tweens.add({
                        targets: this.cat,
                        scale: 1,
                        duration: 200,
                        onComplete: () => {
                            this.cat.clearTint();
                        }
                    });
                }
            });
        }


    }

    createCatAnimations() {
        if (this.anims.exists('cat_idle')) return;
        this.anims.create({
            key: 'cat_idle',
            frames: this.anims.generateFrameNumbers('cat', { start: 0, end: 2 }),
            frameRate: 2,
            repeat: -1
        });

        this.anims.create({
            key: 'cat_walk',
            frames: this.anims.generateFrameNumbers('cat', { start: 6, end: 8 }),
            frameRate: 3,
            repeat: -1
        });

        this.anims.create({
            key: 'cat_jump',
            frames: [{ key: 'cat', frame: 7 }],
            frameRate: 3,
        });
    }
    protected matchCatAnimation(playerAnimKey: string) {
        if (playerAnimKey.includes('walk') || playerAnimKey.includes('run')) {
            this.cat.play('cat_walk', true);
        } else if (playerAnimKey.includes('jump') || playerAnimKey.includes('fall')) {
            this.cat.play('cat_jump', true);
        } else {
            this.cat.play('cat_idle', true);
        }
    }
}
import 'phaser';
import { predefinedSpikes } from './level1Config.js';
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
    private recruiter!: Phaser.Physics.Arcade.Sprite;
    private recruiterTriggered = false;
    private speechBubble!: Phaser.GameObjects.Container;

    protected isRespawning = false;
    protected worldWidth = 0;

    protected playerHistory: PathPoint[] = [];
    protected historyLength: number = 20;
    protected catSpawned: boolean = false;
    protected catArrivesAtX = 0;

    protected playlist: string[] = ['track1', 'track2'];
    private spikePositions: number[] = [];

    protected milestones = [
        { year: "1993 - 2009", title: "Tarnow", description: "Early life", x: 200 },
        { year: "2009 - 2012", title: "Tarnow", description: "Highschool\nComputer Science Profile", x: 2000 },
        { year: "2012 - 2016", title: "Cracow", description: "Cracow University of Technology\nBSc (inzynier) in Computer Science", x: 3500 },
        { year: "2016 - 2017", title: "Wroclaw", description: "Wroclaw University of Science and Technology\nMSc (magister inzynier) in Computer Science", x: 7000 },
        { year: "2016 - 2017", title: "Las Palmas de Gran Canaria (Spain)", description: "Erasmus+ University Exchange", x: 9000 },
        { year: "2017 - 2026", title: "Professional Career", description: "Details are hidden, generalized or mixed according to the NDAs.\nSome clients or employers are hidden.", x: 12000 },
        { year: "2017 - 2022", title: "Vexigo", description: "Fullstack Developer", x: 14000 },
        { year: "2017 - 2022", title: "Overlord", description: "Self-employed / Software Consulting", x: 15000 },
        { year: "2022", title: "NASK - PIB", description: "National Research Institute", x: 16000 },
        { year: "2024 - 2025", title: "AGH University of Technology", description: "Software Engineering", x: 17000 },
        { year: "2024 - 2025", title: "1000i", description: "Software Engineering", x: 18000 },
        { year: "2024 - 2026", title: "Thailand", description: "Digital Nomad / Remote Work" },
    ];

    constructor() {
        super({ key: 'Level1Scene' });
    }

    preload() {
        super.preload();

        this.load.text('levelData', 'assets/level.txt');

        this.load.spritesheet('cat', 'assets/sprites/catSprite/catspritesx4_no_bg.gif',
            { frameWidth: 90, frameHeight: 60 }
        );


        this.load.image('grassMid', 'assets/sprites/PlatformerArtCompletePack/BasePack/Tiles/grassMid.png');
        this.load.image('grassCenter', 'assets/sprites/PlatformerArtCompletePack/BasePack/Tiles/grassCenter.png');
        this.load.image('spikes', 'assets/sprites/PlatformerArtCompletePack/BasePack/Items/spikes.png');
        this.load.image('bush', 'assets/sprites/PlatformerArtCompletePack/BasePack/Items/bush.png');
        this.load.image('plant', 'assets/sprites/PlatformerArtCompletePack/BasePack/Items/plant.png');

        this.load.image('box', 'assets/sprites/PlatformerArtCompletePack/BasePack/Tiles/box.png');
        this.load.image('boxAlt', 'assets/sprites/PlatformerArtCompletePack/BasePack/Tiles/boxAlt.png');
        this.load.image('cloud1', 'assets/sprites/PlatformerArtCompletePack/BasePack/Items/cloud1.png');
        this.load.image('cloud2', 'assets/sprites/PlatformerArtCompletePack/BasePack/Items/cloud2.png');
        this.load.image('cloud3', 'assets/sprites/PlatformerArtCompletePack/BasePack/Items/cloud3.png');

        const path = 'assets/sprites/PlatformerArtCompletePack/BuildingsExpansion/Tiles/';
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

        this.load.spritesheet('recruiter', 'assets/sprites/ddc_graphics/walk_right.png', {
            frameWidth: 32,
            frameHeight: 60
        });
        this.load.spritesheet('recruiter-idle', 'assets/sprites/ddc_graphics/stand_right.png', {
            frameWidth: 32,
            frameHeight: 60
        });

        this.load.audio('track1', 'assets/audio/track1.mp3');
        this.load.audio('track2', 'assets/audio/track2.mp3');
    }

    create() {
        super.create();

        const h = this.cameras.main.height;

        this.createPlayer(300, h - 400);

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
        this.tile = h / rowCount;
        let milestonesIndex = 0;
        let starsIndex = 0;
        let spikesIndex = 0;
        let infosIndex = 1;
        let thoughtsIndex = 0;

        for (let colIndex = 0; colIndex < colCount; colIndex++) {
            for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                const char = lines[rowIndex][colIndex] || ' ';
                const x = colIndex * this.tile;
                const y = rowIndex * this.tile;

                if (char === 'M') {
                    this.createMilestone(x, milestonesIndex++);
                } else if (char === '*') {
                    this.createStar(x, y, starsIndex++);
                } else if (char === '#') {
                    this.createBox(x, y);
                } else if (char === 'T') {
                    this.createThought(x, thoughtsIndex++);
                } else if (char === '=') {
                    this.createGround(x, y);
                } else if (char === '^') {
                    const leftChar = colIndex > 0 ? lines[rowIndex][colIndex - 1] : ' ';

                    this.createSpike(x, y);

                    this.spikePositions.push(x);

                    if (leftChar !== '^') {

                        let groupLength = 1;
                        while (lines[rowIndex][colIndex + groupLength] === '^') {
                            groupLength++;
                        }

                        const offsetX = ((groupLength - 1) * this.tile) / 2;

                        this.createSpikeLabel(x + offsetX, y, spikesIndex++);
                    }
                }
                else if (char === 'C') {
                    this.createChurch(x, h - 2 * this.tile);
                }
                else if (char === 'S') {
                    this.createSign(x, h - this.tile, infosIndex++);
                }
                else if (char === 'R') {
                    this.createRecruiter(x, h - 4 * this.tile);
                }
                else if (char === 'F') {
                    this.catArrivesAtX = x;
                    this.createCat(x, h - this.tile);
                }
                this.worldWidth = x;
            }
        }

        this.cameras.main.setBackgroundColor('#6db3f2');
        this.physics.world.setBounds(0, 0, this.worldWidth, h + 200, true, true, false);
        this.cameras.main.setBounds(0, 0, this.worldWidth, h);

        this.createTreesAndBushes();
        this.createClouds();

        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.player, this.boxes);
        this.physics.add.collider(this.recruiter, this.ground);
        this.physics.add.overlap(this.player, this.spikes, this.handleDeath, undefined, this);

        this.playNextTrack();

        this.events.on('wake', () => {
            this.scoreText.setText(`Score: ${this.registry.get('score')}`);
            this.refreshLabelDisplay();
            this.playNextTrack();
        });
    }

    protected createCat(x: number, y: number) {
        this.cat = this.physics.add.sprite(x, y, 'cat')
            .setOrigin(0, 0)
            .setSize(90, 60)
            .setFlipX(true)
            .setScale(0.0)
            .setAlpha(0.0)
            .setDepth(101);

        (this.cat.body as Phaser.Physics.Arcade.Body)?.setAllowGravity(false);

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

            this.add.image(roofX, roofBaseY - tile, topKey)
                .setOrigin(0)
                .setDisplaySize(tile, tile)
                .setDepth(-1);

            this.add.image(roofX, roofBaseY, midKey)
                .setOrigin(0)
                .setDisplaySize(tile, tile)
                .setDepth(-1);
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
                    .setDisplaySize(tile, tile)
                    .setDepth(0);
            }
        }

        const dX = x + (doorCol * tile);

        const doorSizeFactor = 1.5;
        const doorSize = this.tile * doorSizeFactor;


        const doorKnob = this.add.image(dX + 2 * tile, y - this.tile * 0.5, 'doorKnob')
            .setOrigin(0)
            .setDisplaySize(doorSize, doorSize)
            .setDepth(0);

        this.add.image(dX + 2 * tile, doorKnob.y - doorKnob.displayHeight, 'doorTop')
            .setOrigin(0)
            .setDisplaySize(doorSize, doorSize)
            .setDepth(0);

        const windowPositions = [0, 4];
        windowPositions.forEach(posOffset => {
            this.add.image(dX + posOffset * tile, y - 3 * tile, 'windowCheckered')
                .setOrigin(0)
                .setDisplaySize(tile, tile)
                .setDepth(0);
        });

        const doorTrigger = this.add.rectangle(
            dX + 2 * tile,
            y - this.tile,
            doorSize,
            doorSize * 2,
            0x000000,
            0
        ).setOrigin(0);

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

        doorTrigger.setInteractive({ useHandCursor: true }).setDepth(20);

        doorTrigger.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            pointer.event.stopPropagation();
            if (this.physics.overlap(this.player, doorTrigger)) {
                goToChurch();
            }
        });

        this.physics.add.overlap(this.player, doorTrigger, () => {
            const eDown = enterKey && Phaser.Input.Keyboard.JustDown(enterKey);
            const upDown = upKey && Phaser.Input.Keyboard.JustDown(upKey);
            if (eDown || upDown) goToChurch();
        }, undefined, this);
    }

    protected createMilestone(x: number, index: number) {
        const milestone = this.milestones[index];
        if (!milestone) return;
        this.add.text(
            x,
            100,
            `${milestone.year}\n${milestone.title}`,
            {
                fontSize: '40px',
                color: '#ffffff',
                align: 'center',
                fontStyle: 'bold'
            }
        )
            .setOrigin(0.5, 0)
            .setAlpha(0.4)
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
            .setSize(this.tile, this.tile)
            .setOrigin(0, 0);
        ground.refreshBody();
    }

    protected createBox(x: number, y: number) {
        this.boxes.create(x, y, "box")
            .setDisplaySize(this.tile, this.tile)
            .setOrigin(0, 0)
            .refreshBody();
    }

    protected createSpike(x: number, y: number) {
        const spike = this.spikes.create(x, y, 'spikes')
            .setDisplaySize(this.tile, this.tile)
            .setOrigin(0, 0);
        spike.body.setSize(this.tile, this.tile);
        spike.refreshBody();
    }

    protected createSpikeLabel(x: number, y: number, index: number) {
        const mySpike = predefinedSpikes[index];
        if (!mySpike) return;

        const labelX = x + (this.tile / 2);

        const label = this.add.text(labelX, y - 60,
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

                this.cat
                    .setPosition(oldPosition.x, oldPosition.y + this.player.displayHeight)
                    .setFlipX(!oldPosition.flipX)
                    .setOrigin(0, 1);


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


        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.recruiter.x, this.recruiter.y);

        if (!this.recruiterTriggered && distance < 800) {
            this.triggerRecruiterEvent();
        }
    }

    createCatAnimations() {
        if (this.anims.exists('cat_idle')) return;
        this.anims.create({
            key: 'cat_idle',
            frames: this.anims.generateFrameNumbers('cat', { start: 0, end: 3 }),
            frameRate: 1,
            repeat: -1,
        });

        this.anims.create({
            key: 'cat_walk',
            frames: this.anims.generateFrameNumbers('cat', { start: 6, end: 10 }),
            frameRate: 3,
            repeat: -1
        });

        this.anims.create({
            key: 'cat_jump',
            frames: [{ key: 'cat', frame: 12 }],
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

    protected createRecruiter(x: number, y: number) {
        this.anims.create({
            key: 'recruiter-walk',
            frames: this.anims.generateFrameNumbers('recruiter', { frames: [0, 1, 3, 2, 3] }),
            frameRate: 4,
            repeat: -1
        });

        this.anims.create({
            key: 'recruiter-idle',
            frames: this.anims.generateFrameNumbers('recruiter-idle', { frames: [0] }),
            frameRate: 1
        });


        this.recruiter = this.physics.add.sprite(x, y, 'recruiter')
            .setScale(3.5);

        (this.recruiter.body as Phaser.Physics.Arcade.Body)!.setAllowGravity(true);

        this.physics.add.collider(this.recruiter, this.ground);
    }

    protected triggerRecruiterEvent() {
        this.recruiterTriggered = true;
        this.playerCanMove = false;

        this.player.setVelocity(0, 0);
        this.player.setAcceleration(0, 0);

        if (this.player.body) {
            (this.player.body as Phaser.Physics.Arcade.Body).allowGravity = false;
        }

        if (this.input.keyboard) {
            this.input.keyboard.enabled = false;
        }

        if (this.touchState) {
            const state = this.touchState;
            Object.keys(state).forEach(key => state[key] = false);
        }

        this.player.play('idle', true);

        const targetX = this.player.x + 300;

        this.recruiter.play('recruiter-walk', true);

        this.tweens.add({
            targets: this.recruiter,
            x: targetX,
            duration: 2000,
            ease: 'Power1',
            onComplete: () => {
                this.recruiter.stop();
                this.recruiter.setTexture('recruiter-idle')
                this.recruiter.play('recruiter-idle');
                this.showSpeechBubble();
            }
        });
    }

    protected showSpeechBubble() {
        const bx = this.recruiter.x - 90;
        const by = this.recruiter.y - 120;

        const bubble = this.add.graphics();
        bubble.fillStyle(0xffffff, 1);
        bubble.fillRoundedRect(0, 0, 240, 60, 10);
        bubble.fillTriangle(20, 60, 40, 60, 40, 80);

        const text = this.add.text(110, 30, " I want to hire you!", {
            fontSize: '18px',
            color: '#000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.speechBubble = this.add.container(bx, by, [bubble, text])
            .setAlpha(0);

        this.tweens.add({
            targets: this.speechBubble,
            alpha: 1,
            y: by - 70,
            duration: 2000,
            onComplete: () => {
                this.time.delayedCall(2000, () => {
                    if (this.music) {
                        this.music.stop();
                        this.music.destroy();
                    }

                    this.registry.set('score', 0);
                    this.registry.set('labels', []);
                    this.historyLength = 0;
                    this.playerHistory = [];

                    this.scene.stop('ChurchScene');
                    this.scene.stop();

                    this.scene.start('FinalScene');
                });

            }
        });
    }
}
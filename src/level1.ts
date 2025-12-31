import 'phaser';
interface PathPoint {
    x: number;
    y: number;
    anim: string;
    flipX: boolean;
}
export default class Level1Scene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cat!: Phaser.Physics.Arcade.Sprite;
    private catNameText!: Phaser.GameObjects.Text;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: any;

    private ground!: Phaser.Physics.Arcade.StaticGroup;
    private spikes!: Phaser.Physics.Arcade.StaticGroup;
    private stars!: Phaser.Physics.Arcade.Group;
    private boxes!: Phaser.Physics.Arcade.StaticGroup;

    private score = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private isRespawning = false;
    private worldWidth = 20000;

    private playerHistory: PathPoint[] = [];
    private historyLength: number = 20;
    private catSpawned: boolean = false;
    private catArrivesAtX = 13000;

    private recentLabels: Phaser.GameObjects.Text[] = [];
    private maxLabels = 5;

    private milestones = [
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
        this.load.spritesheet('player', '/assets/sprites/maleBase/full/advnt_full.png', { frameWidth: 32, frameHeight: 64 });
        this.load.spritesheet('cat', '/assets/sprites/cat sprite/catspritesx4_no_bg.gif', { frameWidth: 84, frameHeight: 68 });

        this.load.image('grassMid', '/assets/sprites/Platformer Art Complete Pack/Base pack/Tiles/grassMid.png');
        this.load.image('grassCenter', '/assets/sprites/Platformer Art Complete Pack/Base pack/Tiles/grassCenter.png');
        this.load.image('spikes', '/assets/sprites/Platformer Art Complete Pack/Base pack/Items/spikes.png');
        this.load.image('bush', '/assets/sprites/Platformer Art Complete Pack/Base pack/Items/bush.png');
        this.load.image('box', '/assets/sprites/Platformer Art Complete Pack/Base pack/Tiles/box.png');
        this.load.image('boxAlt', '/assets/sprites/Platformer Art Complete Pack/Base pack/Tiles/boxAlt.png');
        this.load.image('star', '/assets/sprites/Platformer Art Complete Pack/Base pack/Items/star.png');

    }

    create() {
        const h = this.cameras.main.height;
        const tile = 70;



        this.isRespawning = false;
        this.cameras.main.setBackgroundColor('#6db3f2');
        this.physics.world.setBounds(0, 0, this.worldWidth, h + 200);
        this.cameras.main.setBounds(0, 0, this.worldWidth, h);

        this.milestones.forEach(m => {
            this.add.text(
                m.x,
                100,
                `${m.year}\n${m.city}`,
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
                m.x,
                200,
                m.description,
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
        });

        for (let x = 0; x < this.worldWidth; x += 450) {
            this.add.image(x, h - tile - 35, 'bush').setDepth(-1).setAlpha(0.8).setScrollFactor(0.95);
        }

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D,SPACE');

        this.ground = this.physics.add.staticGroup();
        this.spikes = this.physics.add.staticGroup();

        this.boxes = this.physics.add.staticGroup();
        const boxXs = [800, 1600, 2400, 3200, 4200, 5200, 6200, 7200];
        boxXs.forEach((bx, i) => {
            const key = i % 2 === 0 ? 'box' : 'boxAlt';
            this.boxes.create(bx, h - tile - tile / 2, key).setDisplaySize(tile, tile).refreshBody();
        });


        const gaps = [{ start: 2500, width: 2 }, { start: 5000, width: 3 }];
        for (let x = 0; x < this.worldWidth; x += tile) {
            if (gaps.some(g => x >= g.start && x < g.start + g.width * tile)) {
                this.spikes.create(x + tile / 2, h - tile / 2, 'spikes').setDisplaySize(tile, tile).refreshBody();
                continue;
            }
            this.ground.create(x + tile / 2, h - tile / 2, 'grassMid').setDisplaySize(tile, tile).refreshBody();
        }


        this.stars = this.physics.add.group({ allowGravity: false });

        class MyStar {
            dx: number;
            label: string;

            constructor(label: string, dx: number = 200) {
                this.dx = dx;
                this.label = label;
            }
        };

        let prevStarX = 0;
        [
            new MyStar("Basics of DOS", 800),
            new MyStar("Basics of Pascal"),
            new MyStar("Basics of Assembler - 13h"),
            new MyStar("Basics of electronics"),
            // ---
            new MyStar("Basics of C++", 800),
            new MyStar("Basics of algorithms"),
            new MyStar("Basics of networks"),
            new MyStar("HTML & CSS"),
            new MyStar("Basics of PHP"),
            // ---
            new MyStar("Data structures and algorithms", 800),
            new MyStar("C"),
            new MyStar("C++"),
            new MyStar("C#"),
            new MyStar("Java"),
            new MyStar("Embedded programming"),
            new MyStar("English C1"),
            new MyStar("Android"),
            new MyStar("PHP"),
            new MyStar("Basics of AI"),
            new MyStar("Linux"),
            new MyStar("Databases"),
            // ---
            new MyStar("Advanced PHP", 500),
            new MyStar("Advanced JavaScript",),
            new MyStar("Docker"),
            new MyStar("NodeJS"),
            new MyStar("MongoDB"),
            new MyStar("Spanish A2+"),
            // ---
            new MyStar("Advanced UML & OCL", 500),
            new MyStar("AI"),
            new MyStar("Parallel computing"),
            new MyStar("Testing"),
            new MyStar("Language processing"),
            // ---
            new MyStar("Advanced PHP", 1000),
            new MyStar("Advanced MySQL"),
            new MyStar("Big Data"),
            new MyStar("Advanced Linux"),
            new MyStar("Python"),
            new MyStar("Queues"),
            // ---
            new MyStar("Advanced PHP"),
            new MyStar("Advanced SQL"),
            new MyStar("Advanced Python"),
            new MyStar("Advanced Docker"),



        ].forEach((myStar, i) => {
            prevStarX += myStar.dx;
            const star = this.stars.create(prevStarX, h - tile - 120, 'star').setScale(1.5);
            const label = this.add.text(prevStarX, h - tile - 170, myStar.label, { fontSize: '18px', color: '#fff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setAlpha(0.5);
            star.setData('label', label);
        });

        this.player = this.physics.add.sprite(150, h - 200, 'player').setScale(3);
        this.player.setCollideWorldBounds(true);
        this.player.body.setGravityY(1200);
        this.player.setDragX(1500);
        this.player.setMaxVelocity(400, 1000);


        this.cat = this.physics.add.sprite(100, h - 200, 'cat');
        this.cat.setFlipX(true);
        this.cat.body.setAllowGravity(false);
        this.cat.setScale(0);
        this.cat.setAlpha(0);

        this.catNameText = this.add.text(0, 0, 'Migotka!', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.catNameText.setOrigin(0.5);
        this.catNameText.setVisible(false);


        this.createAnimations();
        this.createCatAnimations();

        this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '20px', color: '#FFF' }).setScrollFactor(0);
        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.player, this.boxes);
        this.physics.add.overlap(this.player, this.stars, this.collectstar, undefined, this);
        this.physics.add.overlap(this.player, this.spikes, this.handleDeath, undefined, this);

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    collectstar(player: any, star: Phaser.Physics.Arcade.Sprite): void {
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
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    private addLabelToList(content: string): void {
        const startX = 20;
        const startY = 80;
        const spacing = 22;

        const newEntry = this.add.text(startX, startY, content, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff'
        });
        newEntry.setAlpha(0.7);
        newEntry.setScrollFactor(0);

        this.recentLabels.unshift(newEntry);

        this.recentLabels.forEach((label, index) => {
            if (index > 0) {
                this.tweens.add({
                    targets: label,
                    y: startY + (index * spacing),
                    duration: 150
                });
            }
        });

        if (this.recentLabels.length > this.maxLabels) {
            const oldLabel = this.recentLabels.pop();
            oldLabel?.destroy();
        }
    }

    handleDeath() {
        if (this.isRespawning) return;
        this.isRespawning = true;

        this.playerHistory = [];

        this.player.setTint(0xff0000);
        this.time.delayedCall(800, () => this.scene.restart());
    }

    update() {
        if (this.isRespawning) return;



        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const accel = 1000;

        if (this.player.y > this.cameras.main.height + 50) {
            this.handleDeath();
            return;
        }

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

        this.playerHistory.unshift({
            x: this.player.x,
            y: this.player.y,
            anim: this.player.anims.currentAnim ? this.player.anims.currentAnim.key : 'cat_idle',
            flipX: this.player.flipX
        });

        if (this.playerHistory.length > this.historyLength) {

            let oldPosition = this.playerHistory.pop();
            if (oldPosition) {
                this.cat.setPosition(oldPosition.x, oldPosition.y + 70);
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

        this.playAnimations(body, isCrouching);
    }

    playAnimations(body: Phaser.Physics.Arcade.Body, isCrouching: boolean) {
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



    createAnimations() {
        if (this.anims.exists('idle')) return;
        this.anims.create({ key: 'idle', frames: [{ key: 'player', frame: 0 }], frameRate: 1 });
        this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('player', { start: 1, end: 6 }), frameRate: 12, repeat: -1 });
        this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('player', { start: 17, end: 19 }), frameRate: 10 });
        this.anims.create({ key: 'crouch', frames: this.anims.generateFrameNumbers('player', { start: 7, end: 9 }), frameRate: 6, repeat: -1 });


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
    private matchCatAnimation(playerAnimKey: string) {
        if (playerAnimKey.includes('walk') || playerAnimKey.includes('run')) {
            this.cat.play('cat_walk', true);
        } else if (playerAnimKey.includes('jump') || playerAnimKey.includes('fall')) {
            this.cat.play('cat_jump', true);
        } else {
            this.cat.play('cat_idle', true);
        }
    }
}
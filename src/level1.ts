import 'phaser';

export default class Level1Scene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: any;

    private ground!: Phaser.Physics.Arcade.StaticGroup;
    private spikes!: Phaser.Physics.Arcade.StaticGroup;
    private coins!: Phaser.Physics.Arcade.Group;
    private boxes!: Phaser.Physics.Arcade.StaticGroup;

    private score = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private isRespawning = false;
    private worldWidth = 9000;

    private lifeEvents = [
        "life event..."
    ];

    private milestones = [
        { year: "2009 - 2012", city: "Tarnow", description: "Highschool - computer science specialisation", x: 1000 },
        { year: "2012 - 2015", city: "Krakow (Cracow)", description: "Tadeusz Kosciuszko University - BSc (inzynier) - computer science", x: 2500 },
        { year: "2015 - 2017", city: "Wroclaw", description: "Wroclaw University of Science and Technology - MSc (magister inzynier) - computer science", x: 4000 },
        { year: "2016 - 2017", city: "Las Palmas de Gran Canaria (Spain)", description: "Erasmus+ programme - computer science", x: 6000 },
        { year: "2017 - 2022", city: "Katowice / Warsaw", description: "Vexigo sp. z o.o. \nself-employed", x: 8000 },

    ];

    constructor() {
        super({ key: 'Level1Scene' });
    }

    preload() {
        this.load.spritesheet('player', '/assets/sprites/maleBase/full/advnt_full.png', { frameWidth: 32, frameHeight: 64 });
        this.load.spritesheet('coin', '/assets/sprites/coin_gold.png', { frameWidth: 32, frameHeight: 32 });
        this.load.image('grassMid', '/assets/sprites/Platformer Art Complete Pack/Base pack/Tiles/grassMid.png');
        this.load.image('grassCenter', '/assets/sprites/Platformer Art Complete Pack/Base pack/Tiles/grassCenter.png');
        this.load.image('spikes', '/assets/sprites/Platformer Art Complete Pack/Base pack/Items/spikes.png');
        this.load.image('bush', '/assets/sprites/Platformer Art Complete Pack/Base pack/Items/bush.png');
        this.load.image('box', '/assets/sprites/Platformer Art Complete Pack/Base pack/Tiles/box.png');
        this.load.image('boxAlt', '/assets/sprites/Platformer Art Complete Pack/Base pack/Tiles/boxAlt.png');
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

        // Teren
        const gaps = [{ start: 2500, width: 2 }, { start: 5000, width: 3 }];
        for (let x = 0; x < this.worldWidth; x += tile) {
            if (gaps.some(g => x >= g.start && x < g.start + g.width * tile)) {
                this.spikes.create(x + tile / 2, h - tile / 2, 'spikes').setDisplaySize(tile, tile).refreshBody();
                continue;
            }
            this.ground.create(x + tile / 2, h - tile / 2, 'grassMid').setDisplaySize(tile, tile).refreshBody();
        }

        // Monety
        this.coins = this.physics.add.group({ allowGravity: false });
        if (!this.anims.exists('spin')) {
            this.anims.create({ key: 'spin', frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
        }

        for (let i = 0; i < 20; i++) {
            const x = 600 + (i * 400);
            const coin = this.coins.create(x, h - tile - 120, 'coin').setScale(1.5);
            coin.anims.play('spin');
            const label = this.add.text(x, h - tile - 170, this.lifeEvents[i % this.lifeEvents.length], { fontSize: '14px', color: '#fff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setAlpha(0.7);
            coin.setData('label', label);
        }

        // --- GRACZ ---
        this.player = this.physics.add.sprite(150, h - 200, 'player').setScale(3);
        this.player.setCollideWorldBounds(true);
        this.player.body.setGravityY(1200);
        this.player.setDragX(1500);
        this.player.setMaxVelocity(400, 1000);

        this.createAnimations();

        this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '20px', color: '#FFF' }).setScrollFactor(0);
        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.player, this.boxes);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, undefined, this);
        this.physics.add.overlap(this.player, this.spikes, this.handleDeath, undefined, this);

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    collectCoin(player: any, coin: any) {
        const label = coin.getData('label');
        if (label) this.tweens.add({ targets: label, y: label.y - 40, alpha: 0, duration: 600, onComplete: () => label.destroy() });
        coin.destroy();
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
    }

    handleDeath() {
        if (this.isRespawning) return;
        this.isRespawning = true;
        this.player.setTint(0xff0000);
        this.time.delayedCall(800, () => this.scene.restart());
    }

    update() {
        if (this.isRespawning) return;
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const accel = 1000;

        if (this.player.y > this.cameras.main.height + 50) this.handleDeath();

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

        const jumpJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.wasd.W) ||
            Phaser.Input.Keyboard.JustDown(this.wasd.SPACE);

        if (jumpJustPressed && body.blocked.down) {
            body.setVelocityY(-700);
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
}
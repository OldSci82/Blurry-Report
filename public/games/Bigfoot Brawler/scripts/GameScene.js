// scripts/GameScene.js
import { config, gameState } from "../game.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super({
      key: "GameScene",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false, // Enable for debugging if needed
        },
      },
    });

    this.player = null;
    this.playerSprite = null;
    this.cursors = null;
    this.keyA = null;
    this.keyS = null;
    this.keyD = null;
    this.keyW = null;
    this.keyZ = null;
    this.keyX = null;
    this.keyESC = null;

    this.playerSpeed = 150;
    this.playerFacingRight = true;

    this.canAttack = true;
    this.attackCooldown = 500;
    this.attackSprite = null;
    this.attackHitbox = null;

    this.enemies = null;
    this.boss = null;
    this.bossHealth = 100;
    this.bossSpawned = false;
    this.bossText = null;
    this.bossHealthBar = null;
    this.bossHealthBarBg = null;
    this.bossDefeated = false;

    this.portal = null;
    this.portalText = null;
    this.portalCollider = null;

    this.levelText = null;
    this.healthText = null;
    this.scoreText = null;

    this.walkAnimKey = null;
    this.punchKey = null;
    this.kickKey = null;
    this.walkSheetKey = null;

    this.isPaused = false;
    this.pauseMenu = null;

    this.worldLocked = false; // Prevents world extension after boss spawn
  }

  preload() {}

  //===================================================================
  //===================CREATE GAME WORLD===============================
  //===================================================================
  create() {
    // Reset state
    this.bossDefeated = false;
    this.bossSpawned = false;
    this.projectiles = []; // Initialize projectiles array
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.input.keyboard.resetKeys();
    this.physics.world.overlaps = [];

    // Validate selected fighter
    if (!["black", "red"].includes(gameState.selectedFighter)) {
      console.warn("Invalid fighter selected, defaulting to black");
      gameState.selectedFighter = "black";
    }

    this.walkSheetKey = `${gameState.selectedFighter}_fighter_walk`;
    this.punchKey = `${gameState.selectedFighter}_fighter_punch`;
    this.kickKey = `${gameState.selectedFighter}_fighter_kick`;
    this.walkAnimKey = `walk_${gameState.selectedFighter}`;

    // Set world bounds
    this.worldWidth = 3000;
    this.worldHeight = config.height;
    this.maxWorldWidth = 3000;
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

    // Background setup
    const bgImage = this.textures.get("background_level1").getSourceImage();
    const bgScale = config.height / bgImage.height;
    this.bgScale = bgScale;
    this.background = this.add
      .tileSprite(
        0,
        config.height - bgImage.height * bgScale,
        this.worldWidth,
        bgImage.height * bgScale,
        "background_level1"
      )
      .setOrigin(0, 0)
      .setScale(bgScale)
      .setScrollFactor(0)
      .setDepth(-10);

    // Player setup
    this.player = this.add.rectangle(
      150,
      config.height - 100,
      40,
      100,
      0x00ff00,
      1
    );
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setBoundsRectangle(
      new Phaser.Geom.Rectangle(0, 0, this.worldWidth, this.worldHeight)
    );
    this.player.canTakeDamage = true;

    this.playerSprite = this.add
      .sprite(this.player.x, this.player.y, this.walkSheetKey)
      .setScale(1)
      .play(`idle_${gameState.selectedFighter}`);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setFollowOffset(-config.width / 4, 0);

    // Input setup
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyESC = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );
    this.keyZ.on("down", this.handlePunch, this);
    this.keyX.on("down", this.handleKick, this);
    this.keyESC.on("down", this.togglePause, this);

    // HUD setup
    this.setupHUD();

    // Enemy setup
    this.enemies = this.physics.add.group();
    const numEnemies = 3 + gameState.currentLevel;
    for (let i = 0; i < numEnemies; i++) {
      const enemy = this.add
        .sprite(
          Phaser.Math.Between(config.width / 2, config.width - 50),
          Phaser.Math.Between(config.height - 200, config.height - 50),
          "enemy_zombie1_walk"
        )
        .setScale(1)
        .play("walk_zombie1");
      this.physics.add.existing(enemy);
      enemy.body
        .setSize(20, 30)
        .setOffset((enemy.width - 20) / 2, enemy.height - 30);
      enemy.body.setCollideWorldBounds(true);
      enemy.body.setImmovable(true);
      enemy.health = 1;
      enemy.isHitByAttack = false;
      enemy.type = i % 2 === 0 ? "fast" : "standard";
      enemy.hitboxVisual = this.add
        .rectangle(
          enemy.x + (enemy.width - 20) / 2,
          enemy.y + (enemy.height - 30),
          20,
          30,
          0xff0000,
          0.5
        )
        .setOrigin(1.5, 3)
        .setDepth(5);
      this.enemies.add(enemy);
    }

    // Boss animations
    this.anims.create({
      key: "zombie_boss_idle",
      frames: [{ key: "enemy_zombie_boss_attack1", frame: 0 }],
      frameRate: 1,
      repeat: -1,
    });
    this.anims.create({
      key: "zombie_boss_walk",
      frames: this.anims.generateFrameNumbers("enemy_zombie_boss_walk", {
        start: 0,
        end: 5,
      }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "enemy_zombie_boss_attack1",
      frames: this.anims.generateFrameNumbers("enemy_zombie_boss_attack1", {
        start: 0,
        end: 6,
      }),
      frameRate: 10,
      repeat: 0,
    });

    // Boss projectiles group
    this.bossProjectiles = this.physics.add.group({
      allowGravity: false,
      collideWorldBounds: false,
      immovable: false,
    });
    this.physics.add.overlap(
      this.player,
      this.bossProjectiles,
      (player, bone) => {
        this.handlePlayerTakeDamage(player, this.boss);
        bone.destroy();
      },
      null,
      this
    );

    // Collision setup
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerTakeDamage,
      null,
      this
    );

    // Move boss animation listener to spawnBoss
    this.events.on("shutdown", this.shutdown, this);

    // Check initial win condition
    this.checkWinCondition();
  }

  //===================================================================
  //===================END LEVEL BOSS SPAWN============================
  //===================================================================
  spawnBoss() {
    if (this.bossSpawned || this.bossDefeated) {
      console.log(
        "spawnBoss: Skipped - bossSpawned:",
        this.bossSpawned,
        "bossDefeated:",
        this.bossDefeated
      );
      return;
    }
    console.log(
      "spawnBoss: Spawning boss at",
      this.worldWidth - 400,
      config.height - 100
    );
    this.boss = this.physics.add
      .sprite(this.worldWidth - 400, config.height - 100, "zombie_boss_walk")
      .setScale(0.6)
      .setDepth(1);
    this.boss.body.setSize(60, 80).setOffset(70, 80);
    this.boss.body.setImmovable(true);
    this.boss.body.setCollideWorldBounds(true);
    this.boss.isHitByAttack = false;
    this.boss.isEngaging = false;
    this.boss.lastPatrolFlip = 0;
    this.boss.patrolTargetX = this.worldWidth - 300; // Center of patrol range (2500 + 2900) / 2
    this.boss.play("zombie_boss_walk");
    this.boss.on("animationcomplete", (anim) => {
      if (anim.key === "enemy_zombie_boss_attack1") {
        this.boss.play("zombie_boss_idle");
      }
    });
    this.bossPatrolMinX = this.worldWidth - 500; // 2500
    this.bossPatrolMaxX = this.worldWidth - 100; // 2900
    this.bossPatrolDirection = -1;
    this.bossDetectionRange = 500;
    this.bossAttackCooldown = 2000;
    this.bossLastAttack = 0;

    // Boss hitbox visual
    this.bossHitboxVisual = this.add
      .rectangle(
        this.boss.x,
        this.boss.y,
        this.boss.body.width,
        this.boss.body.height,
        0xff00ff,
        0.3
      )
      .setOrigin(0.5)
      .setDepth(10);

    this.bossText = this.add
      .text(this.boss.x, this.boss.y - 80, "BOSS!", {
        fontFamily: "Press Start 2P",
        fontSize: "24px",
        fill: "#FFF",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.physics.add.overlap(
      this.player,
      this.boss,
      this.handlePlayerTakeDamage,
      null,
      this
    );

    // Boss health bar
    this.bossHealthBarBg = this.add
      .rectangle(this.boss.x, this.boss.y - 100, 100, 10, 0x333333)
      .setOrigin(0.5)
      .setDepth(10);
    this.bossHealthBar = this.add
      .rectangle(this.boss.x, this.boss.y - 100, 100, 10, 0xff0000)
      .setOrigin(0.5)
      .setDepth(11);

    this.bossHealth = 100;
    this.bossSpawned = true;
    this.bossDefeated = false;
    this.worldLocked = true;
  }

  //===================================================================
  //===================PLAYER TAKES DAMAGE=============================
  //===================================================================
  handlePlayerTakeDamage(player, source) {
    if (!player.canTakeDamage) return;

    const damage = source === this.boss ? 10 : 5;
    gameState.playerHealth -= damage;
    this.healthBar.width = (gameState.playerHealth / gameState.maxHealth) * 300;
    this.healthText.setText(`Health: ${gameState.playerHealth}`);
    this.updateHUD(); // Update HUD for consistency
    player.canTakeDamage = false;

    // Boss attack animation (optional)
    if (source === this.boss) {
      this.boss.play("enemy_zombie_boss_attack1", true);
      this.time.delayedCall(700, () => {
        if (this.boss && this.boss.active) {
          this.boss.play("zombie_boss_idle");
        }
      });
    }

    this.showDamageSprite(source.x);

    // Knockback logic
    const angle = Phaser.Math.Angle.Between(
      source.x,
      source.y,
      player.x,
      player.y
    );
    const knockbackDistance = 80;
    const knockbackX = player.x + Math.cos(angle) * knockbackDistance;
    const knockbackY = player.y + Math.sin(angle) * knockbackDistance;

    if (player.body) {
      player.body.setVelocity(0);
      player.body.moves = false;
    }

    this.tweens.add({
      targets: player,
      x: knockbackX,
      y: knockbackY,
      duration: 800,
      ease: "Power2",
      onUpdate: () => {
        this.playerSprite.setPosition(player.x, player.y);
      },
      onComplete: () => {
        if (player.body) player.body.moves = true;
      },
    });

    this.tweens.add({
      targets: this.playerSprite,
      alpha: 0.4,
      yoyo: true,
      repeat: 4,
      duration: 100,
    });

    this.time.delayedCall(800, () => {
      player.canTakeDamage = true;
      this.playerSprite.setAlpha(1);
    });

    if (gameState.playerHealth <= 0) {
      this.scene.start("GameOverScene");
    }
  }

  //===================================================================
  //===================ATTACK INPUT WRAPPERS===========================
  //===================================================================
  handlePunch() {
    const punchKey =
      gameState.selectedFighter === "red"
        ? "red_fighter_punch"
        : "black_fighter_punch";
    this.performAttack(punchKey);
  }

  handleKick() {
    const kickKey =
      gameState.selectedFighter === "red"
        ? "red_fighter_kick"
        : "black_fighter_kick";
    this.performAttack(kickKey);
  }

  //===================================================================
  //===================PLAYER ATTACK===================================
  //===================================================================
  performAttack(imageKey) {
    if (!this.canAttack || this.isPaused) return;

    this.canAttack = false;
    this.playerSprite.setVisible(false);

    if (this.attackSprite) this.attackSprite.destroy();
    if (this.attackHitbox) this.attackHitbox.destroy();

    const offsetX = this.playerFacingRight ? 60 : -60;
    this.attackSprite = this.add
      .image(this.player.x + offsetX, this.player.y, imageKey)
      .setScale(1);
    if (!this.playerFacingRight) this.attackSprite.flipX = true;

    this.attackHitbox = this.add.rectangle(
      this.attackSprite.x,
      this.attackSprite.y,
      80,
      60,
      0xffff00,
      0.5
    );
    this.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.setAllowGravity(false);
    this.attackHitbox.body.enable = true;
    this.attackHitbox.isAttacking = true;

    this.physics.add.overlap(
      this.attackHitbox,
      this.enemies,
      (hitbox, enemy) => {
        if (!enemy.isHitByAttack) {
          console.log(
            "Enemy overlap detected at:",
            enemy.x,
            enemy.y,
            "Hitbox:",
            hitbox.x,
            hitbox.y,
            "Enemy type:",
            enemy.type
          );
          this.handleEnemyHit(enemy, 20);
          enemy.isHitByAttack = true;
        }
      },
      (hitbox, enemy) => {
        return (
          hitbox.isAttacking &&
          enemy.active &&
          !enemy.isHitByAttack &&
          Phaser.Geom.Rectangle.Overlaps(hitbox.body, enemy.body)
        );
      },
      this
    );

    if (this.boss) {
      this.physics.add.overlap(
        this.attackHitbox,
        this.boss,
        (hitbox, boss) => {
          if (!boss.isHitByAttack) {
            console.log(
              "Boss overlap detected at:",
              boss.x,
              boss.y,
              "Hitbox:",
              hitbox.x,
              hitbox.y
            );
            this.handleBossHit(boss, 25);
            boss.isHitByAttack = true;
          }
        },
        (hitbox, boss) => {
          return (
            hitbox.isAttacking &&
            boss.active &&
            !boss.isHitByAttack &&
            Phaser.Geom.Rectangle.Overlaps(hitbox.body, boss.body)
          );
        },
        this
      );
    }

    this.time.delayedCall(300, () => {
      if (this.attackSprite) this.attackSprite.destroy();
      if (this.attackHitbox) this.attackHitbox.destroy();
      this.attackSprite = null;
      this.attackHitbox = null;

      this.enemies.children.each((enemy) => {
        if (enemy.active) enemy.isHitByAttack = false;
      });
      if (this.boss && this.boss.active) this.boss.isHitByAttack = false;

      this.playerSprite.setVisible(true);
      this.playerSprite.play(`idle_${gameState.selectedFighter}`);
      this.time.delayedCall(
        this.attackCooldown - 300,
        () => (this.canAttack = true)
      );
    });
  }

  //===================================================================
  //===================ENEMY HIT=======================================
  //===================================================================
  handleEnemyHit(enemy, damage) {
    if (!enemy.active) return;

    enemy.health -= damage;
    gameState.score += 10;
    this.scoreText.setText(`Score: ${gameState.score}`);

    if (enemy.health <= 0) {
      if (enemy.hitboxVisual) enemy.hitboxVisual.destroy();
      enemy.destroy();
      this.enemies.remove(enemy, true, true);
      gameState.score += 50;
      this.scoreText.setText(`Score: ${gameState.score}`);
      this.checkWinCondition();
    }
  }

  //===================================================================
  //===================BOSS HIT========================================
  //===================================================================
  handleBossHit(boss, damage) {
    if (!boss.active || this.bossDefeated) return;

    this.bossHealth -= damage;
    gameState.score += 100;
    this.scoreText.setText(`Score: ${gameState.score}`);

    if (this.bossHealth <= 0) {
      if (this.bossHealthBar) this.bossHealthBar.destroy();
      if (this.bossHealthBarBg) this.bossHealthBarBg.destroy();
      if (this.bossText) this.bossText.destroy();
      if (this.bossHitboxVisual) this.bossHitboxVisual.destroy();
      boss.destroy();
      this.boss = null;
      this.bossSpawned = false;
      this.bossDefeated = true;
      gameState.score += 1000;
      this.scoreText.setText(`Score: ${gameState.score}`);
      this.checkWinCondition();
    }
  }

  //===================================================================
  //===================SPRITE DAMAGE===================================
  //===================================================================
  showDamageSprite(sourceX) {
    if (!this.playerSprite) return;

    this.playerSprite.setVisible(false);

    const damageKey = `${gameState.selectedFighter}_fighter_damage`;
    const damageSprite = this.add
      .image(this.player.x, this.player.y, damageKey)
      .setDepth(10)
      .setTint(0xff0000);

    if (!this.playerFacingRight) damageSprite.flipX = true;

    this.time.delayedCall(200, () => {
      damageSprite.destroy();
      this.playerSprite.clearTint();
      this.playerSprite.setVisible(true);
      this.playerSprite.play(`idle_${gameState.selectedFighter}`);
    });
  }

  //===================================================================
  //===================END LEVEL CHECK=================================
  //===================================================================
  checkWinCondition() {
    const enemiesRemaining = this.enemies ? this.enemies.countActive(true) : 0;
    console.log(
      "Win condition check: enemies=",
      enemiesRemaining,
      "bossSpawned=",
      this.bossSpawned,
      "bossDefeated=",
      this.bossDefeated,
      "bossActive=",
      this.boss && this.boss.active
    );
    if (enemiesRemaining <= 0 && !this.bossSpawned && !this.bossDefeated) {
      console.log("Enemies defeated, spawning boss...");
      this.spawnBoss();
      return;
    }

    if (enemiesRemaining <= 0 && this.bossDefeated && !this.portal) {
      console.log("Boss defeated, spawning portal...");
      this.portal = this.physics.add
        .sprite(this.worldWidth - 100, config.height - 200, "portal")
        .setScale(2)
        .setDepth(1);
      this.portal.body.setSize(40, 80).setOffset(30, 80);
      this.portal.body.setAllowGravity(false);
      this.portal.body.setImmovable(true);
      this.portal.body.enable = true;
      this.portal.play("portal");

      this.portalText = this.add
        .text(this.portal.x, this.portal.y - 80, "EXIT", {
          fontFamily: "Press Start 2P",
          fontSize: "18px",
          fill: "#FFF",
          stroke: "#000",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(2);

      this.portalCollider = this.physics.add.overlap(
        this.player,
        this.portal,
        () => {
          this.physics.world.isPaused = true;
          if (this.portalCollider) {
            this.physics.world.removeCollider(this.portalCollider);
            this.portalCollider = null;
          }
          this.time.delayedCall(300, () => {
            if (this.portalText) this.portalText.destroy();
            if (this.portal) this.portal.destroy();
            if (gameState.currentLevel < 10) {
              gameState.currentLevel++;
              this.scene.start("LevelCompleteScene");
            } else {
              this.scene.start("GameOverScene", { won: true });
            }
          });
        },
        null,
        this
      );
    }
  }

  //===================================================================
  //===================EXTEND WORLD====================================
  //===================================================================
  extendWorld() {
    if (this.worldLocked) return;

    const extensionSize = 2000;
    this.worldWidth += extensionSize;

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

    this.player.body.setBoundsRectangle(
      new Phaser.Geom.Rectangle(0, 0, this.worldWidth, this.worldHeight)
    );

    for (let i = 0; i < 3; i++) {
      const enemy = this.add
        .sprite(
          Phaser.Math.Between(this.worldWidth - 600, this.worldWidth - 100),
          Phaser.Math.Between(config.height - 200, config.height - 50),
          "enemy_zombie1_walk"
        )
        .setScale(0.6)
        .play("walk_zombie1");
      this.physics.add.existing(enemy);
      enemy.body.setSize(30, 40);
      enemy.body.setOffset((enemy.width - 30) / 2, enemy.height - 40);
      enemy.body.setCollideWorldBounds(true);
      enemy.body.setImmovable(true);
      enemy.health = 1;
      enemy.isHitByAttack = false;
      enemy.type = i % 2 === 0 ? "fast" : "standard";
      enemy.hitboxVisual = this.add
        .rectangle(
          enemy.x + (enemy.width - 30) / 2,
          enemy.y + (enemy.height - 40),
          30,
          40,
          0xff0000,
          0.5
        )
        .setOrigin(0.5, 1)
        .setDepth(5);
      this.enemies.add(enemy);
    }
  }

  //===================================================================
  //===================UPDATE LOOP=====================================
  //===================================================================
  update() {
    this.background.tilePositionX = this.cameras.main.scrollX;
    if (this.isPaused) return;

    const body = this.player.body;
    body.setVelocity(0);

    // Player movement
    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    const up = this.cursors.up.isDown || this.keyW.isDown;
    const down = this.cursors.down.isDown || this.keyS.isDown;

    let isMoving = false;
    if (left) {
      body.setVelocityX(-this.playerSpeed);
      this.playerFacingRight = false;
      isMoving = true;
    } else if (right) {
      body.setVelocityX(this.playerSpeed);
      this.playerFacingRight = true;
      isMoving = true;
    }

    const scaledYMin = config.height - 260;
    const scaledYMax = config.height - 55;
    let newY = this.player.y;
    if (up) {
      newY -= (this.playerSpeed * this.game.loop.delta) / 1000;
      isMoving = true;
    } else if (down) {
      newY += (this.playerSpeed * this.game.loop.delta) / 1000;
      isMoving = true;
    }
    this.player.y = Phaser.Math.Clamp(newY, scaledYMin, scaledYMax);
    this.player.body.setVelocityY(0);

    if (body.velocity.length() > 0) {
      body.velocity.normalize().scale(this.playerSpeed);
    }

    this.playerSprite.setPosition(this.player.x, this.player.y);
    this.playerSprite.flipX = !this.playerFacingRight;
    this.playerSprite.play(
      isMoving ? this.walkAnimKey : `idle_${gameState.selectedFighter}`,
      true
    );

    // Enemy updates
    if (this.enemies) {
      this.enemies.children.each((enemy) => {
        if (enemy.active) {
          const speed = enemy.type === "fast" ? 60 : 40;
          this.physics.moveToObject(enemy, this.player, speed);
          enemy.flipX = enemy.x > this.player.x;
          if (enemy.hitboxVisual) {
            enemy.hitboxVisual.setPosition(
              enemy.x + enemy.body.offset.x,
              enemy.y + enemy.body.offset.y
            );
          }
        }
      });
    }

    // Boss hitbox debug
    if (this.boss && this.boss.active && this.bossHitboxVisual) {
      this.bossHitboxVisual.setPosition(
        this.boss.x -
          this.boss.displayOriginX +
          this.boss.body.offset.x +
          this.boss.body.width / 2,
        this.boss.y -
          this.boss.displayOriginY +
          this.boss.body.offset.y +
          this.boss.body.height / 2
      );
      this.bossHitboxVisual.width = this.boss.body.width;
      this.bossHitboxVisual.height = this.boss.body.height;
    }

    // --- BOSS BEHAVIOR ---
    if (this.boss && this.boss.active) {
      const distanceToPlayer = Phaser.Math.Distance.Between(
        this.boss.x,
        this.boss.y,
        this.player.x,
        this.player.y
      );

      // Buffer zone to prevent rapid mode switching
      const detectionRangeEnter = 500;
      const detectionRangeExit = 550;
      const isEngaging =
        this.boss.isEngaging || distanceToPlayer <= detectionRangeEnter;
      this.boss.isEngaging = distanceToPlayer <= detectionRangeExit;

      if (!isEngaging) {
        // --- PATROL MODE ---
        const now = this.time.now;
        // Move toward patrol section if outside
        if (
          this.boss.x < this.bossPatrolMinX - 10 ||
          this.boss.x > this.bossPatrolMaxX + 10
        ) {
          const targetX = this.boss.patrolTargetX; // Center of patrol range
          const speed = 40; // Speed to return to patrol section
          if (Math.abs(this.boss.x - targetX) > 5) {
            this.boss.body.setVelocityX(this.boss.x > targetX ? -speed : speed);
            this.boss.flipX = this.boss.x > targetX;
            console.log(
              "Boss returning to patrol - x:",
              this.boss.x,
              "targetX:",
              targetX,
              "flipX:",
              this.boss.flipX
            );
          } else {
            this.boss.body.setVelocityX(0);
            this.boss.x = targetX;
          }
        } else {
          // Normal patrol within bounds
          if (
            !this.boss.lastPatrolFlip ||
            now - this.boss.lastPatrolFlip > 500
          ) {
            this.boss.x += this.bossPatrolDirection * 1.5;
            this.boss.x = Phaser.Math.Clamp(
              this.boss.x,
              this.bossPatrolMinX,
              this.bossPatrolMaxX
            );
            if (
              this.boss.x <= this.bossPatrolMinX ||
              this.boss.x >= this.bossPatrolMaxX
            ) {
              this.bossPatrolDirection *= -1;
              this.boss.lastPatrolFlip = now;
              console.log(
                "Boss patrol flip - x:",
                this.boss.x,
                "direction:",
                this.bossPatrolDirection,
                "flipX:",
                this.boss.flipX
              );
            }
            this.boss.flipX = this.bossPatrolDirection < 0;
          }
        }
        if (
          !this.boss.anims.currentAnim ||
          this.boss.anims.currentAnim.key !== "zombie_boss_walk"
        ) {
          this.boss.play("zombie_boss_walk");
        }
      } else {
        // --- ENGAGE PLAYER ---
        this.boss.flipX = this.boss.x > this.player.x;

        if (distanceToPlayer > 300) {
          this.physics.moveToObject(this.boss, this.player, 40);
          if (
            !this.boss.anims.currentAnim ||
            this.boss.anims.currentAnim.key !== "zombie_boss_walk"
          ) {
            this.boss.play("zombie_boss_walk");
          }
        } else {
          this.boss.body.setVelocityX(0);
          if (Math.abs(this.boss.y - this.player.y) > 10) {
            this.boss.body.setVelocityY(this.boss.y < this.player.y ? 40 : -40);
          } else {
            this.boss.body.setVelocityY(0);
          }

          const now = this.time.now;
          if (now - this.bossLastAttack > this.bossAttackCooldown) {
            this.boss.play("enemy_zombie_boss_attack1", true);
            this.boss.once("animationcomplete", (animation) => {
              if (animation.key === "enemy_zombie_boss_attack1") {
                this.throwBone();
              }
            });
            this.bossLastAttack = now;
          }
        }
      }

      // Update boss text and health bar positions
      if (this.bossText) {
        this.bossText.setPosition(this.boss.x, this.boss.y - 80);
      }
      if (this.bossHealthBar && this.bossHealthBarBg) {
        const barX = this.boss.x;
        const barY = this.boss.y - 100;
        this.bossHealthBarBg.setPosition(barX, barY);
        this.bossHealthBar.setPosition(barX, barY);
        this.bossHealthBar.width = (this.bossHealth / 100) * 100;
      }

      // Clamp boss Y
      const bossYMin = config.height - 260;
      const bossYMax = config.height - 55;
      this.boss.y = Phaser.Math.Clamp(this.boss.y, bossYMin, bossYMax);
    }

    // Projectile updates
    if (this.projectiles) {
      this.projectiles = this.projectiles.filter((bone) => bone && bone.active);
      this.projectiles.forEach((bone, index) => {
        if (bone && bone.active) {
          bone.rotation += bone.rotationSpeed * (this.game.loop.delta / 1000);
          console.log(
            `Bone[${index}] update - x:`,
            bone.x,
            "y:",
            bone.y,
            "velocityX:",
            bone.body.velocity.x
          );
          if (
            bone.x < this.cameras.main.worldView.x - 50 ||
            bone.x > this.cameras.main.worldView.x + config.width + 50
          ) {
            bone.destroy();
          }
        }
      });
    }

    // World extension
    const extensionTriggerX = this.worldWidth - 600;
    if (
      this.player.x > extensionTriggerX &&
      this.worldWidth < this.maxWorldWidth
    ) {
      this.extendWorld();
    }
  }

  //===================================================================
  //===================THROW BONE======================================
  //===================================================================
  throwBone() {
    if (!this.boss || !this.boss.active) return;

    const offsetX = this.boss.flipX ? -60 : 60;
    const boneX = this.boss.x + offsetX;
    const boneY = this.boss.y;

    const bone = this.physics.add.sprite(boneX, boneY, "bone");
    this.add.existing(bone);
    bone.setDisplaySize(32, 16);
    bone.setOrigin(0.5, 0.5);
    bone.body.setSize(32, 16);
    bone.body.allowGravity = false;
    bone.body.setCollideWorldBounds(false);
    bone.body.enable = true;

    const boneSpeed = 300;
    bone.body.setVelocityX(this.boss.flipX ? -boneSpeed : boneSpeed);

    console.log(
      "Bone spawned at x:",
      boneX,
      "y:",
      boneY,
      "velocityX:",
      bone.body.velocity.x,
      "boss.flipX:",
      this.boss.flipX
    );

    bone.rotationSpeed = Phaser.Math.DegToRad(360);

    this.bossProjectiles.add(bone);
    bone.body.setVelocityX(this.boss.flipX ? -boneSpeed : boneSpeed); // Reapply velocity

    this.time.delayedCall(3000, () => {
      if (bone && bone.active) bone.destroy();
    });

    this.projectiles.push(bone);
  }

  //===================================================================
  //===================HUD SETUP=======================================
  //===================================================================
  setupHUD() {
    this.levelText = this.add
      .text(
        20,
        20,
        `Level ${gameState.currentLevel}: ${
          gameState.levelNames[gameState.currentLevel - 1]
        }`,
        {
          fontFamily: "Press Start 2P",
          fontSize: "48px",
          fill: "#FFF",
          stroke: "#000",
          strokeThickness: 4,
        }
      )
      .setOrigin(0)
      .setScrollFactor(0);

    this.healthBarBg = this.add
      .rectangle(20, 60, 300, 30, 0x333333)
      .setOrigin(0)
      .setScrollFactor(0);

    this.healthBar = this.add
      .rectangle(
        20,
        60,
        (gameState.playerHealth / gameState.maxHealth) * 300,
        30,
        0xff0000
      )
      .setOrigin(0)
      .setScrollFactor(0);

    this.healthText = this.add
      .text(20, 60, `Health: ${gameState.playerHealth}`, {
        fontFamily: "Press Start 2P",
        fontSize: "48px",
        fill: "#FFF",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0)
      .setScrollFactor(0);

    this.scoreText = this.add
      .text(config.width - 20, 20, `Score: ${gameState.score}`, {
        fontFamily: "Press Start 2P",
        fontSize: "24px",
        fill: "#FFF",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0);
  }

  //===================================================================
  //===================HUD UPDATE======================================
  //===================================================================
  updateHUD() {
    this.healthBar.width = (gameState.playerHealth / gameState.maxHealth) * 300;
    this.healthText.setText(`Health: ${gameState.playerHealth}`);
    this.scoreText.setText(`Score: ${gameState.score}`);
  }

  //===================================================================
  //===================PAUSE GAME======================================
  //===================================================================
  togglePause() {
    if (this.isPaused) {
      this.isPaused = false;
      this.physics.world.isPaused = false;
      if (this.pauseMenu) this.pauseMenu.destroy();
      this.pauseMenu = null;
    } else {
      this.isPaused = true;
      this.physics.world.isPaused = true;

      this.pauseMenu = this.add
        .container(config.width / 2, config.height / 2)
        .setDepth(100);

      const pauseBg = this.add.rectangle(0, 0, 300, 200, 0x000000, 0.8);
      this.pauseMenu.add(pauseBg);

      const pauseText = this.add
        .text(0, -50, "PAUSED", {
          fontSize: "32px",
          fill: "#FFF",
          fontFamily: "Arial",
        })
        .setOrigin(0.5);
      this.pauseMenu.add(pauseText);

      const resumeText = this.add
        .text(0, 0, "RESUME", {
          fontSize: "24px",
          fill: "#0F0",
          fontFamily: "Arial",
        })
        .setOrigin(0.5)
        .setInteractive();
      resumeText.on("pointerdown", () => this.togglePause());
      resumeText.on("pointerover", () => resumeText.setStyle({ fill: "#FF0" }));
      resumeText.on("pointerout", () => resumeText.setStyle({ fill: "#0F0" }));
      this.pauseMenu.add(resumeText);

      const quitText = this.add
        .text(0, 50, "QUIT TO TITLE", {
          fontSize: "24px",
          fill: "#0F0",
          fontFamily: "Arial",
        })
        .setOrigin(0.5)
        .setInteractive();
      quitText.on("pointerdown", () => {
        this.isPaused = false;
        this.physics.world.isPaused = false;
        if (this.pauseMenu) {
          this.pauseMenu.destroy();
          this.pauseMenu = null;
        }
        this.scene.start("TitleScene");
      });
      quitText.on("pointerover", () => quitText.setStyle({ fill: "#FF0" }));
      quitText.on("pointerout", () => quitText.setStyle({ fill: "#0F0" }));
      this.pauseMenu.add(quitText);
    }
  }

  //===================================================================
  //===================SHUTDOWN CLEANUP================================
  //===================================================================
  shutdown() {
    // Cleanup input listeners
    if (this.keyZ) this.keyZ.off("down", this.handlePunch, this);
    if (this.keyX) this.keyX.off("down", this.handleKick, this);
    if (this.keyESC) this.keyESC.off("down", this.togglePause, this);

    // Cleanup attack objects
    if (this.attackSprite) {
      this.attackSprite.destroy();
      this.attackSprite = null;
    }
    if (this.attackHitbox) {
      this.attackHitbox.destroy();
      this.attackHitbox = null;
    }

    // Cleanup player
    if (this.player) {
      if (this.player.body) this.player.body.destroy();
      this.player.destroy();
      this.player = null;
    }
    if (this.playerSprite) {
      this.playerSprite.destroy();
      this.playerSprite = null;
    }

    // Cleanup portal
    if (this.portal) {
      if (this.portal.body) this.physics.world.disable(this.portal);
      this.portal.destroy();
      this.portal = null;
    }
    if (this.portalText) {
      this.portalText.destroy();
      this.portalText = null;
    }
    if (this.portalCollider) {
      this.physics.world.removeCollider(this.portalCollider);
      this.portalCollider = null;
    }

    // Cleanup enemies
    if (this.enemies && this.enemies.children) {
      this.enemies.children.each((enemy) => {
        if (enemy && enemy.hitboxVisual) enemy.hitboxVisual.destroy();
        if (enemy) enemy.destroy();
      }, this);
      this.enemies.clear(true, true);
      this.enemies = null;
    }

    // Cleanup boss
    if (this.boss) {
      if (this.boss.body) this.boss.body.destroy();
      this.boss.destroy();
      this.boss = null;
    }
    if (this.bossText) {
      this.bossText.destroy();
      this.bossText = null;
    }
    if (this.bossHitboxVisual) {
      this.bossHitboxVisual.destroy();
      this.bossHitboxVisual = null;
    }
    if (this.bossHealthBar) {
      this.bossHealthBar.destroy();
      this.bossHealthBar = null;
    }
    if (this.bossHealthBarBg) {
      this.bossHealthBarBg.destroy();
      this.bossHealthBarBg = null;
    }

    // Cleanup projectiles
    if (this.projectiles) {
      this.projectiles.forEach((bone) => {
        if (bone && bone.active) bone.destroy();
      });
      this.projectiles = [];
    }
    if (this.bossProjectiles && this.bossProjectiles.children) {
      this.bossProjectiles.clear(true, true);
      this.bossProjectiles = null;
    }

    // Cleanup pause menu
    if (this.pauseMenu) {
      this.pauseMenu.destroy();
      this.pauseMenu = null;
    }

    // Remove scene event listeners
    this.events.off("shutdown", this.shutdown, this);
  }
}

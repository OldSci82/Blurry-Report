// scripts/GameScene.js
import { config, gameState } from "../game.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");

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
    this.bossDefeated = false; // Reset for new level
    this.bossSpawned = false; // Ensure boss hasn't spawned
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.input.keyboard.resetKeys();
    this.physics.world.overlaps = [];

    if (!["black", "red"].includes(gameState.selectedFighter)) {
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

    // Background
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

    //===================================================================
    //===================PLAYER SETUP====================================
    //===================================================================
    this.player = this.add.rectangle(
      150,
      config.height - 100,
      30,
      30,
      0x00ff00,
      0.3
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

    //===================================================================
    //===================INPUT SETUP=====================================
    //===================================================================
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

    //===================================================================
    //===================HUD SETUP=======================================
    //===================================================================
    this.setupHUD();

    //===================================================================
    //===================ENEMY SETUP=====================================
    //===================================================================
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
      this.enemies.add(enemy);
    }

    //===================================================================
    //===================COLLISION SETUP=================================
    //===================================================================
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerTakeDamage,
      null,
      this
    );

    this.events.on("shutdown", this.shutdown, this);

    //===================================================================
    //===================CHECK INITIAL WIN CONDITION=====================
    //===================================================================
    this.checkWinCondition();
  }

  //===================================================================
  //===================END LEVEL BOSS SPAWN============================
  //===================================================================
  spawnBoss() {
    if (this.bossSpawned || this.bossDefeated) {
      console.log("Boss spawn skipped: already spawned or defeated");
      return;
    }
    console.log(
      "Spawning boss at:",
      this.worldWidth - 100,
      config.height - 100
    );
    this.boss = this.physics.add
      .sprite(this.worldWidth - 100, config.height - 100, "zombie_boss_walk")
      .setScale(0.6)
      .setDepth(1);
    this.boss.body.setSize(60, 80).setOffset(70, 80);
    this.boss.body.setImmovable(true);
    this.boss.body.setCollideWorldBounds(true);
    this.boss.isHitByAttack = false;
    this.boss.play("zombie_boss_walk");

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

    this.bossHealth = 100;
    this.bossSpawned = true;
    this.bossDefeated = false;
    this.worldLocked = true;
  }

  //===================================================================
  //===================PLAYER TAKES DAMAGE==============================
  //===================================================================
  handlePlayerTakeDamage(player, source) {
    if (!player.canTakeDamage) return;

    const damage = source === this.boss ? 10 : 5;
    gameState.playerHealth -= damage;
    this.healthBar.width = (gameState.playerHealth / gameState.maxHealth) * 300;
    this.healthText.setText(`Health: ${gameState.playerHealth}`);
    player.canTakeDamage = false;

    // Boss attack animation (optional)
    if (source === this.boss) {
      this.boss.play("attack_zombie_boss", true);
      this.time.delayedCall(700, () => {
        if (this.boss && this.boss.active) {
          this.boss.play("walk_zombie_boss");
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

    const offsetX = this.playerFacingRight ? 40 : -40;
    this.attackSprite = this.add
      .image(this.player.x + offsetX, this.player.y, imageKey)
      .setScale(1);
    if (!this.playerFacingRight) this.attackSprite.flipX = true;

    this.attackHitbox = this.add.rectangle(
      this.attackSprite.x,
      this.attackSprite.y,
      50,
      50,
      0xffff00,
      0.3
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
          this.handleEnemyHit(enemy, 20);
          enemy.isHitByAttack = true;
        }
      }
    );

    if (this.boss) {
      this.physics.add.overlap(this.attackHitbox, this.boss, (hitbox, boss) => {
        if (!boss.isHitByAttack) {
          this.handleBossHit(boss, 25);
          boss.isHitByAttack = true;
        }
      });
    }

    this.time.delayedCall(200, () => {
      if (this.attackSprite) this.attackSprite.destroy();
      if (this.attackHitbox) this.attackHitbox.destroy();
      this.attackSprite = null;
      this.attackHitbox = null;

      this.enemies.children.each((enemy) => (enemy.isHitByAttack = false));
      if (this.boss) this.boss.isHitByAttack = false;

      this.playerSprite.setVisible(true);
      this.playerSprite.play(`idle_${gameState.selectedFighter}`);
      this.time.delayedCall(
        this.attackCooldown - 200,
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
      if (this.bossText) this.bossText.destroy();
      boss.destroy();
      this.boss = null;
      this.bossSpawned = false;
      this.bossDefeated = true; // Flag to prevent boss from respawning
      gameState.score += 1000;
      this.scoreText.setText(`Score: ${gameState.score}`);

      // Trigger portal check
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
    const enemiesRemaining = this.enemies.countActive(true);
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

    // Spawn boss when all enemies are defeated and boss hasn't been spawned or defeated
    if (enemiesRemaining <= 0 && !this.bossSpawned && !this.bossDefeated) {
      console.log("Enemies defeated, spawning boss...");
      this.spawnBoss();
      return;
    }

    // Spawn portal when boss is defeated and no enemies remain
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
  //===================EXTEND WORLD (LOCKED AFTER BOSS)================
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

    // Spawn extra enemies
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

    const scaledYMin = Math.min(220 * this.bgScale, config.height / 2 - 50);
    const scaledYMax = Math.max(550 * this.bgScale, config.height / 2 + 50);
    let newY = this.player.y;
    if (up) {
      newY -= (this.playerSpeed * this.game.loop.delta) / 1000;
      isMoving = true; // Add for vertical movement
    } else if (down) {
      newY += (this.playerSpeed * this.game.loop.delta) / 1000;
      isMoving = true; // Add for vertical movement
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

    this.enemies.children.each((enemy) => {
      if (enemy.active) {
        const speed = enemy.type === "fast" ? 60 : 40;
        this.physics.moveToObject(enemy, this.player, speed);
        enemy.flipX = enemy.x > this.player.x;
      }
    });

    if (this.boss && this.boss.active) {
      if (this.boss.y < this.player.y) this.boss.y += 1.5;
      else if (this.boss.y > this.player.y) this.boss.y -= 1.5;
      this.bossText.setPosition(this.boss.x, this.boss.y - 80);
      this.boss.flipX = this.boss.x > this.player.x;
    }

    const extensionTriggerX = this.worldWidth - 600;
    if (
      this.player.x > extensionTriggerX &&
      this.worldWidth < this.maxWorldWidth
    ) {
      this.extendWorld();
    }
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
          fontSize: "24px",
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
      .text(20, 100, `Health: ${gameState.playerHealth}`, {
        fontFamily: "Press Start 2P",
        fontSize: "24px",
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
        // Reset pause before quitting
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
  //===================SHUTDOWN CLEANUP===============================
  //===================================================================
  shutdown() {
    // Cleanup all event listeners and objects
    if (this.keyZ) this.keyZ.off("down", this.handlePunch, this);
    if (this.keyX) this.keyX.off("down", this.handleKick, this);
    if (this.keyESC) this.keyESC.off("down", this.togglePause, this);

    if (this.attackSprite) this.attackSprite.destroy();
    if (this.attackHitbox) this.attackHitbox.destroy();

    if (this.player) {
      if (this.player.body) this.player.body.destroy();
      this.player.destroy();
    }
    if (this.playerSprite) this.playerSprite.destroy();
    if (this.attackHitbox) {
      this.attackHitbox.destroy();
      this.attackHitbox = null;
    }

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

    if (this.enemies && typeof this.enemies.destroy === "function") {
      try {
        this.enemies.destroy(true);
        this.enemies = null;
      } catch (e) {
        console.warn("Failed to destroy enemies group:", e);
      }
    }

    if (this.boss) {
      if (this.boss.body) this.boss.body.destroy();
      this.boss.destroy();
      this.boss = null;
    }
    if (this.bossText) {
      this.bossText.destroy();
      this.bossText = null;
    }

    if (this.pauseMenu) {
      this.pauseMenu.destroy();
      this.pauseMenu = null;
    }
  }
}

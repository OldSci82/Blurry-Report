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
    this.portal = null;
    this.portalText = null;

    this.levelText = null;
    this.healthText = null;
    this.scoreText = null;

    this.walkAnimKey = null;
    this.punchKey = null;
    this.kickKey = null;
    this.walkSheetKey = null;

    this.isPaused = false;
    this.pauseMenu = null;
  }

  preload() {
    // Assets loaded in BootScene
  }

  create() {
    // Reset input and physics systems
    this.input.keyboard.resetKeys();
    this.input.keyboard.clearCaptures();
    this.physics.world.overlaps = []; // Clear overlaps on create

    // Ensure selectedFighter is valid
    console.log("GameScene: selectedFighter =", gameState.selectedFighter);
    if (!gameState.selectedFighter) {
      console.error("No fighter selected, defaulting to 'black'");
      gameState.selectedFighter = "black";
    }

    // Set keys based on selected fighter
    this.walkSheetKey = `${gameState.selectedFighter}_fighter_walk`;
    this.punchKey = `${gameState.selectedFighter}_fighter_punch`;
    this.kickKey = `${gameState.selectedFighter}_fighter_kick`;
    this.walkAnimKey = `walk_${gameState.selectedFighter}`;

    // Verify spritesheet and animations
    if (!this.textures.exists(this.walkSheetKey)) {
      console.error(`Spritesheet ${this.walkSheetKey} not found`);
      this.scene.start("TitleScene");
      return;
    }
    if (
      !this.anims.exists(this.walkAnimKey) ||
      !this.anims.exists(`idle_${gameState.selectedFighter}`)
    ) {
      console.error(
        `Animations missing: walk=${this.walkAnimKey}, idle=idle_${gameState.selectedFighter}`
      );
      this.scene.start("TitleScene");
      return;
    }

    // Set background color based on level
    const bgColors = [
      "#A8A8A8",
      "#6A5ACD",
      "#4682B4",
      "#556B2F",
      "#8B4513",
      "#696969",
      "#2F4F4F",
      "#4B0082",
      "#708090",
      "#DC143C",
    ];
    this.cameras.main.setBackgroundColor(
      bgColors[gameState.currentLevel - 1] || "#000"
    );

    // Set camera bounds for scrolling
    this.cameras.main.setBounds(0, 0, 2816, 1536);

    //===================================================================
    //===================BACKGROUND SETUP================================
    //===================================================================
    // Add and scale background for level 1
    if (gameState.currentLevel === 1) {
      const bg = this.add.image(0, 0, "background_level1");
      bg.setOrigin(0); // Top-left corner as origin
      bg.setDisplaySize(1600, 400); // Match camera bounds
      bg.setDepth(-10); // Ensure background is behind everything
    }

    //===================================================================
    //===================PLAYER SETUP================================
    //===================================================================
    // Create player body (for collisions)
    this.player = this.add.rectangle(
      150,
      config.height / 2,
      40,
      40,
      0x00ff00,
      0.3
    );
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.canTakeDamage = true;

    // Create player sprite for visuals
    this.playerSprite = this.add.sprite(
      this.player.x,
      this.player.y,
      this.walkSheetKey
    );
    try {
      this.playerSprite.play(`idle_${gameState.selectedFighter}`);
      console.log(`Playing idle animation: idle_${gameState.selectedFighter}`);
    } catch (error) {
      console.error(`Failed to play idle animation: ${error.message}`);
      this.scene.start("TitleScene");
      return;
    }

    // Enemy setup
    this.enemies = this.physics.add.group();
    const numEnemies = 3 + gameState.currentLevel;
    if (!this.anims.exists("walk_zombie1")) {
      console.error("Animation walk_zombie1 missing");
    }
    for (let i = 0; i < numEnemies; i++) {
      const enemy = this.add.sprite(
        Phaser.Math.Between(config.width / 2, config.width - 50),
        Phaser.Math.Between(50, config.height - 50),
        "enemy_zombie1_walk"
      );
      this.physics.add.existing(enemy);
      enemy.body.setSize(30, 40);
      enemy.body.setOffset((enemy.width - 30) / 2, enemy.height - 40);
      enemy.body.setCollideWorldBounds(true);
      enemy.body.setImmovable(true);
      enemy.health = 1;
      enemy.isHitByAttack = false;
      enemy.type = i % 2 === 0 ? "fast" : "standard";
      try {
        enemy.play("walk_zombie1");
        console.log(`Playing walk_zombie1 for enemy ${i}`);
      } catch (error) {
        console.error(
          `Failed to play zombie animation for enemy ${i}: ${error.message}`
        );
      }
      this.enemies.add(enemy);
    }

    // Boss
    this.boss = null;
    this.bossHealth = 100;
    this.bossSpawned = false;

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

    // HUD
    this.levelText = this.add
      .text(
        10,
        10,
        `Level ${gameState.currentLevel}: ${
          gameState.levelNames[gameState.currentLevel - 1]
        }`,
        {
          fontSize: "16px",
          fill: "#FFF",
        }
      )
      .setScrollFactor(0);
    this.healthText = this.add
      .text(10, 30, `Health: ${gameState.playerHealth}`, {
        fontSize: "16px",
        fill: "#FFF",
      })
      .setScrollFactor(0);
    this.scoreText = this.add
      .text(config.width - 10, 10, `Score: ${gameState.score}`, {
        fontSize: "16px",
        fill: "#FFF",
      })
      .setOrigin(1, 0)
      .setScrollFactor(0);

    // Overlap handlers
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerTakeDamage,
      null,
      this
    );
    if (this.boss) {
      this.physics.add.overlap(
        this.player,
        this.boss,
        this.handlePlayerTakeDamage,
        null,
        this
      );
    }

    this.events.on("shutdown", this.shutdown, this);

    // Force check win condition on create
    this.checkWinCondition();
  }

  handlePunch() {
    if (!this.canAttack || this.isPaused) return;
    this.performAttack(this.punchKey);
  }

  handleKick() {
    if (!this.canAttack || this.isPaused) return;
    this.performAttack(this.kickKey);
  }

  //===================================================================
  //===================END LEVEL BOSS SPAWN============================
  //===================================================================
  spawnBoss() {
    this.boss = this.add.rectangle(
      config.width - 100,
      config.height / 2,
      60,
      80,
      0x8a2be2
    );
    this.physics.add.existing(this.boss);
    this.boss.body.setImmovable(true);
    this.boss.body.setCollideWorldBounds(true);
    this.boss.isHitByAttack = false;

    this.add
      .text(this.boss.x, this.boss.y - 50, "BOSS!", {
        fontSize: "24px",
        fill: "#FFF",
      })
      .setOrigin(0.5);

    // Enable collision
    this.physics.add.overlap(
      this.player,
      this.boss,
      this.handlePlayerTakeDamage,
      null,
      this
    );

    this.bossHealth = 100;
    this.bossSpawned = true;
  }

  //===================================================================
  //===================PLAYER ATTACK===================================
  //===================================================================
  performAttack(imageKey) {
    this.canAttack = false;

    this.playerSprite.setVisible(false);

    if (this.attackSprite) this.attackSprite.destroy();
    if (this.attackHitbox) this.attackHitbox.destroy();

    const offsetX = this.playerFacingRight ? 30 : -30;
    this.attackSprite = this.add
      .image(this.player.x + offsetX, this.player.y, imageKey)
      .setScale(1);
    if (!this.playerFacingRight) this.attackSprite.flipX = true;

    this.attackHitbox = this.add.rectangle(
      this.attackSprite.x,
      this.attackSprite.y,
      40,
      40,
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
  //===================ENEMY HIT===================================
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
  //===================BOSS HIT===================================
  //===================================================================
  handleBossHit(boss, damage) {
    if (!boss.active) return;
    this.bossHealth -= damage;
    gameState.score += 100;
    this.scoreText.setText(`Score: ${gameState.score}`);

    if (this.bossHealth <= 0) {
      boss.destroy();
      gameState.score += 1000;
      this.scoreText.setText(`Score: ${gameState.score}`);
      this.checkWinCondition();
    }
  }

  //===================================================================
  //===================SHOW SPRITE DAMAGE==============================
  //===================================================================
  showDamageSprite(sourceX) {
    if (!this.playerSprite) return;

    this.playerSprite.setVisible(false);

    const damageKey = `${gameState.selectedFighter}_fighter_damage`;
    const damageSprite = this.add
      .image(this.player.x, this.player.y, damageKey)
      .setDepth(10)
      .setTint(0xff0000); // Red flash

    if (!this.playerFacingRight) damageSprite.flipX = true;

    // Optional: knockback visuals follow player position
    this.time.delayedCall(200, () => {
      damageSprite.destroy();
      this.playerSprite.clearTint();
      this.playerSprite.setVisible(true);
      this.playerSprite.play(`idle_${gameState.selectedFighter}`);
    });
  }

  //===================================================================
  //===================PLAYER DAMAGE===================================
  //===================================================================
  handlePlayerTakeDamage(player, source) {
    if (!player.canTakeDamage) return;

    const damage = source === this.boss ? 10 : 5;
    gameState.playerHealth -= damage;
    this.healthText.setText(`Health: ${gameState.playerHealth}`);

    player.canTakeDamage = false;

    // Flash damage visual
    this.showDamageSprite(source.x);

    // Knockback direction
    const angle = Phaser.Math.Angle.Between(
      source.x,
      source.y,
      player.x,
      player.y
    );
    const knockbackDistance = 100;
    const knockbackX = player.x + Math.cos(angle) * knockbackDistance;
    const knockbackY = player.y + Math.sin(angle) * knockbackDistance;

    // Stop movement during tween
    if (player.body) {
      player.body.setVelocity(0);
      player.body.moves = false;
    }

    // Tween player back and update camera and sprite position
    this.tweens.add({
      targets: player,
      x: knockbackX,
      y: knockbackY,
      duration: 1000,
      ease: "Power2",
      onUpdate: () => {
        this.playerSprite.setPosition(player.x, player.y);

        // 👇 Smooth camera follow during tween
        this.cameras.main.scrollX = Phaser.Math.Clamp(
          player.x - config.width / 2,
          0,
          1600 - config.width
        );
      },
      onComplete: () => {
        if (player.body) player.body.moves = true;
      },
    });

    // Damage flicker effect
    this.tweens.add({
      targets: this.playerSprite,
      alpha: 0.4,
      yoyo: true,
      repeat: 4,
      duration: 100,
    });

    this.time.delayedCall(1000, () => {
      player.canTakeDamage = true;
      this.playerSprite.setAlpha(1);
    });

    if (gameState.playerHealth <= 0) {
      this.scene.start("GameOverScene");
    }
  }

  //===================================================================
  //===================END LEVEL CHECK=================================
  //===================================================================
  checkWinCondition() {
    const enemiesRemaining = this.enemies.countActive(true);
    const bossAlive = this.boss && this.boss.active;

    if (enemiesRemaining <= 0 && !this.bossSpawned) {
      console.log("Enemies defeated, spawning boss...");
      this.spawnBoss();
      return; // Wait for boss defeat before checking portal
    }

    if (
      enemiesRemaining <= 0 &&
      this.bossSpawned &&
      !bossAlive &&
      !this.portal
    ) {
      console.log("Boss defeated, spawning portal...");
      if (this.portal) {
        if (this.portalText) {
          this.portalText.destroy();
          this.portalText = null;
        }
        if (this.portal.body) {
          this.physics.world.disable(this.portal);
        }
        this.portal.destroy();
        this.portal = null;
      }

      this.portal = this.add.rectangle(
        config.width - 40,
        config.height / 2,
        40,
        80,
        0x00ffff,
        0.5
      );
      this.physics.add.existing(this.portal);
      this.portal.body.setAllowGravity(false);
      this.portal.body.setImmovable(true);
      this.portal.body.enable = true;

      this.portalText = this.add
        .text(this.portal.x, this.portal.y - 50, "EXIT", {
          fontSize: "18px",
          fill: "#FFF",
        })
        .setOrigin(0.5);

      this.physics.add.overlap(
        this.player,
        this.portal,
        () => {
          this.physics.world.isPaused = true;
          this.physics.world.overlaps = [];

          if (this.portal.body) {
            this.physics.world.disable(this.portal);
          }

          this.time.delayedCall(300, () => {
            if (this.portal && this.portal.active) {
              if (this.portalText) {
                this.portalText.destroy();
                this.portalText = null;
              }
              this.portal.destroy();
              this.portal = null;
            }

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

  update() {
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

    if (up) {
      body.setVelocityY(-this.playerSpeed);
      isMoving = true;
    } else if (down) {
      body.setVelocityY(this.playerSpeed);
      isMoving = true;
    }

    if (body.velocity.length() > 0) {
      body.velocity.normalize().scale(this.playerSpeed);
      this.cameras.main.scrollX = Phaser.Math.Clamp(
        this.player.x - config.width / 2,
        0,
        1600 - config.width
      );
    }

    this.playerSprite.setPosition(this.player.x, this.player.y);
    this.playerSprite.flipX = !this.playerFacingRight;
    if (isMoving) {
      this.playerSprite.play(this.walkAnimKey, true);
    } else {
      this.playerSprite.play(`idle_${gameState.selectedFighter}`, true);
    }

    this.enemies.children.each((enemy) => {
      if (enemy.active) {
        const speed = enemy.type === "fast" ? 60 : 40;
        this.physics.moveToObject(enemy, this.player, speed);
        enemy.flipX = enemy.x > this.player.x;
      }
    });

    if (this.boss && this.boss.active) {
      // Simple boss AI movement towards player on y-axis only
      if (this.boss.y < this.player.y) {
        this.boss.y += 1.5;
      } else if (this.boss.y > this.player.y) {
        this.boss.y -= 1.5;
      }
      // Damage player if overlapping is handled elsewhere
    }
  }

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

    if (this.portal) {
      if (this.portal.body) this.physics.world.disable(this.portal);
      this.portal.destroy();
      this.portal = null;
    }
    if (this.portalText) {
      this.portalText.destroy();
      this.portalText = null;
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

    if (this.pauseMenu) {
      this.pauseMenu.destroy();
      this.pauseMenu = null;
    }
  }
}

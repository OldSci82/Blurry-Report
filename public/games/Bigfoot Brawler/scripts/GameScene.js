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
    this.cameras.main.fadeIn(500, 0, 0, 0);
    // Reset input and physics systems
    this.input.keyboard.resetKeys();
    this.input.keyboard.clearCaptures();
    this.physics.world.overlaps = [];

    // Validate selected fighter
    if (!["black", "red"].includes(gameState.selectedFighter)) {
      console.error("Invalid fighter selected, defaulting to 'black'");
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

    // World & Camera Bounds
    this.worldWidth = 3000;
    this.worldHeight = config.height;
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

    // Background Setup
    const bgImage = this.textures.get("background_level1").getSourceImage();
    const bgScale = config.height / bgImage.height; // Scale to fit 600px height
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
    console.log(
      "Background dimensions:",
      bgImage.width,
      bgImage.height,
      "Scale:",
      bgScale,
      "Position:",
      0,
      config.height - bgImage.height * bgScale
    );

    // Player Setup
    this.player = this.add.rectangle(
      150,
      config.height - 100,
      30,
      30,
      0x00ff00,
      0.3
    ); // Adjusted hitbox and y-position
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setBoundsRectangle(
      new Phaser.Geom.Rectangle(0, 0, this.worldWidth, this.worldHeight)
    );
    this.player.canTakeDamage = true;

    // Player Sprite
    this.playerSprite = this.add
      .sprite(this.player.x, this.player.y, this.walkSheetKey)
      .setScale(0.6); // Reduced from 2
    try {
      this.playerSprite.play(`idle_${gameState.selectedFighter}`);
      console.log(`Playing idle animation: idle_${gameState.selectedFighter}`);
    } catch (error) {
      console.error(`Failed to play idle animation: ${error.message}`);
      this.scene.start("TitleScene");
      return;
    }

    // Camera Follow
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setFollowOffset(-config.width / 4, 0);

    // Enemy Setup
    this.enemies = this.physics.add.group();
    const numEnemies = 3 + gameState.currentLevel;
    if (!this.anims.exists("walk_zombie1")) {
      console.error("Animation walk_zombie1 missing");
    }
    for (let i = 0; i < numEnemies; i++) {
      const enemy = this.add
        .sprite(
          Phaser.Math.Between(config.width / 2, config.width - 50),
          Phaser.Math.Between(config.height - 200, config.height - 50), // Adjusted y to stay on road
          "enemy_zombie1_walk"
        )
        .setScale(0.6); // Reduced from 1.5
      this.physics.add.existing(enemy);
      enemy.body.setSize(20, 30); // Adjusted hitbox
      enemy.body.setOffset((enemy.width - 20) / 2, enemy.height - 30);
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

    // Input Setup
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
      .rectangle(20, 60, gameState.playerHealth * 3, 30, 0xff0000)
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

    // Overlap Handlers
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

    // Force check win condition
    this.checkWinCondition();
  }

  handlePlayerTakeDamage(player, source) {
    if (!player.canTakeDamage) return;

    const damage = source === this.boss ? 10 : 5;
    gameState.playerHealth -= damage;
    this.healthBar.width = gameState.playerHealth * 3;
    this.healthText.setText(`Health: ${gameState.playerHealth}`);
    player.canTakeDamage = false;

    this.showDamageSprite(source.x);

    const angle = Phaser.Math.Angle.Between(
      source.x,
      source.y,
      player.x,
      player.y
    );
    const knockbackDistance = 80; // Reduced from 100
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
      duration: 800, // Reduced from 1000
      ease: "Power2",
      onUpdate: () => {
        this.playerSprite.setPosition(player.x, player.y);
        this.cameras.main.scrollX = Phaser.Math.Clamp(
          player.x - config.width / 2,
          0,
          this.worldWidth - config.width
        );
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
      // Reduced from 1000
      player.canTakeDamage = true;
      this.playerSprite.setAlpha(1);
    });

    if (gameState.playerHealth <= 0) {
      this.scene.start("GameOverScene");
    }
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
  //===================WORLD EXTEND=================================
  //===================================================================
  extendWorld() {
    const extensionSize = 2000; // How much to extend each time
    this.worldWidth += extensionSize;

    console.log("Extending world to:", this.worldWidth);

    // Update world bounds
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

    // Rebind player world constraint
    this.player.body.setBoundsRectangle(
      new Phaser.Geom.Rectangle(0, 0, this.worldWidth, this.worldHeight)
    );

    // Optional: spawn new enemies or objects here
    for (let i = 0; i < 3; i++) {
      const enemy = this.add.sprite(
        Phaser.Math.Between(this.worldWidth - 600, this.worldWidth - 100),
        Phaser.Math.Between(50, this.worldHeight - 50),
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
      enemy.play("walk_zombie1");
      this.enemies.add(enemy);
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
        if (this.portalText) this.portalText.destroy();
        if (this.portal.body) this.physics.world.disable(this.portal);
        this.portal.destroy();
      }

      this.portal = this.add.rectangle(
        this.worldWidth - 40, // Place at world’s end
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

      console.log("Portal spawned at:", this.portal.x, this.portal.y);

      this.physics.add.overlap(
        this.player,
        this.portal,
        () => {
          this.physics.world.isPaused = true;
          this.physics.world.overlaps = [];
          if (this.portal.body) this.physics.world.disable(this.portal);
          this.time.delayedCall(300, () => {
            if (this.portal && this.portal.active) {
              if (this.portalText) this.portalText.destroy();
              this.portal.destroy();
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
    if (up) newY -= (this.playerSpeed * this.game.loop.delta) / 1000;
    else if (down) newY += (this.playerSpeed * this.game.loop.delta) / 1000;
    this.player.y = Phaser.Math.Clamp(newY, scaledYMin, scaledYMax);
    this.player.body.setVelocityY(0);

    if (body.velocity.length() > 0) {
      body.velocity.normalize().scale(this.playerSpeed);
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
    const extensionTriggerX = this.worldWidth - 600;

    if (this.player.x > extensionTriggerX) {
      this.extendWorld();
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

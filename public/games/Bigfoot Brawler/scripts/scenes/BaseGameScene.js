// scripts/scenes/BaseGameScene.js
import { setupHUD } from "../Utils/HUD.js"; // Import it
import { gameState, config } from "../game.js"; // <--- Import config here!
import { setupKeyboard, playerInput } from "../Utils/inputManager.js";

// Change 'export default' to 'export' for consistency with other scenes
export class BaseGameScene extends Phaser.Scene {
  constructor(key = "BaseGameScene") {
    super(key);

    // Common properties
    this.worldWidth = 4000;
    this.worldHeight = 600;
    this.maxWorldWidth = 10000;
    this.playerSpeed = 200;
    this.scaleFactor = 1; // Assuming a base scale of 1
    this.isPaused = false; // Initialize pause state
    this.pauseButtonPressed = false; // Add this property for pause debounce

    // Game objects
    this.background = null; // <--- Added background property
    this.player = null;
    this.enemies = null; // Changed from playerSprite to player for direct use
    this.boss = null;
    this.projectiles = [];
    this.bossProjectiles = null; // Initialize this as a Phaser Group in create()
    this.portal = null;
    this.portalText = null;
    this.portalCollider = null;

    // Boss flags
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.bossLastAttack = 0; // Initialize boss attack timer
    this.bossAttackCooldown = 2000; // Example cooldown
    this.bossPatrolMinX = 0; // Will be set in create
    this.bossPatrolMaxX = 0; // Will be set in create
    this.bossPatrolDirection = 1; // Initial direction
    this.bossHealth = 100; // Initialize boss health
    this.bossMaxHealth = 100; // Initialize boss max health
    this.bossText = null;
    this.bossHealthBar = null;
    this.bossHealthBarBg = null;
    this.bossHitboxVisual = null; // For debug
    this.worldLocked = false; // For extendWorld

    // HUD elements
    this.levelText = null;
    this.healthBarBg = null;
    this.healthBar = null;
    this.healthText = null;
    this.scoreText = null;

    // Pause menu
    this.pauseMenu = null;

    // Input-related properties (initialized by subclasses)
    // Keyboard input setup (if you still want keyboard controls)
    this.cursors = null;
    // This ensures the playerInput object is available for MobileGameScene to modify
    // and for the update loop to read.
    this.keyW = null;
    this.keyA = null;
    this.keyS = null;
    this.keyD = null;
    this.keyZ = null;
    this.keyX = null;
    this.keyESC = null;

    this.touchLeft = null; // For MobileGameScene
    this.touchRight = null;
    this.touchUp = null;
    this.touchDown = null;
    this.touchPunch = null;
    this.touchKick = null;
    this.touchPause = null;
    this.touchControls = null;
  }

  // ============== PHASER LIFECYCLE METHODS ==============

  preload() {
    // This BaseGameScene doesn't directly preload specific assets,
    // as assets are typically loaded once in the BootScene.
    // However, including the preload method is good practice for a Scene class.
    console.log(`${this.scene.key}: Preload (Base) - No assets to load here.`);
  }

  create() {
    console.log("BaseGameScene: Creating...");

    this.physics.world.setBounds(0, 0, 1920, 1080);
    this.cameras.main.setBounds(0, 0, 1920, 1080);

    this.add.image(0, 0, "background_level1").setOrigin(0).setScrollFactor(1);

    const playerX = this.cameras.main.width / 2;
    const playerY = this.cameras.main.height - 100;
    const fighterKey =
      gameState.selectedFighter === "black_fighter"
        ? "black_fighter_walk"
        : "red_fighter_walk";
    const idleKey =
      gameState.selectedFighter === "black_fighter" ? "idle_black" : "idle_red";

    this.player = this.physics.add.sprite(playerX, playerY, fighterKey);
    this.player.setCollideWorldBounds(true);
    this.player.anims.play(idleKey);
    this.player.setScale(1.5);
    this.player.name = gameState.selectedFighter;

    this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

    // Keyboard input setup
    this.keys = setupKeyboard(this);
    this.cursors = this.keys.cursors;

    this.enemies = this.physics.add.group();
    const enemiesToSpawn =
      gameState.enemiesToSpawnPerLevel[gameState.currentLevel - 1] || 5;
    this.spawnEnemies(enemiesToSpawn);
    console.log(
      `Spawned ${enemiesToSpawn} enemies. Total active enemies: ${this.enemies.getLength()}`
    );

    this.physics.add.collider(this.player, this.enemies);

    // HUD setup using the utility
    this.hudElements = setupHUD(this, gameState);
    this.hudElements.updateHealthBar(); // Initial health bar update

    console.log("BaseGameScene: Created successfully.");
  }

  update(time, delta) {
    // Handle pause logic first, before player movement
    // Now using the globally imported 'playerInput' for touch pause state
    if (this.keys.keyESC.isDown || playerInput.pause) {
      if (!this.pauseButtonPressed) {
        // Prevent rapid toggling if key/button held down
        this.togglePause();
        this.pauseButtonPressed = true;
      }
    } else {
      this.pauseButtonPressed = false;
    }

    if (!this.isPaused) {
      this.updatePlayerMovement();
      this.hudElements.updateHealthBar(); // Call from HUD utility

      this.enemies.children.each(function (enemy) {
        if (this.player && enemy.active) {
          this.physics.moveToObject(enemy, this.player, 100);
        }
      }, this);

      // IMPORTANT: Reset single-press action flags AFTER they've been checked in update
      // This prevents them from being true for multiple frames
      // We do this here in BaseGameScene because BaseGameScene is where these actions are consumed
      playerInput.punch = false;
      playerInput.kick = false;
      // playerInput.pause = false; // The pause logic handles resetting its own flag
    }
  }

  updatePlayerMovement() {
    if (!this.player) return;

    // --- Get effective input state ---
    // Use the globally imported 'playerInput' directly here!
    const isLeftPressed = this.cursors?.left.isDown || playerInput.left;
    const isRightPressed = this.cursors?.right.isDown || playerInput.right;
    const isUpPressed = this.cursors?.up.isDown || playerInput.up;
    const isDownPressed = this.cursors?.down.isDown || playerInput.down;

    // LOGGING INPUT STATE (keep these for now, they are helpful)
    if (isLeftPressed || isRightPressed || isUpPressed || isDownPressed) {
      console.log(
        `[BaseGameScene] Input State: L:${isLeftPressed} R:${isRightPressed} U:${isUpPressed} D:${isDownPressed}`
      );
      // Log the raw playerInput, which should now show values
      console.log(
        `[BaseGameScene] Raw PlayerInput: ${JSON.stringify(playerInput)}`
      );
    }

    this.player.setVelocityX(0);
    this.player.setVelocityY(0);

    if (isLeftPressed) {
      this.player.setVelocityX(-160);
      this.player.setFlipX(true);
      this.player.anims.play(
        this.player.name === "black_fighter"
          ? "black_fighter_walk"
          : "red_fighter_walk",
        true
      );
    } else if (isRightPressed) {
      this.player.setVelocityX(160);
      this.player.setFlipX(false);
      this.player.anims.play(
        this.player.name === "black_fighter"
          ? "black_fighter_walk"
          : "red_fighter_walk",
        true
      );
    }

    if (isUpPressed) {
      this.player.setVelocityY(-160);
      if (!isLeftPressed && !isRightPressed) {
        this.player.anims.play(
          this.player.name === "black_fighter"
            ? "black_fighter_walk"
            : "red_fighter_walk",
          true
        );
      }
    } else if (isDownPressed) {
      this.player.setVelocityY(160);
      if (!isLeftPressed && !isRightPressed) {
        this.player.anims.play(
          this.player.name === "black_fighter"
            ? "black_fighter_walk"
            : "red_fighter_walk",
          true
        );
      }
    }

    if (!isLeftPressed && !isRightPressed && !isUpPressed && !isDownPressed) {
      this.player.anims.play(
        this.player.name === "black_fighter" ? "idle_black" : "idle_red"
      );
    }

    // Example: Handle punch/kick from shared playerInput
    if (playerInput.punch) {
      this.handlePunch();
    }
    if (playerInput.kick) {
      this.handleKick();
    }
  }

  //=================== UPDATE BASE (shared game loop) ===================
  updateBase() {
    this.background.tilePositionX = this.cameras.main.scrollX;
    // this.isPaused check is now in the main update method.

    // --- Enemy updates ---
    if (this.enemies && this.enemies.children) {
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
      }, this);
    }

    // --- Boss hitbox debug ---
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

    // --- Boss behavior ---
    this.updateBossBehavior();

    // --- Projectiles ---
    // The commented out block below was a duplicate in your original file.
    // The `throwBone` function adds to `this.projectiles` and manages their lifespan.
    // The filter and destroy logic for `this.projectiles` could be handled here or in `throwBone`.
    // Keeping only the boss projectile group for now, `this.projectiles` isn't managed automatically by Phaser groups.
    if (this.projectiles) {
      this.projectiles = this.projectiles.filter((bone) => bone && bone.active);
      this.projectiles.forEach((bone, index) => {
        if (bone && bone.active) {
          bone.rotation += bone.rotationSpeed * (this.game.loop.delta / 1000);
          if (
            bone.x < this.cameras.main.worldView.x - 50 ||
            bone.x > this.cameras.main.worldView.x + config.width + 50
          ) {
            bone.destroy();
          }
        }
      });
    }

    // --- World extension trigger ---
    const extensionTriggerX = this.worldWidth - 600;
    if (
      this.player.x > extensionTriggerX &&
      this.worldWidth < this.maxWorldWidth
    ) {
      this.extendWorld();
    }
  }

  //=================== BOSS BEHAVIOR ===================
  updateBossBehavior() {
    if (!(this.boss && this.boss.active)) return;

    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.boss.x,
      this.boss.y,
      this.player.x,
      this.player.y
    );

    const detectionRangeEnter = 500;
    const detectionRangeExit = 550;
    const isEngaging =
      this.boss.isEngaging || distanceToPlayer <= detectionRangeEnter;
    this.boss.isEngaging = distanceToPlayer <= detectionRangeExit;

    if (!isEngaging) {
      const now = this.time.now;
      if (
        this.boss.x < this.bossPatrolMinX - 10 ||
        this.boss.x > this.bossPatrolMaxX + 10
      ) {
        const targetX = this.boss.patrolTargetX; // This property needs to be set on the boss object or calculate it
        const speed = 40;
        if (Math.abs(this.boss.x - targetX) > 5) {
          this.boss.body.setVelocityX(this.boss.x > targetX ? -speed : speed);
          this.boss.flipX = this.boss.x > targetX;
          // console.log("Boss returning to patrol - x:", this.boss.x, "targetX:", targetX, "flipX:", this.boss.flipX);
        } else {
          this.boss.body.setVelocityX(0);
          this.boss.x = targetX;
        }
      } else {
        if (!this.boss.lastPatrolFlip || now - this.boss.lastPatrolFlip > 500) {
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
            // console.log("Boss patrol flip - x:", this.boss.x, "direction:", this.bossPatrolDirection, "flipX:", this.boss.flipX);
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
          this.boss.play("enemy_zombie_boss_attack1", true); // Ensure this animation exists
          this.boss.once("animationcomplete", (animation) => {
            if (animation.key === "enemy_zombie_boss_attack1") {
              this.throwBone();
            }
          });
          this.bossLastAttack = now;
        }
      }
    }

    if (this.bossText) {
      this.bossText.setPosition(this.boss.x, this.boss.y - 80);
    }
    if (this.bossHealthBar && this.bossHealthBarBg) {
      const barX = this.boss.x;
      const barY = this.boss.y - 100;
      this.bossHealthBarBg.setPosition(barX, barY);
      this.bossHealthBar.setPosition(barX, barY);
      this.bossHealthBar.width = (this.bossHealth / this.bossMaxHealth) * 150; // Use bossMaxHealth
    }

    const bossYMin = config.height - 260 * this.scaleFactor;
    const bossYMax = config.height - 55 * this.scaleFactor;
    this.boss.y = Phaser.Math.Clamp(this.boss.y, bossYMin, bossYMax);
  }

  //=================== CHECK WIN CONDITION ===========================
  checkWinCondition() {
    const enemiesRemaining = this.enemies ? this.enemies.countActive(true) : 0;
    // console.log(
    //   "Win condition check: enemies=",
    //   enemiesRemaining,
    //   "bossSpawned=",
    //   this.bossSpawned,
    //   "bossDefeated=",
    //   this.bossDefeated,
    //   "bossActive=",
    //   this.boss && this.boss.active
    // );
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
      this.portal.play("portal"); // Ensure 'portal' animation exists

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

  //===================EXTEND WORLD====================================
  extendWorld() {
    if (this.worldLocked) return;

    const extensionSize = 2000;
    this.worldWidth += extensionSize;

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

    // Update player bounds, though setCollideWorldBounds handles most of it
    this.player.body.setBoundsRectangle(
      new Phaser.Geom.Rectangle(0, 0, this.worldWidth, this.worldHeight)
    );

    // Spawn more enemies in the newly extended area
    this.spawnEnemies(3); // Spawn 3 more enemies each time
  }

  // Placeholder for spawning enemies - implement actual logic
  spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(
        this.worldWidth - 600,
        this.worldWidth - 100
      );
      const y = Phaser.Math.Between(config.height - 200, config.height - 50); // Keep enemies on the ground level
      const enemy = this.enemies.create(x, y, "enemy_zombie1_walk");
      enemy.setScale(0.6).play("walk_zombie1", true); // Ensure "walk_zombie1" animation exists and plays
      this.physics.add.existing(enemy);
      enemy.body.setSize(30, 40);
      enemy.body.setOffset((enemy.width - 30) / 2, enemy.height - 40);
      enemy.body.setCollideWorldBounds(true);
      enemy.body.setImmovable(true); // Prevents player from pushing enemies
      enemy.health = 1;
      enemy.isHitByAttack = false; // Flag to prevent multiple hits from one attack frame
      enemy.type = i % 2 === 0 ? "fast" : "standard"; // Example enemy types

      // Debug hitbox visual for enemy
      enemy.hitboxVisual = this.add
        .rectangle(
          enemy.x + (enemy.width - 30) / 2,
          enemy.y + (enemy.height - 40),
          30,
          40,
          0xff0000,
          0.5
        )
        .setOrigin(0.5, 1) // Origin at bottom-center
        .setDepth(5);
    }
    console.log(
      `Spawned ${count} enemies. Total active enemies:`,
      this.enemies.countActive(true)
    );
  }

  spawnBoss() {
    if (this.bossSpawned) return;
    console.log("Spawning boss!");
    this.bossSpawned = true;
    this.worldLocked = true; // Lock world when boss appears

    // Destroy remaining regular enemies
    this.enemies.children.each((enemy) => enemy.destroy());
    this.enemies.clear(true, true);

    const bossX = this.worldWidth - 300; // Position boss at end of current world
    const bossY = config.height - 150; // Adjust Y position

    this.boss = this.physics.add
      .sprite(bossX, bossY, "enemy_zombie_boss_walk")
      .setScale(1.5)
      .play("zombie_boss_walk", true) // Ensure animation exists
      .setDepth(10);

    this.boss.body.setSize(100, 150).setOffset(50, 50); // Adjust hitbox
    this.boss.body.setCollideWorldBounds(true);
    this.boss.body.setImmovable(true);
    this.boss.health = this.bossMaxHealth;
    this.boss.isEngaging = false; // Custom property for boss behavior
    this.boss.lastAttack = 0; // Last attack time
    this.boss.attackCooldown = 2000; // Cooldown between attacks
    this.boss.patrolTargetX = bossX; // Initialize patrol target

    // Boss HUD
    this.bossText = this.add
      .text(this.boss.x, this.boss.y - 80, "BIGFOOT", {
        fontFamily: "Press Start 2P",
        fontSize: "24px",
        fill: "#FFF",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(11);

    this.bossHealthBarBg = this.add
      .rectangle(this.boss.x, this.boss.y - 100, 150, 20, 0x333333)
      .setOrigin(0.5)
      .setDepth(11);
    this.bossHealthBar = this.add
      .rectangle(this.boss.x, this.boss.y - 100, 150, 20, 0xff0000)
      .setOrigin(0.5)
      .setDepth(11);
    this.bossHealthBar.width = (this.bossHealth / this.bossMaxHealth) * 150;

    // Debug hitbox visual for boss
    this.bossHitboxVisual = this.add
      .rectangle(
        this.boss.x + this.boss.body.offset.x,
        this.boss.y + this.boss.body.offset.y,
        this.boss.body.width,
        this.boss.body.height,
        0x0000ff,
        0.3
      )
      .setOrigin(0.5, 0.5)
      .setDepth(5);

    // Add collision for player vs boss
    this.physics.add.collider(this.player, this.boss);
    this.physics.add.overlap(
      this.player,
      this.boss,
      this.handlePlayerBossCollision,
      null,
      this
    );
    this.physics.add.overlap(
      this.projectiles,
      this.boss,
      this.projectileHitsBoss,
      null,
      this
    );

    // Lock camera when boss spawns and pan to boss
    this.cameras.main.stopFollow(); // Stop following player temporarily
    this.cameras.main.pan(
      bossX,
      config.height / 2,
      1000,
      "Power2",
      true,
      (camera, progress) => {
        if (progress === 1) {
          this.cameras.main.startFollow(this.player, true, 0.09, 0.09); // Resume following player after pan
        }
      }
    );

    console.log("Boss spawned at X:", bossX, "Y:", bossY);
  }

  //===================THROW BONE======================================
  throwBone() {
    if (!this.boss || !this.boss.active) return;

    const offsetX = this.boss.flipX ? -60 : 60;
    const boneX = this.boss.x + offsetX;
    const boneY = this.boss.y;

    const bone = this.physics.add.sprite(boneX, boneY, "bone");
    this.add.existing(bone);
    bone.setDisplaySize(32 * this.scaleFactor, 16 * this.scaleFactor);
    bone.setOrigin(0.5, 0.5);
    bone.body.setSize(32, 16);
    bone.body.allowGravity = false;
    bone.body.setCollideWorldBounds(false);
    bone.body.enable = true;

    const boneSpeed = 300;
    bone.body.setVelocityX(this.boss.flipX ? -boneSpeed : boneSpeed);

    // console.log("Bone spawned at x:", boneX, "y:", boneY, "velocityX:", bone.body.velocity.x, "boss.flipX:", this.boss.flipX);

    bone.rotationSpeed = Phaser.Math.DegToRad(360);

    this.bossProjectiles.add(bone); // Add to group for collision
    // The previous line already sets velocity, no need to repeat: bone.body.setVelocityX(this.boss.flipX ? -boneSpeed : boneSpeed);

    this.time.delayedCall(3000, () => {
      if (bone && bone.active) bone.destroy();
    });

    this.projectiles.push(bone); // Keep in array if you filter manually elsewhere
  }

  /*/===================HUD SETUP=======================================
  setupHUD() {
    const fontSize = 48 * this.scaleFactor;
    const textOffset = 20 * this.scaleFactor;
    const barHeight = 30 * this.scaleFactor;

    this.levelText = this.add
      .text(
        textOffset,
        textOffset,
        `Level ${gameState.currentLevel}: ${
          gameState.levelNames[gameState.currentLevel - 1]
        }`,
        {
          fontFamily: "Press Start 2P",
          fontSize: `${fontSize}px`,
          fill: "#FFF",
          stroke: "#000",
          strokeThickness: 4,
        }
      )
      .setOrigin(0)
      .setScrollFactor(0);

    this.healthBarBg = this.add
      .rectangle(
        textOffset,
        textOffset + fontSize,
        300 * this.scaleFactor,
        barHeight,
        0x333333
      )
      .setOrigin(0)
      .setScrollFactor(0);

    this.healthBar = this.add
      .rectangle(
        textOffset,
        textOffset + fontSize,
        (gameState.playerHealth / gameState.maxHealth) * 300 * this.scaleFactor,
        barHeight,
        0xff0000
      )
      .setOrigin(0)
      .setScrollFactor(0);

    this.healthText = this.add
      .text(
        textOffset,
        textOffset + fontSize,
        `Health: ${gameState.playerHealth}`,
        {
          fontFamily: "Press Start 2P",
          fontSize: `${fontSize}px`,
          fill: "#FFF",
          stroke: "#000",
          strokeThickness: 4,
        }
      )
      .setOrigin(0)
      .setScrollFactor(0);

    this.scoreText = this.add
      .text(
        config.width - textOffset, // Use config.width
        textOffset,
        `Score: ${gameState.score}`,
        {
          fontFamily: "Press Start 2P",
          fontSize: `${24 * this.scaleFactor}px`,
          fill: "#FFF",
          stroke: "#000",
          strokeThickness: 4,
        }
      )
      .setOrigin(1, 0)
      .setScrollFactor(0);
  }

  updateHUD() {
    this.healthBar.width =
      (gameState.playerHealth / gameState.maxHealth) * 300 * this.scaleFactor; // Maintain scale
    this.healthText.setText(`Health: ${gameState.playerHealth}`);
    this.scoreText.setText(`Score: ${gameState.score}`);
  }
*/
  //===================PAUSE GAME======================================
  /*togglePause() {
    if (this.isPaused) {
      this.isPaused = false;
      this.physics.world.isPaused = false;
      if (this.pauseMenu) this.pauseMenu.destroy();
      this.pauseMenu = null;
    } else {
      this.isPaused = true;
      this.physics.world.isPaused = true;

      this.pauseMenu = this.add
        .container(config.width / 2, config.height / 2) // Use config.width/height
        .setDepth(100)
        .setScrollFactor(0); // Make sure pause menu is fixed to camera

      const pauseBg = this.add.rectangle(0, 0, 300, 200, 0x000000, 0.8);
      this.pauseMenu.add(pauseBg);

      const pauseText = this.add
        .text(0, -50, "PAUSED", {
          fontSize: "32px",
          fill: "#FFF",
          fontFamily: "Arial", // Consider using 'Press Start 2P' here too
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
        this.scene.start("TitleScene"); // Go back to title
      });
      quitText.on("pointerover", () => quitText.setStyle({ fill: "#FF0" }));
      quitText.on("pointerout", () => quitText.setStyle({ fill: "#0F0" }));
      this.pauseMenu.add(quitText);
    }
  }*/

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();
      this.scene.pause();
      console.log("Game Paused");
    } else {
      this.physics.resume();
      this.scene.resume();
      console.log("Game Resumed");
    }
  }

  // --- Collision/Attack Handlers (Stubs - Implement Fully) ---
  handlePlayerEnemyCollision(player, enemy) {
    if (!enemy.isHitByAttack) {
      // Prevent rapid health drain
      gameState.playerHealth -= 10; // Example damage
      this.updateHUD();
      // Add a brief invulnerability or flash effect for player (e.g., this.player.setTint(0xff0000); this.time.delayedCall(200, () => this.player.clearTint());)
      // Player might need its own `isInvulnerable` flag and timer
      enemy.isHitByAttack = true; // This enemy has hit player recently
      this.time.delayedCall(500, () => {
        enemy.isHitByAttack = false;
      });
      if (gameState.playerHealth <= 0) {
        this.scene.start("GameOverScene");
      }
    }
  }

  handlePlayerBossCollision(player, boss) {
    if (boss.active && !boss.isHitByAttack) {
      // Prevent rapid hits from boss
      gameState.playerHealth -= 15; // More damage from boss
      this.updateHUD();
      // Add player invulnerability/flash if needed
      boss.isHitByAttack = true; // Boss hit player recently
      this.time.delayedCall(1000, () => {
        boss.isHitByAttack = false;
      });
      if (gameState.playerHealth <= 0) {
        this.scene.start("GameOverScene");
      }
    }
  }

  projectileHitsBoss(projectile, boss) {
    if (boss.active && !boss.isHitByAttack) {
      // Prevent rapid hits from player projectiles
      projectile.destroy(); // Destroy projectile on hit
      boss.health -= 5; // Example damage
      this.bossHealthBar.width = (boss.health / this.bossMaxHealth) * 150; // Update bar
      boss.isHitByAttack = true; // Boss invulnerability for a short duration
      this.time.delayedCall(300, () => {
        boss.isHitByAttack = false;
      });
      if (boss.health <= 0) {
        boss.destroy();
        if (this.bossText) this.bossText.destroy();
        if (this.bossHealthBar) this.bossHealthBar.destroy();
        if (this.bossHealthBarBg) this.bossHealthBarBg.destroy();
        if (this.bossHitboxVisual) this.bossHitboxVisual.destroy();
        this.bossDefeated = true;
        this.checkWinCondition(); // Re-check to spawn portal
      }
    }
  }

  playerHitByBossProjectile(player, projectile) {
    if (player.active) {
      projectile.destroy();
      gameState.playerHealth -= 20; // Example damage
      this.updateHUD();
      if (gameState.playerHealth <= 0) {
        this.scene.start("GameOverScene");
      }
    }
  }

  // Dummy methods for player actions (will be called from Desktop/MobileGameScene)
  handlePunch() {
    if (!this.player || this.isPaused) return;

    console.log("Punch initiated!"); // Changed from "Player Punches!"
    // Implement player punch animation and attack logic
    const fighter = gameState.selectedFighter;
    const punchAnimKey = `${fighter}_fighter_punch`; // Assuming you have individual punch images/anims

    if (
      this.player.anims.currentAnim &&
      this.player.anims.currentAnim.key.includes("punch")
    )
      return; // Prevent spamming

    this.player.play(punchAnimKey);
    this.player.once("animationcomplete", (animation) => {
      if (animation.key === punchAnimKey) {
        const idleAnimKey = `${fighter}_idle`;
        this.player.play(idleAnimKey, true); // Return to idle after attack
      }
    });

    // Implement hitbox for punch
    const attackRange = 50;
    const attackOffset = this.player.flipX ? -30 : 30; // Adjust based on player direction
    const attackHitbox = this.add.rectangle(
      this.player.x + attackOffset,
      this.player.y,
      attackRange,
      this.player.height,
      0xff0000,
      0.3 // Semi-transparent for debug
    );
    this.physics.world.enable(attackHitbox);
    attackHitbox.body.setAllowGravity(false);
    attackHitbox.body.setImmovable(true);
    attackHitbox.body.moves = false; // Don't move with physics

    this.physics.overlap(attackHitbox, this.enemies, (hb, enemy) => {
      if (!enemy.isHitByAttack) {
        enemy.health -= 1; // Damage enemy
        // Play damage animation or flash effect on enemy
        enemy.isHitByAttack = true; // Set flag on enemy
        this.time.delayedCall(200, () => {
          enemy.isHitByAttack = false;
        }); // Reset after delay
        if (enemy.health <= 0) {
          if (enemy.hitboxVisual) enemy.hitboxVisual.destroy();
          enemy.destroy();
          gameState.score += 10; // Example score
          this.updateHUD();
          this.checkWinCondition();
        }
      }
    });
    this.physics.overlap(attackHitbox, this.boss, (hb, boss) => {
      if (boss.active && !boss.isHitByAttack) {
        this.projectileHitsBoss(hb, boss); // Reuse logic
      }
    });

    // Destroy hitbox after a short duration
    this.time.delayedCall(100, () => {
      attackHitbox.destroy();
    });
  }

  handleKick() {
    if (!this.player || this.isPaused) return;

    console.log("Kick initiated!"); // Changed from "Player Kicks!"
    // Implement player kick animation and attack logic
    const fighter = gameState.selectedFighter;
    const kickAnimKey = `${fighter}_fighter_kick`; // Assuming you have individual kick images/anims

    if (
      this.player.anims.currentAnim &&
      this.player.anims.currentAnim.key.includes("kick")
    )
      return;

    this.player.play(kickAnimKey);
    this.player.once("animationcomplete", (animation) => {
      if (animation.key === kickAnimKey) {
        const idleAnimKey = `${fighter}_idle`;
        this.player.play(idleAnimKey, true);
      }
    });

    // Implement hitbox for kick (similar to punch but possibly different size/offset)
    const attackRange = 70; // Longer range
    const attackOffset = this.player.flipX ? -40 : 40;
    const attackHitbox = this.add.rectangle(
      this.player.x + attackOffset,
      this.player.y + 10, // Slightly lower for kick
      attackRange,
      this.player.height / 2,
      0x00ff00,
      0.3
    );
    this.physics.world.enable(attackHitbox);
    attackHitbox.body.setAllowGravity(false);
    attackHitbox.body.setImmovable(true);
    attackHitbox.body.moves = false;

    this.physics.overlap(attackHitbox, this.enemies, (hb, enemy) => {
      if (!enemy.isHitByAttack) {
        enemy.health -= 2; // More damage from kick
        enemy.isHitByAttack = true;
        this.time.delayedCall(200, () => {
          enemy.isHitByAttack = false;
        });
        if (enemy.health <= 0) {
          if (enemy.hitboxVisual) enemy.hitboxVisual.destroy();
          enemy.destroy();
          gameState.score += 20;
          this.updateHUD();
          this.checkWinCondition();
        }
      }
    });
    this.physics.overlap(attackHitbox, this.boss, (hb, boss) => {
      if (boss.active && !boss.isHitByAttack) {
        this.projectileHitsBoss(hb, boss); // Reuse logic
      }
    });

    this.time.delayedCall(100, () => {
      attackHitbox.destroy();
    });
  }

  //=================== CLEANUP ===================
  shutdown() {
    console.log(`${this.scene.key}: Shutting down scene.`);
    // Cleanup player, enemies, boss, projectiles, HUD, pause menu
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    if (this.pauseMenu) {
      this.pauseMenu.destroy();
      this.pauseMenu = null;
    }
    if (this.background) {
      this.background.destroy();
      this.background = null;
    }

    if (this.enemies && this.enemies.children) {
      this.enemies.children.each((enemy) => {
        if (enemy && enemy.hitboxVisual) enemy.hitboxVisual.destroy();
        if (enemy) enemy.destroy();
      }, this);
      this.enemies.clear(true, true);
      this.enemies = null;
    }

    if (this.boss) {
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

    if (this.portal) {
      this.portal.destroy();
      this.portal = null;
    }
    if (this.portalText) {
      this.portalText.destroy();
      this.portalText = null;
    }
    if (this.portalCollider) {
      // If collider exists, remove it from physics world
      this.physics.world.removeCollider(this.portalCollider);
      this.portalCollider = null;
    }

    // Reset game state for next level/playthrough if necessary
    // gameState.playerHealth = gameState.maxHealth; // Example, reset as needed
    // gameState.score = 0; // Example
    // gameState.currentLevel = 1; // Example

    // Ensure all event listeners are properly removed if you added custom ones with `.on()`
    this.events.off("shutdown", this.shutdown, this); // Remove itself from shutdown events
    this.events.off("destroy"); // Remove all scene events
  }
}

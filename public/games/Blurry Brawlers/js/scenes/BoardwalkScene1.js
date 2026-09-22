class BoardwalkScene1 extends Phaser.Scene {
  constructor() {
    super("BoardwalkScene1");
    this.player = null;
    this.cursors = null;
    this.attackKey = null;
    this.jumpKey = null;
    this.luke = null;
  }

  //======================PRELOAD============================\\
  preload() {
    // Assets are loaded in PreloadScene.js
  }

  //======================CREATE============================\\
  create() {
    this.isTransitioning = false;

    // Background
    const bg = this.add.image(400, 300, "boardwalk-bg-1");
    bg.setDisplaySize(800, 600);

    // UI Text
    this.add
      .text(
        400,
        30,
        "Boardwalk - Section 1  |  Arrows to move  |  Z = Attack  |  SPACE = Jump",
        {
          fontSize: "18px",
          color: "#ffffff",
          fontFamily: "monospace",
        },
      )
      .setOrigin(0.5);

    // Bounds
    const bounds = {
      left: 30,
      right: 770,
      top: 440,
      bottom: 520,
    };

    this.leftBound = bounds.left;
    this.rightBound = bounds.right;
    this.topBound = bounds.top;
    this.bottomBound = bounds.bottom;

    // ===================== ENEMY TRACKING =====================
    this.enemies = []; // Array to hold all active enemies
    this.enemyCount = 0; // How many enemies are still alive

    // Create Nate (Player)
    this.player = new Player(this, 900, 490, "nate", bounds);

    // Create Luke (static companion)
    this.luke = this.add
      .sprite(920, 470, "luke-idle")
      .setFlipX(true)
      .setScale(0.11)
      .setOrigin(0.5, 1);

    // Input Keys
    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey("Z");
    this.kickKey = this.input.keyboard.addKey("X");
    this.jumpKey = this.input.keyboard.addKey("SPACE");
    this.debugKey = this.input.keyboard.addKey("B");

    this.debugHitboxes = true;

    this.canExitLeft = false;

    // Start entrance sequence
    this.startEntranceSequence();

    // Create Nate's health bar at the bottom
    this.createHealthBar();
    this.debugManager = new DebugManager(this);
  }

  //======================CREATE HEALTH BAR============================\\
  createHealthBar() {
    this.healthBar = [];
    const barX = 350;
    const barY = 560;
    const segmentWidth = 28;
    const segmentHeight = 18;
    const gap = 6;

    for (let i = 0; i < 5; i++) {
      const segment = this.add.rectangle(
        barX + i * (segmentWidth + gap),
        barY,
        segmentWidth,
        segmentHeight,
        0x00ff00,
      );
      segment.setStrokeStyle(2, 0xffffff);
      this.healthBar.push(segment);
    }

    // Nate label
    this.add
      .text(barX - 70, barY, "NATE", {
        fontSize: "24px",
        color: "#ffffff",
        fontFamily: "monospace",
      })
      .setOrigin(0, 0.5);
  }

  //======================START ENTRANCE SEQUENCE============================\\
  startEntranceSequence() {
    this.input.keyboard.enabled = false;
    this.entranceInProgress = true;

    const originalBounds = this.player.bounds;
    this.player.bounds = null;

    const nateStartX = 920;
    const lukeStartX = 950;
    const nateTargetX = 580;
    const lukeTargetX = 620;

    this.player.sprite.x = nateStartX;
    this.luke.x = lukeStartX;

    this.player.sprite.setFlipX(true);
    this.luke.setFlipX(true);

    this.player.sprite.play("nate-walk", true);
    this.player.sprite.setScale(this.player.walkScale);

    this.tweens.add({
      targets: this.player.sprite,
      x: nateTargetX,
      duration: 1400,
      ease: "Linear",
      onComplete: () => {
        this.player.sprite.play("nate-idle");
        this.player.sprite.setScale(this.player.defaultScale);
        this.player.bounds = originalBounds;
        this.entranceInProgress = false;
      },
    });

    this.luke.setTexture("luke-idle");

    this.tweens.add({
      targets: this.luke,
      x: lukeTargetX,
      duration: 1600,
      ease: "Linear",
      onComplete: () => {
        this.spawnEnemyEntrance();
      },
    });
  }

  //======================START ENTRANCE SEQUENCE============================\\
  spawnEnemyEntrance() {
    // Create Crab 1
    const crab1 = new Enemy(this, 180, 650, "crab-jump");
    crab1.sprite.setOrigin(0.5, 1);
    crab1.health = 3;
    crab1.sprite.setFlipX(true);

    // Create Crab 2
    const crab2 = new Enemy(this, 280, 680, "crab-jump");
    crab2.sprite.setOrigin(0.5, 1);
    crab2.health = 3;
    crab2.sprite.setFlipX(true);

    // Pass bounds to both
    const bounds = {
      left: this.leftBound,
      right: this.rightBound,
      top: this.topBound,
      bottom: this.bottomBound,
    };

    crab1.bounds = bounds;
    crab2.bounds = bounds;

    // === Add to central enemies array ===
    this.enemies.push(crab1);
    this.enemies.push(crab2);
    this.enemyCount = this.enemies.length;

    // Show debug hitboxes (optional)
    if (crab1.hitboxDebug) crab1.hitboxDebug.setVisible(this.debugHitboxes);
    if (crab2.hitboxDebug) crab2.hitboxDebug.setVisible(this.debugHitboxes);

    // Jump up animations
    this.tweens.add({
      targets: crab1.sprite,
      y: 460,
      duration: 700,
      ease: "Back.easeOut",
      onComplete: () => {
        if (crab1.sprite?.active) crab1.sprite.setTexture("crab-idle");
      },
    });

    this.tweens.add({
      targets: crab2.sprite,
      y: 475,
      duration: 850,
      ease: "Back.easeOut",
      delay: 200,
      onComplete: () => {
        if (crab2.sprite?.active) crab2.sprite.setTexture("crab-idle");
      },
    });

    this.time.delayedCall(1200, () => {
      this.input.keyboard.enabled = true;
    });
  }

  //======================DECREMENT ENEMY COUNT============================\\
  decrementEnemyCount() {
    this.enemyCount--;

    // When all enemies are dead, allow player to exit left
    if (this.enemyCount <= 0) {
      this.canExitLeft = true;
      console.log("All enemies defeated! Player can now exit left.");
    }
  }

  //======================UPDATE HEALTH BAR============================\\
  updateHealthBar() {
    for (let i = 0; i < this.healthBar.length; i++) {
      if (i < this.player.health) {
        this.healthBar[i].setFillStyle(0x00ff00);
      } else {
        this.healthBar[i].setFillStyle(0x000000);
      }
    }
  }

  //======================CHECK PLAYER DEATH============================\\
  checkPlayerDeath() {
    if (this.player.health <= 0 && !this.player.isDead) {
      this.player.die();

      this.add
        .text(400, 280, "GAME OVER", {
          fontSize: "52px",
          color: "#ff2222",
          fontFamily: "monospace",
          stroke: "#000000",
          strokeThickness: 6,
        })
        .setOrigin(0.5);

      this.add
        .text(400, 340, "Press R to Restart", {
          fontSize: "24px",
          color: "#ffffff",
          fontFamily: "monospace",
        })
        .setOrigin(0.5);

      this.input.keyboard.once("keydown-R", () => {
        this.scene.restart();
      });

      return true; // Signal that player is dead
    }
    return false;
  }

  //======================HELPER METHOD============================\\
  getActiveEnemies() {
    return this.enemies.filter((e) => e && !e.isDead);
  }

  //======================CHECK EXIT CONDITION============================\\
  checkExitCondition() {
    // Check if both crabs are dead (or don't exist)
    const crab1Dead = !this.crab1 || this.crab1.isDead;
    const crab2Dead = !this.crab2 || this.crab2.isDead;

    // If both are dead and exit is still locked, unlock it
    if (crab1Dead && crab2Dead && !this.canExitLeft) {
      this.canExitLeft = true;
      console.log(
        "%c[Scene] Exit is now open! Walk left to continue.",
        "color: lime",
      );

      // Optional: Give visual feedback
      this.add
        .text(400, 80, "Exit Open →", {
          fontSize: "20px",
          color: "#00ff88",
          fontFamily: "monospace",
        })
        .setOrigin(0.5);
    }
  }

  //======================UPDATE ENEMIES============================\\
  updateEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (!enemy || enemy.isDead) {
        // Remove dead enemies from the array
        this.enemies.splice(i, 1);
        continue;
      }

      enemy.updateAI(this.player);
      enemy.update();
    }
  }

  //======================UPDATE COLLISIONS============================\\
  updateCollisions() {
    if (!this.player?.hurtboxDebug) return;

    const playerHurtbox = new Phaser.Geom.Rectangle(
      this.player.sprite.x - this.player.hurtboxWidth / 2,
      this.player.sprite.y +
        this.player.hurtboxOffsetY -
        this.player.hurtboxHeight / 2,
      this.player.hurtboxWidth,
      this.player.hurtboxHeight,
    );

    for (const enemy of this.enemies) {
      if (!enemy || !enemy.isAttacking || !enemy.attackHitboxDebug) continue;

      const enemyAttackBox = enemy.getAttackHitbox();

      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          enemyAttackBox,
          playerHurtbox,
        )
      ) {
        this.player.takeDamage(1, enemy.sprite.x);
        this.updateHealthBar();
      }
    }
  }

  //======================UPDATE DEBUG============================\\
  updateDebug() {
    if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
      this.debugHitboxes = !this.debugHitboxes;

      this.player.showHitboxes = this.debugHitboxes;
      if (this.player.hurtboxDebug) {
        this.player.hurtboxDebug.setVisible(this.debugHitboxes);
      }

      // Loop through all enemies instead of hardcoded names
      for (const enemy of this.enemies) {
        if (!enemy) continue;

        if (enemy.hitboxDebug) {
          enemy.hitboxDebug.setVisible(this.debugHitboxes);
        }

        if (enemy.attackHitboxDebug) {
          const show = this.debugHitboxes && enemy.isAttacking;
          enemy.attackHitboxDebug.setVisible(show);
        }
      }
    }
  }

  //======================UPDATE============================\\
  update() {
    if (!this.player) return;
    if (this.debugManager) this.debugManager.update();

    // 1. Check player death first
    if (this.checkPlayerDeath()) return;

    // 2. Skip updates during entrance
    if (this.entranceInProgress) return;

    // 3. Update player (pass active enemies from array)
    const activeEnemies = this.getActiveEnemies();
    this.player.update(
      this.cursors,
      this.attackKey,
      this.jumpKey,
      this.kickKey,
      activeEnemies,
    );

    // 4. Update all enemies (AI + visuals)
    this.updateEnemies();

    // 5. Handle collisions
    this.updateCollisions();

    // 6. Debug toggle
    this.updateDebug();

    // 7. Depth sorting
    if (this.player.sprite && this.luke) {
      this.player.sprite.setDepth(this.player.sprite.y);
      this.luke.setDepth(this.luke.y);
    }

    // 8. Scene transition (now fully based on enemyCount)
    if (
      this.player.sprite.x <= this.leftBound + 1 &&
      this.canExitLeft &&
      !this.isTransitioning
    ) {
      this.isTransitioning = true;

      // Kill any remaining tweens/timers from enemies
      this.tweens.killAll();
      this.time.removeAllEvents();

      console.log(
        "%c[Scene 1] Transitioning to BoardwalkScene2...",
        "color: cyan",
      );
      this.scene.start("BoardwalkScene2");
    }
  }
}

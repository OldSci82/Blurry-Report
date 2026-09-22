class BoardwalkScene2 extends Phaser.Scene {
  constructor() {
    super("BoardwalkScene2");
    this.player = null;
    this.cursors = null;
    this.attackKey = null;
    this.kickKey = null;
    this.jumpKey = null;
    this.debugKey = null;
    this.luke = null;
    this.enemies = [];
    this.enemyCount = 0;
    this.canExitLeft = false;
    this.entranceInProgress = false;
    this.isTransitioning = false;
  }

  preload() {
    // Assets loaded in PreloadScene
  }

  create() {
    // Background
    const bg = this.add.image(400, 300, "boardwalk-bg-2");
    bg.setDisplaySize(800, 600);

    // UI
    this.add
      .text(
        400,
        30,
        "Boardwalk - Section 2  |  Arrows = Move  |  Z = Punch  |  X = Kick  |  SPACE = Jump",
        {
          fontSize: "16px",
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

    // Create Nate (Player)
    this.player = new Player(this, 900, 490, "nate", bounds);

    // Create Luke
    this.luke = this.add
      .sprite(950, 470, "luke-idle")
      .setFlipX(true)
      .setScale(0.11)
      .setOrigin(0.5, 1);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey("Z");
    this.kickKey = this.input.keyboard.addKey("X");
    this.jumpKey = this.input.keyboard.addKey("SPACE");
    this.debugKey = this.input.keyboard.addKey("B");

    this.debugHitboxes = true;

    // Health bar
    this.createHealthBar();

    // Start entrance sequence
    this.startEntranceSequence();
    this.debugManager = new DebugManager(this);
  }

  // ===================== HEALTH BAR =====================
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

    this.add
      .text(barX - 70, barY, "NATE", {
        fontSize: "24px",
        color: "#ffffff",
        fontFamily: "monospace",
      })
      .setOrigin(0, 0.5);
  }

  updateHealthBar() {
    for (let i = 0; i < this.healthBar.length; i++) {
      if (i < this.player.health) {
        this.healthBar[i].setFillStyle(0x00ff00);
      } else {
        this.healthBar[i].setFillStyle(0x000000);
      }
    }
  }

  // ===================== PLAYER ENTRANCE =====================
  startEntranceSequence() {
    this.input.keyboard.enabled = false;
    this.entranceInProgress = true;

    const originalBounds = this.player.bounds;
    this.player.bounds = null;

    const nateStartX = 920;
    const lukeStartX = 950;
    const nateTargetX = 620;
    const lukeTargetX = 660;

    this.player.sprite.x = nateStartX;
    this.luke.x = lukeStartX;

    this.player.sprite.setFlipX(true);
    this.luke.setFlipX(true);

    this.player.sprite.play("nate-walk", true);
    this.player.sprite.setScale(this.player.walkScale);

    // Nate walks in
    this.tweens.add({
      targets: this.player.sprite,
      x: nateTargetX,
      duration: 1400,
      ease: "Linear",
      onComplete: () => {
        this.player.sprite.play("nate-idle");
        this.player.sprite.setScale(this.player.defaultScale);
        this.player.bounds = originalBounds;
      },
    });

    this.luke.setTexture("luke-idle");

    // Luke walks in, then spawn enemies
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

  // ===================== ENEMY ENTRANCE =====================
  spawnEnemyEntrance() {
    // Create 2 crabs (you can add a 3rd if you want)
    const crab1 = new Enemy(this, 180, 650, "crab-jump");
    crab1.sprite.setOrigin(0.5, 1);
    crab1.health = 3;
    crab1.sprite.setFlipX(true);

    const crab2 = new Enemy(this, 280, 680, "crab-jump");
    crab2.sprite.setOrigin(0.5, 1);
    crab2.health = 3;
    crab2.sprite.setFlipX(true);

    const bounds = {
      left: this.leftBound,
      right: this.rightBound,
      top: this.topBound,
      bottom: this.bottomBound,
    };

    crab1.bounds = bounds;
    crab2.bounds = bounds;

    this.enemies.push(crab1);
    this.enemies.push(crab2);
    this.enemyCount = this.enemies.length;

    // Show debug hitboxes
    if (crab1.hitboxDebug) crab1.hitboxDebug.setVisible(this.debugHitboxes);
    if (crab2.hitboxDebug) crab2.hitboxDebug.setVisible(this.debugHitboxes);

    // Crab 1 jumps up
    this.tweens.add({
      targets: crab1.sprite,
      y: 460,
      duration: 700,
      ease: "Back.easeOut",
      onComplete: () => {
        if (crab1.sprite?.active) crab1.sprite.setTexture("crab-idle");
      },
    });

    // Crab 2 jumps up (slightly delayed)
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

    // Re-enable input after enemies land
    this.time.delayedCall(1200, () => {
      this.input.keyboard.enabled = true;
      this.entranceInProgress = false;
    });
  }

  // ===================== DECREMENT ENEMY COUNT =====================
  decrementEnemyCount() {
    this.enemyCount--;

    if (this.enemyCount <= 0) {
      this.canExitLeft = true;
      console.log(
        "%c[Scene 2] All enemies defeated! Player can now exit left.",
        "color: lime",
      );
    }
  }

  // ===================== HELPER =====================
  getActiveEnemies() {
    return this.enemies.filter((e) => e && !e.isDead);
  }

  // ===================== UPDATE ENEMIES =====================
  updateEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (!enemy || enemy.isDead) {
        this.enemies.splice(i, 1);
        continue;
      }

      enemy.updateAI(this.player);
      enemy.update();
    }
  }

  // ===================== UPDATE COLLISIONS =====================
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

  // ===================== UPDATE DEBUG =====================
  updateDebug() {
    if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
      this.debugHitboxes = !this.debugHitboxes;
      this.player.showHitboxes = this.debugHitboxes;

      if (this.player.hurtboxDebug) {
        this.player.hurtboxDebug.setVisible(this.debugHitboxes);
      }

      for (const enemy of this.enemies) {
        if (enemy?.hitboxDebug)
          enemy.hitboxDebug.setVisible(this.debugHitboxes);
        if (enemy?.attackHitboxDebug) {
          const show = this.debugHitboxes && enemy.isAttacking;
          enemy.attackHitboxDebug.setVisible(show);
        }
      }
    }
  }

  // ===================== CHECK PLAYER DEATH =====================
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

      return true;
    }
    return false;
  }

  // ===================== UPDATE =====================
  update() {
    if (!this.player) return;
    if (this.debugManager) this.debugManager.update();

    if (this.checkPlayerDeath()) return;
    if (this.entranceInProgress) return;

    // Update player
    const activeEnemies = this.getActiveEnemies();
    this.player.update(
      this.cursors,
      this.attackKey,
      this.jumpKey,
      this.kickKey,
      activeEnemies,
    );

    // Update enemies
    this.updateEnemies();

    // Handle collisions
    this.updateCollisions();

    // Debug toggle
    this.updateDebug();

    // Depth sorting
    if (this.player.sprite && this.luke) {
      this.player.sprite.setDepth(this.player.sprite.y);
      this.luke.setDepth(this.luke.y);
    }

    // Transition to Scene 3 when all enemies are dead
    if (
      this.player.sprite.x <= this.leftBound + 1 &&
      this.canExitLeft &&
      !this.isTransitioning
    ) {
      this.isTransitioning = true;
      this.tweens.killAll();
      this.time.removeAllEvents();
      this.scene.start("BoardwalkScene3");
    }
  }
}

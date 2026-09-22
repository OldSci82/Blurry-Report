class BoardwalkScene3 extends Phaser.Scene {
  constructor() {
    super("BoardwalkScene3");
    this.player = null;
    this.cursors = null;
    this.attackKey = null;
    this.kickKey = null;
    this.jumpKey = null;
    this.debugKey = null;
    this.luke = null;

    this.enemies = [];
    this.enemyCount = 0;
    this.boss = null; // Reference to the Barnacle Boss
    this.bossSpawned = false;
    this.canExitLeft = false;
    this.entranceInProgress = false;
    this.isTransitioning = false;

    this.bossHealthBar = []; // Will hold the big boss health segments
    this.bossHealthBarLabel = null;
  }

  preload() {
    // Assets loaded in PreloadScene
  }

  create() {
    const bg = this.add.image(400, 300, "boardwalk-bg-3");
    bg.setDisplaySize(800, 600);

    this.add
      .text(400, 30, "Boardwalk - Section 3 (Final)  |  Defeat the Boss!", {
        fontSize: "16px",
        color: "#ffffff",
        fontFamily: "monospace",
      })
      .setOrigin(0.5);

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

    // Create Player & Luke
    this.player = new Player(this, 900, 490, "nate", bounds);
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

    this.createHealthBar();
    this.debugManager = new DebugManager(this);

    this.startEntranceSequence();
  }

  // ===================== HEALTH BAR (Player) =====================
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
      this.healthBar[i].setFillStyle(
        i < this.player.health ? 0x00ff00 : 0x000000,
      );
    }
  }

  // ===================== BOSS HEALTH BAR (Top of Screen) =====================
  createBossHealthBar() {
    // Destroy old bar if it exists (safety)
    if (this.bossHealthBar.length > 0) {
      this.bossHealthBar.forEach((seg) => seg.destroy());
      this.bossHealthBar = [];
    }
    if (this.bossHealthBarLabel) {
      this.bossHealthBarLabel.destroy();
    }

    const boss = this.boss;
    if (!boss) return;

    const totalSegments = boss.maxHealth; // Usually 8
    const segmentWidth = 32;
    const segmentHeight = 22;
    const gap = 6;
    const totalWidth = totalSegments * (segmentWidth + gap) - gap;

    const startX = 400 - totalWidth / 2; // Center of screen
    const y = 100; // Top of screen

    // Label above the bar
    this.bossHealthBarLabel = this.add
      .text(400, 75, "BARNACLE BOSS", {
        fontSize: "36px",
        color: "#ff4444",
        fontFamily: "monospace",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Create red segments
    for (let i = 0; i < totalSegments; i++) {
      const segment = this.add.rectangle(
        startX + i * (segmentWidth + gap) + segmentWidth / 2,
        y,
        segmentWidth,
        segmentHeight,
        0xff2222, // Red
      );
      segment.setStrokeStyle(3, 0xffffff);
      this.bossHealthBar.push(segment);
    }
  }

  updateBossHealthBar() {
    if (!this.boss || this.bossHealthBar.length === 0) return;

    const currentHealth = Math.max(0, this.boss.health);
    const maxHealth = this.boss.maxHealth;

    for (let i = 0; i < this.bossHealthBar.length; i++) {
      if (i < currentHealth) {
        this.bossHealthBar[i].setFillStyle(0xff2222); // Red filled
      } else {
        this.bossHealthBar[i].setFillStyle(0x330000); // Dark red / empty
      }
    }
  }

  // ===================== ENTRANCE SEQUENCES =====================
  startEntranceSequence() {
    this.input.keyboard.enabled = false;
    this.entranceInProgress = true;

    const originalBounds = this.player.bounds;
    this.player.bounds = null;

    this.player.sprite.x = 920;
    this.luke.x = 950;
    this.player.sprite.setFlipX(true);
    this.luke.setFlipX(true);

    this.player.sprite.play("nate-walk", true);
    this.player.sprite.setScale(this.player.walkScale);

    this.tweens.add({
      targets: this.player.sprite,
      x: 620,
      duration: 1400,
      ease: "Linear",
      onComplete: () => {
        this.player.sprite.play("nate-idle");
        this.player.sprite.setScale(this.player.defaultScale);
        this.player.bounds = originalBounds;
      },
    });

    this.luke.setTexture("luke-idle");

    this.tweens.add({
      targets: this.luke,
      x: 660,
      duration: 1600,
      ease: "Linear",
      onComplete: () => {
        this.spawnEnemyEntrance(); // Spawn crab goons first
      },
    });
  }

  spawnEnemyEntrance() {
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

    if (crab1.hitboxDebug) crab1.hitboxDebug.setVisible(this.debugHitboxes);
    if (crab2.hitboxDebug) crab2.hitboxDebug.setVisible(this.debugHitboxes);

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
      this.entranceInProgress = false;
    });
  }

  // ===================== BARNACLE BOSS SPAWN =====================
  spawnBarnacleBoss() {
    if (this.bossSpawned) return;

    console.log("%c[Scene 3] Spawning Barnacle Boss!", "color: #ffaa00");

    // Create boss (starts off-screen left)
    const boss = new BarnacleBoss(this, 120, 300, "barnacle-jump", 1.35); //scene,x,y,texture,size
    boss.sprite.setOrigin(0.5, 1);
    boss.health = 8;
    boss.maxHealth = 8;
    boss.type = "barnacle-boss";
    boss.speed = 2.2; // ← Add this line (makes boss move much better)
    boss.detectionRange = 320; // Optional: makes boss start chasing from farther away

    const bounds = {
      left: this.leftBound,
      right: this.rightBound,
      top: this.topBound,
      bottom: this.bottomBound,
    };
    boss.bounds = bounds;

    this.enemies.push(boss);
    this.boss = boss;
    this.bossSpawned = true;
    this.enemyCount = this.enemies.length;
    // === HIDE THE DEFAULT SMALL HEALTH BAR ===
    if (boss.healthBar) boss.healthBar.destroy();
    if (boss.healthBarBg) boss.healthBarBg.destroy();

    // Create the big boss health bar at the top
    this.createBossHealthBar();

    // === IMPORTANT: Face RIGHT toward the player ===
    // Since boss sprites face left by default, we use setFlipX(true) to face right
    boss.sprite.setFlipX(true);

    // Dramatic jump-in from the left
    this.tweens.add({
      targets: boss.sprite,
      x: 280,
      y: 480,
      duration: 900,
      ease: "Back.easeOut",
      onComplete: () => {
        if (boss.sprite && boss.sprite.active) {
          boss.sprite.setTexture("barnacle-idle");

          // Re-apply flip after changing texture (important!)
          boss.sprite.setFlipX(true);
          boss.playIdleAnimation();
        }
      },
    });
  }

  // ===================== ENEMY MANAGEMENT =====================
  decrementEnemyCount() {
    this.enemyCount--;

    // When all regular goons are dead and boss hasn't spawned yet → spawn boss
    if (this.enemyCount <= 0 && !this.bossSpawned) {
      this.spawnBarnacleBoss();
    }

    // When boss is also dead, we can allow exit / portal later
    if (
      this.enemyCount <= 0 &&
      this.bossSpawned &&
      this.boss &&
      this.boss.isDead
    ) {
      this.canExitLeft = true;
      console.log(
        "%c[Scene 3] Boss defeated! Portal can appear next phase.",
        "color: #00ff88",
      );
    }
  }

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

      // Use special AI for the Barnacle Boss
      if (enemy.type === "barnacle-boss") {
        this.updateBarnacleBossAI(enemy);
      } else {
        enemy.updateAI(this.player);
      }

      enemy.update();
    }
  }

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

  updateDebug() {
    if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
      this.debugHitboxes = !this.debugHitboxes;
      this.player.showHitboxes = this.debugHitboxes;

      if (this.player.hurtboxDebug)
        this.player.hurtboxDebug.setVisible(this.debugHitboxes);

      for (const enemy of this.enemies) {
        if (enemy?.hitboxDebug)
          enemy.hitboxDebug.setVisible(this.debugHitboxes);
        if (enemy?.attackHitboxDebug) {
          enemy.attackHitboxDebug.setVisible(
            this.debugHitboxes && enemy.isAttacking,
          );
        }
      }
    }
  }

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
      this.input.keyboard.once("keydown-R", () => this.scene.restart());
      return true;
    }
    return false;
  }

  // ===================== MAIN UPDATE =====================
  update() {
    if (!this.player) return;
    if (this.checkPlayerDeath()) return;
    if (this.entranceInProgress) return;

    if (this.debugManager) this.debugManager.update();

    const activeEnemies = this.getActiveEnemies();
    this.player.update(
      this.cursors,
      this.attackKey,
      this.jumpKey,
      this.kickKey,
      activeEnemies,
    );

    this.updateHealthBar(); // Player health bar
    this.updateBossHealthBar(); // ← Add this line for boss

    this.updateEnemies();
    this.updateCollisions();
    this.updateDebug();

    if (this.player.sprite && this.luke) {
      this.player.sprite.setDepth(this.player.sprite.y);
      this.luke.setDepth(this.luke.y);
    }

    // Temporary exit logic (will be replaced by portal in later phase)
    if (
      this.player.sprite.x <= this.leftBound + 1 &&
      this.canExitLeft &&
      !this.isTransitioning
    ) {
      this.isTransitioning = true;
      this.scene.start("BoardwalkScene3"); // Placeholder
    }
  }
}

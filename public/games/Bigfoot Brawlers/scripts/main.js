//=======================================================//
//=======================INPUT MANAGER===================//
//=======================================================//
class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.isMobile = !this.scene.sys.game.device.os.desktop;

    this.keys = {}; // To store keyboard key objects
    this.mobileButtons = {}; // To store mobile button sprites
    this.pressedState = {
      // To track which actions are currently pressed
      left: false,
      right: false,
      up: false,
      down: false,
      punch: false,
      kick: false,
    };
    this.justPressedState = {
      // To track which actions were just pressed (single frame)
      punch: false,
      kick: false,
    };
    this.prevPressedState = {
      // To compare with current state for justPressed
      punch: false,
      kick: false,
    };

    if (this.isMobile) {
      this.setupMobileControls();
    } else {
      this.setupKeyboardControls();
    }
  }

  setupKeyboardControls() {
    // Add specific keys to be tracked by Phaser's keyboard manager
    this.keys.left = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.A
    );
    this.keys.right = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.D
    );
    this.keys.up = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.W
    );
    this.keys.down = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.S
    );
    this.keys.punch = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.J
    );
    this.keys.kick = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.K
    );

    // No need for explicit keydown/keyup listeners here if using isDown and isJustDown in update
  }

  setupMobileControls() {
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;

    // Movement buttons (left, right, up, down)
    this.mobileButtons.left = this.scene.add
      .sprite(screenWidth - 150, screenHeight - 60, "arrow_button")
      .setScrollFactor(0)
      .setAlpha(0.7)
      .setInteractive()
      .setScale(0.8);
    this.mobileButtons.right = this.scene.add
      .sprite(screenWidth - 50, screenHeight - 60, "arrow_button")
      .setScrollFactor(0)
      .setAlpha(0.7)
      .setInteractive()
      .setScale(0.8)
      .setFlipX(true);
    this.mobileButtons.up = this.scene.add
      .sprite(screenWidth - 100, screenHeight - 110, "arrow_button")
      .setScrollFactor(0)
      .setAlpha(0.7)
      .setInteractive()
      .setScale(0.8)
      .setAngle(-90);
    this.mobileButtons.down = this.scene.add
      .sprite(screenWidth - 100, screenHeight - 10, "arrow_button")
      .setScrollFactor(0)
      .setAlpha(0.7)
      .setInteractive()
      .setScale(0.8)
      .setAngle(90);

    // Attack buttons (punch, kick)
    this.mobileButtons.punch = this.scene.add
      .sprite(100, screenHeight - 60, "action_button")
      .setScrollFactor(0)
      .setAlpha(0.7)
      .setInteractive()
      .setScale(0.8);
    this.mobileButtons.kick = this.scene.add
      .sprite(200, screenHeight - 60, "action_button")
      .setScrollFactor(0)
      .setAlpha(0.7)
      .setInteractive()
      .setScale(0.8);

    // Add text labels for clarity (optional)
    this.scene.add
      .text(this.mobileButtons.punch.x, this.mobileButtons.punch.y, "P", {
        fontSize: "20px",
        fill: "#fff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.scene.add
      .text(this.mobileButtons.kick.x, this.mobileButtons.kick.y, "K", {
        fontSize: "20px",
        fill: "#fff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    // --- Event Listeners for Mobile Buttons ---
    this.mobileButtons.left.on(
      "pointerdown",
      () => (this.pressedState.left = true)
    );
    this.mobileButtons.left.on(
      "pointerup",
      () => (this.pressedState.left = false)
    );
    this.mobileButtons.right.on(
      "pointerdown",
      () => (this.pressedState.right = true)
    );
    this.mobileButtons.right.on(
      "pointerup",
      () => (this.pressedState.right = false)
    );
    this.mobileButtons.up.on(
      "pointerdown",
      () => (this.pressedState.up = true)
    );
    this.mobileButtons.up.on("pointerup", () => (this.pressedState.up = false));
    this.mobileButtons.down.on(
      "pointerdown",
      () => (this.pressedState.down = true)
    );
    this.mobileButtons.down.on(
      "pointerup",
      () => (this.pressedState.down = false)
    );

    // Special handling for 'justPressed' for punch/kick on mobile
    this.mobileButtons.punch.on("pointerdown", () => {
      this.pressedState.punch = true;
    });
    this.mobileButtons.punch.on("pointerup", () => {
      this.pressedState.punch = false;
    });

    this.mobileButtons.kick.on("pointerdown", () => {
      this.pressedState.kick = true;
    });
    this.mobileButtons.kick.on("pointerup", () => {
      this.pressedState.kick = false;
    });
  }

  // This method MUST be called every frame from your GameScene's update() method.
  update() {
    // Reset justPressedState for the current frame
    this.justPressedState.punch = false;
    this.justPressedState.kick = false;

    if (this.isMobile) {
      // For mobile, justPressed is derived from the pointerdown/up events,
      // which means we need to compare current vs previous pressedState
      // to detect the *first* frame of a press.

      // Punch
      if (this.pressedState.punch && !this.prevPressedState.punch) {
        this.justPressedState.punch = true;
      }
      // Kick
      if (this.pressedState.kick && !this.prevPressedState.kick) {
        this.justPressedState.kick = true;
      }

      // Update previous state for next frame's comparison
      this.prevPressedState.punch = this.pressedState.punch;
      this.prevPressedState.kick = this.pressedState.kick;
    } else {
      // For keyboard, we can directly use Phaser's built-in isJustDown
      this.pressedState.left = this.keys.left.isDown;
      this.pressedState.right = this.keys.right.isDown;
      this.pressedState.up = this.keys.up.isDown;
      this.pressedState.down = this.keys.down.isDown;

      // Use Phaser's isJustDown for keyboard attacks
      if (Phaser.Input.Keyboard.JustDown(this.keys.punch)) {
        this.justPressedState.punch = true;
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.kick)) {
        this.justPressedState.kick = true;
      }
    }
  }

  // Method to check if a key is currently held down
  isPressed(action) {
    return this.pressedState[action];
  }

  // Method to check if a key was *just* pressed in this frame
  isJustPressed(action) {
    return this.justPressedState[action];
  }
}

//=======================================================//
//=======================LOADING SCENE===================//
//=======================================================//
class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: "LoadingScene" });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add
      .image(width / 2, height / 2, "game_cover2")
      .setDisplaySize(width, height);

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2, 320, 50);

    this.load.on("progress", (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 + 10, 300 * value, 30);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      this.createAllAnimations();
      this.scene.start("TitleScene");
    });

    this.load.on("filecomplete-spritesheet-luke_punch", (key, type, data) => {
      console.log("Luke punch sprite sheet:", key, data.width, data.height);
    });
    this.load.on("filecomplete-spritesheet-luke_kick", (key, type, data) => {
      console.log("Luke kick sprite sheet:", key, data.width, data.height);
    });
    this.load.on("filecomplete-spritesheet-nate_punch", (key, type, data) => {
      console.log("Nate punch sprite sheet:", key, data.width, data.height);
    });
    this.load.on("filecomplete-spritesheet-nate_kick", (key, type, data) => {
      console.log("Nate kick sprite sheet:", key, data.width, data.height);
    });

    // Load assets
    this.load.image(
      "background_level1",
      "images/backgrounds/background_level1.png"
    );
    this.load.image("game_cover1", "images/backgrounds/game_cover1.png");
    this.load.image("game_cover2", "images/backgrounds/game_cover2.png");

    this.load.spritesheet("luke_walk", "images/fighters/luke_walk.png", {
      frameWidth: 73,
      frameHeight: 108,
    });
    this.load.spritesheet("luke_punch", "images/fighters/luke_punch.png", {
      frameWidth: 108,
      frameHeight: 108,
    });
    this.load.spritesheet("luke_kick", "images/fighters/luke_kick.png", {
      frameWidth: 108,
      frameHeight: 108,
    });
    this.load.spritesheet("luke_damage", "images/fighters/luke_damage.png", {
      frameWidth: 73,
      frameHeight: 108,
    });

    this.load.spritesheet("nate_walk", "images/fighters/nate_walk.png", {
      frameWidth: 73,
      frameHeight: 108,
    });
    this.load.spritesheet("nate_punch", "images/fighters/nate_punch.png", {
      frameWidth: 108,
      frameHeight: 108,
    });
    this.load.spritesheet("nate_kick", "images/fighters/nate_kick.png", {
      frameWidth: 108,
      frameHeight: 108,
    });
    this.load.spritesheet("nate_damage", "images/fighters/nate_damage.png", {
      frameWidth: 73,
      frameHeight: 108,
    });

    // Enemies
    this.load.spritesheet("zombie_walk", "images/enemies/zombie_walk.png", {
      frameWidth: 70,
      frameHeight: 100,
    });
    this.load.spritesheet(
      "zombie_boss_walk",
      "images/enemies/zombie_boss_walk.png",
      {
        frameWidth: 200,
        frameHeight: 200,
      }
    );
    this.load.spritesheet(
      "zombie_boss_throw",
      "images/enemies/zombie_boss_throw.png",
      {
        frameWidth: 200,
        frameHeight: 200,
      }
    );

    // Projectiles and Portal
    this.load.image("bone", "images/enemies/projectiles/bone.png");
    this.load.spritesheet("portal", "images/portal.png", {
      frameWidth: 100,
      frameHeight: 200,
    });
  }

  // New method to consolidate all animation creation
  createAllAnimations() {
    const chars = ["luke", "nate"];
    chars.forEach((char) => {
      this.anims.create({
        key: `${char}_walk_anim`,
        frames: this.anims.generateFrameNumbers(`${char}_walk`, {
          start: 0,
          end: 7,
        }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: `${char}_punch_anim`,
        frames: this.anims.generateFrameNumbers(`${char}_punch`, {
          start: 0,
          end: 0, // This is fine for a single-frame animation
        }),
        frameRate: 1, // Only one frame, so frameRate doesn't matter much
        repeat: 0, // Play once
        // Add a duration to control how long the frame stays, if you want a fixed display time
        duration: 500, // Optional: if you want the punch frame to display for a minimum time
      });
      this.anims.create({
        key: `${char}_kick_anim`,
        frames: this.anims.generateFrameNumbers(`${char}_kick`, {
          start: 0,
          end: 0, // This is fine for a single-frame animation
        }),
        frameRate: 1,
        repeat: 0,
        duration: 500, // Optional
      });
      this.anims.create({
        key: `${char}_damage_anim`,
        frames: this.anims.generateFrameNumbers(`${char}_damage`, {
          start: 0,
          end: 0,
        }),
        frameRate: 1,
        repeat: 0,
      });
      console.log(`Created animations for ${char}: walk, punch, kick, damage`);
    });

    // Enemy animations
    this.anims.create({
      key: "zombie_walk_anim",
      frames: this.anims.generateFrameNumbers("zombie_walk", {
        start: 0,
        end: 7,
      }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "zombie_boss_walk_anim",
      frames: this.anims.generateFrameNumbers("zombie_boss_walk", {
        start: 0,
        end: 7,
      }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "zombie_boss_throw_anim",
      frames: this.anims.generateFrameNumbers("zombie_boss_throw", {
        start: 0,
        end: 6,
      }),
      frameRate: 7,
      repeat: 0,
    });

    // Portal animation (if not already handled elsewhere)
    this.anims.create({
      key: "portal_anim",
      frames: this.anims.generateFrameNumbers("portal", { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1,
    });
  }
}

//======================================================================//
//=======================TITLE SCENE====================================//
//======================================================================//
class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
  }

  create() {
    const width = this.cameras.main.width; // 1024
    const height = this.cameras.main.height; // 576
    const displayWidth = this.cameras.main.displayWidth; // Scaled width (same as width on desktop)
    const displayHeight = this.cameras.main.displayHeight; // Scaled height (same as height on desktop)

    // Background
    const cover = this.add
      .image(width / 2, height / 2, "game_cover1")
      .setOrigin(0.5);
    const imageAspectRatio = cover.width / cover.height; // 512/512 = 1
    const canvasAspectRatio = displayWidth / displayHeight; // 1024/576 ≈ 1.78
    let scale;
    if (imageAspectRatio > canvasAspectRatio) {
      scale = displayWidth / cover.width; // Fit width
    } else {
      scale = displayHeight / cover.height; // Fit height (512/576 ≈ 0.89)
    }
    cover.setScale(scale);

    // Lock to landscape
    this.scale.lockOrientation("landscape");

    // ... rest of your TitleScene create method (PRESS START text, blinking, etc.)
    const startBtn = this.add
      .text(width / 2, height * 0.85, "PRESS START", {
        fontSize: "24px",
        fill: "#ffff00",
        stroke: "#000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setInteractive();

    const startGame = () => this.scene.start("CharacterSelectScene");
    startBtn.on("pointerdown", startGame);
    this.input.keyboard.on("keydown", startGame);

    this.tweens.add({
      targets: startBtn,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }
}

//======================================================================//
//==========================CHARACTER SELECT SCENE======================//
//======================================================================//
class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: "CharacterSelectScene" });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add
      .image(width / 2, height / 2, "background_level1")
      .setDisplaySize(width, height)
      .setTint(0x444444);

    this.add
      .text(width / 2, 100, "SELECT YOUR FIGHTER", {
        fontSize: "32px",
        fill: "#fff",
        stroke: "#000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    const lukePortrait = this.add
      .sprite(width / 2 - 150, height / 2, "luke_walk")
      .setScale(3)
      .setInteractive();
    lukePortrait.play("luke_walk_anim");

    const natePortrait = this.add
      .sprite(width / 2 + 150, height / 2, "nate_walk")
      .setScale(3)
      .setInteractive();
    natePortrait.play("nate_walk_anim");

    this.add
      .text(width / 2 - 150, height / 2 + 100, "LUKE", {
        fontSize: "24px",
        fill: "#fff",
        stroke: "#000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2 + 150, height / 2 + 100, "NATE", {
        fontSize: "24px",
        fill: "#fff",
        stroke: "#000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    lukePortrait.on("pointerdown", () =>
      this.scene.start("GameScene", { selectedCharacter: "luke" })
    );
    natePortrait.on("pointerdown", () =>
      this.scene.start("GameScene", { selectedCharacter: "nate" })
    );
  }
}

//======================================================================//
//================MAIN GAME SCENE=======================================//
//======================================================================//
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  init(data) {
    this.selectedCharacter = data.selectedCharacter || "luke";
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const displayHeight = this.cameras.main.displayHeight;

    this.physics.world.setBounds(0, 0, 3000, height);
    const background = this.add
      .tileSprite(0, height / 2, 3000, height, "background_level1")
      .setOrigin(0, 0.5);
    const bgScale = displayHeight / background.height;
    background.setScale(bgScale, bgScale);

    this.inputManager = new InputManager(this);

    this.player = this.physics.add
      .sprite(200, height, `${this.selectedCharacter}_walk`, 0) // Start with walk frame 0
      .setScale(1.5 * (displayHeight / height))
      .setCollideWorldBounds(true)
      .setSize(50, 80)
      .setOffset(10, 20);
    this.player.body.setGravityY(0);
    this.player.body.setAllowGravity(false);
    this.player.isAttacking = false;

    // Remove the console log for player animations here, it's not relevant to this specific debug
    // console.log(`Player animations:`, this.anims.anims.entries);

    this.enemies = this.physics.add.group();
    this.spawnEnemies();

    this.boss = this.physics.add
      .sprite(2500, height - 100, "zombie_boss_walk")
      .setScale(2)
      .setCollideWorldBounds(true);
    this.boss.play("zombie_boss_walk_anim");
    this.physics.add.collider(
      this.player,
      this.boss,
      this.handlePlayerBossCollision,
      null,
      this
    );

    this.player.health = 100;
    this.boss.health = 1; // Assuming initial boss health is 1 for test
    this.playerHealthBar = this.add.graphics().setScrollFactor(0);
    this.updateHealthBar();
    this.bossHealthBar = this.add.graphics().setScrollFactor(0);
    this.updateBossHealthBar();

    this.projectiles = this.physics.add.group();
    this.physics.add.overlap(
      this.player,
      this.projectiles,
      this.handlePlayerProjectileCollision,
      null,
      this
    );

    this.time.addEvent({
      delay: 3000,
      callback: this.bossThrow,
      callbackScope: this,
      loop: true,
    });

    this.portal = this.physics.add
      .sprite(2800, height - 100, "portal")
      .setScale(2)
      .setImmovable(true);

    this.portal.play("portal_anim");

    this.physics.add.collider(
      this.player,
      this.enemies,
      this.handlePlayerEnemyCollision,
      null,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.portal,
      this.winLevel,
      null,
      this
    );

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 3000, height);

    this.add
      .text(
        20,
        20,
        this.inputManager.isMobile // Fix: Use inputManager.isMobile
          ? "Use touch buttons to move and fight"
          : "Use WASD to move, J to punch, K to kick",
        {
          fontSize: "16px",
          fill: "#fff",
          stroke: "#000",
          strokeThickness: 2,
        }
      )
      .setScrollFactor(0);

    this.add
      .text(20, 50, `Character: ${this.selectedCharacter.toUpperCase()}`, {
        fontSize: "16px",
        fill: "#fff",
        stroke: "#000",
        strokeThickness: 2,
      })
      .setScrollFactor(0);
    this.time.addEvent({
      delay: 5000, // Spawn every 5 seconds
      callback: this.spawnEnemies,
      callbackScope: this,
      loop: true,
    });
  }

  spawnEnemies() {
    if (this.enemies.getLength() < 3) {
      const x = Phaser.Math.Between(500, 2500);
      const enemy = this.enemies
        .create(x, this.cameras.main.height - 100, "zombie_walk")
        .setScale(
          1.5 * (this.cameras.main.displayHeight / this.cameras.main.height)
        )
        .setVelocityX(-100)
        .setCollideWorldBounds(true)
        .setSize(50, 80) // Match player size for consistent collisions
        .setOffset(10, 20);
      enemy.play("zombie_walk_anim");
      enemy.health = 1; // Set enemy health to 1 for testing
    }
  }

  bossThrow() {
    if (!this.boss || !this.boss.active) return;
    if (
      !this.boss.anims.isPlaying ||
      this.boss.anims.currentAnim?.key === "zombie_boss_walk_anim"
    ) {
      this.boss.play("zombie_boss_throw_anim");
      const bone = this.projectiles
        .create(this.boss.x, this.boss.y, "bone")
        .setVelocityX(this.player.x < this.boss.x ? -200 : 200)
        .setScale(1.5);
      this.time.delayedCall(5000, () => bone.destroy(), [], this);
      this.time.delayedCall(
        700,
        () => {
          if (this.boss && this.boss.active)
            this.boss.play("zombie_boss_walk_anim");
        },
        [],
        this
      );
    }
  }

  updateHealthBar() {
    this.playerHealthBar.clear();
    this.playerHealthBar.fillStyle(0xff0000, 1);
    this.playerHealthBar.fillRect(20, 80, (this.player.health / 100) * 100, 10);
  }
  updateBossHealthBar() {
    this.bossHealthBar.clear();
    this.bossHealthBar.fillStyle(0x00ff00, 1);
    this.bossHealthBar.fillRect(20, 100, (this.boss.health / 50) * 100, 10);
  }

  handlePlayerBossCollision(player, boss) {
    if (this.player.isAttacking) {
      boss.health -= 10;
      this.updateBossHealthBar();
      if (boss.health <= 0) boss.destroy();
    } else {
      player.health -= 10;
      player.anims.play(`${this.selectedCharacter}_damage_anim`, true);
      this.time.delayedCall(
        600,
        () => {
          if (player && player.active) player.anims.stop();
        },
        [],
        this
      );
      this.updateHealthBar();
      if (player.health <= 0) {
        this.physics.pause();
        this.add
          .text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            "GAME OVER",
            {
              fontSize: "48px",
              fill: "#fff",
              stroke: "#000",
              strokeThickness: 4,
            }
          )
          .setOrigin(0.5)
          .setScrollFactor(0);
        this.time.delayedCall(
          2000,
          () => this.scene.start("TitleScene"),
          [],
          this
        );
      }
    }
  }

  handlePlayerProjectileCollision(player, projectile) {
    projectile.destroy();
    player.health -= 5;
    player.play(`${this.selectedCharacter}_damage_anim`, true);
    this.updateHealthBar();
    if (player.health <= 0) {
      this.physics.pause();
      this.add
        .text(
          this.cameras.main.width / 2,
          this.cameras.main.height / 2,
          "GAME OVER",
          {
            fontSize: "48px",
            fill: "#fff",
            stroke: "#000",
            strokeThickness: 4,
          }
        )
        .setOrigin(0.5)
        .setScrollFactor(0);
      this.time.delayedCall(
        2000,
        () => this.scene.start("TitleScene"),
        [],
        this
      );
    }
  }

  handlePlayerEnemyCollision(player, enemy) {
    if (this.player.isAttacking) {
      enemy.health -= 1;
      if (enemy.health <= 0) {
        enemy.destroy();
        this.time.delayedCall(2000, () => this.spawnEnemies(), [], this);
      }
    } else {
      player.health -= 5;
      player.anims.play(`${this.selectedCharacter}_damage_anim`, true);
      this.time.delayedCall(
        600,
        () => {
          if (player && player.active) player.anims.stop();
        },
        [],
        this
      );
      this.updateHealthBar();
      if (player.health <= 0) {
        this.physics.pause();
        this.add
          .text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            "GAME OVER",
            {
              fontSize: "48px",
              fill: "#fff",
              stroke: "#000",
              strokeThickness: 4,
            }
          )
          .setOrigin(0.5)
          .setScrollFactor(0);
        this.time.delayedCall(
          2000,
          () => this.scene.start("TitleScene"),
          [],
          this
        );
      }
    }
  }

  winLevel(player, portal) {
    this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        "LEVEL COMPLETE!",
        {
          fontSize: "48px",
          fill: "#fff",
          stroke: "#000",
          strokeThickness: 4,
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.physics.pause();
    this.time.delayedCall(2000, () => this.scene.start("TitleScene"), [], this);
  }

  update() {
    if (!this.player || !this.inputManager) return;

    this.inputManager.update(); // Important: call this to reset justPressed states
    const speed = 200;

    //================= HANDLE ATTACK INPUT =================//
    if (this.inputManager.isJustPressed("punch") && !this.player.isAttacking) {
      console.log("Triggering PUNCH animation!");
      this.player.isAttacking = true;
      this.player.anims.play(`${this.selectedCharacter}_punch_anim`, true);

      // --- Start the fail-safe timeout ---
      // Clear any existing timeout to prevent multiple from running if spamming attack
      if (this.attackTimeout) {
        this.attackTimeout.remove(false); // remove without firing
        this.attackTimeout = null;
      }
      this.attackTimeout = this.time.delayedCall(
        500, // **Adjust this duration** based on your animation's expected max length + a small buffer (e.g., 500ms for a quick punch/kick)
        () => {
          // Only reset if the animation hasn't already reset it
          if (this.player.isAttacking) {
            this.player.isAttacking = false;
            console.warn(
              "PUNCH: isAttacking force-reset by timeout (ANIMATION_COMPLETE may have been missed or delayed)."
            );
            // Revert to idle/walk here too
            if (
              this.player.body.velocity.x !== 0 ||
              this.player.body.velocity.y !== 0
            ) {
              this.player.anims.play(
                `${this.selectedCharacter}_walk_anim`,
                true
              );
            } else {
              this.player.setTexture(`${this.selectedCharacter}_walk`, 0);
            }
          }
          this.attackTimeout = null;
        },
        [],
        this
      );
      // --- End fail-safe timeout ---

      this.player.once(
        Phaser.Animations.Events.ANIMATION_COMPLETE,
        (animation, frame) => {
          console.log(`PUNCH: ANIMATION_COMPLETE fired for ${animation.key}.`);
          // If the timeout is still active, cancel it as the event successfully handled it
          if (this.attackTimeout) {
            this.attackTimeout.remove(false); // remove without firing
            this.attackTimeout = null;
          }

          if (
            this.player &&
            this.player.active &&
            animation.key === `${this.selectedCharacter}_punch_anim`
          ) {
            this.player.isAttacking = false;
            console.log("PUNCH: isAttacking reset to false.");
            if (
              this.player.body.velocity.x !== 0 ||
              this.player.body.velocity.y !== 0
            ) {
              this.player.anims.play(
                `${this.selectedCharacter}_walk_anim`,
                true
              );
            } else {
              this.player.setTexture(`${this.selectedCharacter}_walk`, 0);
            }
          }
        },
        this
      );
      return;
    }

    // ... (Do the same for KICK, ensuring you have a separate or shared timeout variable if needed,
    //      or modify how attackTimeout is managed if only one can be active at a time for player attacks)

    // For simplicity, you could use one `this.attackTimeout` for both, as they share `isAttacking`
    // and you can't punch and kick simultaneously. Just make sure to cancel any previous timeout.
    if (this.inputManager.isJustPressed("kick") && !this.player.isAttacking) {
      console.log("Triggering KICK animation!");
      this.player.isAttacking = true;
      this.player.anims.play(`${this.selectedCharacter}_kick_anim`, true);

      if (this.attackTimeout) {
        this.attackTimeout.remove(false);
        this.attackTimeout = null;
      }
      this.attackTimeout = this.time.delayedCall(
        500, // Adjust duration
        () => {
          if (this.player.isAttacking) {
            this.player.isAttacking = false;
            console.warn(
              "KICK: isAttacking force-reset by timeout (ANIMATION_COMPLETE may have been missed or delayed)."
            );
            if (
              this.player.body.velocity.x !== 0 ||
              this.player.body.velocity.y !== 0
            ) {
              this.player.anims.play(
                `${this.selectedCharacter}_walk_anim`,
                true
              );
            } else {
              this.player.setTexture(`${this.selectedCharacter}_walk`, 0);
            }
          }
          this.attackTimeout = null;
        },
        [],
        this
      );

      this.player.once(
        Phaser.Animations.Events.ANIMATION_COMPLETE,
        (animation, frame) => {
          console.log(`KICK: ANIMATION_COMPLETE fired for ${animation.key}.`);
          if (this.attackTimeout) {
            this.attackTimeout.remove(false);
            this.attackTimeout = null;
          }
          if (
            this.player &&
            this.player.active &&
            animation.key === `${this.selectedCharacter}_kick_anim`
          ) {
            this.player.isAttacking = false;
            console.log("KICK: isAttacking reset to false.");
            if (
              this.player.body.velocity.x !== 0 ||
              this.player.body.velocity.y !== 0
            ) {
              this.player.anims.play(
                `${this.selectedCharacter}_walk_anim`,
                true
              );
            } else {
              this.player.setTexture(`${this.selectedCharacter}_walk`, 0);
            }
          }
        },
        this
      );
      return;
    }

    //================= HANDLE MOVEMENT =================//
    if (this.player.isAttacking) {
      this.player.setVelocity(0); // Stop movement while attacking
      // Do NOT set texture or play walk anim here while attacking.
      // The attack animation should remain visible until it completes.
      return; // Block movement if mid-attack
    }

    this.player.setVelocity(0, 0);

    let isMoving = false;
    if (this.inputManager.isPressed("left")) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      isMoving = true;
    } else if (this.inputManager.isPressed("right")) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
      isMoving = true;
    }

    if (this.inputManager.isPressed("up")) {
      this.player.setVelocityY(-speed);
      isMoving = true;
    } else if (this.inputManager.isPressed("down")) {
      this.player.setVelocityY(speed);
      isMoving = true;
    }

    //================= CLAMP Y MOVEMENT =================//
    if (this.player.y < 326) this.player.setY(326);
    if (this.player.y > 576) this.player.setY(576);

    //================= IDLE STATE / Walk Animation Logic =================//
    // Only manage walk/idle if not attacking and not currently damaged
    // (assuming damage anim handles its own return to idle/walk)
    if (!this.player.isAttacking) {
      // Added explicit check
      if (isMoving) {
        // Play walk anim if moving and not already playing it
        if (
          this.player.anims.currentAnim?.key !==
          `${this.selectedCharacter}_walk_anim`
        ) {
          this.player.anims.play(`${this.selectedCharacter}_walk_anim`, true);
        }
      } else {
        // If not moving, stop current animation and set to idle frame (frame 0 of walk sheet)
        // Only stop if the current animation is walk (or general anim, not damage/attack)
        if (
          this.player.anims.currentAnim?.key ===
            `${this.selectedCharacter}_walk_anim` ||
          this.player.anims.isPlaying
        ) {
          this.player.anims.stop(); // Stops at the current frame
          this.player.setTexture(`${this.selectedCharacter}_walk`, 0); // Explicitly sets to the first frame of the walk sheet
        }
      }
    }
  }
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 576,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 500 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 576,
  },

  pixelArt: true,
  scene: [LoadingScene, TitleScene, CharacterSelectScene, GameScene],
};

const game = new Phaser.Game(config);

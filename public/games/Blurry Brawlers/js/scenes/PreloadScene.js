class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    // ===================== BACKGROUNDS =====================
    this.load.image(
      "boardwalk-bg-1",
      "assets/images/backgrounds/boardwalk-bg-1.jpg",
    );
    this.load.image(
      "boardwalk-bg-2",
      "assets/images/backgrounds/boardwalk-bg-2.jpg",
    );
    this.load.image(
      "boardwalk-bg-3",
      "assets/images/backgrounds/boardwalk-bg-3.jpg",
    );

    // ===================== NATE =====================
    this.load.spritesheet("nate-walk", "assets/images/nate/n-w-ss.png", {
      frameWidth: 100,
      frameHeight: 120,
    });
    this.load.image("nate-idle", "assets/images/nate/n-idle.png");
    this.load.image("nate-jump", "assets/images/nate/n-jump.png");
    this.load.image("nate-punch", "assets/images/nate/n-punch1.png");
    this.load.image("nate-kick", "assets/images/nate/n-kick1.png");
    this.load.image("nate-hurt", "assets/images/nate/n-hurt.png");

    // ===================== LUKE =====================
    this.load.image("luke-idle", "assets/images/luke/l-idle.png");

    // ===================== CRAB GOON =====================
    this.load.image("crab-idle", "assets/images/enemies/crab-idle-anim.png");
    this.load.image("crab-jump", "assets/images/enemies/crab-jump-anim.png");
    this.load.image(
      "crab-attack1",
      "assets/images/enemies/crab-attack1-anim.png",
    );
    this.load.image(
      "crab-attack2",
      "assets/images/enemies/crab-attack2-anim.png",
    );
    this.load.spritesheet(
      "crab-walk",
      "assets/images/enemies/crab-walk-anim.png",
      {
        frameWidth: 146,
        frameHeight: 128,
      },
    );
    this.load.spritesheet(
      "crab-death",
      "assets/images/enemies/crab-death-anim.png",
      {
        frameWidth: 192,
        frameHeight: 128,
      },
    );

    // ===================== BARNACLE BOSS =====================
    this.load.image(
      "barnacle-jump",
      "assets/images/enemies/barnacle-jump-anim.png",
    );
    this.load.spritesheet(
      "barnacle-attack3",
      "assets/images/enemies/barnacle-attack3-anim.png",
      {
        frameWidth: 160,
        frameHeight: 128,
      },
    );

    this.load.spritesheet(
      "barnacle-attack1",
      "assets/images/enemies/barnacle-attack1-anim.png",
      {
        frameWidth: 170,
        frameHeight: 128,
      },
    );
    this.load.spritesheet(
      "barnacle-attack2",
      "assets/images/enemies/barnacle-attack2-anim.png",
      {
        frameWidth: 175,
        frameHeight: 128,
      },
    );
    this.load.spritesheet(
      "barnacle-death",
      "assets/images/enemies/barnacle-death-anim.png",
      {
        frameWidth: 193,
        frameHeight: 128,
      },
    );
    this.load.spritesheet(
      "barnacle-idle",
      "assets/images/enemies/barnacle-idle-anim.png",
      {
        frameWidth: 137,
        frameHeight: 128,
      },
    );
    this.load.spritesheet(
      "barnacle-walk",
      "assets/images/enemies/barnacle-walk-anim.png",
      {
        frameWidth: 165,
        frameHeight: 128,
      },
    );

    // ===================== PORTAL =====================
    this.load.spritesheet("portal", "assets/images/bb-portal-ss.png", {
      frameWidth: 660,
      frameHeight: 660,
    });
  }

  // In PreloadScene.js → create()
  create() {
    // === Crab Animations ===
    if (!this.anims.exists("crab-walk")) {
      this.anims.create({
        key: "crab-walk",
        frames: this.anims.generateFrameNumbers("crab-walk", {
          start: 0,
          end: 7,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists("crab-death")) {
      this.anims.create({
        key: "crab-death",
        frames: this.anims.generateFrameNumbers("crab-death", {
          start: 0,
          end: 3,
        }),
        frameRate: 4,
        repeat: 0,
      });
    }

    // ===================== BARNACLE BOSS ANIMATIONS =====================

    // Walk (7 frames)
    if (!this.anims.exists("barnacle-walk")) {
      this.anims.create({
        key: "barnacle-walk",
        frames: this.anims.generateFrameNumbers("barnacle-walk", {
          start: 0,
          end: 6,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // Idle (4 frames)
    if (!this.anims.exists("barnacle-idle")) {
      this.anims.create({
        key: "barnacle-idle",
        frames: this.anims.generateFrameNumbers("barnacle-idle", {
          start: 0,
          end: 3,
        }),
        frameRate: 6,
        repeat: -1,
      });
    }

    // Attack 1 (8 frames)
    if (!this.anims.exists("barnacle-attack1")) {
      this.anims.create({
        key: "barnacle-attack1",
        frames: this.anims.generateFrameNumbers("barnacle-attack1", {
          start: 0,
          end: 7,
        }),
        frameRate: 12,
        repeat: 0,
      });
    }

    // Attack 2 (8 frames)
    if (!this.anims.exists("barnacle-attack2")) {
      this.anims.create({
        key: "barnacle-attack2",
        frames: this.anims.generateFrameNumbers("barnacle-attack2", {
          start: 0,
          end: 7,
        }),
        frameRate: 12,
        repeat: 0,
      });
    }

    // Attack 3 / Pounce (1 frame)
    if (!this.anims.exists("barnacle-attack3")) {
      this.anims.create({
        key: "barnacle-attack3",
        frames: this.anims.generateFrameNumbers("barnacle-attack3", {
          start: 0,
          end: 0,
        }),
        frameRate: 1,
        repeat: 0,
      });
    }

    // Death (25 frames)
    if (!this.anims.exists("barnacle-death")) {
      this.anims.create({
        key: "barnacle-death",
        frames: this.anims.generateFrameNumbers("barnacle-death", {
          start: 0,
          end: 24,
        }),
        frameRate: 14,
        repeat: 0,
      });
    }

    // You can also create Nate's animations here later if needed

    this.scene.start("TitleScene");
  }
}

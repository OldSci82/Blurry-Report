// scripts/BootScene.js
export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    console.log("BootScene: Preloading assets...");
    this.load.spritesheet(
      "black_fighter_walk",
      "images/black_fighter_walk_sheet.png",
      {
        frameWidth: 73,
        frameHeight: 108,
      }
    );
    this.load.spritesheet(
      "red_fighter_walk",
      "images/red_fighter_walk_sheet.png",
      {
        frameWidth: 73,
        frameHeight: 108,
      }
    );
    this.load.image("black_fighter_punch", "images/black_fighter_punch.png");
    this.load.image("black_fighter_kick", "images/black_fighter_kick.png");
    this.load.image("black_fighter_damage", "images/black_fighter_damage.png");
    this.load.image("red_fighter_punch", "images/red_fighter_punch.png");
    this.load.image("red_fighter_kick", "images/red_fighter_kick.png");
    this.load.image("red_fighter_damage", "images/red_fighter_damage.png");
    this.load.image("background_level1", "images/background_level1.png");
    this.load.spritesheet(
      "enemy_zombie1_walk",
      "images/enemy_zombie1_walk.png",
      {
        frameWidth: 100, // Updated to match 100x100 frames
        frameHeight: 100,
      }
    );
  }

  create() {
    console.log("BootScene: Creating animations...");
    try {
      this.anims.create({
        key: "walk_black",
        frames: this.anims.generateFrameNumbers("black_fighter_walk", {
          start: 0,
          end: 7,
        }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: "idle_black",
        frames: [{ key: "black_fighter_walk", frame: 2 }],
        frameRate: 1,
        repeat: 0,
      });
      this.anims.create({
        key: "walk_red",
        frames: this.anims.generateFrameNumbers("red_fighter_walk", {
          start: 0,
          end: 7,
        }),
        frameRate: 8,
        repeat: -1,
      });
      this.anims.create({
        key: "idle_red",
        frames: [{ key: "red_fighter_walk", frame: 2 }],
        frameRate: 1,
        repeat: 0,
      });
      this.anims.create({
        key: "walk_zombie1",
        frames: this.anims.generateFrameNumbers("enemy_zombie1_walk", {
          start: 0,
          end: 7,
        }), // 8 frames
        frameRate: 8,
        repeat: -1,
      });
      console.log("BootScene: Animations created successfully");
    } catch (error) {
      console.error("BootScene: Failed to create animations:", error.message);
    }
    console.log(
      "BootScene: Assets and animations loaded, starting TitleScene."
    );
    this.scene.start("TitleScene");
  }
}

// scripts/BootScene.js
export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    console.log("BootScene: Preloading assets...");
    this.load.html(
      "font",
      "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
    );
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
    this.load.image("bone", "images/bone.png");
    this.load.image("BBCover1", "images/BBCover1.png");
    this.load.image("BBCover2", "images/BBCover2.png");
    this.load.image("TBG1", "images/Transition_Backgrounds/TBG1.png");
    this.load.image("TBG2", "images/Transition_Backgrounds/TBG2.png");
    this.load.image("TBG3", "images/Transition_Backgrounds/TBG3.png");
    this.load.image("TBG4", "images/Transition_Backgrounds/TBG4.png");
    this.load.image("TBG5", "images/Transition_Backgrounds/TBG5.png");
    this.load.image("TBG6", "images/Transition_Backgrounds/TBG6.png");
    this.load.image("TBG7", "images/Transition_Backgrounds/TBG7.png");
    this.load.image("TBG8", "images/Transition_Backgrounds/TBG8.png");
    this.load.image("TBG9", "images/Transition_Backgrounds/TBG9.png");
    this.load.image("TBG10", "images/Transition_Backgrounds/TBG10.png");
    this.load.image("TBG11", "images/Transition_Backgrounds/TBG11.png");
    this.load.spritesheet(
      "enemy_zombie1_walk",
      "images/enemy_zombie1_walk.png",
      {
        frameWidth: 70,
        frameHeight: 100,
      }
    );
    this.load.spritesheet("portal", "images/portal.png", {
      frameWidth: 100,
      frameHeight: 200,
    });
    this.load.spritesheet(
      "enemy_zombie_boss_walk",
      "images/enemy_zombie_Boss_walk.png",
      {
        frameWidth: 200,
        frameHeight: 200,
      }
    );
    this.load.spritesheet(
      "enemy_zombie_boss_attack1",
      "images/enemy_zombie_Boss_attack1.png",
      {
        frameWidth: 200,
        frameHeight: 200,
      }
    );
  }

  create() {
    console.log("BootScene: Creating animations...");
    try {
      this.anims.create({
        key: "portal",
        frames: this.anims.generateFrameNumbers("portal", {
          start: 0,
          end: 5,
        }),
        frameRate: 5,
        repeat: -1,
      });
      this.anims.create({
        key: "zombie_boss_walk",
        frames: this.anims.generateFrameNumbers("enemy_zombie_boss_walk", {
          start: 0,
          end: 6,
        }),
        frameRate: 7,
        repeat: -1,
      });
      this.anims.create({
        key: "zombie_boss_attack1",
        frames: this.anims.generateFrameNumbers("enemy_zombie_boss_attack1", {
          start: 0,
          end: 6,
        }),
        frameRate: 7,
        repeat: -1,
      });
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
        }),
        frameRate: 8,
        repeat: -1,
      });
      console.log("BootScene: Animations created successfully");
    } catch (error) {
      console.error("BootScene: Failed to create animations:", error.message);
    }

    // Wait for font to load
    document.fonts
      .load('32px "Press Start 2P"')
      .then(() => {
        console.log("BootScene: Font loaded, starting TitleScene");
        this.scene.start("TitleScene");
      })
      .catch((error) => {
        console.error("BootScene: Font loading failed:", error.message);
        this.scene.start("TitleScene"); // Fallback to start anyway
      });
  }
}

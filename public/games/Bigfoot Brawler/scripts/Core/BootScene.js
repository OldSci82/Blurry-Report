// scripts/BootScene.js
export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    console.log("BootScene: Preloading assets...");
    // Optional: Add a loading bar to see progress
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(
      this.cameras.main.width / 2 - 160,
      this.cameras.main.height / 2 - 25,
      320,
      50
    );

    const loadingText = this.make.text({
      x: this.cameras.main.width / 2,
      y: this.cameras.main.height / 2 - 50,
      text: "Loading...",
      style: {
        font: "20px monospace",
        fill: "#ffffff",
      },
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: this.cameras.main.width / 2,
      y: this.cameras.main.height / 2,
      text: "0%",
      style: {
        font: "18px monospace",
        fill: "#ffffff",
      },
    });
    percentText.setOrigin(0.5, 0.5);

    this.load.on(
      "progress",
      function (value) {
        percentText.setText(parseInt(value * 100) + "%");
        progressBar.clear();
        progressBar.fillStyle(0xffffff, 1);
        progressBar.fillRect(
          this.cameras.main.width / 2 - 150,
          this.cameras.main.height / 2 - 15,
          300 * value,
          30
        );
      },
      this
    );

    this.load.on("fileprogress", function (file) {
      console.log(`Loading file: ${file.key} - ${file.url}`);
    });

    this.load.on("complete", function () {
      console.log("BootScene: All assets loaded.");
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Your existing preload assets
    console.log("BootScene: Preloading assets...");
    // Player Assets
    // Paths are relative to the root of your project, which seems to be 'Bigfoot Brawler/'
    // So, all paths will start with 'images/' or 'fonts/' or 'UI/' etc.
    this.load.spritesheet(
      "black_fighter_walk",
      "images/Fighters/black_fighter_walk_sheet.png",
      {
        frameWidth: 73, // Corrected: 73px wide
        frameHeight: 108, // Corrected: 108px tall
      }
    );
    this.load.spritesheet(
      "red_fighter_walk",
      "images/Fighters/red_fighter_walk_sheet.png",
      {
        frameWidth: 73, // Corrected: 73px wide
        frameHeight: 108, // Corrected: 108px tall
      }
    );

    this.load.image(
      "black_fighter_punch",
      "images/Fighters/black_fighter_punch.png"
    );
    this.load.image(
      "black_fighter_damage",
      "images/Fighters/black_fighter_damage.png"
    );
    this.load.image(
      "black_fighter_kick",
      "images/Fighters/black_fighter_kick.png"
    );
    this.load.image(
      "red_fighter_punch",
      "images/Fighters/red_fighter_punch.png"
    );
    this.load.image("red_fighter_kick", "images/Fighters/red_fighter_kick.png");
    this.load.image(
      "red_fighter_damage",
      "images/Fighters/red_fighter_damage.png"
    );

    // Backgrounds and Environment
    this.load.image(
      "background_level1",
      "images/Backgrounds/background_level1.png"
    );
    this.load.image("BBCover1", "images/Backgrounds/BBCover1.png");
    this.load.image("BBCover2", "images/Backgrounds/BBCover2.png");
    this.load.image(
      "TBG1",
      "images/Backgrounds/Transition_Backgrounds/TBG1.png"
    );
    this.load.image(
      "TBG2",
      "images/Backgrounds/Transition_Backgrounds/TBG2.png"
    );
    this.load.image(
      "TBG3",
      "images/Backgrounds/Transition_Backgrounds/TBG3.png"
    );
    this.load.image(
      "TBG4",
      "images/Backgrounds/Transition_Backgrounds/TBG4.png"
    );
    this.load.image(
      "TBG5",
      "images/Backgrounds/Transition_Backgrounds/TBG5.png"
    );
    this.load.image(
      "TBG6",
      "images/Backgrounds/Transition_Backgrounds/TBG6.png"
    );
    this.load.image(
      "TBG7",
      "images/Backgrounds/Transition_Backgrounds/TBG7.png"
    );
    this.load.image(
      "TBG8",
      "images/Backgrounds/Transition_Backgrounds/TBG8.png"
    );
    this.load.image(
      "TBG9",
      "images/Backgrounds/Transition_Backgrounds/TBG9.png"
    );
    this.load.image(
      "TBG10",
      "images/Backgrounds/Transition_Backgrounds/TBG10.png"
    );
    this.load.image(
      "TBG11",
      "images/Backgrounds/Transition_Backgrounds/TBG11.png"
    );

    // Enemies & Boss
    this.load.spritesheet(
      "enemy_zombie1_walk",
      "images/Enemies/enemy_zombie1_walk.png",
      {
        frameWidth: 70, // Corrected: 70px wide
        frameHeight: 100, // Corrected: 100px tall
      }
    );
    // Ensure casing matches exactly: 'enemy_zombie_Boss_walk.png'
    this.load.spritesheet(
      "enemy_zombie_boss_walk",
      "images/Enemies/enemy_zombie_boss_walk.png",
      {
        frameWidth: 100, // Corrected: 100px wide
        frameHeight: 200, // Corrected: 200px tall
      }
    );
    // Ensure casing matches exactly: 'enemy_zombie_Boss_attack1.png'
    this.load.spritesheet(
      "enemy_zombie_boss_attack1",
      "images/Enemies/enemy_zombie_boss_attack1.png",
      {
        frameWidth: 100, // Corrected: 100px wide
        frameHeight: 200, // Corrected: 200px tall
      }
    );
    this.load.image("bone", "images/Enemies/bone.png");

    // Other Game Elements
    // CRITICAL CORRECTION: portal.png is directly under 'images/', not in a 'games/Bigfoot Brawler/' subfolder.
    this.load.spritesheet("portal", "images/portal.png", {
      frameWidth: 100, // Corrected: 100px wide
      frameHeight: 200, // Corrected: 200px tall
    });

    // Font Loading (CORS issue - already addressed by adding to HTML)
    // No explicit Phaser loader for Google Fonts needed here if linked in HTML.
    // However, if you're using WebFontLoader:
    // This part should handle the 'Press Start 2P' font being available to Phaser.
    // If you're using WebFontLoader, make sure it's configured correctly.
    // If you simply added the <link> tag to HTML, the font will eventually load,
    // but Phaser might try to render text before it's ready, showing a fallback font.
    // You'd typically use a WebFontLoader to ensure it's loaded before starting scenes.
    // But for now, since it was a CORS error, the HTML link fixes that.
    this.load.once("complete", () => {
      // If using WebFontLoader, its 'active' callback would ideally trigger scene start.
      // For simplicity, we assume the font will eventually load in the browser.
    });
  }

  create() {
    console.log("BootScene: Creating animations...");
    this.createAnimations(); // Call the animation creation method
    try {
      // ... your animation creation ...
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
  createAnimations() {
    // Player Animations (assuming 8 frames for walk, 1 for idle)
    // black_fighter_walk_sheet: 8 frames (0-7)
    this.anims.create({
      key: "black_fighter_walk",
      frames: this.anims.generateFrameNumbers("black_fighter_walk", {
        start: 0,
        end: 7,
      }), // End is 7 for 8 frames
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "idle_black",
      frames: [{ key: "black_fighter_walk", frame: 2 }], // Or a specific idle frame
      frameRate: 1,
      repeat: -1,
    });
    // You might also need punch, kick, damage animations for black fighter
    this.anims.create({
      key: "black_fighter_punch",
      frames: [{ key: "black_fighter_punch", frame: 0 }],
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: "black_fighter_kick",
      frames: [{ key: "black_fighter_kick", frame: 0 }],
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: "black_fighter_damage",
      frames: [{ key: "black_fighter_damage", frame: 0 }],
      frameRate: 1,
      repeat: 0,
    });

    // red_fighter_walk_sheet: 8 frames (0-7)
    this.anims.create({
      key: "red_fighter_walk",
      frames: this.anims.generateFrameNumbers("red_fighter_walk", {
        start: 0,
        end: 7,
      }), // End is 7 for 8 frames
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "idle_red",
      frames: [{ key: "red_fighter_walk", frame: 2 }], // Or a specific idle frame
      frameRate: 1,
      repeat: -1,
    });
    // You might also need punch, kick, damage animations for red fighter
    this.anims.create({
      key: "red_fighter_punch",
      frames: [{ key: "red_fighter_punch", frame: 0 }],
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: "red_fighter_kick",
      frames: [{ key: "red_fighter_kick", frame: 0 }],
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: "red_fighter_damage",
      frames: [{ key: "red_fighter_damage", frame: 0 }],
      frameRate: 1,
      repeat: 0,
    });

    // Enemy Animations
    // enemy_zombie1_walk: 8 frames (0-7)
    this.anims.create({
      key: "walk_zombie1",
      frames: this.anims.generateFrameNumbers("enemy_zombie1_walk", {
        start: 0,
        end: 7,
      }), // End is 7 for 8 frames
      frameRate: 8,
      repeat: -1,
    });

    // Boss Animations
    // enemy_zombie_Boss_walk: 8 frames (0-7)
    this.anims.create({
      key: "zombie_boss_walk",
      frames: this.anims.generateFrameNumbers("enemy_zombie_boss_walk", {
        start: 0,
        end: 7,
      }), // End is 7 for 8 frames
      frameRate: 6,
      repeat: -1,
    });
    // enemy_zombie_Boss_attack1: 7 frames (0-6)
    this.anims.create({
      key: "enemy_zombie_boss_attack1",
      frames: this.anims.generateFrameNumbers("enemy_zombie_boss_attack1", {
        start: 0,
        end: 6,
      }), // End is 6 for 7 frames
      frameRate: 8,
      repeat: 0, // Attack usually plays once
    });

    // Portal Animation
    // portal: 6 frames (0-5)
    this.anims.create({
      key: "portal",
      frames: this.anims.generateFrameNumbers("portal", { start: 0, end: 5 }), // End is 5 for 6 frames
      frameRate: 8,
      repeat: -1,
    });

    console.log("BootScene: Animations created successfully");
  }
}

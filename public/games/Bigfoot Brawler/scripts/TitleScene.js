// scripts/TitleScene.js
import { config, gameState } from "../game.js";
// scripts/TitleScene.js
export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
    this.flickerTimer = 0;
    this.isMobile = false;
    this.scaleFactor = 1;
    this.touchStart = null;
  }

  preload() {
    // Explicitly preload BBCover1 with error handling
    if (!this.textures.exists("BBCover1")) {
      console.warn(
        "TitleScene: BBCover1 not preloaded, attempting to load now"
      );
      this.load.image("BBCover1", "assets/images/BBCover1.png"); // Adjust path if needed
      this.load.on("loaderror", (file) => {
        console.error(
          "TitleScene: Failed to load BBCover1, error:",
          file.error
        );
      });
      this.load.start(); // Start the load immediately
    } else {
      console.log(
        "TitleScene: BBCover1 already preloaded, size =",
        this.textures.get("BBCover1").getSourceImage().width,
        "x",
        this.textures.get("BBCover1").getSourceImage().height
      );
    }
  }

  create() {
    // Detect mobile device
    this.isMobile =
      this.sys.game.device.os.android || this.sys.game.device.os.iOS;
    console.log(
      "TitleScene: isMobile =",
      this.isMobile,
      "Device pixel ratio =",
      window.devicePixelRatio,
      "Game canvas =",
      config.width,
      "x",
      config.height,
      "Display size =",
      this.sys.game.scale.displaySize.width,
      "x",
      this.sys.game.scale.displaySize.height
    );

    // Use display size directly for scaling
    const displayWidth = this.sys.game.scale.displaySize.width;
    const displayHeight = this.sys.game.scale.displaySize.height;
    this.scaleFactor =
      Math.min(displayWidth / config.width, displayHeight / config.height) ||
      0.1;
    console.log("TitleScene: scaleFactor =", this.scaleFactor);

    // Define virtual canvas size (match game.js)
    const canvasWidth = 1280;
    const canvasHeight = 720;

    // Set viewport to match display size, scaled to fit
    const viewportWidth = displayWidth;
    const viewportHeight = displayHeight;
    const viewportX = 0;
    const viewportY = 0;
    this.cameras.main.setViewport(
      viewportX,
      viewportY,
      viewportWidth,
      viewportHeight
    );
    console.log("TitleScene: Viewport =", this.cameras.main.getBounds());

    const centerX = (canvasWidth / 2) * this.scaleFactor;
    const centerY = (canvasHeight / 2) * this.scaleFactor;

    // Background
    let background = null;
    if (this.textures.exists("BBCover1")) {
      background = this.add
        .image(centerX, centerY, "BBCover1")
        .setOrigin(0.5)
        .setDepth(0);
      const bgScaleX = (canvasWidth * this.scaleFactor) / background.width;
      const bgScaleY = (canvasHeight * this.scaleFactor) / background.height;
      const bgScale = Math.min(bgScaleX, bgScaleY);
      background.setScale(bgScale);
      console.log(
        "TitleScene: Background created at x =",
        background.x,
        "y =",
        background.y,
        "scale =",
        bgScale,
        "display width =",
        background.displayWidth,
        "display height =",
        background.displayHeight
      );
    } else {
      console.error("TitleScene: BBCover1 texture missing, adding fallback");
      background = this.add
        .rectangle(
          centerX,
          centerY,
          canvasWidth * this.scaleFactor,
          canvasHeight * this.scaleFactor,
          0x000000
        )
        .setDepth(0);
      console.log(
        "TitleScene: Fallback background at x =",
        centerX,
        "y =",
        centerY
      );
    }

    // Green border
    const border = this.add.graphics().setDepth(1);
    border.lineStyle(4 * this.scaleFactor, 0x00ff00, 1);
    border.strokeRect(
      0,
      0,
      canvasWidth * this.scaleFactor,
      canvasHeight * this.scaleFactor
    );

    // Test shapes to debug visibility
    this.add
      .rectangle(
        centerX,
        centerY,
        20 * this.scaleFactor,
        20 * this.scaleFactor,
        0xff0000
      )
      .setDepth(5); // Red dot (center)
    this.add
      .rectangle(
        100 * this.scaleFactor,
        100 * this.scaleFactor,
        20 * this.scaleFactor,
        20 * this.scaleFactor,
        0xff0000
      )
      .setDepth(5); // Top-left
    this.add
      .rectangle(
        (canvasWidth - 100) * this.scaleFactor,
        (canvasHeight - 100) * this.scaleFactor,
        20 * this.scaleFactor,
        20 * this.scaleFactor,
        0xff0000
      )
      .setDepth(5); // Bottom-right
    this.add
      .rectangle(
        centerX,
        centerY + 220 * this.scaleFactor,
        50 * this.scaleFactor,
        50 * this.scaleFactor,
        0x00ff00
      )
      .setDepth(5); // Green box at tagline
    this.add
      .rectangle(
        centerX,
        centerY + 280 * this.scaleFactor,
        50 * this.scaleFactor,
        50 * this.scaleFactor,
        0x0000ff
      )
      .setDepth(5); // Blue box at button

    // CRT flicker overlay
    this.flickerOverlay = this.add
      .rectangle(
        centerX,
        centerY,
        canvasWidth * this.scaleFactor,
        canvasHeight * this.scaleFactor,
        0xffffff,
        0
      )
      .setDepth(2);

    // Tagline
    this.tagline = this.add
      .text(
        centerX,
        centerY + 220 * this.scaleFactor,
        "Two dudes. One legendary showdown.",
        {
          fontFamily: "'Press Start 2P', Arial, sans-serif",
          fontSize: `${16 * this.scaleFactor}px`,
          fill: "#ffffff",
          stroke: "#000000",
          strokeThickness: 5 * this.scaleFactor,
          align: "center",
          wordWrap: {
            width: canvasWidth * this.scaleFactor - 40 * this.scaleFactor,
          },
        }
      )
      .setOrigin(0.5)
      .setDepth(3);
    console.log(
      "TitleScene: Tagline created at x =",
      this.tagline.x,
      "y =",
      this.tagline.y,
      "width =",
      this.tagline.width,
      "height =",
      this.tagline.height
    );

    // Test font with system font
    this.add
      .text(centerX, centerY + 100 * this.scaleFactor, "Font Test (Arial)", {
        fontFamily: "Arial",
        fontSize: `${16 * this.scaleFactor}px`,
        fill: "#ff00ff",
        stroke: "#000000",
        strokeThickness: 2 * this.scaleFactor,
      })
      .setOrigin(0.5)
      .setDepth(3);

    // Press Enter / Start button
    if (this.isMobile) {
      this.touchStart = this.add
        .rectangle(
          centerX,
          centerY + 280 * this.scaleFactor,
          240 * this.scaleFactor,
          60 * this.scaleFactor,
          0x333333,
          0.8
        )
        .setInteractive()
        .setDepth(3);
      this.touchStart.on("pointerdown", () => {
        console.log(
          "TitleScene: Touch start triggered at x =",
          this.input.activePointer.x,
          "y =",
          this.input.activePointer.y
        );
        this.scene.start("CharacterSelectScene");
      });
      this.touchStart.on("pointerover", () =>
        console.log("TitleScene: Touch start hovered")
      );

      this.add
        .text(centerX, centerY + 280 * this.scaleFactor, "START", {
          fontFamily: "'Press Start 2P', Arial, sans-serif",
          fontSize: `${20 * this.scaleFactor}px`,
          fill: "#00ff00",
          stroke: "#000000",
          strokeThickness: 6 * this.scaleFactor,
        })
        .setOrigin(0.5)
        .setDepth(4);
    } else {
      this.pressEnter = this.add
        .text(centerX, centerY + 280 * this.scaleFactor, "PRESS ENTER", {
          fontFamily: "'Press Start 2P', Arial, sans-serif",
          fontSize: `${20 * this.scaleFactor}px`,
          fill: "#00ff00",
          stroke: "#000000",
          strokeThickness: 6 * this.scaleFactor,
        })
        .setOrigin(0.5)
        .setDepth(3);

      this.tweens.add({
        targets: this.pressEnter,
        alpha: { from: 1, to: 0.3 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }

    // ENTER key for desktop
    this.input.keyboard.on("keydown-ENTER", () => {
      console.log("TitleScene: Enter key pressed");
      this.scene.start("CharacterSelectScene");
    });
  }

  update(time, delta) {
    // Random CRT flicker intensity
    this.flickerTimer += delta;
    if (this.flickerTimer > 80) {
      const alpha = Phaser.Math.FloatBetween(0.01, 0.06);
      this.flickerOverlay.setFillStyle(0xffffff, alpha);
      this.flickerTimer = 0;
    }
  }

  shutdown() {
    console.log("TitleScene: Shutdown called");
    this.input.keyboard.off("keydown-ENTER");
    if (this.touchStart) {
      this.touchStart.destroy();
      this.touchStart = null;
    }
    if (this.flickerOverlay) {
      this.flickerOverlay.destroy();
      this.flickerOverlay = null;
    }
    if (this.tagline) {
      this.tagline.destroy();
      this.tagline = null;
    }
    if (this.pressEnter) {
      this.pressEnter.destroy();
      this.pressEnter = null;
    }
    this.events.off("shutdown", this.shutdown, this);
  }
}

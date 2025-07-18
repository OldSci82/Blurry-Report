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
    // Explicitly preload BBCover1 in case BootScene preload fails
    if (!this.textures.exists("BBCover1")) {
      console.warn("TitleScene: BBCover1 not preloaded, loading now");
      this.load.image("BBCover1", "assets/images/BBCover1.png"); // Adjust path if needed
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
      window.devicePixelRatio
    );

    // Calculate scale factor
    const scaleX = this.sys.game.scale.displaySize.width / config.width;
    const scaleY = this.sys.game.scale.displaySize.height / config.height;
    this.scaleFactor = Math.min(scaleX, scaleY) || 1; // Fallback to 1 if scale is 0
    console.log(
      "TitleScene: scaleFactor =",
      this.scaleFactor,
      "Display size =",
      this.sys.game.scale.displaySize
    );

    // Define virtual canvas size (match game.js)
    const canvasWidth = 1280;
    const canvasHeight = 720;

    // Center the viewport
    const viewportX =
      (this.sys.game.scale.displaySize.width - canvasWidth * this.scaleFactor) /
      2;
    const viewportY =
      (this.sys.game.scale.displaySize.height -
        canvasHeight * this.scaleFactor) /
      2;
    this.cameras.main.setViewport(
      viewportX,
      viewportY,
      canvasWidth * this.scaleFactor,
      canvasHeight * this.scaleFactor
    );
    console.log("TitleScene: Viewport =", this.cameras.main.getBounds());

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Background
    if (this.textures.exists("BBCover1")) {
      const background = this.add
        .image(centerX, centerY, "BBCover1")
        .setOrigin(0.5)
        .setDepth(0);
      const bgScaleX = canvasWidth / background.width;
      const bgScaleY = canvasHeight / background.height;
      const bgScale = Math.min(bgScaleX, bgScaleY) * this.scaleFactor;
      background.setScale(bgScale);
      console.log(
        "TitleScene: Background created at x =",
        background.x,
        "y =",
        background.y,
        "scale =",
        bgScale
      );
    } else {
      console.error("TitleScene: BBCover1 texture missing, adding fallback");
      this.add
        .rectangle(centerX, centerY, canvasWidth, canvasHeight, 0x000000)
        .setDepth(0);
    }

    // Green border
    const border = this.add.graphics().setDepth(1);
    border.lineStyle(4 * this.scaleFactor, 0x00ff00, 1);
    border.strokeRect(
      centerX - canvasWidth / 2,
      centerY - canvasHeight / 2,
      canvasWidth,
      canvasHeight
    );

    // CRT flicker overlay
    this.flickerOverlay = this.add
      .rectangle(centerX, centerY, canvasWidth, canvasHeight, 0xffffff, 0)
      .setDepth(2)
      .setScale(this.scaleFactor);

    // Tagline
    this.tagline = this.add
      .text(
        centerX,
        centerY + 220 * this.scaleFactor,
        "Two dudes. One legendary showdown.",
        {
          fontFamily: "'Press Start 2P', Arial", // Fallback to Arial
          fontSize: `${16 * this.scaleFactor}px`,
          fill: "#ffffff",
          stroke: "#000000",
          strokeThickness: 5 * this.scaleFactor,
          align: "center",
          wordWrap: { width: canvasWidth - 40 * this.scaleFactor },
        }
      )
      .setOrigin(0.5)
      .setDepth(3);
    console.log(
      "TitleScene: Tagline created at x =",
      this.tagline.x,
      "y =",
      this.tagline.y
    );

    // Press Enter / Start button
    if (this.isMobile) {
      this.touchStart = this.add
        .rectangle(
          centerX,
          centerY + 280 * this.scaleFactor,
          240 * this.scaleFactor,
          60 * this.scaleFactor,
          0x333333,
          0.7
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
          fontFamily: "'Press Start 2P', Arial", // Fallback to Arial
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
          fontFamily: "'Press Start 2P', Arial", // Fallback to Arial
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

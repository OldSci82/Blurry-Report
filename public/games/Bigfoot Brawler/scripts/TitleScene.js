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
    // BBCover1 should already be preloaded in BootScene
  }

  create() {
    // Detect mobile device
    this.isMobile =
      this.sys.game.device.os.android || this.sys.game.device.os.iOS;

    // Calculate scale factor based on display size
    const scaleX = this.sys.game.scale.displaySize.width / config.width;
    const scaleY = this.sys.game.scale.displaySize.height / config.height;
    this.scaleFactor = Math.min(scaleX, scaleY);

    // Define virtual canvas size (match game.js)
    const canvasWidth = 1280;
    const canvasHeight = 720;

    // Adjust camera to center the virtual canvas
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    this.cameras.main.setViewport(
      (this.sys.game.scale.displaySize.width - canvasWidth * this.scaleFactor) /
        2,
      (this.sys.game.scale.displaySize.height -
        canvasHeight * this.scaleFactor) /
        2,
      canvasWidth * this.scaleFactor,
      canvasHeight * this.scaleFactor
    );

    // Scale background to fit virtual canvas
    const background = this.add
      .image(centerX, centerY, "BBCover1")
      .setOrigin(0.5)
      .setDepth(0);

    const bgScaleX = canvasWidth / background.width;
    const bgScaleY = canvasHeight / background.height;
    const bgScale = Math.min(bgScaleX, bgScaleY) * this.scaleFactor;
    background.setScale(bgScale);

    // Black border around virtual canvas
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
          fontFamily: "'Press Start 2P'",
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

    // Press Enter / Start text or button
    if (this.isMobile) {
      // Add touchable "Start" button for mobile
      this.touchStart = this.add
        .rectangle(
          centerX,
          centerY + 280 * this.scaleFactor,
          240 * this.scaleFactor,
          60 * this.scaleFactor,
          0x333333,
          0.5
        )
        .setInteractive()
        .setDepth(3);
      this.touchStart.on("pointerdown", () => {
        console.log("Touch start triggered");
        this.scene.start("CharacterSelectScene");
      });

      this.add
        .text(centerX, centerY + 280 * this.scaleFactor, "START", {
          fontFamily: "'Press Start 2P'",
          fontSize: `${20 * this.scaleFactor}px`,
          fill: "#00ff00",
          stroke: "#000000",
          strokeThickness: 6 * this.scaleFactor,
        })
        .setOrigin(0.5)
        .setDepth(4);
    } else {
      // Desktop: Show "PRESS ENTER"
      this.pressEnter = this.add
        .text(centerX, centerY + 280 * this.scaleFactor, "PRESS ENTER", {
          fontFamily: "'Press Start 2P'",
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
      console.log("Enter key pressed");
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
    // Cleanup input listeners
    this.input.keyboard.off("keydown-ENTER");

    // Cleanup touch controls
    if (this.touchStart) {
      this.touchStart.destroy();
      this.touchStart = null;
    }

    // Cleanup flicker overlay
    if (this.flickerOverlay) {
      this.flickerOverlay.destroy();
      this.flickerOverlay = null;
    }

    // Cleanup UI elements
    if (this.tagline) {
      this.tagline.destroy();
      this.tagline = null;
    }
    if (this.pressEnter) {
      this.pressEnter.destroy();
      this.pressEnter = null;
    }

    // Remove scene event listeners
    this.events.off("shutdown", this.shutdown, this);
  }
}

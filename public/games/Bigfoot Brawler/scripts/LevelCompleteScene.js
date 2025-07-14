// scripts/LevelCompleteScene.js
import { config, gameState } from "../game.js";

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super("LevelCompleteScene");
    this.flickerTimer = 0;
  }

  create() {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // === DEFINE VIRTUAL CANVAS SIZE ===
    const canvasWidth = 800;
    const canvasHeight = 600;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    // === BACKGROUND ===
    // Randomly select a background from TBG1 to TBG11
    const backgroundKeys = [
      "TBG1",
      "TBG2",
      "TBG3",
      "TBG4",
      "TBG5",
      "TBG6",
      "TBG7",
      "TBG8",
      "TBG9",
      "TBG10",
      "TBG11",
    ];
    const randomBackgroundKey = Phaser.Math.RND.pick(backgroundKeys);
    const background = this.add
      .image(centerX, centerY, randomBackgroundKey)
      .setOrigin(0.5)
      .setDepth(0);
    const scaleX = canvasWidth / background.width;
    const scaleY = canvasHeight / background.height;
    const scale = Math.min(scaleX, scaleY);
    background.setScale(scale);
    console.log(
      `LevelCompleteScene: Background ${randomBackgroundKey} loaded, dimensions:`,
      background.width,
      background.height,
      "Scale:",
      scale
    );

    // === GREEN BORDER ===
    const border = this.add.graphics().setDepth(1);
    border.lineStyle(4, 0x00ff00, 1);
    border.strokeRect(
      centerX - canvasWidth / 2,
      centerY - canvasHeight / 2,
      canvasWidth,
      canvasHeight
    );

    // === CRT FLICKER OVERLAY ===
    this.flickerOverlay = this.add
      .rectangle(centerX, centerY, canvasWidth, canvasHeight, 0xffffff, 0)
      .setDepth(2);

    // === FONT LOADING ===
    document.fonts
      .load('32px "Press Start 2P"')
      .then(() => {
        console.log(
          "LevelCompleteScene: Press Start 2P font loaded successfully"
        );
        this.renderText();
      })
      .catch((error) => {
        console.error(
          "LevelCompleteScene: Font loading failed:",
          error.message
        );
        this.renderText(); // Render text anyway with fallback
      });
  }

  renderText() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // === TITLE ===
    const titleText = this.add
      .text(
        centerX,
        centerY - 200,
        `LEVEL ${gameState.currentLevel - 1} COMPLETE`,
        {
          fontFamily: '"Press Start 2P", Arial',
          fontSize: "32px",
          fill: "#00ff00",
          stroke: "#000",
          strokeThickness: 5,
        }
      )
      .setOrigin(0.5)
      .setDepth(3);

    // === TAGLINE ===
    const taglineText = this.add
      .text(centerX, centerY - 150, "Ready for the next brawl?", {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: "16px",
        fill: "#00ff00",
        stroke: "#000",
        strokeThickness: 4,
        align: "center",
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5)
      .setDepth(3);

    // === CONTINUE ===
    const continueText = this.add
      .text(centerX, centerY + 150, "CONTINUE", {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: "24px",
        fill: "#00ff00",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setInteractive();

    // === INTERACTIVITY ===
    continueText.on("pointerdown", () => {
      console.log(
        `LevelCompleteScene: Continuing to level ${gameState.currentLevel}`
      );
      this.cameras.main.fadeOut(500, 0, 0, 0, () =>
        this.scene.start("GameScene")
      );
    });
    continueText.on("pointerover", () => {
      continueText.setStyle({ fill: "#FF0" });
      this.tweens.add({ targets: continueText, scale: 1.1, duration: 200 });
    });
    continueText.on("pointerout", () => {
      continueText.setStyle({ fill: "#00ff00" });
      this.tweens.add({ targets: continueText, scale: 1, duration: 200 });
    });

    // === FLICKER EFFECT ===
    this.tweens.add({
      targets: [titleText, taglineText],
      alpha: { from: 1, to: 0.3 },
      duration: 500,
      yoyo: true,
      repeat: -1,
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
}

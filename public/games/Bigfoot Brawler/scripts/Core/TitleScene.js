// Core/TitleScene.js
import { gameState } from "../game.js";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
    this.flickerTimer = 0;
  }

  create() {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // === BACKGROUND IMAGE ===
    const background = this.add
      .image(screenWidth / 2, screenHeight / 2, "BBCover1")
      .setOrigin(0.5)
      .setDisplaySize(screenWidth, screenHeight);

    // === CRT FLICKER OVERLAY ===
    this.flickerOverlay = this.add
      .rectangle(
        screenWidth / 2,
        screenHeight / 2,
        screenWidth,
        screenHeight,
        0xffffff,
        0
      )
      .setDepth(2);

    // === START TEXT ===
    const startText = this.add
      .text(screenWidth / 2, screenHeight - 100, "PRESS ANY KEY TO START", {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: "24px",
        fill: "#00ff00",
        stroke: "#000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(3);

    // Flicker effect on text
    this.tweens.add({
      targets: startText,
      alpha: { from: 1, to: 0.2 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // === INPUT LISTENERS ===
    this.input.keyboard.on("keydown", () => this.startCharacterSelect());
    this.input.on("pointerdown", () => this.startCharacterSelect());
  }

  startCharacterSelect() {
    // Detect if device is mobile
    const isMobile =
      this.sys.game.device.os.android || this.sys.game.device.os.iOS;

    const nextScene = isMobile ? "MobileGameScene" : "DesktopGameScene";

    // Transition to CharacterSelectScene with nextScene
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("CharacterSelectScene", { nextScene });
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

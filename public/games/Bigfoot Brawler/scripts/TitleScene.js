// scripts/TitleScene.js
export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
    this.flickerTimer = 0;
  }

  preload() {
    // BBCover1 should already be preloaded in BootScene
  }

  create() {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // === DEFINE VIRTUAL CANVAS SIZE ===
    const canvasWidth = 800;
    const canvasHeight = 600;

    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    // === SCALE BACKGROUND TO FIT VIRTUAL CANVAS ===
    const background = this.add
      .image(centerX, centerY, "BBCover1")
      .setOrigin(0.5);

    const scaleX = canvasWidth / background.width;
    const scaleY = canvasHeight / background.height;
    const scale = Math.min(scaleX, scaleY);

    background.setScale(scale).setDepth(0);

    // === BLACK BORDER AROUND VIRTUAL CANVAS ===
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

    // === TAGLINE ===
    this.tagline = this.add
      .text(centerX, centerY + 190, "Two dudes. One legendary showdown.", {
        fontFamily: "'Press Start 2P'",
        fontSize: "14px",
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 5,
        align: "center",
        wordWrap: { width: canvasWidth - 40 },
      })
      .setOrigin(0.5)
      .setDepth(3);

    // === PRESS ENTER TEXT ===
    this.pressEnter = this.add
      .text(centerX, centerY + 240, "PRESS ENTER", {
        fontFamily: "'Press Start 2P'",
        fontSize: "18px",
        fill: "#00ff00",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(3);

    // Flicker effect on "PRESS ENTER"
    this.tweens.add({
      targets: this.pressEnter,
      alpha: { from: 1, to: 0.3 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // ENTER key starts game
    this.input.keyboard.on("keydown-ENTER", () => {
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
}

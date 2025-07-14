// scripts/CharacterSelectScene.js
import { config, gameState } from "../game.js";

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super("CharacterSelectScene");
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
    this.cameras.main.setBackgroundColor("#0f1128");

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
          "CharacterSelectScene: Press Start 2P font loaded successfully"
        );
        this.renderText();
      })
      .catch((error) => {
        console.error(
          "CharacterSelectScene: Font loading failed:",
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
      .text(centerX, centerY - 200, "CHOOSE YOUR FIGHTER", {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: "32px",
        fill: "#00ff00",
        stroke: "#000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(3);

    // === TAGLINE ===
    const taglineText = this.add
      .text(centerX, centerY - 150, "Pick your brawler, start the fight!", {
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

    // === BLACK FIGHTER ===
    const blackFighter = this.add
      .sprite(centerX - 200, centerY, "black_fighter_walk")
      .setScale(1.5)
      .setInteractive()
      .setDepth(3);
    blackFighter.play("walk_black");

    const blackFighterName = this.add
      .text(centerX - 200, centerY + 150, "Luke", {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: "24px",
        fill: "#00ff00",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(3);

    // === RED FIGHTER ===
    const redFighter = this.add
      .sprite(centerX + 200, centerY, "red_fighter_walk")
      .setScale(1.5)
      .setInteractive()
      .setDepth(3);
    redFighter.play("walk_red");

    const redFighterName = this.add
      .text(centerX + 200, centerY + 150, "Nate", {
        fontFamily: '"Press Start 2P", Arial',
        fontSize: "24px",
        fill: "#00ff00",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(3);

    // === INTERACTIVITY ===
    blackFighter.on("pointerdown", () => {
      gameState.selectedFighter = "black";
      console.log("Selected fighter: black");
      this.cameras.main.fadeOut(500, 0, 0, 0, () =>
        this.scene.start("GameScene")
      );
    });
    blackFighter.on("pointerover", () => {
      blackFighter.setTint(0x00ff00);
      blackFighterName.setStyle({ fill: "#FF0" });
      this.tweens.add({ targets: blackFighter, scale: 2.75, duration: 200 });
      this.tweens.add({ targets: blackFighterName, scale: 1.1, duration: 200 });
    });
    blackFighter.on("pointerout", () => {
      blackFighter.clearTint();
      blackFighterName.setStyle({ fill: "#00ff00" });
      this.tweens.add({ targets: blackFighter, scale: 1.5, duration: 200 });
      this.tweens.add({ targets: blackFighterName, scale: 1, duration: 200 });
    });

    redFighter.on("pointerdown", () => {
      gameState.selectedFighter = "red";
      console.log("Selected fighter: red");
      this.cameras.main.fadeOut(500, 0, 0, 0, () =>
        this.scene.start("GameScene")
      );
    });
    redFighter.on("pointerover", () => {
      redFighter.setTint(0xff0000);
      redFighterName.setStyle({ fill: "#FF0" });
      this.tweens.add({ targets: redFighter, scale: 2.75, duration: 200 });
      this.tweens.add({ targets: redFighterName, scale: 1.1, duration: 200 });
    });
    redFighter.on("pointerout", () => {
      redFighter.clearTint();
      redFighterName.setStyle({ fill: "#00ff00" });
      this.tweens.add({ targets: redFighter, scale: 1.5, duration: 200 });
      this.tweens.add({ targets: redFighterName, scale: 1, duration: 200 });
    });

    // Flicker effect on title and tagline
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

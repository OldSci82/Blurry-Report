// scripts/TitleScene.js
import { config, gameState } from "../game.js";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#87CEEB"); // Sky blue

    this.add
      .text(config.width / 2, config.height / 4, "Bigfoot's Brawlers!", {
        fontSize: "48px",
        fill: "#FFF",
        fontFamily: "Arial Black",
      })
      .setOrigin(0.5);

    this.add
      .text(
        config.width / 2,
        config.height / 2.5,
        "Two Dudes, A Portal, and a Whole Lotta Sasquatch",
        {
          fontSize: "20px",
          fill: "#FFD700",
          fontFamily: "Arial",
        }
      )
      .setOrigin(0.5);

    const startGameText = this.add
      .text(config.width / 2, config.height / 1.5 + 40, "START NEW GAME", {
        fontSize: "32px",
        fill: "#0F0",
        backgroundColor: "#333",
        padding: { x: 20, y: 10 },
        fontFamily: "Arial",
      })
      .setOrigin(0.5)
      .setInteractive();

    startGameText.on("pointerdown", () => {
      gameState.currentLevel = 1;
      gameState.playerHealth = 100;
      gameState.score = 0;
      this.scene.start("CharacterSelectScene");
    });

    startGameText.on("pointerover", () =>
      startGameText.setStyle({ fill: "#FF0" })
    );
    startGameText.on("pointerout", () =>
      startGameText.setStyle({ fill: "#0F0" })
    );
  }
}

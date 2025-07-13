// scripts/GameOverScene.js
import { config, gameState } from "../game.js";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  init(data) {
    this.won = data.won || false;
  }

  create() {
    this.cameras.main.setBackgroundColor("#000");

    const message = this.won ? "YOU WIN!" : "GAME OVER";
    this.add
      .text(config.width / 2, config.height / 2 - 50, message, {
        fontSize: "32px",
        fill: "#FFF",
        fontFamily: "Arial Black",
      })
      .setOrigin(0.5);

    this.add
      .text(config.width / 2, config.height / 2, `Score: ${gameState.score}`, {
        fontSize: "24px",
        fill: "#FFF",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    const restartText = this.add
      .text(config.width / 2, config.height / 2 + 50, "RESTART", {
        fontSize: "24px",
        fill: "#0F0",
        fontFamily: "Arial",
      })
      .setOrigin(0.5)
      .setInteractive();

    restartText.on("pointerdown", () => {
      // Reset game state
      gameState.currentLevel = 1;
      gameState.playerHealth = 100;
      gameState.score = 0;
      gameState.selectedFighter = null;
      console.log("GameOverScene: Game state reset, starting TitleScene");
      this.scene.start("TitleScene");
    });
    restartText.on("pointerover", () => restartText.setStyle({ fill: "#FF0" }));
    restartText.on("pointerout", () => restartText.setStyle({ fill: "#0F0" }));
  }
}

// scripts/GameOverScene.js
import { config, gameState } from "../game.js";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#000");

    const message = this.won ? "YOU WIN!" : "GAME OVER";
    this.add
      .text(config.width / 2, config.height / 2 - 100, message, {
        // Reverted y
        fontFamily: "Press Start 2P",
        fontSize: "48px", // Reverted from 96px
        fill: "#FFF",
        stroke: "#000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(config.width / 2, config.height / 2, `Score: ${gameState.score}`, {
        fontFamily: "Press Start 2P",
        fontSize: "32px", // Reverted from 64px
        fill: "#FFF",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const restartText = this.add
      .text(config.width / 2, config.height / 2 + 100, "RESTART", {
        // Reverted y
        fontFamily: "Press Start 2P",
        fontSize: "32px", // Reverted from 64px
        fill: "#0F0",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setInteractive();

    restartText.on("pointerdown", () => {
      gameState.currentLevel = 1;
      gameState.playerHealth = 100;
      gameState.score = 0;
      gameState.selectedFighter = null;
      console.log("GameOverScene: Game state reset, starting TitleScene");
      this.cameras.main.fadeOut(500, 0, 0, 0, () =>
        this.scene.start("TitleScene")
      );
    });
    restartText.on("pointerover", () => {
      restartText.setStyle({ fill: "#FF0" });
      this.tweens.add({ targets: restartText, scale: 1.1, duration: 200 });
    });
    restartText.on("pointerout", () => {
      restartText.setStyle({ fill: "#0F0" });
      this.tweens.add({ targets: restartText, scale: 1, duration: 200 });
    });
  }
}

// scripts/LevelCompleteScene.js
import { config, gameState } from "../game.js";

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super("LevelCompleteScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#000");

    this.add
      .text(
        config.width / 2,
        config.height / 2 - 50,
        `LEVEL ${gameState.currentLevel - 1} COMPLETE`,
        {
          fontSize: "32px",
          fill: "#FFF",
          fontFamily: "Arial Black",
        }
      )
      .setOrigin(0.5);

    const continueText = this.add
      .text(config.width / 2, config.height / 2 + 50, "CONTINUE", {
        fontSize: "24px",
        fill: "#0F0",
        fontFamily: "Arial",
      })
      .setOrigin(0.5)
      .setInteractive();

    continueText.on("pointerdown", () => {
      console.log(
        `LevelCompleteScene: Continuing to level ${gameState.currentLevel}`
      );
      this.scene.start("GameScene");
    });
    continueText.on("pointerover", () =>
      continueText.setStyle({ fill: "#FF0" })
    );
    continueText.on("pointerout", () =>
      continueText.setStyle({ fill: "#0F0" })
    );
  }
}

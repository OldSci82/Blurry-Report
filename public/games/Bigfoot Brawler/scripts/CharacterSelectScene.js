// scripts/CharacterSelectScene.js
import { config, gameState } from "../game.js";

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super("CharacterSelectScene");
  }

  preload() {
    // Assets loaded in BootScene
  }

  create() {
    this.cameras.main.setBackgroundColor("#aec6cf");

    this.add
      .text(config.width / 2, config.height / 5, "CHOOSE YOUR FIGHTER", {
        fontSize: "36px",
        fill: "#FFF",
        fontFamily: "Arial Black",
      })
      .setOrigin(0.5);

    // Black-haired fighter sprite and animation
    const blackFighter = this.add
      .sprite(config.width / 2 - 100, config.height / 2, "black_fighter_walk")
      .setScale(1.75)
      .setInteractive();
    blackFighter.play("walk_black"); // Play walking animation

    this.add
      .text(config.width / 2 - 100, config.height / 2 + 120, "Luke", {
        fontSize: "36px",
        fill: "#FFF",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // Red-haired fighter sprite and animation
    const redFighter = this.add
      .sprite(config.width / 2 + 100, config.height / 2, "red_fighter_walk")
      .setScale(1.75)
      .setInteractive();
    redFighter.play("walk_red"); // Play walking animation

    this.add
      .text(config.width / 2 + 100, config.height / 2 + 120, "Nate", {
        fontSize: "36px",
        fill: "#FFF",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // Selection handlers
    blackFighter.on("pointerdown", () => {
      gameState.selectedFighter = "black";
      this.scene.start("GameScene");
    });

    redFighter.on("pointerdown", () => {
      gameState.selectedFighter = "red";
      this.scene.start("GameScene");
    });

    // Visual feedback
    blackFighter.on("pointerover", () => blackFighter.setTint(0x00ff00));
    blackFighter.on("pointerout", () => blackFighter.clearTint());
    redFighter.on("pointerover", () => redFighter.setTint(0xff0000));
    redFighter.on("pointerout", () => redFighter.clearTint());
  }
}

// scripts/scenes/desktop/DesktopGameScene.js
import { BaseGameScene } from "../BaseGameScene.js";
import { gameState } from "../../game.js";

// Change 'export default' to 'export'
export class DesktopGameScene extends BaseGameScene {
  constructor() {
    super("DesktopGameScene");
  }

  create() {
    // Call base setup (world, player, enemies, HUD, etc.)
    super.create?.(); // --- Desktop-specific input setup ---

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyESC = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );

    this.keyZ.on("down", () => this.handlePunch?.());
    this.keyX.on("down", () => this.handleKick?.());
    this.keyESC.on("down", () => this.togglePause());
  }

  update(time, delta) {
    // Call base update
    super.update?.(time, delta); // Desktop input logic is already in BaseGameScene's update()
  }
}

import { BaseGameScene } from "../BaseGameScene.js";
import { gameState } from "../../game.js";
// Import the setupTouchControls function and the global playerInput object
import { setupTouchControls, playerInput } from "../../Utils/inputManager.js";

export class MobileGameScene extends BaseGameScene {
  constructor() {
    super("MobileGameScene");
  }

  create() {
    // Call base setup (world, player, enemies, HUD, etc.)
    // This will now correctly initialize this.playerInput in BaseGameScene
    // and set up this.cursors and this.keys (from inputManager.js)
    super.create?.();
    // --- Mobile-specific touch controls ---

    // Define button configuration for setupTouchControls
    // These constants will be passed to the utility function
    const buttonSize = 80;
    const padding = 30;
    const screenWidth = this.sys.game.config.width;
    const screenHeight = this.sys.game.config.height;

    const buttonConfig = {
      buttonSize: buttonSize,
      padding: padding,
      screenWidth: screenWidth,
      screenHeight: screenHeight,
      // Pass the calculated positions for the utility
      dPadCenterOffsetX: buttonSize + padding + 50, // Your confirmed good spot
      dPadBaseY: screenHeight - padding - buttonSize / 2,
      actionBaseX: screenWidth - padding - buttonSize / 2,
      actionBaseY: screenHeight - padding - buttonSize / 2,
    };

    // --- CRITICAL LINE: Ensure this is present and correct ---
    this.touchButtons = setupTouchControls(this, buttonConfig);

    this.touchControls = this.add
      .container(0, 0)
      .setDepth(100)
      .setScrollFactor(0);
    this.touchControls.add(Object.values(this.touchButtons));
  }

  update(time, delta) {
    // Call base update. BaseGameScene's update will read from the global playerInput
    super.update?.(time, delta);
  }
}

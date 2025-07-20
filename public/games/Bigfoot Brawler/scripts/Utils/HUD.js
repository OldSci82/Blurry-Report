// scripts/utils/HUD.js

// This function will set up all static HUD elements and return references to dynamic ones
export function setupHUD(scene, gameState) {
  // Score Text
  const scoreText = scene.add
    .text(16, 16, `Score: ${gameState.score}`, {
      fontFamily: "Press Start 2P",
      fontSize: "32px", // Fixed font size for consistency, adjust as needed
      fill: "#FFF",
    })
    .setScrollFactor(0)
    .setDepth(100);

  // Level Text (assuming it's also part of your fixed HUD)
  const levelText = scene.add
    .text(
      scene.sys.game.config.width - 16,
      16,
      `Level: ${gameState.currentLevel}`,
      {
        fontFamily: "Press Start 2P",
        fontSize: "32px",
        fill: "#FFF",
      }
    )
    .setOrigin(1, 0) // Align to the right
    .setScrollFactor(0)
    .setDepth(100);

  // Player Health Bar Graphics object
  const playerHealthBar = scene.add.graphics().setScrollFactor(0).setDepth(100);

  // Return all dynamic HUD elements so the scene can update them
  return {
    scoreText,
    levelText,
    playerHealthBar,
    // Include an update function directly in the returned object for health bar
    updateHealthBar: () => {
      playerHealthBar.clear();

      const barWidth = 200;
      const barHeight = 20;
      const barX = 15; // Left aligned
      const barY = 50; // Below score text

      // Background
      playerHealthBar.fillStyle(0x000000, 0.5);
      playerHealthBar.fillRect(barX, barY, barWidth, barHeight);

      // Current health
      const healthWidth =
        (gameState.playerHealth / gameState.maxHealth) * barWidth;
      playerHealthBar.fillStyle(0xff0000, 1);
      playerHealthBar.fillRect(barX, barY, healthWidth, barHeight);

      // Border
      playerHealthBar.lineStyle(2, 0xffffff, 1);
      playerHealthBar.strokeRect(barX, barY, barWidth, barHeight);
    },
  };
}

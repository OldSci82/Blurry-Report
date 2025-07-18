// game.js
import { BootScene } from "./scripts/BootScene.js";
import { TitleScene } from "./scripts/TitleScene.js";
import { CharacterSelectScene } from "./scripts/CharacterSelectScene.js";
import { GameScene } from "./scripts/GameScene.js";
import { GameOverScene } from "./scripts/GameOverScene.js";
import { LevelCompleteScene } from "./scripts/LevelCompleteScene.js";

// Game configuration
export const config = {
  type: Phaser.AUTO,
  width: 1280, // Was 1500
  height: 720, // Was 1500
  zoom: 1 / window.devicePixelRatio, // Adjust for high-DPI screens
  backgroundColor: "#0f1128",
  parent: "game-container",
  scale: {
    mode: Phaser.Scale.FIT, // Scale to fit window while maintaining aspect ratio
    autoCenter: Phaser.Scale.CENTER_BOTH, // Center horizontally and vertically
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    TitleScene,
    CharacterSelectScene,
    GameScene,
    LevelCompleteScene,
    GameOverScene,
  ],
};

// Game state
export const gameState = {
  currentLevel: 1,
  playerHealth: 100,
  maxHealth: 100,
  score: 0,
  selectedFighter: null,
  levelNames: [
    "City Street",
    "Night Market",
    "Train Yard",
    "Forest",
    "Junkyard",
    "Underpass",
    "Lab Facility",
    "Warehouse",
    "Highway",
    "Volcano Lair",
  ],
};

// Launch game
new Phaser.Game(config);

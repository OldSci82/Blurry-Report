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
  width: 800, // Was 1500
  height: 600, // Was 1500
  backgroundColor: "#0f1128",
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "game-container",
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

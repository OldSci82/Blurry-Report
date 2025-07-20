// game.js
// NO import Phaser from "phaser"; or import { Scene, Game } from "phaser";
// Phaser is available globally because it's loaded via script tag in HTML

import { BootScene } from "./Core/BootScene.js";
import { TitleScene } from "./Core/TitleScene.js";
import { CharacterSelectScene } from "./Core/CharacterSelectScene.js";
import { DesktopGameScene } from "./scenes/Desktop/DesktopGameScene.js";
import { MobileGameScene } from "./scenes/Mobile/MobileGameScene.js";
import { GameOverScene } from "./Core/GameOverScene.js";
import { LevelCompleteScene } from "./Core/LevelCompleteScene.js";

export const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  //zoom: 1 / window.devicePixelRatio,
  backgroundColor: "#0f1128",
  parent: "game-container",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: true, // <--- Set this to true temporarily
    },
  },
  scene: [
    BootScene,
    TitleScene,
    CharacterSelectScene,
    DesktopGameScene,
    MobileGameScene,
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
  // ADD THIS PROPERTY:
  enemiesToSpawnPerLevel: [
    5, // Level 1: City Street
    7, // Level 2: Night Market
    10, // Level 3: Train Yard
    12, // Level 4: Forest
    15, // Level 5: Junkyard
    18, // Level 6: Underpass
    20, // Level 7: Lab Facility
    22, // Level 8: Warehouse
    25, // Level 9: Highway
    30, // Level 10: Volcano Lair (Boss Level?)
  ],
};

// Launch game
new Phaser.Game(config);

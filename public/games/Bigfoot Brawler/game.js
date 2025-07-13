// game.js
import { BootScene } from "./scripts/BootScene.js";
import { TitleScene } from "./scripts/TitleScene.js";
import { CharacterSelectScene } from "./scripts/CharacterSelectScene.js";
import { GameScene } from "./scripts/GameScene.js";
import { LevelCompleteScene } from "./scripts/LevelCompleteScene.js";
import { GameOverScene } from "./scripts/GameOverScene.js";

export const config = {
  width: 800,
  height: 400,
};

export const gameState = {
  currentLevel: 1,
  playerHealth: 100,
  score: 0,
  selectedFighter: null,
  levelNames: [
    "Forest Frenzy",
    "Mountain Mayhem",
    "Cave Clash",
    "River Rampage",
    "Desert Duel",
    "Swamp Showdown",
    "Volcano Vengeance",
    "Snowy Skirmish",
    "Jungle Jamboree",
    "Bigfoot's Lair",
  ],
};

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: config.width,
  height: config.height,
  scene: [
    BootScene,
    TitleScene,
    CharacterSelectScene,
    GameScene,
    LevelCompleteScene,
    GameOverScene,
  ],
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
});

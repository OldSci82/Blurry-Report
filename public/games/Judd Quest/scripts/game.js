import { keys, setupInput } from "./input.js";
import { player } from "./player.js";
import { render } from "./renderer.js";
import { scenes } from "./scenes.js";
import { gameState } from "./state.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const tileSize = 16;
let frameCount = 0;

function gameLoop() {
  try {
    console.log(
      `Frame ${frameCount}: Starting loop for scene ${gameState.currentScene}`
    );
    const currentScene = gameState.currentScene;
    if (!scenes[currentScene] || !scenes[currentScene].tilemap) {
      console.error(
        `Invalid scene or tilemap for currentScene: ${currentScene}`,
        scenes
      );
      return;
    }
    updateEligible();
    render(ctx, currentScene, scenes, player);
    console.log(
      `Frame ${frameCount}: Rendered scene ${currentScene} at (${player.x}, ${player.y})`
    );
    frameCount++;
    if (frameCount > 100) {
      console.error(
        "Loop exceeded 100 frames, likely stuck. Stopping. State:",
        { player, currentScene, tilemap: scenes[currentScene].tilemap }
      );
      return;
    }
  } catch (error) {
    console.error("Error in gameLoop:", error, {
      player,
      currentScene: gameState.currentScene,
    });
  }
  requestAnimationFrame(gameLoop);
}

function updateEligible() {
  let newX = player.x;
  let newY = player.y;

  console.log(`Frame ${frameCount}: Checking movement at (${newX}, ${newY})`);
  if (keys["ArrowUp"]) newY -= player.speed; // Re-enable movement
  if (keys["ArrowDown"]) newY += player.speed;
  if (keys["ArrowLeft"]) newX -= player.speed;
  if (keys["ArrowRight"]) newX += player.speed;

  const currentScene = gameState.currentScene;
  const tilemap = scenes[currentScene]
    ? scenes[currentScene].tilemap
    : undefined;
  if (!tilemap) {
    console.error(`Tilemap undefined for scene ${currentScene}`, scenes);
    return;
  }

  const corners = [
    [newX, newY],
    [newX + player.width - 1, newY],
    [newX, newY + player.height - 1],
    [newX + player.width - 1, newY + player.height - 1],
  ];

  let canMove = true;
  for (let [x, y] of corners) {
    const playerTileX = Math.floor(x / tileSize);
    const playerTileY = Math.floor(y / tileSize);
    console.log(
      `Frame ${frameCount}: Checking corner (${x}, ${y}) at tile (${playerTileX}, ${playerTileY})`
    );
    if (
      playerTileX >= 0 &&
      playerTileX < tilemap[0].length &&
      playerTileY >= 0 &&
      playerTileY < tilemap.length
    ) {
      const tile = tilemap[playerTileY][playerTileX];
      if (tile === 3 || tile === 5) {
        canMove = false;
        console.log(
          `Frame ${frameCount}: Blocked by tile ${tile} at (${playerTileX}, ${playerTileY})`
        );
        break;
      }
    } else {
      console.log(
        `Frame ${frameCount}: Out of bounds: (${playerTileX}, ${playerTileY}) for tilemap ${tilemap.length}x${tilemap[0].length}`
      );
    }
  }

  if (canMove) {
    player.x = Math.max(0, Math.min(newX, 800 - player.width));
    player.y = Math.max(0, Math.min(newY, 592 - player.height));
  }
  console.log(
    `Frame ${frameCount}: Updated position to (${player.x}, ${player.y})`
  );
}

setupInput();
gameLoop();

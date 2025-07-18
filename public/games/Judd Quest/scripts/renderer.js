export function render(ctx, currentScene, scenes, player) {
  const tileSize = 16;
  const tilemap = scenes[currentScene].tilemap;

  ctx.clearRect(0, 0, 800, 592);

  if (!tilemap) {
    console.error(`No tilemap for scene ${currentScene}`);
    return;
  }

  // Temporary: Draw colored rectangles instead of images to test rendering
  for (let row = 0; row < tilemap.length; row++) {
    if (!tilemap[row] || !Array.isArray(tilemap[row])) {
      console.error(`Invalid row ${row} in tilemap for scene ${currentScene}`);
      continue;
    }
    for (let col = 0; col < tilemap[row].length; col++) {
      const tile = tilemap[row][col];
      ctx.fillStyle =
        tile === 0
          ? "#00FF00" // Grass
          : tile === 1
          ? "#CCCC00" // Path
          : tile === 2
          ? "#999900" // Corner
          : tile === 3
          ? "#666666" // Wall
          : tile === 4
          ? "#444444" // Wall corner
          : tile === 5
          ? "#0000FF" // Water
          : "#FFFFFF"; // Default
      ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
    }
  }

  ctx.fillStyle = "black";
  ctx.font = "12px Arial";
  ctx.fillText(`Scene ${currentScene}`, 10, 20);

  ctx.fillStyle = "blue";
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

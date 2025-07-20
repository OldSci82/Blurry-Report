// scripts/utils/scaling.js
export function calculateScaleFactor(scene, config) {
  const scaleX = scene.sys.game.scale.displaySize.width / config.width;
  const scaleY = scene.sys.game.scale.displaySize.height / config.height;
  return Math.min(scaleX, scaleY);
}

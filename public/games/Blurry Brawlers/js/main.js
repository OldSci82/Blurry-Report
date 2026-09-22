// Main game bootstrap
const config = {
  type: Phaser.AUTO,
  width: GameConfig.width,
  height: GameConfig.height,
  parent: GameConfig.parent,
  backgroundColor: GameConfig.backgroundColor,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    PreloadScene,
    TitleScene,
    BoardwalkScene1,
    BoardwalkScene2,
    BoardwalkScene3,
  ],
};

new Phaser.Game(config);

import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Minimal boot assets if needed later
  }

  create() {
    // Go straight to preload
    this.scene.start('PreloadScene');
  }
}

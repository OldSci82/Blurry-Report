import Phaser from 'phaser';

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} config
   */
  constructor(scene, x, y, config) {
    const radius = config.radius || 6;
    const color = config.color || 0xffffff;
    const key = `proj_${color.toString(16)}_${radius}`;

    if (!scene.textures.exists(key)) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(color, 1);
      g.fillCircle(radius, radius, radius);
      g.generateTexture(key, radius * 2, radius * 2);
      g.destroy();
    }

    super(scene, x, y, key);

    // Add to scene + enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.damage = config.damage || 10;
    this.lifespan = config.lifespan || 1000;
    this.born = scene.time.now;

    // Body setup
    this.body.setCircle(radius);
    this.body.setAllowGravity(false);
    this.body.setImmovable(false);

    // Set velocity AFTER body is fully ready
    const speed = config.speed || 300;
    const angle = config.angle || 0;

    this.body.velocity.x = Math.cos(angle) * speed;
    this.body.velocity.y = Math.sin(angle) * speed;

    // Small visual pop
    this.setScale(0.7);
    scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 60,
      ease: 'Back.easeOut'
    });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (time - this.born > this.lifespan) {
      this.destroy();
    }
  }
}

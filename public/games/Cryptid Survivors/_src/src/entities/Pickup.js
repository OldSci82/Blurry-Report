import Phaser from 'phaser';

/**
 * Collectible drop (XP orb, health, etc.) — bright glowing look
 */
export default class Pickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config = {}) {
    const type = config.type || 'xp';
    const coreR = config.radius || (type === 'xp' ? 6 : 8);
    const color = config.color || Pickup.colorForType(type);
    // Texture includes outer glow padding
    const pad = Math.ceil(coreR * 1.8);
    const texSize = (coreR + pad) * 2;
    const key = `pickup_glow_${type}_${color.toString(16)}_${coreR}`;

    if (!scene.textures.exists(key)) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      const cx = coreR + pad;
      const cy = coreR + pad;

      // Soft outer glow layers
      g.fillStyle(color, 0.12);
      g.fillCircle(cx, cy, coreR + pad);
      g.fillStyle(color, 0.22);
      g.fillCircle(cx, cy, coreR + pad * 0.65);
      g.fillStyle(color, 0.45);
      g.fillCircle(cx, cy, coreR + pad * 0.35);

      // Bright core
      g.fillStyle(color, 1);
      g.fillCircle(cx, cy, coreR);
      // Hot center highlight
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(cx - coreR * 0.2, cy - coreR * 0.25, Math.max(2, coreR * 0.4));
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(cx, cy, Math.max(1.5, coreR * 0.22));

      g.generateTexture(key, texSize, texSize);
      g.destroy();
    }

    super(scene, x, y, key);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.pickupType = type;
    this.value = config.value || 5;
    this.magnetSpeed = config.magnetSpeed || 280;
    this.isBeingPulled = false;
    this.coreRadius = coreR;

    this.body.setCircle(coreR);
    // Offset body to center of padded texture
    this.body.setOffset(pad, pad);
    this.body.setAllowGravity(false);
    this.body.setImmovable(false);

    this.setDepth(4);
    this.setScale(0.35);
    this.setAlpha(0.95);

    scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 160,
      ease: 'Back.easeOut'
    });

    // Gentle pulse so they feel alive / glowing
    scene.tweens.add({
      targets: this,
      scale: 1.12,
      alpha: 1,
      duration: 450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  static colorForType(type) {
    switch (type) {
      case 'health': return 0x4ade80;  // neon green
      case 'spark': return 0xfde047;   // bright gold
      case 'xp':
      default: return 0x7dd3fc;        // bright cyan
    }
  }

  updateMagnet(player) {
    if (!this.active || !player || !player.active || player.isDowned) return false;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const range = player.pickupRange || 60;

    if (dist <= 18) {
      return true;
    }

    if (dist <= range) {
      this.isBeingPulled = true;
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      const speed = this.magnetSpeed * (1.2 - Math.min(1, dist / range) * 0.5);
      this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    } else if (this.isBeingPulled) {
      this.body.setVelocity(this.body.velocity.x * 0.9, this.body.velocity.y * 0.9);
    }

    return false;
  }
}

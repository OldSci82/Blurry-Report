import Phaser from 'phaser';

/**
 * Nightcrawler-themed enemies for Level 1.
 * Types: chaser | lunger | spitter | boss (mini or level)
 */
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config = {}) {
    const type = config.type || 'chaser';
    const isBoss = config.isBoss || false;
    const isLevelBoss = config.isLevelBoss || false;

    // Pick texture tier
    let textureKey = 'fnc_walk';
    if (isLevelBoss) textureKey = 'fnc_boss_walk';
    else if (isBoss) textureKey = 'fnc_miniboss_walk';

    const hasSprite = scene.textures.exists(textureKey);
    if (!hasSprite) {
      const radius = config.radius || 13;
      const fallback = `enemy_fb_${type}_${radius}`;
      if (!scene.textures.exists(fallback)) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xef4444, 1);
        g.fillCircle(radius, radius, radius);
        g.generateTexture(fallback, radius * 2, radius * 2);
        g.destroy();
      }
      super(scene, x, y, fallback);
    } else {
      super(scene, x, y, textureKey, 0);
    }

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.enemyType = type;
    this.speed = config.speed || 80;
    this.maxHp = config.hp || 20;
    this.hp = this.maxHp;
    this.damage = config.damage || 8;
    this.xpValue = config.xpValue || 5;
    this.scoreValue = config.scoreValue || 10;
    this.isBoss = isBoss;
    this.isLevelBoss = isLevelBoss;
    this.isDead = false;
    this.hasSprite = hasSprite;
    this.isBursting = false;

    // Body sizes by tier — cover the torso (sprite origin is near the feet)
    if (isLevelBoss) {
      // 128×128 frame
      this.setOrigin(0.5, 0.85);
      this.body.setSize(70, 90);
      this.body.setOffset(29, 28);
      this.setDepth(12);
    } else if (isBoss) {
      // 96×96 frame
      this.setOrigin(0.5, 0.85);
      this.body.setSize(50, 64);
      this.body.setOffset(23, 22);
      this.setDepth(11);
    } else {
      // 64×64 frame
      this.setOrigin(0.5, 0.85);
      this.body.setSize(36, 48);
      this.body.setOffset(14, 12);
      this.setDepth(10);
    }

    this.body.setCollideWorldBounds(false);
    this.body.setAllowGravity(false);

    // AI state
    this.lungeState = 'approach';
    this.lungeTimer = 0;
    this.lungeCooldown = 0;
    this.preferredRange = config.preferredRange || 220;
    this.fireCooldown = Phaser.Math.Between(400, 1200);
    this.fireInterval = config.fireInterval || 1400;
    this.specialCooldown = isLevelBoss ? 4000 : 99999;
    this.specialTimer = 0;
    this.inSpecial = false;
    this.currentAnimKey = null;
    this._jumpPlaying = false;

    // Soft spawn pop
    this.setScale((config.scale || 1) * 0.5);
    scene.tweens.add({
      targets: this,
      scale: config.scale || 1,
      duration: 160,
      ease: 'Back.easeOut'
    });

    if (this.hasSprite) {
      this.playMoveAnim();
    }
  }

  playMoveAnim() {
    if (!this.hasSprite) return;
    let key = 'fnc_walk';
    if (this.isLevelBoss) key = 'fnc_boss_walk';
    else if (this.isBoss) key = 'fnc_miniboss_walk';
    if (this.currentAnimKey !== key) {
      this.currentAnimKey = key;
      if (this.scene.anims.exists(key)) this.anims.play(key, true);
    }
  }

  playJumpAnim() {
    if (!this.hasSprite) return;
    let key = 'fnc_jump';
    if (this.isLevelBoss) key = 'fnc_boss_jump';
    else if (this.isBoss) key = 'fnc_miniboss_jump';
    this.currentAnimKey = key;
    this._jumpPlaying = true;
    if (this.scene.anims.exists(key)) {
      this.anims.play(key, true);
      this.once('animationcomplete', () => {
        this._jumpPlaying = false;
        if (this.active && !this.isDead) this.playMoveAnim();
      });
    }
  }

  playBossSpecialAnim() {
    if (!this.hasSprite || !this.isLevelBoss) return;
    this.currentAnimKey = 'fnc_boss_idleattack';
    this.inSpecial = true;
    if (this.scene.anims.exists('fnc_boss_idleattack')) {
      this.anims.play('fnc_boss_idleattack', true);
      this.once('animationcomplete', () => {
        this.inSpecial = false;
        if (this.active && !this.isDead) this.playMoveAnim();
      });
    }
  }

  facePlayer(player) {
    if (!player) return;
    // Art faces LEFT by default — flip when player is to the RIGHT
    this.setFlipX(player.x > this.x);
  }

  /**
   * Jump to the player's current position over durationSec.
   * If the player doesn't dodge, the leap should connect.
   */
  leapAtPlayer(player, durationSec = 0.38, overshoot = 1.08) {
    if (!player || !this.body) return;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const speed = Math.max(240, (dist * overshoot) / Math.max(0.12, durationSec));
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.facePlayer(player);
  }

  update(time, delta, player) {
    if (!this.active || this.isDead || !player || !player.active || player.isDowned) {
      if (this.body) this.body.setVelocity(0, 0);
      return;
    }

    if (this.isBursting) return;

    switch (this.enemyType) {
      case 'lunger': this.updateLunger(delta, player); break;
      case 'spitter': this.updateSpitter(delta, player); break;
      case 'boss': this.updateBoss(delta, player); break;
      default: this.updateChaser(player); break;
    }
  }

  updateChaser(player) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    this.facePlayer(player);
    if (!this._jumpPlaying) this.playMoveAnim();
  }

  updateLunger(delta, player) {
    this.lungeCooldown = Math.max(0, this.lungeCooldown - delta);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    this.facePlayer(player);

    if (this.lungeState === 'approach') {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      this.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
      if (!this._jumpPlaying) this.playMoveAnim();

      if (dist < 170 && this.lungeCooldown <= 0) {
        this.lungeState = 'windup';
        this.lungeTimer = 280;
        this.body.setVelocity(0, 0);
        this.setTint(0xfbbf24);
        this.playJumpAnim(); // crouch frames of jump
      }
    } else if (this.lungeState === 'windup') {
      this.lungeTimer -= delta;
      this.body.setVelocity(0, 0);
      if (this.lungeTimer <= 0) {
        this.lungeState = 'lunging';
        // Long enough to cover approach-range distances
        this.lungeTimer = 380;
        this.clearTint();
        this.leapAtPlayer(player, 0.38, 1.08);
      }
    } else if (this.lungeState === 'lunging') {
      this.lungeTimer -= delta;
      if (this.lungeTimer <= 0) {
        this.lungeState = 'recovery';
        this.lungeTimer = 400;
        this.body.setVelocity(0, 0);
      }
    } else if (this.lungeState === 'recovery') {
      this.lungeTimer -= delta;
      if (this.lungeTimer <= 0) {
        this.lungeState = 'approach';
        this.lungeCooldown = 1500;
        this.playMoveAnim();
      }
    }
  }

  updateSpitter(delta, player) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.facePlayer(player);

    if (dist > this.preferredRange + 40) {
      this.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
      if (!this._jumpPlaying) this.playMoveAnim();
    } else if (dist < this.preferredRange - 40) {
      this.body.setVelocity(-Math.cos(angle) * this.speed * 0.8, -Math.sin(angle) * this.speed * 0.8);
      if (!this._jumpPlaying) this.playMoveAnim();
    } else {
      this.body.setVelocity(0, 0);
      // Idle on first walk frame while holding range
      if (this.hasSprite && this.anims.currentAnim) {
        this.anims.pause();
        this.currentAnimKey = null;
      }
    }

    this.fireCooldown -= delta;
    if (this.fireCooldown <= 0 && dist < this.preferredRange + 90) {
      this.fireCooldown = this.fireInterval;
      this.fireAt(player, false);
    }
  }

  updateBoss(delta, player) {
    this.facePlayer(player);
    this.lungeCooldown = Math.max(0, this.lungeCooldown - delta);
    this.specialCooldown = Math.max(0, this.specialCooldown - delta);

    // Level boss special: idleattack AoE + multi-shot
    if (this.inSpecial) {
      this.body.setVelocity(0, 0);
      this.specialTimer -= delta;
      // Pulse vicinity damage a few times during the anim
      if (this.specialTimer > 0 && Math.floor(this.specialTimer / 350) !== Math.floor((this.specialTimer + delta) / 350)) {
        this.vicinityDamage(player, 110, Math.floor(this.damage * 0.55));
      }
      return;
    }

    if (this.lungeState === 'windup' || this.lungeState === 'lunging') {
      if (this.lungeState === 'windup') {
        this.lungeTimer -= delta;
        this.body.setVelocity(0, 0);
        if (this.lungeTimer <= 0) {
          this.lungeState = 'lunging';
          this.lungeTimer = 420;
          this.clearTint();
          this.leapAtPlayer(player, 0.42, 1.1);
        }
      } else {
        this.lungeTimer -= delta;
        if (this.lungeTimer <= 0) {
          this.lungeState = 'approach';
          this.lungeCooldown = this.isLevelBoss ? 2800 : 3000;
          this.playMoveAnim();
        }
      }
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const preferred = this.isLevelBoss ? 240 : 250;

    if (dist > preferred + 50) {
      this.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
      if (!this._jumpPlaying) this.playMoveAnim();
    } else if (dist < preferred - 50) {
      this.body.setVelocity(-Math.cos(angle) * this.speed * 0.7, -Math.sin(angle) * this.speed * 0.7);
      if (!this._jumpPlaying) this.playMoveAnim();
    } else {
      this.body.setVelocity(0, 0);
    }

    // Level boss special attack
    if (this.isLevelBoss && this.specialCooldown <= 0 && dist < 320) {
      this.startBossSpecial(player);
      return;
    }

    // Jump-lunge when close
    if (dist < 190 && this.lungeCooldown <= 0) {
      this.lungeState = 'windup';
      this.lungeTimer = 380;
      this.setTint(0xfbbf24);
      this.playJumpAnim();
      return;
    }

    this.fireCooldown -= delta;
    if (this.fireCooldown <= 0) {
      this.fireCooldown = this.isLevelBoss ? 850 : 1100;
      this.fireAt(player, true);
    }
  }

  startBossSpecial(player) {
    this.inSpecial = true;
    this.specialCooldown = 7000;
    this.specialTimer = 1800; // ~length of 22 frames @ 12fps
    this.body.setVelocity(0, 0);
    this.playBossSpecialAnim();

    // Burst of projectiles during the roar
    const shots = 6;
    for (let i = 0; i < shots; i++) {
      this.scene.time.delayedCall(200 + i * 160, () => {
        if (!this.active || this.isDead) return;
        const base = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const spread = (i - (shots - 1) / 2) * 0.22;
        this.fireAtAngle(base + spread, true);
      });
    }
    // Center vicinity smack mid-anim
    this.scene.time.delayedCall(700, () => {
      if (this.active && !this.isDead) this.vicinityDamage(player, 120, Math.floor(this.damage * 0.8));
    });
  }

  vicinityDamage(player, radius, dmg) {
    if (!player || !player.active || player.isDowned) return;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist <= radius) {
      player.takeDamage(dmg);
      // Small ring VFX
      const ring = this.scene.add.circle(this.x, this.y, 20, 0xf87171, 0.35).setDepth(8);
      this.scene.tweens.add({
        targets: ring,
        radius: radius,
        alpha: 0,
        duration: 280,
        onComplete: () => ring.destroy()
      });
    }
  }

  fireAt(player, isBoss = false) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.fireAtAngle(angle, isBoss);
  }

  fireAtAngle(angle, isBoss = false) {
    const speed = isBoss ? 280 : 240;
    // Pale nightcrawler residue
    const color = isBoss ? 0xfecaca : 0xe2e8f0;
    const radius = isBoss ? 8 : 5;

    const key = `eproj_${color.toString(16)}`;
    if (!this.scene.textures.exists(key)) {
      const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(color, 1);
      g.fillCircle(radius, radius, radius);
      g.generateTexture(key, radius * 2, radius * 2);
      g.destroy();
    }

    const muzzleY = this.y - (this.isLevelBoss ? 40 : this.isBoss ? 28 : 18);
    const proj = this.scene.physics.add.sprite(this.x, muzzleY, key);
    proj.setDepth(5);
    proj.body.setCircle(radius);
    proj.body.setAllowGravity(false);
    proj.body.velocity.x = Math.cos(angle) * speed;
    proj.body.velocity.y = Math.sin(angle) * speed;
    proj.damage = isBoss ? Math.floor(this.damage * 0.7) : Math.floor(this.damage * 0.6);
    proj.isEnemyProjectile = true;

    if (!this.scene.enemyProjectiles) this.scene.enemyProjectiles = [];
    this.scene.enemyProjectiles.push(proj);

    this.scene.time.delayedCall(1800, () => {
      if (proj.active) proj.destroy();
    });
  }

  takeDamage(amount) {
    if (this.isDead || !this.active) return true;

    this.hp -= amount;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (this.active && !this.isDead) this.clearTint();
    });

    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.hp = 0;

    if (this.body) this.body.setVelocity(0, 0);
    if (this.anims) this.anims.stop();

    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 140,
      onComplete: () => {
        if (this.healthBarBg) {
          this.healthBarBg.destroy();
          this.healthBarFill.destroy();
          this.healthBarBg = null;
          this.healthBarFill = null;
        }
        this.destroy();
      }
    });

    this.scene.events.emit('enemy-killed', {
      x: this.x,
      y: this.y,
      xp: this.xpValue,
      score: this.scoreValue,
      isBoss: this.isBoss,
      isLevelBoss: this.isLevelBoss
    });
  }
}

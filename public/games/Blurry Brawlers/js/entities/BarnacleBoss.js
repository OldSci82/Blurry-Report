class BarnacleBoss extends Enemy {
  constructor(scene, x, y, texture, scale = 1.35) {
    super(scene, x, y, texture, scale);

    this.type = "barnacle-boss";
    this.health = 8;
    this.maxHealth = 8;
    this.speed = 2.4; // Slightly faster
    this.detectionRange = 520; // Very aggressive chase range
  }

  // ===================== ANIMATIONS =====================
  playWalkAnimation() {
    if (!this.sprite || !this.sprite.anims) return;
    this.playAnimation("barnacle-walk", true);
  }

  playIdleAnimation() {
    if (!this.sprite || !this.sprite.anims) return;
    this.playAnimation("barnacle-idle", true);
  }

  // ===================== AGGRESSIVE AI =====================
  updateAI(player) {
    if (!this.sprite || this.isDead) return;
    if (this.isAttacking) return;

    const distance = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      player.sprite.x,
      player.sprite.y,
    );

    // Always chase when in range (very wide range)
    if (distance < this.detectionRange) {
      this.chasePlayer(player);
      this.playWalkAnimation();
    } else {
      // Light wandering when very far (still moves)
      this.wander();
      if (this.directionX !== 0 || this.directionY !== 0) {
        this.playWalkAnimation();
      } else {
        this.playIdleAnimation();
      }
    }

    // Occasional attacks (we'll improve Attack3 pounce later)
    const now = this.scene.time.now;
    if (now > this.lastAttackTime + 2400) {
      const rand = Math.random();

      if (rand < 0.25) {
        this.isAttacking = true;
        this.lastAttackTime = now;
        this.playAttackAnimation(1);

        this.scene.time.delayedCall(950, () => {
          if (this.sprite && this.sprite.active) this.isAttacking = false;
        });
      } else if (rand < 0.45) {
        this.isAttacking = true;
        this.lastAttackTime = now;
        this.playAttackAnimation(2);

        this.scene.time.delayedCall(950, () => {
          if (this.sprite && this.sprite.active) this.isAttacking = false;
        });
      }
    }
  }

  // ===================== DEATH =====================
  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.isAttacking = false;

    this.scene.events.off("update", this.updateHitboxPosition, this);

    if (this.healthBar) this.healthBar.destroy();
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.hitboxDebug) this.hitboxDebug.destroy();
    if (this.attackHitboxDebug) this.attackHitboxDebug.destroy();

    if (this.sprite && this.sprite.active) {
      this.sprite.play("barnacle-death", true);

      this.sprite.once("animationcomplete", () => {
        this.scene.time.delayedCall(2500, () => {
          if (this.sprite && this.sprite.active) this.sprite.destroy();
        });
      });
    }

    if (this.scene.decrementEnemyCount) {
      this.scene.decrementEnemyCount();
    }

    console.log("Barnacle Boss defeated!");
  }
}

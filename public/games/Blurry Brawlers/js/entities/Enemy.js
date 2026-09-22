class Enemy {
  constructor(scene, x, y, texture, scale = 1) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, texture);

    this.defaultScale = scale;
    this.sprite.setScale(this.defaultScale);

    this.health = 3;
    this.maxHealth = 3;
    this.isDead = false;
    this.type = "crab";

    this.speed = 0.8;
    this.detectionRange = 200;
    this.attackRange = 60;
    this.attackCooldownTime = 1400;
    this.lastAttackTime = 0;

    this.directionX = 0;
    this.directionY = 0;
    this.directionChangeTimer = 0;

    this.hitboxWidth = 40;
    this.hitboxHeight = 60;
    this.hitboxOffsetY = -60;

    this.createHealthBar();
    this.createHitbox();

    this.attackHitboxWidth = 30;
    this.attackHitboxHeight = 30;
    this.attackHitboxOffsetX = -40;
    this.attackHitboxOffsetY = -60;

    this.attackHitboxDebug = this.scene.add.rectangle(
      this.sprite.x,
      this.sprite.y,
      this.attackHitboxWidth,
      this.attackHitboxHeight,
      0xff00ff,
      0.3,
    );
    this.attackHitboxDebug.setStrokeStyle(2, 0xff00ff);
    this.attackHitboxDebug.setVisible(false);

    this.isAttacking = false;
    this.currentAttack = null;
  }

  createHitbox() {
    this.hitboxDebug = this.scene.add.rectangle(
      this.sprite.x,
      this.sprite.y,
      this.hitboxWidth,
      this.hitboxHeight,
      0x00ff00,
      0.3,
    );
    this.hitboxDebug.setStrokeStyle(1, 0x00ff00);
    this.hitboxDebug.setVisible(false);

    this.scene.events.on("update", this.updateHitboxPosition, this);
  }

  updateHitboxPosition() {
    if (!this.sprite || this.isDead || !this.hitboxDebug) return;

    this.hitboxDebug.x = this.sprite.x;
    this.hitboxDebug.y = this.sprite.y + this.hitboxOffsetY;
    this.hitboxDebug.width = this.hitboxWidth;
    this.hitboxDebug.height = this.hitboxHeight;
  }

  getHitbox() {
    return new Phaser.Geom.Rectangle(
      this.sprite.x - this.hitboxWidth / 2,
      this.sprite.y + this.hitboxOffsetY - this.hitboxHeight / 2,
      this.hitboxWidth,
      this.hitboxHeight,
    );
  }

  createHealthBar() {
    const barWidth = 40;
    const barHeight = 6;
    const offsetY = -100;

    this.healthBarBg = this.scene.add
      .rectangle(
        this.sprite.x,
        this.sprite.y + offsetY,
        barWidth,
        barHeight,
        0x000000,
      )
      .setStrokeStyle(1, 0xffffff);

    this.healthBar = this.scene.add.rectangle(
      this.sprite.x,
      this.sprite.y + offsetY,
      barWidth,
      barHeight,
      0xff0000,
    );
  }

  updateAI(player) {
    if (!this.sprite || this.isDead) return;
    if (this.isAttacking) return;

    const distance = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      player.sprite.x,
      player.sprite.y,
    );

    if (distance <= this.attackRange) {
      const currentTime = this.scene.time.now;
      if (currentTime > this.lastAttackTime + this.attackCooldownTime) {
        this.attack(player);
      } else {
        this.playIdleAnimation();
      }
    } else if (distance <= this.detectionRange) {
      this.chasePlayer(player);
      this.playWalkAnimation();
    } else {
      this.wander();
      if (this.directionX !== 0 || this.directionY !== 0) {
        this.playWalkAnimation();
      } else {
        this.playIdleAnimation();
      }
    }
  }

  facePlayer(player) {
    if (!this.sprite || !player?.sprite) return;
    const dx = player.sprite.x - this.sprite.x;
    this.sprite.setFlipX(dx > 0);
  }

  // ===================== ANIMATIONS =====================
  playWalkAnimation() {
    if (!this.sprite || !this.sprite.anims) return;

    if (this.scene.anims.exists("crab-walk")) {
      this.playAnimation("crab-walk", true);
    }
  }

  playIdleAnimation() {
    if (!this.sprite || !this.sprite.anims) return;

    if (this.scene.anims.exists("crab-idle")) {
      this.playAnimation("crab-idle", true);
    }
  }

  playAnimation(key, ignoreIfPlaying = false) {
    if (!this.sprite || !this.sprite.anims) return;

    if (!this.scene.anims.exists(key)) {
      console.warn(`[Enemy] Animation not found: ${key}`);
      return;
    }

    if (ignoreIfPlaying && this.sprite.anims.currentAnim?.key === key) {
      return;
    }

    this.sprite.play(key, true);
  }

  // ===================== WANDER =====================
  wander() {
    this.directionChangeTimer++;

    if (this.directionChangeTimer > 90) {
      this.directionX = Phaser.Math.Between(-1, 1);
      this.directionY = Phaser.Math.Between(-1, 1);
      this.directionChangeTimer = 0;
    }

    const b = this.bounds || { left: 30, right: 770, top: 440, bottom: 520 };

    let newX = this.sprite.x + this.directionX * this.speed;
    let newY = this.sprite.y + this.directionY * this.speed;

    newX = Phaser.Math.Clamp(newX, b.left, b.right);
    newY = Phaser.Math.Clamp(newY, b.top, b.bottom);

    this.sprite.x = newX;
    this.sprite.y = newY;

    if (this.directionX !== 0) {
      this.sprite.setFlipX(this.directionX > 0);
    }
  }

  // ===================== CHASE =====================
  chasePlayer(player) {
    this.facePlayer(player);

    const dx = player.sprite.x - this.sprite.x;
    const dy = player.sprite.y - this.sprite.y;

    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) return;

    const dirX = dx / distance;
    const dirY = dy / distance;

    const b = this.bounds || { left: 30, right: 770, top: 440, bottom: 520 };

    let newX = this.sprite.x + dirX * this.speed;
    let newY = this.sprite.y + dirY * this.speed;

    newX = Phaser.Math.Clamp(newX, b.left, b.right);
    newY = Phaser.Math.Clamp(newY, b.top, b.bottom);

    this.sprite.x = newX;
    this.sprite.y = newY;
    this.sprite.setFlipX(dirX > 0);
  }

  // ===================== ATTACK =====================
  attack(player) {
    this.facePlayer(player);
    this.lastAttackTime = this.scene.time.now;

    const dx = player.sprite.x - this.sprite.x;
    this.sprite.setFlipX(dx > 0);

    this.sprite.setTexture("crab-attack1");
    this.startAttack("attack1");

    this.scene.time.delayedCall(500, () => {
      if (this.sprite && this.sprite.active) {
        this.sprite.setTexture("crab-idle");
        this.endAttack();
      }
    });
  }

  updateAttackHitboxPosition() {
    if (!this.sprite || this.isDead || !this.attackHitboxDebug) return;

    if (!this.isAttacking) {
      this.attackHitboxDebug.setVisible(false);
      return;
    }

    const offsetX = this.sprite.flipX
      ? -this.attackHitboxOffsetX
      : this.attackHitboxOffsetX;

    this.attackHitboxDebug.x = this.sprite.x + offsetX;
    this.attackHitboxDebug.y = this.sprite.y + this.attackHitboxOffsetY;
    this.attackHitboxDebug.width = this.attackHitboxWidth;
    this.attackHitboxDebug.height = this.attackHitboxHeight;

    if (this.scene.debugHitboxes) {
      this.attackHitboxDebug.setVisible(true);
    }
  }

  getAttackHitbox() {
    const offsetX = this.sprite.flipX
      ? -this.attackHitboxOffsetX
      : this.attackHitboxOffsetX;

    return new Phaser.Geom.Rectangle(
      this.sprite.x + offsetX - this.attackHitboxWidth / 2,
      this.sprite.y + this.attackHitboxOffsetY - this.attackHitboxHeight / 2,
      this.attackHitboxWidth,
      this.attackHitboxHeight,
    );
  }

  startAttack(attackType = "attack1") {
    this.isAttacking = true;
    this.currentAttack = attackType;

    if (this.attackHitboxDebug && this.scene.debugHitboxes) {
      this.attackHitboxDebug.setVisible(true);
    }
  }

  endAttack() {
    this.isAttacking = false;
    this.currentAttack = null;

    if (this.attackHitboxDebug) {
      this.attackHitboxDebug.setVisible(false);
    }
  }

  update() {
    if (!this.sprite || this.isDead) return;

    const offsetY = -120;
    this.healthBarBg.x = this.sprite.x;
    this.healthBarBg.y = this.sprite.y + offsetY;
    this.healthBar.x = this.sprite.x;
    this.healthBar.y = this.sprite.y + offsetY;

    const healthPercent = Math.max(0, this.health / this.maxHealth);
    this.healthBar.width = 40 * healthPercent;

    this.updateAttackHitboxPosition();
  }

  takeDamage(amount, attackerX) {
    if (this.isDead) return;

    this.health -= amount;

    const direction = this.sprite.x > attackerX ? 1 : -1;
    this.sprite.x += direction * 30;

    if (this.health <= 0) {
      this.die();
    }
  }

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
      this.sprite.play("crab-death", true);

      this.sprite.once("animationcomplete", () => {
        this.scene.time.delayedCall(2500, () => {
          if (this.sprite && this.sprite.active) {
            this.sprite.destroy();
          }
        });
      });
    }

    if (this.scene.decrementEnemyCount) {
      this.scene.decrementEnemyCount();
    }

    console.log(`${this.type} has died!`);
  }
}

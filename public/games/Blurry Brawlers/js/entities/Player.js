class Player {
  constructor(scene, x, y, type = "nate", bounds = null) {
    this.scene = scene;
    this.type = type;
    this.bounds = bounds;
    this.canMove = true;

    // ===================== ASSET KEYS =====================
    this.keys = {
      walk: `${type}-walk`,
      idle: `${type}-idle`,
      jump: `${type}-jump`,
      punch: `${type}-punch`,
      kick: `${type}-kick`,
    };

    // ===================== SCALES =====================
    this.defaultScale = 0.11; // Used for idle, punch, kick, jump
    this.walkScale = 0.8; // Scale used while playing walk animation

    this.isAttacking = false;
    this.isJumping = false;

    // Create the player sprite
    this.sprite = scene.add
      .sprite(x, y, this.keys.idle)
      .setScale(this.defaultScale)
      .setOrigin(0.5, 1);

    this.createAnimations();

    // ===================== HEALTH & DAMAGE =====================
    this.health = 5;
    this.maxHealth = 5;
    this.isInvincible = false;
    this.invincibilityDuration = 1000; // 1 second

    // ===================== COMBAT SETTINGS =====================
    this.showHitboxes = true; // Toggle debug hitboxes
    this.hitRange = 50; // Attack range (easy to tweak)
    this.hitDamage = 1; // Damage per successful hit

    // ===================== HURTBOX (for taking damage) =====================
    this.hurtboxWidth = 45;
    this.hurtboxHeight = 75;
    this.hurtboxOffsetY = -55;

    this.hurtboxDebug = this.scene.add.rectangle(
      this.sprite.x,
      this.sprite.y,
      this.hurtboxWidth,
      this.hurtboxHeight,
      0x0000ff,
      0.3,
    );
    this.hurtboxDebug.setStrokeStyle(2, 0x0000ff);
    this.hurtboxDebug.setVisible(false);
  }

  // ===================== CREATE ANIMATIONS =====================
  createAnimations() {
    const scene = this.scene;
    const k = this.keys;
    const prefix = this.type;

    // Walk animation
    if (
      scene.textures.exists(k.walk) &&
      !scene.anims.exists(`${prefix}-walk`)
    ) {
      scene.anims.create({
        key: `${prefix}-walk`,
        frames: scene.anims.generateFrameNumbers(k.walk, { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // Idle animation (single frame)
    if (!scene.anims.exists(`${prefix}-idle`)) {
      scene.anims.create({
        key: `${prefix}-idle`,
        frames: [{ key: k.idle }],
        frameRate: 1,
        repeat: -1,
      });
    }

    // Jump animation (single frame)
    if (
      scene.textures.exists(k.jump) &&
      !scene.anims.exists(`${prefix}-jump`)
    ) {
      scene.anims.create({
        key: `${prefix}-jump`,
        frames: [{ key: k.jump }],
        frameRate: 1,
        repeat: 0,
      });
    }

    // Punch animation (single frame)
    if (
      scene.textures.exists(k.punch) &&
      !scene.anims.exists(`${prefix}-punch`)
    ) {
      scene.anims.create({
        key: `${prefix}-punch`,
        frames: [{ key: k.punch }],
        frameRate: 1,
        repeat: 0,
      });
    }

    // Kick animation (single frame)
    if (
      scene.textures.exists(k.kick) &&
      !scene.anims.exists(`${prefix}-kick`)
    ) {
      scene.anims.create({
        key: `${prefix}-kick`,
        frames: [{ key: k.kick }],
        frameRate: 1,
        repeat: 0,
      });
    }
  }

  // ===================== HURTBOX POSITION =====================
  updateHurtboxPosition() {
    if (!this.sprite || !this.hurtboxDebug) return;

    this.hurtboxDebug.x = this.sprite.x;
    this.hurtboxDebug.y = this.sprite.y + this.hurtboxOffsetY;
    this.hurtboxDebug.width = this.hurtboxWidth;
    this.hurtboxDebug.height = this.hurtboxHeight;
  }

  // ===================== TAKE DAMAGE =====================
  takeDamage(amount, enemies = []) {
    if (this.isInvincible || this.health <= 0) return;

    this.health -= amount;

    // Find direction away from closest enemy for knockback
    let dirX = 0;
    let dirY = 0;

    if (enemies.length > 0) {
      let closestEnemy = enemies[0];
      let closestDistance = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        closestEnemy.x,
        closestEnemy.y,
      );

      for (let i = 1; i < enemies.length; i++) {
        const dist = Phaser.Math.Distance.Between(
          this.sprite.x,
          this.sprite.y,
          enemies[i].x,
          enemies[i].y,
        );
        if (dist < closestDistance) {
          closestDistance = dist;
          closestEnemy = enemies[i];
        }
      }

      dirX = this.sprite.x - closestEnemy.x;
      dirY = this.sprite.y - closestEnemy.y;

      const length = Math.sqrt(dirX * dirX + dirY * dirY);
      if (length > 0) {
        dirX /= length;
        dirY /= length;
      } else {
        dirX = 1;
      }
    } else {
      dirX = 1; // Fallback direction
    }

    // Smooth knockback (X + Y)
    const knockbackDistance = 128;
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.sprite.x + dirX * knockbackDistance,
      y: this.sprite.y + dirY * knockbackDistance,
      duration: 1000,
      ease: "Linear",
    });

    // Invincibility + visual effects
    this.isInvincible = true;
    this.canMove = false;

    const originalTexture = this.sprite.texture.key;
    this.sprite.setTexture("nate-hurt");
    this.sprite.setTint(0xff5555);

    // Blinking effect
    const blinkEvent = this.scene.time.addEvent({
      delay: 120,
      repeat: 7,
      callback: () => {
        if (this.sprite && this.sprite.active) {
          this.sprite.setVisible(!this.sprite.visible);
        }
      },
    });

    // End invincibility after duration
    this.scene.time.delayedCall(this.invincibilityDuration, () => {
      if (this.sprite && this.sprite.active) {
        this.sprite.setVisible(true);
        this.sprite.clearTint();
        this.sprite.setTexture(originalTexture);
        this.isInvincible = false;
        this.canMove = true;
        blinkEvent.remove();
      }
    });

    // Clamp to bounds after knockback
    if (this.bounds) {
      this.sprite.x = Phaser.Math.Clamp(
        this.sprite.x,
        this.bounds.left,
        this.bounds.right,
      );
      this.sprite.y = Phaser.Math.Clamp(
        this.sprite.y,
        this.bounds.top,
        this.bounds.bottom,
      );
    }

    console.log(
      `Nate took ${amount} damage! Health: ${this.health}/${this.maxHealth}`,
    );
  }

  // ===================== ATTACK HIT DETECTION =====================
  attackHitCheck(enemies = []) {
    if (!this.sprite || enemies.length === 0) return;

    const hitRange = this.hitRange;
    const hitHeight = 30;

    const attackX =
      this.sprite.x + (this.sprite.flipX ? -hitRange / 2 : hitRange / 2);
    const attackY = this.sprite.y - 55;

    const hitbox = new Phaser.Geom.Rectangle(
      attackX - hitRange / 2,
      attackY - hitHeight / 2,
      hitRange,
      hitHeight,
    );

    // Show debug hitbox (red) if enabled
    if (this.showHitboxes) {
      const debugBox = this.scene.add.rectangle(
        hitbox.x + hitbox.width / 2,
        hitbox.y + hitbox.height / 2,
        hitbox.width,
        hitbox.height,
        0xff0000,
        0.3,
      );
      debugBox.setStrokeStyle(2, 0xff0000);

      this.scene.time.delayedCall(180, () => {
        if (debugBox && debugBox.active) debugBox.destroy();
      });
    }

    // Check collision with enemies
    enemies.forEach((enemy) => {
      if (!enemy || enemy.isDead) return;

      const targetBounds = enemy.getHitbox
        ? enemy.getHitbox()
        : enemy.sprite.getBounds();

      if (Phaser.Geom.Intersects.RectangleToRectangle(hitbox, targetBounds)) {
        if (typeof enemy.takeDamage === "function") {
          enemy.takeDamage(this.hitDamage, this.sprite.x);
        }
        console.log("%c[Hit] Enemy hit!", "color: lime");
      }
    });
  }

  // ===================== DIE =====================
  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.canMove = false;
    this.isAttacking = false;

    this.sprite.setTint(0x660000);
    this.sprite.setAlpha(0.5);

    console.log("Nate has died!");
  }

  // ===================== UPDATE =====================
  update(cursors, attackKey, jumpKey, kickKey, enemies = []) {
    this.currentEnemies = enemies;

    if (!this.sprite) return;
    this.updateHurtboxPosition();

    const speed = 5;
    const isMovingX = cursors.left.isDown || cursors.right.isDown;
    const animPrefix = this.type;

    // ===================== HORIZONTAL MOVEMENT =====================
    if (this.canMove && !this.isAttacking) {
      if (isMovingX) {
        if (cursors.left.isDown) {
          this.sprite.x -= speed;
          this.sprite.setFlipX(true);
        } else {
          this.sprite.x += speed;
          this.sprite.setFlipX(false);
        }

        // Play walk animation
        if (!this.isJumping && this.scene.anims.exists(`${animPrefix}-walk`)) {
          if (
            !this.sprite.anims.isPlaying ||
            this.sprite.anims.currentAnim.key !== `${animPrefix}-walk`
          ) {
            this.sprite.play(`${animPrefix}-walk`, true);
            this.sprite.setScale(this.walkScale);
          }
        }
      } else if (!this.isJumping) {
        // Return to idle
        if (
          !this.sprite.anims.isPlaying ||
          this.sprite.anims.currentAnim.key !== `${animPrefix}-idle`
        ) {
          this.sprite.play(`${animPrefix}-idle`);
          this.sprite.setScale(this.defaultScale);
        }
      }
    }

    // ===================== VERTICAL MOVEMENT =====================
    if (this.canMove && !this.isAttacking) {
      if (cursors.up.isDown) {
        this.sprite.y -= speed;
      } else if (cursors.down.isDown) {
        this.sprite.y += speed;
      }
    }

    // ===================== BOUNDS CLAMPING =====================
    if (this.bounds) {
      this.sprite.x = Phaser.Math.Clamp(
        this.sprite.x,
        this.bounds.left,
        this.bounds.right,
      );

      if (this.isJumping) {
        this.sprite.y = Phaser.Math.Clamp(
          this.sprite.y,
          this.bounds.top - 80,
          this.bounds.bottom,
        );
      } else {
        this.sprite.y = Phaser.Math.Clamp(
          this.sprite.y,
          this.bounds.top,
          this.bounds.bottom,
        );
      }
    }

    // ===================== JUMP =====================
    if (
      this.canMove &&
      Phaser.Input.Keyboard.JustDown(jumpKey) &&
      !this.isJumping &&
      !this.isAttacking
    ) {
      this.isJumping = true;

      if (this.scene.anims.exists(`${animPrefix}-jump`)) {
        this.sprite.play(`${animPrefix}-jump`);
      }
      this.sprite.setScale(this.defaultScale);

      this.scene.tweens.add({
        targets: this.sprite,
        y: this.sprite.y - 65,
        duration: 260,
        ease: "Sine.easeOut",
        yoyo: true,
        onComplete: () => {
          this.isJumping = false;
          this.sprite.play(`${animPrefix}-idle`);
        },
      });
    }

    // ===================== ATTACKS =====================
    if (this.canMove && !this.isAttacking && !this.isJumping) {
      // PUNCH
      if (Phaser.Input.Keyboard.JustDown(attackKey)) {
        this.isAttacking = true;
        const direction = this.sprite.flipX ? -1 : 1;
        const startX = this.sprite.x;

        this.sprite.x += direction * 22;
        this.sprite.play(`${animPrefix}-punch`);
        this.sprite.setScale(this.defaultScale);

        this.scene.time.delayedCall(120, () => {
          this.attackHitCheck(this.currentEnemies || []);
        });

        this.scene.time.delayedCall(280, () => {
          if (this.sprite && this.sprite.active) {
            this.sprite.x = startX;
            this.sprite.play(`${animPrefix}-idle`);
            this.isAttacking = false;
          }
        });
      }

      // KICK
      if (Phaser.Input.Keyboard.JustDown(kickKey)) {
        this.isAttacking = true;
        const direction = this.sprite.flipX ? -1 : 1;
        const startX = this.sprite.x;

        this.sprite.x += direction * 18;
        this.sprite.play(`${animPrefix}-kick`);
        this.sprite.setScale(this.defaultScale);

        this.scene.time.delayedCall(120, () => {
          this.attackHitCheck(this.currentEnemies || []);
        });

        this.scene.time.delayedCall(320, () => {
          if (this.sprite && this.sprite.active) {
            this.sprite.x = startX;
            this.sprite.play(`${animPrefix}-idle`);
            this.isAttacking = false;
          }
        });
      }
    }

    // Depth sorting
    this.sprite.setDepth(this.sprite.y);
  }
}

import Phaser from 'phaser';
import Projectile from './Projectile.js';
import { CHARACTERS } from '../data/characters.js';
import { WEAPONS } from '../data/weapons.js';
import { ABILITIES, CHARACTER_ABILITY } from '../data/abilities.js';
import { PASSIVES, CHARACTER_PASSIVE } from '../data/passives.js';

/**
 * Per-character sprite config.
 * dirs: logical 8-dir → sheet key + flipX
 * idle: optional looping idle key (null = freeze first walk frame)
 */
const SPRITE_CHARS = {
  judd_burton: {
    defaultTexture: 'judd_idle',
    idle: 'judd_idle',
    dirs: {
      right: { key: 'judd_walk_right', flip: false },
      left: { key: 'judd_walk_right', flip: true },
      down: { key: 'judd_walk_down', flip: false },
      up: { key: 'judd_walk_up', flip: false },
      dr: { key: 'judd_walk_dr', flip: false },
      dl: { key: 'judd_walk_dr', flip: true },
      ul: { key: 'judd_walk_ul', flip: false },
      ur: { key: 'judd_walk_ul', flip: true }
    }
  },
  tim_alberino: {
    defaultTexture: 'tim_walk_down',
    idle: null,
    dirs: {
      right: { key: 'tim_walk_right', flip: false },
      left: { key: 'tim_walk_right', flip: true },
      down: { key: 'tim_walk_down', flip: false },
      up: { key: 'tim_walk_up', flip: false },
      dr: { key: 'tim_walk_dl', flip: true },
      dl: { key: 'tim_walk_dl', flip: false },
      ul: { key: 'tim_walk_ur', flip: true },
      ur: { key: 'tim_walk_ur', flip: false }
    }
  },
  laura_sanger: {
    defaultTexture: 'laura_walk_down',
    idle: null,
    dirs: {
      right: { key: 'laura_walk_right', flip: false },
      left: { key: 'laura_walk_right', flip: true },
      down: { key: 'laura_walk_down', flip: false },
      up: { key: 'laura_walk_up', flip: false },
      dr: { key: 'laura_walk_dl', flip: true },
      dl: { key: 'laura_walk_dl', flip: false },
      ul: { key: 'laura_walk_ur', flip: true },
      ur: { key: 'laura_walk_ur', flip: false }
    }
  },
  // Minimal: dr → down/dl; ul → up/ur; right → left
  joel_muddamalle: {
    defaultTexture: 'joel_walk_dr',
    idle: null,
    dirs: {
      right: { key: 'joel_walk_right', flip: false },
      left: { key: 'joel_walk_right', flip: true },
      down: { key: 'joel_walk_dr', flip: false },
      up: { key: 'joel_walk_ul', flip: true },
      dr: { key: 'joel_walk_dr', flip: false },
      dl: { key: 'joel_walk_dr', flip: true },
      ul: { key: 'joel_walk_ul', flip: false },
      ur: { key: 'joel_walk_ul', flip: true }
    }
  },
  // Minimal: dl → down/dr; ur → ul; right → left; dedicated up
  doug_van_dorn: {
    defaultTexture: 'doug_walk_dl',
    idle: null,
    dirs: {
      right: { key: 'doug_walk_right', flip: false },
      left: { key: 'doug_walk_right', flip: true },
      down: { key: 'doug_walk_dl', flip: false },
      up: { key: 'doug_walk_up', flip: false },
      dr: { key: 'doug_walk_dl', flip: true },
      dl: { key: 'doug_walk_dl', flip: false },
      ul: { key: 'doug_walk_ur', flip: true },
      ur: { key: 'doug_walk_ur', flip: false }
    }
  },
  gary_wayne: {
    defaultTexture: 'gary_walk_down',
    idle: null,
    dirs: {
      right: { key: 'gary_walk_right', flip: false },
      left: { key: 'gary_walk_right', flip: true },
      down: { key: 'gary_walk_down', flip: false },
      up: { key: 'gary_walk_up', flip: false },
      dr: { key: 'gary_walk_dr', flip: false },
      dl: { key: 'gary_walk_dr', flip: true },
      ul: { key: 'gary_walk_ur', flip: true },
      ur: { key: 'gary_walk_ur', flip: false }
    }
  }
};

export default class Player extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} characterId
   */
  constructor(scene, x, y, characterId) {
    const spriteCfg = SPRITE_CHARS[characterId];
    const hasSprite = spriteCfg && scene.textures.exists(spriteCfg.defaultTexture);

    if (!hasSprite) {
      const key = `player_${characterId}`;
      if (!scene.textures.exists(key)) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xa78bfa, 1);
        g.fillCircle(18, 18, 18);
        g.lineStyle(3, 0xc4b5fd, 1);
        g.strokeCircle(18, 18, 18);
        g.generateTexture(key, 36, 36);
        g.destroy();
      }
      super(scene, x, y, key);
    } else {
      super(scene, x, y, spriteCfg.defaultTexture, 0);
    }

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.characterId = characterId;
    this.characterData = CHARACTERS[characterId];
    this.hasSprite = hasSprite;
    this.spriteCfg = spriteCfg || null;
    this.currentAnimKey = null;
    this.facingFlipX = false;
    this.moveDir = 'down';

    // Stats
    this.maxHp = this.characterData.baseStats.maxHp;
    this.hp = this.maxHp;
    this.moveSpeed = this.characterData.baseStats.moveSpeed;
    this.pickupRange = this.characterData.baseStats.pickupRange;
    this.armor = this.characterData.baseStats.armor;

    // Runtime
    this.xp = 0;
    this.level = 1;
    this.invulnerableUntil = 0;
    this.isDowned = false;
    this.sparksOfDawn = 1;
    this.shootFlashUntil = 0;
    this.hurtTintUntil = 0;

    // Physics / visual size
    if (this.hasSprite) {
      this.setOrigin(0.5, 0.85);
      this.setDepth(10);
      this.body.setSize(28, 36);
      this.body.setOffset(18, 24);
      // Start facing down
      const start = this.spriteCfg.dirs.down;
      if (this.spriteCfg.idle) {
        this.playAnim(this.spriteCfg.idle, false);
      } else {
        this.playAnim(start.key, start.flip, { freezeFirstFrame: true });
      }
    } else {
      this.body.setCircle(18);
      this.setDepth(10);
    }
    this.body.setCollideWorldBounds(true);

    // Ground shadow
    this.shadow = scene.add.ellipse(x, y + (this.hasSprite ? 8 : 14), 36, 12, 0x000000, 0.35);
    this.shadow.setDepth(9);

    // Input
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Weapon
    const weaponId = this.characterData.startingWeapon;
    this.weapon = { ...WEAPONS[weaponId] };
    this.lastFired = 0;
    this.facingAngle = 0;

    // Unique ability
    const abilityId = CHARACTER_ABILITY[characterId];
    this.ability = abilityId ? { ...ABILITIES[abilityId] } : null;
    this.abilityCooldown = 0;
    this.abilityActive = false;
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Passive
    const passiveId = CHARACTER_PASSIVE[characterId];
    this.passive = passiveId ? { ...PASSIVES[passiveId] } : null;
    this.isMoving = false;
    this.regenAccumulator = 0;

    // Snapshot of run-start stats (Spark reset)
    this.runSnapshot = {
      maxHp: this.maxHp,
      moveSpeed: this.moveSpeed,
      pickupRange: this.pickupRange,
      armor: this.armor,
      weapon: { ...this.weapon }
    };

    this.projectiles = [];
  }

  update(time, delta) {
    if (this.isDowned) {
      this.body.setVelocity(0, 0);
      this.projectiles = this.projectiles.filter(p => p.active);
      this.updateShadow();
      return;
    }

    if (this.abilityCooldown > 0) {
      this.abilityCooldown = Math.max(0, this.abilityCooldown - delta);
    }

    this.handleMovement();
    this.updateAimFacing();
    this.updateAnimation();
    this.handleAutoAttack(time);
    this.handleAbilityInput();
    this.handlePassive(delta);
    this.updateVfxTints(time);
    this.updateShadow();

    this.projectiles = this.projectiles.filter(p => p.active);
  }

  updateShadow() {
    if (!this.shadow || !this.shadow.active) return;
    this.shadow.setPosition(this.x, this.y + (this.hasSprite ? 6 : 14));
    this.shadow.setAlpha(this.isDowned ? 0.15 : 0.35);
  }

  /**
   * Face the aim point (mouse), not movement.
   * Movement still uses WASD; body orientation follows fire direction.
   */
  updateAimFacing() {
    const pointer = this.scene.input.activePointer;
    if (pointer) {
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.facingAngle = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
    }
  }

  /**
   * Map aim angle → logical 8-dir, then resolve sheet from spriteCfg.dirs
   */
  getAimDirInfo() {
    const deg = Phaser.Math.RadToDeg(this.facingAngle);
    let dir = 'down';

    if (deg >= -22.5 && deg < 22.5) dir = 'right';
    else if (deg >= 22.5 && deg < 67.5) dir = 'dr';
    else if (deg >= 67.5 && deg < 112.5) dir = 'down';
    else if (deg >= 112.5 && deg < 157.5) dir = 'dl';
    else if (deg >= 157.5 || deg < -157.5) dir = 'left';
    else if (deg >= -157.5 && deg < -112.5) dir = 'ul';
    else if (deg >= -112.5 && deg < -67.5) dir = 'up';
    else dir = 'ur';

    const entry = this.spriteCfg?.dirs?.[dir] || this.spriteCfg?.dirs?.down;
    return {
      dir,
      flip: entry?.flip || false,
      animKey: entry?.key || null
    };
  }

  playAnim(key, flipX, { freezeFirstFrame = false } = {}) {
    if (!this.hasSprite) return;
    this.setFlipX(!!flipX);
    this.facingFlipX = !!flipX;

    if (!this.scene.anims.exists(key)) return;

    if (freezeFirstFrame) {
      // Standing: first frame of the aim-direction walk sheet
      if (this.currentAnimKey !== key || !this._frozenAim) {
        this.currentAnimKey = key;
        this._frozenAim = true;
        this.anims.play(key, true);
        this.anims.pause();
        this.anims.setCurrentFrame(this.anims.currentAnim.frames[0]);
      }
      return;
    }

    this._frozenAim = false;
    if (this.currentAnimKey !== key || this.anims.isPaused) {
      this.currentAnimKey = key;
      this.anims.play(key, true);
    }
  }

  /**
   * Face aim direction always.
   * Moving → walk cycle in aim dir.
   * Standing → idle loop if available and facing down; else freeze first walk frame.
   */
  updateAnimation() {
    if (!this.hasSprite || !this.spriteCfg) return;

    const { dir, flip, animKey } = this.getAimDirInfo();
    if (!animKey) return;
    this.moveDir = dir;

    if (this.isMoving) {
      this.playAnim(animKey, flip, { freezeFirstFrame: false });
      return;
    }

    if (this.spriteCfg.idle && dir === 'down') {
      this.playAnim(this.spriteCfg.idle, false, { freezeFirstFrame: false });
    } else {
      this.playAnim(animKey, flip, { freezeFirstFrame: true });
    }
  }

  updateVfxTints(time) {
    if (this.isDowned) return;

    // Priority: hurt > shoot flash > clear
    if (time < this.hurtTintUntil) {
      this.setTint(0xff6b6b);
    } else if (time < this.shootFlashUntil) {
      this.setTint(0xffe066);
    } else if (this.isTinted && time >= this.hurtTintUntil && time >= this.shootFlashUntil) {
      // Don't clear if invuln just ended mid-flash from other systems
      if (time >= this.invulnerableUntil) {
        this.clearTint();
      }
    }
  }

  handlePassive(delta) {
    if (!this.passive) return;

    if (this.passive.id === 'restoration' && this.hp < this.maxHp) {
      this.regenAccumulator += delta;
      if (this.regenAccumulator >= 2000) {
        this.regenAccumulator -= 2000;
        this.heal(1);
      }
    }
  }

  modifyOutgoingDamage(baseDamage, enemy) {
    let dmg = baseDamage;
    let isCrit = false;
    if (!this.passive) return { damage: dmg, isCrit };

    switch (this.passive.id) {
      case 'field_instinct':
        if (this.isMoving) dmg = Math.round(dmg * 1.20);
        break;
      case 'forbidden_margins': {
        const margin = 90;
        const nearEdge =
          enemy.x < margin ||
          enemy.x > this.scene.gameWidth - margin ||
          enemy.y < margin ||
          enemy.y > this.scene.gameHeight - margin;
        if (nearEdge) dmg = Math.round(dmg * 1.30);
        break;
      }
      case 'revealed_weakness': {
        const chance = (enemy.isBoss || enemy.isLevelBoss) ? 0.30 : 0.22;
        if (Math.random() < chance) {
          dmg = Math.round(dmg * 1.6);
          isCrit = true;
        }
        break;
      }
      case 'titans_due': {
        const highHp = enemy.maxHp >= 40 || enemy.isBoss || enemy.isLevelBoss;
        if (highHp) dmg = Math.round(dmg * 1.30);
        break;
      }
      default:
        break;
    }

    return { damage: dmg, isCrit };
  }

  handleAbilityInput() {
    if (!this.ability) return;
    if (this.abilityCooldown > 0) return;
    if (!Phaser.Input.Keyboard.JustDown(this.spaceKey)) return;
    this.scene.activatePlayerAbility(this);
  }

  startAbilityCooldown() {
    if (!this.ability) return;
    this.abilityCooldown = this.ability.cooldown;
  }

  isAbilityReady() {
    return this.ability && this.abilityCooldown <= 0;
  }

  handleMovement() {
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -1;
    else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = 1;

    if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -1;
    else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = 1;

    if (vx !== 0 && vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      vx /= len;
      vy /= len;
    }

    this.body.setVelocity(vx * this.moveSpeed, vy * this.moveSpeed);
    this.isMoving = vx !== 0 || vy !== 0;

    if (this.isMoving) {
      this.facingAngle = Math.atan2(vy, vx);
    }
  }

  handleAutoAttack(time) {
    if (time < this.lastFired + this.weapon.cooldown) return;
    this.lastFired = time;
    this.fireWeapon();
  }

  fireWeapon() {
    const pointer = this.scene.input.activePointer;
    let angle = this.facingAngle;

    if (pointer && (pointer.x > 5 || pointer.y > 5)) {
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      angle = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
    }

    const count = this.weapon.count || 1;
    const spreadDeg = this.weapon.spread || 0;
    const spreadRad = Phaser.Math.DegToRad(spreadDeg);

    // Muzzle height offset for sprite characters
    const muzzleY = this.hasSprite ? this.y - 18 : this.y;

    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spreadRad;
      const finalAngle = angle + offset;

      const proj = new Projectile(this.scene, this.x, muzzleY, {
        speed: this.weapon.projectileSpeed,
        damage: this.weapon.damage,
        lifespan: 1100,
        radius: Math.max(5, Math.floor((this.weapon.projectileLifetime || 16) / 3)),
        color: this.weapon.projectileColor,
        angle: finalAngle
      });

      this.projectiles.push(proj);
    }

    // Brief shoot flash tint
    this.shootFlashUntil = this.scene.time.now + 80;
  }

  takeDamage(amount) {
    if (this.isDowned) return;
    if (this.scene.time.now < this.invulnerableUntil) return;

    const reduced = Math.max(1, amount - this.armor);
    this.hp -= reduced;
    this.lastDamagedAt = this.scene.time.now;
    this.invulnerableUntil = this.scene.time.now + 400;
    this.hurtTintUntil = this.scene.time.now + 150;

    // Quick hurt pulse
    this.setTint(0xff3333);
    this.scene.tweens.add({
      targets: this,
      alpha: 0.55,
      duration: 60,
      yoyo: true,
      onComplete: () => {
        if (this.active && !this.isDowned) this.setAlpha(1);
      }
    });

    if (this.hp <= 0) {
      this.hp = 0;
      this.onDeath();
    }
  }

  onDeath() {
    if (this.sparksOfDawn > 0) {
      this.enterDownedState();
      this.scene.events.emit('player-downed');
      return;
    }

    this.playDeathVfx();
    this.scene.events.emit('player-died');
  }

  playDeathVfx() {
    this.setTint(0x7f1d1d);
    this.scene.tweens.add({
      targets: this,
      alpha: 0.2,
      scaleX: this.scaleX * 0.9,
      scaleY: this.scaleY * 0.9,
      duration: 400
    });
    if (this.shadow) {
      this.scene.tweens.add({
        targets: this.shadow,
        alpha: 0,
        duration: 400
      });
    }
  }

  enterDownedState() {
    this.isDowned = true;
    this.hp = 0;
    this.body.setVelocity(0, 0);
    this.setAlpha(0.4);
    this.setTint(0x64748b);
    if (this.hasSprite && this.anims) {
      this.anims.pause();
    }
  }

  useSparkOfDawn() {
    if (!this.isDowned || this.sparksOfDawn <= 0) return false;

    this.sparksOfDawn -= 1;
    this.isDowned = false;

    this.level = 1;
    this.xp = 0;
    this.maxHp = this.runSnapshot.maxHp;
    this.moveSpeed = this.runSnapshot.moveSpeed;
    this.pickupRange = this.runSnapshot.pickupRange;
    this.armor = this.runSnapshot.armor;
    this.weapon = { ...this.runSnapshot.weapon };

    this.hp = Math.floor(this.maxHp * 0.5);
    this.invulnerableUntil = this.scene.time.now + 2000;

    this.setAlpha(1);
    this.clearTint();
    if (this.hasSprite && this.anims) {
      this.anims.resume();
      if (this.spriteCfg?.idle) {
        this.playAnim(this.spriteCfg.idle, false);
      } else {
        const d = this.spriteCfg?.dirs?.down;
        if (d) this.playAnim(d.key, d.flip, { freezeFirstFrame: true });
      }
    }

    // Revive gold flash
    this.setTint(0xfbbf24);
    this.scene.time.delayedCall(350, () => {
      if (this.active && !this.isDowned) this.clearTint();
    });

    return true;
  }

  declineSpark() {
    if (!this.isDowned) return;
    this.isDowned = false;
    this.sparksOfDawn = 0;
    this.playDeathVfx();
    this.scene.events.emit('player-died');
  }

  heal(amount) {
    if (this.isDowned) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  destroy(fromScene) {
    if (this.shadow) {
      this.shadow.destroy();
      this.shadow = null;
    }
    super.destroy(fromScene);
  }
}

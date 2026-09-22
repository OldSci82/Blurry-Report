import Phaser from 'phaser';
import { CHARACTERS } from '../data/characters.js';
import progressionManager from '../systems/ProgressionManager.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import Projectile from '../entities/Projectile.js';
import Pickup from '../entities/Pickup.js';
import WaveManager, { WAVE_STATES } from '../systems/WaveManager.js';
import { NORMAL_UPGRADES, MILESTONE_UPGRADES, END_LEVEL_UPGRADES, rollUpgrades, isMilestoneLevel } from '../data/upgrades.js';
import { activateAbility, updateActiveBarrier } from '../systems/AbilitySystem.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.characterId = data.characterId || 'tim_alberino';
    this.character = CHARACTERS[this.characterId];
  }

  create() {
    const { width, height } = this.cameras.main;
    this.viewWidth = width;
    this.viewHeight = height;

    // Build larger scrolling world (tiles + paths + sparse deco)
    this.createWorld();

    this.player = new Player(this, this.worldWidth / 2, this.worldHeight / 2, this.characterId);
    this.enemies = [];
    this.enemyProjectiles = [];
    this.pickups = [];

    // Camera follows player within world bounds
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.14, 0.14);
    this.cameras.main.setZoom(1);

    // Custom aim cursor — hotspot centered on the eye
    this.input.setDefaultCursor('url(assets/ui/aim-cursor-32.png) 16 16, crosshair');

    this.score = 0;
    this.runTime = 0;
    this.enemiesKilled = 0;
    this.gameOver = false;
    this.levelComplete = false;
    this.pendingLevelUps = [];
    this.levelUpOpen = false;

    // Hive Burst (anti-clump)
    this.clumpTimer = 0;
    this.hiveBurstCooldown = 0;
    this.hiveBurstState = 'idle'; // idle | winding | active
    this.clumpMembers = [];
    this.CLUMP_RADIUS = 98;
    this.PULL_RADIUS = 200;
    this.CLUMP_MIN_SIZE = 5;
    this.CLUMP_TIME_REQUIRED = 2700;
    this.HIVE_WINDUP_TIME = 1400;
    this.HIVE_COOLDOWN = 7500;

    // Wave Manager
    this.waveManager = new WaveManager(this);
    this.waveManager.onStateChange = (state, wave) => this.onWaveStateChange(state, wave);
    this.waveManager.onWaveProgress = (progress) => this.updateWaveBar(progress);

    // HUD (fixed to camera — does not scroll with world)
    this.hpText = this.add.text(20, 20, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#e2e8f0'
    }).setDepth(100).setScrollFactor(0);

    this.xpText = this.add.text(20, 48, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#94a3b8'
    }).setDepth(100).setScrollFactor(0);

    this.xpBarBg = this.add.rectangle(20, 72, 160, 8, 0x1e1e2e).setOrigin(0, 0.5).setDepth(100).setScrollFactor(0);
    this.xpBarFill = this.add.rectangle(20, 72, 0, 6, 0x3b82f6).setOrigin(0, 0.5).setDepth(101).setScrollFactor(0);

    this.scoreText = this.add.text(width - 20, 20, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#94a3b8'
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

    this.weaponText = this.add.text(width - 20, 48, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#a78bfa'
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

    this.charText = this.add.text(width / 2, 16, this.character.name, {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#a78bfa'
    }).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);

    this.waveBarBg = this.add.rectangle(width / 2, 52, 280, 18, 0x1e1e2e).setDepth(100).setScrollFactor(0);
    this.waveBarFill = this.add.rectangle(width / 2 - 140, 52, 280, 14, 0x7c3aed)
      .setOrigin(0, 0.5).setDepth(101).setScrollFactor(0);
    this.waveLabel = this.add.text(width / 2, 52, 'WAVE 1', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#e2e8f0'
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0);

    this.warningText = this.add.text(width / 2, height / 2 - 50, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '48px', color: '#f87171', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(200).setAlpha(0).setScrollFactor(0);

    this.warningSubText = this.add.text(width / 2, height / 2 + 10, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '20px', color: '#fca5a5'
    }).setOrigin(0.5).setDepth(200).setAlpha(0).setScrollFactor(0);

    this.events.on('enemy-killed', this.onEnemyKilled, this);
    this.events.on('player-died', this.onPlayerDied, this);
    this.events.on('player-downed', this.onPlayerDowned, this);

    this.sparkDecisionOpen = false;
    this.sparkTimer = 0;
    this.sparkTimerMax = 7000; // 7s to decide

    this.updateHUD();
    this.waveManager.startLevel();
  }

  /**
   * Build a larger grass arena with sparse props and a path network.
   * Paths use neighbor-based autotiling so junctions always align.
   */
  createWorld() {
    const TILE = 256;
    const cols = 12;
    const rows = 10;
    this.tileSize = TILE;
    this.mapCols = cols;
    this.mapRows = rows;
    this.worldWidth = cols * TILE;
    this.worldHeight = rows * TILE;
    this.gameWidth = this.worldWidth;
    this.gameHeight = this.worldHeight;

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    // 1) Mark path cells (boolean) — cross through the map
    const midR = Math.floor(rows / 2);
    const midC = Math.floor(cols / 2);
    const isPath = Array.from({ length: rows }, () => Array(cols).fill(false));

    for (let c = 1; c < cols - 1; c++) isPath[midR][c] = true;
    for (let r = 1; r < rows - 1; r++) isPath[r][midC] = true;

    // 2) Autotile: pick path graphic from N/E/S/W neighbors
    // Bit flags: N=1, E=2, S=4, W=8
    const PATH_TILE = {
      5: 'tile_path5',   // N+S vertical
      10: 'tile_path6',  // E+W horizontal
      15: 'tile_path11', // N+E+S+W cross
      // T-junctions
      7: 'tile_path1',   // N+S+E
      13: 'tile_path2',  // N+S+W
      11: 'tile_path3',  // N+E+W
      14: 'tile_path4',  // S+E+W
      // Corners
      6: 'tile_path7',   // S+E
      12: 'tile_path8',  // S+W
      9: 'tile_path9',   // N+W
      3: 'tile_path10',  // N+E
      // Dead ends → nearest straight
      1: 'tile_path5',   // N only
      4: 'tile_path5',   // S only
      2: 'tile_path6',   // E only
      8: 'tile_path6'    // W only
    };

    const grid = [];
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        if (isPath[r][c]) {
          let mask = 0;
          if (r > 0 && isPath[r - 1][c]) mask |= 1; // N
          if (c < cols - 1 && isPath[r][c + 1]) mask |= 2; // E
          if (r < rows - 1 && isPath[r + 1][c]) mask |= 4; // S
          if (c > 0 && isPath[r][c - 1]) mask |= 8; // W
          grid[r][c] = PATH_TILE[mask] || 'tile_path5';
        } else {
          grid[r][c] = 'tile_grass1';
        }
      }
    }

    // 3) Sparse stump/rock deco — never on path cells
    const decoSpots = Math.floor(cols * rows * 0.08);
    for (let i = 0; i < decoSpots; i++) {
      const r = Phaser.Math.Between(0, rows - 1);
      const c = Phaser.Math.Between(0, cols - 1);
      if (isPath[r][c]) continue;
      grid[r][c] = Math.random() < 0.5 ? 'tile_grass2' : 'tile_grass3';
    }

    // 4) Place tiles
    this.groundTiles = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * TILE + TILE / 2;
        const y = r * TILE + TILE / 2;
        const tile = this.add.image(x, y, grid[r][c]).setDepth(0);
        tile.setTint(0xb8c4c0);
        this.groundTiles.push(tile);
      }
    }

    this.moodOverlay = this.add.rectangle(
      this.viewWidth / 2,
      this.viewHeight / 2,
      this.viewWidth,
      this.viewHeight,
      0x0f172a,
      0.18
    ).setScrollFactor(0).setDepth(1);
  }

  update(time, delta) {
    if (this.gameOver || this.levelComplete) return;

    this.runTime += delta;
    this.player.update(time, delta);

    // Spark of Dawn decision timer
    if (this.sparkDecisionOpen) {
      this.updateSparkDecision(delta);
    }

    this.enemies = this.enemies.filter(e => e.active);
    this.enemies.forEach(e => {
      // Keep bursting enemies on-screen
      if (e.isBursting) {
        e.x = Phaser.Math.Clamp(e.x, 40, this.gameWidth - 40);
        e.y = Phaser.Math.Clamp(e.y, 40, this.gameHeight - 40);
        return; // skip normal AI while being flung
      }
      // During wind-up, clump members (and those being pulled) skip normal AI
      if (this.hiveBurstState === 'winding' && this.clumpMembers.includes(e)) {
        return;
      }
      e.update(time, delta, this.player);
    });

    // Clean enemy projectiles
    this.enemyProjectiles = this.enemyProjectiles.filter(p => p.active);

    // Pickups (XP orbs, health, etc.)
    this.updatePickups();

    this.waveManager.update(delta);

    // Hive Burst anti-clump system
    this.updateHiveBurst(delta);

    this.checkProjectileHits();
    this.checkEnemyPlayerCollision();
    this.checkEnemyProjectileHits();
    this.updateBossHealthBars();
    this.updateLevelUpTimer(delta);
    updateActiveBarrier(this);

    this.updateHUD();
  }

  /** Called by Player when SPACE is pressed */
  activatePlayerAbility(player) {
    activateAbility(this, player);
  }

  // ---------- Hive Burst (anti-clump) ----------
  updateHiveBurst(delta) {
    if (this.hiveBurstCooldown > 0) {
      this.hiveBurstCooldown -= delta;
    }

    // While winding or active, just run those states
    if (this.hiveBurstState === 'winding') {
      this.hiveWindupTimer -= delta;

      // Calculate current clump center
      let cx = 0, cy = 0, count = 0;
      this.clumpMembers.forEach(e => {
        if (e.active) { cx += e.x; cy += e.y; count++; }
      });
      if (count > 0) { cx /= count; cy /= count; }

      // Suck in any nearby non-boss enemies that aren't already in the clump
      const toAdd = [];
      this.enemies.forEach(e => {
        if (!e.active || e.isBoss || e.isLevelBoss || e.isBursting) return;
        if (this.clumpMembers.includes(e)) return;

        const dist = Phaser.Math.Distance.Between(cx, cy, e.x, e.y);
        if (dist <= this.PULL_RADIUS) {
          // Moderate pull toward center
          const angle = Phaser.Math.Angle.Between(e.x, e.y, cx, cy);
          const pullStrength = 160 + (1 - dist / this.PULL_RADIUS) * 160;
          e.body.setVelocity(Math.cos(angle) * pullStrength, Math.sin(angle) * pullStrength);

          // Visual: tint enemies being pulled
          e.setTint(0xfde68a);

          // Once close enough, add them to the burst group
          if (dist < this.CLUMP_RADIUS + 35) {
            toAdd.push(e);
          }
        }
      });
      toAdd.forEach(e => {
        if (!this.clumpMembers.includes(e)) this.clumpMembers.push(e);
      });

      // Pulse + yellow on all clump members
      this.clumpMembers.forEach(e => {
        if (!e.active) return;
        e.setTint(0xfbbf24);
        const pulse = 1.08 + Math.sin(this.time.now / 75) * 0.12;
        e.setScale(pulse);
        // Hold core members
        e.body.setVelocity(0, 0);
        e.x = Phaser.Math.Linear(e.x, cx, 0.06);
        e.y = Phaser.Math.Linear(e.y, cy, 0.06);
      });

      if (this.hiveWindupTimer <= 0) {
        this.triggerHiveBurst();
      }
      return;
    }

    if (this.hiveBurstState === 'active') {
      this.hiveActiveTimer -= delta;
      if (this.hiveActiveTimer <= 0) {
        this.hiveBurstState = 'idle';
        this.clumpMembers = [];
      }
      return;
    }

    // Idle: look for a clump
    if (this.hiveBurstCooldown > 0) return;

    const candidates = this.enemies.filter(e => e.active && !e.isBoss && !e.isLevelBoss);
    if (candidates.length < this.CLUMP_MIN_SIZE) {
      this.clumpTimer = 0;
      this.clumpMembers = [];
      return;
    }

    // Find densest local group
    let bestGroup = [];
    for (const center of candidates) {
      const group = candidates.filter(e =>
        Phaser.Math.Distance.Between(center.x, center.y, e.x, e.y) <= this.CLUMP_RADIUS
      );
      if (group.length > bestGroup.length) {
        bestGroup = group;
      }
    }

    if (bestGroup.length >= this.CLUMP_MIN_SIZE) {
      this.clumpTimer += delta;
      this.clumpMembers = bestGroup;

      if (this.clumpTimer >= this.CLUMP_TIME_REQUIRED) {
        // Start wind-up
        this.hiveBurstState = 'winding';
        this.hiveWindupTimer = this.HIVE_WINDUP_TIME;
        this.clumpTimer = 0;

        // Strong immediate visual telegraph
        this.clumpMembers.forEach(e => {
          if (e.active) {
            e.setTint(0xfbbf24);
            e.setScale(1.25);
          }
        });
      }
    } else {
      this.clumpTimer = 0;
      this.clumpMembers = [];
    }
  }

  triggerHiveBurst() {
    this.hiveBurstState = 'active';
    this.hiveActiveTimer = 1100;
    this.hiveBurstCooldown = this.HIVE_COOLDOWN;

    // Calculate center of the clump
    let cx = 0, cy = 0;
    const members = this.clumpMembers.filter(e => e.active);
    if (members.length === 0) {
      this.hiveBurstState = 'idle';
      return;
    }
    members.forEach(e => { cx += e.x; cy += e.y; });
    cx /= members.length;
    cy /= members.length;

    // Fling only to the edges of the *current camera view*, not the full map
    const view = this.cameras.main.worldView;
    const margin = 48;
    const minX = view.x + margin;
    const maxX = view.right - margin;
    const minY = view.y + margin;
    const maxY = view.bottom - margin;

    // Give every enemy its own unique angle around the full 360°
    const count = members.length;
    const angleStep = (Math.PI * 2) / count;
    // Randomize the starting rotation so it doesn't always favor the same directions
    const startAngle = Math.random() * Math.PI * 2;

    members.forEach((e, i) => {
      if (!e.active) return;

      e.clearTint();
      e.setScale(1);

      // Unique angle for this enemy + tiny jitter so it doesn't look perfectly mechanical
      const angle = startAngle + i * angleStep + (Math.random() - 0.5) * 0.25;

      // Aim at the far edge of the visible screen in that direction
      const rayLength = Math.max(view.width, view.height) * 1.2;
      let targetX = cx + Math.cos(angle) * rayLength;
      let targetY = cy + Math.sin(angle) * rayLength;
      targetX = Phaser.Math.Clamp(targetX, minX, maxX);
      targetY = Phaser.Math.Clamp(targetY, minY, maxY);

      // Guarantee they travel a good distance
      const finalDist = Phaser.Math.Distance.Between(e.x, e.y, targetX, targetY);
      const travelTime = 0.48;
      const speed = Math.max(450, finalDist / travelTime);
      const moveAngle = Phaser.Math.Angle.Between(e.x, e.y, targetX, targetY);

      e.body.setVelocity(Math.cos(moveAngle) * speed, Math.sin(moveAngle) * speed);

      e.isBursting = true;
      e.burstDamage = Math.floor(e.damage * 1.35);

      this.time.delayedCall(580, () => {
        if (e.active) {
          e.isBursting = false;
          e.body.velocity.x *= 0.25;
          e.body.velocity.y *= 0.25;
        }
      });
    });
  }

  // ---------- Wave UI ----------
  onWaveStateChange(state, wave) {
    if (state === WAVE_STATES.WARNING && wave) {
      this.showWarning(`WAVE ${wave.waveNumber}`, 'Incoming anomaly surge');
      this.waveLabel.setText(`WAVE ${wave.waveNumber}`);
      this.waveBarFill.width = 280;
    }

    if (state === WAVE_STATES.BOSS_ACTIVE) {
      if (wave && wave.isMiniBoss) {
        this.showWarning('MINI-BOSS', 'Greater anomaly detected');
      } else {
        this.showWarning('LEVEL BOSS', 'The entity emerges');
      }
    }

    if (state === WAVE_STATES.LEVEL_COMPLETE) {
      this.onLevelComplete();
    }
  }

  showWarning(main, sub) {
    this.warningText.setText(main).setAlpha(1);
    this.warningSubText.setText(sub).setAlpha(1);

    this.tweens.killTweensOf([this.warningText, this.warningSubText]);
    this.tweens.add({
      targets: [this.warningText, this.warningSubText],
      alpha: 0,
      duration: 700,
      delay: 1700
    });
  }

  updateWaveBar(progress) {
    this.waveBarFill.width = 280 * (1 - progress);
  }

  // ---------- Spawning ----------
  getSpawnPosition() {
    // Spawn just outside the current camera view (works with scrolling world)
    const cam = this.cameras.main;
    const margin = 50;
    const side = Phaser.Math.Between(0, 3);
    let x, y;
    switch (side) {
      case 0: // top
        x = Phaser.Math.Between(cam.worldView.x, cam.worldView.right);
        y = cam.worldView.y - margin;
        break;
      case 1: // right
        x = cam.worldView.right + margin;
        y = Phaser.Math.Between(cam.worldView.y, cam.worldView.bottom);
        break;
      case 2: // bottom
        x = Phaser.Math.Between(cam.worldView.x, cam.worldView.right);
        y = cam.worldView.bottom + margin;
        break;
      default: // left
        x = cam.worldView.x - margin;
        y = Phaser.Math.Between(cam.worldView.y, cam.worldView.bottom);
        break;
    }
    x = Phaser.Math.Clamp(x, 20, this.worldWidth - 20);
    y = Phaser.Math.Clamp(y, 20, this.worldHeight - 20);
    return { x, y };
  }

  spawnWaveEnemy() {
    const { x, y } = this.getSpawnPosition();
    const waveNum = this.waveManager.getCurrentWave()?.waveNumber || 1;
    const scale = 1 + (waveNum - 1) * 0.06;

    // Mix of types: mostly chasers, some lungers, fewer spitters
    const roll = Math.random();
    let type = 'chaser';
    if (roll > 0.78) type = 'spitter';
    else if (roll > 0.55) type = 'lunger';

    const base = {
      chaser:  { speed: 78 + waveNum * 4, hp: Math.floor(18 * scale), damage: 7 + waveNum, radius: 14 },
      lunger:  { speed: 70 + waveNum * 3, hp: Math.floor(22 * scale), damage: 10 + waveNum, radius: 15 },
      spitter: { speed: 55 + waveNum * 2, hp: Math.floor(14 * scale), damage: 6 + waveNum, radius: 13, preferredRange: 210, fireInterval: 1500 - waveNum * 50 }
    }[type];

    const enemy = new Enemy(this, x, y, {
      type,
      speed: base.speed,
      hp: base.hp,
      damage: base.damage,
      radius: base.radius,
      preferredRange: base.preferredRange,
      fireInterval: base.fireInterval,
      xpValue: 3 + waveNum + (type === 'spitter' ? 2 : 0),
      scoreValue: 10 + waveNum * 3,
      scale: type === 'lunger' ? 1.08 : 1
    });

    this.enemies.push(enemy);
  }

  spawnMiniBoss(waveNumber) {
    const mini = new Enemy(this, this.player.x, this.cameras.main.worldView.y - 40, {
      type: 'boss',
      speed: 52,
      hp: 160 + waveNumber * 45,
      damage: 15,
      radius: 26,
      scale: 1.15,
      isBoss: true,
      xpValue: 30,
      scoreValue: 180
    });
    this.createBossHealthBar(mini, 90);
    this.enemies.push(mini);
  }

  spawnLevelBoss() {
    const boss = new Enemy(this, this.player.x, this.cameras.main.worldView.y - 50, {
      type: 'boss',
      speed: 42,
      hp: 480,
      damage: 24,
      radius: 34,
      scale: 1.25,
      isBoss: true,
      isLevelBoss: true,
      xpValue: 90,
      scoreValue: 600
    });
    this.createBossHealthBar(boss, 140);
    this.enemies.push(boss);
  }

  createBossHealthBar(enemy, width = 100) {
    const barBg = this.add.rectangle(0, 0, width + 4, 10, 0x1e1e2e).setDepth(90);
    const barFill = this.add.rectangle(0, 0, width, 6, 0xef4444).setDepth(91);
    barFill.setOrigin(0, 0.5);
    enemy.healthBarBg = barBg;
    enemy.healthBarFill = barFill;
    enemy.healthBarWidth = width;
  }

  updateBossHealthBars() {
    this.enemies.forEach(e => {
      if (!e.healthBarBg) return;

      // Boss is gone — destroy leftover bars
      if (!e.active || e.hp <= 0) {
        e.healthBarBg.destroy();
        e.healthBarFill.destroy();
        e.healthBarBg = null;
        e.healthBarFill = null;
        return;
      }

      const pct = Math.max(0, e.hp / e.maxHp);
      const barW = e.healthBarWidth;

      e.healthBarBg.setPosition(e.x, e.y - (e.body?.radius || 20) - 18);
      e.healthBarFill.setPosition(e.x - barW / 2, e.y - (e.body?.radius || 20) - 18);
      e.healthBarFill.width = barW * pct;

      if (pct > 0.6) e.healthBarFill.setFillStyle(0x22c55e);
      else if (pct > 0.3) e.healthBarFill.setFillStyle(0xfbbf24);
      else e.healthBarFill.setFillStyle(0xef4444);
    });
  }

  // ---------- Combat ----------
  /**
   * Hit test against enemy physics body center (not sprite origin/feet).
   * Sprite origin is near the feet, so distance-to-(x,y) was missing body shots.
   */
  projectileHitsEnemy(proj, enemy) {
    if (!proj.active || !enemy.active || !enemy.body) return false;

    const pr = Math.max(
      proj.body.halfWidth || 0,
      proj.body.halfHeight || 0,
      proj.body.radius || 0,
      5
    );
    // Generous body radius from actual Arcade body
    const er = Math.max(enemy.body.halfWidth, enemy.body.halfHeight) * 0.95;
    const ecx = enemy.body.center.x;
    const ecy = enemy.body.center.y;
    const dist = Phaser.Math.Distance.Between(proj.x, proj.y, ecx, ecy);
    return dist < pr + er + 4; // +4px forgiveness for fast projectiles
  }

  showDamageNumber(x, y, amount, isCrit = false) {
    const label = isCrit ? `-${amount}!` : `-${amount}`;
    const text = this.add.text(x, y - 28, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: isCrit ? '18px' : '14px',
      color: isCrit ? '#fbbf24' : '#f8fafc',
      fontStyle: 'bold',
      stroke: '#0f0f1a',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(250);

    // Slight random horizontal jitter so stacked hits stay readable
    const dx = Phaser.Math.Between(-10, 10);
    this.tweens.add({
      targets: text,
      x: x + dx,
      y: y - 70,
      alpha: 0,
      duration: 650,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    });
  }

  checkProjectileHits() {
    const projectiles = this.player.projectiles;

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i];
      if (!proj.active) continue;

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        if (!enemy.active || enemy.isDead) continue;

        if (this.projectileHitsEnemy(proj, enemy)) {
          const base = proj.damage || 10;
          const { damage, isCrit } = this.player.modifyOutgoingDamage
            ? this.player.modifyOutgoingDamage(base, enemy)
            : { damage: base, isCrit: false };

          // Floating damage number (at body center)
          const nx = enemy.body?.center?.x ?? enemy.x;
          const ny = (enemy.body?.center?.y ?? enemy.y) - 10;
          this.showDamageNumber(nx, ny, damage, isCrit);

          const died = enemy.takeDamage(damage);

          if (isCrit) {
            const flash = this.add.circle(nx, ny, 14, 0xfbbf24, 0.5).setDepth(8);
            this.tweens.add({
              targets: flash, alpha: 0, scale: 1.8, duration: 180,
              onComplete: () => flash.destroy()
            });
          }

          if (!died && enemy.body) {
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            enemy.body.velocity.x += Math.cos(angle) * 130;
            enemy.body.velocity.y += Math.sin(angle) * 130;
          }

          if (
            this.player.passive?.id === 'echo_of_authority' &&
            !proj.isFragment
          ) {
            this.spawnFragments(proj.x, proj.y, enemy, base);
          }

          proj.destroy();
          break;
        }
      }
    }
  }

  /** Joel passive: spawn 2 small fragment shots toward other nearby enemies */
  spawnFragments(x, y, hitEnemy, baseDamage) {
    const fragmentDamage = Math.max(3, Math.round(baseDamage * 0.50));
    const candidates = this.enemies.filter(
      e => e.active && !e.isDead && e !== hitEnemy
    );

    candidates.sort(
      (a, b) =>
        Phaser.Math.Distance.Between(x, y, a.x, a.y) -
        Phaser.Math.Distance.Between(x, y, b.x, b.y)
    );

    const angles = [];
    candidates.slice(0, 2).forEach(t => {
      angles.push(Phaser.Math.Angle.Between(x, y, t.x, t.y));
    });
    while (angles.length < 2) {
      angles.push(Math.random() * Math.PI * 2);
    }

    const color = this.player.weapon?.projectileColor || 0x38bdf8;

    angles.forEach(angle => {
      const frag = new Projectile(this, x, y, {
        speed: 300,
        damage: fragmentDamage,
        lifespan: 500,
        radius: 4,
        color,
        angle
      });
      frag.isFragment = true;
      this.player.projectiles.push(frag);
    });
  }

  checkEnemyPlayerCollision() {
    if (!this.player.active || this.player.isDowned) return;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const extra = (enemy.isBoss || enemy.isLevelBoss) ? 14 : 0;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < 28 + extra) {
        const dmg = enemy.isBursting ? (enemy.burstDamage || enemy.damage * 1.4) : enemy.damage;
        this.player.takeDamage(dmg);
      }
    }
  }

  checkEnemyProjectileHits() {
    if (!this.player.active || this.player.isDowned) return;

    for (const proj of this.enemyProjectiles) {
      if (!proj.active) continue;

      // Joel's Protection Barrier blocks enemy projectiles
      if (this.activeBarrier) {
        const b = this.activeBarrier;
        const toBarrier = Phaser.Math.Distance.Between(proj.x, proj.y, b.x, b.y);
        if (toBarrier <= b.radius) {
          // Visual pop when a shot is blocked
          const spark = this.add.circle(proj.x, proj.y, 6, 0x7dd3fc, 0.8).setDepth(8);
          this.tweens.add({
            targets: spark, alpha: 0, scale: 2, duration: 150,
            onComplete: () => spark.destroy()
          });
          proj.destroy();
          continue;
        }
      }

      const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.player.x, this.player.y);
      if (dist < 22) {
        this.player.takeDamage(proj.damage || 6);
        proj.destroy();
      }
    }
  }

  onEnemyKilled({ x, y, xp, score, isBoss, isLevelBoss }) {
    this.enemiesKilled += 1;
    this.score += score;

    // Spawn collectible drops instead of granting XP instantly
    this.spawnDrops(x, y, xp, isBoss, isLevelBoss);

    // Clean up any boss health bars that belong to dead enemies
    this.enemies.forEach(e => {
      if (!e.active && e.healthBarBg) {
        e.healthBarBg.destroy();
        e.healthBarFill.destroy();
        e.healthBarBg = null;
        e.healthBarFill = null;
      }
    });

    // Single call — WaveManager handles boss vs regular correctly (no double-count)
    this.waveManager.onEnemyKilled(!!(isBoss || isLevelBoss));
  }

  spawnDrops(x, y, xpValue, isBoss, isLevelBoss) {
    if (x == null || y == null) {
      x = this.player.x;
      y = this.player.y;
    }

    // XP orbs — split larger values into multiple gems for readable magnet play
    let remaining = xpValue || 5;
    const orbValues = [];
    if (isLevelBoss) {
      // Level boss: several chunky orbs
      while (remaining > 0) {
        const chunk = Math.min(25, remaining);
        orbValues.push(chunk);
        remaining -= chunk;
      }
    } else if (isBoss) {
      while (remaining > 0) {
        const chunk = Math.min(12, remaining);
        orbValues.push(chunk);
        remaining -= chunk;
      }
    } else {
      // Normal: 1 orb (or 2 if high value)
      if (remaining > 10) {
        orbValues.push(Math.ceil(remaining / 2));
        orbValues.push(Math.floor(remaining / 2));
      } else {
        orbValues.push(remaining);
      }
    }

    orbValues.forEach((val, i) => {
      const ox = x + (Math.random() - 0.5) * 28;
      const oy = y + (Math.random() - 0.5) * 28;
      const radius = val >= 20 ? 9 : val >= 10 ? 7 : 5;
      const pickup = new Pickup(this, ox, oy, {
        type: 'xp',
        value: val,
        radius,
        color: val >= 20 ? 0xe9d5ff : val >= 10 ? 0xc4b5fd : 0x7dd3fc
      });
      this.pickups.push(pickup);
    });

    // Bosses can drop a health pack
    if (isBoss || isLevelBoss) {
      const hpVal = isLevelBoss ? 40 : 20;
      const health = new Pickup(this, x + 16, y - 10, {
        type: 'health',
        value: hpVal,
        radius: 8,
        color: 0x4ade80
      });
      this.pickups.push(health);
    }
  }

  updatePickups() {
    if (!this.pickups) return;

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      if (!p.active) {
        this.pickups.splice(i, 1);
        continue;
      }

      const collected = p.updateMagnet(this.player);
      if (collected) {
        this.collectPickup(p);
        p.destroy();
        this.pickups.splice(i, 1);
      }
    }
  }

  collectPickup(pickup) {
    if (pickup.pickupType === 'xp') {
      this.player.xp += pickup.value;
      this.checkLevelUps();
    } else if (pickup.pickupType === 'health') {
      this.player.heal(pickup.value);
      // Brief green flash
      this.player.setTint(0x86efac);
      this.time.delayedCall(150, () => {
        if (this.player.active && !this.player.isDowned) this.player.clearTint();
      });
    } else if (pickup.pickupType === 'spark') {
      this.player.sparksOfDawn = (this.player.sparksOfDawn || 0) + pickup.value;
    }
  }

  checkLevelUps() {
    let safety = 0;
    while (safety < 5) {
      const xpToLevel = this.getXpToNextLevel();
      if (this.player.xp < xpToLevel) break;
      this.player.xp -= xpToLevel;
      this.player.level += 1;
      this.queueLevelUp();
      safety += 1;
    }
  }

  getXpToNextLevel() {
    // Steady curve: early levels a bit faster, then meaningful gaps
    return 28 + this.player.level * 36;
  }

  // ---------- Level-Up Choice UI (real-time + timer) ----------
  queueLevelUp() {
    if (!this.pendingLevelUps) this.pendingLevelUps = [];
    this.pendingLevelUps.push(this.player.level);

    // If no UI is open, show the next one immediately
    if (!this.levelUpOpen) {
      this.showLevelUpChoices();
    }
  }

  showLevelUpChoices() {
    if (!this.pendingLevelUps || this.pendingLevelUps.length === 0) {
      this.levelUpOpen = false;
      return;
    }

    this.clearLevelUpUI();
    this.levelUpOpen = true;
    const level = this.pendingLevelUps.shift();
    const milestone = isMilestoneLevel(level);
    const pool = milestone ? MILESTONE_UPGRADES : NORMAL_UPGRADES;
    const options = rollUpgrades(pool, 3);

    // Screen-space coords (fixed UI — not world space)
    const width = this.scale.width;
    const height = this.scale.height;
    const panelY = height - 130;
    const depth = 400;

    this.levelUpUI = [];

    const bg = this.add.rectangle(width / 2, panelY, width - 40, 110, 0x0f0f1a, 0.92)
      .setStrokeStyle(2, milestone ? 0xfbbf24 : 0x7c3aed)
      .setScrollFactor(0)
      .setDepth(depth);
    this.levelUpUI.push(bg);

    const title = this.add.text(width / 2, panelY - 38, milestone ? `LEVEL ${level} — MILESTONE` : `LEVEL ${level}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: milestone ? '18px' : '16px',
      color: milestone ? '#fbbf24' : '#e2e8f0',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    this.levelUpUI.push(title);

    this.levelUpTimerMax = 6500;
    this.levelUpTimer = this.levelUpTimerMax;
    this.levelUpTimerBar = this.add.rectangle(width / 2 - 120, panelY + 42, 240, 6, 0x22c55e)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth + 1);
    this.levelUpUI.push(this.levelUpTimerBar);

    const startX = width / 2 - 200;
    options.forEach((opt, i) => {
      const x = startX + i * 200;

      const btnBg = this.add.rectangle(x, panelY, 180, 52, 0x1e1e2e)
        .setStrokeStyle(2, 0x4c1d95)
        .setScrollFactor(0)
        .setDepth(depth + 2)
        .setInteractive({ useHandCursor: true });

      const btnTitle = this.add.text(x, panelY - 10, opt.name, {
        fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#e2e8f0', fontStyle: 'bold'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 3);

      const btnDesc = this.add.text(x, panelY + 12, opt.description, {
        fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#94a3b8'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 3);

      btnBg.on('pointerover', () => btnBg.setStrokeStyle(2, 0xa78bfa));
      btnBg.on('pointerout', () => btnBg.setStrokeStyle(2, 0x4c1d95));
      btnBg.on('pointerdown', () => this.selectLevelUp(opt));

      this.levelUpUI.push(btnBg, btnTitle, btnDesc);
    });

    this.currentLevelUpOptions = options;
  }

  clearLevelUpUI() {
    if (this.levelUpUI) {
      this.levelUpUI.forEach(o => { if (o && o.destroy) o.destroy(); });
    }
    this.levelUpUI = [];
    this.levelUpContainer = null;
    this.levelUpTimerBar = null;
  }

  selectLevelUp(upgrade) {
    if (!this.levelUpOpen) return;

    upgrade.apply(this.player);

    this.clearLevelUpUI();
    this.levelUpOpen = false;
    this.currentLevelUpOptions = null;

    // Show next queued level-up if any
    if (this.pendingLevelUps && this.pendingLevelUps.length > 0) {
      this.time.delayedCall(200, () => this.showLevelUpChoices());
    }
  }

  updateLevelUpTimer(delta) {
    if (!this.levelUpOpen || !this.levelUpTimerBar) return;

    this.levelUpTimer -= delta;
    const pct = Math.max(0, this.levelUpTimer / this.levelUpTimerMax);
    this.levelUpTimerBar.width = 240 * pct;

    if (pct < 0.3) this.levelUpTimerBar.setFillStyle(0xef4444);
    else if (pct < 0.6) this.levelUpTimerBar.setFillStyle(0xfbbf24);
    else this.levelUpTimerBar.setFillStyle(0x22c55e);

    // Time's up — auto-select first option
    if (this.levelUpTimer <= 0) {
      const fallback = this.currentLevelUpOptions?.[0];
      if (fallback) this.selectLevelUp(fallback);
      else {
        this.clearLevelUpUI();
        this.levelUpOpen = false;
      }
    }
  }

  onLevelComplete() {
    this.levelComplete = true;
    this.player.body.setVelocity(0, 0);
    this.enemies.forEach(e => { if (e.body) e.body.setVelocity(0, 0); });

    this.clearLevelUpUI();
    this.levelUpOpen = false;
    this.pendingLevelUps = [];

    progressionManager.updateHighScores({
      wave: 4, score: this.score, time: Math.floor(this.runTime / 1000)
    });

    this.showEndLevelUpgrades();
  }

  showEndLevelUpgrades() {
    const width = this.scale.width;
    const height = this.scale.height;
    const options = rollUpgrades(END_LEVEL_UPGRADES, 4);
    const depth = 400;

    this.endLevelUI = [];

    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75)
      .setScrollFactor(0).setDepth(depth);
    this.endLevelUI.push(dim);

    this.endLevelUI.push(
      this.add.text(width / 2, height / 2 - 150, 'LEVEL CLEARED', {
        fontFamily: 'Arial, sans-serif', fontSize: '36px', color: '#86efac', fontStyle: 'bold'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1)
    );

    this.endLevelUI.push(
      this.add.text(width / 2, height / 2 - 110, `Score ${this.score}   •   Kills ${this.enemiesKilled}`, {
        fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#94a3b8'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1)
    );

    this.endLevelUI.push(
      this.add.text(width / 2, height / 2 - 70, 'Choose your reward', {
        fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#e2e8f0'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1)
    );

    const startX = width / 2 - 270;
    options.forEach((opt, i) => {
      const x = startX + i * 180;
      const y = height / 2 + 20;

      const card = this.add.rectangle(x, y, 160, 100, 0x1e1e2e)
        .setStrokeStyle(2, 0x4c1d95)
        .setScrollFactor(0)
        .setDepth(depth + 2)
        .setInteractive({ useHandCursor: true });

      const title = this.add.text(x, y - 22, opt.name, {
        fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#e2e8f0', fontStyle: 'bold',
        wordWrap: { width: 140 }, align: 'center'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 3);

      const desc = this.add.text(x, y + 18, opt.description, {
        fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#94a3b8',
        wordWrap: { width: 140 }, align: 'center'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 3);

      card.on('pointerover', () => card.setStrokeStyle(2, 0xa78bfa));
      card.on('pointerout', () => card.setStrokeStyle(2, 0x4c1d95));
      card.on('pointerdown', () => this.selectEndLevelUpgrade(opt));

      this.endLevelUI.push(card, title, desc);
    });
  }

  selectEndLevelUpgrade(upgrade) {
    upgrade.apply(this.player);

    if (this.endLevelUI) {
      this.endLevelUI.forEach(o => { if (o && o.destroy) o.destroy(); });
      this.endLevelUI = [];
    }
    this.endLevelContainer = null;

    const width = this.scale.width;
    const height = this.scale.height;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setScrollFactor(0).setDepth(400);

    this.add.text(width / 2, height / 2 - 40, 'REWARD CLAIMED', {
      fontFamily: 'Arial, sans-serif', fontSize: '32px', color: '#86efac', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(401);

    this.add.text(width / 2, height / 2 + 5, upgrade.name, {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#fbbf24'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(401);

    const btn = this.add.text(width / 2, height / 2 + 60, '[ RETURN TO MENU ]', {
      fontFamily: 'Arial, sans-serif', fontSize: '20px', color: '#86efac',
      backgroundColor: '#14532d', padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(401).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => this.scene.start('MainMenuScene'));
  }

  // ---------- Spark of Dawn ----------
  onPlayerDowned() {
    if (this.sparkDecisionOpen) return;

    this.sparkDecisionOpen = true;
    this.sparkTimer = this.sparkTimerMax;

    const width = this.scale.width;
    const height = this.scale.height;
    const depth = 420;

    this.sparkUI = [];

    const bg = this.add.rectangle(width / 2, height / 2, 420, 180, 0x0f0f1a, 0.94)
      .setStrokeStyle(2, 0xfbbf24)
      .setScrollFactor(0)
      .setDepth(depth);
    this.sparkUI.push(bg);

    const title = this.add.text(width / 2, height / 2 - 55, 'THE SPARK OF DAWN', {
      fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#fbbf24', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    this.sparkUI.push(title);

    const sub = this.add.text(width / 2, height / 2 - 22, 'Use it to rise again — but lose all level progress.', {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#94a3b8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
    this.sparkUI.push(sub);

    this.sparkTimerBar = this.add.rectangle(width / 2 - 100, height / 2 + 8, 200, 8, 0xfbbf24)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth + 1);
    this.sparkUI.push(this.sparkTimerBar);

    const useBtn = this.add.text(width / 2 - 90, height / 2 + 50, '[ USE SPARK ]', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#86efac',
      backgroundColor: '#14532d', padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 2)
      .setInteractive({ useHandCursor: true });
    useBtn.on('pointerdown', () => this.confirmSparkUse());
    this.sparkUI.push(useBtn);

    const declineBtn = this.add.text(width / 2 + 90, height / 2 + 50, '[ LET GO ]', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#fca5a5',
      backgroundColor: '#450a0a', padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 2)
      .setInteractive({ useHandCursor: true });
    declineBtn.on('pointerdown', () => this.confirmSparkDecline());
    this.sparkUI.push(declineBtn);
  }

  clearSparkUI() {
    if (this.sparkUI) {
      this.sparkUI.forEach(o => { if (o && o.destroy) o.destroy(); });
    }
    this.sparkUI = [];
    this.sparkContainer = null;
    this.sparkTimerBar = null;
  }

  updateSparkDecision(delta) {
    if (!this.sparkDecisionOpen) return;

    this.sparkTimer -= delta;
    const pct = Math.max(0, this.sparkTimer / this.sparkTimerMax);
    if (this.sparkTimerBar) {
      this.sparkTimerBar.width = 200 * pct;
      if (pct < 0.3) this.sparkTimerBar.setFillStyle(0xef4444);
      else if (pct < 0.6) this.sparkTimerBar.setFillStyle(0xfbbf24);
      else this.sparkTimerBar.setFillStyle(0xfbbf24);
    }

    if (this.sparkTimer <= 0) {
      this.confirmSparkDecline();
    }
  }

  confirmSparkUse() {
    if (!this.sparkDecisionOpen) return;
    this.sparkDecisionOpen = false;

    this.clearSparkUI();
    this.clearLevelUpUI();
    this.levelUpOpen = false;
    this.pendingLevelUps = [];

    const ok = this.player.useSparkOfDawn();
    if (!ok) {
      this.onPlayerDied();
    }
  }

  confirmSparkDecline() {
    if (!this.sparkDecisionOpen) return;
    this.sparkDecisionOpen = false;

    this.clearSparkUI();
    this.player.declineSpark();
  }

  onPlayerDied() {
    this.gameOver = true;
    this.sparkDecisionOpen = false;
    this.player.body.setVelocity(0, 0);
    this.enemies.forEach(e => { if (e.body) e.body.setVelocity(0, 0); });

    progressionManager.updateHighScores({
      wave: this.waveManager.getCurrentWave()?.waveNumber || 1,
      score: this.score,
      time: Math.floor(this.runTime / 1000)
    });
    progressionManager.incrementRuns();

    const width = this.scale.width;
    const height = this.scale.height;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65)
      .setScrollFactor(0).setDepth(400);

    this.add.text(width / 2, height / 2 - 40, 'YOU WERE CONSUMED', {
      fontFamily: 'Arial, sans-serif', fontSize: '36px', color: '#f87171'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(401);

    this.add.text(width / 2, height / 2 + 10,
      `Wave ${this.waveManager.getCurrentWave()?.waveNumber || 1}   •   Score ${this.score}   •   Kills ${this.enemiesKilled}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#e2e8f0'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(401);

    const restartBtn = this.add.text(width / 2, height / 2 + 70, '[ RETURN TO MENU ]', {
      fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#86efac',
      backgroundColor: '#14532d', padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(401).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
  }

  updateHUD() {
    const hpLabel = this.player.isDowned
      ? 'HP  DOWNED'
      : `HP  ${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
    this.hpText.setText(hpLabel);

    const xpNeeded = this.getXpToNextLevel();
    this.xpText.setText(`Lv ${this.player.level}   ${this.player.xp}/${xpNeeded} XP`);
    this.scoreText.setText(`Score ${this.score}`);
    if (this.player.weapon) this.weaponText.setText(this.player.weapon.name);

    // XP bar
    if (this.xpBarFill && this.xpBarBg) {
      const pct = Math.max(0, Math.min(1, this.player.xp / xpNeeded));
      this.xpBarFill.width = 160 * pct;
    }

    // Spark of Dawn indicator
    if (!this.sparkHudText) {
      this.sparkHudText = this.add.text(20, 88, '', {
        fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#fbbf24'
      }).setDepth(100).setScrollFactor(0);
    }
    this.sparkHudText.setText(`Spark of Dawn  ×${this.player.sparksOfDawn}`);

    // Ability cooldown indicator
    if (!this.abilityHudText) {
      this.abilityHudText = this.add.text(20, 108, '', {
        fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#a78bfa'
      }).setDepth(100).setScrollFactor(0);
    }
    if (this.player.ability) {
      if (this.player.abilityCooldown <= 0) {
        this.abilityHudText.setText(`${this.player.ability.name}  [SPACE] READY`);
        this.abilityHudText.setColor('#86efac');
      } else {
        const sec = (this.player.abilityCooldown / 1000).toFixed(1);
        this.abilityHudText.setText(`${this.player.ability.name}  ${sec}s`);
        this.abilityHudText.setColor('#94a3b8');
      }
    }

    // Passive name
    if (!this.passiveHudText) {
      this.passiveHudText = this.add.text(20, 128, '', {
        fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#64748b'
      }).setDepth(100).setScrollFactor(0);
    }
    if (this.player.passive) {
      this.passiveHudText.setText(`Passive: ${this.player.passive.name}`);
    }
  }
}

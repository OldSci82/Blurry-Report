/**
 * WaveManager – 4-wave structured level
 *
 * Fixed issues:
 * - Boss kill no longer double-decrements enemiesAlive
 * - Wave clear is guarded so it can only fire once per wave
 * - Progress is based on explicit killed count (more reliable)
 * - Boss spawns at ~72% of regular enemies killed
 */

export const WAVE_STATES = {
  IDLE: 'idle',
  WARNING: 'warning',
  SPAWNING: 'spawning',
  ACTIVE: 'active',
  BOSS_ACTIVE: 'boss_active',
  WAVE_COMPLETE: 'wave_complete',
  LEVEL_COMPLETE: 'level_complete'
};

export default class WaveManager {
  constructor(scene) {
    this.scene = scene;

    this.waves = [
      { waveNumber: 1, enemyCount: 28, isMiniBoss: true,  spawnInterval: 700 },
      { waveNumber: 2, enemyCount: 36, isMiniBoss: true,  spawnInterval: 600 },
      { waveNumber: 3, enemyCount: 46, isMiniBoss: true,  spawnInterval: 520 },
      { waveNumber: 4, enemyCount: 58, isMiniBoss: false, spawnInterval: 450 }
    ];

    this.currentWaveIndex = -1;
    this.state = WAVE_STATES.IDLE;

    this.enemiesRemainingToSpawn = 0;
    this.regularEnemiesAlive = 0;   // only regular (non-boss) enemies
    this.regularEnemiesKilled = 0;  // explicit kill count for progress
    this.totalEnemiesInWave = 0;

    this.bossSpawned = false;
    this.bossAlive = false;
    this.bossDefeated = false;
    this.waveClearHandled = false;  // prevents double-advance

    this.spawnTimer = 0;
    this.spawnInterval = 600;
    this.warningTimer = 0;
    this.warningDuration = 2400;

    this.onStateChange = null;
    this.onWaveProgress = null;
  }

  startLevel() {
    this.currentWaveIndex = -1;
    this.startNextWave();
  }

  startNextWave() {
    this.currentWaveIndex += 1;

    if (this.currentWaveIndex >= this.waves.length) {
      this.setState(WAVE_STATES.LEVEL_COMPLETE);
      return;
    }

    const wave = this.waves[this.currentWaveIndex];
    this.totalEnemiesInWave = wave.enemyCount;
    this.enemiesRemainingToSpawn = wave.enemyCount;
    this.regularEnemiesAlive = 0;
    this.regularEnemiesKilled = 0;
    this.bossSpawned = false;
    this.bossAlive = false;
    this.bossDefeated = false;
    this.waveClearHandled = false;
    this.spawnInterval = wave.spawnInterval;
    this.spawnTimer = 0;

    this.setState(WAVE_STATES.WARNING);
    this.warningTimer = 0;
  }

  update(delta) {
    if (this.state === WAVE_STATES.WARNING) {
      this.warningTimer += delta;
      if (this.warningTimer >= this.warningDuration) {
        this.setState(WAVE_STATES.SPAWNING);
      }
      return;
    }

    if (
      this.state === WAVE_STATES.SPAWNING ||
      this.state === WAVE_STATES.ACTIVE ||
      this.state === WAVE_STATES.BOSS_ACTIVE
    ) {
      // Spawn regular enemies
      if (this.enemiesRemainingToSpawn > 0) {
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.spawnInterval) {
          this.spawnTimer = 0;
          this.enemiesRemainingToSpawn -= 1;
          this.regularEnemiesAlive += 1;
          this.scene.spawnWaveEnemy();
        }
      } else if (this.state === WAVE_STATES.SPAWNING) {
        this.setState(WAVE_STATES.ACTIVE);
      }

      // Progress based on regular enemies killed
      const progress = this.getProgress();
      if (this.onWaveProgress) this.onWaveProgress(progress);

      // Spawn boss at ~72% of regular kills
      if (!this.bossSpawned && progress >= 0.72) {
        this.bossSpawned = true;
        this.bossAlive = true;
        this.setState(WAVE_STATES.BOSS_ACTIVE);

        const wave = this.getCurrentWave();
        if (wave.isMiniBoss) {
          this.scene.spawnMiniBoss(wave.waveNumber);
        } else {
          this.scene.spawnLevelBoss();
        }
      }

      // Wave is clear only when:
      // - all regular enemies have been spawned
      // - no regular enemies remain alive
      // - boss has been handled (defeated, or never required)
      this.tryClearWave();
    }
  }

  /**
   * Called when any enemy dies.
   * isBoss should be true only for mini-boss / level boss.
   */
  onEnemyKilled(isBoss = false) {
    if (isBoss) {
      // Boss death — only mark boss flags, do NOT touch regular counts
      this.bossAlive = false;
      this.bossDefeated = true;
    } else {
      // Regular enemy death
      this.regularEnemiesAlive = Math.max(0, this.regularEnemiesAlive - 1);
      this.regularEnemiesKilled += 1;
    }

    if (this.onWaveProgress) this.onWaveProgress(this.getProgress());
    this.tryClearWave();
  }

  getProgress() {
    if (this.totalEnemiesInWave <= 0) return 0;
    return Math.max(0, Math.min(1, this.regularEnemiesKilled / this.totalEnemiesInWave));
  }

  tryClearWave() {
    if (this.waveClearHandled) return;
    if (this.enemiesRemainingToSpawn > 0) return;
    if (this.regularEnemiesAlive > 0) return;
    if (this.bossSpawned && !this.bossDefeated) return;

    // All clear
    this.waveClearHandled = true;

    if (this.currentWaveIndex >= this.waves.length - 1) {
      this.setState(WAVE_STATES.LEVEL_COMPLETE);
    } else {
      this.setState(WAVE_STATES.WAVE_COMPLETE);
      this.scene.time.delayedCall(1600, () => {
        // Only advance if we are still in WAVE_COMPLETE (safety)
        if (this.state === WAVE_STATES.WAVE_COMPLETE) {
          this.startNextWave();
        }
      });
    }
  }

  // Kept for compatibility — now just routes to onEnemyKilled
  notifyBossDefeated() {
    // Intentionally empty / safe. Boss handling is done in onEnemyKilled(true).
    // Left here so old call sites don't break.
  }

  setState(newState) {
    this.state = newState;
    if (this.onStateChange) this.onStateChange(newState, this.getCurrentWave());
  }

  getCurrentWave() {
    if (this.currentWaveIndex < 0 || this.currentWaveIndex >= this.waves.length) return null;
    return this.waves[this.currentWaveIndex];
  }
}

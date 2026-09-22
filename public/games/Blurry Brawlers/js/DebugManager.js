class DebugManager {
  constructor(scene) {
    this.scene = scene;

    // Create the K key
    this.killKey = scene.input.keyboard.addKey("K");

    // Optional: Also listen for H key to heal only
    this.healKey = scene.input.keyboard.addKey("H");

    console.log(
      "%c[DebugManager] Loaded - Press K to kill all enemies + heal player",
      "color: #8888ff",
    );
  }

  update() {
    // K = Kill all enemies + Heal player
    if (Phaser.Input.Keyboard.JustDown(this.killKey)) {
      this.killAllEnemies();
      this.healPlayer();
    }

    // H = Heal player only (optional)
    if (Phaser.Input.Keyboard.JustDown(this.healKey)) {
      this.healPlayer();
    }
  }

  // ===================== KILL ALL ENEMIES =====================
  killAllEnemies() {
    if (!this.scene.enemies || this.scene.enemies.length === 0) {
      console.log("%c[Debug] No enemies to kill", "color: orange");
      return;
    }

    console.log(
      `%c[Debug] Killing ${this.scene.enemies.length} enemies...`,
      "color: #ff6666",
    );

    // Loop backward so we can safely remove
    for (let i = this.scene.enemies.length - 1; i >= 0; i--) {
      const enemy = this.scene.enemies[i];
      if (enemy && !enemy.isDead) {
        // Force death without playing full animation for speed
        enemy.isDead = true;
        enemy.isAttacking = false;

        // Clean up UI
        if (enemy.healthBar) enemy.healthBar.destroy();
        if (enemy.healthBarBg) enemy.healthBarBg.destroy();
        if (enemy.hitboxDebug) enemy.hitboxDebug.destroy();
        if (enemy.attackHitboxDebug) enemy.attackHitboxDebug.destroy();

        // Destroy sprite immediately for testing
        if (enemy.sprite) enemy.sprite.destroy();

        // Notify scene
        if (this.scene.decrementEnemyCount) {
          this.scene.decrementEnemyCount();
        }
      }
    }

    // Clear the array
    this.scene.enemies = [];
  }

  // ===================== HEAL PLAYER =====================
  healPlayer() {
    if (!this.scene.player) return;

    const player = this.scene.player;

    if (player.health >= player.maxHealth) {
      console.log("%c[Debug] Player already at full health", "color: #66ff66");
      return;
    }

    player.health = player.maxHealth;
    player.isInvincible = false;
    player.canMove = true;

    // Update health bar if the scene has the method
    if (this.scene.updateHealthBar) {
      this.scene.updateHealthBar();
    }

    // Visual feedback
    if (player.sprite) {
      player.sprite.clearTint();
      player.sprite.setVisible(true);
    }

    console.log("%c[Debug] Player healed to full health!", "color: #66ff66");
  }
}

class PlayScene extends Phaser.Scene {
  constructor() {
    super("PlayScene");
    this.player = null; // Nate (controllable)
    this.cursors = null;
    this.attackKey = null;
  }

  preload() {
    // === NATE (Red hair) ===
    this.load.image("nate-idle", "assets/images/nate/n-idle.png");
    this.load.image("nate-punch", "assets/images/nate/n-punch1.png");
    // You can add more later: n-kick1.png, n-jump.png, etc.

    // === LUKE (Black hair) - static companion for now ===
    this.load.image("luke-idle", "assets/images/luke/l-idle.png");
  }

  create() {
    // Simple dark background
    this.add.rectangle(400, 300, 800, 600, 0x0f1a2e);

    // Simple ground/platform
    this.add.rectangle(400, 530, 800, 100, 0x2a3a4a);

    // Instructions
    this.add
      .text(400, 40, "← →  Move    |    Z = Attack (Nate)", {
        fontSize: "22px",
        color: "#aaccff",
        fontFamily: "monospace",
      })
      .setOrigin(0.5);

    // LUKE (non-controlled for now)
    this.add.sprite(280, 420, "luke-idle").setScale(0.2).setOrigin(0.5, 1);

    // NATE (player character)
    this.player = this.add
      .sprite(520, 420, "nate-idle")
      .setScale(0.2)
      .setOrigin(0.5, 1);

    // Keyboard controls
    this.isAttacking = false;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey("Z");
  }

  update() {
    if (!this.player) return;

    const speed = 5;

    // Left / Right movement========================================================================
    // Only allow movement when NOT attacking
    if (!this.isAttacking) {
      if (this.cursors.left.isDown) {
        this.player.x -= speed;
        this.player.setFlipX(true);
      } else if (this.cursors.right.isDown) {
        this.player.x += speed;
        this.player.setFlipX(false);
      }
    }

    // Attack (with forward lunge)==================================================================
    if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.isAttacking) {
      this.isAttacking = true;
      // Determine direction Nate is facing
      const direction = this.player.flipX ? -1 : 1; // -1 = left, +1 = right
      const lungeDistance = 28; // pixels to move forward
      const startX = this.player.x; // remember where we started
      // Lean into the attack
      this.player.x += direction * lungeDistance;
      // Switch to punch image
      this.player.setTexture("nate-punch");
      // Return to idle after a short time
      this.time.delayedCall(280, () => {
        if (this.player && this.player.active) {
          this.player.setTexture("nate-idle");
          this.player.x = startX; // return exactly to start position
          this.isAttacking = false; // cooldown over
        }
      });
    }
  }
}

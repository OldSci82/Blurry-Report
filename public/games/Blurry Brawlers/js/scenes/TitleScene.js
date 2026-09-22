class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Background
    this.add.rectangle(centerX, centerY, 800, 600, 0x0a0a2e);
    this.add.rectangle(centerX, centerY, 780, 580).setStrokeStyle(4, 0x334455);

    // Floating orbs animation
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(80, 720);
      const y = Phaser.Math.Between(80, 520);
      const size = Phaser.Math.Between(2, 5);
      const orb = this.add.circle(x, y, size, 0x88aaff, 0.6);

      this.tweens.add({
        targets: orb,
        y: y - Phaser.Math.Between(150, 300),
        duration: Phaser.Math.Between(6000, 12000),
        repeat: -1,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    }

    // Title
    const title = this.add
      .text(centerX, 140, GameConfig.title, {
        fontSize: "64px",
        fontFamily: "Impact, Arial Black, sans-serif",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        shadow: { offsetX: 4, offsetY: 4, color: "#000000", blur: 6 },
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Subtitle
    this.add
      .text(centerX, 195, "Luke & Nate's Cryptid Dimension Quest", {
        fontSize: "22px",
        fontFamily: "monospace",
        color: "#aaccff",
      })
      .setOrigin(0.5);

    // Menu buttons
    this.createMenuButton(centerX, 280, "NEW GAME", () => this.startNewGame());
    this.createMenuButton(centerX, 338, "LOAD GAME", () =>
      this.showComingSoon("LOAD GAME"),
    );
    this.createMenuButton(centerX, 396, "HIGH SCORES", () =>
      this.showComingSoon("HIGH SCORES"),
    );
    this.createMenuButton(centerX, 454, "SETTINGS", () =>
      this.showComingSoon("SETTINGS"),
    );

    // Footer
    this.add
      .text(centerX, 520, "ARROWS/WASD MOVE · Z ATTACK · SPACE JUMP", {
        fontSize: "14px",
        fontFamily: "monospace",
        color: "#88aadd",
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 560, "INSERT COIN • 1 OR 2 PLAYERS", {
        fontSize: "16px",
        fontFamily: "monospace",
        color: "#556677",
      })
      .setOrigin(0.5);
  }

  createMenuButton(x, y, text, callback) {
    const button = this.add
      .text(x, y, text, {
        fontSize: "36px",
        fontFamily: "monospace",
        color: "#ffcc00",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on("pointerover", () => {
      button.setColor("#ffffff");
      button.setScale(1.08);
      this.playBeep(880, 60);
    });

    button.on("pointerout", () => {
      button.setColor("#ffcc00");
      button.setScale(1.0);
    });

    button.on("pointerdown", () => {
      button.setScale(0.95);
      this.playBeep(1200, 80);
      this.time.delayedCall(80, () => {
        button.setScale(1.0);
        callback();
      });
    });
  }

  playBeep(frequency = 440, duration = 100) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.25;

      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start();

      setTimeout(() => {
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          audioCtx.currentTime + 0.1,
        );
        setTimeout(() => oscillator.stop(), 150);
      }, duration);
    } catch (e) {}
  }

  startNewGame() {
    this.scene.start("BoardwalkScene1");
  }

  showComingSoon(feature) {
    const msg = this.add
      .text(400, 520, `${feature}\nComing Soon!`, {
        fontSize: "24px",
        fontFamily: "monospace",
        color: "#ff6666",
        align: "center",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      duration: 1200,
      delay: 600,
      onComplete: () => msg.destroy(),
    });
  }
}

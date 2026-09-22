import Phaser from 'phaser';
import progressionManager from '../systems/ProgressionManager.js';
import { CHARACTERS, STARTER_CHARACTER_IDS } from '../data/characters.js';
import { WEAPONS } from '../data/weapons.js';
import { PASSIVES, CHARACTER_PASSIVE } from '../data/passives.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const { width, height } = this.cameras.main;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0f0f1a);

    this.add.text(width / 2, 28, 'CRYPTID SURVIVORS', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '34px',
      color: '#e2e8f0',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, 54, 'Survive the Anomalous', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.selectedCharacterId = progressionManager.getLastCharacter() || STARTER_CHARACTER_IDS[0];
    this.cards = [];

    // 2 rows × 3 columns — taller cards for full-body portraits
    const cardW = 210;
    const cardH = 275;
    const gapX = 18;
    const gapY = 14;
    const cols = 3;
    const totalW = cols * cardW + (cols - 1) * gapX;
    const startX = (width - totalW) / 2 + cardW / 2;
    const startY = 88 + cardH / 2;

    STARTER_CHARACTER_IDS.forEach((id, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      this.createCharacterCard(id, x, y, cardW, cardH);
    });

    this.refreshCardSelection();

    const startBtn = this.add.text(width / 2, height - 38, '[ START RUN ]', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#22c55e',
      backgroundColor: '#14532d',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setStyle({ color: '#86efac' }));
    startBtn.on('pointerout', () => startBtn.setStyle({ color: '#22c55e' }));
    startBtn.on('pointerdown', () => {
      progressionManager.setLastCharacter(this.selectedCharacterId);
      this.scene.start('GameScene', { characterId: this.selectedCharacterId });
    });

    const scores = progressionManager.getHighScores();
    this.add.text(width / 2, height - 12, `Best Wave: ${scores.bestWave}   |   Best Score: ${scores.bestScore}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#64748b'
    }).setOrigin(0.5);
  }

  createCharacterCard(id, x, y, cardW, cardH) {
    const char = CHARACTERS[id];
    const weapon = WEAPONS[char.startingWeapon];
    const passiveId = CHARACTER_PASSIVE[id];
    const passive = passiveId ? PASSIVES[passiveId] : null;
    const selected = id === this.selectedCharacterId;
    const textureKey = `char_${id}`;

    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, cardW, cardH, 0x1e1e2e)
      .setStrokeStyle(2, selected ? 0xa78bfa : 0x334155)
      .setInteractive({ useHandCursor: true });

    // Portrait frame
    const portraitH = 140;
    const portraitW = cardW - 12;
    const portraitY = -cardH / 2 + portraitH / 2 + 6;

    const portraitBg = this.add.rectangle(0, portraitY, portraitW, portraitH, 0x0f0f1a);

    let portrait;
    if (this.textures.exists(textureKey)) {
      portrait = this.add.image(0, portraitY, textureKey);
      // Fit inside frame (cover-style, slightly cropped if needed)
      const scale = Math.min(portraitW / portrait.width, portraitH / portrait.height);
      portrait.setScale(scale);
    } else {
      // Fallback circle if texture missing
      portrait = this.add.circle(0, portraitY, 36, 0x64748b);
    }

    // Soft bottom fade bar so text stays readable over art
    const fade = this.add.rectangle(0, portraitY + portraitH / 2 - 10, portraitW, 20, 0x1e1e2e, 0.55);

    const textTop = portraitY + portraitH / 2 + 14;

    const nameText = this.add.text(0, textTop, char.name.replace('Dr. ', ''), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#e2e8f0',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const titleText = this.add.text(0, textTop + 16, char.title, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#64748b'
    }).setOrigin(0.5);

    const power = weapon ? weapon.damage : 0;
    const defense = char.baseStats.armor;
    const health = char.baseStats.maxHp;

    const statsText = this.add.text(0, textTop + 36,
      `PWR ${power}   DEF ${defense}   HP ${health}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#cbd5e1'
    }).setOrigin(0.5);

    const passiveName = this.add.text(0, textTop + 56, passive ? passive.name : '—', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#fbbf24',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const passiveDesc = this.add.text(0, textTop + 72, passive ? passive.description : '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#94a3b8',
      wordWrap: { width: cardW - 20 },
      align: 'center'
    }).setOrigin(0.5, 0);

    container.add([
      bg, portraitBg, portrait, fade,
      nameText, titleText, statsText,
      passiveName, passiveDesc
    ]);

    bg.on('pointerover', () => {
      if (id !== this.selectedCharacterId) bg.setStrokeStyle(2, 0x64748b);
    });
    bg.on('pointerout', () => {
      bg.setStrokeStyle(2, id === this.selectedCharacterId ? 0xa78bfa : 0x334155);
    });
    bg.on('pointerdown', () => {
      this.selectedCharacterId = id;
      this.refreshCardSelection();
    });

    this.cards.push({ id, bg });
  }

  refreshCardSelection() {
    this.cards.forEach(({ id, bg }) => {
      bg.setStrokeStyle(2, id === this.selectedCharacterId ? 0xa78bfa : 0x334155);
    });
  }
}

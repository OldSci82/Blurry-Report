import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const { width, height } = this.cameras.main;

    const barBg = this.add.rectangle(width / 2, height / 2, 320, 24, 0x1e1e2e);
    const bar = this.add.rectangle(width / 2 - 150, height / 2, 0, 16, 0x7c3aed).setOrigin(0, 0.5);

    this.load.on('progress', (value) => {
      bar.width = 300 * value;
    });

    // Ground tiles (256×256)
    this.load.image('tile_grass1', 'assets/tiles/grass1.png');
    this.load.image('tile_grass2', 'assets/tiles/grass2.png');
    this.load.image('tile_grass3', 'assets/tiles/grass3.png');
    this.load.image('tile_path1', 'assets/tiles/grass-path1.png');
    this.load.image('tile_path2', 'assets/tiles/grass-path2.png');
    this.load.image('tile_path3', 'assets/tiles/grass-path3.png');
    this.load.image('tile_path4', 'assets/tiles/grass-path4.png');
    this.load.image('tile_path5', 'assets/tiles/grass-path5.png');
    this.load.image('tile_path6', 'assets/tiles/grass-path6.png');
    this.load.image('tile_path7', 'assets/tiles/grass-path7.png');
    this.load.image('tile_path8', 'assets/tiles/grass-path8.png');
    this.load.image('tile_path9', 'assets/tiles/grass-path9.png');
    this.load.image('tile_path10', 'assets/tiles/grass-path10.png');
    this.load.image('tile_path11', 'assets/tiles/grass-path11.png');

    // Character select portraits
    this.load.image('char_tim_alberino', 'assets/characters/tim_alberino.jpg');
    this.load.image('char_judd_burton', 'assets/characters/judd_burton.jpg');
    this.load.image('char_laura_sanger', 'assets/characters/laura_sanger.jpg');
    this.load.image('char_joel_muddamalle', 'assets/characters/joel_muddamalle.jpg');
    this.load.image('char_doug_van_dorn', 'assets/characters/doug_van_dorn.jpg');
    this.load.image('char_gary_wayne', 'assets/characters/gary_wayne.jpg');

    // Dr. Judd in-game sprites (64×64 frames)
    this.load.spritesheet('judd_idle', 'assets/characters/sprites/judd_idle.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('judd_walk_right', 'assets/characters/sprites/judd_walk_right.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('judd_walk_dr', 'assets/characters/sprites/judd_walk_dr.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('judd_walk_down', 'assets/characters/sprites/judd_walk_down.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('judd_walk_up', 'assets/characters/sprites/judd_walk_up.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('judd_walk_ul', 'assets/characters/sprites/judd_walk_ul.png', {
      frameWidth: 64, frameHeight: 64
    });

    // Aim cursor
    this.load.image('aim_cursor', 'assets/ui/aim-cursor-32.png');

    // Tim Alberino walk sprites (64×64)
    this.load.spritesheet('tim_walk_right', 'assets/characters/sprites/tim_walk_right.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('tim_walk_ur', 'assets/characters/sprites/tim_walk_ur.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('tim_walk_dl', 'assets/characters/sprites/tim_walk_dl.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('tim_walk_up', 'assets/characters/sprites/tim_walk_up.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('tim_walk_down', 'assets/characters/sprites/tim_walk_down.png', {
      frameWidth: 64, frameHeight: 64
    });

    // Dr. Laura Sanger walk sprites (64×64)
    this.load.spritesheet('laura_walk_right', 'assets/characters/sprites/laura_walk_right.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('laura_walk_ur', 'assets/characters/sprites/laura_walk_ur.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('laura_walk_dl', 'assets/characters/sprites/laura_walk_dl.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('laura_walk_up', 'assets/characters/sprites/laura_walk_up.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('laura_walk_down', 'assets/characters/sprites/laura_walk_down.png', {
      frameWidth: 64, frameHeight: 64
    });

    // Dr. Joel Muddamalle (minimal 3-sheet set)
    this.load.spritesheet('joel_walk_right', 'assets/characters/sprites/joel_walk_right.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('joel_walk_dr', 'assets/characters/sprites/joel_walk_dr.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('joel_walk_ul', 'assets/characters/sprites/joel_walk_ul.png', {
      frameWidth: 64, frameHeight: 64
    });

    // Doug Van Dorn walk sprites (minimal set, 64×64)
    this.load.spritesheet('doug_walk_right', 'assets/characters/sprites/doug_walk_right.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('doug_walk_ur', 'assets/characters/sprites/doug_walk_ur.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('doug_walk_dl', 'assets/characters/sprites/doug_walk_dl.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('doug_walk_up', 'assets/characters/sprites/doug_walk_up.png', {
      frameWidth: 64, frameHeight: 64
    });

    // Gary Wayne walk sprites (64×64)
    this.load.spritesheet('gary_walk_right', 'assets/characters/sprites/gary_walk_right.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('gary_walk_ur', 'assets/characters/sprites/gary_walk_ur.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('gary_walk_dr', 'assets/characters/sprites/gary_walk_dr.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('gary_walk_up', 'assets/characters/sprites/gary_walk_up.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('gary_walk_down', 'assets/characters/sprites/gary_walk_down.png', {
      frameWidth: 64, frameHeight: 64
    });

    // Fresno Nightcrawler enemies
    this.load.spritesheet('fnc_walk', 'assets/enemies/nightcrawler/walk.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('fnc_jump', 'assets/enemies/nightcrawler/jump.png', {
      frameWidth: 64, frameHeight: 64
    });
    this.load.spritesheet('fnc_miniboss_walk', 'assets/enemies/nightcrawler/miniboss_walk.png', {
      frameWidth: 96, frameHeight: 96
    });
    this.load.spritesheet('fnc_miniboss_jump', 'assets/enemies/nightcrawler/miniboss_jump.png', {
      frameWidth: 96, frameHeight: 96
    });
    this.load.spritesheet('fnc_boss_walk', 'assets/enemies/nightcrawler/boss_walk.png', {
      frameWidth: 128, frameHeight: 128
    });
    this.load.spritesheet('fnc_boss_jump', 'assets/enemies/nightcrawler/boss_jump.png', {
      frameWidth: 128, frameHeight: 128
    });
    this.load.spritesheet('fnc_boss_idleattack', 'assets/enemies/nightcrawler/boss_idleattack.png', {
      frameWidth: 128, frameHeight: 128
    });
  }

  create() {
    this.createCircleTexture('player', 32, 0xffffff);
    this.createCircleTexture('projectile', 16, 0xffffff);
    this.createJuddAnimations();
    this.createTimAnimations();
    this.createLauraAnimations();
    this.createJoelAnimations();
    this.createDougAnimations();
    this.createGaryAnimations();
    this.createNightcrawlerAnimations();
    this.scene.start('MainMenuScene');
  }

  createGaryAnimations() {
    if (this.anims.exists('gary_walk_right')) return;
    const mk = (key, end = 3, rate = 10) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end }),
        frameRate: rate,
        repeat: -1
      });
    };
    mk('gary_walk_right');
    mk('gary_walk_ur');
    mk('gary_walk_dr');
    mk('gary_walk_up');
    mk('gary_walk_down');
  }

  createDougAnimations() {
    if (this.anims.exists('doug_walk_right')) return;
    const mk = (key, end = 3, rate = 10) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end }),
        frameRate: rate,
        repeat: -1
      });
    };
    mk('doug_walk_right');
    mk('doug_walk_ur');
    mk('doug_walk_dl');
    mk('doug_walk_up');
  }

  createJoelAnimations() {
    if (this.anims.exists('joel_walk_right')) return;
    const mk = (key, end = 3, rate = 10) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end }),
        frameRate: rate,
        repeat: -1
      });
    };
    mk('joel_walk_right');
    mk('joel_walk_dr');
    mk('joel_walk_ul');
  }

  createTimAnimations() {
    if (this.anims.exists('tim_walk_right')) return;
    const mk = (key, end = 3, rate = 10) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end }),
        frameRate: rate,
        repeat: -1
      });
    };
    mk('tim_walk_right');
    mk('tim_walk_ur');
    mk('tim_walk_dl');
    mk('tim_walk_up');
    mk('tim_walk_down');
  }

  createLauraAnimations() {
    if (this.anims.exists('laura_walk_right')) return;
    const mk = (key, end = 3, rate = 10) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end }),
        frameRate: rate,
        repeat: -1
      });
    };
    mk('laura_walk_right');
    mk('laura_walk_ur');
    mk('laura_walk_dl');
    mk('laura_walk_up');
    mk('laura_walk_down');
  }

  createNightcrawlerAnimations() {
    if (this.anims.exists('fnc_walk')) return;

    this.anims.create({
      key: 'fnc_walk',
      frames: this.anims.generateFrameNumbers('fnc_walk', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: 'fnc_jump',
      frames: this.anims.generateFrameNumbers('fnc_jump', { start: 0, end: 8 }),
      frameRate: 12,
      repeat: 0
    });
    this.anims.create({
      key: 'fnc_miniboss_walk',
      frames: this.anims.generateFrameNumbers('fnc_miniboss_walk', { start: 0, end: 3 }),
      frameRate: 7,
      repeat: -1
    });
    this.anims.create({
      key: 'fnc_miniboss_jump',
      frames: this.anims.generateFrameNumbers('fnc_miniboss_jump', { start: 0, end: 11 }),
      frameRate: 11,
      repeat: 0
    });
    this.anims.create({
      key: 'fnc_boss_walk',
      frames: this.anims.generateFrameNumbers('fnc_boss_walk', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });
    this.anims.create({
      key: 'fnc_boss_jump',
      frames: this.anims.generateFrameNumbers('fnc_boss_jump', { start: 0, end: 12 }),
      frameRate: 11,
      repeat: 0
    });
    this.anims.create({
      key: 'fnc_boss_idleattack',
      frames: this.anims.generateFrameNumbers('fnc_boss_idleattack', { start: 0, end: 21 }),
      frameRate: 12,
      repeat: 0
    });
  }

  createJuddAnimations() {
    if (this.anims.exists('judd_idle')) return;

    this.anims.create({
      key: 'judd_idle',
      frames: this.anims.generateFrameNumbers('judd_idle', { start: 0, end: 14 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'judd_walk_right',
      frames: this.anims.generateFrameNumbers('judd_walk_right', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'judd_walk_dr',
      frames: this.anims.generateFrameNumbers('judd_walk_dr', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'judd_walk_down',
      frames: this.anims.generateFrameNumbers('judd_walk_down', { start: 0, end: 4 }),
      frameRate: 9,
      repeat: -1
    });
    this.anims.create({
      key: 'judd_walk_up',
      frames: this.anims.generateFrameNumbers('judd_walk_up', { start: 0, end: 4 }),
      frameRate: 9,
      repeat: -1
    });
    this.anims.create({
      key: 'judd_walk_ul',
      frames: this.anims.generateFrameNumbers('judd_walk_ul', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });
  }

  createCircleTexture(key, radius, color) {
    if (this.textures.exists(key)) return;
    const size = radius * 2;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1);
    g.fillCircle(radius, radius, radius);
    g.generateTexture(key, size, size);
    g.destroy();
  }
}

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    this.add.text(640, 180, 'NEON VECTOR RUSH', { font: '64px Arial', color: '#4ef2ff' }).setOrigin(0.5);
    const mkBtn = (y, label, cb) => {
      const t = this.add.text(640, y, label, { font: '36px Arial', backgroundColor: '#14213a', padding: { x: 18, y: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerdown', cb);
    };
    mkBtn(340, 'Play', () => this.scene.start('LevelSelectScene'));
    mkBtn(420, 'Settings', () => this.scene.start('SettingsScene', { back: 'MenuScene' }));
  }
}

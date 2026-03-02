export default class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelectScene'); }
  create() {
    this.add.text(640, 120, 'SELECT LEVEL', { font: '54px Arial', color: '#fff' }).setOrigin(0.5);
    for (let i = 1; i <= 3; i++) {
      const p = Number(localStorage.getItem(`bestPercent_level${i}`) || 0).toFixed(1);
      const a = Number(localStorage.getItem(`bestAttempts_level${i}`) || 0);
      const t = this.add.text(640, 180 + i * 110, `Level ${i}  | Best ${p}% | Best Attempts ${a || '-'}`, { font: '28px Arial', backgroundColor: '#1d2548', padding: { x: 16, y: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => this.scene.start('GameScene', { levelKey: `level${i}` }));
    }
    this.add.text(20, 20, 'Esc: Menu', { font: '20px Arial' });
    this.input.keyboard.once('keydown-ESC', () => this.scene.start('MenuScene'));
  }
}

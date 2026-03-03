export default class ResultsScene extends Phaser.Scene {
  constructor() { super('ResultsScene'); }
  init(data) { this.dataIn = data; }
  create() {
    const { levelKey, attempts, progress } = this.dataIn;
    this.add.text(640, 180, 'RESULTS', { font: '64px Arial', color: '#fff' }).setOrigin(0.5);
    this.add.text(640, 300, `${levelKey.toUpperCase()} Completed ${progress.toFixed(1)}%`, { font: '34px Arial' }).setOrigin(0.5);
    this.add.text(640, 360, `Attempts: ${attempts}`, { font: '30px Arial' }).setOrigin(0.5);
    this.add.text(640, 470, 'Level Select', { font: '32px Arial', backgroundColor: '#345', padding: { x: 16, y: 10 } }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.scene.start('LevelSelectScene'));
    this.add.text(640, 540, 'Replay', { font: '32px Arial', backgroundColor: '#563', padding: { x: 16, y: 10 } }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.scene.start('GameScene', { levelKey }));
  }
}

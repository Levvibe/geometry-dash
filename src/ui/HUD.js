export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this.text = scene.add.text(18, 14, '', { font: '20px Arial', fill: '#ffffff' }).setScrollFactor(0).setDepth(200);
    this.modeText = scene.add.text(18, 42, '', { font: '18px Arial', fill: '#8ff' }).setScrollFactor(0).setDepth(200);
    this.qa = scene.add.text(18, 76, '', { font: '16px monospace', fill: '#9f9' }).setScrollFactor(0).setDepth(200).setVisible(false);
  }
  update({ progress, attempts, mode, fps, speedTier, gravity }) {
    this.text.setText(`Progress ${progress.toFixed(1)}%   Attempts ${attempts}`);
    this.modeText.setText(`Mode ${mode}`);
    this.qa.setText(`FPS ${fps.toFixed(0)} | Mode ${mode} | Speed ${speedTier} | Gravity ${gravity > 0 ? 'Down' : 'Up'} | ${progress.toFixed(1)}%`);
  }
  toggleQA() { this.qa.setVisible(!this.qa.visible); }
  destroy() { this.text.destroy(); this.modeText.destroy(); this.qa.destroy(); }
}

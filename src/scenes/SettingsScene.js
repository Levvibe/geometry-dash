export default class SettingsScene extends Phaser.Scene {
  constructor() { super('SettingsScene'); }
  init(data) { this.back = data.back || 'MenuScene'; }
  create() {
    const s = this.registry.get('settings');
    this.add.text(640, 90, 'SETTINGS', { font: '50px Arial' }).setOrigin(0.5);
    const toggle = (label, key, y) => {
      const t = this.add.text(640, y, `${label}: ${s[key] ? 'ON' : 'OFF'}`, { font: '30px Arial', backgroundColor: '#243254', padding: { x: 16, y: 8 } }).setOrigin(0.5).setInteractive();
      t.on('pointerdown', () => { s[key] = !s[key]; t.setText(`${label}: ${s[key] ? 'ON' : 'OFF'}`); this.save(); });
    };
    const slider = (label, key, y) => {
      const t = this.add.text(640, y, `${label}: ${Math.round(s[key] * 100)} (click)`, { font: '30px Arial', backgroundColor: '#243254', padding: { x: 16, y: 8 } }).setOrigin(0.5).setInteractive();
      t.on('pointerdown', () => { s[key] = ((Math.round(s[key] * 10) + 1) % 11) / 10; t.setText(`${label}: ${Math.round(s[key] * 100)} (click)`); this.save(); });
    };
    toggle('Screen Shake', 'screenShake', 200);
    toggle('Particles', 'particles', 270);
    toggle('Show Hitboxes', 'showHitboxes', 340);
    slider('Music Volume', 'musicVolume', 420);
    slider('SFX Volume', 'sfxVolume', 490);
    this.add.text(640, 620, 'Back', { font: '32px Arial', backgroundColor: '#1c3', padding: { x: 20, y: 8 } }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.scene.start(this.back));
  }
  save() {
    const s = this.registry.get('settings');
    Object.entries(s).forEach(([k, v]) => localStorage.setItem(`settings_${k}`, v));
  }
}

import MenuScene from './scenes/MenuScene.js';
import LevelSelectScene from './scenes/LevelSelectScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import GameScene from './scenes/GameScene.js';
import ResultsScene from './scenes/ResultsScene.js';
import AudioManager from './systems/AudioManager.js';

const readSettings = () => ({
  screenShake: localStorage.getItem('settings_screenShake') !== 'false',
  particles: localStorage.getItem('settings_particles') !== 'false',
  showHitboxes: localStorage.getItem('settings_showHitboxes') === 'true',
  musicVolume: Number(localStorage.getItem('settings_musicVolume') || 0.2),
  sfxVolume: Number(localStorage.getItem('settings_sfxVolume') || 0.5),
});

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#0a0f22',
  physics: { default: 'arcade', arcade: { gravity: { y: 1300 }, fps: 120, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [MenuScene, LevelSelectScene, SettingsScene, GameScene, ResultsScene]
});

game.events.once('ready', () => {
  game.registry.set('settings', readSettings());
  const scene = game.scene.getScene('MenuScene');
  game.registry.set('audio', new AudioManager(scene));
});

window.addEventListener('resize', () => game.scale.refresh());

import LevelLoader from '../systems/LevelLoader.js';
import PlayerController, { MODE } from '../systems/PlayerController.js';
import AudioManager from '../systems/AudioManager.js';
import HUD from '../ui/HUD.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  init(data) { this.levelKey = data.levelKey || 'level1'; }

  async create() {
    this.attempts = 0;
    this.paused = false;
    this.freezeUntil = 0;
    this.settings = this.registry.get('settings');
    this.audio = this.registry.get('audio');
    this.add.rectangle(0,0,50000,720,0x101738).setOrigin(0);

    this.loaderSys = new LevelLoader(this);
    this.level = await this.loaderSys.load(this.levelKey);
    this.loaderSys.build(this.level);

    this.player = this.add.rectangle(this.level.startX + 40, 360, 34, 34, 0xffffff);
    this.physics.add.existing(this.player);
    this.player.body.setSize(30, 30).setCollideWorldBounds(false);
    this.player.body.setGravityY(1300);
    this.physics.world.setBounds(0, 0, this.level.endX + 800, 720);
    this.physics.world.TILE_BIAS = 24;
    this.physics.world.setFPS(120);

    this.ctrl = new PlayerController(this, this.player);
    this.hud = new HUD(this);

    this.cameras.main.startFollow(this.player, false, 0.15, 0.15, -360, 0);
    this.cameras.main.setDeadzone(500, 200);

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, this.hazards, () => this.die());
    this.physics.add.overlap(this.player, this.portals, (_, p) => this.hitPortal(p));
    this.physics.add.overlap(this.player, this.rings, (_, r) => this.activeRing = r);
    this.physics.add.overlap(this.player, this.pads, (_, p) => this.hitPad(p));

    this.input.keyboard.on('keydown-SPACE', () => this.press());
    this.input.keyboard.on('keyup-SPACE', () => this.ctrl.release());
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard.on('keydown-R', () => this.restartAttempt());
    this.input.keyboard.on('keydown-F1', () => this.hud.toggleQA());
    this.input.on('pointerdown', () => this.press());
    this.input.on('pointerup', () => this.ctrl.release());

    this.pauseUI = this.add.container(640, 360, [
      this.add.rectangle(0,0,360,240,0x000000,0.8),
      this.add.text(0,-80,'PAUSED',{font:'42px Arial'}).setOrigin(0.5),
      this.add.text(0,-20,'Resume',{font:'28px Arial',backgroundColor:'#2a5',padding:{x:12,y:6}}).setOrigin(0.5).setInteractive().on('pointerdown',()=>this.togglePause()),
      this.add.text(0,35,'Restart',{font:'28px Arial',backgroundColor:'#58a',padding:{x:12,y:6}}).setOrigin(0.5).setInteractive().on('pointerdown',()=>this.restartAttempt()),
      this.add.text(0,90,'Level Select',{font:'28px Arial',backgroundColor:'#a53',padding:{x:12,y:6}}).setOrigin(0.5).setInteractive().on('pointerdown',()=>this.scene.start('LevelSelectScene')),
    ]).setScrollFactor(0).setDepth(999).setVisible(false);

    this.restartAttempt();
  }

  press() {
    this.audio.unlock(); this.audio.startMusic();
    this.ctrl.press();
    if (this.activeRing && !this.activeRing.used) {
      const t = this.activeRing.objType.split('_')[1].replace('type','');
      this.ctrl.applyBoost(t);
      this.activeRing.used = true;
      this.activeRing.fillColor = 0x666666;
      this.audio.beep(620, 0.1, 'sine');
    }
  }

  hitPad(p) {
    if (p.lastHit === this.attempts) return;
    p.lastHit = this.attempts;
    if (p.objType === 'jump_pad') this.player.body.velocity.y = -680 * this.ctrl.gravityDir;
    if (p.objType === 'lift_pad') this.player.body.velocity.y = -520 * this.ctrl.gravityDir;
    if (p.objType === 'angle_pad') this.player.body.velocity.y = -320 * this.ctrl.gravityDir;
  }

  hitPortal(p) {
    if (p.lastHit === this.attempts) return;
    p.lastHit = this.attempts;
    if (p.objType.includes('mode_runner')) this.ctrl.setMode(MODE.RUNNER);
    if (p.objType.includes('mode_glider')) this.ctrl.setMode(MODE.GLIDER);
    if (p.objType.includes('mode_pulse')) this.ctrl.setMode(MODE.PULSE);
    if (p.objType.includes('gravity')) this.ctrl.setGravity(this.ctrl.gravityDir * -1);
    if (p.objType.includes('speed')) this.ctrl.setSpeedTier(p.props.speedTier || 'normal');
    this.tweens.add({ targets: this.player, scale: 1.4, angle: this.player.angle + 90, yoyo: true, duration: 120 });
  }

  die() {
    if (this.time.now < this.freezeUntil) return;
    this.freezeUntil = this.time.now + 300;
    this.audio.beep(160, 0.2, 'sawtooth');
    if (this.settings.screenShake) this.cameras.main.shake(140, 0.008);
    this.time.delayedCall(120, () => this.restartAttempt());
  }

  restartAttempt() {
    this.attempts++;
    this.player.setPosition(this.level.startX + 40, 360);
    this.player.body.setVelocity(0, 0);
    this.player.setScale(1).setAngle(0);
    this.ctrl.setMode(MODE.RUNNER);
    this.ctrl.setGravity(1);
    this.ctrl.setSpeedTier('normal');
    this.rings.children.iterate(r => { r.used = false; r.fillColor = 0xf8f26d; });
    [...this.portals.children.entries, ...this.pads.children.entries].forEach(o => o.lastHit = -1);
  }

  togglePause() {
    this.paused = !this.paused;
    this.physics.world.isPaused = this.paused;
    this.pauseUI.setVisible(this.paused);
  }

  update(_, dt) {
    if (!this.player || this.paused || this.time.now < this.freezeUntil) return;
    const grounded = this.player.body.blocked.down || this.player.body.touching.down || this.player.body.blocked.up;
    this.ctrl.update(dt, grounded);
    const pRaw = ((this.player.x - this.level.startX) / (this.level.endX - this.level.startX)) * 100;
    const progress = Phaser.Math.Clamp(pRaw, 0, 100);
    this.hud.update({ progress, attempts: this.attempts, mode: this.ctrl.mode, fps: this.game.loop.actualFps, speedTier: Math.round(this.ctrl.speed), gravity: this.ctrl.gravityDir });

    if (this.player.x >= this.level.endX) {
      this.saveStats(progress);
      this.scene.start('ResultsScene', { levelKey: this.levelKey, attempts: this.attempts, progress });
    }
    if (this.player.y < -120 || this.player.y > 840) this.die();
  }

  saveStats(progress) {
    const percentKey = `bestPercent_${this.levelKey}`;
    const attKey = `bestAttempts_${this.levelKey}`;
    const bp = Number(localStorage.getItem(percentKey) || 0);
    if (progress > bp) localStorage.setItem(percentKey, progress.toFixed(1));
    const ba = Number(localStorage.getItem(attKey) || 0);
    if (!ba || this.attempts < ba) localStorage.setItem(attKey, this.attempts);
  }
}

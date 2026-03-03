export default class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicNode = null;
  }

  unlock() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.setVolumes(this.scene.registry.get('settings'));
  }

  setVolumes(settings) {
    if (!this.ctx) return;
    this.musicGain.gain.value = settings.musicVolume;
    this.sfxGain.gain.value = settings.sfxVolume;
  }

  beep(freq = 440, duration = 0.08, type = 'square', gain = 0.16) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    osc.stop(this.ctx.currentTime + duration);
  }

  startMusic() {
    if (!this.ctx || this.musicNode) return;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 110;
    lfo.frequency.value = 2;
    lfoGain.gain.value = 12;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(this.musicGain);
    osc.start();
    lfo.start();
    this.musicNode = { osc, lfo };
  }
}

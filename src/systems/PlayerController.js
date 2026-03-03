const MODE = { RUNNER: 'Runner', GLIDER: 'Glider', PULSE: 'Pulse' };
export { MODE };

export default class PlayerController {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.mode = MODE.RUNNER;
    this.gravityDir = 1;
    this.jumpBuffer = 0;
    this.coyote = 0;
    this.holdJump = false;
    this.speed = 280;
    this.targetSpeed = 280;
    this.pulseSlope = 230;
  }

  setMode(mode) { this.mode = mode; }
  setGravity(dir) { this.gravityDir = dir; this.player.setGravityY(1300 * dir); }
  setSpeedTier(tier) { this.targetSpeed = ({ slow: 220, normal: 300, fast: 380 }[tier] || 300); }

  press() { this.jumpBuffer = 120; this.holdJump = true; }
  release() { this.holdJump = false; }

  update(dt, grounded) {
    this.speed = Phaser.Math.Linear(this.speed, this.targetSpeed, Math.min(1, dt / 300));
    this.player.setVelocityX(this.speed);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.coyote = grounded ? 90 : Math.max(0, this.coyote - dt);

    if (this.mode === MODE.RUNNER) {
      if (this.jumpBuffer > 0 && this.coyote > 0) {
        this.player.setVelocityY(-500 * this.gravityDir);
        this.jumpBuffer = 0;
        this.coyote = 0;
      }
      if (!this.holdJump && Math.sign(this.player.body.velocity.y) === -this.gravityDir) {
        this.player.setVelocityY(this.player.body.velocity.y * 0.92);
      }
    } else if (this.mode === MODE.GLIDER) {
      const thrust = this.holdJump ? -880 * this.gravityDir : 980 * this.gravityDir;
      this.player.setAccelerationY(thrust);
      this.player.setMaxVelocity(this.speed + 120, 460);
      this.player.setAngle(Phaser.Math.Clamp(this.player.body.velocity.y * 0.03, -30, 30));
    } else {
      this.player.setAllowGravity(false);
      this.player.setVelocityY((this.holdJump ? -this.pulseSlope : this.pulseSlope) * this.gravityDir);
      this.player.setAngle(this.holdJump ? -35 * this.gravityDir : 35 * this.gravityDir);
    }
    if (this.mode !== MODE.PULSE) this.player.setAllowGravity(true);
  }

  applyBoost(kind) {
    if (kind === 'A') this.player.setVelocityY(-620 * this.gravityDir);
    if (kind === 'C') this.player.setVelocityY(-760 * this.gravityDir);
    if (kind === 'B') {
      this.gravityDir *= -1;
      this.setGravity(this.gravityDir);
      this.player.setVelocityY(-360 * this.gravityDir);
    }
  }
}

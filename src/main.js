const $ = (sel, root = document) => root.querySelector(sel);

const settings = {
  screenShake: localStorage.getItem('settings_screenShake') !== 'false',
  particles: localStorage.getItem('settings_particles') !== 'false',
  showHitboxes: localStorage.getItem('settings_showHitboxes') === 'true',
  musicVolume: Number(localStorage.getItem('settings_musicVolume') || 0.2),
  sfxVolume: Number(localStorage.getItem('settings_sfxVolume') || 0.5),
};
const saveSettings = () => Object.entries(settings).forEach(([k, v]) => localStorage.setItem(`settings_${k}`, String(v)));

const MODE = { RUNNER: 'Runner', GLIDER: 'Glider', PULSE: 'Pulse' };
const TIER = { slow: 220, normal: 300, fast: 380 };

const app = {
  root: $('#game'),
  canvas: null,
  ctx: null,
  w: 1280,
  h: 720,
  level: null,
  objs: [],
  attempts: 0,
  paused: false,
  qa: false,
  activeRing: null,
  pointerDown: false,
  freezeMs: 0,
  audio: null,
  musicInt: null,
  particles: [],
  state: {
    x: 140, y: 360, vx: TIER.normal, vy: 0, ax: 0,
    gravity: 1, mode: MODE.RUNNER, speed: TIER.normal, targetSpeed: TIER.normal,
    jumpBuffer: 0, coyote: 0,
  },
};

function initAudio() {
  if (app.audio) return;
  app.audio = new (window.AudioContext || window.webkitAudioContext)();
}
function beep(freq, dur = 0.08, type = 'square', vol = settings.sfxVolume) {
  if (!app.audio) return;
  const o = app.audio.createOscillator();
  const g = app.audio.createGain();
  o.type = type; o.frequency.value = freq; g.gain.value = Math.max(0.001, vol * 0.2);
  o.connect(g); g.connect(app.audio.destination); o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, app.audio.currentTime + dur);
  o.stop(app.audio.currentTime + dur);
}
function startMusic() {
  if (!app.audio || app.musicInt) return;
  const notes = [220, 247, 262, 247, 294, 330, 294, 262];
  let i = 0;
  app.musicInt = setInterval(() => beep(notes[(i++) % notes.length], 0.07, 'triangle', settings.musicVolume * 0.7), 250);
}

function button(label, onClick) {
  const b = document.createElement('button');
  b.textContent = label;
  b.className = 'menu-btn';
  b.onclick = onClick;
  return b;
}

function clearRoot() { app.root.innerHTML = ''; }

function showMenu() {
  clearRoot();
  const wrap = document.createElement('div'); wrap.className = 'menu';
  wrap.innerHTML = `<h1>NEON VECTOR RUSH</h1>`;
  wrap.append(button('Play', showLevelSelect), button('Settings', () => showSettings(showMenu)));
  app.root.append(wrap);
}

function showLevelSelect() {
  clearRoot();
  const wrap = document.createElement('div'); wrap.className = 'menu';
  wrap.innerHTML = '<h2>Select Level</h2>';
  for (let i = 1; i <= 3; i++) {
    const p = Number(localStorage.getItem(`bestPercent_level${i}`) || 0).toFixed(1);
    const a = localStorage.getItem(`bestAttempts_level${i}`) || '-';
    wrap.append(button(`Level ${i} • Best ${p}% • Attempts ${a}`, () => startGame(`level${i}`)));
  }
  wrap.append(button('Back', showMenu));
  app.root.append(wrap);
}

function showSettings(backFn) {
  clearRoot();
  const wrap = document.createElement('div'); wrap.className = 'menu';
  wrap.innerHTML = '<h2>Settings</h2>';
  const addToggle = (k, label) => wrap.append(button(`${label}: ${settings[k] ? 'ON' : 'OFF'}`, (e) => { settings[k] = !settings[k]; saveSettings(); e.target.textContent = `${label}: ${settings[k] ? 'ON' : 'OFF'}`; }));
  const addSlider = (k, label) => wrap.append(button(`${label}: ${Math.round(settings[k]*100)}`, (e) => { settings[k] = ((Math.round(settings[k]*10)+1)%11)/10; saveSettings(); e.target.textContent = `${label}: ${Math.round(settings[k]*100)}`; }));
  addToggle('screenShake', 'Screen Shake'); addToggle('particles', 'Particles'); addToggle('showHitboxes', 'Show Hitboxes');
  addSlider('musicVolume', 'Music Volume'); addSlider('sfxVolume', 'SFX Volume');
  wrap.append(button('Back', backFn));
  app.root.append(wrap);
}

function normObj(o) { return { ...o, w: o.w || (o.radius ? o.radius*2 : 36), h: o.h || (o.radius ? o.radius*2 : 36), used: false, cd: 0 }; }
const overlaps = (a,b)=>Math.abs(a.x-b.x)*2<(a.w+b.w)&&Math.abs(a.y-b.y)*2<(a.h+b.h);

async function startGame(levelKey) {
  clearRoot();
  app.levelKey = levelKey;
  app.level = await fetch(`levels/${levelKey}.json`).then(r => r.json());
  app.objs = app.level.objects.map(normObj);
  app.canvas = document.createElement('canvas'); app.canvas.width = app.w; app.canvas.height = app.h; app.canvas.className = 'game-canvas';
  app.ctx = app.canvas.getContext('2d');
  app.root.append(app.canvas);
  app.hud = document.createElement('div'); app.hud.className = 'hud';
  app.root.append(app.hud);
  app.pauseMenu = document.createElement('div'); app.pauseMenu.className = 'pause hidden';
  app.pauseMenu.innerHTML = '<h2>Paused</h2>';
  app.pauseMenu.append(button('Resume',()=>togglePause()), button('Restart',()=>restartAttempt()), button('Level Select', showLevelSelect));
  app.root.append(app.pauseMenu);

  app.canvas.onpointerdown = ()=>press();
  app.canvas.onpointerup = ()=>release();
  window.onkeydown = (e)=>{ if(e.code==='Space'){e.preventDefault(); press();} if(e.code==='Escape')togglePause(); if(e.code==='KeyR')restartAttempt(); if(e.code==='F1'){e.preventDefault();app.qa=!app.qa;} };
  window.onkeyup = (e)=>{ if(e.code==='Space') release(); };
  restartAttempt();
  app.last = performance.now();
  requestAnimationFrame(loop);
}

function restartAttempt() {
  app.attempts++;
  Object.assign(app.state, { x: app.level.startX + 40, y: 360, vx: TIER.normal, vy: 0, mode: MODE.RUNNER, gravity: 1, speed: TIER.normal, targetSpeed: TIER.normal, jumpBuffer: 0, coyote: 0 });
  app.activeRing = null;
  app.objs.forEach(o => { o.used = false; o.cd = 0; });
}

function press() { initAudio(); startMusic(); app.pointerDown = true; app.state.jumpBuffer = 120; activateRing(); }
function release() { app.pointerDown = false; }
function togglePause() { app.paused = !app.paused; app.pauseMenu.classList.toggle('hidden', !app.paused); }

function activateRing() {
  if (!app.activeRing || app.activeRing.used) return;
  const t = app.activeRing.type;
  if (t === 'ring_typeA') app.state.vy = -620 * app.state.gravity;
  if (t === 'ring_typeC') app.state.vy = -760 * app.state.gravity;
  if (t === 'ring_typeB') { app.state.gravity *= -1; app.state.vy = -360 * app.state.gravity; }
  app.activeRing.used = true; beep(620, 0.1, 'sine');
}

function update(dt) {
  if (app.paused || app.freezeMs > 0) { app.freezeMs = Math.max(0, app.freezeMs - dt); return; }
  const s = app.state;
  s.speed += (s.targetSpeed - s.speed) * Math.min(1, dt/300);
  s.vx = s.speed;
  s.jumpBuffer = Math.max(0, s.jumpBuffer - dt);
  const plats = app.objs.filter(o=>o.type.startsWith('platform'));
  const hazards = app.objs.filter(o=>o.type.startsWith('hazard'));
  const portals = app.objs.filter(o=>o.type.startsWith('portal'));
  const rings = app.objs.filter(o=>o.type.startsWith('ring'));
  const pads = app.objs.filter(o=>o.type.endsWith('pad'));

  const grounded = plats.some(p => Math.abs((s.y + 17 * s.gravity) - (p.y - (p.h/2)*s.gravity)) < 8 && Math.abs(s.x - p.x) < (p.w/2+18));
  s.coyote = grounded ? 90 : Math.max(0, s.coyote - dt);

  if (s.mode === MODE.RUNNER) {
    if (s.jumpBuffer > 0 && s.coyote > 0) { s.vy = -520 * s.gravity; s.jumpBuffer = 0; s.coyote = 0; beep(480,0.05); }
    if (!app.pointerDown && Math.sign(s.vy) === -s.gravity) s.vy *= 0.92;
    s.vy += 1800 * s.gravity * (dt/1000);
  } else if (s.mode === MODE.GLIDER) {
    const a = app.pointerDown ? -1300 * s.gravity : 1400 * s.gravity;
    s.vy += a * (dt/1000);
    s.vy = Math.max(-460, Math.min(460, s.vy));
  } else {
    s.vy = (app.pointerDown ? -230 : 230) * s.gravity;
  }

  const prevY = s.y;
  s.x += s.vx * dt/1000;
  s.y += s.vy * dt/1000;

  for (const p of plats) {
    if (overlaps({x:s.x,y:s.y,w:30,h:30}, p)) {
      const top = p.y - p.h/2;
      const bot = p.y + p.h/2;
      if (s.gravity > 0 && prevY + 15 <= top) { s.y = top - 15; s.vy = 0; }
      else if (s.gravity < 0 && prevY - 15 >= bot) { s.y = bot + 15; s.vy = 0; }
    }
  }

  app.activeRing = null;
  for (const r of rings) if (!r.used && overlaps({x:s.x,y:s.y,w:34,h:34}, r)) app.activeRing = r;

  for (const p of pads) if (overlaps({x:s.x,y:s.y,w:30,h:30}, p) && p.cd<=0) {
    p.cd = 300;
    if (p.type === 'jump_pad') s.vy = -700 * s.gravity;
    if (p.type === 'lift_pad') s.vy = -560 * s.gravity;
    if (p.type === 'angle_pad') s.vy = -380 * s.gravity;
    beep(700,0.05,'triangle');
  }
  for (const o of app.objs) o.cd = Math.max(0,o.cd-dt);

  for (const p of portals) if (overlaps({x:s.x,y:s.y,w:30,h:30}, p) && p.cd<=0) {
    p.cd = 300;
    if (p.type.includes('mode_runner')) s.mode = MODE.RUNNER;
    if (p.type.includes('mode_glider')) s.mode = MODE.GLIDER;
    if (p.type.includes('mode_pulse')) s.mode = MODE.PULSE;
    if (p.type.includes('gravity')) s.gravity *= -1;
    if (p.type.includes('speed')) s.targetSpeed = TIER[p.speedTier || 'normal'];
    beep(820,0.06,'sine');
  }

  if (hazards.some(h=>overlaps({x:s.x,y:s.y,w:28,h:28},h)) || s.y < -120 || s.y > 840) {
    app.freezeMs = 120;
    if (settings.screenShake) app.shake = 120;
    beep(160,0.2,'sawtooth');
    setTimeout(restartAttempt, 120);
  }

  const progress = Math.max(0, Math.min(100, ((s.x-app.level.startX)/(app.level.endX-app.level.startX))*100));
  app.progress = progress;
  if (s.x >= app.level.endX) return finishLevel();
}

function finishLevel() {
  const k = app.levelKey;
  const pKey = `bestPercent_${k}`; const aKey = `bestAttempts_${k}`;
  const bp = Number(localStorage.getItem(pKey)||0); if (app.progress > bp) localStorage.setItem(pKey, app.progress.toFixed(1));
  const ba = Number(localStorage.getItem(aKey)||0); if (!ba || app.attempts < ba) localStorage.setItem(aKey, String(app.attempts));
  clearRoot();
  const wrap = document.createElement('div'); wrap.className='menu';
  wrap.innerHTML = `<h2>Results</h2><p>${app.level.meta.name}: ${app.progress.toFixed(1)}%</p><p>Attempts: ${app.attempts}</p>`;
  wrap.append(button('Replay', ()=>startGame(app.levelKey)), button('Level Select', showLevelSelect));
  app.root.append(wrap);
}

function draw() {
  const ctx = app.ctx; if (!ctx) return;
  ctx.clearRect(0,0,app.w,app.h);
  const g = ctx.createLinearGradient(0,0,app.w,app.h); g.addColorStop(0,'#1a2560'); g.addColorStop(1,'#030718');
  ctx.fillStyle = g; ctx.fillRect(0,0,app.w,app.h);

  const camX = app.state.x - app.w*0.25;
  const shake = app.shake>0 ? (Math.random()-0.5)*8 : 0; app.shake = Math.max(0,(app.shake||0)-16);
  ctx.save(); ctx.translate(-camX + shake, 0);

  for (const o of app.objs) {
    const color = o.type.startsWith('platform') ? '#2b3578' : o.type.startsWith('hazard') ? '#ff3f69' : o.type.startsWith('portal') ? '#38ffe3' : o.type.startsWith('ring') ? (o.used ? '#666':'#f8f26d') : '#a867ff';
    ctx.fillStyle = color;
    ctx.fillRect(o.x-o.w/2,o.y-o.h/2,o.w,o.h);
    if (settings.showHitboxes) { ctx.strokeStyle = '#fff'; ctx.strokeRect(o.x-o.w/2,o.y-o.h/2,o.w,o.h); }
  }
  ctx.fillStyle = '#fff';
  ctx.save(); ctx.translate(app.state.x, app.state.y); ctx.rotate((app.state.mode===MODE.PULSE?(app.pointerDown?-0.6:0.6)*app.state.gravity:app.state.vy*0.002));
  ctx.fillRect(-17,-17,34,34); ctx.restore();
  ctx.restore();

  app.hud.textContent = `Progress ${app.progress?.toFixed(1)||'0.0'}% | Attempts ${app.attempts} | Mode ${app.state.mode}` + (app.qa ? ` | FPS ${Math.round(app.fps||0)} | Speed ${Math.round(app.state.speed)} | Gravity ${app.state.gravity>0?'Down':'Up'}` : '');
}

function loop(now) {
  const dt = Math.min(33, now - app.last); app.last = now;
  app.fps = 1000 / Math.max(1, dt);
  if (app.canvas && document.body.contains(app.canvas)) { update(dt); draw(); requestAnimationFrame(loop); }
}

showMenu();

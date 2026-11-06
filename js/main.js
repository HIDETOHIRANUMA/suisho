import { TEXT, DIVIDER, DIVIDER_START, DIVIDER_STEP, GROWTH_START, END_AT } from './text.js';
import { Renderer, rotation } from './renderer.js';
import { Meter } from './meter.js';
import { Sound } from './sound.js';

const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (x) => x * x * (3 - 2 * x);
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lang = 'ja';
let T = TEXT.ja;
let renderer = null;
const meter = new Meter();
let sound = new Sound();

const S = {
  running: false, ended: false,
  t: 0,                    // scene time in seconds (stops while the page is hidden)
  lastNow: null,
  lineIdx: 0, lineTimer: null,
  divIdx: 0,
  layers: [],
  outer: 0.08, pulse: 0, newS: 0, flash: 0,
  nextTickAudio: null, nextTickScene: null, pending: [],
  growthAt: null,
  scale: 1, frameTimes: [], lastScaleChange: 0,
  hudAt: 0,
};

// ---------- text ----------
function applyStatic() {
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = T[el.dataset.t];
  $('#about-body').innerHTML = T.aboutHtml;
}

function fmtNum(v, d) { return Number.isFinite(v) ? v.toFixed(d) : '—'; }

function growthClock() {
  const sec = S.layers.length;
  return { mm: Math.floor(sec / 60), ss: String(sec % 60).padStart(2, '0'), n: sec };
}

function ppmText() {
  const p = meter.ppm;
  if (!Number.isFinite(p)) return '';
  const a = Math.abs(p);
  const v = a >= 100 ? a.toFixed(0) : a >= 10 ? a.toFixed(1) : a.toFixed(2);
  return lang === 'ja' ? `100万分の${v}` : `${v} parts per million`;
}

function beatPlan() {
  // magnify the difference so that it is heard as a slow beat (about 1 per second)
  const p = Math.abs(meter.ppm || 0);
  if (!meter.ok || p < 0.05) return { amp: null, hz: 0.6 };
  const raw = 1.0 / (256 * p * 1e-6);
  const nice = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000];
  let amp = nice[nice.length - 1];
  for (const v of nice) if (v >= raw * 0.7) { amp = v; break; }
  const hz = clamp(256 * p * 1e-6 * amp, 0.25, 3);
  return { amp, hz };
}

function fillLine(line) {
  let t = line.t;
  const ok = meter.ok && Number.isFinite(meter.rate);
  if (t.includes('{hz}')) {
    if (!ok) return T.rateFallback;
    if (Math.abs(meter.ppm) < 5 && line.alt) t = line.alt;
  }
  if (line.beat) {
    const b = beatPlan();
    if (!b.amp) return T.beatFallback;
    t = t.replace('{amp}', b.amp.toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US')).replace('{ppm}', ppmText());
  }
  const g = growthClock();
  return t
    .replace('{period}', fmtNum(meter.period, 2))
    .replace('{hz}', fmtNum(meter.rate, 3))
    .replace('{nominal}', String(meter.nominal || 60))
    .replace('{mm}', g.mm).replace('{ss}', g.ss).replace('{n}', g.n);
}

function showLine(line) {
  const el = $('#line');
  el.classList.remove('on');
  clearTimeout(S.lineTimer);
  S.lineTimer = setTimeout(() => {
    el.textContent = fillLine(line);
    el.classList.add('on');
    if (line.d > 0) S.lineTimer = setTimeout(() => el.classList.remove('on'), line.d * 1000);
  }, 380);
  if (line.beat) {
    const b = beatPlan();
    sound.beat(sound.now + 0.4, b.hz);
  }
}

function showBig(freq) {
  const big = $('#big');
  const note = T.dividerNote[freq] || '';
  big.innerHTML = `<b>${freq.toLocaleString('en-US')}</b><span>${note}</span>`;
  big.classList.remove('on');
  void big.offsetWidth;
  big.classList.add('on');
}

// ---------- growth ----------
function growthOuter(t) {
  if (t < GROWTH_START) return 0.08;
  return 0.08 + 0.92 * (1 - Math.exp(-(t - GROWTH_START) / 70));
}

// How much this second wavered: spread of the intervals, the largest single wobble, skipped frames.
function wobbleScore(st) { return st.std + 0.25 * st.maxDev + 2 * st.drops; }

// Every second adds a layer. Compared with the other seconds on the same device, the seconds that
// wavered most leave dense layers (phantoms); skipped frames leave a green layer; the first second is amber.
function addLayer() {
  const st = meter.takeSecond();
  const k = S.layers.length;
  const s = Math.max(0.081, S.outer);
  const score = wobbleScore(st);
  let vis = 0.35;
  if (k >= 6) {
    let below = 0;
    for (const l of S.layers) if (l.score < score) below++;
    vis = smooth(clamp((below / S.layers.length - 0.80) / 0.185, 0, 1));
  }
  if (st.std > 1.0 || st.drops > 2) vis = Math.max(vis, 0.8);
  const width = clamp(0.0012 + st.std * 0.003, 0.0012, 0.004);
  let alpha = 0.00002 + 0.0012 * vis;
  let color = [0.78, 0.87, 1.0];
  if (st.drops > 0) { color = [0.42, 0.86, 0.52]; alpha += 0.0005; }   // a green "chlorite" layer
  if (k === 0) { color = [1.0, 0.70, 0.40]; alpha = 0.0025; vis = 1; }  // the first second
  const tilt = clamp(Math.abs(st.signed) * 0.003 + st.std * 0.012, 0, 0.05);
  const tiltAz = (k * 2.39996 + st.signed * 0.4) % (Math.PI * 2) - Math.PI;
  renderer.addLayer({ s, width, alpha, color, tilt, tiltAz });
  S.layers.push({ s, score, vis, ...st });
  S.newS = s;
  S.pulse = 1;
}

// Camera: keeps the base of the crystal at a fixed height on the screen and pulls back as it grows.
// k: 0 on the start screen, 1 while the piece plays.
function view(outer, aspect, k, opt = {}) {
  const portrait = aspect < 0.8;
  const V = (opt.v0 ?? 1.25) + (opt.v1 ?? (portrait ? 1.75 : 1.5)) * outer;
  const play = opt.base ?? (portrait ? 0.36 : 0.30);
  const base = play * k + 0.13 * (1 - k);
  const focal = 2.25;
  const yc = V * (0.5 - base);
  return { seed: [0, 0, 0], cam: [0, yc + 0.06 * V, V * focal], target: [0, yc, 0], focal };
}

// ---------- the timeline ----------
function audioAt(sceneTime) { return sound.now + Math.max(0, sceneTime - S.t); }

function step(dt) {
  S.t += dt;
  const t = S.t;
  // narration
  while (S.lineIdx < T.lines.length && t >= T.lines[S.lineIdx].at) {
    showLine(T.lines[S.lineIdx]);
    S.lineIdx++;
  }
  // the divider chain (scheduled a little ahead for exact sound timing)
  while (S.divIdx < DIVIDER.length && t + 0.12 >= DIVIDER_START + S.divIdx * DIVIDER_STEP) {
    const f = DIVIDER[S.divIdx];
    const at = DIVIDER_START + S.divIdx * DIVIDER_STEP;
    sound.dividerStep(f, audioAt(at), DIVIDER_STEP);
    const i = S.divIdx;
    setTimeout(() => { if (S.running) { showBig(f); S.flash = 1; } }, Math.max(0, (at - t) * 1000));
    if (f < 20) {
      const n = Math.max(1, Math.round(DIVIDER_STEP * f));
      for (let j = 1; j < n; j++) setTimeout(() => { if (S.running) S.flash = 0.7; }, Math.max(0, (at - t + j / f) * 1000));
    }
    if (i === DIVIDER.length - 1) setTimeout(() => $('#big').classList.remove('on'), Math.max(0, (at - t + DIVIDER_STEP) * 1000));
    S.divIdx++;
  }
  // growth: one layer per second, counted by the audio clock when there is sound
  if (t >= GROWTH_START - 0.15 && S.growthAt === null) {
    S.growthAt = GROWTH_START;
    if (sound.on) S.nextTickAudio = audioAt(GROWTH_START);
    else S.nextTickScene = GROWTH_START;
    sound.drone(audioAt(GROWTH_START));
  }
  if (S.growthAt !== null) {
    if (sound.on) {
      if (sound.now > S.nextTickAudio + 2) S.nextTickAudio = Math.ceil(sound.now);   // after a pause
      while (sound.now + 0.15 >= S.nextTickAudio) {
        const last = S.layers[S.layers.length - 1];
        const bright = last ? clamp(last.std * 2, 0, 1) : 0;
        sound.ting(S.nextTickAudio, 0.05, bright);
        S.pending.push(S.nextTickAudio);
        S.nextTickAudio += 1;
      }
      while (S.pending.length && sound.now >= S.pending[0]) { S.pending.shift(); addLayer(); }
    } else {
      while (t >= S.nextTickScene) { addLayer(); S.nextTickScene += 1; }
    }
  }
  S.outer = growthOuter(t);
  S.pulse *= Math.exp(-dt / 0.45);
  S.flash *= Math.exp(-dt / 0.28);
  if (t >= 67.5) $('#hud').classList.add('on');
  if (!S.ended && t >= END_AT) end();
}

function hud(now) {
  if (now - S.hudAt < 250) return;
  S.hudAt = now;
  meter.estimate();
  const last = S.layers[S.layers.length - 1];
  const jit = last ? last.std : 0;
  const rate = meter.ok ? `${fmtNum(meter.rate, 3)} ${T.perSec}` : '—';
  $('#hud').textContent = `${T.hudPeriod} ${fmtNum(meter.period, 3)} ms ±${fmtNum(jit, 3)}　${T.hudRate} ${rate}　${T.hudLayers} ${S.layers.length}`;
}

function adapt(dtMs, now) {
  S.frameTimes.push(dtMs);
  if (S.frameTimes.length > 90) S.frameTimes.shift();
  if (now - S.lastScaleChange < 3000 || S.frameTimes.length < 60) return;
  const avg = S.frameTimes.reduce((a, b) => a + b, 0) / S.frameTimes.length;
  const max = Math.min(window.devicePixelRatio || 1, 2) * 0.9;
  if (avg > 24 && S.scale > 0.45) { S.scale = Math.max(0.45, S.scale * 0.82); S.lastScaleChange = now; S.frameTimes = []; }
  else if (avg < 14.5 && S.scale < max) { S.scale = Math.min(max, S.scale * 1.1); S.lastScaleChange = now; S.frameTimes = []; }
}

function frame(ts) {
  requestAnimationFrame(frame);
  const now = performance.now();
  if (S.lastNow === null) S.lastNow = now;
  const dtMs = now - S.lastNow;
  S.lastNow = now;
  if (S.running) {
    meter.frame(ts);
    const dt = dtMs > 0 && dtMs < 250 ? dtMs / 1000 : 0;
    step(dt);
    hud(now);
    adapt(dtMs, now);
  }
  draw();
}

function draw() {
  if (!renderer) return;
  const t = S.t;
  renderer.resize(S.scale);
  const spin = reduceMotion ? 0.015 : 0.07;
  const dividerOn = t > DIVIDER_START - 0.5 && t < GROWTH_START + 0.5;
  const playing = S.running || S.ended;
  const reveal = playing ? clamp((t - 0.4) / 4.5, 0, 1) : 0.0;
  const c = renderer.canvas;
  const k = playing ? smooth(clamp((t - 0.3) / 5.5, 0, 1)) : 0;
  renderer.draw({
    time: t + (S.running ? 0 : performance.now() / 1000),
    rot: rotation(0.6 + t * spin, 0.11),
    ...view(S.outer, c.clientWidth / Math.max(1, c.clientHeight), k),
    outer: S.outer,
    reveal: S.running || S.ended ? reveal : 0.35,
    pulse: S.pulse,
    newS: S.newS,
    dim: dividerOn ? 0.3 : 0,
    flash: S.flash,
  });
}

// ---------- start / end ----------
function begin(l) {
  lang = l; T = TEXT[l];
  applyStatic();
  sound = new Sound();
  sound.start();
  meter.reset();
  if (renderer) renderer.reset();
  Object.assign(S, { running: true, ended: false, t: 0, lineIdx: 0, divIdx: 0, layers: [], outer: 0.08, pulse: 0, flash: 0, newS: 0,
    nextTickAudio: null, nextTickScene: null, pending: [], growthAt: null });
  document.body.classList.add('playing');
  document.body.classList.remove('ended');
  $('#line').textContent = '';
  $('#hud').classList.remove('on');
  $('#end').hidden = true;
}

function end() {
  S.ended = true;
  meter.estimate();
  const g = growthClock();
  const max = fmtNum(meter.maxDevAll, 2);
  const hz = meter.ok ? fmtNum(meter.rate, 3) : '—';
  const ph = S.layers.filter((l) => l.vis >= 0.5).length;
  $('#stats').textContent = T.stats({ ...g, max, hz, ph });
  setTimeout(() => {
    $('#end').hidden = false;
    document.body.classList.add('ended');
  }, 2500);
}

async function saveImage() {
  const btn = $('#save');
  const label = btn.textContent;
  btn.textContent = T.saving;
  btn.disabled = true;
  try {
    await document.fonts.ready;
    const W = 1600, H = 2000;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#05060a';
    g.fillRect(0, 0, W, H);
    // draw the crystal with a second renderer at full size
    const off = document.createElement('canvas');
    off.style.width = '1600px'; off.style.height = '1700px';
    off.width = 1600; off.height = 1700;
    Object.defineProperty(off, 'clientWidth', { value: 1600 });
    Object.defineProperty(off, 'clientHeight', { value: 1700 });
    const r2 = new Renderer(off);
    r2.cum.set(renderer.cum);
    r2.dirty = true;
    r2.resize(1);
    const st = { rot: rotation(0.6 + S.t * (reduceMotion ? 0.015 : 0.07), 0.11), ...view(S.outer, 1600 / 1700, 1, { base: 0.17, v0: 1.15, v1: 1.45 }),
      outer: S.outer, reveal: 1, pulse: 0, newS: 0, dim: 0, flash: 0 };
    // average a few passes (each pass samples the layers at slightly different points)
    const passes = 8;
    for (let i = 0; i < passes; i++) {
      r2.draw({ ...st, time: S.t + i * 0.731 });
      g.globalAlpha = 1 / (i + 1);
      g.drawImage(off, 0, 0);
      await new Promise((res) => setTimeout(res, 0));
    }
    g.globalAlpha = 1;
    const loseCtx = r2.gl.getExtension('WEBGL_lose_context');
    if (loseCtx) loseCtx.loseContext();
    // text
    const ff = '"Shippori Mincho", "Hiragino Mincho ProN", "Yu Mincho", serif';
    g.fillStyle = 'rgba(236, 232, 222, 0.94)';
    g.textAlign = 'left';
    g.font = `500 54px ${ff}`;
    g.fillText(T.imageCaption, 110, 1810);
    g.font = `400 30px ${ff}`;
    g.fillStyle = 'rgba(236, 232, 222, 0.72)';
    g.fillText($('#stats').textContent, 110, 1866);
    const d = new Date();
    const stamp = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    g.fillText(`${TEXT.ja.title}　/　${TEXT.en.title}　${stamp}`, 110, 1916);
    const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `phantom-quartz-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } catch (e) {
    console.error(e);
  } finally {
    btn.textContent = label;
    btn.disabled = false;
  }
}

function openAbout() { $('#about').hidden = false; $('#about-close').focus(); }
function closeAbout() { $('#about').hidden = true; }

// ---------- boot ----------
function boot() {
  applyStatic();
  try {
    renderer = new Renderer($('#gl'));
  } catch (e) {
    console.warn(e);
    document.body.classList.add('nogl');
  }
  S.scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.8;
  $('#start-ja').addEventListener('click', () => begin($('#start-ja').dataset.lang));
  $('#start-other').addEventListener('click', () => begin($('#start-other').dataset.lang));
  $('#again').addEventListener('click', () => { sound.fadeOut(0.6); begin(lang); });
  $('#save').addEventListener('click', saveImage);
  for (const b of document.querySelectorAll('.about-open')) b.addEventListener('click', openAbout);
  $('#about-close').addEventListener('click', closeAbout);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAbout(); });
  document.addEventListener('visibilitychange', () => {
    if (!sound.ctx) return;
    if (document.hidden) sound.ctx.suspend(); else sound.ctx.resume();
  });
  requestAnimationFrame(frame);
  // preview helper (not used by the work itself): grow the layers that would exist at time t
  const jump = (t) => {
    renderer.reset();
    S.layers = [];
    const n = Math.max(0, Math.floor(t - GROWTH_START));
    for (let k = 0; k < n; k++) {
      S.outer = growthOuter(GROWTH_START + k);
      const P = 1000 / 60;
      meter.period = P;
      meter.bucket = Array.from({ length: 60 }, (_, i) => P + (Math.random() - 0.5) * (0.1 + (k % 17 === 5 ? 3 : 0.4)) + (k % 29 === 11 && i === 30 ? P : 0));
      addLayer();
    }
    S.t = t;
    S.outer = growthOuter(t);
    S.lineIdx = T.lines.filter((l) => l.at <= t).length;
    S.divIdx = DIVIDER.filter((_, i) => DIVIDER_START + i * DIVIDER_STEP <= t).length;
    S.growthAt = t >= GROWTH_START ? GROWTH_START : null;
    S.pending = [];
    S.nextTickAudio = sound.on ? sound.now + 1 : null;
    S.nextTickScene = t + 1;
  };
  window.__quartz = { jump, S, meter, get renderer() { return renderer; }, begin, end, step, addLayer, TEXT };
}

boot();

// All sound is synthesized here with Web Audio.
export class Sound {
  constructor() { this.ctx = null; this.on = false; }

  start() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      this.ctx = new AC();
    } catch { return false; }
    const c = this.ctx;
    if (c.resume) c.resume();
    this.master = c.createGain();
    this.master.gain.value = 0;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
    this.bus = c.createGain();
    const dry = c.createGain(); dry.gain.value = 0.85;
    const rev = c.createConvolver(); rev.buffer = this.impulse(3.4, 2.6);
    const wet = c.createGain(); wet.gain.value = 0.32;
    this.bus.connect(dry); this.bus.connect(rev); rev.connect(wet);
    dry.connect(this.master); wet.connect(this.master);
    this.master.connect(comp); comp.connect(c.destination);
    this.master.gain.setTargetAtTime(0.9, c.currentTime, 0.4);
    this.on = true;
    return true;
  }

  get now() { return this.ctx ? this.ctx.currentTime : 0; }

  impulse(sec, decay) {
    const c = this.ctx;
    const len = Math.floor(c.sampleRate * sec);
    const b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }

  osc(freq, t0, t1, gain, attack = 0.08, release = 0.35, type = 'sine') {
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.setValueAtTime(gain, Math.max(t0 + attack, t1 - release));
    g.gain.linearRampToValueAtTime(0, t1);
    o.connect(g); g.connect(this.bus);
    o.start(t0); o.stop(t1 + 0.05);
    return { o, g };
  }

  click(t, gain, freq = 1024) {
    const c = this.ctx;
    const o = c.createOscillator();
    o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g); g.connect(this.bus);
    o.start(t); o.stop(t + 0.09);
  }

  // One step of the divider chain: a pure tone while audible, a pulse train below 20 Hz.
  dividerStep(freq, t0, dur) {
    if (!this.on) return;
    if (freq > 20000) return;               // 32,768 Hz: beyond hearing
    if (freq >= 20) {
      const g = freq >= 16000 ? 0.012 : freq >= 8000 ? 0.025 : freq >= 4000 ? 0.04 : freq >= 2000 ? 0.06 : freq >= 512 ? 0.085 : freq >= 128 ? 0.12 : 0.3;
      this.osc(freq, t0, t0 + dur + 0.25, g, 0.06, 0.4);
      if (freq <= 64) this.osc(freq * 2, t0, t0 + dur + 0.25, 0.05, 0.06, 0.4);   // so small speakers still hint at it
      return;
    }
    const n = Math.max(1, Math.round(dur * freq));
    for (let i = 0; i < n; i++) this.click(t0 + i / freq, freq >= 8 ? 0.12 : 0.2, 1024);
  }

  // The 1 Hz pulse: a small bright "ting" (C notes), slightly shaped by the measured wobble.
  ting(t, amp, bright) {
    if (!this.on) return;
    const parts = [[2048, 1], [4096, 0.32], [6144, 0.1 * (1 + bright)]];
    for (const [f, a] of parts) {
      const c = this.ctx;
      const o = c.createOscillator();
      o.frequency.value = f;
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp * a, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.connect(g); g.connect(this.bus);
      o.start(t); o.stop(t + 1.5);
    }
  }

  // A low bed of C notes (128 / 256 Hz).
  drone(t) {
    if (!this.on || this.droneNodes) return;
    const c = this.ctx;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 6);
    g.connect(this.bus);
    const a = c.createOscillator(); a.frequency.value = 128;
    const b = c.createOscillator(); b.frequency.value = 256;
    const bg = c.createGain(); bg.gain.value = 0.45;
    a.connect(g); b.connect(bg); bg.connect(g);
    a.start(t); b.start(t);
    this.droneNodes = { g, a, b };
  }

  // A second 256 Hz tone detuned by `hz`: you hear the difference as a beat.
  beat(t, hz) {
    if (!this.on) return;
    const c = this.ctx;
    if (!this.beatNodes) {
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.06, t + 3);
      g.connect(this.bus);
      const a = c.createOscillator(); a.frequency.value = 256;
      const b = c.createOscillator(); b.frequency.value = 256 + hz;
      a.connect(g); b.connect(g);
      a.start(t); b.start(t);
      this.beatNodes = { g, a, b };
    } else {
      this.beatNodes.b.frequency.setTargetAtTime(256 + hz, t, 0.5);
    }
  }

  fadeOut(sec = 1.2) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0, t, sec / 4);
    const ctx = this.ctx;
    setTimeout(() => { try { ctx.close(); } catch { /* ignore */ } }, sec * 1000 + 300);
    this.ctx = null; this.on = false; this.droneNodes = null; this.beatNodes = null;
  }
}

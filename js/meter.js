// Times the screen redraws (requestAnimationFrame timestamps).
const NOMINALS = [24, 25, 30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 180, 240, 360];

export class Meter {
  constructor() { this.reset(); }

  reset() {
    this.last = null;
    this.intervals = [];   // recent intervals (ms)
    this.stamps = [];      // recent timestamps for the rate estimate
    this.bucket = [];      // intervals since the last takeSecond()
    this.period = 1000 / 60;
    this.rate = null;
    this.nominal = null;
    this.ppm = null;
    this.maxDevAll = 0;
    this.ok = false;
  }

  frame(ts) {
    if (this.last !== null) {
      const dt = ts - this.last;
      if (dt > 0 && dt < 250) {
        this.intervals.push(dt);
        if (this.intervals.length > 600) this.intervals.shift();
        this.bucket.push(dt);
        this.stamps.push(ts);
        if (this.stamps.length > 1800) this.stamps.shift();
      } else {
        // a long gap (tab hidden, debugger, ...): start the rate estimate again
        this.stamps = [];
      }
    }
    this.last = ts;
  }

  // Robust period: median interval, then a least-squares fit of timestamps against frame numbers.
  estimate() {
    const iv = this.intervals;
    if (iv.length < 30) return;
    const sorted = [...iv].sort((a, b) => a - b);
    const med = sorted[sorted.length >> 1];
    const T = this.stamps;
    if (T.length < 30) { this.period = med; return; }
    const t0 = T[0];
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0, prev = -1;
    for (const t of T) {
      const k = Math.round((t - t0) / med);
      if (k === prev) continue;
      prev = k;
      const y = t - t0;
      n++; sx += k; sy += y; sxx += k * k; sxy += k * y;
    }
    const den = n * sxx - sx * sx;
    const p = den > 0 ? (n * sxy - sx * sy) / den : med;
    this.period = p > 0 ? p : med;
    this.rate = 1000 / this.period;
    let best = NOMINALS[0];
    for (const v of NOMINALS) if (Math.abs(v - this.rate) < Math.abs(best - this.rate)) best = v;
    this.nominal = best;
    this.ppm = (this.rate / best - 1) * 1e6;
    // trust the estimate only when the rate is close to a usual display rate
    this.ok = Math.abs(this.rate - best) / best < 0.02 && T.length > 120;
  }

  // Statistics for the frames since the last call.
  takeSecond() {
    const b = this.bucket;
    this.bucket = [];
    if (!b.length) return { n: 0, mean: this.period, std: 0, maxDev: 0, drops: 0, signed: 0 };
    const P = this.period;
    let sum = 0, sq = 0, maxDev = 0, drops = 0, signed = 0;
    for (const dt of b) {
      const frames = Math.max(1, Math.round(dt / P));
      if (frames > 1) drops += frames - 1;
      const d = dt - frames * P;
      sum += dt; sq += d * d; signed += d;
      maxDev = Math.max(maxDev, Math.abs(d));
    }
    this.maxDevAll = Math.max(this.maxDevAll, maxDev);
    return { n: b.length, mean: sum / b.length, std: Math.sqrt(sq / b.length), maxDev, drops, signed };
  }
}

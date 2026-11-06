// WebGL2 renderer: a quartz crystal (hexagonal prism + rhombohedral tip) drawn analytically,
// with refraction, dispersion and "phantom" growth layers read from a cumulative density texture.

const VS = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2 uRes;
uniform float uTime;
uniform mat3 uRot;        // object -> world rotation
uniform vec3 uSeed;       // world position of the seed (centre of the base)
uniform vec3 uCam;        // camera position
uniform vec3 uTarget;
uniform float uFocal;
uniform float uOuter;     // current size of the crystal (gauge scale)
uniform float uReveal;
uniform float uPulse;     // glow of the newest layer
uniform float uNewS;      // gauge scale of the newest layer
uniform float uDim;
uniform float uFlash;     // brief brightening of the whole crystal (divider steps)
uniform vec4 uPl[13];     // planes: xyz normal, w distance at scale 1 (12 = base)
uniform sampler2D uCum;   // cumulative phantom density, x: gauge 0..1, y: azimuth
uniform float uNS;
uniform float uNA;

float hash(vec2 p) { p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }

// --- environment (directions are in world space) ---
float ridge(float az) {
  // a far mountain line; the sharp bump a little left of the crystal is Gojo-iwa on Mount Kinpu
  float e = 0.020 + 0.014 * sin(az * 3.0 + 1.3) + 0.010 * sin(az * 7.0 + 0.4) + 0.005 * sin(az * 17.0 + 2.1);
  float d = az + 1.5708 + 0.16;
  e += 0.046 * exp(-d * d / 0.06);                        // the peak
  e += 0.011 * smoothstep(0.020, 0.0, abs(d - 0.010));    // the rock on the summit
  return e;
}
float stars(vec3 d) {
  vec2 a = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0))) * 260.0;
  vec2 cell = floor(a);
  float h = hash(cell + 7.13);
  if (h > 0.035) return 0.0;
  vec2 c = cell + 0.5 + (vec2(hash(cell + 1.7), hash(cell + 3.1)) - 0.5) * 0.6;
  float r = length(a - c);
  return smoothstep(0.55, 0.0, r) * (0.3 + 0.7 * fract(h * 97.0));
}
// the night sky and the mountains, as seen directly
vec3 sky(vec3 d) {
  float y = d.y;
  float az = atan(d.z, d.x);
  float da = az + 1.5708;                       // 0: straight behind the crystal
  float glow = exp(-da * da / 0.30);            // the sky getting lighter behind the mountains
  vec3 zen = vec3(0.0010, 0.0014, 0.0031);
  vec3 hor = vec3(0.0040, 0.0049, 0.0090) + vec3(0.0055, 0.0034, 0.0017) * glow;
  vec3 s = mix(hor, zen, smoothstep(0.0, 0.40, y));
  s += vec3(0.0125, 0.0060, 0.0020) * glow * exp(-max(y, 0.0) * 34.0);
  s += vec3(0.010, 0.011, 0.014) * stars(d) * smoothstep(0.06, 0.25, y);
  float r = ridge(az);
  float m = smoothstep(r + 0.0030, r - 0.0030, y);
  vec3 mtn = vec3(0.00070, 0.00080, 0.0012);
  mtn += vec3(0.0018, 0.0012, 0.0007) * glow * smoothstep(r - 0.025, r, y);   // faint light along the ridge
  return mix(s, mtn, m);
}
// what the crystal reflects and refracts: the same sky, brighter, plus soft studio lights
vec3 env(vec3 d) {
  vec3 col = sky(d) * 2.6;
  float az = atan(d.z, d.x);
  vec3 L1 = normalize(vec3(-0.55, 0.62, 0.56));          // key light above left, in front
  col += vec3(1.00, 0.94, 0.86) * 2.0 * smoothstep(0.962, 0.990, dot(d, L1));
  float h = smoothstep(-0.30, -0.12, d.y) * smoothstep(0.80, 0.55, d.y);
  float aL = abs(mod(az + 2.36 + 3.14159, 6.28318) - 3.14159);   // tall strip behind left
  float aR = abs(mod(az + 0.785 + 3.14159, 6.28318) - 3.14159);  // tall strip behind right
  col += vec3(0.80, 0.88, 1.00) * 0.85 * smoothstep(0.17, 0.05, aL) * h;
  col += vec3(1.00, 0.95, 0.90) * 0.55 * smoothstep(0.15, 0.045, aR) * h;
  col += vec3(0.75, 0.80, 0.90) * 0.28 * smoothstep(0.55, 0.95, d.y);   // broad light from above
  vec3 L3 = normalize(vec3(0.05, -0.2, 1.0));            // low fill from the front
  col += vec3(0.80, 0.85, 0.90) * 0.22 * smoothstep(0.80, 0.98, dot(d, L3));
  return col;
}

// --- the crystal ---
bool hitPoly(vec3 ro, vec3 rd, float sc, out float tN, out float tF, out int iN) {
  tN = -1e9; tF = 1e9; iN = 0;
  for (int i = 0; i < 13; i++) {
    vec3 n = uPl[i].xyz;
    float d = (i == 12) ? uPl[i].w : uPl[i].w * sc;
    float dn = dot(n, rd);
    float dist = d - dot(n, ro);
    if (abs(dn) < 1e-7) { if (dist < 0.0) return false; continue; }
    float t = dist / dn;
    if (dn < 0.0) { if (t > tN) { tN = t; iN = i; } }
    else { tF = min(tF, t); }
  }
  return tN <= tF && tF > 0.0 && tN > 0.0;
}
float exitPoly(vec3 p, vec3 rd, float sc, out int iF) {
  float tF = 1e9; iF = 0;
  for (int i = 0; i < 13; i++) {
    vec3 n = uPl[i].xyz;
    float dn = dot(n, rd);
    if (dn > 1e-7) {
      float d = (i == 12) ? uPl[i].w : uPl[i].w * sc;
      float t = (d - dot(n, p)) / dn;
      if (t < tF) { tF = t; iF = i; }
    }
  }
  return max(tF, 0.0);
}
float gaugeI(vec3 p, out int ia) {  // the crystal size whose surface passes through p (base plane excluded)
  float g = -1e9; ia = 0;
  for (int i = 0; i < 12; i++) { float v = dot(uPl[i].xyz, p) / uPl[i].w; if (v > g) { g = v; ia = i; } }
  return g;
}
float gauge(vec3 p) { int i; return gaugeI(p, i); }
vec3 cumRow(float s, int row) {
  float x = clamp(s, 0.0, 1.0) * (uNS - 1.0);
  int x0 = int(floor(x));
  int x1 = min(x0 + 1, int(uNS) - 1);
  float f = x - float(x0);
  return mix(texelFetch(uCum, ivec2(x0, row), 0).rgb, texelFetch(uCum, ivec2(x1, row), 0).rgb, f);
}
vec3 cum(float s, float v) {
  float y = v * uNA - 0.5;
  float yf = floor(y);
  float f = y - yf;
  int na = int(uNA);
  int r0 = (int(yf) % na + na) % na;
  int r1 = (r0 + 1) % na;
  return mix(cumRow(s, r0), cumRow(s, r1), f);
}


// Light scattered by the growth layers crossed between p0 and p1 (ray direction rd, object space).
// A thin layer seen edge-on is crossed along a long path, so it is weighted strongly by the angle
// (1/cos^4, capped): each layer shows mostly as a faint outline of the crystal it once was.
vec3 phantoms(vec3 p0, vec3 p1, vec3 rd, float jit) {
  const int M = 24;
  vec3 acc = vec3(0.0);
  vec3 pp = p0;
  float gp = gauge(p0);
  for (int j = 1; j <= M; j++) {
    float u = (float(j) - (j < M ? jit : 0.0)) / float(M);
    vec3 p = mix(p0, p1, u);
    float g = gauge(p);
    float lo = min(g, gp), hi = max(g, gp);
    if (hi - lo > 1e-6) {
      vec3 mid = 0.5 * (p + pp);
      int im; gaugeI(mid, im);
      float c = abs(dot(uPl[im].xyz, rd));
      float c2 = c * c;
      float f = 1.0 / (c2 * c2 + 0.0004);
      float v = atan(mid.z, mid.x) / 6.2831853 + 0.5;
      acc += max(cum(hi, v) - cum(lo, v), vec3(0.0)) * f;
      // the layer being laid down right now
      if (uPulse > 0.0 && uNewS > lo - 0.003 && uNewS < hi + 0.003) acc += vec3(1.0, 0.90, 0.74) * uPulse * 0.0005 * f;
    }
    pp = p; gp = g;
  }
  return acc;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 ww = normalize(uTarget - uCam);
  vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
  vec3 vv = cross(uu, ww);
  vec3 rd = normalize(uv.x * uu + uv.y * vv + uFocal * ww);

  vec3 col = sky(rd);
  float jit = hash(gl_FragCoord.xy + fract(uTime * 7.31) * 113.0);

  mat3 inv = transpose(uRot);
  vec3 oro = inv * (uCam - uSeed);
  vec3 ord = inv * rd;
  float tN, tF; int iN;
  if (uReveal > 0.001 && hitPoly(oro, ord, uOuter, tN, tF, iN)) {
    // soft edge: how far inside the silhouette this pixel is, in pixels (about)
    float cov = clamp((tF - tN) * uRes.y * uFocal / (1.4 * tN), 0.0, 1.0);
    vec3 P = oro + ord * tN;
    vec3 N = uPl[iN].xyz;
    if (iN < 6) {  // horizontal striations on the prism faces
      float s = sin(P.y * 150.0 / uOuter + sin(P.y * 21.0 / uOuter) * 2.0) * 0.6 + sin(P.y * 57.0 / uOuter + 1.7) * 0.4;
      N = normalize(N + vec3(0.0, 0.022 * s, 0.0));
    }
    float cosi = clamp(-dot(ord, N), 0.0, 1.0);
    float F = 0.045 + 0.955 * pow(1.0 - cosi, 5.0);
    vec3 refl = env(uRot * reflect(ord, N));
    vec3 iors = vec3(1.540, 1.544, 1.549);
    vec3 trans;
    vec3 ph = vec3(0.0);
    for (int c = 0; c < 3; c++) {
      float ior = iors[c];
      vec3 rdi = refract(ord, N, 1.0 / ior);
      int iE; float tE = exitPoly(P, rdi, uOuter, iE);
      vec3 PE = P + rdi * tE;
      if (c == 1) ph += phantoms(P, PE, rdi, jit);
      vec3 NE = uPl[iE].xyz;
      vec3 rdo = refract(rdi, -NE, ior);
      vec3 e;
      if (dot(rdo, rdo) < 1e-6) {
        vec3 rdi2 = reflect(rdi, -NE);
        int iE2; float tE2 = exitPoly(PE + rdi2 * 1e-4, rdi2, uOuter, iE2);
        vec3 PE2 = PE + rdi2 * tE2;
        if (c == 1) ph += 0.55 * phantoms(PE, PE2, rdi2, jit);
        vec3 NE2 = uPl[iE2].xyz;
        vec3 rdo2 = refract(rdi2, -NE2, ior);
        if (dot(rdo2, rdo2) < 1e-6) rdo2 = reflect(rdi2, -NE2);
        e = env(uRot * rdo2) * 0.8;
      } else {
        e = env(uRot * rdo);
      }
      trans[c] = e[c];
    }
    vec3 body = trans * vec3(0.92, 0.955, 0.965);
    vec3 cc = mix(body, refl, F);
    cc += ph;
    // a faint inner light so the crystal never disappears into the dark
    cc += vec3(0.004, 0.005, 0.007) * (1.0 + 6.0 * uFlash);
    cc *= 1.0 + 0.5 * uFlash;
    col = mix(col, cc, uReveal * cov);
  }
  col *= 1.0 - 0.6 * uDim;

  // vignette, tone mapping, grain
  float vig = smoothstep(1.25, 0.25, length(uv * vec2(0.85, 1.0)));
  col *= mix(0.55, 1.0, vig);
  col = vec3(1.0) - exp(-col * 1.45);
  col = pow(col, vec3(1.0 / 2.2));
  col += (jit - 0.5) * 0.012;
  outColor = vec4(col, 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader error');
  return s;
}

// Crystal planes in seed coordinates (seed = centre of the base), scale 1.
function makePlanes() {
  const r = 0.36, h = 1.2, a = 38.2 * Math.PI / 180;
  const ca = Math.cos(a), sa = Math.sin(a);
  const out = [];
  for (let i = 0; i < 6; i++) {
    const th = i * Math.PI / 3;
    out.push([Math.cos(th), 0, Math.sin(th), r]);
  }
  for (let i = 0; i < 6; i++) {
    const th = i * Math.PI / 3;
    const m = [Math.cos(th), 0, Math.sin(th)];
    const n = [m[0] * ca, sa, m[2] * ca];
    out.push([n[0], n[1], n[2], n[0] * m[0] * r + n[1] * h + n[2] * m[2] * r]);
  }
  const b = [0.06, -1, 0.04];
  const bl = Math.hypot(...b);
  out.push([b[0] / bl, b[1] / bl, b[2] / bl, 0.015]);
  return out;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    if (!gl) throw new Error('webgl2');
    this.gl = gl;
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link error');
    this.prog = prog;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
    for (const n of ['uRes', 'uTime', 'uRot', 'uSeed', 'uCam', 'uTarget', 'uFocal', 'uOuter', 'uReveal', 'uPulse', 'uNewS', 'uDim', 'uFlash', 'uPl', 'uCum', 'uNS', 'uNA']) this.u[n] = gl.getUniformLocation(prog, n);
    gl.uniform4fv(this.u.uPl, new Float32Array(makePlanes().flat()));
    // cumulative phantom texture
    this.NS = 1024; this.NA = 32;
    this.cum = new Float32Array(this.NS * this.NA * 4);
    this.tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.NS, this.NA, 0, gl.RGBA, gl.FLOAT, this.cum);
    gl.uniform1i(this.u.uCum, 0);
    gl.uniform1f(this.u.uNS, this.NS);
    gl.uniform1f(this.u.uNA, this.NA);
    this.dirty = false;
    this.scale = 1;
  }

  reset() {
    this.cum.fill(0);
    this.dirty = true;
  }

  // Add one growth layer. s: crystal size when the layer formed (0..1).
  addLayer({ s, width, alpha, color, tilt, tiltAz }) {
    const { NS, NA, cum } = this;
    for (let a = 0; a < NA; a++) {
      const phi = ((a + 0.5) / NA - 0.5) * 2 * Math.PI;   // matches atan(z, x) in the shader
      const sa = s * (1 + tilt * Math.cos(phi - tiltAz));
      const i0 = Math.max(0, Math.floor((sa - 4 * width) * (NS - 1)));
      const row = a * NS * 4;
      for (let i = i0; i < NS; i++) {
        const x = (i / (NS - 1) - sa) / width;
        const c = x > 4 ? 1 : 1 / (1 + Math.exp(-1.702 * x));   // smooth step (normal CDF approximation)
        const o = row + i * 4;
        cum[o] += alpha * color[0] * c;
        cum[o + 1] += alpha * color[1] * c;
        cum[o + 2] += alpha * color[2] * c;
      }
    }
    this.dirty = true;
  }

  resize(scale) {
    const c = this.canvas;
    this.scale = scale;
    const w = Math.max(2, Math.round(c.clientWidth * scale));
    const h = Math.max(2, Math.round(c.clientHeight * scale));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  }

  draw(st) {
    const gl = this.gl, u = this.u;
    if (this.dirty) {
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.NS, this.NA, gl.RGBA, gl.FLOAT, this.cum);
      this.dirty = false;
    }
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, st.time);
    gl.uniformMatrix3fv(u.uRot, false, st.rot);
    gl.uniform3fv(u.uSeed, st.seed);
    gl.uniform3fv(u.uCam, st.cam);
    gl.uniform3fv(u.uTarget, st.target);
    gl.uniform1f(u.uFocal, st.focal);
    gl.uniform1f(u.uOuter, st.outer);
    gl.uniform1f(u.uReveal, st.reveal);
    gl.uniform1f(u.uPulse, st.pulse);
    gl.uniform1f(u.uNewS, st.newS);
    gl.uniform1f(u.uDim, st.dim);
    gl.uniform1f(u.uFlash, st.flash);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

// Column-major 3x3 rotation: Y rotation by a, then a small tilt around Z.
export function rotation(a, tilt) {
  const ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(tilt), sTilt = Math.sin(tilt);
  // Rz(tilt) * Ry(a)
  const ry = [ca, 0, -sa, 0, 1, 0, sa, 0, ca];          // column-major
  const rz = [ct, sTilt, 0, -sTilt, ct, 0, 0, 0, 1];
  const m = new Float32Array(9);
  for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) {
    let v = 0;
    for (let k = 0; k < 3; k++) v += rz[k * 3 + r] * ry[c * 3 + k];
    m[c * 3 + r] = v;
  }
  return m;
}

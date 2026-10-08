'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { currentWibHour } from '@/lib/day-clock';
import { skyAt } from '@/lib/sky';

// Langit realistis yang digambar GPU (WebGL): awan dari noise berlapis yang bergerak dan berubah
// bentuk, matahari dengan sinar, bulan sabit, bintang berkelip. Warnanya mengikuti jam WIB (lib/sky.ts).
// Tanpa WebGL, gradasi CSS di belakang kanvas (.sky-fallback) tetap tampil.

const VERTEX_SHADER = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uCloudLit;
uniform vec3 uCloudShade;
uniform vec3 uLight;
uniform vec2 uSun;
uniform vec2 uMoon;
uniform vec2 uLightPos;
uniform float uSunAmount;
uniform float uMoonAmount;
uniform float uStars;
uniform float uCover;
uniform float uRays;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

const mat2 OCTAVE = mat2(1.6, 1.2, -1.2, 1.6);

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = OCTAVE * p;
    amplitude *= 0.5;
  }
  return value;
}

float coverage(float field) {
  float threshold = mix(0.62, 0.36, uCover);
  return smoothstep(threshold, threshold + 0.2, field);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 scale = vec2(aspect, 1.0);

  // Gradasi langit: horizon di bawah, zenit di atas.
  vec3 sky = mix(uHorizon, uTop, smoothstep(0.0, 1.0, pow(uv.y, 0.85)));

  // Matahari: pendar lebar, inti terang, sinar tipis yang berputar sangat pelan.
  vec2 toSun = (uv - uSun) * scale;
  float sunDist = length(toSun);
  float angle = atan(toSun.y, toSun.x);
  float rays = pow(0.5 + 0.5 * sin(angle * 9.0 + uTime * 0.05), 6.0) * 0.6
             + pow(0.5 + 0.5 * sin(angle * 15.0 - uTime * 0.035), 8.0) * 0.4;
  float glow = exp(-sunDist * 5.0) * 0.32 + exp(-sunDist * 20.0) * 0.5;
  sky += uLight * uSunAmount * (glow + rays * exp(-sunDist * 3.2) * uRays * 0.7);
  sky = mix(sky, vec3(1.0, 0.98, 0.93), smoothstep(0.045, 0.035, sunDist) * uSunAmount);

  // Bintang: titik acak per sel, berkelip dengan kecepatan berbeda, makin redup ke horizon.
  vec2 starGrid = uv * scale * 26.0;
  vec2 cell = floor(starGrid);
  vec2 local = fract(starGrid) - 0.5;
  float seed = hash(cell);
  vec2 jitter = (vec2(hash(cell + 7.1), hash(cell + 3.3)) - 0.5) * 0.7;
  vec2 fromStar = local - jitter;
  float sharpness = seed > 0.97 ? 110.0 : 260.0;
  float twinkle = 0.55 + 0.45 * sin(uTime * (1.2 + seed * 2.5) + seed * 60.0);
  float star = step(0.82, seed) * exp(-dot(fromStar, fromStar) * sharpness) * twinkle;
  sky += vec3(0.95, 0.97, 1.0) * star * uStars * smoothstep(0.15, 0.6, uv.y) * 1.4;

  // Bulan sabit dengan halo kebiruan.
  vec2 toMoon = (uv - uMoon) * scale;
  float moonDist = length(toMoon);
  float disc = smoothstep(0.05, 0.044, moonDist);
  float bite = smoothstep(0.047, 0.041, length(toMoon - vec2(0.021, 0.013)));
  sky += vec3(0.62, 0.7, 1.0) * exp(-moonDist * 7.0) * 0.32 * uMoonAmount;
  sky = mix(sky, vec3(0.98, 0.96, 0.88), clamp(disc - bite, 0.0, 1.0) * uMoonAmount);

  // Awan: perspektif lembut (makin rapat ke horizon), dibengkokkan noise lain agar bentuknya
  // berserat seperti awan sungguhan, dan terus bergeser ditiup angin.
  float depth = 1.0 / (uv.y * 0.85 + 0.38);
  vec2 p = vec2((uv.x - 0.5) * aspect * depth * 1.05, depth * 1.7);
  float t = uTime;
  vec2 warp = vec2(
    fbm(p * 0.7 + vec2(t * 0.012, 0.0)),
    fbm(p * 0.7 + vec2(3.7, 1.9) - vec2(0.0, t * 0.009))
  );
  vec2 q = p * 1.5 + warp * 1.5 + vec2(t * 0.03, 0.0);
  float field = fbm(q);
  float density = coverage(field);

  // Pencahayaan: bandingkan kepadatan sedikit ke arah sumber cahaya. Sisi yang menghadap
  // cahaya terang, sisi yang tertutup awan lain jadi bayangan.
  vec2 lightDir = normalize((uLightPos - uv) * scale + 1e-4);
  float towardLight = fbm(q + lightDir * 0.22);
  float lit = clamp(0.62 + (field - towardLight) * 3.2, 0.0, 1.0);
  vec3 cloud = mix(uCloudShade, uCloudLit, lit);

  // Tepi awan yang tipis di dekat matahari bersinar (silver lining).
  float edge = density * (1.0 - density) * 4.0;
  cloud += uLight * edge * exp(-sunDist * 3.0) * 0.55 * uSunAmount;

  vec3 color = mix(sky, cloud, density * 0.94);
  // Cahaya matahari tetap menembus awan tipis.
  color += uLight * uSunAmount * exp(-sunDist * 6.0) * 0.15 * (1.0 - density * 0.5);
  // Kabut tipis di dekat horizon memberi kesan jauh.
  color = mix(color, uHorizon, smoothstep(0.32, 0.0, uv.y) * 0.3);
  // Dither halus agar gradasi tidak bergaris di layar HP.
  color += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0 * 1.5;

  gl_FragColor = vec4(color, 1.0);
}
`;

/** Resolusi kanvas relatif terhadap piksel CSS: awan memang lembut, jadi setengah resolusi cukup. */
const RENDER_SCALE = 0.5;
const FRAME_INTERVAL_MS = 1000 / 30;
/** Saat animasi dikurangi: gambar ulang sesekali agar warna tetap mengikuti jam. */
const STATIC_REDRAW_MS = 60_000;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== 'production') console.warn('[sky]', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

/** `paused`: berhenti menggambar, mis. saat header sudah tertutup penuh oleh konten. */
export function SkyCanvas({ className, paused = false }: { className?: string; paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    });
    if (!gl) return;
    const program = createProgram(gl);
    if (!program) return;

    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // Satu segitiga besar yang menutupi seluruh kanvas.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const u = {
      resolution: uniform('uResolution'),
      time: uniform('uTime'),
      top: uniform('uTop'),
      horizon: uniform('uHorizon'),
      cloudLit: uniform('uCloudLit'),
      cloudShade: uniform('uCloudShade'),
      light: uniform('uLight'),
      sun: uniform('uSun'),
      moon: uniform('uMoon'),
      lightPos: uniform('uLightPos'),
      sunAmount: uniform('uSunAmount'),
      moonAmount: uniform('uMoonAmount'),
      stars: uniform('uStars'),
      cover: uniform('uCover'),
      rays: uniform('uRays'),
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Awan sudah bergeser sedikit sejak awal agar tiap kunjungan langitnya tidak identik.
    const timeOffset = Math.random() * 400;
    const start = performance.now();
    let frame = 0;
    let lastDraw = 0;
    let visible = true;
    let lost = false;
    let shown = false;

    const draw = (now: number) => {
      if (lost) return;
      const sky = skyAt(currentWibHour());
      gl.uniform2f(u.resolution, canvas.width, canvas.height);
      // Dibatasi agar presisi float di GPU HP tetap cukup walau halaman terbuka lama.
      gl.uniform1f(u.time, (timeOffset + (now - start) / 1000) % 3600);
      gl.uniform3f(u.top, ...sky.top);
      gl.uniform3f(u.horizon, ...sky.horizon);
      gl.uniform3f(u.cloudLit, ...sky.cloudLit);
      gl.uniform3f(u.cloudShade, ...sky.cloudShade);
      gl.uniform3f(u.light, ...sky.light);
      gl.uniform2f(u.sun, ...sky.sun);
      gl.uniform2f(u.moon, ...sky.moon);
      gl.uniform2f(u.lightPos, ...sky.lightPos);
      gl.uniform1f(u.sunAmount, sky.sunAmount);
      gl.uniform1f(u.moonAmount, sky.moonAmount);
      gl.uniform1f(u.stars, sky.stars);
      gl.uniform1f(u.cover, sky.cover);
      gl.uniform1f(u.rays, sky.rays);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!shown) {
        shown = true;
        setReady(true);
      }
    };

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2) * RENDER_SCALE;
      const width = Math.max(1, Math.round(canvas.clientWidth * pixelRatio));
      const height = Math.max(1, Math.round(canvas.clientHeight * pixelRatio));
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      draw(performance.now());
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (pausedRef.current || !visible || document.hidden) return;
      if (now - lastDraw < FRAME_INTERVAL_MS) return;
      lastDraw = now;
      draw(now);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    // Berhenti menggambar saat header sudah di-scroll keluar layar (hemat baterai).
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    intersectionObserver.observe(canvas);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      shown = false;
      setReady(false);
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    resize();
    draw(performance.now());
    let staticTimer: ReturnType<typeof setInterval> | undefined;
    if (reduceMotion) {
      staticTimer = setInterval(() => draw(performance.now()), STATIC_REDRAW_MS);
    } else {
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      clearInterval(staticTimer);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      if (!lost) {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        'transition-opacity duration-700',
        ready ? 'opacity-100' : 'opacity-0',
        className,
      )}
    />
  );
}

'use client'

import { useEffect, useRef } from 'react'

// ─── GLSL Shaders ─────────────────────────────────────────────────────────────
// Domain-warped FBM (Fractional Brownian Motion) — creates organic dark smoke
// with subtle purple highlights. Technique from Inigo Quilez.

const VERT = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const FRAG = `
  precision highp float;
  uniform float u_time;
  uniform vec2  u_resolution;

  // Value noise hash
  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 74.27);
    return fract(p.x * p.y);
  }

  // Smooth value noise
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),               hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // FBM — 6 octaves with rotation to avoid axis alignment
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.52;
    mat2 rot = mat2( 0.80,  0.60, -0.60,  0.80); // ~36 deg
    for (int i = 0; i < 6; i++) {
      v += a * vnoise(p);
      p  = rot * p * 2.1 + vec2(3.18, 1.57);
      a *= 0.48;
    }
    return v;
  }

  // Domain warp — applies FBM on top of FBM for organic "smoke" look
  float warpedFbm(vec2 p, float t) {
    vec2 q = vec2(
      fbm(p + vec2(0.0, 0.0) + t * 0.14),
      fbm(p + vec2(5.2, 1.3) + t * 0.11)
    );
    vec2 r = vec2(
      fbm(p + 1.0 * q + vec2(1.7, 9.2) + t * 0.06),
      fbm(p + 1.0 * q + vec2(8.3, 2.8) + t * 0.05)
    );
    return fbm(p + 1.0 * r);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;

    float t = u_time * 0.18;

    float f = warpedFbm(uv * 2.2, t);

    // ShipReady palette: deep dark → muted purple → accent purple
    vec3 dark    = vec3(0.055, 0.055, 0.060);   // #0E0E0F
    vec3 midPurp = vec3(0.14,  0.11,  0.24);    // muted deep purple
    vec3 accent  = vec3(0.43,  0.34,  0.81);    // #6E56CF

    vec3 col = dark;
    col = mix(col, midPurp, smoothstep(0.2, 0.6, f));
    col = mix(col, accent,  smoothstep(0.5, 0.85, f) * 0.35);

    // Radial vignette — bright center, dark edges
    vec2 centered = (gl_FragCoord.xy / u_resolution.xy) - 0.5;
    float vig = 1.0 - dot(centered * 1.4, centered * 1.4);
    vig = clamp(vig, 0.0, 1.0);
    vig = pow(vig, 0.7);

    // Top fade (hero ends mid-page)
    float topFade = smoothstep(0.0, 0.2, uv.y / aspect + 0.0);

    col *= vig * 0.75;
    col *= topFade;

    gl_FragColor = vec4(col, 1.0);
  }
`

// ─── WebGL bootstrap ──────────────────────────────────────────────────────────

function initGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
  if (!gl) return null

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    return s
  }

  const prog = gl.createProgram()!
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  gl.useProgram(prog)

  // Full-screen quad
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)

  const loc = gl.getAttribLocation(prog, 'a_position')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const uTime = gl.getUniformLocation(prog, 'u_time')
  const uRes  = gl.getUniformLocation(prog, 'u_resolution')

  return { gl, uTime, uRes }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HeroNoise({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = initGL(canvas)
    if (!ctx) return

    const { gl, uTime, uRes } = ctx
    let rafId: number
    const start = performance.now()

    const resize = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      canvas.width  = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
      gl.uniform2f(uRes, w, h)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const tick = () => {
      gl.uniform1f(uTime, (performance.now() - start) / 1000)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      rafId = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
    />
  )
}

"use client";

import { useEffect, useRef } from "react";

// SoftAurora — native WebGL port of the React Bits SoftAurora effect.
// Fragment shader is identical to the OGL original; the only thing
// that's different is we hand-roll the WebGL setup (compile, link,
// uniforms, mesh) instead of pulling in OGL as a dependency.
//
// The shader layers two 3-octave Perlin-noise "bands" with cosine
// gradients on top, multiplies each layer by uColor1 / uColor2, and
// modulates them with mouse-driven UV shift. Output is premultiplied
// against alpha so it composites cleanly over the page background.

export interface SoftAuroraProps {
  speed?: number;
  scale?: number;
  brightness?: number;
  color1?: string;
  color2?: string;
  noiseFrequency?: number;
  noiseAmplitude?: number;
  bandHeight?: number;
  bandSpread?: number;
  octaveDecay?: number;
  layerOffset?: number;
  colorSpeed?: number;
  enableMouseInteraction?: boolean;
  mouseInfluence?: number;
  className?: string;
}

// `uv` is declared in the original vertex shader but never consumed by
// the fragment (it reads gl_FragCoord directly), so we drop it.
const VERT = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Verbatim from the React Bits SoftAurora source.
const FRAG = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform float uBandHeight;
uniform float uBandSpread;
uniform float uOctaveDecay;
uniform float uLayerOffset;
uniform float uColorSpeed;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

#define TAU 6.28318

vec3 gradientHash(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 234.6)),
    dot(p, vec3(269.5, 183.3, 198.3)),
    dot(p, vec3(169.5, 283.3, 156.9))
  );
  vec3 h = fract(sin(p) * 43758.5453123);
  float phi = acos(2.0 * h.x - 1.0);
  float theta = TAU * h.y;
  return vec3(cos(theta) * sin(phi), sin(theta) * cos(phi), cos(phi));
}

float quinticSmooth(float t) {
  float t2 = t * t;
  float t3 = t * t2;
  return 6.0 * t3 * t2 - 15.0 * t2 * t2 + 10.0 * t3;
}

vec3 cosineGradient(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(TAU * (c * t + d));
}

float perlin3D(float amplitude, float frequency, float px, float py, float pz) {
  float x = px * frequency;
  float y = py * frequency;

  float fx = floor(x); float fy = floor(y); float fz = floor(pz);
  float cx = ceil(x);  float cy = ceil(y);  float cz = ceil(pz);

  vec3 g000 = gradientHash(vec3(fx, fy, fz));
  vec3 g100 = gradientHash(vec3(cx, fy, fz));
  vec3 g010 = gradientHash(vec3(fx, cy, fz));
  vec3 g110 = gradientHash(vec3(cx, cy, fz));
  vec3 g001 = gradientHash(vec3(fx, fy, cz));
  vec3 g101 = gradientHash(vec3(cx, fy, cz));
  vec3 g011 = gradientHash(vec3(fx, cy, cz));
  vec3 g111 = gradientHash(vec3(cx, cy, cz));

  float d000 = dot(g000, vec3(x - fx, y - fy, pz - fz));
  float d100 = dot(g100, vec3(x - cx, y - fy, pz - fz));
  float d010 = dot(g010, vec3(x - fx, y - cy, pz - fz));
  float d110 = dot(g110, vec3(x - cx, y - cy, pz - fz));
  float d001 = dot(g001, vec3(x - fx, y - fy, pz - cz));
  float d101 = dot(g101, vec3(x - cx, y - fy, pz - cz));
  float d011 = dot(g011, vec3(x - fx, y - cy, pz - cz));
  float d111 = dot(g111, vec3(x - cx, y - cy, pz - cz));

  float sx = quinticSmooth(x - fx);
  float sy = quinticSmooth(y - fy);
  float sz = quinticSmooth(pz - fz);

  float lx00 = mix(d000, d100, sx);
  float lx10 = mix(d010, d110, sx);
  float lx01 = mix(d001, d101, sx);
  float lx11 = mix(d011, d111, sx);

  float ly0 = mix(lx00, lx10, sy);
  float ly1 = mix(lx01, lx11, sy);

  return amplitude * mix(ly0, ly1, sz);
}

float auroraGlow(float t, vec2 shift) {
  vec2 uv = gl_FragCoord.xy / uResolution.y;
  uv += shift;

  float noiseVal = 0.0;
  float freq = uNoiseFreq;
  float amp = uNoiseAmp;
  vec2 samplePos = uv * uScale;

  for (float i = 0.0; i < 3.0; i += 1.0) {
    noiseVal += perlin3D(amp, freq, samplePos.x, samplePos.y, t);
    amp *= uOctaveDecay;
    freq *= 2.0;
  }

  float yBand = uv.y * 10.0 - uBandHeight * 10.0;
  return 0.3 * max(exp(uBandSpread * (1.0 - 1.1 * abs(noiseVal + yBand))), 0.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float t = uSpeed * 0.4 * uTime;

  vec2 shift = vec2(0.0);
  if (uEnableMouse) {
    shift = (uMouse - 0.5) * uMouseInfluence;
  }

  vec3 col = vec3(0.0);
  col += 0.99 * auroraGlow(t, shift) * cosineGradient(uv.x + uTime * uSpeed * 0.2 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.20, 0.20)) * uColor1;
  col += 0.99 * auroraGlow(t + uLayerOffset, shift) * cosineGradient(uv.x + uTime * uSpeed * 0.1 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25)) * uColor2;

  col *= uBrightness;
  float alpha = clamp(length(col), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`;

function hexToVec3(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const m = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  if (!m) return [1, 1, 1];
  return [
    parseInt(m[1], 16) / 255,
    parseInt(m[2], 16) / 255,
    parseInt(m[3], 16) / 255,
  ];
}

function compile(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "SoftAurora shader compile failed:",
        gl.getShaderInfoLog(sh),
      );
    }
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export default function SoftAurora({
  speed = 0.6,
  scale = 1.5,
  brightness = 1.0,
  color1 = "#f7f7f7",
  color2 = "#e100ff",
  noiseFrequency = 2.5,
  noiseAmplitude = 1.0,
  bandHeight = 0.5,
  bandSpread = 1.0,
  octaveDecay = 0.1,
  layerOffset = 0,
  colorSpeed = 1.0,
  enableMouseInteraction = true,
  mouseInfluence = 0.25,
  className = "",
}: SoftAuroraProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.replaceChildren(canvas);

    const gl =
      canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: false,
      }) ||
      (canvas.getContext("experimental-webgl", {
        alpha: true,
        premultipliedAlpha: false,
      }) as WebGLRenderingContext | null);
    if (!gl) return;
    gl.clearColor(0, 0, 0, 0);

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "SoftAurora program link failed:",
          gl.getProgramInfoLog(prog),
        );
      }
      return;
    }

    const positionLoc = gl.getAttribLocation(prog, "position");
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const u_uTime = u("uTime");
    const u_uResolution = u("uResolution");
    const u_uSpeed = u("uSpeed");
    const u_uScale = u("uScale");
    const u_uBrightness = u("uBrightness");
    const u_uColor1 = u("uColor1");
    const u_uColor2 = u("uColor2");
    const u_uNoiseFreq = u("uNoiseFreq");
    const u_uNoiseAmp = u("uNoiseAmp");
    const u_uBandHeight = u("uBandHeight");
    const u_uBandSpread = u("uBandSpread");
    const u_uOctaveDecay = u("uOctaveDecay");
    const u_uLayerOffset = u("uLayerOffset");
    const u_uColorSpeed = u("uColorSpeed");
    const u_uMouse = u("uMouse");
    const u_uMouseInfluence = u("uMouseInfluence");
    const u_uEnableMouse = u("uEnableMouse");

    const rgb1 = hexToVec3(color1);
    const rgb2 = hexToVec3(color2);

    const targetMouse: [number, number] = [0.5, 0.5];
    const currentMouse: [number, number] = [0.5, 0.5];

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouse[0] = (e.clientX - rect.left) / rect.width;
      targetMouse[1] = 1 - (e.clientY - rect.top) / rect.height;
    };
    const onLeave = () => {
      targetMouse[0] = 0.5;
      targetMouse[1] = 0.5;
    };
    if (enableMouseInteraction) {
      canvas.addEventListener("mousemove", onMove, { passive: true });
      canvas.addEventListener("mouseleave", onLeave);
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      const wCSS = Math.max(1, Math.floor(rect.width));
      const hCSS = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(wCSS * dpr);
      canvas.height = Math.floor(hCSS * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const startTime = performance.now();
    let raf = 0;

    const render = () => {
      const now = performance.now();
      const t = (now - startTime) / 1000;

      if (enableMouseInteraction) {
        currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
        currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
      } else {
        currentMouse[0] = 0.5;
        currentMouse[1] = 0.5;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(prog);

      // Source already encodes its own brightness via uBrightness, so
      // normal source-over blending composites it cleanly over the page.
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.uniform1f(u_uTime, t);
      gl.uniform3f(
        u_uResolution,
        canvas.width,
        canvas.height,
        canvas.width / Math.max(canvas.height, 1),
      );
      gl.uniform1f(u_uSpeed, speed);
      gl.uniform1f(u_uScale, scale);
      gl.uniform1f(u_uBrightness, brightness);
      gl.uniform3f(u_uColor1, rgb1[0], rgb1[1], rgb1[2]);
      gl.uniform3f(u_uColor2, rgb2[0], rgb2[1], rgb2[2]);
      gl.uniform1f(u_uNoiseFreq, noiseFrequency);
      gl.uniform1f(u_uNoiseAmp, noiseAmplitude);
      gl.uniform1f(u_uBandHeight, bandHeight);
      gl.uniform1f(u_uBandSpread, bandSpread);
      gl.uniform1f(u_uOctaveDecay, octaveDecay);
      gl.uniform1f(u_uLayerOffset, layerOffset);
      gl.uniform1f(u_uColorSpeed, colorSpeed);
      gl.uniform2f(u_uMouse, currentMouse[0], currentMouse[1]);
      gl.uniform1f(u_uMouseInfluence, mouseInfluence);
      gl.uniform1i(u_uEnableMouse, enableMouseInteraction ? 1 : 0);

      gl.enableVertexAttribArray(positionLoc);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (enableMouseInteraction) {
        canvas.removeEventListener("mousemove", onMove);
        canvas.removeEventListener("mouseleave", onLeave);
      }
      try {
        const lose = gl.getExtension("WEBGL_lose_context");
        if (lose) lose.loseContext();
      } catch {
        // ignore
      }
      gl.deleteBuffer(buffer);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    };
  }, [
    speed,
    scale,
    brightness,
    color1,
    color2,
    noiseFrequency,
    noiseAmplitude,
    bandHeight,
    bandSpread,
    octaveDecay,
    layerOffset,
    colorSpeed,
    enableMouseInteraction,
    mouseInfluence,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    />
  );
}

"use client";

import { useEffect, useRef } from "react";

// Aurora — native WebGL port of the React Bits Aurora effect.
// Fragment shader is the same simplex-noise ribbon as the original,
// with ONE change: the y-axis is flipped (`(1.0 - uv.y) * 2.0` instead
// of `uv.y * 2.0`) so the ribbon rises from the BOTTOM of the canvas
// upward, not the top down.
//
// Hand-rolled WebGL (no OGL dependency). Premultiplied-alpha blending
// matches the OGL reference so it composites cleanly over the dark
// page background.

export interface AuroraProps {
  colorStops?: [string, string, string];
  amplitude?: number;
  blend?: number;
  speed?: number;
  className?: string;
}

// WebGL1 GLSL — converted from the React Bits `#version 300 es` source
// (in/out → attribute/varying/gl_FragColor). The shader is otherwise
// identical apart from the bottom-up flip noted below.
const VERT = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );
  vec3 m = max(
      0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)),
      0.0
  );
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \\
  int index = 0;                                              \\
  for (int i = 0; i < 2; i++) {                               \\
     ColorStop currentColor = colors[i];                      \\
     bool isInBetween = currentColor.position <= factor;      \\
     index = int(mix(float(index), float(i), float(isInBetween))); \\
  }                                                           \\
  ColorStop currentColor = colors[index];                     \\
  ColorStop nextColor = colors[index + 1];                    \\
  float range = nextColor.position - currentColor.position;   \\
  float lerpFactor = (factor - currentColor.position) / range;\\
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \\
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  // FLIPPED — original was (uv.y * 2.0 - height + 0.2) so the ribbon
  // sat near the TOP. (1.0 - uv.y) * 2.0 puts it at the BOTTOM so the
  // aurora rises into the canvas instead of hanging from above.
  height = ((1.0 - uv.y) * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;

  gl_FragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

function hexToRgb(hex: string): [number, number, number] {
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
      console.error("Aurora shader compile failed:", gl.getShaderInfoLog(sh));
    }
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export default function Aurora({
  colorStops = ["#5227FF", "#7cff67", "#5227FF"],
  amplitude = 1.0,
  blend = 0.5,
  speed = 1.0,
  className = "",
}: AuroraProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Latest props snapshot so the rAF loop reads current values without
  // having to re-init WebGL on every prop change. Updated in a
  // dedicated effect so we never touch refs during render.
  const propsRef = useRef({ colorStops, amplitude, blend, speed });
  useEffect(() => {
    propsRef.current = { colorStops, amplitude, blend, speed };
  }, [colorStops, amplitude, blend, speed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.backgroundColor = "transparent";
    container.replaceChildren(canvas);

    const gl =
      canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
      }) ||
      (canvas.getContext("experimental-webgl", {
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
      }) as WebGLRenderingContext | null);
    if (!gl) return;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    // Premultiplied source matches the (color * alpha, alpha) output
    // from the fragment shader.
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

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
        console.error("Aurora program link failed:", gl.getProgramInfoLog(prog));
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

    const u_uTime = gl.getUniformLocation(prog, "uTime");
    const u_uAmplitude = gl.getUniformLocation(prog, "uAmplitude");
    const u_uResolution = gl.getUniformLocation(prog, "uResolution");
    const u_uBlend = gl.getUniformLocation(prog, "uBlend");
    // Array uniforms in WebGL1 are addressable via the base name OR
    // `name[0]` — using the [0] form is the safest cross-driver bet.
    const u_uColorStops = gl.getUniformLocation(prog, "uColorStops[0]");

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
      // Reference: `time * 0.01 * speed * 0.1` where time = rAF timestamp
      // in ms. We use elapsed-since-mount in ms with the same scaling.
      const uTime =
        (now - startTime) * 0.01 * (propsRef.current.speed ?? 1) * 0.1;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(prog);

      gl.uniform1f(u_uTime, uTime);
      gl.uniform1f(u_uAmplitude, propsRef.current.amplitude ?? 1.0);
      gl.uniform2f(u_uResolution, canvas.width, canvas.height);
      gl.uniform1f(u_uBlend, propsRef.current.blend ?? 0.5);

      const stops = propsRef.current.colorStops ?? colorStops;
      const flat = new Float32Array(9);
      for (let i = 0; i < 3; i++) {
        const rgb = hexToRgb(stops[i]);
        flat[i * 3 + 0] = rgb[0];
        flat[i * 3 + 1] = rgb[1];
        flat[i * 3 + 2] = rgb[2];
      }
      gl.uniform3fv(u_uColorStops, flat);

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
    // We intentionally only re-init WebGL on mount; prop changes flow
    // through propsRef on every frame, no need to rebuild the context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

"use client";

import { useEffect, useRef } from "react";

// LightRays — native WebGL implementation of the React Bits LightRays
// background effect. Mirrors the prop interface from
// https://reactbits.dev so call sites match the documented API:
//
//   <LightRays
//     raysOrigin="top-center"
//     raysColor="#ffffff"
//     raysSpeed={1}
//     lightSpread={0.5}
//     rayLength={3}
//     followMouse={true}
//     mouseInfluence={0.1}
//     noiseAmount={0}
//     distortion={0}
//     pulsating={false}
//     fadeDistance={1}
//     saturation={1}
//   />
//
// Uses native WebGL (no OGL / three.js) so it has zero new
// dependencies. The fragment shader sweeps a polar angle around the
// origin point, builds a radial cone, modulates with cos(angle *
// rayCount + t * speed) to draw the striations, and falls off with
// distance.

type RaysOrigin =
  | "top-center"
  | "top-left"
  | "top-right"
  | "bottom-center"
  | "bottom-left"
  | "bottom-right"
  | "left"
  | "right"
  | "center";

export interface LightRaysProps {
  raysOrigin?: RaysOrigin;
  raysColor?: string;
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  /** Mouse-driven UV distortion strength. 0 = no distortion. */
  distortion?: number;
  className?: string;
  pulsating?: boolean;
  fadeDistance?: number;
  saturation?: number;
}

const VERT = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAG = `
  precision highp float;

  uniform vec2 iResolution;
  uniform vec2 iMouse;
  uniform float iTime;
  uniform vec2 raysOrigin;
  uniform vec3 raysColor;
  uniform float raysSpeed;
  uniform float lightSpread;
  uniform float rayLength;
  uniform float mouseInfluence;
  uniform float noiseAmount;
  uniform float distortion;
  uniform float pulsating;
  uniform float fadeDistance;
  uniform float saturation;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = iResolution.x / iResolution.y;
    vec2 auv = vec2(uv.x * aspect, uv.y);

    // Origin moves with the mouse (subtle parallax).
    vec2 origin = raysOrigin;
    origin.xy += (iMouse - 0.5) * mouseInfluence;
    origin.x *= aspect;

    // Optional UV distortion driven by mouse.
    if (distortion > 0.0) {
      vec2 m = (iMouse - 0.5) * distortion;
      auv += m * 0.2;
    }

    vec2 d = auv - origin;
    float angle = atan(d.x, d.y);
    float dist = length(d);

    // Radial falloff. rayLength acts as the soft cutoff radius.
    float dn = dist / max(rayLength, 0.0001);
    float fadeBase = pow(max(0.0, 1.0 - dn), 2.0);
    fadeBase *= fadeDistance;

    // Striations. lightSpread maps 0 → many thin rays, 1 → fewer
    // wider rays.
    float rayCount = mix(60.0, 18.0, clamp(lightSpread, 0.0, 1.0));
    float pat = pow(
      0.5 + 0.5 * cos(angle * rayCount + iTime * raysSpeed * 2.0),
      8.0
    );

    float intensity = pat * fadeBase;

    // Pulse (sin wave 0.5–1).
    intensity *= mix(1.0, 0.5 + 0.5 * sin(iTime * 1.5), pulsating);

    // Noise breakup.
    if (noiseAmount > 0.0) {
      intensity += (hash(auv * 280.0 + iTime) - 0.5) * noiseAmount;
    }

    intensity = max(0.0, intensity);

    vec3 col = raysColor * intensity;

    // Desaturate toward gray as saturation → 0.
    float gray = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(gray), col, clamp(saturation, 0.0, 1.0));

    gl_FragColor = vec4(col, min(intensity * 0.85, 1.0));
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
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function originCoords(name: RaysOrigin): [number, number] {
  switch (name) {
    case "top-left":
      return [0, 0];
    case "top-right":
      return [1, 0];
    case "left":
      return [0, 0.5];
    case "right":
      return [1, 0.5];
    case "center":
      return [0.5, 0.5];
    case "bottom-left":
      return [0, 1];
    case "bottom-center":
      return [0.5, 1];
    case "bottom-right":
      return [1, 1];
    case "top-center":
    default:
      return [0.5, 0];
  }
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
    // Surface the shader log in dev — invisible in prod.
    if (process.env.NODE_ENV !== "production") {
      console.error("LightRays shader compile failed:", gl.getShaderInfoLog(sh));
    }
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export default function LightRays({
  raysOrigin = "top-center",
  raysColor = "#ffffff",
  raysSpeed = 1,
  lightSpread = 0.5,
  rayLength = 3,
  followMouse = true,
  mouseInfluence = 0.1,
  noiseAmount = 0,
  distortion = 0,
  pulsating = false,
  fadeDistance = 1,
  saturation = 1,
  className = "",
}: LightRaysProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const glCtx =
      canvas.getContext("webgl", { premultipliedAlpha: false }) ||
      (canvas.getContext("experimental-webgl", {
        premultipliedAlpha: false,
      }) as WebGLRenderingContext | null);
    if (!glCtx) return;
    const gl = glCtx;

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
        console.error("LightRays program link failed:", gl.getProgramInfoLog(prog));
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
    const u_iResolution = u("iResolution");
    const u_iMouse = u("iMouse");
    const u_iTime = u("iTime");
    const u_raysOrigin = u("raysOrigin");
    const u_raysColor = u("raysColor");
    const u_raysSpeed = u("raysSpeed");
    const u_lightSpread = u("lightSpread");
    const u_rayLength = u("rayLength");
    const u_mouseInfluence = u("mouseInfluence");
    const u_noiseAmount = u("noiseAmount");
    const u_distortion = u("distortion");
    const u_pulsating = u("pulsating");
    const u_fadeDistance = u("fadeDistance");
    const u_saturation = u("saturation");

    const rgb = hexToRgb(raysColor);
    const origin = originCoords(raysOrigin);

    const startTime = performance.now();
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) / rect.width;
      mouseRef.current.y = 1 - (e.clientY - rect.top) / rect.height;
    };
    if (followMouse) {
      window.addEventListener("mousemove", onMove, { passive: true });
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const now = performance.now();
      const t = (now - startTime) / 1000;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(prog);

      gl.enable(gl.BLEND);
      // Additive blending so the rays glow over the dark page bg.
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

      gl.uniform2f(u_iResolution, canvas.width, canvas.height);
      gl.uniform2f(u_iMouse, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(u_iTime, t);
      gl.uniform2f(u_raysOrigin, origin[0], origin[1]);
      gl.uniform3f(u_raysColor, rgb[0], rgb[1], rgb[2]);
      gl.uniform1f(u_raysSpeed, raysSpeed);
      gl.uniform1f(u_lightSpread, lightSpread);
      gl.uniform1f(u_rayLength, rayLength);
      gl.uniform1f(u_mouseInfluence, mouseInfluence);
      gl.uniform1f(u_noiseAmount, noiseAmount);
      gl.uniform1f(u_distortion, distortion);
      gl.uniform1f(u_pulsating, pulsating ? 1 : 0);
      gl.uniform1f(u_fadeDistance, fadeDistance);
      gl.uniform1f(u_saturation, saturation);

      gl.enableVertexAttribArray(positionLoc);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      if (followMouse) window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [
    raysOrigin,
    raysColor,
    raysSpeed,
    lightSpread,
    rayLength,
    followMouse,
    mouseInfluence,
    noiseAmount,
    distortion,
    pulsating,
    fadeDistance,
    saturation,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

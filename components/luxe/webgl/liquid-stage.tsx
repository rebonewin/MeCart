"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion";

type Variant = "hero" | "panel" | "ambient";

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * Fluid light field. Domain-warped value noise produces slow, liquid veils of
 * champagne light over obsidian. It is deliberately low-frequency so text
 * remains legible; grain and a vignette keep it photographic rather than
 * synthetic.
 */
const FRAGMENT = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uObsidian;
  uniform vec3 uGold;
  uniform vec3 uWarm;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
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

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    mat2 rotate = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p = rotate * p * 2.02 + 11.7;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

    float t = uTime * 0.032;
    vec2 pointer = (uMouse - 0.5) * vec2(aspect, 1.0) * 0.65;
    vec2 drift = vec2(t * 0.7, -t * 0.45);
    vec2 warp = vec2(
      fbm(p * 1.35 + drift + pointer * 0.4),
      fbm(p * 1.35 + drift * 1.2 + vec2(5.2, 1.3) - pointer * 0.3)
    );

    vec2 q = p + (warp - 0.5) * 0.52;
    float veil = fbm(q * 2.1 + vec2(t * 1.6, -t * 1.1));
    float ribbon = fbm(q * 3.6 - vec2(t * 0.9, t * 1.4));

    float lightA = smoothstep(0.46, 0.88, veil);
    float lightB = smoothstep(0.62, 0.96, ribbon);
    float glow = pow(1.0 - clamp(length(p + vec2(0.08, 0.04)), 0.0, 1.0), 2.4);

    vec3 color = uObsidian;
    color += uGold * lightA * 0.26 * uIntensity;
    color += uWarm * lightB * 0.12 * uIntensity;
    color += uGold * glow * 0.16 * uIntensity;

    // A single soft caustic line gives the field an atelier-light signature.
    float line = smoothstep(0.012, 0.0, abs(q.y + q.x * 0.34 + sin(t + q.x * 2.2) * 0.055));
    color += uWarm * line * 0.18 * uIntensity;

    // Fine film grain, stable per pixel, prevents gradient banding.
    float grain = hash(uv * uResolution) - 0.5;
    color += grain * 0.018;

    // Vignette keeps the focal content above the light.
    float vignette = smoothstep(1.15, 0.2, length(p * vec2(0.92, 1.12)));
    color *= mix(0.72, 1.0, vignette);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const PARTICLE_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  varying float vAlpha;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uMouse;
  void main() {
    vec3 pos = position;
    float drift = uTime * (0.012 + aSeed * 0.018);
    pos.x += sin(drift + aSeed * 6.28) * 0.035;
    pos.y += cos(drift * 1.3 + aSeed * 12.0) * 0.028 + mod(uTime * (0.004 + aSeed * 0.006), 0.16);
    pos.xy += (uMouse - 0.5) * (0.006 + aSeed * 0.018);
    gl_Position = vec4(pos.xy, 0.0, 1.0);
    gl_PointSize = aSize * uPixelRatio;
    vAlpha = 0.22 + 0.5 * (0.5 + 0.5 * sin(uTime * 0.4 + aSeed * 20.0));
  }
`;

const PARTICLE_FRAGMENT = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  uniform vec3 uWarm;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(uWarm, core * vAlpha);
  }
`;

export function LiquidStage({
  className,
  variant = "panel",
  intensity,
  particles = true,
  interactive = true,
}: {
  className?: string;
  variant?: Variant;
  intensity?: number;
  particles?: boolean;
  interactive?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let cleanup = () => {};

    void import("three")
      .then((THREE) => {
        if (disposed || !host.isConnected) return;

        let renderer: import("three").WebGLRenderer;
        try {
          renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: false,
            powerPreference: "low-power",
            stencil: false,
            depth: false,
          });
        } catch {
          return; // CSS fallback remains visible.
        }

        const preset = {
          hero: 1,
          panel: 0.62,
          ambient: 0.34,
        }[variant];
        const strength = intensity ?? preset;
        const dpr = Math.min(window.devicePixelRatio || 1, variant === "hero" ? 1.5 : 1.25);

        renderer.setPixelRatio(dpr);
        renderer.setClearColor(0x0b0b0f, 1);
        renderer.domElement.setAttribute("aria-hidden", "true");
        renderer.domElement.style.position = "absolute";
        renderer.domElement.style.inset = "0";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.Camera();

        const uniforms = {
          uResolution: { value: new THREE.Vector2(1, 1) },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uTime: { value: 0 },
          uIntensity: { value: strength },
          uObsidian: { value: new THREE.Color("#0b0b0f") },
          uGold: { value: new THREE.Color("#d4af37") },
          uWarm: { value: new THREE.Color("#e6c768") },
        };

        const field = new THREE.Mesh(
          new THREE.PlaneGeometry(2, 2),
          new THREE.ShaderMaterial({
            vertexShader: VERTEX,
            fragmentShader: FRAGMENT,
            uniforms,
            depthWrite: false,
            depthTest: false,
          }),
        );
        scene.add(field);

        let points: import("three").Points | null = null;
        const particleUniforms = {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uPixelRatio: { value: dpr },
          uWarm: { value: new THREE.Color("#e6c768") },
        };

        if (particles) {
          const count = variant === "hero" ? 420 : 180;
          const positions = new Float32Array(count * 3);
          const sizes = new Float32Array(count);
          const seeds = new Float32Array(count);
          for (let i = 0; i < count; i += 1) {
            positions[i * 3] = Math.random() * 2 - 1;
            positions[i * 3 + 1] = Math.random() * 2 - 1;
            positions[i * 3 + 2] = 0;
            sizes[i] = 0.8 + Math.random() * (variant === "hero" ? 2.6 : 1.6);
            seeds[i] = Math.random();
          }
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
          geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
          points = new THREE.Points(
            geometry,
            new THREE.ShaderMaterial({
              vertexShader: PARTICLE_VERTEX,
              fragmentShader: PARTICLE_FRAGMENT,
              uniforms: particleUniforms,
              transparent: true,
              depthWrite: false,
              depthTest: false,
              blending: THREE.AdditiveBlending,
            }),
          );
          points.frustumCulled = false;
          scene.add(points);
        }

        const resize = () => {
          const width = host.clientWidth || 1;
          const height = host.clientHeight || 1;
          const pixelWidth = Math.max(1, Math.floor(width * dpr));
          const pixelHeight = Math.max(1, Math.floor(height * dpr));
          renderer.setSize(pixelWidth, pixelHeight, false);
          uniforms.uResolution.value.set(pixelWidth, pixelHeight);
        };

        resize();
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);

        const mouse = new THREE.Vector2(0.5, 0.5);
        let targetX = 0.5;
        let targetY = 0.5;
        const onPointer = (event: PointerEvent) => {
          const rect = host.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          targetX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
          targetY = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
        };
        if (interactive && !reduced) {
          window.addEventListener("pointermove", onPointer, { passive: true });
        }

        let visible = true;
        const observer = new IntersectionObserver(
          ([entry]) => {
            visible = entry.isIntersecting;
            if (visible) wake();
          },
          { rootMargin: "120px" },
        );
        observer.observe(host);

        let raf = 0;
        let running = false;
        let last = performance.now();
        let elapsed = 0;

        const draw = () => {
          renderer.render(scene, camera);
        };

        const loop = (now: number) => {
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          elapsed += dt;
          uniforms.uTime.value = elapsed;
          particleUniforms.uTime.value = elapsed;
          mouse.x += (targetX - mouse.x) * 0.035;
          mouse.y += (targetY - mouse.y) * 0.035;
          uniforms.uMouse.value.set(mouse.x, 1 - mouse.y);
          particleUniforms.uMouse.value.set(mouse.x, 1 - mouse.y);
          draw();
          if (visible && !document.hidden) {
            raf = requestAnimationFrame(loop);
          } else {
            running = false;
          }
        };

        const wake = () => {
          if (running || document.hidden) return;
          running = true;
          last = performance.now();
          raf = requestAnimationFrame(loop);
        };

        const onVisibility = () => {
          if (!document.hidden) wake();
        };
        document.addEventListener("visibilitychange", onVisibility);

        if (reduced) {
          draw(); // one still frame: atmosphere without motion
        } else {
          wake();
        }

        cleanup = () => {
          cancelAnimationFrame(raf);
          observer.disconnect();
          resizeObserver.disconnect();
          window.removeEventListener("pointermove", onPointer);
          document.removeEventListener("visibilitychange", onVisibility);
          field.geometry.dispose();
          (field.material as import("three").ShaderMaterial).dispose();
          points?.geometry.dispose();
          (points?.material as import("three").ShaderMaterial | undefined)?.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      cleanup();
    };
  }, [interactive, intensity, particles, reduced, variant]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={cn(
        "lx-liquid-stage pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div className="lx-liquid-fallback absolute inset-0" />
      <div className="lx-liquid-grain absolute inset-0" />
    </div>
  );
}

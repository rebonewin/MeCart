"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  RoundedBox,
  Sparkles,
} from "@react-three/drei";

/**
 * The Meridian Gate — MeCart's authentication scene.
 *
 * Three champagne meridian rings orbit a single polished monolith on a warm
 * dais, like an atelier armillary. Fully procedural: one reflection probe,
 * gold dust, a contact shadow, no postprocessing (the login page's LCP is a
 * keyboard-focusable form, not the render). Moves with the pointer only —
 * the visitor is reading, not flying.
 */

const OBSIDIAN = "#0b0b0f";
const CHAMPAGNE = "#d4af37";
const WARM = "#e6c768";

function PointerDrift() {
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = -(event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, delta) => {
    const camera = state.camera;
    const damp = 1 - Math.pow(0.0016, delta);
    const t = state.clock.elapsedTime;
    camera.position.x +=
      (pointer.current.x * 0.48 + Math.sin(t * 0.13) * 0.22 - camera.position.x) * damp;
    camera.position.y +=
      (0.55 + pointer.current.y * 0.22 + Math.cos(t * 0.09) * 0.1 - camera.position.y) * damp;
    camera.position.z += (6.55 - camera.position.z) * damp;
    camera.lookAt(0, 0.12, 0);
  });

  return null;
}

function MeridianRing({
  radius,
  speed,
  tilt,
  phase,
}: {
  radius: number;
  speed: number;
  tilt: number;
  phase: number;
}) {
  const ring = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!ring.current) return;
    ring.current.rotation.z += delta * speed;
    ring.current.rotation.x =
      tilt + Math.sin(state.clock.elapsedTime * 0.24 + phase) * 0.07;
  });

  return (
    <mesh ref={ring} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.01, 10, 128]} />
      <meshPhysicalMaterial color={CHAMPAGNE} metalness={1} roughness={0.3} envMapIntensity={1.12} />
    </mesh>
  );
}

function Monolith() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    // A barely-there pendulum sway keeps the object warm, never restless.
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
  });

  return (
    <group ref={group}>
      <RoundedBox args={[1.04, 2.66, 0.36]} radius={0.1} smoothness={5} castShadow>
        <meshPhysicalMaterial
          color="#15171e"
          metalness={0.55}
          roughness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.2}
          envMapIntensity={1.35}
        />
      </RoundedBox>

      {/* a small gilded hallmark, offset from the engraved spine so the
          monolith reads as a signed object rather than a symbol */}
      <mesh position={[0.22, 0.8, 0.19]} rotation={[0, 0, -0.55]}>
        <planeGeometry args={[0.2, 0.016]} />
        <meshBasicMaterial color={WARM} toneMapped={false} />
      </mesh>

      {/* engraved meridian hairline down the face */}
      <mesh position={[0, -0.15, 0.183]}>
        <planeGeometry args={[0.045, 2.05]} />
        <meshBasicMaterial color={CHAMPAGNE} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function Dais() {
  return (
    <group position={[0, -1.52, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[1.2, 1.34, 0.2, 64]} />
        <meshPhysicalMaterial color="#1a1d24" metalness={0.8} roughness={0.36} />
      </mesh>
      <mesh position={[0, 0.106, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.06, 48]} />
        <meshPhysicalMaterial color={CHAMPAGNE} metalness={1} roughness={0.24} />
      </mesh>
    </group>
  );
}

function Salon() {
  return (
    <>
      <ambientLight intensity={0.14} />
      {/* single soft key, then the environment carries the metals */}
      <directionalLight position={[4, 6, 3]} intensity={0.9} color="#f6e9c8" />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2.7} position={[0, 5, -1.2]} rotation-x={Math.PI / 2.6} scale={[7, 2.2, 1]} color="#f2e0b4" />
        <Lightformer intensity={1.7} position={[-6, 1, 1]} rotation-y={Math.PI / 2} scale={[9, 2.4, 1]} color="#d4af37" />
        <Lightformer intensity={1.2} position={[6, 0.4, 0]} rotation-y={-Math.PI / 2} scale={[9, 2, 1]} color="#ece5d3" />
        <Lightformer intensity={0.5} position={[0, -5, 0]} rotation-x={-Math.PI / 2} scale={[11, 11, 1]} color="#101318" />
        <Lightformer intensity={1.6} form="ring" position={[0, 2.2, 2.6]} scale={2} color="#e6c768" />
      </Environment>
    </>
  );
}

export function AuthAtelier({ paused = false }: { paused?: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 0.55, 6.55], fov: 36 }}
      dpr={[1, 1.5]}
      frameloop={paused ? "never" : "always"}
      gl={{
        antialias: true,
        alpha: true,
        stencil: false,
        powerPreference: "high-performance",
      }}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      aria-hidden
    >
      <fog attach="fog" args={[OBSIDIAN, 8.5, 16]} />

      <Salon />

      <group position={[-0.42, 0.28, 0]}>
        <Dais />
        <Monolith />
        <MeridianRing radius={1.7} speed={0.06} tilt={Math.PI / 2.4} phase={0} />
        <MeridianRing radius={2.15} speed={-0.042} tilt={Math.PI / 2.85} phase={2.1} />
        <MeridianRing radius={2.6} speed={0.03} tilt={Math.PI / 3.4} phase={4.4} />
      </group>

      <Sparkles count={90} scale={[7, 5.5, 5]} size={1.6} speed={0.18} opacity={0.45} color={WARM} />
      <ContactShadows
        position={[-0.42, -1.37, 0]}
        opacity={0.6}
        scale={7}
        blur={2.4}
        far={3}
        resolution={256}
        color="#000000"
      />

      <PointerDrift />
    </Canvas>
  );
}

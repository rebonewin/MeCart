"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Lightformer, Sparkles, Stars } from "@react-three/drei";

/* ------------------------------------------------------------------ */
/* Procedural premium artifacts — no heavy 3D models, all generated     */
/* ------------------------------------------------------------------ */

type ArtifactSpec = {
  position: [number, number, number];
  color: string;
  metal: boolean;
  type: 0 | 1 | 2 | 3 | 4;
  scale: number;
};

const ARTIFACTS: ArtifactSpec[] = [
  { position: [-4.7, 1.7, -2.4], color: "#D4AF37", metal: false, type: 0, scale: 1.15 },
  { position: [4.5, 2.1, -3.9], color: "#D4AF37", metal: true, type: 2, scale: 0.82 },
  { position: [4.2, -1.8, -2.3], color: "#E6C768", metal: false, type: 4, scale: 0.95 },
  { position: [-3.7, -2.3, -1.6], color: "#F8F6F2", metal: true, type: 1, scale: 0.72 },
  { position: [0.7, 3, -5.6], color: "#D4AF37", metal: false, type: 3, scale: 0.68 },
  { position: [-1.5, -3, -3.5], color: "#D98B8B", metal: false, type: 2, scale: 0.5 },
];

function Artifact({ position, color, metal, type, scale }: ArtifactSpec) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.x += delta * 0.16;
    mesh.current.rotation.y += delta * 0.22;
  });

  return (
    <Float speed={1.3} rotationIntensity={0.55} floatIntensity={1.25}>
      <mesh ref={mesh} position={position} scale={scale}>
        {type === 0 && <icosahedronGeometry args={[1, 0]} />}
        {type === 1 && <torusGeometry args={[0.85, 0.3, 28, 72]} />}
        {type === 2 && <boxGeometry args={[1.15, 1.15, 1.15]} />}
        {type === 3 && <torusKnotGeometry args={[0.62, 0.2, 110, 14]} />}
        {type === 4 && <sphereGeometry args={[0.85, 40, 40]} />}
        <meshPhysicalMaterial
          color={color}
          metalness={metal ? 0.96 : 0.2}
          roughness={metal ? 0.16 : 0.05}
          transmission={metal ? 0 : 0.55}
          thickness={0.9}
          ior={1.42}
          clearcoat={1}
          clearcoatRoughness={0.12}
          envMapIntensity={1.15}
        />
      </mesh>
    </Float>
  );
}

/* ------------------------------------------------------------------ */
/* Energy core — pulsing emissive heart with light                     */
/* ------------------------------------------------------------------ */

function Core() {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.06;
    mesh.current?.scale.setScalar(pulse);
  });

  return (
    <group position={[0, 0.1, -2.4]}>
      <mesh ref={mesh}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshBasicMaterial color="#c7d2fe" transparent opacity={0.85} />
      </mesh>
      <pointLight intensity={30} distance={20} color="#D4AF37" />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Light beams — additive volumetric suggestions                       */
/* ------------------------------------------------------------------ */

function LightBeams() {
  return (
    <group>
      <mesh position={[-6.4, 3.4, -6]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.035, 0.42, 16, 20, 1, true]} />
        <meshBasicMaterial
          color="#8ea2ff"
          transparent
          opacity={0.07}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[6.2, -3.2, -6.6]} rotation={[0, 0, -0.55]}>
        <cylinderGeometry args={[0.03, 0.4, 15, 20, 1, true]} />
        <meshBasicMaterial
          color="#E6C768"
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* CameraRig — mouse parallax + scroll drift (frame-rate independent)  */
/* ------------------------------------------------------------------ */

function CameraRig() {
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (event: PointerEvent) => {
      target.current.x = (event.clientX / window.innerWidth - 0.5) * 1.6;
      target.current.y = -(event.clientY / window.innerHeight - 0.5) * 1.0;
    };
    window.addEventListener("pointermove", handler, { passive: true });
    return () => window.removeEventListener("pointermove", handler);
  }, []);

  useFrame((state, delta) => {
    const camera = state.camera;
    const scroll = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1.6);
    const damp = 1 - Math.pow(0.002, delta);
    camera.position.x += (target.current.x - camera.position.x) * damp;
    camera.position.y += (target.current.y - scroll * 0.6 - camera.position.y) * damp;
    camera.position.z += (8.6 + scroll * 1.3 - camera.position.z) * damp;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* HeroScene                                                           */
/* ------------------------------------------------------------------ */

export function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.3, 8.6], fov: 42 }}
      dpr={[1, 1.6]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <ambientLight intensity={0.42} />
      <directionalLight position={[6, 7, 4]} intensity={1.25} color="#dbe7ff" />
      <pointLight position={[-7, -4, -5]} intensity={34} distance={32} color="#6366f1" />
      <pointLight position={[6, -3, 4]} intensity={22} distance={28} color="#E6C768" />

      <Environment resolution={64} frames={1}>
        <Lightformer intensity={5} position={[0, 6, -8]} scale={[12, 8, 1]} color="#93a6ff" />
        <Lightformer intensity={2.6} position={[-7, 2, 1]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} color="#E6C768" />
        <Lightformer intensity={2.4} position={[7, -1, 1]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} color="#D4AF37" />
        <Lightformer intensity={1.1} position={[0, -6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} color="#111a3d" />
      </Environment>

      <Stars radius={70} depth={50} count={900} factor={2.6} saturation={0} fade speed={0.5} />
      <Sparkles count={180} scale={[20, 12, 16]} size={2.2} speed={0.35} color="#9db4ff" opacity={0.7} />

      <LightBeams />
      <Core />
      {ARTIFACTS.map((artifact) => (
        <Artifact key={`${artifact.position.join("-")}-${artifact.type}`} {...artifact} />
      ))}
      <CameraRig />
    </Canvas>
  );
}

"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Sparkles, Stars } from "@react-three/drei";

function FloatingShape({
  position,
  color,
  type,
}: {
  position: [number, number, number];
  color: string;
  type: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.22;
    meshRef.current.rotation.y += delta * 0.18;
  });

  const materialProps = {
    color,
    transparent: true,
    opacity: 0.72,
    roughness: 0.08,
    metalness: 0.15,
    transmission: 0.65,
    thickness: 0.6,
    ior: 1.45,
  };

  return (
    <Float speed={1.4} rotationIntensity={0.7} floatIntensity={1.4}>
      <mesh ref={meshRef} position={position}>
        {type === 0 && <icosahedronGeometry args={[1, 0]} />}
        {type === 1 && <torusGeometry args={[0.9, 0.28, 32, 64]} />}
        {type === 2 && <boxGeometry args={[1.2, 1.2, 1.2]} />}
        {type === 3 && <torusKnotGeometry args={[0.7, 0.22, 120, 16]} />}
        {type === 4 && <sphereGeometry args={[0.9, 40, 40]} />}
        <meshPhysicalMaterial {...materialProps} />
      </mesh>
    </Float>
  );
}

function CameraRig() {
  const target = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      target.current.x = (event.clientX / window.innerWidth - 0.5) * 1.4;
      target.current.y = -(event.clientY / window.innerHeight - 0.5) * 0.9;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  useFrame((state) => {
    const scroll = window.scrollY / Math.max(window.innerHeight, 1);
    const camera = state.camera;
    camera.position.x += (target.current.x - camera.position.x) * 0.03;
    camera.position.y += (target.current.y - scroll * 0.7 - camera.position.y) * 0.03;
    camera.position.z += (9 - scroll * 1.5 - camera.position.z) * 0.03;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

const shapes = [
  { position: [-4.8, 1.8, -2.5] as [number, number, number], color: "#60a5fa", type: 0 },
  { position: [4.6, -1.2, -3.5] as [number, number, number], color: "#c084fc", type: 1 },
  { position: [-3.8, -2.1, -1.5] as [number, number, number], color: "#22d3ee", type: 2 },
  { position: [3.6, 2.4, -4.2] as [number, number, number], color: "#f472b6", type: 3 },
  { position: [0.4, -2.6, -3.2] as [number, number, number], color: "#818cf8", type: 4 },
  { position: [-1.2, 2.8, -5.2] as [number, number, number], color: "#38bdf8", type: 1 },
];

export function CinematicScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 44 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
    >
      <color attach="background" args={["#030712"]} />
      <fog attach="fog" args={["#030712", 6, 22]} />
      <ambientLight intensity={0.34} />
      <directionalLight position={[6, 6, 4]} intensity={1.15} color="#dbeafe" />
      <pointLight position={[-6, -4, -4]} intensity={2.4} color="#8b5cf6" />
      <pointLight position={[5, -2, 4]} intensity={1.6} color="#06b6d4" />
      <Environment preset="city" />
      <Stars radius={80} depth={60} count={1100} factor={2.8} saturation={0} fade speed={0.6} />
      <Sparkles count={260} scale={[18, 12, 18]} size={2.6} speed={0.45} color="#60a5fa" />
      <CameraRig />
      {shapes.map((shape) => (
        <FloatingShape
          key={`${shape.position.join("-")}-${shape.type}`}
          position={shape.position}
          color={shape.color}
          type={shape.type}
        />
      ))}
    </Canvas>
  );
}

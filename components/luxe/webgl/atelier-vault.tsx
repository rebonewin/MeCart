"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Float,
  Lightformer,
  Sparkles,
} from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer, Vignette } from "@react-three/postprocessing";

/**
 * The Sable Vault — MeCart's cinematic centrepiece.
 *
 * A hand-cut obsidian crystal levitating above a champagne atelier dais,
 * encircled by two fracture rings. No glass case: the object is allowed to
 * breathe. Everything is procedural: no model downloads, one 512px
 * reflection probe, soft fog, a restrained bloom and a whisper of depth of
 * field. It mounts client-side only (see vault-stage) and pauses its render
 * loop whenever the stage leaves the viewport.
 */

type VaultVariant = "hero" | "relic";

const OBSIDIAN = "#0b0b0f";
const CHAMPAGNE = "#d4af37";
const WARM = "#e6c768";

/* The ivory spine the crystal grew around — deliberately unused in the
   final palette but kept here as the material reference for the relic. */
export const IVORY = "#f8f6f2";

/* ------------------------------------------------------------------ */
/* Camera — slow cinematic drift, mouse parallax, scroll response      */
/* ------------------------------------------------------------------ */

const FRAMING = {
  hero: { position: [0.55, 0.32, 6.4] as const, lookAt: [0, 0.05, 0] as const },
  relic: { position: [0.28, 0.42, 5.2] as const, lookAt: [0, 0.06, 0] as const },
};

function CinematicRig({ variant }: { variant: VaultVariant }) {
  const pointer = useRef({ x: 0, y: 0 });
  const scroll = useRef(0);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = -(event.clientY / window.innerHeight - 0.5) * 2;
    };
    const onScroll = () => {
      scroll.current = Math.min(
        window.scrollY / Math.max(window.innerHeight, 1),
        1.35,
      );
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useFrame((state, delta) => {
    const camera = state.camera;
    const framing = FRAMING[variant];
    // Frame-rate independent damping: identical feel at 30fps and 144fps.
    const damp = 1 - Math.pow(0.0012, delta);
    const t = state.clock.elapsedTime;
    const driftX = Math.sin(t * 0.16) * 0.14; // slow, scripted breath
    const driftZ = Math.cos(t * 0.11) * 0.18;

    camera.position.x +=
      (framing.position[0] + pointer.current.x * 0.42 + driftX - camera.position.x) * damp;
    camera.position.y +=
      (framing.position[1] +
        pointer.current.y * 0.24 -
        scroll.current * 0.7 -
        camera.position.y) *
      damp;
    camera.position.z +=
      (framing.position[2] + driftZ + scroll.current * 1.25 - camera.position.z) * damp;
    camera.lookAt(framing.lookAt[0], framing.lookAt[1] - scroll.current * 0.55, framing.lookAt[2]);
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Objects                                                             */
/* ------------------------------------------------------------------ */

/** Oblique icosahedron cut used for the levitating obsidian crystal. */
function Crystal() {
  const gem = useRef<THREE.Group>(null);
  const cut = useMemo<THREE.BufferGeometry>(() => {
    const geometry = new THREE.IcosahedronGeometry(0.78, 0);
    const positions = geometry.attributes.position;
    const scaled = (positions.array as Float32Array).slice();
    for (let i = 0; i < positions.count; i += 1) {
      // Slightly stretch the crystal vertically — a tablet of obsidian,
      // not a perfect stone. Adds parallax interest during rotation.
      scaled[i * 3 + 1] *= 1.3;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(scaled, positions.itemSize));
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  useFrame((state, delta) => {
    if (!gem.current) return;
    gem.current.rotation.y += delta * 0.22;
    gem.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.06;
  });

  return (
    <group ref={gem}>
      <mesh geometry={cut} castShadow>
        <meshPhysicalMaterial
          color="#1a1c23"
          metalness={0.4}
          roughness={0.07}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={2.15}
          reflectivity={0.95}
          flatShading
          iridescence={0.3}
          iridescenceIOR={1.32}
          iridescenceThicknessRange={[120, 420]}
        />
      </mesh>
      {/* Gilded silhouette — a hairline of champagne where the obsidian
          meets the dark, like the gold leaf in a kintsugi repair. */}
      <mesh geometry={cut} scale={1.012}>
        <meshBasicMaterial
          color={CHAMPAGNE}
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function HaloRing({
  radius,
  speed,
  tilt,
  offset,
  color = CHAMPAGNE,
}: {
  radius: number;
  speed: number;
  tilt: number;
  offset: number;
  color?: string;
}) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!ring.current) return;
    ring.current.rotation.z += delta * speed;
    ring.current.rotation.x =
      tilt + Math.sin(state.clock.elapsedTime * 0.22 + offset) * 0.08;
  });
  return (
    <mesh ref={ring} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.0115, 12, 144]} />
      <meshPhysicalMaterial
        color={color}
        metalness={1}
        roughness={0.3}
        envMapIntensity={1.1}
      />
    </mesh>
  );
}

function VaultArtifact() {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.06;
  });

  return (
    <group ref={group}>
      {/* Atelier key + rim, positioned in the artifact's own frame so the
          spotlight always finds the facets as the crystal turns. */}
      <pointLight position={[2, 1.6, 3.2]} intensity={24} distance={9} decay={2} color="#fff0d2" />
      <pointLight position={[-2.4, 1.1, -2]} intensity={15} distance={8} decay={2} color="#e6c768" />

      {/* Champagne presentation dais */}
      <mesh position={[0, -1.5, 0]} castShadow>
        <cylinderGeometry args={[1.28, 1.44, 0.18, 72]} />
        <meshPhysicalMaterial color="#191c23" metalness={0.82} roughness={0.34} />
      </mesh>
      <mesh position={[0, -1.402, 0]} castShadow>
        <torusGeometry args={[1.25, 0.016, 10, 96]} />
        <meshPhysicalMaterial color={CHAMPAGNE} metalness={1} roughness={0.24} />
      </mesh>

      {/* The object of desire — levitating, untouchable */}
      <Float speed={1.05} rotationIntensity={0.1} floatIntensity={0.7} floatingRange={[-0.04, 0.08]}>
        <Crystal />
      </Float>
    </group>
  );
}

function Studio() {
  return (
    <>
      <ambientLight intensity={0.19} />
      <directionalLight position={[5, 7, 4]} intensity={1.2} color="#fbeed0" />
      <directionalLight position={[-6, 2, 3]} intensity={0.38} color={WARM} />
      {/* Atelier spotlight — carves the facets out of the obsidian. */}
      <spotLight
        position={[3.6, 5.4, 4.2]}
        angle={0.55}
        penumbra={1}
        intensity={70}
        distance={18}
        decay={2}
        color="#ffe8bd"
      />
      <pointLight position={[1.6, 0.4, 3.4]} intensity={16} distance={8} decay={2} color="#ffdf9e" />

      {/* Reflection probe — a 512px HDRI-style salon, rendered once. */}
      <Environment resolution={128} frames={1}>
        {/* Key light: a tall champagne softbox over the case */}
        <Lightformer intensity={3.1} position={[0, 5.4, -1.5]} rotation-x={Math.PI / 2.6} scale={[7, 2.4, 1]} color="#f4e3b8" />
        {/* Warm gallery wash from stage left */}
        <Lightformer intensity={1.9} position={[-6.5, 1.1, 1.5]} rotation-y={Math.PI / 2} scale={[9, 2.6, 1]} color="#d4af37" />
        {/* Colder ivory fill from stage right keeps metal legible */}
        <Lightformer intensity={1.35} position={[6.5, 0.4, 0.5]} rotation-y={-Math.PI / 2} scale={[9, 2.2, 1]} color="#efe8d6" />
        {/* Obsidian horizon grounds the floor reflection */}
        <Lightformer intensity={0.5} position={[0, -5.5, 0]} rotation-x={-Math.PI / 2} scale={[12, 12, 1]} color="#111319" />
        {/* A single caustic strip for the glass ribbon highlight */}
        <Lightformer intensity={2.2} form="ring" position={[0, 2.6, 3.2]} scale={2.4} color="#e6c768" />
      </Environment>
    </>
  );
}

function Atmosphere() {
  return (
    <>
      <Sparkles count={110} scale={[7.5, 6.5, 6]} size={1.7} speed={0.22} opacity={0.5} color={WARM} />
      <ContactShadows
        position={[0, -1.61, 0]}
        opacity={0.6}
        scale={7.5}
        blur={2.8}
        far={3.2}
        resolution={256}
        color="#000000"
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Canvas                                                              */
/* ------------------------------------------------------------------ */

export function AtelierVault({
  variant = "hero",
  paused = false,
}: {
  variant?: VaultVariant;
  paused?: boolean;
}) {
  const postEnabled = variant === "hero";

  return (
    <Canvas
      camera={{ position: [0.55, 0.32, 6.4], fov: 34 }}
      dpr={[1, 1.5]}
      frameloop={paused ? "never" : "always"}
      gl={{
        antialias: false,
        alpha: true,
        stencil: false,
        powerPreference: "high-performance",
      }}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      aria-hidden
    >
      <fog attach="fog" args={[OBSIDIAN, 9.5, 17]} />

      <Studio />
      <Atmosphere />

      {/* The vault sits right of frame on wide screens; the text column owns
          the left half. The camera rig drifts around it on scroll. */}
      <group position={[1.72, 0.14, 0]}>
        <VaultArtifact />
        <HaloRing radius={1.36} speed={0.05} tilt={Math.PI / 2.32} offset={0} />
        <HaloRing radius={1.74} speed={-0.032} tilt={Math.PI / 2.9} offset={2.2} color={WARM} />
      </group>

      <CinematicRig variant={variant} />

      {postEnabled ? (
        <EffectComposer multisampling={4}>
          {/* Whisper of depth of field — the far ring dissolves into bokeh. */}
          <DepthOfField target={[1.72, 0.1, 0]} focalLength={0.026} bokehScale={2.4} resolutionScale={0.5} />
          {/* Minimal bloom reserved for true speculars and the gold rings. */}
          <Bloom mipmapBlur intensity={0.42} luminanceThreshold={0.66} luminanceSmoothing={0.2} />
          {/* Photographic vignette ties the canvas into the light field. */}
          <Vignette offset={0.24} darkness={0.38} />
        </EffectComposer>
      ) : null}
    </Canvas>
  );
}

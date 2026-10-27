"use client";

import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Center, OrbitControls, useGLTF } from "@react-three/drei";
import {
  Box3,
  Group,
  TextureLoader,
  Vector3,
  type Object3D,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Maximize2, Minimize2, Pause, Play, RotateCcw, ZoomIn } from "lucide-react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion";

export type ProductViewerProps = {
  name: string;
  /** Optional GLB/GLTF asset. When absent, the studio plate is used. */
  modelUrl?: string;
  poster: string;
  className?: string;
  /** Small helper line under the label, e.g. "glTF · 1.2 MB". */
  caption?: string;
};

function gentlyFit(object: Object3D): Group {
  const group = new Group();
  const clone = object.clone(true);
  const box = new Box3().setFromObject(clone);
  const size = new Vector3();
  const center = new Vector3();
  box.getSize(size);
  box.getCenter(center);
  clone.position.sub(center);
  const max = Math.max(size.x, size.y, size.z) || 1;
  clone.scale.setScalar(2.4 / max);
  group.add(clone);
  return group;
}

function Model({ url, autoRotate }: { url: string; autoRotate: boolean }) {
  const gltf = useGLTF(url);
  const ref = useRef<Group>(null);
  const object = useMemo(() => gentlyFit(gltf.scene), [gltf.scene]);

  useFrame((_, delta) => {
    if (autoRotate && ref.current) ref.current.rotation.y += delta * 0.24;
  });

  return (
    <Center>
      <group ref={ref}>
        <primitive object={object} />
      </group>
    </Center>
  );
}

/**
 * Studio plate fallback: the product photograph becomes a framed, floating
 * plate in the light field. It gives merchandise without a GLB an honest,
 * elegant 3D presentation (orbit / zoom / pan still work), and never shows a
 * mirrored "back" of the photograph.
 */
function StudioPlate({ poster, autoRotate }: { poster: string; autoRotate: boolean }) {
  const texture = useLoader(TextureLoader, poster);
  const ref = useRef<Group>(null);

  /* Fit the photograph inside the studio frame regardless of source aspect. */
  const [width, height] = useMemo(() => {
    const image = texture.image as { width?: number; height?: number } | undefined;
    const aspect = image?.width && image?.height ? image.width / image.height : 3 / 4;
    const maxHeight = 1.86;
    const maxWidth = 1.46;
    if (aspect >= maxWidth / maxHeight) return [maxWidth, maxWidth / aspect];
    return [maxHeight * aspect, maxHeight];
  }, [texture]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const sway = autoRotate ? Math.sin(t * 0.45) * 0.22 : 0;
    ref.current.rotation.y = sway;
    ref.current.rotation.x = Math.sin(t * 0.32) * 0.018;
    ref.current.position.y = Math.sin(t * 0.7) * 0.03;
  });

  return (
    <group position={[0, 0.02, 0]}>
      <group ref={ref}>
        {/* gold hairline mount behind the print */}
        <mesh position={[0, 0, -0.012]}>
          <planeGeometry args={[width + 0.05, height + 0.05]} />
          <meshBasicMaterial color="#d4af37" transparent opacity={0.62} />
        </mesh>
        {/* obsidian mat */}
        <mesh position={[0, 0, -0.008]}>
          <planeGeometry args={[width + 0.014, height + 0.014]} />
          <meshBasicMaterial color="#0B0B0F" />
        </mesh>
        <mesh castShadow>
          <planeGeometry args={[width, height]} />
          <meshPhysicalMaterial
            map={texture}
            roughness={0.38}
            metalness={0.02}
            clearcoat={0.22}
            clearcoatRoughness={0.4}
            side={2}
          />
        </mesh>
      </group>

      {/* studio dais + champagne rim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -height / 2 - 0.22, 0]}>
        <circleGeometry args={[Math.max(width * 0.82, 0.72), 64]} />
        <meshPhysicalMaterial color="#1a1d24" metalness={0.65} roughness={0.38} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -height / 2 - 0.208, 0]}>
        <ringGeometry args={[Math.max(width * 0.82, 0.72) - 0.025, Math.max(width * 0.82, 0.72), 64]} />
        <meshBasicMaterial color="#d4af37" transparent opacity={0.42} />
      </mesh>
    </group>
  );
}

function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 5, 5]} intensity={2.2} color="#f8f6f2" />
      <directionalLight position={[-4, 1, 2]} intensity={1.1} color="#d4af37" />
      <pointLight position={[0, -2, 2]} intensity={1.4} color="#e6c768" />
    </>
  );
}

class ViewerBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function CanvasFallback({
  poster,
  name,
  className,
}: {
  poster: string;
  name: string;
  className?: string;
}) {
  return (
    <div className={cn("lx-viewer relative aspect-[4/5] w-full", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt={name} className="h-full w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center p-4">
        <span className="lx-viewer-badge">Studio photography · 3D asset unavailable</span>
      </div>
    </div>
  );
}

export function ProductViewer({ name, modelUrl, poster, className, caption }: ProductViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const reduced = usePrefersReducedMotion();
  const [autoRotate, setAutoRotate] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [interacted, setInteracted] = useState(false);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const rotating = autoRotate && !reduced;

  const toggleFullscreen = useCallback(async () => {
    const node = containerRef.current;
    if (!node) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await node.requestFullscreen();
    } catch {
      // Fullscreen API is unavailable (iOS Safari); the layout already fills
      // the gallery, so failure is graceful.
    }
  }, []);

  const reset = useCallback(() => {
    controlsRef.current?.reset();
    setInteracted(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("lx-viewer group/viewer aspect-[4/5] w-full", className)}
      aria-label={`${name} 3D studio viewer`}
    >
      <ViewerBoundary fallback={<CanvasFallback poster={poster} name={name} />}>
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [0, 0.15, 4.2], fov: 35 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => gl.setClearColor("#12141a", 1)}
          frameloop="always"
          aria-label={`${name}: drag to rotate, scroll to zoom, right-drag to pan`}
        >
          <color attach="background" args={["#12141a"]} />
          <fog attach="fog" args={["#12141a", 6, 12]} />
          <StudioLights />
          <Suspense fallback={null}>
            {modelUrl ? (
              <Model url={modelUrl} autoRotate={rotating} />
            ) : (
              <StudioPlate poster={poster} autoRotate={rotating} />
            )}
          </Suspense>
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enablePan
            enableZoom
            minDistance={2.2}
            maxDistance={7}
            enableDamping
            dampingFactor={0.08}
            autoRotate={false}
            onStart={() => setInteracted(true)}
          />
        </Canvas>
      </ViewerBoundary>

      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-2">
        <span className="lx-viewer-badge">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--lx-gold)]" />
          {modelUrl ? "Interactive 3D" : "Studio plate"}
        </span>
        {caption ? <span className="lx-viewer-badge">{caption}</span> : null}
      </div>

      <div className="lx-viewer-controls">
        <span className="lx-viewer-badge hidden sm:inline-flex">
          <ZoomIn className="h-3 w-3" aria-hidden />
          Drag · zoom · pan
        </span>
        <div className="lx-viewer-toolbar">
          <button
            type="button"
            className="lx-viewer-tool"
            onClick={() => setAutoRotate((value) => !value)}
            aria-label={reduced ? "Auto-rotation disabled by reduced motion" : rotating ? "Pause auto-rotation" : "Play auto-rotation"}
            aria-pressed={rotating}
            disabled={reduced}
          >
            {rotating ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            className="lx-viewer-tool"
            onClick={reset}
            aria-label="Reset camera"
            disabled={!interacted}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="lx-viewer-tool"
            onClick={() => void toggleFullscreen()}
            aria-label={fullscreen ? "Exit fullscreen" : "View fullscreen"}
          >
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

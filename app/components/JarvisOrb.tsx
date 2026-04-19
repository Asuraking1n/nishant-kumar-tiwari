import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { micLevel } from "../audio/micAnalyser";

export type JarvisOrbState =
  | "idle"
  | "listening"
  | "speaking"
  | "processing"
  | "muted";

/** Menacing red-eye palette — Skynet / Terminator vibe */
const EYE: Record<JarvisOrbState, string> = {
  idle: "#ff2d2d",
  listening: "#ff0033",
  speaking: "#ff5a1f",
  processing: "#ff2d2d",
  muted: "#401010",
};

const FAST: JarvisOrbState[] = ["listening", "speaking", "processing"];

const DARK_STEEL = "#0a0a0d";
const MID_STEEL = "#1a1a1f";

/** The skull / chassis — dark faceted metal */
function Chassis({ state }: { state: JarvisOrbState }) {
  const inner = useRef<THREE.Mesh>(null!);
  const wire = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const voice = state === "listening" ? micLevel.current : 0;
    const voiceScale = 1 + voice * 0.08;
    if (inner.current) {
      inner.current.rotation.y = t * (0.12 + voice * 0.9);
      inner.current.rotation.x = Math.sin(t * 0.2) * 0.15;
      inner.current.scale.setScalar(voiceScale);
    }
    if (wire.current) {
      wire.current.rotation.y = -t * (0.14 + voice * 0.9);
      wire.current.rotation.z = t * 0.05;
      wire.current.scale.setScalar(1 + voice * 0.15);
      const mat = wire.current.material as THREE.MeshBasicMaterial;
      mat.opacity =
        state === "muted" ? 0.15 : 0.4 + voice * 0.5 + (state === "listening" ? 0.1 : 0);
    }
  });

  return (
    <>
      {/* Solid dodecahedral shell */}
      <mesh ref={inner}>
        <dodecahedronGeometry args={[0.92, 0]} />
        <meshStandardMaterial
          color={DARK_STEEL}
          emissive={EYE[state]}
          emissiveIntensity={state === "muted" ? 0.05 : 0.18}
          metalness={0.95}
          roughness={0.35}
          flatShading
        />
      </mesh>
      {/* Slightly larger wireframe cage */}
      <mesh ref={wire}>
        <icosahedronGeometry args={[1.0, 1]} />
        <meshBasicMaterial
          color={EYE[state]}
          wireframe
          transparent
          opacity={state === "muted" ? 0.15 : 0.55}
        />
      </mesh>
    </>
  );
}

/** The red eye — the only "warm" element. Pulses + flickers by state, and spikes with live mic level. */
function Eye({ state }: { state: JarvisOrbState }) {
  const core = useRef<THREE.Mesh>(null!);
  const corona = useRef<THREE.Mesh>(null!);
  const light = useRef<THREE.PointLight>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const freq =
      state === "listening" ? 5.5 : state === "speaking" ? 7 : state === "processing" ? 4 : 1.3;
    const amp =
      state === "listening" ? 0.22 : state === "speaking" ? 0.28 : state === "processing" ? 0.12 : 0.07;
    // Terminator-style flicker: occasionally dip brightness sharply
    const flicker =
      state === "muted" ? 0 : Math.random() < 0.02 ? -0.35 : 0;

    // Live voice amplitude injection — only when JARVIS is actually listening
    const voice = state === "listening" ? micLevel.current : 0;

    const pulse = 1 + Math.sin(t * freq) * amp + flicker + voice * 0.55;

    if (core.current) core.current.scale.setScalar(pulse);
    if (corona.current) {
      corona.current.scale.setScalar(1 + Math.sin(t * freq) * amp * 1.6 + voice * 0.9);
      const mat = corona.current.material as THREE.MeshBasicMaterial;
      mat.opacity = state === "muted" ? 0.08 : 0.28 + Math.sin(t * freq) * 0.12 + voice * 0.35;
    }
    if (light.current) {
      const base = state === "muted" ? 0.15 : state === "listening" ? 3.6 : 2.4;
      light.current.intensity = base + Math.sin(t * freq) * 1.2 + flicker + voice * 4.5;
    }
  });

  const color = EYE[state];
  return (
    <group>
      <pointLight ref={light} position={[0, 0, 0.2]} color={color} distance={4.5} />
      <mesh ref={core}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshBasicMaterial color={state === "muted" ? "#501a1a" : "#ffdada"} />
      </mesh>
      {/* Bright emissive shell */}
      <mesh>
        <sphereGeometry args={[0.36, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={state === "muted" ? 0.2 : 0.7} />
      </mesh>
      {/* Outer corona */}
      <mesh ref={corona}>
        <sphereGeometry args={[0.58, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Three counter-rotating angular gyro rings — mechanical, industrial */
function GyroBlades({ state }: { state: JarvisOrbState }) {
  const r1 = useRef<THREE.Mesh>(null!);
  const r2 = useRef<THREE.Mesh>(null!);
  const r3 = useRef<THREE.Mesh>(null!);

  useFrame((_, dt) => {
    const voice = state === "listening" ? micLevel.current : 0;
    // Blades accelerate on loud moments
    const k = (FAST.includes(state) ? 1.4 : state === "muted" ? 0.05 : 0.5) + voice * 2.5;
    if (r1.current) r1.current.rotation.x += dt * 0.6 * k;
    if (r2.current) r2.current.rotation.y -= dt * 0.8 * k;
    if (r3.current) {
      r3.current.rotation.z += dt * 0.5 * k;
      r3.current.rotation.x += dt * 0.2 * k;
    }
  });

  const color = EYE[state];
  const steelMat = (
    <meshStandardMaterial
      color={MID_STEEL}
      emissive={color}
      emissiveIntensity={state === "muted" ? 0.05 : 0.4}
      metalness={0.95}
      roughness={0.3}
      flatShading
    />
  );

  return (
    <group>
      {/* Low-segment torus = faceted blade ring */}
      <mesh ref={r1}>
        <torusGeometry args={[1.25, 0.035, 3, 24]} />
        {steelMat}
      </mesh>
      <mesh ref={r2} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.35, 0.03, 3, 28]} />
        <meshStandardMaterial
          color={MID_STEEL}
          emissive={color}
          emissiveIntensity={state === "muted" ? 0.05 : 0.3}
          metalness={0.95}
          roughness={0.3}
          flatShading
        />
      </mesh>
      <mesh ref={r3} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[1.55, 0.012, 3, 32]} />
        <meshBasicMaterial color={color} transparent opacity={state === "muted" ? 0.1 : 0.35} />
      </mesh>
    </group>
  );
}

/** Radial spikes — fixed, give the orb an aggressive silhouette */
function Spikes({ state }: { state: JarvisOrbState }) {
  const group = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.08;
  });
  const dirs = useMemo<[number, number, number][]>(
    () => [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ],
    []
  );
  const color = EYE[state];

  return (
    <group ref={group}>
      {dirs.map((d, i) => {
        const dir = new THREE.Vector3(...d).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        const pos = dir.clone().multiplyScalar(1.05);
        return (
          <mesh key={i} position={pos.toArray()} quaternion={q.toArray() as any}>
            <coneGeometry args={[0.07, 0.3, 4]} />
            <meshStandardMaterial
              color={MID_STEEL}
              emissive={color}
              emissiveIntensity={state === "muted" ? 0.05 : 0.5}
              metalness={0.95}
              roughness={0.25}
              flatShading
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Scan sweep across the eye — the "HUNTER-KILLER" feel */
function ScanSweep({ state }: { state: JarvisOrbState }) {
  const mesh = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "listening" ? 2.5 : state === "speaking" ? 3 : 0.9;
    mesh.current.rotation.z = t * speed;
  });
  if (state === "muted") return null;
  return (
    <mesh ref={mesh}>
      <torusGeometry args={[1.05, 0.015, 2, 48, Math.PI * 0.4]} />
      <meshBasicMaterial color={EYE[state]} transparent opacity={0.75} />
    </mesh>
  );
}

export function JarvisOrb({
  state,
  size = 104,
  onClick,
  ariaLabel,
}: {
  state: JarvisOrbState;
  size?: number;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const color = EYE[state];
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-full transition-transform hover:scale-[1.05] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      style={{ width: size, height: size }}
      aria-label={ariaLabel ?? `JARVIS orb — ${state}`}
      title={ariaLabel ?? `JARVIS · ${state}`}
    >
      {/* Outer hot-glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none transition-all duration-500"
        style={{
          boxShadow: `0 0 ${state === "muted" ? 10 : 32}px ${color}${
            state === "muted" ? "44" : "ee"
          }, 0 0 ${state === "muted" ? 4 : 60}px ${color}${state === "muted" ? "22" : "55"}, inset 0 0 ${
            state === "muted" ? 4 : 16
          }px ${color}55`,
        }}
      />
      {/* Scanline overlay for CRT / machine feel */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none mix-blend-overlay opacity-40"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 3px)",
        }}
      />
      <Canvas
        camera={{ position: [0, 0, 3.4], fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        dpr={[1, 1.8]}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.22} />
        <pointLight position={[3, 3, 3]} color="#ff3030" intensity={1.2} />
        <pointLight position={[-3, -2, 2]} color="#ffffff" intensity={0.35} />
        <Chassis state={state} />
        <GyroBlades state={state} />
        <Spikes state={state} />
        <ScanSweep state={state} />
        <Eye state={state} />
      </Canvas>
    </button>
  );
}

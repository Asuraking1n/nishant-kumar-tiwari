import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { effectState } from "../effects/effectBus";

/** Concentric rotating ring */
function Ring({
  radius,
  tube,
  color,
  speed,
  axis = "y",
  tilt = 0,
}: {
  radius: number;
  tube: number;
  color: string;
  speed: number;
  axis?: "x" | "y" | "z";
  tilt?: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation[axis] += dt * speed;
  });
  return (
    <mesh ref={ref} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, tube, 16, 128]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2.2}
        metalness={0.8}
        roughness={0.25}
      />
    </mesh>
  );
}

/** Circular array of small segments */
function SegmentedRing({
  radius,
  segments,
  color,
  speed,
}: {
  radius: number;
  segments: number;
  color: string;
  speed: number;
}) {
  const group = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.z += dt * speed;
  });
  const items = useMemo(() => {
    return new Array(segments).fill(0).map((_, i) => {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      return { x, y, angle, key: i };
    });
  }, [radius, segments]);
  return (
    <group ref={group}>
      {items.map(({ x, y, angle, key }) => (
        <mesh key={key} position={[x, y, 0]} rotation={[0, 0, angle + Math.PI / 2]}>
          <boxGeometry args={[0.06, 0.22, 0.04]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2.5}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Triangular coil prongs (like the real arc reactor's palladium triangle) */
function CoilTriangle() {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z -= dt * 0.12;
  });
  return (
    <group ref={ref}>
      {/* Thick bright inner triangle (the energized coil) */}
      <mesh>
        <torusGeometry args={[0.72, 0.045, 10, 3]} />
        <meshStandardMaterial
          color="#e8f8ff"
          emissive="#7ff0ff"
          emissiveIntensity={3.2}
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>
      {/* Copper anchor bolts at the three corners */}
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2 + Math.PI / 2;
        return (
          <group
            key={i}
            position={[Math.cos(angle) * 0.72, Math.sin(angle) * 0.72, 0]}
            rotation={[0, 0, angle]}
          >
            <mesh>
              <cylinderGeometry args={[0.08, 0.09, 0.14, 16]} />
              <meshStandardMaterial
                color="#c9822b"
                emissive="#ff8844"
                emissiveIntensity={0.4}
                metalness={0.95}
                roughness={0.25}
              />
            </mesh>
            <mesh position={[0, 0, 0.07]}>
              <sphereGeometry args={[0.055, 16, 16]} />
              <meshStandardMaterial
                color="#ffd08a"
                emissive="#ffaa55"
                emissiveIntensity={0.8}
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Copper / steel housing ring on the outside — gives the reactor a "case" feel */
function HousingRing() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.04;
  });
  return (
    <group>
      {/* Outer gold case */}
      <mesh ref={ref}>
        <torusGeometry args={[2.32, 0.09, 14, 128]} />
        <meshStandardMaterial
          color="#8a6a35"
          emissive="#5a3a1a"
          emissiveIntensity={0.22}
          metalness={0.95}
          roughness={0.35}
        />
      </mesh>
      {/* Inner rim groove */}
      <mesh>
        <torusGeometry args={[2.22, 0.03, 10, 128]} />
        <meshStandardMaterial
          color="#2a2228"
          metalness={0.95}
          roughness={0.45}
        />
      </mesh>
      {/* Inner bright seam */}
      <mesh>
        <torusGeometry args={[2.22, 0.01, 6, 128]} />
        <meshBasicMaterial color="#66f1ff" transparent opacity={0.8} />
      </mesh>
      {/* Rivets around the housing */}
      {new Array(12).fill(0).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 2.32, Math.sin(a) * 2.32, 0.08]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial
              color="#d6a25a"
              emissive="#ff9b44"
              emissiveIntensity={0.5}
              metalness={0.95}
              roughness={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Metal spokes connecting inner coil housing to the outer ring (like real reactor struts) */
function Spokes() {
  const items = new Array(6).fill(0).map((_, i) => {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 12;
    return { a };
  });
  return (
    <group>
      {items.map(({ a }, i) => (
        <group key={i} rotation={[0, 0, a]}>
          <mesh position={[1.45, 0, 0]}>
            <boxGeometry args={[0.85, 0.05, 0.08]} />
            <meshStandardMaterial
              color="#7a7580"
              emissive="#334b55"
              emissiveIntensity={0.15}
              metalness={0.95}
              roughness={0.35}
            />
          </mesh>
          {/* Tiny glowing seam on each spoke */}
          <mesh position={[1.45, 0, 0.045]}>
            <boxGeometry args={[0.85, 0.01, 0.005]} />
            <meshBasicMaterial color="#66f1ff" transparent opacity={0.75} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Pulsing inner core — white-hot plasma with layered blue halo */
function Core() {
  const mesh = useRef<THREE.Mesh>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const rim = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const surge = effectState.surge; // 0..1 — spikes during "fire up" / "full power" etc.
    const doom = effectState.doomsday; // 0..1 — red emergency mode
    // Doomsday: erratic jittery pulse, reactor goes volatile
    const doomPulse = doom > 0 ? (Math.sin(t * 9) * 0.18 + (Math.random() - 0.5) * 0.18) * doom : 0;
    const pulse = 1 + Math.sin(t * 2.2) * 0.08 + surge * 0.35 + doomPulse;
    // Heavier flicker while unstable
    const flickChance = 0.04 + doom * 0.35;
    const flicker = Math.random() < flickChance ? 0.75 - doom * 0.3 : 1;
    if (mesh.current) mesh.current.scale.setScalar(pulse * flicker);
    if (rim.current) rim.current.rotation.z = t * (0.25 + surge * 3 + doom * 4);
    if (light.current) {
      light.current.intensity = 5.2 + Math.sin(t * 2.2) * 1.6 + surge * 9 - doom * 1.5;
      // Lerp light colour toward blood-red during doomsday
      if (doom > 0.02) {
        light.current.color.setRGB(1.0, 0.12 * (1 - doom) + 0.08, 0.1 * (1 - doom) + 0.05);
      } else {
        light.current.color.setHex(0xbde9ff);
      }
    }
  });
  return (
    <group>
      <pointLight ref={light} position={[0, 0, 0.3]} color="#bde9ff" intensity={5.2} distance={14} />
      {/* White-hot center */}
      <mesh ref={mesh}>
        <sphereGeometry args={[0.34, 48, 48]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Bright blue inner shell */}
      <mesh>
        <sphereGeometry args={[0.48, 48, 48]} />
        <meshBasicMaterial color="#bde9ff" transparent opacity={0.6} />
      </mesh>
      {/* Outer plasma halo */}
      <mesh>
        <sphereGeometry args={[0.68, 48, 48]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.28} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.9, 48, 48]} />
        <meshBasicMaterial color="#00aaff" transparent opacity={0.09} />
      </mesh>
      {/* Metal rim cup behind the core (the "well") */}
      <mesh ref={rim} position={[0, 0, -0.04]}>
        <ringGeometry args={[0.55, 0.68, 64]} />
        <meshStandardMaterial
          color="#24272e"
          metalness={0.95}
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/** Orbiting micro-satellites */
function Orbiters() {
  const g = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.25;
  });
  const items = useMemo(() => {
    return [
      { r: 2.6, off: 0, color: "#00e5ff" },
      { r: 2.9, off: Math.PI * 0.7, color: "#ffb347" },
      { r: 2.4, off: Math.PI * 1.3, color: "#00e5ff" },
    ];
  }, []);
  return (
    <group ref={g}>
      {items.map(({ r, off, color }, i) => (
        <group key={i} rotation={[0, 0, off]}>
          <mesh position={[r, 0, 0]}>
            <icosahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={3}
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
          {/* Orbit trail */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.003, 8, 128]} />
            <meshBasicMaterial color={color} transparent opacity={0.18} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Floating hex panels in background */
function HexPanels() {
  const g = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.z += dt * 0.05;
  });
  const hexes = useMemo(() => {
    const arr: { x: number; y: number; z: number; s: number }[] = [];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const r = 3.4 + (i % 3) * 0.4;
      arr.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        z: -1.5 - (i % 4) * 0.3,
        s: 0.25 + ((i * 37) % 7) * 0.04,
      });
    }
    return arr;
  }, []);
  return (
    <group ref={g}>
      {hexes.map((h, i) => (
        <mesh key={i} position={[h.x, h.y, h.z]} rotation={[0, 0, Math.PI / 6]}>
          <circleGeometry args={[h.s, 6]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Reactor() {
  const group = useRef<THREE.Group>(null!);
  const doomLight = useRef<THREE.PointLight>(null!);
  useFrame(({ mouse, clock }) => {
    if (!group.current) return;
    const surge = effectState.surge;
    const doom = effectState.doomsday;
    const tx = mouse.x * 0.35;
    const ty = -mouse.y * 0.25;
    const jitterX = doom > 0 ? (Math.random() - 0.5) * 0.08 * doom : 0;
    const jitterY = doom > 0 ? (Math.random() - 0.5) * 0.08 * doom : 0;
    group.current.rotation.y += (tx - group.current.rotation.y) * 0.05 + jitterY;
    group.current.rotation.x += (ty - group.current.rotation.x) * 0.05 + jitterX;
    const targetScale = 1 + surge * 0.12 - doom * 0.05;
    group.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.15
    );
    if (doomLight.current) {
      const t = clock.getElapsedTime();
      doomLight.current.intensity = doom * (6 + Math.sin(t * 14) * 2);
    }
  });
  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.6}>
      <group ref={group}>
        {/* Doomsday-only red rim light that bathes everything in crimson */}
        <pointLight
          ref={doomLight}
          position={[0, 0, 0.5]}
          color="#ff2020"
          intensity={0}
          distance={12}
        />
        <Core />
        <CoilTriangle />
        <Ring radius={1.05} tube={0.045} color="#00e5ff" speed={0.35} axis="z" />
        <Ring radius={1.3} tube={0.025} color="#66f1ff" speed={-0.5} axis="z" />
        <Ring radius={1.6} tube={0.018} color="#00aad4" speed={0.22} axis="z" />
        <SegmentedRing radius={1.85} segments={48} color="#00e5ff" speed={0.35} />
        <SegmentedRing radius={2.15} segments={72} color="#66f1ff" speed={-0.18} />
        <Spokes />
        <HousingRing />
        <Ring radius={2.45} tube={0.01} color="#ffb347" speed={0.1} axis="z" />
        <Orbiters />
        <HexPanels />
      </group>
    </Float>
  );
}

export function ArcReactor() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#02060d"]} />
        <fog attach="fog" args={["#02060d", 6, 14]} />
        <ambientLight intensity={0.15} />
        <pointLight position={[6, 4, 6]} color="#00e5ff" intensity={1.4} />
        <pointLight position={[-6, -4, 4]} color="#ff6b00" intensity={0.6} />

        <Stars radius={40} depth={40} count={1500} factor={3} saturation={0} fade speed={0.6} />

        <Reactor />

        <EffectComposer>
          <Bloom
            intensity={1.3}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.85}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

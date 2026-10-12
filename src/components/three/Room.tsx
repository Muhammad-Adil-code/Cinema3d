"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  AISLE_X,
  EXITS,
  FRONT_DOOR_Z,
  groundAt,
  ROOM,
  ROWS,
  SCREEN,
  STAGE,
  TIERS,
} from "@/lib/layout";
import { carpetTexture, fabricTexture, glowTexture, lobbyTexture, worldBox } from "./textures";
import { lighting } from "./lighting";
import { useCinema } from "@/lib/store";

const WALL_COLOR = "#16131d";

export function Room({ rowLetters = true }: { rowLetters?: boolean }) {
  return (
    <group>
      <Floor />
      <Stage />
      <StepLights />
      <SideWall side={-1} />
      <SideWall side={1} />
      <BackWall />
      <FrontWall />
      {EXITS.map((e) => (
        <Door key={e.id} position={[e.x, e.y, e.z]} rotationY={e.rotationY} />
      ))}
      <Ceiling />
      {rowLetters && <RowLetters />}
    </group>
  );
}

function Floor() {
  const geo = useMemo(() => {
    const width = ROOM.maxX - ROOM.minX;
    const parts = [worldBox(width, 0.2, TIERS[0].zStart - ROOM.minZ, 0, -0.1, (ROOM.minZ + TIERS[0].zStart) / 2)];
    for (const t of TIERS) {
      const h = t.y + 0.2;
      parts.push(worldBox(width, h, t.zEnd - t.zStart, 0, t.y - h / 2, (t.zStart + t.zEnd) / 2));
    }
    return mergeGeometries(parts)!;
  }, []);
  const tex = useMemo(() => carpetTexture(), []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial map={tex} roughness={0.95} metalness={0} />
    </mesh>
  );
}

function Stage() {
  const depth = STAGE.front - STAGE.back;
  const ledRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    if (ledRef.current) ledRef.current.color.setRGB(0.4 + lighting.house * 0.6, 0.25 + lighting.house * 0.3, 1.6);
  });
  return (
    <group>
      <mesh position={[0, STAGE.height / 2, (STAGE.front + STAGE.back) / 2]}>
        <boxGeometry args={[STAGE.halfWidth * 2, STAGE.height, depth]} />
        <meshStandardMaterial color="#231a17" roughness={0.55} metalness={0.05} />
      </mesh>
      {/* LED strip on the stage lip */}
      <mesh position={[0, STAGE.height - 0.04, STAGE.front + 0.01]}>
        <boxGeometry args={[STAGE.halfWidth * 2, 0.025, 0.02]} />
        <meshBasicMaterial ref={ledRef} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Amber LED strips on every riser along the aisles and side passages. */
function StepLights() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const strips = useMemo(() => {
    const out: { x: number; y: number; z: number; w: number }[] = [];
    for (let i = 1; i < TIERS.length; i++) {
      const t = TIERS[i];
      for (const x of [-AISLE_X, AISLE_X]) out.push({ x, y: t.y - 0.05, z: t.zStart - 0.005, w: 1.1 });
      for (const x of [-9.95, 9.95]) out.push({ x, y: t.y - 0.05, z: t.zStart - 0.005, w: 1.6 });
    }
    // floor-level guide lights along the aisle edges
    for (const r of ROWS) {
      for (const x of [-AISLE_X - 0.66, -AISLE_X + 0.66, AISLE_X - 0.66, AISLE_X + 0.66]) {
        out.push({ x, y: r.y + 0.03, z: r.z, w: 0.04 });
      }
    }
    return out;
  }, []);
  useEffect(() => {
    const m = new THREE.Matrix4();
    strips.forEach((s, i) => {
      m.compose(new THREE.Vector3(s.x, s.y, s.z), new THREE.Quaternion(), new THREE.Vector3(s.w, 1, 1));
      ref.current!.setMatrixAt(i, m);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [strips]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, strips.length]} frustumCulled={false}>
      <boxGeometry args={[1, 0.035, 0.03]} />
      <meshBasicMaterial color={[2.4, 1.3, 0.35]} toneMapped={false} />
    </instancedMesh>
  );
}

function SideWall({ side }: { side: 1 | -1 }) {
  const x = side * ROOM.maxX;
  const panelRef = useRef<THREE.InstancedMesh>(null);
  const finRef = useRef<THREE.InstancedMesh>(null);
  const length = ROOM.maxZ - ROOM.minZ;

  const columns = useMemo(() => {
    const out: { z: number; bottom: number }[] = [];
    for (let z = -11.4; z < ROOM.maxZ - 0.8; z += 1.6) {
      const nearDoor = Math.abs(z - FRONT_DOOR_Z) < 1.7;
      out.push({ z, bottom: groundAt(x - side * 0.5, z) + (nearDoor ? 3.3 : 1.3) });
    }
    return out;
  }, [x, side]);

  useEffect(() => {
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    const top = 9.4;
    columns.forEach((col, i) => {
      const h = top - col.bottom;
      m.compose(new THREE.Vector3(x - side * 0.06, col.bottom + h / 2, col.z), new THREE.Quaternion(), new THREE.Vector3(1, h, 1));
      panelRef.current!.setMatrixAt(i, m);
      panelRef.current!.setColorAt(i, c.set(i % 2 ? "#2a1e3a" : "#33182a"));
      m.compose(new THREE.Vector3(x - side * 0.1, col.bottom - 0.2 + (h + 0.4) / 2, col.z + 0.8), new THREE.Quaternion(), new THREE.Vector3(1, h + 0.4, 1));
      finRef.current!.setMatrixAt(i, m);
    });
    panelRef.current!.instanceMatrix.needsUpdate = true;
    if (panelRef.current!.instanceColor) panelRef.current!.instanceColor.needsUpdate = true;
    finRef.current!.instanceMatrix.needsUpdate = true;
  }, [columns, x, side]);

  const fabric = useMemo(() => fabricTexture(), []);
  const sconces = columns.filter((_, i) => i % 2 === 1);

  return (
    <group>
      <mesh position={[x, ROOM.height / 2, (ROOM.minZ + ROOM.maxZ) / 2]} rotation={[0, -side * Math.PI / 2, 0]}>
        <planeGeometry args={[length, ROOM.height]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={1} />
      </mesh>
      <instancedMesh ref={panelRef} args={[undefined, undefined, columns.length]} frustumCulled={false}>
        <boxGeometry args={[0.1, 1, 1.4]} />
        <meshStandardMaterial map={fabric} roughness={1} />
      </instancedMesh>
      <instancedMesh ref={finRef} args={[undefined, undefined, columns.length]} frustumCulled={false}>
        <boxGeometry args={[0.18, 1, 0.12]} />
        <meshStandardMaterial color="#6b4a2e" roughness={0.5} />
      </instancedMesh>
      {sconces.map((s, i) => (
        <Sconce key={i} x={x - side * 0.16} y={s.bottom + 1.2} z={s.z + 0.8} side={side} />
      ))}
      {/* surround speakers */}
      {[-6, -1, 4].map((z) => (
        <mesh key={z} position={[x - side * 0.2, 7.6, z]}>
          <boxGeometry args={[0.3, 0.6, 0.45]} />
          <meshStandardMaterial color="#0c0c10" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Sconce({ x, y, z, side }: { x: number; y: number; z: number; side: number }) {
  const washRef = useRef<THREE.MeshBasicMaterial>(null);
  const tex = useMemo(() => glowTexture(), []);
  useFrame(() => {
    if (washRef.current) washRef.current.opacity = 0.18 + lighting.house * 0.55;
  });
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[0.12, 0.1, 0.36]} />
        <meshBasicMaterial color={[2.2, 1.4, 0.7]} toneMapped={false} />
      </mesh>
      <mesh position={[side * 0.06, 0.4, 0]} rotation={[0, -side * Math.PI / 2, 0]}>
        <planeGeometry args={[1.6, 2.4]} />
        <meshBasicMaterial ref={washRef} map={tex} color="#ffb070" transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function ExitSign({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <boxGeometry args={[0.7, 0.26, 0.06]} />
        <meshStandardMaterial color="#0a120c" />
      </mesh>
      <Text position={[0, 0, 0.035]} fontSize={0.16} letterSpacing={0.12} anchorX="center" anchorY="middle">
        EXIT
        <meshBasicMaterial color={[0.25, 2.6, 0.8]} toneMapped={false} />
      </Text>
    </group>
  );
}

/**
 * Double exit doors. They swing open as the camera approaches, revealing the
 * lit lobby beyond; clicking them (or walking through) leaves the hall.
 */
function Door({ position, rotationY }: { position: [number, number, number]; rotationY: number }) {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const lobby = useRef<THREE.MeshBasicMaterial>(null);
  const spill = useRef<THREE.MeshBasicMaterial>(null);
  const open = useRef(0);
  const centre = useMemo(() => new THREE.Vector3(position[0], position[1] + 1.2, position[2]), [position]);
  const glow = useMemo(() => glowTexture(), []);
  const lobbyTex = useMemo(() => lobbyTexture(), []);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!hover) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hover]);

  useFrame((state, dt) => {
    const near = state.camera.position.distanceTo(centre) < 3.6 || hover;
    open.current = THREE.MathUtils.damp(open.current, near ? 1 : 0, 4, Math.min(dt, 0.1));
    const o = open.current;
    if (left.current) left.current.rotation.y = -o * 1.35;
    if (right.current) right.current.rotation.y = o * 1.35;
    if (lobby.current) lobby.current.color.setScalar(0.04 + o * 0.85);
    if (spill.current) spill.current.opacity = o * 0.35;
  });

  const leaf = (
    <>
      <mesh position={[0.44, 1.2, 0.02]}>
        <boxGeometry args={[0.88, 2.4, 0.06]} />
        <meshStandardMaterial color="#141118" roughness={0.45} />
      </mesh>
      <mesh position={[0.78, 1.05, 0.07]}>
        <boxGeometry args={[0.03, 0.5, 0.03]} />
        <meshStandardMaterial color="#9a9aa4" metalness={0.9} roughness={0.25} />
      </mesh>
    </>
  );

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta <= 6) useCinema.getState().exit();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
    >
      {/* the lit lobby seen through the doorway */}
      <mesh position={[0, 1.2, -0.01]}>
        <planeGeometry args={[1.8, 2.4]} />
        <meshBasicMaterial ref={lobby} map={lobbyTex} toneMapped={false} />
      </mesh>
      {/* frame */}
      {[-0.95, 0.95].map((x) => (
        <mesh key={x} position={[x, 1.25, 0.03]}>
          <boxGeometry args={[0.1, 2.5, 0.1]} />
          <meshStandardMaterial color="#26222c" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 2.47, 0.03]}>
        <boxGeometry args={[2, 0.1, 0.1]} />
        <meshStandardMaterial color="#26222c" roughness={0.6} />
      </mesh>
      <group ref={left} position={[-0.9, 0, 0]}>
        {leaf}
      </group>
      <group ref={right} position={[0.9, 0, 0]} scale={[-1, 1, 1]}>
        {leaf}
      </group>
      {/* light spilling onto the floor */}
      <mesh position={[0, 0.02, 1.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.6, 2.4]} />
        <meshBasicMaterial ref={spill} map={glow} color="#ffcf8a" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <ExitSign position={[0, 2.8, 0.06]} />
      {hover && (
        <Html position={[0, 2.1, 0.3]} center pointerEvents="none" style={{ pointerEvents: "none" }}>
          <div className="seat-tag">
            <strong>EXIT</strong>
            <span>Leave the hall → Home</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function BackWall() {
  const beamGlow = useMemo(() => glowTexture(), []);
  return (
    <group>
      <mesh position={[0, ROOM.height / 2, ROOM.maxZ]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[ROOM.maxX - ROOM.minX, ROOM.height]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={1} />
      </mesh>
      {/* projection booth window */}
      <mesh position={[0, 8.2, ROOM.maxZ - 0.02]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[3.2, 1.2]} />
        <meshStandardMaterial color="#0a1220" emissive="#18243a" roughness={0.1} metalness={0.6} />
      </mesh>
      <mesh position={[0, 8.2, ROOM.maxZ - 0.06]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color={[6, 6, 7]} toneMapped={false} />
      </mesh>
      <mesh position={[0, 8.2, ROOM.maxZ - 0.08]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.2, 1.2]} />
        <meshBasicMaterial map={beamGlow} color="#cfe0ff" transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function curtainGeometry(width: number, height: number, folds: number, depth: number) {
  const geo = new THREE.PlaneGeometry(width, height, folds * 8, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) + width / 2) / width;
    pos.setZ(i, Math.sin(u * folds * Math.PI * 2) * depth + Math.sin(u * folds * 5.3) * depth * 0.3);
  }
  geo.computeVertexNormals();
  return geo;
}

function FrontWall() {
  const side = useMemo(() => curtainGeometry(2.8, 9.8, 7, 0.09), []);
  const valance = useMemo(() => curtainGeometry(22, 1.1, 40, 0.06), []);
  const velvet = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#5a0b14",
        roughness: 0.85,
        sheen: 1,
        sheenColor: new THREE.Color("#ff5a6e"),
        sheenRoughness: 0.45,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const curtainX = SCREEN.width / 2 + 1.55;
  return (
    <group>
      <mesh position={[0, ROOM.height / 2, ROOM.minZ]}>
        <planeGeometry args={[ROOM.maxX - ROOM.minX, ROOM.height]} />
        <meshStandardMaterial color="#050407" roughness={1} />
      </mesh>
      <mesh geometry={side} material={velvet} position={[-curtainX, STAGE.height + 4.9, SCREEN.z + 0.5]} />
      <mesh geometry={side} material={velvet} position={[curtainX, STAGE.height + 4.9, SCREEN.z + 0.5]} />
      <mesh geometry={valance} material={velvet} position={[0, 9.95, SCREEN.z + 0.75]} />
    </group>
  );
}

function Ceiling() {
  const count = 420;
  const { positions, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = THREE.MathUtils.randFloat(ROOM.minX + 0.5, ROOM.maxX - 0.5);
      positions[i * 3 + 1] = ROOM.height - 0.02;
      positions[i * 3 + 2] = THREE.MathUtils.randFloat(ROOM.minZ + 2, ROOM.maxZ - 0.5);
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, phases };
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
        vertexShader: /* glsl */ `
          attribute float phase;
          uniform float uTime;
          uniform float uPixelRatio;
          varying float vTw;
          void main() {
            vTw = 0.55 + 0.45 * sin(uTime * (0.6 + fract(phase) * 1.4) + phase * 3.0);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = (2.0 + fract(phase * 7.0) * 3.0) * uPixelRatio * (12.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          varying float vTw;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d);
            gl_FragColor = vec4(vec3(1.4, 1.35, 1.2) * vTw, a * vTw);
          }`,
      }),
    [],
  );
  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
  });
  return (
    <group>
      <mesh position={[0, ROOM.height, (ROOM.minZ + ROOM.maxZ) / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM.maxX - ROOM.minX, ROOM.maxZ - ROOM.minZ]} />
        <meshStandardMaterial color="#0a0910" roughness={1} />
      </mesh>
      <points material={mat} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-phase" args={[phases, 1]} />
        </bufferGeometry>
      </points>
    </group>
  );
}

/** Glowing row letters at both outer ends of each row, facing the back of the hall. */
function RowLetters() {
  return (
    <group>
      {ROWS.map((r) =>
        [-1, 1].map((s) => {
          const last = s < 0 ? r.seats[0] : r.seats[r.seats.length - 1];
          return (
            <Text
              key={r.letter + s}
              position={[last.x + s * (r.recliner ? 0.7 : 0.5), r.y + 1.05, last.z + 0.1]}
              fontSize={0.26}
              anchorX="center"
              anchorY="middle"
            >
              {r.letter}
              <meshBasicMaterial color={[1.8, 1.25, 0.4]} toneMapped={false} />
            </Text>
          );
        }),
      )}
    </group>
  );
}

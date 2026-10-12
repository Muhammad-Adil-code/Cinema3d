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

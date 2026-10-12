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

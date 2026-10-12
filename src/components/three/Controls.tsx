"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import * as THREE from "three";
import { EXITS, groundAt, OBSTACLES, ROOM, SEAT_BY_ID, seatEye } from "@/lib/layout";
import { useCinema } from "@/lib/store";
import { walkInput } from "@/lib/walkInput";

type V3 = [number, number, number];
const OVERVIEW: Record<"explore" | "select", { pos: V3; target: V3 }> = {
  explore: { pos: [6.5, 6.6, 6.2], target: [0, 3.3, -6.5] },
  select: { pos: [0, 9.6, 8.6], target: [0, 1.0, -7.5] },
};
const ENTRANCE: { pos: V3; target: V3 } = { pos: [0, 6.2, 8.4], target: [0, 4.5, -10] };
const ROOM_BOX = new THREE.Box3(new THREE.Vector3(ROOM.minX + 0.4, 0.4, ROOM.minZ + 0.6), new THREE.Vector3(ROOM.maxX - 0.4, ROOM.height - 0.4, ROOM.maxZ - 0.3));

/** Orbit / zoom camera, plus animated "view from seat" transitions. Disabled while walking. */
export function CameraRig() {
  const ref = useRef<CameraControls>(null);
  const mode = useCinema((s) => s.mode);
  const nav = useCinema((s) => s.nav);
  const view = useCinema((s) => s.view);
  const intro = useRef(true);
  const transition = useRef(0);
  const camera = useThree((s) => s.camera);
  const walking = nav === "walk" && view.kind === "overview";

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.setBoundary(ROOM_BOX);
    c.boundaryEnclosesCamera = true;
    c.boundaryFriction = 0.2;
    c.smoothTime = 0.45;
    c.draggingSmoothTime = 0.12;
    c.dollySpeed = 0.6;
  }, []);

  // Hand the camera back to orbit after walking: look-at a point in front of where we stand.
  const wasWalking = useRef(false);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (wasWalking.current && !walking) {
      const fwd = new THREE.Vector3();
      camera.getWorldDirection(fwd);
      const p = camera.position;
      c.setLookAt(p.x, p.y, p.z, p.x + fwd.x * 4, p.y + fwd.y * 4, p.z + fwd.z * 4, false);
    }
    wasWalking.current = walking;
  }, [walking, camera]);

  useEffect(() => {
    const c = ref.current;
    if (!c || walking) return;
    if (view.kind === "seat") {
      const seat = SEAT_BY_ID.get(view.seatId);
      if (!seat) return;
      const { eye, look } = seatEye(seat);
      const dir = new THREE.Vector3(...look).sub(new THREE.Vector3(...eye)).normalize().multiplyScalar(0.3);
      const token = ++transition.current;
      // Rise above the rows first, then drop into the seat, so the camera never cuts through seat backs.
      c.minDistance = 0.3;
      c.maxDistance = 40;
      c.smoothTime = 0.55;
      c.setLookAt(eye[0], eye[1] + 1.8, eye[2] + 0.9, look[0], look[1], look[2], true).then(() => {
        if (token !== transition.current || !ref.current) return;
        c.smoothTime = 0.5;
        c.setLookAt(eye[0], eye[1], eye[2], eye[0] + dir.x, eye[1] + dir.y, eye[2] + dir.z, true).then(() => {
          if (token === transition.current) c.minDistance = c.maxDistance = 0.3;
        });
      });
      return;
    }
    transition.current++;
    c.minDistance = 1.2;
    c.maxDistance = 16;
    c.smoothTime = 0.8;
    const o = OVERVIEW[mode];
    if (intro.current && mode === "explore") {
      intro.current = false;
      c.setLookAt(...ENTRANCE.pos, ...ENTRANCE.target, false);
      c.smoothTime = 1.6;
    }
    intro.current = false;
    c.setLookAt(...o.pos, ...o.target, true).then(() => {
      if (ref.current) ref.current.smoothTime = 0.45;
    });
  }, [mode, view, walking]);

  return <CameraControls ref={ref} enabled={!walking} makeDefault />;
}

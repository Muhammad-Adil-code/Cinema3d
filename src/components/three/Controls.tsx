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

/** On wide screens the booking panel covers the right ~400px; shift the projection so the hall stays centred in the free area. */
export function PanelOffset() {
  const mode = useCinema((s) => s.mode);
  const seatView = useCinema((s) => s.view.kind === "seat");
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    // Not while sitting: an off-centre projection would skew the "view from this seat".
    if (mode === "select" && !seatView && size.width >= 1024) cam.setViewOffset(size.width, size.height, 200, 0, size.width, size.height);
    else cam.clearViewOffset();
  }, [mode, seatView, size, camera]);
  return null;
}

const EYE = 1.62;
const RADIUS = 0.16;
const SPEED = 2.6;

/** First-person walking: WASD / arrows + drag-to-look, or the on-screen joystick on touch devices. */
export function WalkControls() {
  const nav = useCinema((s) => s.nav);
  const view = useCinema((s) => s.view);
  const active = nav === "walk" && view.kind === "overview";
  const { camera, gl } = useThree();
  const state = useRef({ yaw: 0, pitch: 0, pos: new THREE.Vector3(), y: 0, bob: 0, ready: false });
  // Dev-only handle so automated browser tests can place the walker.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __walker?: typeof state.current }).__walker = state.current;
  }, []);

  // Initialise from wherever the camera currently is.
  useEffect(() => {
    if (!active) {
      state.current.ready = false;
      return;
    }
    const s = state.current;
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    s.yaw = Math.atan2(-fwd.x, -fwd.z);
    s.pitch = THREE.MathUtils.clamp(Math.asin(fwd.y), -0.6, 0.6);
    s.pos.set(
      THREE.MathUtils.clamp(camera.position.x, ROOM.minX + 0.5, ROOM.maxX - 0.5),
      0,
      THREE.MathUtils.clamp(camera.position.z, ROOM.minZ + 0.6, ROOM.maxZ - 0.5),
    );
    // If we came from high up (orbit), drop into the nearest aisle so we don't spawn inside a row.
    if (camera.position.y - groundAt(s.pos.x, s.pos.z) > 3) s.pos.x = s.pos.x > 0 ? 5.04 : -5.04;
    collide(s.pos);
    s.y = camera.position.y;
    s.ready = true;
  }, [active, camera]);

  // Drag to look.
  useEffect(() => {
    if (!active) return;
    const el = gl.domElement;
    let dragging = false;
    let lx = 0;
    let ly = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const k = e.pointerType === "touch" ? 0.006 : 0.0042;
      state.current.yaw -= (e.clientX - lx) * k;
      state.current.pitch = THREE.MathUtils.clamp(state.current.pitch - (e.clientY - ly) * k, -1.2, 1.2);
      lx = e.clientX;
      ly = e.clientY;
    };
    const up = () => (dragging = false);
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [active, gl]);

  useFrame((_, dt) => {
    const s = state.current;
    if (!active || !s.ready) return;
    dt = Math.min(dt, 0.05);
    const exiting = useCinema.getState().exiting;
    // After stepping through a door, keep gliding forward while the screen fades.
    const fwdIn = exiting ? 0.6 : THREE.MathUtils.clamp(walkInput.forward + walkInput.joyY, -1, 1);
    const sideIn = exiting ? 0 : THREE.MathUtils.clamp(walkInput.strafe + walkInput.joyX, -1, 1);
    const speed = SPEED * (walkInput.sprint ? 1.9 : 1);
    const sin = Math.sin(s.yaw);
    const cos = Math.cos(s.yaw);
    const dx = (-sin * fwdIn + cos * sideIn) * speed * dt;
    const dz = (-cos * fwdIn - sin * sideIn) * speed * dt;
    s.pos.x += dx;
    s.pos.z += dz;
    collide(s.pos);

    // Walking into a doorway leaves the hall.
    const floor = groundAt(s.pos.x, s.pos.z);
    for (const ex of EXITS) {
      if (Math.hypot(s.pos.x - ex.x, s.pos.z - ex.z) < 0.6 && Math.abs(floor - ex.y) < 0.5) {
        if (!useCinema.getState().exiting) useCinema.getState().exit();
        break;
      }
    }

    const moving = Math.abs(fwdIn) + Math.abs(sideIn) > 0.05;
    if (moving) s.bob += dt * speed * 3.2;
    const target = groundAt(s.pos.x, s.pos.z) + EYE + (moving ? Math.sin(s.bob) * 0.025 : 0);
    s.y = THREE.MathUtils.damp(s.y, target, 9, dt);

    camera.position.set(s.pos.x, s.y, s.pos.z);
    camera.rotation.set(s.pitch, s.yaw, 0, "YXZ");
  });

  return null;
}

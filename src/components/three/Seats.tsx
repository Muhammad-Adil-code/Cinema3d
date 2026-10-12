"use client";

import { useEffect, useMemo, useRef } from "react";
import { type ThreeEvent } from "@react-three/fiber";
import { Billboard, Html } from "@react-three/drei";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CATEGORY_LABEL, PRICES, SEAT_BY_ID, SEATS, type Seat } from "@/lib/layout";
import { pkr } from "@/lib/movies";
import { takenSet, useCinema } from "@/lib/store";
import { glowTexture } from "./textures";

type Part = THREE.BufferGeometry;

function rbox(w: number, h: number, d: number, r: number, x = 0, y = 0, z = 0, tilt = 0): Part {
  const g = new RoundedBoxGeometry(w, h, d, 2, r);
  if (tilt) g.rotateX(tilt);
  g.translate(x, y, z);
  return g.index ? g.toNonIndexed() : g;
}

function box(w: number, h: number, d: number, x = 0, y = 0, z = 0): Part {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g.toNonIndexed();
}

function cup(x: number, y: number, z: number): Part {
  const g = new THREE.CylinderGeometry(0.045, 0.035, 0.07, 12, 1, true);
  g.translate(x, y, z);
  return g.toNonIndexed();
}

function standardSeat() {
  const tilt = 0.16;
  const fabric = mergeGeometries([rbox(0.5, 0.13, 0.48, 0.05, 0, 0.47, -0.04), rbox(0.5, 0.7, 0.13, 0.05, 0, 0.93, 0.25, tilt)])!;
  const frame = mergeGeometries([
    box(0.06, 0.06, 0.5, -0.31, 0.68, 0.02),
    box(0.06, 0.06, 0.5, 0.31, 0.68, 0.02),
    box(0.05, 0.62, 0.08, -0.31, 0.36, 0.08),
    box(0.05, 0.62, 0.08, 0.31, 0.36, 0.08),
    rbox(0.54, 0.76, 0.05, 0.02, 0, 0.93, 0.33, tilt),
    box(0.3, 0.42, 0.1, 0, 0.21, 0.12),
    cup(0.31, 0.7, -0.22),
  ])!;
  return { fabric, frame };
}

function reclinerSeat() {
  const tilt = 0.32;
  const fabric = mergeGeometries([
    rbox(0.66, 0.2, 0.62, 0.07, 0, 0.42, -0.02),
    rbox(0.66, 0.75, 0.22, 0.08, 0, 0.86, 0.36, tilt),
    rbox(0.5, 0.22, 0.16, 0.07, 0, 1.32, 0.52, tilt),
    rbox(0.64, 0.3, 0.1, 0.04, 0, 0.2, -0.34),
  ])!;
  const frame = mergeGeometries([
    rbox(0.14, 0.5, 0.82, 0.05, -0.41, 0.3, 0.04),
    rbox(0.14, 0.5, 0.82, 0.05, 0.41, 0.3, 0.04),
    box(0.7, 0.12, 0.62, 0, 0.06, 0.05),
    cup(-0.41, 0.56, -0.25),
    cup(0.41, 0.56, -0.25),
  ])!;
  return { fabric, frame };
}

const EXPLORE_COLOR = { standard: "#6e0f1c", premium: "#8c1426", recliner: "#4a1f3d" } as const;
const AVAILABLE_COLOR = { standard: "#a3263a", premium: "#c9343f", recliner: "#8a49b5" } as const;
const TAKEN = "#2a2a31";
const SELECTED = "#f5c451";
const HOVER = "#ff9a6a";

function SeatSet({ seats, recliner, interactive }: { seats: Seat[]; recliner: boolean; interactive: boolean }) {
  const fabricRef = useRef<THREE.InstancedMesh>(null);
  const frameRef = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => (recliner ? reclinerSeat() : standardSeat()), [recliner]);

  const mode = useCinema((s) => s.mode);
  const selected = useCinema((s) => s.selected);
  const hovered = useCinema((s) => s.hovered);
  const inspect = useCinema((s) => s.inspect);
  const showtimeId = useCinema((s) => s.showtimeId);
  const bookings = useCinema((s) => s.bookings);
  const taken = useMemo(() => takenSet(showtimeId, bookings), [showtimeId, bookings]);

  useEffect(() => {
    const m = new THREE.Matrix4();
    seats.forEach((s, i) => {
      m.makeTranslation(s.x, s.y, s.z);
      fabricRef.current!.setMatrixAt(i, m);
      frameRef.current!.setMatrixAt(i, m);
    });
    fabricRef.current!.instanceMatrix.needsUpdate = true;
    frameRef.current!.instanceMatrix.needsUpdate = true;
    fabricRef.current!.computeBoundingSphere();
    frameRef.current!.computeBoundingSphere();
  }, [seats]);

  useEffect(() => {
    const c = new THREE.Color();
    seats.forEach((s, i) => {
      let hex: string;
      if (mode === "select") {
        if (selected.includes(s.id)) hex = SELECTED;
        else if (taken.has(s.id)) hex = TAKEN;
        else if (hovered === s.id) hex = HOVER;
        else hex = AVAILABLE_COLOR[s.category];
      } else {
        if (inspect === s.id) hex = SELECTED;
        else if (hovered === s.id) hex = HOVER;
        else hex = EXPLORE_COLOR[s.category];
      }
      fabricRef.current!.setColorAt(i, c.set(hex));
    });
    fabricRef.current!.instanceColor!.needsUpdate = true;
  }, [seats, mode, selected, hovered, inspect, taken]);

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const id = seats[e.instanceId].id;
    if (useCinema.getState().hovered !== id) useCinema.getState().setHovered(id);
  };
  const onOut = () => useCinema.getState().setHovered(null);
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6 || e.instanceId === undefined) return;
    const id = seats[e.instanceId].id;
    const st = useCinema.getState();
    if (st.mode === "select") st.toggleSeat(id);
    else st.setInspect(st.inspect === id ? null : id);
  };

  return (
    <group>
      <instancedMesh
        ref={fabricRef}
        args={[geo.fabric, undefined, seats.length]}
        {...(interactive ? { onPointerMove: onMove, onPointerOut: onOut, onClick } : { raycast: () => null })}
      >
        <meshStandardMaterial roughness={recliner ? 0.42 : 0.85} metalness={recliner ? 0.05 : 0} />
      </instancedMesh>
      <instancedMesh
        ref={frameRef}
        args={[geo.frame, undefined, seats.length]}
        {...(interactive ? { onPointerMove: onMove, onPointerOut: onOut, onClick } : { raycast: () => null })}
      >
        <meshStandardMaterial color={recliner ? "#151018" : "#1b1a1f"} roughness={0.45} metalness={0.35} />
      </instancedMesh>
    </group>
  );
}

const standardSeats = SEATS.filter((s) => s.category !== "recliner");
const reclinerSeats = SEATS.filter((s) => s.category === "recliner");

export function Seats({ interactive = true }: { interactive?: boolean }) {
  const hovered = useCinema((s) => s.hovered);
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  return (
    <group>
      <SeatSet seats={standardSeats} recliner={false} interactive={interactive} />
      <SeatSet seats={reclinerSeats} recliner interactive={interactive} />
      {interactive && <SeatMarkers />}
      {interactive && <HoverTag />}
    </group>
  );
}

/** Golden halo + floating label over every selected (or inspected) seat. */
function SeatMarkers() {
  const mode = useCinema((s) => s.mode);
  const selected = useCinema((s) => s.selected);
  const inspect = useCinema((s) => s.inspect);
  const view = useCinema((s) => s.view);
  const ids = mode === "select" ? selected : inspect ? [inspect] : [];
  const tex = useMemo(() => glowTexture(), []);
  return (
    <group>
      {ids.map((id) => {
        const s = SEAT_BY_ID.get(id);
        if (!s) return null;
        const sitting = view.kind === "seat" && view.seatId === id;
        return (
          <group key={id} position={[s.x, s.y, s.z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <planeGeometry args={[1.3, 1.3]} />
              <meshBasicMaterial map={tex} color={[2.4, 1.7, 0.5]} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
            {!sitting && (
              <Billboard position={[0, 1.75, 0]}>
                <Html center zIndexRange={[20, 0]} pointerEvents="none" wrapperClass="no-pe" style={{ pointerEvents: "none" }}>
                  <div className="seat-pin">{id}</div>
                </Html>
              </Billboard>
            )}
          </group>
        );
      })}
    </group>
  );
}

function HoverTag() {
  const hovered = useCinema((s) => s.hovered);
  const mode = useCinema((s) => s.mode);
  const showtimeId = useCinema((s) => s.showtimeId);
  const bookings = useCinema((s) => s.bookings);
  const view = useCinema((s) => s.view);
  const selected = useCinema((s) => s.selected);
  if (!hovered || view.kind === "seat") return null;
  const s = SEAT_BY_ID.get(hovered);
  if (!s) return null;
  const taken = takenSet(showtimeId, bookings).has(s.id);
  return (
    <Html position={[s.x, s.y + 1.35, s.z]} center zIndexRange={[30, 0]} pointerEvents="none" wrapperClass="no-pe" style={{ pointerEvents: "none" }}>
      <div className="seat-tag">
        <strong>{s.id}</strong>
        <span>
          {CATEGORY_LABEL[s.category]} · {pkr(PRICES[s.category])}
        </span>
        {mode === "select" && (
          <em className={taken ? "taken" : ""}>{taken ? "Already booked" : selected.includes(s.id) ? "Selected · click to remove" : "Click to select"}</em>
        )}
        {mode === "explore" && <em>Click for options</em>}
      </div>
    </Html>
  );
}

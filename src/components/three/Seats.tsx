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

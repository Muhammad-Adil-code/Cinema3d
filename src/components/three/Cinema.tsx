"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { useCinema } from "@/lib/store";
import { Room } from "./Room";
import { Screen } from "./Screen";
import { Seats } from "./Seats";
import { CameraRig, PanelOffset, WalkControls } from "./Controls";
import { lighting } from "./lighting";

export function isMobile() {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

/** Eases house lights up/down and drives the ambient + wall lights from it. */
export function Lights({ floor = 0 }: { floor?: number }) {
  const hemi = useRef<THREE.HemisphereLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const left = useRef<THREE.PointLight>(null);
  const right = useRef<THREE.PointLight>(null);
  const back = useRef<THREE.PointLight>(null);
  useFrame((_, dt) => {
    const { houseLights, mode } = useCinema.getState();
    const target = Math.max(houseLights ? 1 : mode === "select" ? 0.7 : 0, floor);
    lighting.house = THREE.MathUtils.damp(lighting.house, target, 2.2, Math.min(dt, 0.1));
    const h = lighting.house;
    if (hemi.current) hemi.current.intensity = 0.22 + h * 0.85;
    if (amb.current) {
      amb.current.color.copy(lighting.screen);
      amb.current.intensity = 0.25 * lighting.screenLevel;
    }
    for (const l of [left.current, right.current]) if (l) l.intensity = 4 + h * 55;
    if (back.current) back.current.intensity = 2 + h * 30;
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={["#ffd9b0", "#1a1030", 0.2]} />
      <ambientLight ref={amb} />
      <pointLight ref={left} position={[-9, 6.5, -2]} color="#ffb070" distance={22} decay={1.6} />
      <pointLight ref={right} position={[9, 6.5, -2]} color="#ffb070" distance={22} decay={1.6} />
      <pointLight ref={back} position={[0, 8.5, 5]} color="#ffd0a0" distance={20} decay={1.6} />
    </>
  );
}

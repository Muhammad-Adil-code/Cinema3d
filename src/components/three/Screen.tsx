"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { getMovie, type Movie } from "@/lib/movies";
import { ROOM, SCREEN, SCREEN_CENTER } from "@/lib/layout";
import { useCinema } from "@/lib/store";
import { lighting } from "./lighting";

RectAreaLightUniformsLib.init();

const SCENE_LENGTH = 14;
const ASPECT = SCREEN.width / SCREEN.height;
const PROJECTOR: [number, number, number] = [0, 8.2, ROOM.maxZ - 0.1];

function curvedPlane(width: number, height: number) {
  const geo = new THREE.PlaneGeometry(width, height, 64, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, (x * x) / (2 * SCREEN.curveRadius));
  }
  geo.computeVertexNormals();
  return geo;
}

function titleTexture(movie: Movie) {
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = Math.round(2048 / ASPECT);
  const g = c.getContext("2d")!;
  const cx = c.width / 2;
  const cy = c.height / 2;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "rgba(255,255,255,0.75)";
  g.font = "600 46px 'Arial', sans-serif";
  g.letterSpacing = "18px";
  g.fillText("CINESEAT PRESENTS", cx, cy - 210);
  g.letterSpacing = "10px";
  g.font = "900 230px 'Impact', 'Arial Black', sans-serif";
  g.shadowColor = movie.colors[2];
  g.shadowBlur = 60;
  g.fillStyle = "#ffffff";
  g.fillText(movie.title.toUpperCase(), cx, cy);
  g.shadowBlur = 0;
  g.letterSpacing = "4px";
  g.font = "italic 400 60px Georgia, serif";
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.fillText(movie.tagline, cx, cy + 190);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

const movieVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

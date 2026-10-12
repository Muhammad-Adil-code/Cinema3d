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

const movieFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2;
  uniform sampler2D uTitle;
  uniform float uAspect;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise1(float x) { float i = floor(x), f = fract(x); return mix(hash(vec2(i, 0.)), hash(vec2(i + 1., 0.)), smoothstep(0., 1., f)); }
  float noise2(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm1(float x) { float v = 0., a = .5; for (int i = 0; i < 5; i++) { v += a * noise1(x); x *= 2.03; a *= .5; } return v; }
  float fbm2(vec2 p) { float v = 0., a = .5; for (int i = 0; i < 5; i++) { v += a * noise2(p); p *= 2.02; a *= .5; } return v; }

  vec3 mountains(vec2 p, float t, float seed, float sunMul) {
    vec3 sky = mix(uC1 * 0.95, uC0 * 0.55, smoothstep(0.15, 1.0, p.y));
    vec2 sun = vec2(uAspect * (0.5 + (seed > 0.5 ? 0.3 : -0.3)), 0.42 - t * 0.008);
    float d = length(p - sun);
    sky += uC2 * (1.1 * smoothstep(0.075, 0.07, d) + 0.55 * exp(-d * 6.0)) * sunMul;
    sky += step(0.996, hash(floor(p * 220.))) * smoothstep(0.55, 0.95, p.y) * 0.9;
    vec3 col = sky;
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      float h = 0.46 - fi * 0.09 + 0.2 * (fbm1(p.x * (1.1 + fi * 0.8) + t * (0.03 + fi * 0.05) + seed * 9. + fi * 7.) - 0.5);
      float m = smoothstep(h + 0.004, h - 0.004, p.y);
      vec3 mc = mix(uC1 * 0.5, uC0 * 0.12, fi / 3.);
      mc = mix(mc, sky, 0.55 * (1. - fi / 3.));
      col = mix(col, mc, m);
    }
    // low mist
    col += uC2 * 0.12 * smoothstep(0.35, 0.0, p.y) * (0.6 + 0.4 * noise2(vec2(p.x * 3. + t * 0.2, t * 0.1)));
    return col;
  }

  vec3 city(vec2 p, float t, float seed) {
    vec3 col = mix(uC1 * 0.35, uC0 * 0.35, smoothstep(0.1, 1.0, p.y));
    vec2 moon = vec2(uAspect * 0.78, 0.8);
    float md = length(p - moon);
    col += vec3(1.0, 0.95, 0.9) * (smoothstep(0.05, 0.046, md) * 0.9 + 0.25 * exp(-md * 8.));
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float scale = 9.0 + fi * 6.0;
      float x = p.x * scale + t * (0.25 + fi * 0.45) + seed * 13.;
      float id = floor(x);
      float bh = 0.72 - fi * 0.17 - 0.3 * hash(vec2(id, fi + seed));
      if (p.y < bh) {
        vec3 bc = mix(uC0 * 0.22, vec3(0.008), fi / 2.);
        vec2 w = vec2(fract(x) * 5.0, p.y * (70.0 + fi * 25.));
        vec2 wi = floor(w) + vec2(id * 7.0, fi * 31.0);
        float inWin = step(0.2, fract(w.x)) * step(fract(w.x), 0.75) * step(0.25, fract(w.y)) * step(fract(w.y), 0.7);
        float lit = step(0.58, hash(wi)) * inWin * step(0.03, hash(wi + floor(t * 1.5)));
        bc += lit * mix(uC2, uC1 * 1.3, hash(wi + 3.)) * (1.0 - fi * 0.22);
        // neon sign
        float sign = step(0.93, hash(vec2(id, fi + 2.))) * smoothstep(0.01, 0.0, abs(p.y - bh + 0.06)) * step(0.15, fract(x)) * step(fract(x), 0.85);
        bc += sign * uC2 * 2.0 * (0.7 + 0.3 * sin(t * 12. + id));
        col = bc;
      }
    }
    vec2 rp = vec2(p.x * 90. + p.y * 10., p.y * 5. + t * 7.);
    col += step(0.975, hash(floor(rp))) * fract(rp.y) * 0.18 * (uC2 + 0.3);
    return col;
  }

  vec3 warp(vec2 p, float t) {
    vec2 c = p - vec2(uAspect * 0.5, 0.5);
    float r = length(c);
    float a = atan(c.y, c.x);
    vec3 col = uC0 * 0.25 + uC1 * 0.45 * fbm2(c * 2.5 + vec2(t * 0.06, -t * 0.04)) * smoothstep(1.4, 0.1, r);
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float bins = 70. + fi * 50.;
      float ab = a / 6.2831853 * bins;
      float id = floor(ab);
      float h = hash(vec2(id, fi));
      float z = fract(h + t * (0.18 + 0.07 * fi + h * 0.1));
      float pos = z * z * 1.7;
      float len = 0.02 + z * 0.25;
      float radial = smoothstep(pos - len, pos, r) * smoothstep(pos + 0.005, pos, r);
      float thin = smoothstep(0.12, 0.0, abs(fract(ab) - 0.5) - 0.02 / max(r, 0.05));
      col += radial * thin * mix(vec3(1.), uC2, h) * (0.6 + z);
    }
    col += uC2 * 0.4 * exp(-r * 9.);
    return col;
  }

  void main() {
    vec2 p = vec2(vUv.x * uAspect, vUv.y);
    float k = floor(uTime / ${SCENE_LENGTH.toFixed(1)});
    float s = uTime - k * ${SCENE_LENGTH.toFixed(1)};
    float seed = hash(vec2(k, 4.2));
    float kind = mod(k, 3.0);
    float tIn = kind < 0.5 ? smoothstep(0.8, 2.0, s) * smoothstep(6.0, 4.8, s) : 0.0;
    vec3 col = kind < 0.5 ? mountains(p, s, seed, 1.0 - smoothstep(0.3, 1.2, s) * smoothstep(7.5, 6.2, s)) : (kind < 1.5 ? city(p, s, seed) : warp(p, s));

    if (kind < 0.5) {
      vec4 title = texture2D(uTitle, vUv);
      col = mix(col, col * 0.3, tIn * 0.7);
      col += title.rgb * title.a * tIn * 1.15;
    }

    float fade = smoothstep(0.0, 0.7, s) * smoothstep(${SCENE_LENGTH.toFixed(1)}, ${(SCENE_LENGTH - 0.8).toFixed(1)}, s);
    vec2 v = vUv - 0.5;
    col *= 1.0 - dot(v, v) * 0.9;
    col += (hash(vUv * 900. + fract(uTime) * 50.) - 0.5) * 0.04;
    gl_FragColor = vec4(max(col, 0.0) * fade * 1.1, 1.0);
  }
`;

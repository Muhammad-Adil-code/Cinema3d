import * as THREE from "three";

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return [c, c.getContext("2d")!] as const;
}

let carpet: THREE.CanvasTexture | null = null;
/** Dark patterned cinema carpet; repeats every 2 m with world-space UVs. */
export function carpetTexture() {
  if (carpet) return carpet;
  const [c, g] = canvas(512);
  g.fillStyle = "#151026";
  g.fillRect(0, 0, 512, 512);
  // fibre noise
  const img = g.getImageData(0, 0, 512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 22;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n * 1.2;
  }
  g.putImageData(img, 0, 0);
  // classic cinema confetti pattern
  const colors = ["#3b2a78", "#7a2350", "#c9963a", "#23476b"];
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    g.save();
    g.translate(x, y);
    g.rotate(Math.random() * Math.PI);
    g.fillStyle = colors[i % colors.length];
    g.globalAlpha = 0.55;
    const kind = i % 3;
    if (kind === 0) g.fillRect(-10, -2, 20, 4);
    else if (kind === 1) {
      g.beginPath();
      g.arc(0, 0, 5, 0, Math.PI * 2);
      g.fill();
    } else {
      g.beginPath();
      g.moveTo(0, -7);
      g.lineTo(6, 5);
      g.lineTo(-6, 5);
      g.closePath();
      g.fill();
    }
    g.restore();
  }
  carpet = new THREE.CanvasTexture(c);
  carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping;
  carpet.colorSpace = THREE.SRGBColorSpace;
  carpet.anisotropy = 8;
  return carpet;
}

let fabric: THREE.CanvasTexture | null = null;
/** Woven acoustic fabric for wall panels. */
export function fabricTexture() {
  if (fabric) return fabric;
  const [c, g] = canvas(256);
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    g.fillStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.08})`;
    g.fillRect(0, y, 256, 1);
  }
  for (let x = 0; x < 256; x += 2) {
    g.fillStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.05})`;
    g.fillRect(x, 0, 1, 256);
  }
  fabric = new THREE.CanvasTexture(c);
  fabric.wrapS = fabric.wrapT = THREE.RepeatWrapping;
  fabric.repeat.set(3, 6);
  return fabric;
}

let glow: THREE.CanvasTexture | null = null;
/** Soft radial falloff for light washes on walls. */
export function glowTexture() {
  if (glow) return glow;
  const [c, g] = canvas(128);
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.35)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  glow = new THREE.CanvasTexture(c);
  return glow;
}

/**
 * Box with UVs in world metres (scaled), so a single repeating texture tiles
 * consistently across many boxes of different sizes once they are merged.
 */
export function worldBox(w: number, h: number, d: number, x: number, y: number, z: number, uvScale = 0.5) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.translate(x, y, z);
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    const px = pos.getX(i);
    const py = pos.getY(i);
    const pz = pos.getZ(i);
    if (ny > 0.5) uv.setXY(i, px * uvScale, pz * uvScale);
    else if (nx > 0.5) uv.setXY(i, pz * uvScale, py * uvScale);
    else uv.setXY(i, px * uvScale, py * uvScale);
  }
  return geo;
}

let lobby: THREE.CanvasTexture | null = null;

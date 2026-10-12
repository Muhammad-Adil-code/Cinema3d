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

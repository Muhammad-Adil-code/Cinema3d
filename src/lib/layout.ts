// Geometry of Hall 1, in metres. The screen is at -Z, the audience faces -Z,
// the entrance / projection booth is at +Z. Rows rise stadium-style.

export type Category = "standard" | "premium" | "recliner";

export interface Seat {
  id: string;
  row: string;
  num: number;
  x: number;
  /** Floor height of the tier this seat stands on. */
  y: number;
  z: number;
  category: Category;
}

export interface Row {
  letter: string;
  z: number;
  y: number;
  depth: number;
  recliner: boolean;
  seats: Seat[];
}

export const ROOM = { minX: -11, maxX: 11, minZ: -14, maxZ: 9, height: 10.5 };

export const SCREEN = { width: 16, height: 6.7, bottom: 2.3, z: -13.7, curveRadius: 45 };
export const SCREEN_CENTER: [number, number, number] = [0, SCREEN.bottom + SCREEN.height / 2, SCREEN.z];

export const STAGE = { front: -11.6, back: ROOM.minZ, height: 0.55, halfWidth: 9.2 };

export const PRICES: Record<Category, number> = { standard: 1000, premium: 1500, recliner: 2800 };
export const CATEGORY_LABEL: Record<Category, string> = {
  standard: "Standard",
  premium: "Premium",
  recliner: "Recliner",
};

const LETTERS = "ABCDEFGHIJK".split("");
const RISE = 0.36;
const ROW_DEPTH = 1.12;
const RECLINER_DEPTH = 1.7;
export const SEAT_PITCH = 0.62;
export const RECLINER_PITCH = 0.98;
const FIRST_ROW_Z = -7;

/** Seating blocks as x-spans, separated by two aisles centred at x = ±5.04 (1.4 m wide). */
export const AISLE_X = 5.04;
export const AISLE_WIDTH = 1.4;
const BLOCKS: [number, number][] = [
  [-8.84, -AISLE_X - AISLE_WIDTH / 2],
  [-AISLE_X + AISLE_WIDTH / 2, AISLE_X - AISLE_WIDTH / 2],
  [AISLE_X + AISLE_WIDTH / 2, 8.84],
];

function categoryFor(index: number, recliner: boolean): Category {
  if (recliner) return "recliner";
  return index < 3 ? "standard" : "premium";
}

function buildRows(): Row[] {
  const rows: Row[] = [];
  let z = FIRST_ROW_Z;
  LETTERS.forEach((letter, i) => {
    const recliner = i === LETTERS.length - 1;
    const depth = recliner ? RECLINER_DEPTH : ROW_DEPTH;
    if (i > 0) z += rows[i - 1].depth / 2 + depth / 2;
    const y = i * RISE;
    const pitch = recliner ? RECLINER_PITCH : SEAT_PITCH;
    const seatZ = z + (recliner ? 0.2 : 0.1);
    const seats: Seat[] = [];
    let num = 1;
    for (const [a, b] of BLOCKS) {
      const n = Math.floor((b - a) / pitch + 1e-6);
      const start = (a + b) / 2 - (n * pitch) / 2 + pitch / 2;
      for (let k = 0; k < n; k++) {
        seats.push({
          id: `${letter}${num}`,
          row: letter,
          num,
          x: start + k * pitch,
          y,
          z: seatZ,
          category: categoryFor(i, recliner),
        });
        num++;
      }
    }
    rows.push({ letter, z, y, depth, recliner, seats });
  });
  return rows;
}

export const ROWS = buildRows();
export const SEATS = ROWS.flatMap((r) => r.seats);
export const SEAT_BY_ID = new Map(SEATS.map((s) => [s.id, s]));

export interface Tier {
  zStart: number;
  zEnd: number;
  y: number;
}

const lastRow = ROWS[ROWS.length - 1];
export const BACK_WALKWAY_Y = lastRow.y + RISE;

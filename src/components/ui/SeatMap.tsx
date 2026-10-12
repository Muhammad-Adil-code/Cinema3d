"use client";

import { useMemo } from "react";
import { ROWS } from "@/lib/layout";
import { takenSet, useCinema } from "@/lib/store";

const FILL = { standard: "#a3263a", premium: "#c9343f", recliner: "#8a49b5" } as const;

/** 2D mini-map mirroring the real 3D seat positions. Screen at the top. */
export function SeatMap() {
  const selected = useCinema((s) => s.selected);
  const hovered = useCinema((s) => s.hovered);
  const showtimeId = useCinema((s) => s.showtimeId);
  const bookings = useCinema((s) => s.bookings);
  const toggleSeat = useCinema((s) => s.toggleSeat);
  const setHovered = useCinema((s) => s.setHovered);
  const taken = useMemo(() => takenSet(showtimeId, bookings), [showtimeId, bookings]);

  const rowGap = 0.78;
  const top = 1.6;
  const height = top + ROWS.length * rowGap + 0.5;

  return (
    <svg viewBox={`-10 0 20 ${height}`} className="w-full select-none" role="group" aria-label="Seat map">
      <defs>
        <linearGradient id="scr" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f5c451" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f5c451" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M -8 0.55 Q 0 -0.05 8 0.55" stroke="#f5c451" strokeWidth="0.12" fill="none" strokeLinecap="round" />
      <path d="M -8 0.55 Q 0 -0.05 8 0.55 L 6.5 1.3 Q 0 0.85 -6.5 1.3 Z" fill="url(#scr)" opacity="0.18" />
      <text x="0" y="1.05" textAnchor="middle" fontSize="0.42" fill="#9a93a8" letterSpacing="0.2">
        SCREEN
      </text>
      {ROWS.map((r, ri) => {
        const y = top + ri * rowGap + (r.recliner ? 0.15 : 0);
        const w = r.recliner ? 0.82 : 0.5;
        const h = r.recliner ? 0.58 : 0.5;
        return (
          <g key={r.letter}>
            <text x={-9.75} y={y + h / 2 + 0.15} fontSize="0.4" fill="#9a93a8" textAnchor="middle">
              {r.letter}
            </text>
            <text x={9.75} y={y + h / 2 + 0.15} fontSize="0.4" fill="#9a93a8" textAnchor="middle">
              {r.letter}
            </text>
            {r.seats.map((s) => {
              const isTaken = taken.has(s.id);
              const isSel = selected.includes(s.id);
              const fill = isSel ? "#f5c451" : isTaken ? "#3a3942" : hovered === s.id ? "#ff9a6a" : FILL[s.category];
              return (
                <rect
                  key={s.id}
                  x={s.x - w / 2}
                  y={y}
                  width={w}
                  height={h}
                  rx={0.12}
                  fill={fill}
                  stroke={isSel ? "#fff3c4" : "none"}
                  strokeWidth={0.06}
                  className={isTaken ? "cursor-not-allowed" : "cursor-pointer"}
                  onClick={() => toggleSeat(s.id)}
                  onPointerEnter={() => setHovered(s.id)}
                  onPointerLeave={() => setHovered(null)}
                >
                  <title>{`${s.id}${isTaken ? " — booked" : ""}`}</title>
                </rect>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export function Legend() {
  const items = [
    ["#a3263a", "Standard"],
    ["#c9343f", "Premium"],
    ["#8a49b5", "Recliner"],
    ["#f5c451", "Selected"],
    ["#3a3942", "Booked"],
  ];
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-muted">
      {items.map(([c, l]) => (
        <span key={l} className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: c }} />
          {l}
        </span>
      ))}
    </div>
  );
}

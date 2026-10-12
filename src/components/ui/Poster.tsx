import type { Movie } from "@/lib/movies";

/** Illustrated SVG poster art per movie, so the project ships without image assets. */
export function Poster({ movie, className = "", showTitle = true }: { movie: Movie; className?: string; showTitle?: boolean }) {
  return (
    <div className={`grain relative overflow-hidden rounded-2xl bg-black ${className}`}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        {movie.id === "neon-monsoon" && <NeonMonsoon />}
        {movie.id === "last-caravan" && <LastCaravan />}
        {movie.id === "lahore-nights" && <LahoreNights />}
      </svg>
      {showTitle && (
        <>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">{movie.genre}</p>
            <h3 className="font-display text-3xl leading-none text-white drop-shadow-lg">{movie.title}</h3>
          </div>
        </>
      )}
    </div>
  );
}

function rng(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function NeonMonsoon() {
  const r = rng(7);
  const back = Array.from({ length: 16 }, (_, i) => ({ x: i * 26 - 6, w: 22 + r() * 8, h: 90 + r() * 110 }));
  const front = Array.from({ length: 11 }, (_, i) => ({ x: i * 38 - 10, w: 30 + r() * 10, h: 60 + r() * 90 }));
  const rain = Array.from({ length: 70 }, () => ({ x: r() * 420, y: r() * 300, l: 10 + r() * 18 }));
  const windows = front.flatMap((b, bi) =>
    Array.from({ length: Math.floor(b.h / 12) * 3 }, (_, k) => ({
      x: b.x + 5 + (k % 3) * ((b.w - 10) / 3),
      y: 300 - b.h + 8 + Math.floor(k / 3) * 12,
      on: r() > 0.55,
      c: (bi + k) % 4 === 0 ? "#ff3cac" : "#00e5ff",
    })),
  );
  return (
    <>
      <defs>
        <linearGradient id="nm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#12062b" />
          <stop offset="0.6" stopColor="#3b1170" />
          <stop offset="1" stopColor="#7b2ff7" />
        </linearGradient>
        <radialGradient id="nm-glow" cx="0.5" cy="0.95" r="0.6">
          <stop offset="0" stopColor="#00e5ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#00e5ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill="url(#nm-sky)" />
      <rect width="400" height="300" fill="url(#nm-glow)" />
      {back.map((b, i) => (
        <rect key={i} x={b.x} y={300 - b.h} width={b.w} height={b.h} fill="#1d0d3d" />
      ))}
      {front.map((b, i) => (
        <rect key={i} x={b.x} y={300 - b.h} width={b.w} height={b.h} fill="#0a0518" />
      ))}
      {windows.map((w, i) => w.on && <rect key={i} x={w.x} y={w.y} width="5" height="6" fill={w.c} opacity="0.85" />)}
      <rect x="250" y="168" width="70" height="14" rx="3" fill="none" stroke="#ff3cac" strokeWidth="2.5" style={{ filter: "drop-shadow(0 0 6px #ff3cac)" }} />
      {rain.map((d, i) => (
        <line key={i} x1={d.x} y1={d.y} x2={d.x - 4} y2={d.y + d.l} stroke="#9ff6ff" strokeOpacity="0.35" strokeWidth="1" />
      ))}
    </>
  );
}

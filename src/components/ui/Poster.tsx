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

function LastCaravan() {
  const camels = [
    [90, 228, 1],
    [140, 232, 0.92],
    [185, 236, 0.85],
    [225, 239, 0.78],
  ] as const;
  return (
    <>
      <defs>
        <linearGradient id="lc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a1206" />
          <stop offset="0.55" stopColor="#c2501f" />
          <stop offset="1" stopColor="#ffcf7a" />
        </linearGradient>
        <radialGradient id="lc-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff2c4" />
          <stop offset="0.5" stopColor="#ffd27a" />
          <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill="url(#lc-sky)" />
      <circle cx="270" cy="170" r="70" fill="url(#lc-sun)" />
      <circle cx="270" cy="170" r="30" fill="#fff0c0" />
      <path d="M0 210 Q80 180 160 205 T330 195 T400 200 V300 H0Z" fill="#a8461c" />
      <path d="M0 240 Q100 215 200 240 T400 230 V300 H0Z" fill="#6e2a10" />
      {camels.map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`} fill="#2a0d04">
          <path d="M0 0 q6 -16 16 -14 q6 -12 14 0 q6 -2 10 -10 l4 -2 l2 6 l-6 6 q-2 10 -8 14 v16 h-3 v-14 h-14 v14 h-3 v-16 q-8 0 -12 -4z" />
        </g>
      ))}
      <g fill="#2a0d04" transform="translate(60 230)">
        <circle cx="0" cy="-22" r="3" />
        <rect x="-2" y="-19" width="4" height="14" />
        <rect x="-2" y="-5" width="1.6" height="8" />
        <rect x="0.4" y="-5" width="1.6" height="8" />
      </g>
    </>
  );
}

function LahoreNights() {
  const r = rng(3);
  const stars = Array.from({ length: 45 }, () => ({ x: r() * 400, y: r() * 150, s: 0.5 + r() * 1.2 }));
  const lanterns = Array.from({ length: 9 }, (_, i) => ({ x: 20 + i * 45, y: 60 + Math.sin(i) * 10 }));
  return (
    <>
      <defs>
        <linearGradient id="ln-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#050c1c" />
          <stop offset="0.65" stopColor="#1a2550" />
          <stop offset="1" stopColor="#c2185b" />
        </linearGradient>
        <radialGradient id="ln-moon" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff5d6" />
          <stop offset="0.45" stopColor="#ffe9a8" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ln-sky)" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity="0.7" />
      ))}
      <circle cx="310" cy="80" r="44" fill="url(#ln-moon)" />
      <circle cx="310" cy="80" r="17" fill="#fff3cf" />
      <path d="M0 62 Q100 82 200 64 T400 66" stroke="#ffb300" strokeOpacity="0.35" fill="none" />
      {lanterns.map((l, i) => (
        <g key={i}>
          <circle cx={l.x} cy={l.y + 10} r="7" fill="#ffb300" opacity="0.18" />
          <rect x={l.x - 2.5} y={l.y + 6} width="5" height="8" rx="2" fill="#ffc94d" />
        </g>
      ))}
      {/* mosque silhouette: three domes, four minarets */}
      <g fill="#07070f">
        <rect x="110" y="215" width="180" height="85" />
        <path d="M200 215 q0 -50 -34 -56 q34 -14 34 -34 q0 20 34 34 q-34 6 -34 56z" />
        <ellipse cx="200" cy="200" rx="42" ry="36" />
        <rect x="198" y="148" width="4" height="18" />
        <ellipse cx="148" cy="212" rx="22" ry="18" />
        <ellipse cx="252" cy="212" rx="22" ry="18" />
        {[100, 132, 268, 300].map((x, i) => (
          <g key={x}>
            <rect x={x - 5} y={i % 3 === 0 ? 140 : 170} width="10" height="160" />
            <path d={`M${x - 8} ${i % 3 === 0 ? 140 : 170} h16 l-8 -16z`} />
          </g>
        ))}
        <path d="M0 260 h70 v-30 h20 v30 h30 v40 H0z" />
        <path d="M300 250 h40 v-20 h18 v20 h42 v50 H300z" />
      </g>
      <rect y="292" width="400" height="8" fill="#c2185b" opacity="0.5" />
    </>
  );
}

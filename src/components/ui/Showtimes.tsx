"use client";

import { formatDate, formatTime, parseShowtime, showtimeId, TIMES, upcomingDates } from "@/lib/movies";
import { useCinema } from "@/lib/store";

export function Showtimes({ compact = false }: { compact?: boolean }) {
  const current = useCinema((s) => s.showtimeId);
  const movieId = useCinema((s) => s.movieId);
  const setShowtime = useCinema((s) => s.setShowtime);
  const st = parseShowtime(current);
  const dates = upcomingDates();
  const date = st?.date ?? dates[0];
  const now = new Date();
  const nowHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {dates.map((d, i) => (
          <button
            key={d}
            className="chip disabled:cursor-not-allowed disabled:opacity-30"
            data-active={d === date}
            disabled={i === 0 && !TIMES.some((x) => x > nowHHMM)}
            onClick={() => {
              const t = i === 0 ? TIMES.find((x) => x > nowHHMM) : (st?.time ?? TIMES[0]);
              if (t) setShowtime(showtimeId(movieId, d, t));
            }}
          >
            {i === 0 ? "Today" : i === 1 ? "Tomorrow" : formatDate(d, { weekday: "short", day: "numeric" })}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {TIMES.map((t) => {
          const past = date === dates[0] && t <= nowHHMM;
          return (
            <button
              key={t}
              disabled={past}
              className="chip disabled:cursor-not-allowed disabled:opacity-30"
              data-active={st?.time === t && st?.date === date}
              onClick={() => setShowtime(showtimeId(movieId, date, t))}
            >
              {formatTime(t)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

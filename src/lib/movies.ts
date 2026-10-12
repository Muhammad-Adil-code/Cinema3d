export interface Movie {
  id: string;
  title: string;
  tagline: string;
  genre: string;
  runtime: string;
  rating: string;
  score: number;
  synopsis: string;
  /** Poster gradient stops, also used to colour the procedural trailer on the 3D screen. */
  colors: [string, string, string];
  /** Sky / mid / ground palette for the on-screen trailer shader (linear-ish RGB 0..1). */
  palette: [number, number, number][];
}

export const MOVIES: Movie[] = [
  {
    id: "neon-monsoon",
    title: "Neon Monsoon",
    tagline: "The storm remembers everything.",
    genre: "Sci-Fi · Thriller",
    runtime: "2h 14m",
    rating: "PG-13",
    score: 8.4,
    synopsis:
      "In a flooded megacity where memories are traded like currency, a courier discovers the monsoon itself is recording every life it touches — and someone wants the tape erased.",
    colors: ["#1b0b3a", "#7b2ff7", "#00e5ff"],
    palette: [
      [0.08, 0.03, 0.22],
      [0.55, 0.18, 0.85],
      [0.0, 0.85, 1.0],
    ],
  },
  {
    id: "last-caravan",
    title: "The Last Caravan",
    tagline: "Across the dunes, one promise left.",
    genre: "Adventure · Drama",
    runtime: "2h 31m",
    rating: "PG",
    score: 8.1,
    synopsis:
      "A retired camel trader leads one final caravan across the Thar to deliver a letter that could end a forty-year family feud — if the desert lets them through.",
    colors: ["#2b1105", "#d9622b", "#ffd27a"],
    palette: [
      [0.25, 0.07, 0.03],
      [0.95, 0.45, 0.15],
      [1.0, 0.85, 0.5],
    ],
  },
  {
    id: "lahore-nights",
    title: "Lahore Nights",
    tagline: "Some cities never let you go.",
    genre: "Romance · Music",
    runtime: "1h 58m",
    rating: "PG",
    score: 7.9,
    synopsis:
      "A qawwali singer and a street-food photographer cross paths over one long Ramadan night in the Walled City, chasing a song neither of them can finish alone.",
    colors: ["#0a1a2f", "#c2185b", "#ffb300"],
    palette: [
      [0.03, 0.08, 0.2],
      [0.8, 0.12, 0.4],
      [1.0, 0.7, 0.1],
    ],
  },
];

export const HALL = { name: "Hall 1", format: "Dolby Atmos · Laser", screen: "16 m curved screen" };

export const TIMES = ["12:30", "15:45", "19:00", "22:15"];

export interface Showtime {
  id: string;
  movieId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today + next two days. */
export function upcomingDates(): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    out.push(isoDate(d));
  }
  return out;
}

export function showtimeId(movieId: string, date: string, time: string) {
  return `${movieId}_${date}_${time}`;
}

export function parseShowtime(id: string): Showtime | null {
  const [movieId, date, time] = id.split("_");
  if (!movieId || !date || !time) return null;
  return { id, movieId, date, time };
}

export function defaultShowtime(movieId = MOVIES[0].id): string {
  const today = upcomingDates()[0];
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const next = TIMES.find((t) => t > hhmm);
  if (next) return showtimeId(movieId, today, next);
  return showtimeId(movieId, upcomingDates()[1], TIMES[0]);
}

export function getMovie(id: string): Movie {
  return MOVIES.find((m) => m.id === id) ?? MOVIES[0];
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", opts);
}

export function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function pkr(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

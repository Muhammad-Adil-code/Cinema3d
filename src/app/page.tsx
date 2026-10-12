"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeroVideo } from "@/components/ui/HeroVideo";
import { Logo } from "@/components/ui/Logo";
import { ArrowRight, Check, ChevronDown, Film, Rotate3d, Ticket } from "lucide-react";
import { Poster } from "@/components/ui/Poster";
import { Showtimes } from "@/components/ui/Showtimes";
import { useHydrated } from "@/lib/hydrate";
import { defaultShowtime, formatDate, formatTime, getMovie, HALL, MOVIES, parseShowtime } from "@/lib/movies";
import { useCinema } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const hydrated = useHydrated();
  const movieId = useCinema((s) => s.movieId);
  const showtimeId = useCinema((s) => s.showtimeId);
  const setShowtime = useCinema((s) => s.setShowtime);
  const bookings = useCinema((s) => s.bookings);
  const movie = getMovie(movieId);
  const st = parseShowtime(showtimeId);

  // Home always shows the hall in "movie playing" mode.
  useEffect(() => {
    useCinema.setState({ mode: "explore", houseLights: false, view: { kind: "overview" }, inspect: null, hovered: null });
  }, []);

  return (
    <main className="min-h-screen bg-bg">
      {/* ---------------- hero: real audience footage ---------------- */}
      <section className="relative isolate h-[100svh] min-h-[560px] overflow-hidden bg-black">
        <HeroVideo className="absolute inset-0 -z-10 h-full w-full object-cover" />
        {/* readability gradients */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />

        <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Logo />
          <div className="flex items-center gap-2">
            {hydrated && bookings.length > 0 && (
              <Link href={`/ticket?id=${bookings[bookings.length - 1].id}`} className="btn btn-ghost btn-sm">
                <Ticket /> My ticket
              </Link>
            )}
            <a href="#movies" className="btn btn-ghost btn-sm hidden sm:inline-flex">
              <Film /> Movies
            </a>
          </div>
        </nav>

        <div className="relative mx-auto flex h-[calc(100%-88px)] max-w-6xl flex-col justify-center px-5 pb-24">
          <div className="fade-up max-w-2xl space-y-6">
            <p className="badge border border-white/15 bg-black/40 text-white/85 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              Now showing in {HALL.name} · {HALL.format}
            </p>
            <h1 className="font-display text-6xl leading-[0.9] drop-shadow-2xl sm:text-7xl md:text-8xl">
              See your seat
              <br />
              <span className="text-gold">before you book.</span>
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
              Step inside our cinema in 3D. Walk the aisles, sit in any seat, and watch the screen from exactly where you&apos;ll be sitting.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="btn btn-gold btn-lg" onClick={() => router.push("/book")}>
                <Ticket /> Book a Ticket
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => router.push("/cinema")}>
                <Rotate3d /> See the Cinema in 3D
              </button>
            </div>
            {hydrated && (
              <p className="text-sm text-white/60">
                Now showing: <span className="font-semibold text-white">{movie.title}</span>
                {st && ` · ${formatTime(st.time)}`}
              </p>
            )}
          </div>
        </div>

        <a href="#movies" className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-xs text-white/60 hover:text-white">
          Choose your movie
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </a>
      </section>

      {/* ---------------- choose a movie ---------------- */}
      <section id="movies" className="mx-auto max-w-6xl scroll-mt-6 px-5 pb-20 pt-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Now showing</p>
            <h2 className="font-display text-5xl">Choose your movie</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {MOVIES.map((m) => {
            const active = m.id === movieId;
            return (
              <button
                key={m.id}
                onClick={() => setShowtime(defaultShowtime(m.id))}
                className={`group overflow-hidden rounded-2xl border text-left transition ${active ? "border-gold bg-panel shadow-[0_0_40px_-10px_rgba(245,196,81,0.5)]" : "border-line bg-panel/60 hover:border-white/25"}`}
              >
                <Poster movie={m} showTitle={false} className="aspect-[4/3] w-full rounded-none transition duration-500 group-hover:scale-[1.03]" />
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-2xl">{m.title}</h3>
                    <span className="text-sm text-gold">★ {m.score}</span>
                  </div>
                  <p className="text-xs text-muted">
                    <span className="mr-1 rounded-md border border-white/25 px-1">{m.rating}</span> {m.genre} · {m.runtime}
                  </p>
                  <p className="line-clamp-2 text-sm text-white/65">{m.synopsis}</p>
                  <p className={`pt-1 text-xs font-semibold ${active ? "text-gold" : "text-muted"}`}>{active ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Selected
                      </span>
                    ) : (
                      "Select"
                    )}</p>
                </div>
              </button>
            );
          })}
        </div>

        {hydrated && (
          <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-line bg-panel p-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-sm">
                <span className="font-semibold">{movie.title}</span>
                <span className="text-muted">{st ? ` · ${formatDate(st.date, { weekday: "long", day: "numeric", month: "short" })} · ${formatTime(st.time)}` : ""}</span>
              </p>
              <Showtimes />
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="btn btn-ghost" onClick={() => router.push("/cinema")}>
                <Rotate3d /> Preview in 3D
              </button>
              <button className="btn btn-gold" onClick={() => router.push("/book")}>
                <Ticket /> Pick seats <ArrowRight />
              </button>
            </div>
          </div>
        )}
      </section>

      <footer className="border-t border-line py-8 text-center text-xs text-muted">CineSeat · demo cinema booking · no real payments are taken</footer>
    </main>
  );
}

"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CATEGORY_LABEL, PRICES, SEAT_BY_ID } from "@/lib/layout";
import { formatTime, getMovie, HALL, parseShowtime, pkr } from "@/lib/movies";
import { useHydrated } from "@/lib/hydrate";
import { isTaken, useCinema, type Mode } from "@/lib/store";
import { useWalkKeys } from "../three/Controls";
import { BookingPanel } from "./BookingPanel";
import { Joystick } from "./Joystick";
import { Logo, LogoMark } from "./Logo";
import { ArrowLeft, Armchair, Check, Clapperboard, Footprints, Home, Lightbulb, LightbulbOff, Maximize, Minimize, Rotate3d, Square, Ticket, X } from "lucide-react";

const Cinema = dynamic(() => import("../three/Cinema"), { ssr: false });

export function CinemaExperience({ initialMode }: { initialMode: Mode }) {
  const hydrated = useHydrated();
  const [ready, setReady] = useState(false);
  const [veil, setVeil] = useState(true);
  const mode = useCinema((s) => s.mode);
  const nav = useCinema((s) => s.nav);
  const view = useCinema((s) => s.view);
  const inspect = useCinema((s) => s.inspect);
  const exiting = useCinema((s) => s.exiting);
  const router = useRouter();
  const touch = useSyncExternalStore(
    () => () => {},
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );

  useWalkKeys();

  useEffect(() => {
    const keep = useCinema.getState();
    // Arriving from "Book this seat" keeps the selection; otherwise start fresh.
    useCinema.setState({ mode: initialMode, view: { kind: "overview" }, inspect: null, hovered: null, nav: "orbit", exiting: false, selected: initialMode === "select" ? keep.selected : [] });
  }, [initialMode]);

  useEffect(() => {
    const path = mode === "select" ? "/book" : "/cinema";
    if (window.location.pathname !== path) window.history.replaceState(null, "", path);
  }, [mode]);

  // Leaving the page (Go Back, an exit door, browser back) stops the uploaded video and its sound.
  useEffect(() => () => useCinema.getState().setVideoUrl(null), []);

  // "Your video ended" note fades after a few seconds.
  const videoEnded = useCinema((s) => s.videoEnded);
  useEffect(() => {
    if (!videoEnded) return;
    const t = setTimeout(() => useCinema.setState({ videoEnded: false }), 3500);
    return () => clearTimeout(t);
  }, [videoEnded]);

  // Walked through (or clicked) an exit door: fade to black, then go home.
  useEffect(() => {
    if (!exiting) return;
    const t = setTimeout(() => router.push("/"), 900);
    return () => clearTimeout(t);
  }, [exiting, router]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setVeil(false), 500);
    return () => clearTimeout(t);
  }, [ready]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {hydrated && <Cinema onReady={() => setReady(true)} />}

      <div className="pointer-events-none absolute inset-0">
        <TopBar />
        {view.kind === "seat" && <SeatViewBar />}
        {mode === "explore" && view.kind === "overview" && inspect && <InspectCard />}
        {mode === "explore" && <Dock touch={touch} />}
        {mode === "explore" && nav === "walk" && view.kind === "overview" && touch && (
          <div className="absolute bottom-28 left-5">
            <Joystick />
          </div>
        )}
        {mode === "select" && <BookingPanel />}
        {videoEnded && (
          <div className="absolute inset-x-0 top-20 flex justify-center px-4">
            <p className="glass fade-up flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm">
              <Clapperboard className="h-4 w-4 text-gold" /> Your video ended — back to the trailer
            </p>
          </div>
        )}
      </div>

      <div
        className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black transition-opacity duration-700 ${exiting ? "opacity-100" : "opacity-0"}`}
      >
        <p className="font-display text-4xl tracking-wider text-gold">Thanks for visiting</p>
        <p className="mt-2 text-sm text-muted">Leaving {HALL.name}…</p>
      </div>

      <div
        className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ${veil ? "opacity-100" : "opacity-0"}`}
      >
        <LogoMark className="h-14 w-14" />
        <p className="mt-3 font-display text-4xl tracking-wider text-gold">CineSeat</p>
        <p className="mt-1 text-sm text-muted">Entering {HALL.name}… lights are dimming</p>
        <div className="mt-6 h-0.5 w-40 overflow-hidden rounded bg-white/10">
          <div className={`h-full bg-gold transition-all duration-[1500ms] ${ready ? "w-full" : "w-1/3"}`} />
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  const router = useRouter();
  const mode = useCinema((s) => s.mode);
  const movieId = useCinema((s) => s.movieId);
  const showtimeId = useCinema((s) => s.showtimeId);
  const setMode = useCinema((s) => s.setMode);
  const hydrated = useHydrated();
  const movie = getMovie(movieId);
  // The default showtime depends on the visitor's clock, so only show it once we're in the browser.
  const st = hydrated ? parseShowtime(showtimeId) : null;

  return (
    <header className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent p-3 sm:p-4">
      <div className="pointer-events-auto flex min-w-0 items-center gap-3">
        <Logo size="sm" />
        <div className="hidden min-w-0 border-l border-white/15 pl-3 sm:block">
          <p className="truncate text-sm font-semibold">{movie.title}</p>
          <p className="truncate text-xs text-muted">
            {HALL.name} · {HALL.format}
            {st ? ` · ${formatTime(st.time)}` : ""}
          </p>
        </div>
      </div>
      <div className="pointer-events-auto flex items-center gap-2">
        {mode === "explore" ? (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push("/")}>
              <ArrowLeft /> Go Back
            </button>
            <button className="btn btn-gold btn-sm" onClick={() => setMode("select")}>
              <Ticket /> Book a Ticket
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setMode("explore")}>
              <ArrowLeft /> Back to cinema
            </button>
            <button className="btn btn-ghost btn-sm hidden sm:inline-flex" onClick={() => router.push("/")}>
              <Home /> Home
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function Dock({ touch }: { touch: boolean }) {
  const nav = useCinema((s) => s.nav);
  const view = useCinema((s) => s.view);
  const houseLights = useCinema((s) => s.houseLights);
  const videoUrl = useCinema((s) => s.videoUrl);
  const setNav = useCinema((s) => s.setNav);
  const setHouseLights = useCinema((s) => s.setHouseLights);
  const setVideoUrl = useCinema((s) => s.setVideoUrl);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fs, setFs] = useState(false);

  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  if (view.kind === "seat") return null;

  const hint =
    nav === "walk"
      ? touch
        ? "Joystick to walk · drag to look · tap a seat to sit · walk through an EXIT to leave"
        : "W A S D to walk · Shift to run · drag to look · click a seat to sit · walk through an EXIT to leave"
      : touch
        ? "Drag to rotate · pinch to zoom · two fingers to pan · tap a seat"
        : "Drag to rotate · scroll to zoom · right-drag to pan · click any seat";

  return (
    <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <p className="rounded-lg bg-black/50 px-3 py-1 text-center text-[11px] text-white/70 backdrop-blur">{hint}</p>
      <div className="glass pointer-events-auto flex items-center gap-1 rounded-2xl p-1.5">
        <div className="segmented">
          {(["orbit", "walk"] as const).map((n) => (
            <button key={n} onClick={() => setNav(n)} data-active={nav === n}>
              {n === "orbit" ? <Rotate3d className="h-4 w-4" /> : <Footprints className="h-4 w-4" />}
              {n === "orbit" ? "Orbit" : "Walk"}
            </button>
          ))}
        </div>
        <span className="mx-1 h-6 w-px bg-white/10" />
        <DockButton active={houseLights} onClick={() => setHouseLights(!houseLights)} label={houseLights ? "Dim lights" : "Lights up"}>
          {houseLights ? <LightbulbOff /> : <Lightbulb />}
        </DockButton>
        <DockButton
          active={!!videoUrl}
          label={videoUrl ? "Stop your video" : "Play your own video on the screen"}
          onClick={() => {
            if (videoUrl) setVideoUrl(null);
            else fileRef.current?.click();
          }}
        >
          {videoUrl ? <Square /> : <Clapperboard />}
        </DockButton>
        <DockButton
          active={fs}
          label="Full screen"
          onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())}
        >
          {fs ? <Minimize /> : <Maximize />}
        </DockButton>
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setVideoUrl(URL.createObjectURL(f));
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

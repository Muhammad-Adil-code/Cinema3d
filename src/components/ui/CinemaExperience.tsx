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

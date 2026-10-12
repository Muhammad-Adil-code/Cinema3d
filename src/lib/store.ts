"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultShowtime, MOVIES, parseShowtime } from "./movies";
import { PRICES, SEAT_BY_ID, SEATS } from "./layout";

export const MAX_SEATS = 8;
export const HOLD_MINUTES = 5;

export type Mode = "explore" | "select";
export type Nav = "orbit" | "walk";
export type View = { kind: "overview" } | { kind: "seat"; seatId: string };

export interface Hold {
  showtimeId: string;
  seats: string[];
  expiresAt: number;
}

export interface Booking {
  id: string;
  showtimeId: string;
  seats: string[];
  total: number;
  name: string;
  phone: string;
  email: string;
  method: string;
  createdAt: number;
}

interface State {
  movieId: string;
  showtimeId: string;
  mode: Mode;
  nav: Nav;
  view: View;
  selected: string[];
  hovered: string | null;
  inspect: string | null;
  houseLights: boolean;
  videoUrl: string | null;
  /** Shown briefly after an uploaded video finishes. */
  videoEnded: boolean;
  /** Set when the visitor walks through an exit door; the page fades out and goes home. */
  exiting: boolean;
  bookings: Booking[];
  hold: Hold | null;

  setShowtime: (id: string) => void;
  setMode: (m: Mode) => void;
  setNav: (n: Nav) => void;
  setView: (v: View) => void;
  toggleSeat: (id: string) => void;
  clearSelection: () => void;
  setHovered: (id: string | null) => void;
  setInspect: (id: string | null) => void;
  setHouseLights: (on: boolean) => void;
  setVideoUrl: (url: string | null) => void;
  /** The uploaded video played to the end: drop it and return to the trailer. */
  endVideo: () => void;
  exit: () => void;
  startHold: () => void;
  releaseHold: () => void;
  confirmBooking: (details: Omit<Booking, "id" | "showtimeId" | "seats" | "total" | "createdAt">) => Booking | null;
}

export const useCinema = create<State>()(
  persist(
    (set, get) => ({
      movieId: MOVIES[0].id,
      showtimeId: defaultShowtime(),
      mode: "explore",
      nav: "orbit",
      view: { kind: "overview" },
      selected: [],
      hovered: null,
      inspect: null,
      houseLights: false,
      videoUrl: null,
      videoEnded: false,
      exiting: false,
      bookings: [],
      hold: null,

      setShowtime: (id) => {
        const st = parseShowtime(id);
        set({ showtimeId: id, movieId: st?.movieId ?? get().movieId, selected: [] });
      },
      setMode: (mode) => set({ mode, inspect: null, view: { kind: "overview" }, nav: mode === "select" ? "orbit" : get().nav }),
      setNav: (nav) => set({ nav, view: { kind: "overview" }, inspect: null }),
      setView: (view) => set({ view }),
      toggleSeat: (id) => {
        const { selected, showtimeId, bookings } = get();
        if (isTaken(showtimeId, id, bookings)) return;
        if (selected.includes(id)) set({ selected: selected.filter((s) => s !== id) });
        else if (selected.length < MAX_SEATS) set({ selected: [...selected, id] });
      },
      clearSelection: () => set({ selected: [] }),
      setHovered: (hovered) => set({ hovered }),
      setInspect: (inspect) => set({ inspect }),
      setHouseLights: (houseLights) => set({ houseLights }),
      setVideoUrl: (videoUrl) => {
        const prev = get().videoUrl;
        if (prev && prev !== videoUrl) URL.revokeObjectURL(prev);
        set({ videoUrl, videoEnded: false });
      },
      endVideo: () => {
        const prev = get().videoUrl;
        if (prev) URL.revokeObjectURL(prev);
        set({ videoUrl: null, videoEnded: true });
      },
      exit: () => set({ exiting: true, hovered: null }),
      startHold: () => {
        const { selected, showtimeId } = get();
        if (!selected.length) return;
        set({ hold: { showtimeId, seats: sortSeats(selected), expiresAt: Date.now() + HOLD_MINUTES * 60_000 } });
      },
      releaseHold: () => set({ hold: null }),
      confirmBooking: (details) => {
        const { hold, bookings } = get();
        if (!hold || hold.expiresAt < Date.now()) return null;
        if (hold.seats.some((s) => isTaken(hold.showtimeId, s, bookings))) return null;
        const booking: Booking = {
          ...details,
          id: "CS-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
          showtimeId: hold.showtimeId,
          seats: hold.seats,
          total: totalFor(hold.seats),
          createdAt: Date.now(),
        };
        set({ bookings: [...bookings, booking], hold: null, selected: [] });
        return booking;
      },
    }),
    {
      name: "cineseat",
      skipHydration: true,
      partialize: (s) => ({ movieId: s.movieId, showtimeId: s.showtimeId, bookings: s.bookings, hold: s.hold }),
    },
  ),
);

// ---- occupancy -------------------------------------------------------------

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const presoldCache = new Map<string, Set<string>>();

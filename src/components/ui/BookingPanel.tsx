"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_LABEL, PRICES, SEAT_BY_ID } from "@/lib/layout";
import { formatDate, formatTime, getMovie, HALL, parseShowtime, pkr } from "@/lib/movies";
import { MAX_SEATS, sortSeats, totalFor, useCinema } from "@/lib/store";
import { Legend, SeatMap } from "./SeatMap";
import { Showtimes } from "./Showtimes";
import { ArrowRight, Eye, Map, ScanEye, X } from "lucide-react";

export function BookingPanel() {
  const router = useRouter();
  const selected = useCinema((s) => s.selected);
  const showtimeId = useCinema((s) => s.showtimeId);
  const movieId = useCinema((s) => s.movieId);
  const view = useCinema((s) => s.view);
  const toggleSeat = useCinema((s) => s.toggleSeat);
  const setView = useCinema((s) => s.setView);
  const startHold = useCinema((s) => s.startHold);
  const [open, setOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const movie = getMovie(movieId);
  const st = parseShowtime(showtimeId);
  const seats = sortSeats(selected);
  const total = totalFor(seats);

  const proceed = () => {
    startHold();
    router.push("/checkout");
  };

  const details = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
            {HALL.name} · {HALL.format}
          </p>
          <h2 className="font-display text-3xl leading-tight">{movie.title}</h2>
          {st && (
            <p className="text-sm text-muted">
              {formatDate(st.date, { weekday: "long", day: "numeric", month: "long" })} · {formatTime(st.time)}
            </p>
          )}
        </div>
      </div>
      <Showtimes compact />
      <div className="rounded-xl border border-gold/30 bg-gold/5 p-3 text-sm">
        <p className="font-semibold text-gold">Pick your seats in the 3D hall</p>
        <p className="mt-1 text-xs text-muted">Drag to rotate, scroll or pinch to zoom, then click any seat. Gold = selected, grey = booked.</p>
        <div className="mt-2">
          <Legend />
        </div>
      </div>
      <button className="btn btn-ghost btn-sm w-full" onClick={() => setShowMap((v) => !v)}>
        <Map /> {showMap ? "Hide mini map" : "Show mini map"}
      </button>
      {showMap && (
        <div className="rounded-xl border border-line bg-black/30 p-3">
          <SeatMap />
        </div>
      )}
      <p className="text-xs text-muted">
        Up to {MAX_SEATS} seats. Press <Eye className="inline h-3.5 w-3.5 text-text" /> to see the screen from that seat.
      </p>
    </>
  );

  const summary = (
    <div className="space-y-3">
      {seats.length > 0 && (
        <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
          {seats.map((id) => {
            const s = SEAT_BY_ID.get(id)!;
            const viewing = view.kind === "seat" && view.seatId === id;
            return (
              <li key={id} className="flex items-center gap-2 rounded-xl bg-white/5 py-1.5 pl-3 pr-1.5 text-sm">
                <span className="w-9 font-bold text-gold">{id}</span>
                <span className="flex-1 text-muted">
                  {CATEGORY_LABEL[s.category]} · {pkr(PRICES[s.category])}
                </span>
                <button
                  className="icon-btn icon-btn-sm"
                  data-active={viewing}
                  title={viewing ? "Back to overview" : "View from this seat"}
                  aria-label={viewing ? "Back to overview" : `View from ${id}`}
                  onClick={() => setView(viewing ? { kind: "overview" } : { kind: "seat", seatId: id })}
                >
                  {viewing ? <ScanEye /> : <Eye />}
                </button>
                <button className="icon-btn icon-btn-sm text-muted" onClick={() => toggleSeat(id)} title="Remove" aria-label={`Remove ${id}`}>
                  <X />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">{seats.length ? `${seats.length} seat${seats.length > 1 ? "s" : ""}` : "No seats selected"}</p>
          <p className="font-display text-2xl">{pkr(total)}</p>
        </div>
        <button className="btn btn-gold" disabled={!seats.length} onClick={proceed}>
          Continue <ArrowRight />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* desktop: side panel */}
      <aside className="glass pointer-events-auto absolute bottom-4 right-4 top-20 hidden w-[380px] flex-col overflow-hidden rounded-2xl lg:flex">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">{details}</div>
        <div className="border-t border-white/10 p-5">{summary}</div>
      </aside>

      {/* mobile: bottom sheet */}
      <div className="glass pointer-events-auto absolute inset-x-0 bottom-0 flex max-h-[78dvh] flex-col rounded-t-2xl pb-[env(safe-area-inset-bottom)] lg:hidden">
        <button className="flex w-full flex-col items-center gap-1 pt-2 pb-1" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className="h-1 w-10 rounded bg-white/25" />
          <span className="text-xs text-muted">{open ? "Hide details" : "Showtimes & seat guide"}</span>
        </button>
        {open && <div className="space-y-4 overflow-y-auto px-4 pb-3">{details}</div>}
        <div className="border-t border-white/10 px-4 py-3">{summary}</div>
      </div>
    </>
  );
}

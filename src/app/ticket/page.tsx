"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { useHydrated } from "@/lib/hydrate";
import { CATEGORY_LABEL, SEAT_BY_ID } from "@/lib/layout";
import { formatDate, formatTime, getMovie, HALL, parseShowtime, pkr } from "@/lib/movies";
import { useCinema } from "@/lib/store";
import { Logo } from "@/components/ui/Logo";
import { Armchair, CheckCircle2, Download, Ticket as TicketIcon } from "lucide-react";

export default function TicketPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <Ticket />
    </Suspense>
  );
}

function Ticket() {
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const bookings = useCinema((s) => s.bookings);
  const id = params.get("id");
  const booking = bookings.find((b) => b.id === id) ?? bookings[bookings.length - 1];
  const [qr, setQr] = useState("");

  useEffect(() => {
    if (!booking) return;
    QRCode.toDataURL(`CINESEAT|${booking.id}|${booking.showtimeId}|${booking.seats.join(",")}`, {
      margin: 1,
      width: 320,
      color: { dark: "#0b0a10", light: "#ffffff" },
    }).then(setQr);
  }, [booking]);

  if (!hydrated) return <main className="min-h-screen" />;
  if (!booking) {
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div className="space-y-4">
          <p className="font-display text-4xl">No ticket found</p>
          <Link href="/book" className="btn btn-gold">
            Book a ticket
          </Link>
        </div>
      </main>
    );
  }

  const st = parseShowtime(booking.showtimeId)!;
  const movie = getMovie(st.movieId);
  const [a, b, c] = movie.colors;
  const rows = [...new Set(booking.seats.map((s) => s[0]))].join(", ");

  const seeSeat = () => {
    useCinema.setState({ showtimeId: booking.showtimeId, movieId: st.movieId });
    router.push("/cinema");
    // Sit in the first booked seat once the hall has loaded.
    setTimeout(() => useCinema.getState().setView({ kind: "seat", seatId: booking.seats[0] }), 1800);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center px-5 py-8">
      <div className="no-print mb-6 flex w-full items-center justify-between">
        <Logo />
        <span className="badge bg-emerald-500/15 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> Booking confirmed
        </span>
      </div>

      <div className="fade-up w-full overflow-hidden rounded-2xl bg-panel shadow-2xl shadow-black/60 print:shadow-none">
        <div
          className="grain relative p-6 sm:p-8"
          style={{ background: `radial-gradient(80% 120% at 85% 0%, ${c}66, transparent 60%), linear-gradient(135deg, ${a}, ${b}aa)` }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Admit {booking.seats.length}</p>
          <h1 className="font-display text-5xl leading-none sm:text-6xl">{movie.title}</h1>
          <p className="mt-1 text-sm text-white/75">
            {movie.rating} · {movie.runtime} · {movie.genre}
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:p-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Info label="Date" value={formatDate(st.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} />
            <Info label="Time" value={formatTime(st.time)} />
            <Info label="Hall" value={`${HALL.name} · ${HALL.format}`} />
            <Info label="Row" value={rows} />
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-widest text-muted">Seats</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {booking.seats.map((s) => (
                  <span key={s} className="rounded-lg bg-gold px-2.5 py-1 font-display text-xl text-[#1a1203]">
                    {s}
                    <span className="ml-1 font-sans text-[10px] font-semibold uppercase">{CATEGORY_LABEL[SEAT_BY_ID.get(s)!.category]}</span>
                  </span>
                ))}
              </div>
            </div>
            <Info label="Booked by" value={booking.name} />
            <Info label="Paid" value={`${pkr(booking.total)} · ${booking.method === "card" ? "Card" : booking.method === "jazzcash" ? "JazzCash" : "EasyPaisa"}`} />
          </div>

          <div className="flex flex-col items-center gap-2 border-t border-dashed border-line pt-6 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- local data: URL */}
            {qr ? <img src={qr} alt="Ticket QR code" className="h-40 w-40 rounded-xl" /> : <div className="h-40 w-40 rounded-xl bg-white/10" />}
            <p className="font-mono text-sm tracking-widest">{booking.id}</p>
            <p className="text-[11px] text-muted">Show this at the entrance</p>
          </div>
        </div>
      </div>

      <div className="no-print mt-6 flex flex-wrap justify-center gap-3">
        <button className="btn btn-gold" onClick={seeSeat}>
          <Armchair /> See my seat in 3D
        </button>
        <button className="btn btn-ghost" onClick={() => window.print()}>
          <Download /> Download / Print
        </button>
        <Link href="/" className="btn btn-ghost">
          <TicketIcon /> Book another
        </Link>
      </div>
      <p className="no-print mt-4 text-center text-xs text-muted">A copy was sent to {booking.email} (demo — no email is actually sent).</p>
    </main>
  );
}

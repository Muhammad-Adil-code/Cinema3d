"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/lib/hydrate";
import { CATEGORY_LABEL, PRICES, SEAT_BY_ID } from "@/lib/layout";
import { formatDate, formatTime, getMovie, HALL, parseShowtime, pkr } from "@/lib/movies";
import { totalFor, useCinema } from "@/lib/store";
import { Logo } from "@/components/ui/Logo";
import { ArrowLeft, Clock, CreditCard, Lock, Smartphone, Wallet } from "lucide-react";

const METHODS = [
  { id: "card", label: "Debit / Credit card", Icon: CreditCard },
  { id: "jazzcash", label: "JazzCash", Icon: Smartphone },
  { id: "easypaisa", label: "EasyPaisa", Icon: Wallet },
];

export default function Checkout() {
  const router = useRouter();
  const hydrated = useHydrated();
  const hold = useCinema((s) => s.hold);
  const releaseHold = useCinema((s) => s.releaseHold);
  const confirmBooking = useCinema((s) => s.confirmBooking);
  const [now, setNow] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState("card");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!hydrated) return <main className="min-h-screen" />;

  if (!hold) {
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div className="space-y-4">
          <p className="font-display text-4xl">No seats on hold</p>
          <p className="text-muted">Pick your seats first, then come back here to pay.</p>
          <Link href="/book" className="btn btn-gold">
            Choose seats
          </Link>
        </div>
      </main>
    );
  }

  const left = Math.max(0, hold.expiresAt - now);
  const expired = left === 0;
  const mm = Math.floor(left / 60000);
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
  const st = parseShowtime(hold.showtimeId)!;
  const movie = getMovie(st.movieId);
  const total = totalFor(hold.seats);
  const valid = name.trim().length > 1 && /^[0-9+\-\s]{10,15}$/.test(phone.trim()) && /\S+@\S+\.\S+/.test(email);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || expired) return;
    setPaying(true);
    setError("");
    await new Promise((r) => setTimeout(r, 1800));
    const booking = confirmBooking({ name: name.trim(), phone: phone.trim(), email: email.trim(), method });
    if (!booking) {
      setPaying(false);
      setError("Sorry — your hold expired or a seat was just taken. Please pick again.");
      return;
    }
    router.replace(`/ticket?id=${booking.id}`);
  };

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-6">
      <header className="mb-8 flex items-center justify-between">
        <Logo />
        <div className={`badge px-3 py-1.5 text-sm ${expired ? "bg-red-500/20 text-red-300" : mm < 1 ? "bg-orange-500/20 text-orange-200" : "bg-white/10"}`}>
          <Clock className="h-4 w-4" />
          {expired ? "Hold expired" : `Seats held for ${mm}:${ss}`}
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_380px]">
        <form onSubmit={pay} className="card space-y-6 p-6">
          <div>
            <h1 className="font-display text-4xl">Checkout</h1>
            <p className="text-sm text-muted">We&apos;ll send your e-ticket to these details.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={name} onChange={setName} placeholder="Ali Khan" autoComplete="name" />
            <Field label="Mobile number" value={phone} onChange={setPhone} placeholder="0300 1234567" type="tel" autoComplete="tel" />
            <div className="sm:col-span-2">
              <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" autoComplete="email" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Payment method</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {METHODS.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition ${method === m.id ? "border-gold bg-gold/10" : "border-line hover:border-white/30"}`}
                >
                  <m.Icon className={`h-5 w-5 ${method === m.id ? "text-gold" : "text-muted"}`} />
                  {m.label}
                </button>
              ))}
            </div>
            <p className="flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-xs text-muted">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Demo mode: no money is charged and no payment details are collected. Pressing pay confirms the booking instantly.
            </p>
          </div>

          {error && <p className="rounded-xl bg-red-500/15 px-3 py-2.5 text-sm text-red-200">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-gold min-w-48" disabled={!valid || expired || paying}>
              {paying ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a1203] border-t-transparent" /> Processing…
                </>
              ) : (
                `Pay ${pkr(total)}`
              )}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                useCinema.setState({ selected: hold.seats });
                releaseHold();
                router.push("/book");
              }}
            >
              <ArrowLeft /> Change seats
            </button>
          </div>
        </form>

        <aside className="card h-fit space-y-4 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{HALL.name}</p>
            <p className="font-display text-3xl">{movie.title}</p>
            <p className="text-sm text-muted">
              {formatDate(st.date, { weekday: "long", day: "numeric", month: "long" })} · {formatTime(st.time)}
            </p>
          </div>
          <ul className="space-y-2 border-y border-line py-4 text-sm">
            {hold.seats.map((id) => {
              const cat = SEAT_BY_ID.get(id)!.category;
              return (
                <li key={id} className="flex justify-between">
                  <span>
                    <b className="text-gold">{id}</b> <span className="text-muted">· {CATEGORY_LABEL[cat]}</span>
                  </span>
                  <span>{pkr(PRICES[cat])}</span>
                </li>
              );
            })}
          </ul>
          <div className="flex items-end justify-between">
            <span className="text-muted">Total</span>
            <span className="font-display text-4xl">{pkr(total)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-black/30 px-3.5 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-gold"
      />
    </label>
  );
}

"use client";

import { useEffect, useState } from "react";
import { defaultShowtime, parseShowtime, upcomingDates } from "./movies";
import { useCinema } from "./store";

let hydrated = false;

/** Rehydrates the persisted store once on the client and drops stale showtimes / expired holds. */
export function useHydrated() {
  const [ready, setReady] = useState(hydrated);
  useEffect(() => {
    if (hydrated) return;
    Promise.resolve(useCinema.persist.rehydrate()).then(() => {
      const s = useCinema.getState();
      const st = parseShowtime(s.showtimeId);
      if (!st || !upcomingDates().includes(st.date)) useCinema.setState({ showtimeId: defaultShowtime(s.movieId) });
      if (s.hold && s.hold.expiresAt < Date.now()) useCinema.setState({ hold: null });
      hydrated = true;
      setReady(true);
    });
  }, []);
  return ready;
}

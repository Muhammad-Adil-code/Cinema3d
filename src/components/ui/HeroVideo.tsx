"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const small = () => window.matchMedia("(max-width: 640px)").matches;

/**
 * Looping, muted background footage of a real cinema audience
 * (Mixkit free-license clips, cut together in public/video/hero.mp4).
 */
export function HeroVideo({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const mobile = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(max-width: 640px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    small,
    () => false,
  );

  // Pause when scrolled away to save battery.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.05 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      key={mobile ? "m" : "d"}
      className={className}
      src={mobile ? "/video/hero-mobile.mp4" : "/video/hero.mp4"}
      poster="/video/hero-poster.jpg"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden
    />
  );
}

import Link from "next/link";

/** Brand mark: a gold cinema seat in a rounded tile, plus the wordmark. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#f5c451" />
      <path d="M20 14h24a5 5 0 0 1 5 5v15H15V19a5 5 0 0 1 5-5z" fill="#1a1203" />
      <rect x="11" y="30" width="7" height="16" rx="3" fill="#1a1203" />
      <rect x="46" y="30" width="7" height="16" rx="3" fill="#1a1203" />
      <rect x="17" y="35" width="30" height="9" rx="3" fill="#1a1203" />
      <rect x="22" y="44" width="4" height="7" rx="1.5" fill="#1a1203" />
      <rect x="38" y="44" width="4" height="7" rx="1.5" fill="#1a1203" />
    </svg>
  );
}

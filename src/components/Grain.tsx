const NOISE_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

/** Subtle fixed film grain — 2% opacity, revealed on hover or at viewport edges. */
export function Grain() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-40 pointer-events-none opacity-0 hover:opacity-10 transition-opacity duration-300"
      style={{ backgroundImage: `url("${NOISE_URI}")` }}
    />
  );
}

/** Full-viewport grain that's always visible but very subtle (used only in loading state). */
export function GrainVisible() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-40 pointer-events-none opacity-8 transition-opacity duration-300"
      style={{ backgroundImage: `url("${NOISE_URI}")` }}
    />
  );
}
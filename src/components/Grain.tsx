const NOISE_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

/** Fixed full-page film grain — stepped animation, paused during projector hold. */
export function Grain() {
  return (
    <div
      aria-hidden
      className="anim-grain pointer-events-none fixed -inset-[50%] z-40 h-[200%] w-[200%]"
      style={{ backgroundImage: `url("${NOISE_URI}")`, opacity: 0.12 }}
    />
  );
}

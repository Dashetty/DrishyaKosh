/**
 * Sprocket rails — the photographed film strip running down both viewport
 * edges (desktop only). The rail is the strip's 2× native width; the film
 * is cropped by the viewport rather than tiled, so one continuous piece of
 * leader — branding and frame number included — frames each screen.
 */
export function Sprockets() {
  return (
    <>
      <div
        aria-hidden
        className="sprocket-rail sprocket-rail--left pointer-events-none fixed inset-y-0 left-0 z-30 hidden lg:block"
      />
      <div
        aria-hidden
        className="sprocket-rail sprocket-rail--right pointer-events-none fixed inset-y-0 right-0 z-30 hidden lg:block"
      />
    </>
  );
}

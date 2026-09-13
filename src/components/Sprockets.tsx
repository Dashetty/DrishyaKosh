/** Sprocket-hole rails down both viewport edges — desktop only. */
export function Sprockets() {
  return (
    <>
      <div
        aria-hidden
        className="sprocket-rail pointer-events-none fixed inset-y-0 left-4 z-30 hidden w-[14px] lg:block"
      />
      <div
        aria-hidden
        className="sprocket-rail pointer-events-none fixed inset-y-0 right-4 z-30 hidden w-[14px] lg:block"
      />
    </>
  );
}

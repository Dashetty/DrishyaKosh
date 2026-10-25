"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/** Aperture cursor — center dot + contracting ring, fine pointers only. */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Only hide the native cursor once the aperture is actually wired up, so a
    // slow/failed hydration never leaves fine pointers with no cursor at all.
    const root = document.documentElement;
    root.dataset.cursor = "fine";

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 0 });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.32, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.32, ease: "power3" });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power2" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power2" });

    let shown = false;
    const onMove = (e: MouseEvent) => {
      if (!shown) {
        shown = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
      }
      ringX(e.clientX);
      ringY(e.clientY);
      dotX(e.clientX);
      dotY(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target?.closest?.("a, button, [data-frame], dialog")) {
        gsap.to(ring, { scale: 0.55, duration: 0.3, ease: "power3" });
        gsap.to(dot, { scale: 0.5, duration: 0.3 });
      }
    };
    const onOut = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target?.closest?.("a, button, [data-frame], dialog")) {
        gsap.to(ring, { scale: 1, duration: 0.4, ease: "power3" });
        gsap.to(dot, { scale: 1, duration: 0.4 });
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("mouseout", onOut, true);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("mouseout", onOut, true);
      delete root.dataset.cursor;
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[90] h-1 w-1 rounded-full bg-bone opacity-0"
      />
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[90] h-7 w-7 rounded-full border border-bone/80 opacity-0 mix-blend-difference"
      />
    </>
  );
}

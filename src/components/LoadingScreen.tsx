"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const INTRO_FLAG = "dk-intro";

/**
 * Projector intro — simple beam rise and reveal, runs once per session.
 * Pre-paint inline script in layout.tsx sets `html.intro-pending`.
 */
export function LoadingScreen() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!document.documentElement.classList.contains("intro-pending")) return;

    const finish = () => {
      try {
        sessionStorage.setItem(INTRO_FLAG, "1");
      } catch {
        /* private mode — intro just replays next visit */
      }
      document.documentElement.classList.remove("intro-pending");
      window.dispatchEvent(new Event("dk:intro:done"));
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    const beam = root.querySelector<HTMLElement>("[data-beam]");
    const wordmark = root.querySelector<HTMLElement>("[data-wordmark]");

    const tl = gsap.timeline({ onComplete: finish });
    tl.set(root, { clipPath: "inset(0% 0% 0% 0%)" })
      .fromTo(
        beam,
        { scaleY: 0, opacity: 0 },
        { scaleY: 1, opacity: 1, duration: 0.35, ease: "power2.out" }
      )
      .fromTo(
        wordmark,
        { opacity: 0, scale: 0.94 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: "power2.out",
          transformOrigin: "50% 50%",
        },
        "<0.05"
      )
      .to(beam, { opacity: 0.85, duration: 0.15 })
      .to(
        root,
        {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 0.7,
          ease: "power4.inOut",
        },
        "+=0.1"
      )
      .to(beam, { opacity: 0, duration: 0.2 });

    const skip = () => {
      tl.kill();
      finish();
    };
    root.addEventListener("click", skip, { once: true });

    return () => {
      tl.kill();
      root.removeEventListener("click", skip);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-intro-overlay
      className="fixed inset-0 z-[100] items-center justify-center bg-ink"
      aria-hidden
    >
      {/* subtle sprocket dots at top and bottom for film reference */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
        <div className="w-1 h-1 rounded-full bg-amber/40" />
        <div className="w-1 h-1 rounded-full bg-amber/40" />
        <div className="w-1 h-1 rounded-full bg-amber/40" />
      </div>

      {/* projector light beam — two layers so they never fight:
          the outer div is the GSAP layer (geometry + opacity fades), the
          inner line carries the CSS flicker. One element doing both meant
          the keyframes overrode GSAP's entrance/exit opacity. */}
      <div
        data-beam
        className="absolute left-1/2 top-1/2 h-[62vh] w-px -translate-x-1/2 -translate-y-1/2"
      >
        <div
          className="anim-beam h-full w-full bg-bone/90"
          style={{ boxShadow: "0 0 24px 4px rgba(232, 224, 207, 0.45)" }}
        />
      </div>

      <h1
        data-wordmark
        className="font-display text-[clamp(1.6rem,4.5vw,3.2rem)] uppercase tracking-[0.14em] text-bone opacity-0"
      >
        Drishyakosh
      </h1>

      <p className="absolute bottom-8 font-meta text-[0.55rem] tracking-[0.4em] text-smoke">
        CLICK TO THREAD THE PROJECTOR
      </p>
    </div>
  );
}
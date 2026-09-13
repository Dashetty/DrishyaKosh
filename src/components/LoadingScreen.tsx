"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const INTRO_FLAG = "dk-intro";

/**
 * Projector intro — ~1.2s, click-to-skip, once per session (sessionStorage).
 * A pre-paint inline script in layout.tsx sets `html.intro-pending`, which
 * CSS uses to show this overlay from the very first frame (no flash, no
 * React state). This component plays the GSAP timeline when the class is
 * present and removes it on finish; visibility is entirely CSS-driven.
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
    const rails = root.querySelectorAll<HTMLElement>("[data-rail]");

    const tl = gsap.timeline({ onComplete: finish });
    tl.set(root, { clipPath: "inset(0% 0% 0% 0%)" })
      .fromTo(
        beam,
        { scaleY: 0, opacity: 0 },
        { scaleY: 1, opacity: 1, duration: 0.35, ease: "power2.out" }
      )
      .fromTo(rails, { opacity: 0 }, { opacity: 1, duration: 0.25 }, "<0.1")
      .fromTo(
        wordmark,
        { opacity: 0, letterSpacing: "0.6em" },
        { opacity: 1, letterSpacing: "0.14em", duration: 0.6, ease: "power2.out" },
        "<0.05"
      )
      .to(beam, { opacity: 0.85, duration: 0.15 })
      .to(
        root,
        {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 0.55,
          ease: "power4.inOut",
        },
        "+=0.1"
      );

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
      {/* crawling sprocket rails on the intro's own edges */}
      <div
        data-rail
        className="sprocket-rail anim-crawl pointer-events-none absolute inset-y-0 left-6 w-[14px] opacity-0"
      />
      <div
        data-rail
        className="sprocket-rail anim-crawl pointer-events-none absolute inset-y-0 right-6 w-[14px] opacity-0"
      />

      {/* projector light beam */}
      <div
        data-beam
        className="anim-beam absolute left-1/2 top-1/2 h-[62vh] w-px -translate-x-1/2 -translate-y-1/2 bg-bone/90"
        style={{ boxShadow: "0 0 24px 4px rgba(232, 224, 207, 0.45)" }}
      />

      <h1
        data-wordmark
        className="font-display text-[clamp(1.6rem,4.5vw,3.2rem)] uppercase text-bone opacity-0"
      >
        Drishyakosh
      </h1>

      <p className="absolute bottom-8 font-meta text-[0.55rem] tracking-[0.4em] text-smoke">
        CLICK TO THREAD THE PROJECTOR
      </p>
    </div>
  );
}

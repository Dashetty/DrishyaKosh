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

    const page = document.getElementById("page-content");

    const finish = () => {
      try {
        sessionStorage.setItem(INTRO_FLAG, "1");
      } catch {
        /* private mode — intro just replays next visit */
      }
      page?.removeAttribute("inert");
      document.documentElement.classList.remove("intro-pending");
      window.dispatchEvent(new Event("dk:intro:done"));
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    // The overlay is the only thing on screen — take the page underneath out
    // of the tab order and the accessibility tree until the intro is done.
    page?.setAttribute("inert", "");

    const beam = root.querySelector<HTMLElement>("[data-beam]");
    const wordmark = root.querySelector<HTMLElement>("[data-wordmark]");

    const tl = gsap.timeline({ onComplete: finish });
    tl.fromTo(
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
          yPercent: -100,
          duration: 0.5,
          ease: "power4.out",
        },
        "+=0.1"
      )
      .to(beam, { opacity: 0, duration: 0.2 });

    // Guarded so click, the skip button, and Escape can't finish twice.
    const skip = () => {
      if (!document.documentElement.classList.contains("intro-pending")) return;
      tl.kill();
      finish();
    };
    // Clicking anywhere on the overlay skips — the skip button's click
    // bubbles up to this same handler.
    root.addEventListener("click", skip, { once: true });

    // Keyboard escape hatch. Enter/Space work natively via the skip button,
    // which takes focus so it is the first tab stop (the page behind the
    // overlay is still focusable while it covers the viewport).
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // The listener lives for the session; never swallow Escape once the
      // intro is gone.
      if (!document.documentElement.classList.contains("intro-pending")) return;
      event.preventDefault();
      skip();
    };
    window.addEventListener("keydown", onKeyDown);
    root
      .querySelector<HTMLButtonElement>("[data-skip]")
      ?.focus({ preventScroll: true });

    return () => {
      tl.kill();
      root.removeEventListener("click", skip);
      window.removeEventListener("keydown", onKeyDown);
      page?.removeAttribute("inert");
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-intro-overlay
      role="dialog"
      aria-modal="true"
      aria-label="Drishyakosh intro"
      className="fixed inset-0 z-[100] items-center justify-center bg-ink"
    >
      {/* subtle sprocket dots at top and bottom for film reference */}
      <div
        aria-hidden
        className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2"
      >
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
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[62vh] w-px -translate-x-1/2 -translate-y-1/2"
      >
        <div
          className="anim-beam h-full w-full bg-bone/90"
          style={{ boxShadow: "0 0 24px 4px oklch(0.915 0.04 88 / 0.45)" }}
        />
      </div>

      <p
        data-wordmark
        className="font-display -me-[0.14em] text-[clamp(1.6rem,4.5vw,3.2rem)] uppercase tracking-[0.14em] text-bone opacity-0"
      >
        Drishyakosh
      </p>

      <p className="absolute bottom-20 -me-[0.4em] font-meta text-[0.55rem] tracking-[0.4em] text-smoke sm:bottom-8">
        CLICK TO THREAD THE PROJECTOR
      </p>

      <button
        type="button"
        data-skip
        className="absolute right-[max(1.25rem,env(safe-area-inset-right))] bottom-[max(1.25rem,env(safe-area-inset-bottom))] inline-flex min-h-11 items-center justify-center border border-smoke/40 px-4 py-3 font-meta text-[0.55rem] tracking-[0.3em] text-smoke uppercase transition-[color,border-color,scale] duration-200 hover:border-amber hover:text-amber active:scale-[0.96] sm:right-[max(2rem,env(safe-area-inset-right))] sm:bottom-[max(2rem,env(safe-area-inset-bottom))]"
      >
        <span className="-me-[0.3em]">Skip intro</span>
      </button>
    </div>
  );
}
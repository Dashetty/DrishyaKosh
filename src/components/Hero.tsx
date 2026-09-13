"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = root.querySelectorAll("[data-hero-reveal]");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const introPlaying = document.documentElement.classList.contains("intro-pending");
    let seenThisSession = false;
    try {
      seenThisSession = !!sessionStorage.getItem("dk-intro");
    } catch {
      /* ignore */
    }
    // Repeat visit with no intro: hero stays static — avoids a hide/show flash.
    if (seenThisSession && !introPlaying) return;

    const reveal = () =>
      gsap.fromTo(
        targets,
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: "power3.out" }
      );

    if (introPlaying) {
      const onDone = () => reveal();
      window.addEventListener("dk:intro:done", onDone, { once: true });
      return () => window.removeEventListener("dk:intro:done", onDone);
    }
    reveal();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative flex h-[100svh] flex-col items-center justify-center overflow-hidden"
    >
      {/* drifting light leak */}
      <div
        aria-hidden
        className="anim-leak absolute left-[8%] top-[12%] h-[70vmin] w-[70vmin] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(201,162,106,0.16) 0%, rgba(201,162,106,0.05) 45%, transparent 70%)",
        }}
      />

      <h1
        data-hero-reveal
        className="font-display text-[clamp(3.2rem,11vw,10rem)] uppercase leading-none tracking-[0.08em] text-bone"
      >
        Drishyakosh
      </h1>

      <p
        data-hero-reveal
        className="mt-7 max-w-xl px-6 text-center text-sm text-bone-dim md:text-base"
      >
        A personal archive of moving pictures — handpicked, not algorithmic.
      </p>

      <p
        data-hero-reveal
        className="absolute bottom-8 left-8 hidden font-meta text-[0.6rem] tracking-[0.45em] text-smoke md:block"
      >
        CURATED BY HARDEEP DILIP SHETTY
      </p>

      <div
        data-hero-reveal
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3"
      >
        <span className="relative flex h-9 w-9 items-center justify-center">
          <span className="anim-cue absolute inline-flex h-full w-full rounded-full border border-amber/60" />
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber/80" />
        </span>
        <span className="font-meta text-[0.55rem] tracking-[0.4em] text-smoke">
          SCROLL
        </span>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Reel } from "@/types";

const SUBTITLES: Record<Reel["slug"], string> = {
  "reel-01": "DK-001 — DK-003 · OBJECTS & LETTERFORMS",
  "reel-02": "DK-004 — DK-006 · SOUND, SEEN",
  "reel-03": "DK-007 — DK-010 · THE FRAME ITSELF",
};

/** Large intertitle card between reels — "REEL 01 — DESIGN". */
export function Intertitle({ reel }: { reel: Reel }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const inner = root.querySelector("[data-intertitle]");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const tween = gsap.fromTo(
      inner,
      { y: 80, opacity: 0.2 },
      {
        y: 0,
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top 90%",
          end: "top 40%",
          scrub: true,
        },
      }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section
      ref={ref}
      aria-label={`Reel ${reel.number} — ${reel.title}`}
      className="flex min-h-[72vh] flex-col items-center justify-center gap-6 px-6 py-24"
    >
      <div data-intertitle className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-5">
          <span aria-hidden className="block w-14 border-t border-hairline" />
          <span className="font-meta text-[0.65rem] tracking-[0.55em] text-amber">
            REEL {reel.number}
          </span>
          <span aria-hidden className="block w-14 border-t border-hairline" />
        </div>
        <h2 className="font-display text-[clamp(3rem,9vw,7.5rem)] uppercase leading-none tracking-[0.06em] text-bone">
          {reel.title}
        </h2>
        <p className="font-meta text-[0.6rem] tracking-[0.4em] text-smoke">
          {SUBTITLES[reel.slug]}
        </p>
      </div>
    </section>
  );
}

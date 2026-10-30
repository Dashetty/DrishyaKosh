"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Hero — rebuilt from vigilante.group's "LAWLESS CREATIVITY" block.
 *
 * Mechanics cloned 1:1 against the live site (MCP inspection, 1000×700):
 *  - full-bleed signal-red statement, min-height 200svh, overflow clipped
 *  - a sticky 100svh viewport inside holds two massive SVG word-lines
 *    (their svg is byte-identical: viewBox "0 30 1000 140",
 *    textLength 1000, lengthAdjust spacingAndGlyphs, fontSize 180px)
 *  - load: line one is stretched to the full track — measured in the wild
 *    as height:100vh inline (a viewport-tall taffy word) — with a subtle
 *    idle pulse until the first scroll hands over
 *  - scroll drives the composition: line one compresses to 32.8% of the
 *    track while line two grows to 45.5% — the balanced two-line wall
 *    their scrub passes through mid-pin (measured 295/410 px at 1440×900;
 *    the leftover 21.7% spreads as the justify-between gap)
 *  - the Litterbox tagline fades over the final state, scribble draws itself
 *  - an angled red wedge hands the section off to the ink archive below
 *  - reduced motion: static accounting — both lines parked at the balanced
 *    proportions, tagline, no pin
 */
export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const firstLineRef = useRef<HTMLDivElement>(null);
  const secondLineRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const scribbleRef = useRef<SVGPathElement>(null);
  const wedgeRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    const first = firstLineRef.current;
    const second = secondLineRef.current;
    const tagline = taglineRef.current;
    const scribble = scribbleRef.current;
    const wedge = wedgeRef.current;
    if (!root || !first || !second || !tagline || !scribble || !wedge) return;

    gsap.registerPlugin(ScrollTrigger);

    // height system: both word-lines are fractions of the sticky track
    // (the lines column === the 100svh viewport). Line one lands at full
    // track height (the taffy poster, vigilante's measured load state) and
    // compresses to 32.8% of track; line two opens to 45.5% — the balanced
    // wall. No "fill the remainder" math: the justify-between gap survives,
    // exactly as vigilante's pin does.
    const LINE1_END = 0.328;
    const LINE2_END = 0.455;
    const track = second.parentElement;
    const trackHeight = () => track?.offsetHeight ?? first.offsetHeight;
    const lineEnd = (fraction: number) => () => trackHeight() * fraction;
    const scribbleLength = scribble.getTotalLength();

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "bottom bottom", // the 200svh block buys ~100svh of pinned scroll
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });

    tl.fromTo(
      first,
      { height: () => trackHeight() },
      {
        height: lineEnd(LINE1_END),
        duration: 0.4,
        ease: "none",
      },
      0
    )
      .fromTo(
        second,
        { height: "0svh" },
        { height: lineEnd(LINE2_END), duration: 0.55, ease: "none" },
        0.15
      )
      .fromTo(
        tagline,
        { opacity: 0 },
        { opacity: 1, duration: 0.16, ease: "power1.out" },
        0.72
      )
      .fromTo(
        scribble,
        { strokeDashoffset: scribbleLength },
        { strokeDashoffset: 0, duration: 0.15, ease: "power1.out" },
        0.78
      )
      .fromTo(
        wedge,
        { clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)" },
        {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 35%)",
          duration: 0.15,
          ease: "none",
        },
        0.82
      );

    // idle breathe — subtle top-anchored pulse on the word itself, alive
    // until the first scroll hands control to the scrubbed composition
    const firstSvg = first.querySelector("svg");
    let breathe: gsap.core.Tween | null = null;
    if (firstSvg) {
      breathe = gsap.fromTo(
        firstSvg,
        { scaleY: 1 },
        {
          scaleY: 1.03,
          duration: 2.6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          transformOrigin: "50% 0%",
        }
      );
    }
    const stopBreathe = () => breathe?.kill();
    window.addEventListener("scroll", stopBreathe, {
      once: true,
      passive: true,
    });

    // word-line heights are svh/px-sensitive: refresh once real fonts land
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      window.removeEventListener("scroll", stopBreathe);
      breathe?.kill();
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [reduced]);

  return (
    <section
      ref={rootRef}
      data-hero-scrub=""
      className={`relative isolate z-10 bg-signal ${
        reduced ? "min-h-[100svh]" : "min-h-[200svh]"
      }`}
    >
      {/* angled wedge hand-off into the ink archive below */}
      {!reduced && (
        <div
          ref={wedgeRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-full z-0 h-[10vh] bg-signal md:block"
          style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)" }}
        />
      )}

      <div
        className={
          reduced
            ? "min-h-[100svh] px-[1.8rem] md:px-[5.6rem]"
            : "min-h-[calc(200svh+3.6rem)] px-[1.8rem] md:min-h-[calc(200svh+11.2rem)] md:px-[5.6rem]"
        }
      >
        <div className="sticky top-0 h-[100svh] w-full">
          <h1 className="sr-only">
            DrishyaKosh — Curated YouTube Video collection by Hardeep Dilip
            Shetty
          </h1>

          {/* the two word-lines */}
          <div
            aria-hidden
            className="flex h-full w-full flex-col justify-between overflow-hidden"
          >
            <div
              ref={firstLineRef}
              className="w-full shrink-0 overflow-hidden"
              // load state = the taffy poster: full track height (in sync
              // with the fromTo's starting value above)
              style={{ height: reduced ? "33svh" : "100svh" }}
            >
              <svg
                className="block h-full w-full select-none"
                viewBox="0 30 1000 140"
                preserveAspectRatio="none"
              >
                {/* baseline y=168: Unbounded's measured ink ascent at 180px
                    is 138 → cap-top flush with viewBox top 30; descent is
                    3 units, sub-pixel at any stretch */}
                <text
                  x="0"
                  y="168"
                  textLength="1000"
                  lengthAdjust="spacingAndGlyphs"
                  style={{
                    fill: "var(--color-ink)",
                    fontFamily: "var(--font-unbounded)",
                    fontWeight: 400,
                    fontSize: "180px",
                  }}
                >
                  DRISHYA
                </text>
              </svg>
            </div>
            <div
              ref={secondLineRef}
              className="w-full shrink-0 overflow-hidden"
              style={{
                height: reduced ? "45.5svh" : "0svh",
              }}
            >
              <svg
                className="block h-full w-full select-none"
                viewBox="0 30 1000 140"
                preserveAspectRatio="none"
              >
                <text
                  x="0"
                  y="168"
                  textLength="1000"
                  lengthAdjust="spacingAndGlyphs"
                  style={{
                    fill: "var(--color-ink)",
                    fontFamily: "var(--font-unbounded)",
                    fontWeight: 400,
                    fontSize: "180px",
                  }}
                >
                  KOSH
                </text>
              </svg>
            </div>
          </div>

          {/* Litterbox tagline over the final state */}
          <div
            ref={taglineRef}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            style={{ opacity: reduced ? 1 : 0 }}
          >
            <div className="max-w-[60vw] text-center md:max-w-[33vw]">
              <p className="font-hand text-[clamp(2rem,4.5vw,5rem)] leading-[0.9] text-bone">
                Curated
                <br />
                YouTube
                <br />
                Video collection
                <br />
                By Hardeep
                <br />
                Dilip Shetty
              </p>

              <svg
                className="mx-auto mt-[0.6em] block h-auto w-full"
                width="512"
                height="114"
                viewBox="0 0 512 114"
                fill="none"
                aria-hidden
              >
                <path
                  ref={scribbleRef}
                  d="M61.0584 60.1151C79.5835 61.3332 98.1086 62.5514 160.421 63.6881C222.733 64.8248 328.271 65.8432 381.882 66.8989C435.493 67.9546 433.978 69.0168 359.218 77.0463C284.458 85.0759 136.498 100.041 59.7168 107.75C-17.0644 115.459 -18.1833 115.459 50.5699 98.6159C119.323 81.773 257.982 48.0873 346.934 28.56C435.885 9.03269 470.927 4.68468 489.517 2.49121C508.106 0.297731 509.181 0.390544 510.902 0.603356"
                  stroke="var(--color-bone)"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 1302.7,
                    strokeDashoffset: reduced ? 0 : 1302.7,
                  }}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

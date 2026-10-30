"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useLenisInstance } from "@/lib/smooth-scroll";

/**
 * Prelude — the pre-hero introduction (ADR-0007).
 *
 * One beat panel between the intro overlay and the red hero: the curator
 * says hello, a portrait arrives dead centre, collage nodes land around it,
 * and "WELCOME TO" fades in last — the red hero's DRISHYA/KOSH completes
 * the sentence below (site mark left, the page's one nav shortcut right).
 *
 * Motion borrows Spell UI's blur-reveal / words-stagger techniques but runs
 * on the house GSAP engine: one timeline, gated on the intro overlay's
 * `dk:intro:done` event (started directly on session replays, where the
 * overlay never runs). Per-element scroll drift hands the panel off to the
 * hero as it scrolls out — same rAF/scrub grammar as the hero's wedge, no
 * pin; the hero's own `top top` scrub is untouched.
 *
 * reduced motion: static accounting — everything visible, no timeline, no
 * drift, no cue pulse.
 */
export function Prelude() {
  const rootRef = useRef<HTMLElement>(null);
  const arrowRef = useRef<SVGPathElement>(null);
  const reduced = useReducedMotion();
  const lenis = useLenisInstance();

  useEffect(() => {
    const root = rootRef.current;
    const arrow = arrowRef.current;

    // water-tight reduced account: wipe any gsap residue from a committed
    // pre-reduced pass (hydration runs the effect with the server snapshot
    // first, which can land the initial hidden states), then bail static
    if (reduced) {
      gsap.set(
        root?.querySelectorAll(
          "[data-prelude-in], [data-prelude-node], [data-prelude-drift], [data-prelude-welcome] span, [data-prelude-cue]",
        ) ?? [],
        { clearProps: "all" },
      );
      arrow?.style.removeProperty("stroke-dasharray");
      arrow?.style.removeProperty("stroke-dashoffset");
      return;
    }
    if (!root || !arrow) return;

    gsap.registerPlugin(ScrollTrigger);

    const cleanups: Array<() => void> = [];

    let started = false;
    let poll: ReturnType<typeof setTimeout> | undefined;
    const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
    const start = () => {
      if (started || tl.progress() > 0) return;
      started = true;
      tl.play();
    };

    // per-element drift as the panel scrolls away beneath the hero — same
    // span for every element, different distances = differential depth.
    // Distances are data-prelude-drift, in yPercent of the element itself.
    gsap.utils
      .toArray<HTMLElement>("[data-prelude-drift]")
      .forEach((el) => {
        const dist = Number(el.dataset.preludeDrift ?? "-12");
        const tw = gsap.fromTo(
          el,
          { yPercent: 0 },
          {
            yPercent: dist,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: "bottom top",
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          },
        );
        cleanups.push(() => {
          tw.scrollTrigger?.kill();
          tw.kill();
        });
      });

    // the beat group also fades on the way out, not just slides
    const welcome = root.querySelector("[data-prelude-welcome]");
    if (welcome) {
      const wf = gsap.to(welcome, {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "55% top",
          scrub: 0.4,
          invalidateOnRefresh: true,
        },
      });
      cleanups.push(() => {
        wf.scrollTrigger?.kill();
        wf.kill();
      });
    }

    // arrival — initial states (inline opacity:0 keeps the pre-effect paint
    // dark on the landing session, mirroring the Hero tagline pattern)
    const arrowLen = arrow.getTotalLength();
    gsap.set(root.querySelectorAll("[data-prelude-in]"), {
      opacity: 0,
      y: 10,
      filter: "blur(10px)",
    });
    gsap.set(root.querySelectorAll("[data-prelude-node]"), {
      opacity: 0,
      scale: 0.92,
    });
    gsap.set(arrow, { strokeDasharray: arrowLen, strokeDashoffset: arrowLen });

    const firsts = root.querySelectorAll("[data-prelude-first]");
    const nodes = root.querySelectorAll("[data-prelude-node]");
    const welcomeSpans = root.querySelectorAll("[data-prelude-welcome] span");

    tl.to(firsts, {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.6,
      stagger: 0.07,
    }, 0)
      .to(arrow, { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut" }, 0.15)
      .to("[data-prelude-card]", {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        rotate: -0.5,
        duration: 0.85,
        ease: "power3.out",
      }, 0.45)
      .to("[data-prelude-name]", {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.6,
      }, 1.05)
      .to(nodes, {
        opacity: (i, el) =>
          Number((el as HTMLElement).dataset.preludeNodeOpacity ?? "1"),
        scale: 1,
        duration: 0.7,
        stagger: 0.07,
      }, 1.1)
      .to("[data-prelude-copy]", {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.65,
        ease: "power3.out",
      }, 1.55)
      .to(welcomeSpans, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.55,
        stagger: 0.12,
      }, 2.15)
      .to("[data-prelude-cue]", {
        opacity: 1,
        duration: 0.4,
        ease: "power1.out",
      }, 2.5);

    cleanups.push(() => {
      tl.kill();
    });

    // hand-off from the intro overlay: start when it's gone — either the
    // overlay already finished this session (no event will come) or fires
    window.addEventListener("dk:intro:done", start, { once: true });
    cleanups.push(() => window.removeEventListener("dk:intro:done", start));
    if (introDone()) {
      start();
    } else {
      // safety net if the event already fired between hydration passes
      poll = setTimeout(() => {
        if (introDone()) start();
      }, 250);
      cleanups.push(() => clearTimeout(poll));
    }

    return () => cleanups.forEach((fn) => fn());
  }, [reduced]);

  const goToArchive = () => {
    const main = document.querySelector("main");
    if (!main) return;
    const top = window.scrollY + main.getBoundingClientRect().top;
    if (lenis) {
      lenis.scrollTo(top, { duration: 1.4 });
    } else {
      window.scrollTo({ top, behavior: "auto" });
    }
  };

  // pre-effect paint guard: dark until the timeline takes over (reduced
  // motion users get everything visible statically)
  const fade = reduced ? undefined : 0;

  return (
    <section
      ref={rootRef}
      id="prelude"
      aria-label="Introduction"
      className="relative isolate z-10 flex min-h-[100svh] flex-col bg-ink"
    >
      {/* angled ink→signal cut at the bottom edge — the same wedge grammar
          the hero uses below itself, so the handoff keeps one move */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[10vh] bg-signal"
        style={{ clipPath: "polygon(0% 72%, 100% 28%, 100% 100%, 0% 100%)" }}
      />

      <div className="relative z-10 flex min-h-[100svh] flex-col px-6 pt-6 pb-8 md:px-10 md:pt-8">
        {/* corner chrome — decorative site mark left, the page's one nav
            shortcut right (ADR-0007) */}
        <header className="flex items-start justify-between">
          <p
            aria-hidden
            data-prelude-in=""
            data-prelude-first=""
            className="-me-[0.4em] font-display text-[0.72rem] tracking-[0.35em] text-bone uppercase"
            style={{ opacity: fade }}
          >
            Drishyakosh
          </p>
          <button
            type="button"
            onClick={goToArchive}
            data-prelude-in=""
            data-prelude-first=""
            className="-me-[0.35em] inline-flex min-h-11 items-center justify-center font-meta text-[0.55rem] tracking-[0.3em] text-smoke uppercase transition-colors duration-200 hover:text-amber"
            style={{ opacity: fade }}
          >
            Archive
          </button>
        </header>

        {/* the beat: hello → portrait → name → copy */}
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="grid w-full max-w-[74rem] grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
            {/* name — left of the portrait on desktop */}
            <p
              data-prelude-in=""
              data-prelude-name=""
              data-prelude-drift="-22"
              className="order-2 text-bone lg:order-1 lg:justify-self-end lg:text-right"
              style={{ opacity: fade }}
            >
              <span className="block -me-[0.14em] font-hand text-[clamp(1.35rem,2.4vw,2rem)] text-signal">
                i am
              </span>
              <span className="mt-2 block -me-[0.12em] font-hand text-[clamp(2.1rem,4vw,3.4rem)] leading-[1.04]">
                Hardeep
                <br />
                Dilip Shetty
              </span>
            </p>

            {/* portrait figure with collage nodes */}
            <figure
              data-prelude-drift="-8"
              className="relative mx-auto order-1 lg:order-2"
            >
              <p className="relative z-10 mb-3 flex items-start justify-center gap-1 md:mb-4">
                <span className="sr-only">Hello there</span>
                <span
                  aria-hidden
                  data-prelude-first=""
                  className="-rotate-6 font-hand text-[clamp(1.3rem,2.4vw,2rem)] text-signal"
                  style={{ opacity: fade }}
                >
                  Hello
                </span>
                <span
                  aria-hidden
                  data-prelude-first=""
                  className="-rotate-2 font-hand text-[clamp(1.3rem,2.4vw,2rem)] text-signal"
                  style={{ opacity: fade }}
                >
                  there
                </span>
                {/* hand-drawn arrow pointing the label into the card */}
                <svg
                  aria-hidden
                  className="relative -top-2 h-14 w-10 rotate-[14deg]"
                  viewBox="0 0 40 56"
                  fill="none"
                >
                  <path
                    ref={arrowRef}
                    d="M34 4C38 16 26 38 10 48"
                    stroke="var(--color-signal)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 48L19 44M10 48L12 38"
                    stroke="var(--color-signal)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </p>

              <div
                data-prelude-in=""
                data-prelude-card=""
                className="relative"
                style={{ opacity: fade }}
              >
                {/* tape strips */}
                <span
                  aria-hidden
                  data-prelude-node=""
                  className="absolute -top-3 left-8 z-20 block h-6 w-24 rotate-[-7deg] bg-bone/30"
                />
                <span
                  aria-hidden
                  data-prelude-node=""
                  className="absolute -right-6 -bottom-4 z-20 block h-6 w-20 rotate-[6deg] bg-bone/25"
                />
                {/* hand-drawn 8-point star on the bottom-left corner */}
                <svg
                  aria-hidden
                  data-prelude-node=""
                  className="absolute -bottom-5 -left-7 z-20 h-14 w-14"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 1.5V22.5M1.5 12H22.5M4.7 4.7L19.3 19.3M19.3 4.7L4.7 19.3"
                    stroke="var(--color-signal)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>

                <div className="relative z-10 w-[min(19rem,66vw)] overflow-hidden rounded-[1.9rem] border border-bone/25 shadow-paper md:w-[21rem]">
                  <picture>
                    <source
                      type="image/avif"
                      srcSet="/curator-portrait@2x.avif"
                    />
                    <source
                      type="image/webp"
                      srcSet="/curator-portrait@2x.webp"
                    />
                    <img
                      src="/curator-portrait@2x.webp"
                      alt="Hardeep Dilip Shetty, smiling in front of a massive tree"
                      width={1400}
                      height={1750}
                      loading="eager"
                      className="portrait-grade block aspect-4/5 w-full object-cover"
                    />
                  </picture>
                </div>
              </div>
            </figure>

            {/* copy — right of the portrait on desktop */}
            <p
              data-prelude-in=""
              data-prelude-copy=""
              data-prelude-drift="-18"
              className="order-3 mx-auto max-w-[30rem] text-pretty leading-[1.6] text-bone lg:order-3 lg:mx-0"
              style={{ opacity: fade }}
            >
              I spend an unreasonable amount of time watching YouTube. Which
              keeps leading me to{" "}
              <span className="font-meta text-[0.92em] tracking-[0.14em] text-amber uppercase">
                golden
              </span>{" "}
              gems. So — this is a curated collection of{" "}
              <span className="font-quote italic text-bone">
                those goldies.
              </span>
            </p>
          </div>
        </div>

        {/* last beat — the red hero completes the sentence below */}
        <div
          data-prelude-welcome=""
          data-prelude-drift="-32"
          className="flex flex-col items-center gap-4 text-center"
        >
          <p className="font-display text-[clamp(1.35rem,3.2vw,2.2rem)] tracking-[0.18em] text-bone uppercase">
            <span className="sr-only">Welcome to</span>
            <span aria-hidden className="flex justify-center gap-[0.4em]">
              <span
                data-prelude-in=""
                className="-me-[0.06em] inline-block"
                style={{ opacity: fade }}
              >
                Welcome
              </span>
              <span
                data-prelude-in=""
                className="-me-[0.06em] inline-block"
                style={{ opacity: fade }}
              >
                to
              </span>
            </span>
          </p>
          <span
            data-prelude-cue=""
            aria-hidden
            className="prelude-cue block size-1.5 rounded-full bg-bone/70"
            style={{ opacity: fade }}
          />
        </div>
      </div>
    </section>
  );
}

function introDone() {
  return !document.documentElement.classList.contains("intro-pending");
}

"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useLenisInstance } from "@/lib/smooth-scroll";
import { onIntroDone } from "@/lib/introGate";
import { WordsStagger } from "@/components/WordsStagger";

/**
 * Prelude — the pre-hero introduction (ADR-0007).
 *
 * One beat panel between the intro overlay and the red hero: the curator
 * says hello, a portrait arrives dead centre, collage nodes land around it,
 * and "WELCOME TO" arrives on the visitor's first scroll — the red hero's
 * DRISHYA/KOSH completes the sentence below (site mark left, the page's one
 * nav shortcut right).
 *
 * Motion borrows Spell UI's blur-reveal / words-stagger techniques but runs
 * on the house GSAP engine. Chrome, "Hello there", the arrow, the portrait
 * ride one master timeline; every run of prose (name, copy, "Welcome to")
 * is a <WordsStagger> with its own delay. Both are gated on
 * the intro overlay's `dk:intro:done` event (started directly on session
 * replays, where the overlay never runs). Per-element scroll drift hands
 * the panel off to the hero as it scrolls out — same rAF/scrub grammar as
 * the hero's wedge, no pin; the hero's own `top top` scrub is untouched.
 *
 * Every hidden state is in the server markup (inline style), never applied
 * post-hydration — otherwise the SSR paint shows the finished piece first
 * (that is how the arrow used to appear before everything else).
 *
 * Crispness: every transient `filter: blur()` is cleared when its reveal
 * ends — a resting `blur(0px)` keeps the element on its own filter surface
 * and softens the text inside it.
 *
 * reduced motion: static accounting — everything visible, no timeline, no
 * drift.
 */
export function Prelude() {
  const rootRef = useRef<HTMLElement>(null);
  const arrowRef = useRef<SVGSVGElement>(null);
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
          "[data-prelude-in], [data-prelude-node], [data-prelude-drift], [data-prelude-arrow], [data-prelude-arrow] path",
        ) ?? [],
        { clearProps: "all" },
      );
      return;
    }
    if (!root || !arrow) return;

    gsap.registerPlugin(ScrollTrigger);

    const cleanups: Array<() => void> = [];

    let started = false;
    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: "power2.out" },
    });
    const start = () => {
      if (started || tl.progress() > 0) return;
      started = true;
      tl.play();
    };

    // per-element drift as the panel scrolls away beneath the hero — same
    // span for every element, different distances = differential depth.
    // Distances are data-prelude-drift, in yPercent of the element itself.
    gsap.utils.toArray<HTMLElement>("[data-prelude-drift]").forEach((el) => {
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
          start: "10% top",
          end: "65% top",
          scrub: 0.4,
          invalidateOnRefresh: true,
        },
      });
      cleanups.push(() => {
        wf.scrollTrigger?.kill();
        wf.kill();
      });
    }

    // arrival — initial states. The server markup already renders every one
    // of these hidden (see `fade` / `arrowHidden` below); re-asserting them
    // here just re-arms the timeline after a Strict Mode remount.
    const arrowPaths = arrow.querySelectorAll<SVGPathElement>("path");
    const [arrowStroke, arrowHead] = Array.from(arrowPaths);
    gsap.set(root.querySelectorAll("[data-prelude-in]"), {
      opacity: 0,
      y: 10,
      filter: "blur(10px)",
    });
    gsap.set(root.querySelectorAll("[data-prelude-node]"), {
      opacity: 0,
      scale: 0.92,
    });
    gsap.set(arrowPaths, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(arrow, { opacity: 0 });

    const firsts = root.querySelectorAll("[data-prelude-first]");
    const nodes = root.querySelectorAll("[data-prelude-node]");

    // the words land first ("Hello", "there"), only then does the arrow draw
    // itself from the label into the card: shaft, then head
    tl.to(
      firsts,
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.6,
        stagger: 0.1,
      },
      0,
    )
      .set(arrow, { opacity: 1 }, 0.5)
      .to(
        arrowStroke,
        { strokeDashoffset: 0, duration: 0.45, ease: "power1.inOut" },
        0.5,
      )
      .to(
        arrowHead,
        { strokeDashoffset: 0, duration: 0.2, ease: "power1.out" },
        0.92,
      )
      .to(
        "[data-prelude-card]",
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          rotate: -0.5,
          duration: 0.85,
          ease: "power3.out",
        },
        0.7,
      )
      .to(
        nodes,
        {
          opacity: (i, el) =>
            Number((el as HTMLElement).dataset.preludeNodeOpacity ?? "1"),
          scale: 1,
          duration: 0.7,
          stagger: 0.07,
        },
        1.3,
      );

    // revealed — drop the resting blur(0px) so the text rasterises crisp
    tl.eventCallback("onComplete", () => {
      gsap.set(root.querySelectorAll("[data-prelude-in]"), {
        clearProps: "filter",
      });
    });

    cleanups.push(() => {
      tl.kill();
    });

    // hand-off from the intro overlay: start when it's gone — either the
    // overlay already finished this session (no event will come) or fires
    cleanups.push(onIntroDone(start));

    return () => cleanups.forEach((fn) => fn());
  }, [reduced]);

  // the copy's underline draws itself once the last word has landed
  const drawUnderline = () => {
    if (reduced) return;
    const mark = rootRef.current?.querySelector<HTMLElement>("[data-scribble]");
    if (!mark) return;
    gsap.to(mark, { "--ul": 1, duration: 0.7, ease: "power2.out" });
  };

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
  // the arrow is a drawn stroke: hidden by a normalised dash (pathLength=1)
  // so the SSR paint needs no measuring — and the head hides with the shaft
  const arrowHidden: CSSProperties | undefined = reduced
    ? undefined
    : { strokeDasharray: 1, strokeDashoffset: 1 };

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

      <div className="relative z-10 flex min-h-[100svh] flex-col px-6 pt-[calc(var(--nav-top)+env(safe-area-inset-top,0px))] pb-8 md:px-10">
        {/* corner chrome — decorative site mark left, the page's one nav
            shortcut right (ADR-0007) */}
        <header className="flex h-11 items-center justify-between md:h-16">
          <p
            aria-hidden
            data-prelude-in=""
            data-prelude-first=""
            className="font-display text-[0.72rem] leading-none font-medium tracking-[0.16em] text-bone uppercase md:text-[1.05rem] md:tracking-[0.26em]"
            style={{ opacity: fade }}
          >
            Drishyakosh
          </p>
          {/* solid bone pill + signal-red arrow disc: the same ink / bone / red
              grammar as the hero below, and as tall as the centre mark */}
          <button
            type="button"
            onClick={goToArchive}
            data-prelude-in=""
            data-prelude-first=""
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-bone ps-3.5 pe-1.5 font-display text-[0.64rem] leading-none font-medium tracking-[0.16em] text-ink uppercase transition-[background-color,scale] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-signal active:scale-[0.97] md:h-12 md:gap-4 md:ps-6 md:pe-1.5 md:text-[0.82rem] md:tracking-[0.22em]"
            style={{ opacity: fade }}
          >
            Archive
            <span className="grid size-8 place-items-center rounded-full bg-ink text-bone transition-colors duration-200 group-hover:text-signal md:size-9">
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                fill="none"
                className="size-4 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-y-0.5"
              >
                <path
                  d="M8 2.5V13M3 8.5L8 13.5L13 8.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </header>

        {/* the beat: hello → portrait → name → copy */}
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="grid w-full max-w-[74rem] grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
            {/* name — left of the portrait on desktop */}
            <p
              data-prelude-drift="-22"
              className="order-2 text-bone lg:order-1 lg:justify-self-end lg:text-right"
            >
              <WordsStagger
                delay={1.1}
                className="block -me-[0.14em] font-hand text-[clamp(1.35rem,2.4vw,2rem)] text-signal"
              >
                i am
              </WordsStagger>
              <WordsStagger
                delay={1.25}
                stagger={0.12}
                speed={0.6}
                className="mt-2 block -me-[0.12em] font-hand text-[clamp(2.1rem,4vw,3.4rem)] leading-[1.04]"
              >
                Hardeep
                <br />
                Dilip Shetty
              </WordsStagger>
            </p>

            {/* portrait figure with collage nodes */}
            <figure
              data-prelude-drift="-8"
              className="relative mx-auto order-1 lg:order-2"
            >
              <p className="relative z-10 mb-3 flex items-start justify-center gap-2 md:mb-4">
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
                {/* hand-drawn arrow pointing the label into the card. Hidden in
                    the server markup (svg opacity + normalised dash, so the
                    round caps can't leave a dot) and drawn after the words */}
                <svg
                  ref={arrowRef}
                  aria-hidden
                  data-prelude-arrow=""
                  className="relative -top-2 h-14 w-10 rotate-[14deg]"
                  viewBox="0 0 40 56"
                  fill="none"
                  style={{ opacity: fade }}
                >
                  <path
                    d="M34 4C38 16 26 38 10 48"
                    pathLength={1}
                    stroke="var(--color-signal)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    style={arrowHidden}
                  />
                  <path
                    d="M10 48L19 44M10 48L12 38"
                    pathLength={1}
                    stroke="var(--color-signal)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={arrowHidden}
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
              data-prelude-drift="-18"
              className="order-3 mx-auto max-w-[30rem] text-pretty leading-[1.6] text-bone lg:order-3 lg:mx-0"
            >
              <WordsStagger
                delay={1.7}
                stagger={0.04}
                onComplete={drawUnderline}
              >
                I spend an unreasonable amount of time watching YouTube, which
                often lands me on a lot of{" "}
                <span className="font-hand text-[1.3em] leading-none text-amber">
                  gems.
                </span>{" "}
                I&nbsp;usually just send the links to my friends and get done
                with it. Then I&nbsp;thought, how about I&nbsp;make a curated
                collection of{" "}
                {/* --ul: 0 in the server markup, so the line can't exist
                    before the words do; drawUnderline() takes it to 1 */}
                <span
                  data-scribble=""
                  className="scribble-underline font-hand text-[1.35em] leading-none text-amber"
                  style={{ "--ul": reduced ? 1 : 0 } as CSSProperties}
                >
                  these goldies?
                </span>
              </WordsStagger>
            </p>
          </div>
        </div>

        {/* last beat — the red hero completes the sentence below */}
        <div
          data-prelude-welcome=""
          data-prelude-drift="-32"
          className="text-center"
        >
          <p className="font-display text-[clamp(1.35rem,3.2vw,2.2rem)] tracking-[0.18em] text-bone uppercase">
            {/* ps = the trailing letter-spacing, so the line centres optically.
                Held back until the visitor's first scroll. */}
            <WordsStagger
              startOnScroll={6}
              stagger={0.14}
              className="block ps-[0.18em]"
            >
              Welcome to
            </WordsStagger>
          </p>
        </div>
      </div>
    </section>
  );
}

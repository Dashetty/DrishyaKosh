"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { introDone, onIntroDone } from "@/lib/introGate";
import { useLenisInstance } from "@/lib/smooth-scroll";
import type Lenis from "lenis";

/**
 * Theater — ACT I, the opening title card (replaces the taffy hero).
 *
 * One pinned, scroll-driven scene styled after a golden-age title card:
 * closed red velvet curtains inside an ornate gold proscenium, a warm
 * spotlight pooling on the fabric, and the marquee typography arriving
 * over it. The curtain never parts — the scroll *is* the act:
 *
 *   arrival (plays once, gated on the intro overlay AND the theater
 *   entering view — either can open first; a pin engage mid-arrival
 *   fast-forwards it, and a 4s failsafe lights the house if the intro
 *   never reports done)
 *     the room SSR-renders DARK (.theater-house) — the lamp STRIKES
 *     out of black (a projector strike only reads against a dark
 *     house), a brief flicker like a lamp finding its arc → the dark
 *     lifts as the spotlight blooms → the DRISHYAKOSH marquee settles
 *     letter by letter along its arc → corp. credit → the reel-mark
 *     crest → the playbill block (curated by / estb. / tagline)
 *   scroll (pinned, ~250svh, scrub 0.55, three acts)
 *     1. house settles — the lamp finds its mark, the velvet eases
 *     2. lights down — the room darkens around the lit card
 *     3. the raise — the card exits in reading order, then the whole
 *        drape — curtain, valance and all — RISES from the bottom
 *        (clip-path inset, the fringe carrying the wipe) revealing the
 *        bare stage; the house lights come back up as it clears, and
 *        the frame fades as the act ends
 *     the raise snaps to its two rest states when the visitor stops
 *     mid-raise (through lenis.scrollTo — see below)
 *
 * Choreography rules: the type only drifts with the pre-rise acts and
 * fades before the wipe — it never rides the raise itself; the drape
 * rises via clip-path alone — no layout properties animate; the letters'
 * arc placement is a static CSS transform (outer span) that GSAP never
 * touches (it animates the inner span's own transforms).
 *
 * Scrub 0.55, not the house 1.1: Lenis already owns the scroll lag
 * (lerp 0.09) and a second smoothing pass reads floaty — one lag is
 * cinematic, two is mush. For the same reason the raise's snap is done
 * by hand: ScrollTrigger's built-in snap tweens scrollTop, which Lenis's
 * ticker overwrites every frame — they fight. Snapping through
 * lenis.scrollTo sets Lenis's own target, so the engines agree.
 * (`?no-snap` disables the snap for QA sampling.)
 *
 * reduced motion: the finished card, fully visible, no pin — the theater
 * reads as a still.
 */

const WORD = "DRISHYAKOSH";
const ARC_CENTER = (WORD.length - 1) / 2; // 5 — the letter that rides flat

/* twelve fixed motes: hand-placed inside the lamp cone (positions in %
   of the stage) so SSR and client agree without a seeded PRNG */
const MOTES = [
  { x: 46.2, y: 30, s: 3, d: "11s", delay: "0s", dx: "14px", o: 0.6 },
  { x: 50.8, y: 24, s: 2, d: "9s", delay: "1.2s", dx: "-10px", o: 0.5 },
  { x: 48.1, y: 38, s: 4, d: "13s", delay: "2.4s", dx: "18px", o: 0.65 },
  { x: 53.4, y: 33, s: 2, d: "8s", delay: "0.6s", dx: "-16px", o: 0.45 },
  { x: 44.7, y: 27, s: 2, d: "10s", delay: "3.1s", dx: "9px", o: 0.4 },
  { x: 51.9, y: 44, s: 3, d: "12s", delay: "1.8s", dx: "-8px", o: 0.55 },
  { x: 47.3, y: 21, s: 2, d: "9.5s", delay: "4s", dx: "12px", o: 0.5 },
  { x: 49.5, y: 48, s: 3, d: "14s", delay: "2.9s", dx: "16px", o: 0.6 },
  { x: 45.4, y: 35, s: 2, d: "10.5s", delay: "0.9s", dx: "-12px", o: 0.45 },
  { x: 52.6, y: 18, s: 2, d: "8.5s", delay: "3.6s", dx: "10px", o: 0.4 },
  { x: 48.8, y: 41, s: 4, d: "12.5s", delay: "1.5s", dx: "-15px", o: 0.6 },
  { x: 50.2, y: 29, s: 2, d: "9.8s", delay: "4.4s", dx: "11px", o: 0.5 },
] as const;

export function Theater() {
  const rootRef = useRef<HTMLElement>(null);
  const drapeRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLImageElement>(null);
  const swagRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLImageElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  const corpRef = useRef<HTMLParagraphElement>(null);
  const crestRef = useRef<HTMLDivElement>(null);
  const creditsRef = useRef<HTMLDivElement>(null);
  const motesRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const ignitionRef = useRef<HTMLDivElement>(null);
  const houseRef = useRef<HTMLDivElement>(null);
  const stagePoolRef = useRef<HTMLDivElement>(null);
  const actTwoRef = useRef<HTMLDivElement>(null);
  const letterInnersRef = useRef<NodeListOf<HTMLElement> | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const reduced = useReducedMotion();
  const lenis = useLenisInstance();

  // the snap must reach Lenis from inside the effect; the instance is
  // published async by SmoothScroll, so mirror it on every render
  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    const drape = drapeRef.current;
    const curtain = curtainRef.current;
    const swag = swagRef.current;
    const frame = frameRef.current;
    const type = typeRef.current;
    const corp = corpRef.current;
    const crest = crestRef.current;
    const credits = creditsRef.current;
    const motes = motesRef.current;
    const dim = dimRef.current;
    const ignition = ignitionRef.current;
    const house = houseRef.current;
    const stagePool = stagePoolRef.current;
    const actTwo = actTwoRef.current;
    if (
      !root || !drape || !curtain || !swag || !frame || !type ||
      !corp || !crest || !credits || !motes || !dim || !ignition ||
      !house || !stagePool || !actTwo
    )
      return;

    const letterInners = (letterInnersRef.current ??=
      root.querySelectorAll<HTMLElement>("[data-arch-letter]"));
    const moteSpans = motes.querySelectorAll<HTMLElement>(".theater-mote");

    gsap.registerPlugin(ScrollTrigger);

    /* arrival — one master timeline, gated on the intro overlay */
    const arrive = gsap.timeline({ paused: true, defaults: { ease: "power4.out" } });
    arrive
      .set(type, { opacity: 1 }, 0)
      .fromTo(
        root.querySelector("[data-theater-spot]"),
        { opacity: 0 },
        { opacity: 1, duration: 1.4, ease: "power2.out" },
        0
      )
      .to(
        ignition,
        // the lamp strike: one bright flash dips out of the dark and
        // burns off (≤3 flashes/sec — the accessibility limit; the
        // strike reads enormously against the dark house, so it must
        // stay calm). The halo's own opacity is owned by its CSS
        // breathe animation — keyframes beat inline styles — so the
        // strike gets a dedicated overlay that keys off the same lamp
        // position.
        {
          keyframes: [
            { opacity: 0.9, duration: 0.18 },
            { opacity: 0.12, duration: 0.15 },
            { opacity: 0.85, duration: 0.2 },
            { opacity: 0, duration: 0.55, ease: "power2.in" },
          ],
        },
        0.05
      )
      .fromTo(
        house,
        // the house was dark; the strike brings the light up. Runs under
        // the flicker so the flashes erupt out of black.
        { opacity: 0.88 },
        { opacity: 0, duration: 1.6, ease: "power2.inOut" },
        0.2
      )
      .fromTo(
        curtain,
        { scale: 1.055 },
        { scale: 1, duration: 2.2, ease: "power2.out" },
        0
      )
      .fromTo(
        swag,
        { yPercent: -4, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.5 },
        0.35
      )
      .fromTo(
        frame,
        { opacity: 0 },
        { opacity: 1, duration: 1.3 },
        0.55
      )
      .fromTo(
        letterInners,
        // no filter tween: an inline filter would stomp the CSS depth
        // shadows (single writer) — the letters arrive via mask, not blur
        { yPercent: 128, rotation: -9, autoAlpha: 0 },
        {
          yPercent: 0,
          rotation: 0,
          autoAlpha: 1,
          duration: 1,
          stagger: 0.05,
        },
        0.55
      )
      .fromTo(
        corp,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.8 },
        1.55
      )
      .fromTo(
        crest,
        // the crest prints with the credits beat — rules draw outward
        { autoAlpha: 0, scaleX: 0.4 },
        { autoAlpha: 1, scaleX: 1, duration: 0.9, ease: "power3.out" },
        1.75
      )
      .fromTo(
        credits.children,
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.75, stagger: 0.14 },
        1.85
      );
    // (the motes need no arrival tween — their CSS cycle brings each one
    // in on its own delay; a GSAP opacity write would lose to the same
    // keyframes, exactly like the halo's)

    /* ACT I plays in view: the intro must be done AND the theater in
       view (once). Either can open first; the arrival fires when the
       second does. */
    let inView = false;
    let introOver = introDone();
    const maybePlay = () => {
      if (inView && introOver) arrive.play();
    };
    const cancelIntroGate = onIntroDone(() => {
      introOver = true;
      maybePlay();
    });
    // failsafe: if the intro never reports done (a stuck overlay, slow
    // JS), the house must not stay dark — light it ~4s after entering
    // view regardless
    let failsafe: ReturnType<typeof setTimeout> | undefined;
    const arrivalGate = ScrollTrigger.create({
      trigger: root,
      start: "top 45%", // most of the theater on screen when the show starts
      once: true,
      onEnter: () => {
        inView = true;
        maybePlay();
        failsafe = setTimeout(() => {
          introOver = true;
          maybePlay();
        }, 4000);
      },
    });
    // the arrival and the scrub can now overlap: if the pin engages
    // while the arrival is still playing, fast-forward it — do NOT jump
    // it to the end, a cut to the finished card would pop
    const pinGate = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      once: true,
      onEnter: () => {
        if (arrive.progress() < 1) arrive.timeScale(4);
      },
    });

    /* the scroll composition — pinned, three acts, scrubbed.
       Scrub 0.55 (not the house 1.1): Lenis already owns the lag — see
       the header. Beat boundaries are fractions of the pin's timeline;
       they double as the snap rest states. */
    const SETTLE = 0.3; // act 1 ends — the house has settled
    const LIGHTS_DOWN = 0.62; // act 2 ends — room dark, card lit, drape down
    const RAISE_START = 0.7; // the raise begins — the drape clip starts
    const RAISE_END = 0.92; // the raise is complete — the stage rests bare
    const FRAME_START = RAISE_START + 0.04; // the arch holds one beat,
    // then dissolves with the fabric

    const rise = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.55,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    rise
      // ACT 1 — house settles: the lamp finds its mark, the velvet eases
      .fromTo(
        root,
        { "--spot-x": "50%", "--spot-y": "30%" },
        {
          "--spot-x": "47.5%",
          "--spot-y": "33.5%",
          ease: "power1.inOut",
          duration: SETTLE,
        },
        0
      )
      .fromTo(
        curtain,
        { yPercent: 0 },
        { yPercent: 1.2, ease: "power1.inOut", duration: SETTLE },
        0
      )
      .fromTo(
        type,
        { yPercent: 0 },
        { yPercent: -1, ease: "power1.inOut", duration: SETTLE },
        0
      )
      // ACT 2 — lights down: the room darkens around the lit card (the
      // dim overlay sits under the type — the marquee keeps glowing)
      .fromTo(
        dim,
        { opacity: 0 },
        { opacity: 0.65, ease: "power1.inOut", duration: LIGHTS_DOWN - SETTLE },
        SETTLE
      )
      // the lamp narrows onto the card as the house goes dark
      .fromTo(
        root,
        { "--spot-r": "46%" },
        { "--spot-r": "33%", ease: "power1.inOut", duration: LIGHTS_DOWN - SETTLE },
        SETTLE
      )
      .to(
        root,
        {
          "--spot-x": "48.5%",
          "--spot-y": "36%",
          ease: "power1.inOut",
          duration: LIGHTS_DOWN - SETTLE,
        },
        SETTLE
      )
      .to(
        curtain,
        { yPercent: 2.2, ease: "power1.inOut", duration: LIGHTS_DOWN - SETTLE },
        SETTLE
      )
      .to(
        type,
        { yPercent: -2.5, ease: "power1.inOut", duration: LIGHTS_DOWN - SETTLE },
        SETTLE
      )
      // ACT 3 — the raise: the card exits in reading order, marquee last
      .to(corp, { autoAlpha: 0, y: -8, duration: 0.04, ease: "none" }, LIGHTS_DOWN)
      .to(crest, { autoAlpha: 0, duration: 0.04, ease: "none" }, LIGHTS_DOWN + 0.02)
      .to(credits, { autoAlpha: 0, y: -10, duration: 0.05, ease: "none" }, LIGHTS_DOWN + 0.03)
      .to(type, { autoAlpha: 0, duration: 0.04, ease: "none" }, LIGHTS_DOWN + 0.06)
      // THE RAISE — bottom inset grows; the fringe carries the wipe up.
      // clip-path only: compositor-safe, no layout property touched.
      .fromTo(
        drape,
        { clipPath: "inset(0% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: RAISE_END - RAISE_START,
          ease: "none",
        },
        RAISE_START
      )
      // the fabric gathers upward faster than the reveal — tension, not
      // a flat wipe (the clip does the reveal, the translate hoists)
      .fromTo(
        drape,
        { yPercent: 0 },
        { yPercent: -10, duration: RAISE_END - RAISE_START, ease: "none" },
        RAISE_START
      )
      // the dust dies with the lamp — tween the SPANS' --o (the var their
      // CSS keyframes actually read); the container's own --o would be
      // overridden by each span's inline value, and an inline opacity
      // write would lose to the keyframes entirely
      .to(moteSpans, { "--o": 0, duration: 0.1, ease: "none" }, 0.72)
      // house lights back up as the curtain clears — the reveal's reward:
      // the dim lifts and the lamp opens wide over the bare stage
      .to(dim, { opacity: 0, duration: 0.1, ease: "power1.inOut" }, 0.8)
      .to(root, { "--spot-r": "54%", duration: RAISE_END - 0.8, ease: "power1.out" }, 0.8)
      .fromTo(
        stagePool,
        { opacity: 0.6 },
        { opacity: 1, duration: RAISE_END - 0.78, ease: "power1.out" },
        0.78
      )
      // the architecture dissolves with the fabric it frames — one
      // motion, both gone by RAISE_END (a late lone-frame fade read as
      // an afterthought). Explicit from + immediateRender:false: never
      // capture a mid-arrival opacity, and never stomp the arrival's
      // hidden state at build time.
      .fromTo(
        frame,
        { autoAlpha: 1 },
        {
          autoAlpha: 0,
          duration: RAISE_END - FRAME_START,
          ease: "power1.in",
          immediateRender: false,
        },
        FRAME_START
      )
      // ACT II — the next act's label prints above the seam as the raise
      // completes; the Archive's heading completes the sentence across
      // it. Prints 0.86 → 0.92: settled at the snap's rest state, holds
      // through the pin's last stretch.
      .fromTo(
        actTwo,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.06, ease: "power1.out" },
        0.86
      );

    /* the raise's snap, by hand (ScrollTrigger's snap fights Lenis — see
       the header): when the visitor stops mid-raise, ease to the nearer
       rest state — the settled card or the bare stage. ?no-snap opts out
       for QA sampling of the raw scrub states. */
    const snapEnabled =
      !new URLSearchParams(window.location.search).has("no-snap");
    let snapTimer: ReturnType<typeof setTimeout> | undefined;
    const snapToRest = () => {
      const st = rise.scrollTrigger;
      if (!st) return;
      const p = st.progress;
      if (p <= LIGHTS_DOWN || p >= RAISE_END) return;
      const rest = p - LIGHTS_DOWN < RAISE_END - p ? LIGHTS_DOWN : RAISE_END;
      const y = st.start + (st.end - st.start) * rest;
      const l = lenisRef.current;
      if (l) l.scrollTo(y, { duration: 0.7, easing: (t) => 1 - Math.pow(1 - t, 2) });
      else window.scrollTo({ top: y, behavior: "smooth" });
    };
    const onScrollIdle = () => {
      clearTimeout(snapTimer);
      if (snapEnabled) snapTimer = setTimeout(snapToRest, 200);
    };
    window.addEventListener("scroll", onScrollIdle, { passive: true });

    let alive = true;
    document.fonts?.ready.then(() => {
      if (alive) ScrollTrigger.refresh();
    });

    return () => {
      alive = false;
      cancelIntroGate();
      arrivalGate.kill();
      pinGate.kill();
      clearTimeout(failsafe);
      arrive.kill();
      rise.scrollTrigger?.kill();
      rise.kill();
      clearTimeout(snapTimer);
      window.removeEventListener("scroll", onScrollIdle);
      // targeted teardown: strip exactly the inline styles GSAP wrote —
      // including the credits' CHILDREN (the arrival fromTo's
      // immediateRender writes their hidden from-state even on a paused
      // timeline, and the reduced flip re-renders them clean in JSX; a
      // container-only clearProps would leave them invisible forever)
      gsap.set(
        [
          root, drape, curtain, swag, frame, type, corp, crest, credits,
          motes, dim, ignition, house, stagePool, actTwo,
        ],
        { clearProps: "all" }
      );
      gsap.set(credits.children, { clearProps: "all" });
      gsap.set(letterInners, { clearProps: "all" });
    };
  }, [reduced]);

  /* reduced motion (or the pre-JS paint): the finished card */
  const staticCard = reduced;

  return (
    <section
      ref={rootRef}
      data-hero-scrub=""
      aria-label="DrishyaKosh — the archive's opening title card"
      className={`relative isolate z-10 bg-ink ${
        staticCard ? "min-h-[100svh]" : "min-h-[250svh]"
      }`}
      style={
        staticCard
          ? undefined
          : ({ "--spot-x": "50%", "--spot-y": "30%" } as CSSProperties)
      }
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* no-JS failsafe: without GSAP the dark house never lifts —
            show the velvet (the type layers are separately JS-gated) */}
        <noscript>
          <style>{`.theater-house{opacity:0 !important}`}</style>
        </noscript>
        <h1 className="sr-only">
          DrishyaKosh — Curated YouTube Video collection by Hardeep Dilip Shetty
        </h1>

        {/* the bare stage — what the rising curtain reveals */}
        <div aria-hidden className="absolute inset-0 bg-ink">
          <div
            ref={stagePoolRef}
            className="theater-stage-pool absolute inset-0"
          />
          <div className="light-leak left-[30%] top-[20%] h-[46%] w-[40%]" />
        </div>

        {/* THE DRAPE — curtain + valance + their light; the clip target */}
        <div
          ref={drapeRef}
          aria-hidden
          className="theater-drape absolute inset-0 z-10"
          style={staticCard ? undefined : { clipPath: "inset(0% 0% 0% 0%)" }}
        >
          <div className="theater-breathe absolute inset-0">
            <img
              ref={curtainRef}
              src="/HeroSection/opt/curtain-desktop.avif"
              srcSet="/HeroSection/opt/curtain-mobile.avif 900w, /HeroSection/opt/curtain-desktop.avif 1672w"
              sizes="100vw"
              alt=""
              draggable={false}
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
          {/* the dark house — SSR-renders the room near-black (ADR-0011:
              hidden states in SSR markup); the arrival lifts it as the
              lamp strikes. Inside the drape so the strike's screen-blend
              sits above it and the raise clips it away with the fabric
              (it rests at opacity 0). */}
          <div
            ref={houseRef}
            className="theater-house"
            style={staticCard ? undefined : { opacity: 0.88 }}
          />
          {/* the lamp pool on the velvet */}
          <div data-theater-spot className="theater-spot" style={staticCard ? undefined : { opacity: 0 }} />
          {/* the lamp strike — GSAP flickers it out during the arrival */}
          <div ref={ignitionRef} className="theater-ignition" />
          {/* the valance, graded to the curtain's shadow depth */}
          <div
            ref={swagRef}
            className="theater-swag absolute inset-x-0 top-0"
            style={staticCard ? undefined : { opacity: 0 }}
          >
            <img
              src="/HeroSection/opt/swag-desktop.webp"
              srcSet="/HeroSection/opt/swag-mobile.webp 1100w, /HeroSection/opt/swag-desktop.webp 2172w"
              sizes="104vw"
              alt=""
              draggable={false}
              decoding="async"
              className="ml-[-2%] w-[104%]"
              style={{
                filter: "brightness(0.8) saturate(0.92) contrast(1.06)",
              }}
            />
          </div>
          {/* the lamp's bloom above the swag line — its opacity is owned
              by its own CSS breathe (keyframes beat inline styles) */}
          <div className="theater-halo" />
        </div>

        {/* dust in the lamp cone — floats with the room, not the fabric */}
        <div ref={motesRef} aria-hidden className="absolute inset-0 z-20">
          {MOTES.map((m, i) => (
            <span
              key={i}
              className="theater-mote"
              style={
                {
                  left: `${m.x}%`,
                  top: `${m.y}%`,
                  "--s": `${m.s}px`,
                  "--d": m.d,
                  "--delay": m.delay,
                  "--dx": m.dx,
                  "--o": m.o,
                  opacity: staticCard ? m.o : 0,
                } as CSSProperties
              }
            />
          ))}
        </div>

        {/* the proscenium */}
        <img
          ref={frameRef}
          src="/HeroSection/opt/frame-desktop.webp"
          srcSet="/HeroSection/opt/frame-mobile.webp 900w, /HeroSection/opt/frame-desktop.webp 1672w"
          sizes="100vw"
          alt=""
          aria-hidden
          draggable={false}
          decoding="async"
          className="pointer-events-none absolute inset-0 z-30 h-full w-full object-cover"
          style={staticCard ? undefined : { opacity: 0 }}
        />

        {/* vignette melts the photo into the ink around it */}
        <div aria-hidden className="theater-vignette absolute inset-0 z-[35]" />
        {/* lights down (act 2) — darkens the room, sits under the type */}
        <div ref={dimRef} aria-hidden className="theater-dim" />

        {/* THE CARD — drifts gently in the pin's pre-rise, fades before
            the wipe; never rides the raise itself */}
        <div
          ref={typeRef}
          className="absolute inset-0 z-[38] flex flex-col items-center justify-center pt-[7.5vh]"
          style={staticCard ? undefined : { opacity: 0 }}
        >
          {/* corp. credit — the Caslon voice */}
          <p
            ref={corpRef}
            className="theater-caslon theater-type mb-[1.2em] text-[clamp(0.72rem,1.35vw,1.05rem)]"
            style={staticCard ? undefined : { opacity: 0 }}
          >
            &amp; the Curator&rsquo;s Corp.
          </p>

          {/* the marquee — Broadway, arched, CSS-painted depth */}
          <div
            className="theater-arch whitespace-nowrap text-center font-[family-name:var(--font-broadway)] leading-none text-[clamp(2.6rem,6.4vw,8rem)]"
            aria-label={WORD}
          >
            {WORD.split("").map((ch, i) => (
              <span
                key={i}
                aria-hidden
                className="theater-arch-slot"
                style={
                  {
                    "--i": i,
                    "--c": ARC_CENTER,
                  } as CSSProperties
                }
              >
                <span className="theater-arch-letter">
                  <span data-arch-letter className="inline-block">
                    {ch}
                  </span>
                </span>
              </span>
            ))}
          </div>

          {/* the crest — the reel mark printed on the card, flanked by
              hairline rules (the floating SiteNav mark parks through the
              theater; this is where the mark lives instead, ADR-0014) */}
          <div
            ref={crestRef}
            className="mt-[2.6em] flex w-full items-center justify-center gap-[1.4em] px-[8vw]"
            style={staticCard ? undefined : { opacity: 0 }}
          >
            <span
              aria-hidden
              className="h-px flex-1 max-w-[9em] bg-gradient-to-r from-transparent to-[oklch(0.775_0.13_78/0.5)]"
            />
            <span aria-hidden className="theater-crest shrink-0" />
            <span
              aria-hidden
              className="h-px flex-1 max-w-[9em] bg-gradient-to-l from-transparent to-[oklch(0.775_0.13_78/0.5)]"
            />
          </div>

          {/* the playbill block */}
          <div ref={creditsRef} className="mt-[1.9em] text-center">
            <p
              className="theater-caslon theater-type text-[clamp(0.85rem,1.9vw,1.5rem)]"
              style={staticCard ? undefined : { opacity: 0 }}
            >
              Curated by Hardeep Dilip Shetty
            </p>
            <p
              className="theater-caslon theater-type mt-[0.7em] text-[clamp(0.72rem,1.25vw,1rem)]"
              style={staticCard ? undefined : { opacity: 0 }}
            >
              Estb. MMXXVI
            </p>
            <p
              className="theater-caslon theater-type mt-[0.45em] text-[clamp(0.72rem,1.25vw,1rem)]"
              style={staticCard ? undefined : { opacity: 0 }}
            >
              If it&rsquo;s on here, it&rsquo;s worth the watch
            </p>
          </div>
        </div>

        {/* ACT II — the intertitle printed on the bare stage above the
            seam; the Archive's own heading completes the sentence across
            the boundary ("ACT II — / THE ARCHIVE"). One rule + a
            seam-pointing tick — the phrase must read as continued, not
            closed. Hidden rest state owned by the class (clearProps
            trap — see .theater-dim). */}
        <div
          ref={actTwoRef}
          aria-hidden
          className="theater-act2 absolute inset-0 z-[38] flex flex-col items-center justify-end pb-[14svh]"
        >
          <div className="flex items-center gap-[1.4em] px-[8vw]">
            <span aria-hidden className="h-px w-14 border-t border-hairline" />
            {/* -mr compensates tracking-[0.5em]'s trailing space so the
                glyphs sit centred; 0.95rem floor keeps it readable.
                Inline color: .theater-type's own color beats the
                text-smoke utility in stylesheet order */}
            <span
              className="theater-caslon theater-type -mr-[0.5em] text-[clamp(0.95rem,1.5vw,1.2rem)] tracking-[0.5em]"
              style={{ color: "var(--color-smoke)" }}
            >
              ACT II
            </span>
          </div>
          {/* the tick pointing down at the seam — the sentence continues */}
          <span
            aria-hidden
            className="mt-[1.6em] block h-8 w-px border-l border-hairline"
          />
        </div>
      </div>
    </section>
  );
}

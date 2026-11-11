"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { onIntroDone } from "@/lib/introGate";

/**
 * Theater — ACT I, the opening title card (replaces the taffy hero).
 *
 * One pinned, scroll-driven scene styled after a golden-age title card:
 * closed red velvet curtains inside an ornate gold proscenium, a warm
 * spotlight pooling on the fabric, and the marquee typography arriving
 * over it. The curtain never parts — the scroll *is* the act:
 *
 *   arrival (plays once, gated on the intro overlay)
 *     spotlight blooms → the DRISHYAKOSH marquee settles letter by letter
 *     along its arc → corp. credit → the reel-mark crest → the playbill
 *     block (curated by / estb. / tagline)
 *   scroll (pinned, ~250svh, scrub 1.1)
 *     the lamp drifts, the velvet parallax-drifts, the card breathes;
 *     in the last third the credits dim and the whole drape — curtain,
 *     valance and all — RISES from the bottom (clip-path inset, the
 *     fringe carrying the wipe) revealing the bare stage, and the frame
 *     fades as the act ends. The carousel arrives on the empty stage.
 *
 * Choreography rules: the type only drifts with the pin's pre-rise phase
 * and fades before the wipe — it never rides the raise itself; the drape
 * rises via clip-path alone — no layout properties animate; the letters'
 * arc placement is a static CSS transform (outer span) that GSAP never
 * touches (it animates the inner span's own transforms).
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
  const letterInnersRef = useRef<NodeListOf<HTMLElement> | null>(null);
  const reduced = useReducedMotion();

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
    if (!root || !drape || !curtain || !swag || !frame || !type || !corp || !crest || !credits || !motes) return;

    const letterInners = (letterInnersRef.current ??=
      root.querySelectorAll<HTMLElement>("[data-arch-letter]"));

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
      .fromTo(
        root.querySelector("[data-theater-halo]"),
        { opacity: 0 },
        { opacity: 1, duration: 1.6, ease: "power2.out" },
        0.15
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
      )
      .fromTo(motes, { opacity: 0 }, { opacity: 1, duration: 1.2 }, 2.2);

    const cancelIntroGate = onIntroDone(() => arrive.play());

    /* the scroll composition — pinned, scrubbed */
    const rise = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    const riseSpan = 0.62; // the rise itself — the last ~1/3 of the pin
    const pre = 1 - riseSpan;

    rise
      // the lamp wanders; the velvet breathes against it
      .fromTo(
        root,
        { "--spot-x": "50%", "--spot-y": "30%" },
        { "--spot-x": "46%", "--spot-y": "40%", ease: "none", duration: pre },
        0
      )
      // the lamp wanders; the velvet drifts against it. yPercent only —
      // the curtain's scale is owned by the arrival zoom (single writer)
      .fromTo(
        curtain,
        { yPercent: 0 },
        { yPercent: 2.5, ease: "none", duration: pre },
        0
      )
      .fromTo(
        type,
        { yPercent: 0 },
        { yPercent: -4, ease: "none", duration: pre },
        0
      )
      // the card dims before the drape moves — type never rides the wipe
      .to(corp, { autoAlpha: 0, y: -10, duration: 0.08 * riseSpan, ease: "none" }, pre)
      .to(credits, { autoAlpha: 0, y: -12, duration: 0.1 * riseSpan, ease: "none" }, pre)
      .to(type, { autoAlpha: 0, duration: 0.06 * riseSpan, ease: "none" }, pre + 0.1 * riseSpan)
      // THE RAISE — bottom inset grows; the fringe carries the wipe up.
      // clip-path only: compositor-safe, no layout property touched.
      .fromTo(
        drape,
        { clipPath: "inset(0% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 0.82 * riseSpan,
          ease: "none",
        },
        pre + 0.18 * riseSpan
      )
      // the fabric gathers upward as it rises — the clip does the reveal,
      // the translate does the hoisting
      .fromTo(
        drape,
        { yPercent: 0 },
        { yPercent: -9, duration: 0.82 * riseSpan, ease: "none" },
        pre + 0.18 * riseSpan
      )
      .to(motes, { opacity: 0, duration: 0.3 * riseSpan, ease: "none" }, pre + 0.2 * riseSpan)
      // the architecture clears the stage last
      .to(frame, { autoAlpha: 0, duration: 0.12 * riseSpan, ease: "none" }, pre + 0.88 * riseSpan);

    let alive = true;
    document.fonts?.ready.then(() => {
      if (alive) ScrollTrigger.refresh();
    });

    return () => {
      alive = false;
      cancelIntroGate();
      arrive.kill();
      rise.scrollTrigger?.kill();
      rise.kill();
      // targeted teardown: strip exactly the inline styles GSAP wrote —
      // including the credits' CHILDREN (the arrival fromTo's
      // immediateRender writes their hidden from-state even on a paused
      // timeline, and the reduced flip re-renders them clean in JSX; a
      // container-only clearProps would leave them invisible forever)
      gsap.set(
        [root, drape, curtain, swag, frame, type, corp, crest, credits, motes],
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
        <h1 className="sr-only">
          DrishyaKosh — Curated YouTube Video collection by Hardeep Dilip Shetty
        </h1>

        {/* the bare stage — what the rising curtain reveals */}
        <div aria-hidden className="absolute inset-0 bg-ink">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 46% at 50% 46%, oklch(0.34 0.06 55 / 0.62) 0%, transparent 70%)",
            }}
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
          {/* the lamp pool on the velvet */}
          <div data-theater-spot className="theater-spot" style={staticCard ? undefined : { opacity: 0 }} />
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
          {/* the lamp's bloom above the swag line */}
          <div data-theater-halo className="theater-halo" style={staticCard ? undefined : { opacity: 0 }} />
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

        {/* vignette melts the photo into the matte */}
        <div aria-hidden className="theater-vignette absolute inset-0 z-[35]" />

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
      </div>
    </section>
  );
}

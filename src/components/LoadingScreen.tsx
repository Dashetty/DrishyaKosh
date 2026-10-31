"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { MARK_ASPECT, MARK_RAYS, MARK_VIEWBOX } from "./loader-mark-rays";

const INTRO_FLAG = "dk-intro";

// 0–9 then 0 again, so a column can roll 9 → 0 without a visual jump
const DIGIT_STACK = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

// Share of the bar each real loading signal owns (sums to 1)
const WEIGHTS = {
  fonts: 0.3,
  assets: 0.15,
  portrait: 0.25,
  load: 0.3,
} as const;
type Signal = keyof typeof WEIGHTS;

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Loading screen (plans/008) — the treasure mark develops on ink while a
 * frame counter climbs 000 → 100 from real loading signals (fonts, loader
 * art, curator portrait, window load). At 100 the counter drops away and the
 * chest flies to the Reel Mark's exact rect while the ink lifts, so the
 * Prelude is already moving underneath.
 *
 * Adaptive: ≥1.2s brand beat (0.6s on save-data / 2g), finishes the moment
 * the signals are in, hard-capped at 2.8s (1.6s lean). Runs once per
 * session — the pre-paint script in layout.tsx sets `html.intro-pending`.
 * First paint needs no JS: the mark, ring track and 000 are server markup,
 * the develop wipe and ray flicker are CSS.
 */
export function LoadingScreen() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const html = document.documentElement;
    if (!html.classList.contains("intro-pending")) return;

    const page = document.getElementById("page-content");

    // Event + session flag fire once, as early as the exit allows — the
    // Prelude listens for the event, not for the overlay's removal.
    let signalled = false;
    const signalDone = () => {
      if (signalled) return;
      signalled = true;
      try {
        sessionStorage.setItem(INTRO_FLAG, "1");
      } catch {
        /* private mode — intro just replays next visit */
      }
      window.dispatchEvent(new Event("dk:intro:done"));
    };
    const finish = () => {
      signalDone();
      page?.removeAttribute("inert");
      html.classList.remove("intro-pending");
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    // The overlay is the only thing on screen — take the page underneath out
    // of the tab order and the accessibility tree until the intro is done.
    page?.setAttribute("inert", "");

    const q = <T extends HTMLElement>(sel: string) =>
      root.querySelector<T>(sel);
    const bg = q("[data-loader-bg]");
    const markEl = q("[data-loader-mark]");
    const ring = q("[data-loader-ring]");
    const count = q("[data-loader-count]");
    const caption = q("[data-loader-caption]");
    const skipBtn = q<HTMLButtonElement>("[data-skip]");
    const stacks = Array.from(
      root.querySelectorAll<HTMLElement>("[data-loader-stack]"),
    );

    // ── adaptive budget ────────────────────────────────────────────────
    const conn = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    const lean = !!conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? "");
    const minMs = lean ? 600 : 1200;
    const capMs = lean ? 1600 : 2800;

    // ── real progress signals ──────────────────────────────────────────
    const done: Partial<Record<Signal, true>> = {};
    let target = 0;
    const signal = (key: Signal) => {
      if (done[key]) return;
      done[key] = true;
      target += WEIGHTS[key];
    };

    void document.fonts.ready.then(() => signal("fonts"));

    if (document.readyState === "complete") signal("load");
    else window.addEventListener("load", () => signal("load"), { once: true });

    // the loader art is CSS-masked, so probe the same URLs (cache-shared)
    void Promise.all(
      ["/loader/mark-chest.svg", "/loader/mark-ring.svg"].map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            // same CORS mode as the CSS mask fetch, so the preload and the
            // browser cache are shared instead of fetching twice
            img.crossOrigin = "anonymous";
            img.onload = img.onerror = () => resolve();
            img.src = src;
          }),
      ),
    ).then(() => signal("assets"));

    // the Prelude portrait — whichever source <picture> picked
    const portrait = document.querySelector<HTMLImageElement>(
      'img[src*="curator-portrait"]',
    );
    if (portrait) {
      portrait.decode().then(
        () => signal("portrait"),
        () => signal("portrait"),
      );
    } else {
      signal("portrait");
    }

    // ── the counter ───────────────────────────────────────────────────
    const place = (value: number) => {
      // value 0–100, continuous. Units step like a frame counter (a rolling
      // units column at ~80 digits/s is just a blur); tens slide across each
      // 9 → 0 carry, and hundreds slide only across 99 → 100.
      const [hundreds, tens, units] = stacks;
      const u = Math.floor(value) % 10;
      const t =
        Math.floor(value / 10) +
        smooth(Math.min(Math.max((value % 10) - 9, 0), 1));
      const h = Math.min(Math.max(value - 99, 0), 1);
      const set = (el: HTMLElement | undefined, pos: number) => {
        if (el) el.style.transform = `translate3d(0, ${-pos * (100 / 11)}%, 0)`;
      };
      set(hundreds, h);
      set(tens, t);
      set(units, u);
    };

    const t0 = performance.now();
    let last = t0;
    let shown = 0; // 0–1, eased toward the goal
    let lastInt = -1;
    let exiting = false;
    let tl: gsap.core.Timeline | undefined;

    const onTick = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const elapsed = now - t0;

      // never ahead of the real signals, never behind the brand-beat ramp
      const ramp = 1 - (1 - Math.min(elapsed / minMs, 1)) ** 2;
      const goal = elapsed >= capMs ? 1 : Math.min(target, ramp);
      shown += (goal - shown) * (1 - Math.exp(-dt * 9));
      if (goal === 1 && shown > 0.995) shown = 1;

      const value = shown * 100;
      place(value);
      const whole = Math.floor(value);
      if (whole !== lastInt) {
        lastInt = whole;
        ring?.style.setProperty("--p", String(whole));
      }

      if (shown === 1 && !exiting) {
        exiting = true;
        gsap.ticker.remove(onTick);
        // a beat on "100" so the number is read before it leaves
        gsap.delayedCall(0.14, exit);
      }
    };

    // ── exit: counter drops, chest flies home, ink lifts ──────────────
    const exit = () => {
      const home = document
        .querySelector<HTMLElement>(".dk-mark .reel-mark")
        ?.getBoundingClientRect();
      const from = markEl?.getBoundingClientRect();

      tl = gsap.timeline({ onComplete: finish });
      tl.to(skipBtn, { opacity: 0, duration: 0.2, ease: "power1.out" }, 0)
        .to(caption, { opacity: 0, duration: 0.25, ease: "power1.out" }, 0)
        .to(count, { y: 48, opacity: 0, duration: 0.4, ease: "power3.in" }, 0);

      if (markEl && from && home && home.width > 0 && from.width > 0) {
        const flightAt = 0.12;
        tl.to(
          markEl,
          {
            x: home.left + home.width / 2 - (from.left + from.width / 2),
            y: home.top + home.height / 2 - (from.top + from.height / 2),
            scale: home.width / from.width,
            duration: 0.95,
            ease: "expo.inOut",
          },
          flightAt,
        )
          .to(
            bg,
            { opacity: 0, duration: 0.5, ease: "power1.inOut" },
            flightAt + 0.35,
          )
          // the Prelude starts while the chest is still in the air
          .call(signalDone, undefined, flightAt + 0.5);
      } else {
        // no Reel Mark to land on — settle the chest and lift the ink
        tl.to(
          markEl,
          { scale: 0.92, opacity: 0, duration: 0.45, ease: "power2.in" },
          0.1,
        )
          .to(bg, { opacity: 0, duration: 0.4, ease: "power1.inOut" }, 0.25)
          .call(signalDone, undefined, 0.35);
      }
    };

    gsap.ticker.add(onTick);

    // Guarded so click, the skip button, and Escape can't finish twice.
    const skip = () => {
      if (!html.classList.contains("intro-pending")) return;
      gsap.ticker.remove(onTick);
      gsap.killTweensOf(exit);
      tl?.kill();
      finish();
    };
    // Clicking anywhere on the overlay skips — the skip button's click
    // bubbles up to this same handler.
    root.addEventListener("click", skip, { once: true });

    // Keyboard escape hatch. Escape works anywhere; the page behind is
    // inert, so the skip button is the only tab stop (Enter/Space work
    // natively). It isn't auto-focused: a programmatic focus ring on first
    // paint reads as a glitch for pointer users.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // The listener lives for the session; never swallow Escape once the
      // intro is gone.
      if (!html.classList.contains("intro-pending")) return;
      event.preventDefault();
      skip();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      gsap.ticker.remove(onTick);
      gsap.killTweensOf(exit);
      tl?.kill();
      root.removeEventListener("click", skip);
      window.removeEventListener("keydown", onKeyDown);
      page?.removeAttribute("inert");
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-intro-overlay
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-100"
    >
      <span className="sr-only">Loading Drishyakosh</span>

      <div data-loader-bg aria-hidden className="absolute inset-0 bg-ink" />

      <div className="loader-stage" aria-hidden>
        <div
          data-loader-mark
          className="loader-mark"
          style={{ "--mark-aspect": MARK_ASPECT } as CSSProperties}
        >
          <span className="loader-layer loader-ring-track" />
          <span data-loader-ring className="loader-layer loader-ring-fill" />
          <span className="loader-layer loader-chest" />
          <svg
            className="loader-rays"
            viewBox={MARK_VIEWBOX}
            fillRule="evenodd"
            focusable="false"
          >
            {MARK_RAYS.map((d, i) => (
              <path key={i} d={d} style={{ "--i": i } as CSSProperties} />
            ))}
          </svg>
        </div>
        <p data-loader-caption lang="hi" className="loader-caption">
          दृश्यकोश
        </p>
      </div>

      <div data-loader-count aria-hidden className="loader-count">
        {[0, 1, 2].map((col) => (
          <span key={col} className="loader-col">
            <span data-loader-stack className="loader-stack">
              {DIGIT_STACK.map((digit, i) => (
                <span key={i}>{digit}</span>
              ))}
            </span>
          </span>
        ))}
      </div>

      <button type="button" data-skip className="loader-skip">
        <span className="loader-skip-touch">Tap to skip</span>
        <span className="loader-skip-pointer">Click or Esc to skip</span>
      </button>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import "./categoryCarousel.css";
import type { Category, Video } from "@/types";
import { useLenisInstance } from "@/lib/smooth-scroll";
import { TicketFrame } from "./TicketFrame";
import { WatchModal } from "./WatchModal";

/**
 * ReelCarousel — the categories carousel (ADR-0006), ported from the
 * Dokmeh-style reference in `Inspo/aistudio-carousel/`. The engine:
 *
 * A sticky 100svh stage inside a tall virtual track (`100 + (n-1)·52` svh).
 * Scroll progress over the track maps to a fractional position `e` between
 * Reels (0 … n-1). The raw position is then followed by a critically-damped
 * visual position (gsap ticker, dt-normalised) so the deck has weight and
 * settles instead of snapping frame-to-frame off the scroll event.
 *
 * Geometry is C1-continuous in `d` (no cusps): lateral + lift saturate
 * exponentially with depth, so incoming cards decelerate into the front slot
 * and far cards gather at the edges instead of marching off at constant
 * speed. Rotation is monotonic (0° at the front, growing outward) — a card
 * never twists in and back out on its way to centre. Focus scale is a raised
 * cosine, so the front card holds its size through a small plateau rather
 * than peaking at a single pixel.
 *
 * The deck is painted imperatively every frame; React state only changes when
 * the whole-Reel index crosses (counter / live region / aria). All per-frame
 * work is composite-only: transform, opacity, and visibility. The stage light
 * and the depth shade are pre-painted layers whose opacity we drive, so no
 * box-shadow/filter is recomputed per frame.
 *
 * Rest: when the stage is pinned and scroll input goes idle, the page eases
 * to the nearest Reel so a card always lands dead-centre (proximity settle,
 * desktop + touch). Reduced motion: no damping, no settle — direct mapping.
 *
 * Controls: scroll everywhere; round prev/next arrows on touch (coarse
 * pointers) only. Clicking the front ticket opens the Watch lightbox
 * (Projector Hold); clicking a background ticket brings it to the front.
 * Keyboard ← → (↑ ↓) step one Reel when the stage covers the viewport.
 */

/** Virtual track height for n Reels, in svh. */
const trackHeight = (n: number) => `${Math.max(100, 100 + (n - 1) * 52)}svh`;

/** Fake slots ahead of the first card so left-side neighbours exist. */
const LEAD_SLOTS = 6;

/* ── deck geometry ──────────────────────────────────────────────────────
   x = W · LAT_A · (1 − e^(−d / LAT_B))     lateral, saturating
   y = −H · LIFT_A · (1 − e^(−d / LIFT_B))  fan lift, saturating
   θ = −dir · ROT_MAX · (1 − e^(−d / ROT_B)) monotonic bank
   s = 1 + FOCUS · raised-cosine(d)          front-card size
   z = −DEPTH · min(d, 4)                    parallax depth           */
const LAT_A = 1.35;
const LAT_B = 2.2;
const LIFT_A = 0.15;
const LIFT_B = 1.6;
const ROT_MAX = 52;
const ROT_B = 2.1;
const DEPTH = 90;
const FOCUS = { desktop: 0.55, mobile: 0.32 };

/** visual-position follow time constant (s) — lower = tighter */
const FOLLOW_TAU = { desktop: 0.07, mobile: 0.095 };

/** settled → page eases to the nearest Reel after this much scroll idle (ms) */
const SETTLE_IDLE = 240;
const SETTLE_DURATION = 0.72;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** True while the sticky stage covers the viewport (sub-pixel tolerant). */
const isStagePinned = (rect: DOMRect) =>
  rect.top <= 2 && rect.bottom >= window.innerHeight - 2;

/** Document Y that puts Reel `index` at the front of the stage. */
const reelScrollY = (sectionTop: number, index: number, scrollable: number, total: number) =>
  sectionTop + (index / Math.max(1, total - 1)) * scrollable;

export function ReelCarousel({
  videos,
  category = null,
}: {
  /** the Reels of the active Category (pass the whole archive pre-chooser) */
  videos: Video[];
  /** active Category for the heading; null → "THE ARCHIVE" (P2 state) */
  category?: Category | null;
}) {
  const total = videos.length;
  const lenis = useLenisInstance();

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const glowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const noteRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fillRef = useRef<HTMLDivElement>(null);

  const dimsRef = useRef({
    w: 0,
    h: 0,
    mobile: false,
    focus: FOCUS.desktop,
    tau: FOLLOW_TAU.desktop,
  });
  const visualRef = useRef(0); // damped position actually painted
  const targetRef = useRef(0); // position implied by scroll
  const activeRef = useRef(0); // last index pushed to React state
  const progressRef = useRef(-1);
  const reducedRef = useRef(false);
  const playingRef = useRef(false);
  const registeredRef = useRef(false);

  // Re-key the slots on the Reel list so stale transforms don't linger
  const reelKey = useMemo(() => videos.map((v) => v.id).join("|"), [videos]);
  const slotCount = total + 12;

  const [activeIndex, setActiveIndex] = useState(0);
  // the announcement is scoped to its list: a Category swap makes the old
  // index derive as 0 instead of announcing "Reel 6 of 3"
  const [announcement, setAnnouncement] = useState({ key: reelKey, index: 0 });
  const [watching, setWatching] = useState<Video | null>(null);
  const announcedRef = useRef({ key: reelKey, index: 0 });

  /** Paint the whole deck at fractional position `e`. Composite-only. */
  const paint = useCallback(
    (e: number) => {
      const stage = stageRef.current;
      if (!stage) return;

      const dims = dimsRef.current;
      const W = dims.w || stage.clientWidth;
      const H = dims.h || stage.clientHeight;
      const focusAmt = dims.focus;
      const reduced = reducedRef.current;

      const rounded = Math.round(e);
      if (rounded !== activeRef.current) {
        activeRef.current = rounded;
        setActiveIndex(rounded);
      }

      const progress = total > 1 ? e / (total - 1) : 0;
      if (fillRef.current && Math.abs(progress - progressRef.current) > 0.0015) {
        progressRef.current = progress;
        fillRef.current.style.transform = `scaleX(${clamp01(progress).toFixed(4)})`;
      }

      slotRefs.current.forEach((slot, s) => {
        if (!slot) return;
        const p = s - LEAD_SLOTS - e;
        const d = Math.abs(p);
        const dir = p === 0 ? 0 : Math.sign(p);

        const x = dir * W * LAT_A * (1 - Math.exp(-d / LAT_B));
        const y = -dir * H * LIFT_A * (1 - Math.exp(-d / LIFT_B));
        const rot = reduced
          ? 0
          : -dir * ROT_MAX * (1 - Math.exp(-d / ROT_B));
        // raised cosine: 1 at the gate, 0 one slot out — zero slope at both
        // ends, so the front card never "pops" into focus
        const focusWeight = d >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * d);
        const scale = 1 + focusAmt * focusWeight;
        const z = -DEPTH * Math.min(d, 4);

        slot.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(
          2,
        )}px, ${y.toFixed(2)}px, ${z.toFixed(1)}px) rotateY(${rot.toFixed(
          3,
        )}deg) scale(${scale.toFixed(4)})`;
        slot.style.zIndex = String(400 - Math.round(d * 20));
        const farFade = clamp01(1 - smoothstep(2.1, 3.2, d));
        // the compact mobile ticket is already ink-dark, so the shade layer
        // can't recede it — non-front rows dim through opacity instead
        const nearDim = dims.mobile ? 1 - 0.62 * smoothstep(0.12, 1, d) : 1;
        slot.style.opacity = (farFade * nearDim).toFixed(3);
        slot.style.visibility = d > 3.2 ? "hidden" : "visible";

        const glow = glowRefs.current[s];
        if (glow) glow.style.opacity = Math.pow(Math.max(0, 1 - d / 0.9), 2).toFixed(3);

        const shade = shadeRefs.current[s];
        if (shade) shade.style.opacity = (0.62 * smoothstep(0.05, 1.8, d)).toFixed(3);
      });

      // Text belongs to ONE Reel at a time: only the nearest index is
      // visible, fading out over the last 0.16 of travel. Two titles never
      // overlap mid-scroll (the old crossfade ghosted them on top of each
      // other), and the swap happens while both are at zero.
      videos.forEach((_, t) => {
        const delta = t - e;
        const dist = Math.abs(delta);
        const isCurrent = t === rounded;
        const factor = isCurrent ? 1 - smoothstep(0.34, 0.5, dist) : 0;
        const titleEl = titleRefs.current[t];
        const noteEl = noteRefs.current[t];
        const lift = reduced ? 0 : -26 * Math.max(-0.5, Math.min(0.5, delta));

        if (titleEl) {
          titleEl.style.opacity = factor.toFixed(3);
          titleEl.style.filter = reduced ? "none" : `blur(${((1 - factor) * 6).toFixed(2)}px)`;
          titleEl.style.transform = `translateY(${lift.toFixed(2)}px)`;
          titleEl.style.pointerEvents = factor > 0.5 ? "auto" : "none";
        }

        if (noteEl) {
          noteEl.style.opacity = factor.toFixed(3);
          noteEl.style.filter = reduced ? "none" : `blur(${((1 - factor) * 4).toFixed(2)}px)`;
          noteEl.style.transform = `translateY(${(lift * 0.6).toFixed(2)}px)`;
          noteEl.style.pointerEvents = factor > 0.5 ? "auto" : "none";
        }
      });
    },
    [total, videos],
  );

  /** Follow `target` with an exponential (frame-rate independent) filter. */
  const tick = useCallback(
    (_time: number, deltaTime: number) => {
      // stays registered for the life of the effect; idles with one check
      if (!playingRef.current) return;

      const dt = Math.min(Math.max(deltaTime, 0.5), 50) / 1000;
      const target = targetRef.current;
      let v = visualRef.current;
      const tau = dimsRef.current.tau;
      v += (target - v) * (1 - Math.exp(-dt / tau));

      if (Math.abs(target - v) < 0.0004) v = target;
      visualRef.current = v;
      paint(v);

      if (v === target) playingRef.current = false;
    },
    [paint],
  );

  const kick = useCallback(() => {
    if (reducedRef.current) {
      visualRef.current = targetRef.current;
      paint(targetRef.current);
      return;
    }
    playingRef.current = true;
    if (!registeredRef.current) {
      gsap.ticker.add(tick);
      registeredRef.current = true;
    }
  }, [paint, tick]);

  /** Read scroll → target position; paint directly under reduced motion. */
  const compute = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;

    const scrollable = section.scrollHeight - window.innerHeight;
    if (scrollable <= 0) {
      targetRef.current = 0;
    } else {
      const raw = -section.getBoundingClientRect().top / scrollable;
      targetRef.current = clamp01(raw) * (total - 1);
    }
    kick();
  }, [kick, total]);

  /**
   * Rest settle — when the stage is pinned and scrolling has gone quiet, ease
   * the page to the nearest Reel so the front card always lands centred.
   */
  const settleTimer = useRef(0);
  const settle = useCallback(() => {
    if (reducedRef.current || total < 2) return;
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    if (!isStagePinned(rect)) return;

    const e = targetRef.current;
    const nearest = Math.round(e);
    if (Math.abs(e - nearest) < 0.02) return;

    const scrollable = section.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const top = window.scrollY + rect.top;
    const y = reelScrollY(top, nearest, scrollable, total);

    if (lenis) {
      lenis.scrollTo(y, {
        duration: SETTLE_DURATION,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
      });
    } else {
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, [lenis, total]);

  const onScroll = useCallback(() => {
    compute();
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      // announce once the deck has come to rest, not on every intermediate
      // index while a scrub is still in flight
      const rect = sectionRef.current?.getBoundingClientRect();
      const next = { key: reelKey, index: activeRef.current };
      const prev = announcedRef.current;
      if (rect && isStagePinned(rect) && (prev.key !== next.key || prev.index !== next.index)) {
        announcedRef.current = next;
        setAnnouncement(next);
      }
      settle();
    }, SETTLE_IDLE);
  }, [compute, settle, reelKey]);

  /** Measure the stage + the ticket box so CSS can anchor to the front card. */
  const measure = useCallback(() => {
    const stage = stageRef.current;
    const section = sectionRef.current;
    if (!stage || !section) return;

    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const mobile = w < 768;
    const slot = slotRefs.current[LEAD_SLOTS];
    const cardW = slot?.offsetWidth || 0;
    const cardH = slot?.offsetHeight || 0;
    const focus = mobile ? FOCUS.mobile : FOCUS.desktop;
    const scaleMax = 1 + focus;

    section.style.setProperty("--deck-front-half-w", `${(cardW * scaleMax) / 2}px`);
    section.style.setProperty("--deck-front-half-h", `${(cardH * scaleMax) / 2}px`);

    dimsRef.current = {
      w,
      h,
      mobile,
      focus,
      tau: mobile ? FOLLOW_TAU.mobile : FOLLOW_TAU.desktop,
    };
    paint(visualRef.current);
  }, [paint]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(total - 1, index));
      const section = sectionRef.current;
      if (!section) return;

      const scrollable = section.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        targetRef.current = clamped;
        kick();
        return;
      }

      const rect = section.getBoundingClientRect();
      const top = window.scrollY + rect.top;
      const target = reelScrollY(top, clamped, scrollable, total);
      if (lenis) {
        lenis.scrollTo(target, { duration: 1.15 });
      } else if (reducedRef.current) {
        window.scrollTo({ top: target });
      } else {
        window.scrollTo({ top: target, behavior: "smooth" });
      }
    },
    [lenis, total, kick],
  );

  // reduced-motion preference + initial measurement
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = mq.matches;
    const onChange = () => {
      reducedRef.current = mq.matches;
      if (mq.matches) {
        visualRef.current = targetRef.current;
        paint(targetRef.current);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [paint]);

  // main scroll + resize driver
  useEffect(() => {
    const stage = stageRef.current;
    const slot = slotRefs.current[LEAD_SLOTS];

    measure();
    compute();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const ro = new ResizeObserver(() => {
      measure();
      compute();
    });
    if (stage) ro.observe(stage);
    if (slot) ro.observe(slot);

    // web fonts land after first paint and change the mobile ticket's height
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (cancelled) return;
      measure();
      compute();
    });

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.clearTimeout(settleTimer.current);
      ro.disconnect();
      gsap.ticker.remove(tick);
      registeredRef.current = false;
      playingRef.current = false;
    };
  }, [measure, compute, onScroll, tick]);

  // category swap — re-lock at the first Reel (paint(0) re-syncs the index)
  useEffect(() => {
    targetRef.current = 0;
    visualRef.current = 0;
    progressRef.current = -1;
    // the live region belongs to the Reel list: without this, swapping from a
    // 9-Reel to a 3-Reel Category would announce "Reel 6 of 3"
    announcedRef.current = { key: reelKey, index: 0 };
    measure();
    compute();
  }, [reelKey, total, measure, compute]);

  // keyboard stepping (stage must cover the viewport to take the keys)
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      // the Watch lightbox owns the keyboard while it is open
      if (document.querySelector("dialog[open]")) return;
      // a focused Curator's Note is its own scroll region — let ↑/↓ move the
      // note instead of stepping the deck
      if ((ev.target as Element | null)?.closest?.(".deg-note")) return;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      // sub-pixel tolerance: the stage's document top is rarely integral, so
      // a strict `top <= 0` disarms the keys for the whole section
      if (!isStagePinned(rect)) return;

      if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
        ev.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
        ev.preventDefault();
        scrollToIndex(activeIndex - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, scrollToIndex]);

  /**
   * Slot click — the deck's "karte star" interaction: a front press watches,
   * a background press brings that ticket to the front. The WATCH stub stops
   * propagation in deck tickets, so it can't double-fire through this.
   */
  const onSlotClick = (slotIndex: number, projectIndex: number, video: Video) => {
    if (slotIndex === LEAD_SLOTS + activeIndex) {
      setWatching(video);
    } else {
      scrollToIndex(projectIndex);
    }
  };

  const heading = category ? `${category.number} — ${category.title.toUpperCase()}` : "THE ARCHIVE";
  const chip = category
    ? `CATEGORY ${category.number}`
    : `ALL CATEGORIES · ${total} REELS`;
  // clamp: a Category swap can leave the announced index past the new list
  const announcedIndex =
    announcement.key === reelKey
      ? Math.min(announcement.index, Math.max(0, total - 1))
      : 0;
  const announcedTitle = videos[announcedIndex]?.title;

  return (
    <section
      ref={sectionRef}
      id="section-carousel"
      className="deg-section"
      style={{ height: trackHeight(total) }}
      aria-label={heading}
    >
      <div ref={stageRef} className="deg-stage">
        {/* Heading — top-left, sits where the chooser will join it (P3) */}
        <div className="deg-heading-box">
          <h2 className="deg-heading">{heading}</h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-meta text-[0.6rem] tracking-[0.45em] text-smoke uppercase">
              {chip}
            </span>
            <span aria-hidden className="block w-14 border-t border-hairline" />
          </div>
        </div>

        {/* The deck — slots carry the engine transforms; wrapper owns the box */}
        <div className="deg-cards">
          {Array.from({ length: slotCount }, (_, t) => {
            // JS % keeps the sign of the dividend — normalise it so small
            // Categories (total < LEAD_SLOTS) don't drop their first slots
            const projectIndex =
              (((t + total - LEAD_SLOTS) % total) + total) % total;
            const video = videos[projectIndex];
            if (!video) return null;

            return (
              <div
                key={`${reelKey}-${t}`}
                ref={(el) => {
                  slotRefs.current[t] = el;
                }}
                className="deg-slot cursor-pointer"
                onClick={() => onSlotClick(t, projectIndex, video)}
                title={video.title}
                aria-hidden={t === LEAD_SLOTS + activeIndex ? undefined : true}
              >
                <div
                  ref={(el) => {
                    glowRefs.current[t] = el;
                  }}
                  aria-hidden
                  className="deg-slot-glow"
                />
                <TicketFrame
                  video={video}
                  variant="deck"
                  onWatch={setWatching}
                  tabbable={t === LEAD_SLOTS + activeIndex}
                />
                <div
                  ref={(el) => {
                    shadeRefs.current[t] = el;
                  }}
                  aria-hidden
                  className="deg-slot-shade"
                />
              </div>
            );
          })}
        </div>

        {/* Kinetic title — beneath the front card, 0→5px blur travel */}
        <div className="deg-titles" aria-hidden="true">
          {videos.map((video, t) => (
            <span
              key={video.id}
              ref={(el) => {
                titleRefs.current[t] = el;
              }}
              className="deg-title"
            >
              {video.title}
            </span>
          ))}
        </div>

        {/* Kinetic note — bottom right: the Curator's Note + logistics rows */}
        <div className="deg-notes" dir="ltr">
          {videos.map((video, t) => (
            <div
              key={video.id}
              ref={(el) => {
                noteRefs.current[t] = el;
              }}
              className="deg-note"
              data-lenis-prevent
              role="region"
              aria-label={`Curator's note — ${video.title}`}
              tabIndex={t === activeIndex ? 0 : -1}
              aria-hidden={t === activeIndex ? undefined : true}
            >
              <span className="font-meta text-[0.6rem] tracking-[0.45em] text-smoke block">
                {video.creator.toUpperCase()} · {video.year} · {video.genre.toUpperCase()}
              </span>
              <blockquote className="mt-3 border-l border-amber/60 pl-4">
                <span aria-hidden className="font-display text-2xl leading-none text-amber/80">
                  &ldquo;
                </span>
                <p className="deg-note-quote">{video.curatorNote}</p>
              </blockquote>
              <dl className="deg-note-list">
                <div>
                  <dt>RUNTIME</dt>
                  <dd className="tabular-nums">{video.duration}</dd>
                </div>
                <div>
                  <dt>CATALOG</dt>
                  <dd className="tabular-nums">{video.catalogNumber}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        {/* Live region — announces the Reel after the deck has settled */}
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcedTitle ? `Reel ${announcedIndex + 1} of ${total}: ${announcedTitle}` : ""}
        </p>

        {/* Controls — prev/next live on coarse pointers; counter always */}
        <nav className="deg-controls" aria-label="Move through the Reels" dir="ltr">
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Previous Reel"
          >
            ←
          </button>
          <span className="deg-counter font-meta tabular-nums">
            {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === total - 1}
            aria-label="Next Reel"
          >
            →
          </button>
        </nav>

        {/* Scroll hint + progress — the deck's gauge, bottom right (desktop) */}
        <div className="deg-hint">
          <span aria-hidden className="deg-hint-dot" />
          <span>SCROLL TO MOVE THE REEL · ← → KEYS</span>
          <div className="deg-track">
            <div ref={fillRef} className="deg-fill" style={{ transform: "scaleX(0)" }} />
          </div>
        </div>
      </div>

      <WatchModal video={watching} onClose={() => setWatching(null)} />
    </section>
  );
}

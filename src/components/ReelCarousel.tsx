"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./categoryCarousel.css";
import type { Category, Video } from "@/types";
import { useLenisInstance } from "@/lib/smooth-scroll";
import { TicketFrame } from "./TicketFrame";
import { WatchModal } from "./WatchModal";

/**
 * ReelCarousel — the categories carousel (ADR-0006), ported from the
 * Dokmeh-style reference in `Inspo/aistudio-carousel/`. The exact engine:
 *
 * A sticky 100svh stage inside a tall virtual track (`100 + (n-1)·60` svh).
 * Scroll progress over the track maps to a fractional position `e` between
 * Reels (0 … n-1). Slots are computed per card `s` relative to the anchor
 * (slot 6 = front): lateral spacing 0.315·stageW (0.69 mobile) + 0.1·stageW
 * beyond depth 1, parabolic Y ±0.215·stageH (+0.034 beyond depth 1), Y-curves
 * of 48° peaked at depth 1, translateZ -10px per depth (≤5), scale -0.09 per
 * depth (≤1) with a +25% focus boost that lands by 65% of the travel and a
 * stage light on the front card (plans/0007).
 * Titles blur to 8px, notes to 6px across one Reel of travel.
 * rAF-throttled window-scroll compute (same driver scheme as the strip).
 *
 * Controls: scroll everywhere; round prev/next arrows on touch (coarse
 * pointers) only — per the cutover decision. Clicking the front ticket opens
 * the Watch lightbox (Projector Hold); clicking a background ticket first
 * brings it to the front. Keyboard ← → (↑ ↓) step one Reel when the stage
 * covers the viewport.
 */

/** Virtual track height for n Reels, in svh. */
const trackHeight = (n: number) => `${Math.max(100, 100 + (n - 1) * 60)}svh`;

/** Fake slots ahead of the first card so left-side neighbours exist. */
const LEAD_SLOTS = 6;

/** Curator's call — the focused (front) card reads one grade larger and lit.
 *  plans/0007 (B — spotlight): a continuous boost peaked at depth 0 (+25%)
 *  that lands by 65% of the travel (an arrival, not a gradient), so the deck
 *  never pops and the inspo geometry stays registered at the CSS token box
 *  (--deck-card-w in categoryCarousel.css). The stage light (amber rim + a
 *  touch brighter paper) rides the same factor; it is a lighting state, so it
 *  holds under reduced motion too. */
const FOCUS_SCALE = 0.25;
const FOCUS_FALLOFF = 0.65;
/** ambient lateral spacing, desktop (plans/0007 D: air audit at depth 1 gives
 *  a 39px neighbour reveal at 1440) — mobile keeps its own factor */
const DECK_LATERAL = 0.54;

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
  const titleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const noteRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [watching, setWatching] = useState<Video | null>(null);

  // Re-key the slots on the Reel list so stale transforms don't linger
  const reelKey = useMemo(() => videos.map((v) => v.id).join("|"), [videos]);
  const slotCount = total + 12;

  const updateTransforms = useCallback(
    (e: number, reduced = false) => {
      const stage = stageRef.current;
      if (!stage) return;

      const stageW = stage.clientWidth;
      const stageH = stage.clientHeight;
      const isMobile = stageW < 768;

      const rounded = Math.round(e);
      setActiveIndex(rounded);
      setProgress(total > 1 ? e / (total - 1) : 0);

      slotRefs.current.forEach((slot, s) => {
        if (!slot) return;
        const l = s - LEAD_SLOTS - (reduced ? rounded : e);
        const d = Math.abs(l);
        const o = Math.min(d, 1);
        const u = Math.max(0, d - 1);
        const x = Math.sign(l) * (o * stageW * (isMobile ? 0.69 : DECK_LATERAL) + u * stageW * 0.1);
        const y = -Math.sign(l) * (o * stageH * 0.215 + u * stageH * 0.034);
        const rotY = reduced ? 0 : -(Math.sin(Math.min(d, 1) * Math.PI) * Math.sign(l) * 48);
        const lit = Math.max(0, 1 - d / FOCUS_FALLOFF);
        const focus = 1 + FOCUS_SCALE * lit;

        slot.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${-(10 * Math.min(d, 5))}px) rotateY(${rotY}deg) scale(${(1 - 0.09 * Math.min(d, 1)) * focus})`;
        // stage light — warm rim blooming with focus (a shadow, not motion)
        slot.style.boxShadow = `0 30px 80px -24px rgba(201, 162, 106, ${(0.35 * lit).toFixed(3)})`;
        slot.style.filter = lit > 0 ? `brightness(${(1 + 0.06 * lit).toFixed(3)})` : "none";
        slot.style.zIndex = String(30 - Math.round(2 * d));
        slot.style.visibility = d > 6 ? "hidden" : "visible";
        slot.style.opacity = d > 5 ? String(Math.max(0, 1 - (d - 5))) : "1";
      });

      videos.forEach((_, t) => {
        const diff = t - e;
        const factor = reduced ? Number(t === rounded) : Math.max(0, 1 - Math.abs(diff));
        const titleEl = titleRefs.current[t];
        const noteEl = noteRefs.current[t];

        if (titleEl) {
          titleEl.style.opacity = String(factor);
          titleEl.style.filter = `blur(${reduced ? 0 : (1 - factor) * 8}px)`;
          titleEl.style.transform = `translateY(${reduced ? 0 : 12 * diff}px)`;
          titleEl.style.pointerEvents = factor > 0.5 ? "auto" : "none";
        }

        if (noteEl) {
          noteEl.style.opacity = String(factor);
          noteEl.style.filter = `blur(${reduced ? 0 : (1 - factor) * 6}px)`;
          noteEl.style.transform = `translateY(${reduced ? 0 : 16 * diff}px)`;
          noteEl.style.pointerEvents = factor > 0.5 ? "auto" : "none";
        }
      });
    },
    [videos, total],
  );

  const scrollToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(total - 1, index));
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const sectionTop = window.scrollY + rect.top;
      const sectionHeight = section.scrollHeight;
      const stageH = window.innerHeight;
      const scrollable = sectionHeight - stageH;

      if (scrollable <= 0) {
        updateTransforms(clamped, true);
        return;
      }

      const target = sectionTop + (clamped / (total - 1)) * scrollable;
      if (lenis) {
        lenis.scrollTo(target, { duration: 1.4 });
      } else {
        window.scrollTo({ top: target, behavior: "smooth" });
      }
    },
    [total, lenis, updateTransforms],
  );

  // main scroll + resize driver (rAF-throttled window-scroll compute)
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;

    const compute = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollable = section.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        updateTransforms(0, reduced);
        return;
      }

      const raw = -rect.top / scrollable;
      const clamped = Math.max(0, Math.min(1, raw));
      updateTransforms(clamped * (total - 1), reduced);
    };

    const throttled = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(compute);
    };

    window.addEventListener("scroll", throttled, { passive: true });
    window.addEventListener("resize", throttled);
    compute();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", throttled);
      window.removeEventListener("resize", throttled);
    };
  }, [total, updateTransforms]);

  // keyboard stepping (stage must cover the viewport to take the keys)
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      if (!(rect.top <= 0 && rect.bottom >= window.innerHeight)) return;

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

  // re-lock transforms at rest whenever the Reel list changes (P3: category swap)
  useEffect(() => {
    updateTransforms(0);
  }, [reelKey, total, updateTransforms]);

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
            const projectIndex = (t + total - LEAD_SLOTS) % total;
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
              >
                <TicketFrame
                  video={video}
                  variant="deck"
                  onWatch={setWatching}
                />
              </div>
            );
          })}
        </div>

        {/* Kinetic title — beneath the front card, 0→8px blur travel */}
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
              aria-hidden={t !== activeIndex}
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

        {/* Live region — the projector announces the frame at the gate */}
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          Reel {videos[activeIndex]?.title}. Curator&apos;s note: {videos[activeIndex]?.curatorNote}
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
            <div className="deg-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      </div>

      <WatchModal video={watching} onClose={() => setWatching(null)} />
    </section>
  );
}

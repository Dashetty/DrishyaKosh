"use client";

import { useCallback, useEffect, useRef } from "react";

/* ---------------------------------------------------------------------------
   Drum engine — the siena.film physics, ported from
   Inspo/pixel-transition-replicator/src/App.tsx (ADR-0002). Constants verbatim:
   lerp 0.05 · snap 0.1 · decay ×0.85 · wheel 0.0011 · drag 0.0018 ·
   blur = smoothed speed × 14, clamped 8px. The loop is bounded per Reel
   (ADR-0003): wrap never crosses Reels; the Rail swaps loop contents and
   resets all physics state.
--------------------------------------------------------------------------- */

function modulo(s: number, e: number): number {
  return ((s % e) + e) % e;
}

function wrapOffset(s: number, halfLength: number): number {
  let t = modulo(s, 2 * halfLength);
  if (t >= halfLength) {
    t -= 2 * halfLength;
  }
  return t;
}

export interface DrumCardRef {
  el: HTMLElement | null;
}

interface UseDrumOptions {
  /** items in the active loop, in order; index 0 = first card */
  count: number;
  /** called (rAF-cheaply) when the centered card changes */
  onActiveChange?: (index: number) => void;
  /** blur enabled at all (false on touch — ADR-0002 D5) */
  blurEnabled: boolean;
  /** drum accepts input at all (pinned + not in projector hold) */
  active: boolean;
}

/**
 * Owns the virtual position. Cards register via registerCard(index) and the
 * engine writes translate3d directly — no React state in the tick loop.
 * Parallax layer elements register the same way with a rate multiplier.
 */
export function useDrum({
  count,
  onActiveChange,
  blurEnabled,
  active,
}: UseDrumOptions) {
  // virtual position in card units (negative index = forward; siena convention)
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const speedRef = useRef(0);
  const lspeedRef = useRef(0);

  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartTargetRef = useRef(0);
  const isWheelingRef = useRef(false);
  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // card element registry: index → { el, layers: [{el, rate}] }
  const cardsRef = useRef(new Map<number, { el: HTMLElement; layers: { el: HTMLElement; rate: number }[] }>());
  const framesLayerRef = useRef<HTMLElement | null>(null);
  const activeIndexRef = useRef(0);
  const topExitAccumRef = useRef(0);

  const registerCard = useCallback((index: number, el: HTMLElement | null) => {
    if (!el) {
      cardsRef.current.delete(index);
      return;
    }
    const existing = cardsRef.current.get(index);
    cardsRef.current.set(index, { el, layers: existing?.layers ?? [] });
  }, []);

  // layer elements register via ref callbacks (not render-time access)
  const registerLayer = useCallback(
    (index: number, el: HTMLElement | null, rate: number) => {
      if (!el) return;
      const card = cardsRef.current.get(index);
      if (card) {
        if (!card.layers.some((l) => l.rate === rate)) {
          card.layers.push({ el, rate });
        }
      }
    },
    []
  );

  const registerFramesLayer = useCallback((el: HTMLElement | null) => {
    framesLayerRef.current = el;
  }, []);

  /** hard reset for Rail switches (ADR-0003 D9): nothing carries over */
  const resetTo = useCallback((index = 0) => {
    const safe = Number.isFinite(index) ? index : 0;
    targetRef.current = -safe;
    currentRef.current = -safe;
    speedRef.current = 0;
    lspeedRef.current = 0;
    topExitAccumRef.current = 0;
    activeIndexRef.current = safe;
    onActiveChange?.(safe);
  }, [onActiveChange]);

  // main physics loop — refs + direct DOM writes only
  useEffect(() => {
    if (count === 0) return;
    let rafId = 0;

    const tick = () => {
      // idle snap to nearest card
      if (!isDraggingRef.current && !isWheelingRef.current) {
        const rounded = Math.round(targetRef.current);
        targetRef.current = targetRef.current + (rounded - targetRef.current) * 0.1;
      }

      // current lerps toward target
      currentRef.current =
        currentRef.current + (targetRef.current - currentRef.current) * 0.05;

      // speed decay + smoothed speed for blur
      speedRef.current *= 0.85;
      lspeedRef.current =
        lspeedRef.current + (Math.abs(speedRef.current) - lspeedRef.current) * 0.1;

      const half = count / 2;
      const vh = window.innerHeight;
      const cardSpacing = vh * 0.88;

      for (const [index, card] of cardsRef.current) {
        const offset = wrapOffset(currentRef.current + index, half);
        // siena positions: cardY = offset × 0.88 × viewport height
        card.el.style.transform = `translate3d(0px, ${offset * cardSpacing}px, 0px)`;
        // parallax layers: rate as % of card offset
        for (const layer of card.layers) {
          layer.el.style.transform = `translate3d(0px, ${offset * layer.rate}%, 0px)`;
        }
      }

      // velocity blur on the frames layer only (ADR-0002 D5)
      if (framesLayerRef.current) {
        const blur = blurEnabled ? Math.min(lspeedRef.current * 14, 8) : 0;
        framesLayerRef.current.style.filter =
          blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
      }

      // active card tracking
      const activeIdx = modulo(Math.round(-currentRef.current), count);
      if (activeIdx !== activeIndexRef.current) {
        activeIndexRef.current = activeIdx;
        onActiveChange?.(activeIdx);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [count, blurEnabled, onActiveChange]);

  // wheel input
  useEffect(() => {
    if (!active) return;
    const handleWheel = (e: WheelEvent) => {
      isWheelingRef.current = true;
      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
      wheelTimeoutRef.current = setTimeout(() => {
        isWheelingRef.current = false;
      }, 150);

      const delta = e.deltaY;
      speedRef.current += delta * 0.0006;

      // unpin-at-top: only when sitting on the loop's first card (index 0)
      if (
        modulo(Math.round(-targetRef.current), count) === 0 &&
        currentRef.current > -0.5 &&
        delta < 0
      ) {
        topExitAccumRef.current += -delta;
        if (topExitAccumRef.current > 120) {
          topExitAccumRef.current = 0;
          // the stage owns pin state; it listens for this event
          window.dispatchEvent(new CustomEvent("dk:drum:unpin-at-top"));
          return;
        }
      } else {
        topExitAccumRef.current = 0;
      }

      // discrete mouse wheels (~100-150px/notch) need more authority than
      // siena's 0.0011 (tuned for continuous trackpad streams): a notch
      // moves ~35% of a card so 3 notches advance one card, and the snap
      // never eats the input
      const step = Math.abs(delta) <= 200 ? 0.0032 : 0.0011;
      targetRef.current -= delta * step;
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
    };
  }, [active, count]);

  // drag input (mouse + touch share the path)
  useEffect(() => {
    if (!active) return;

    const onDown = (clientY: number) => {
      isDraggingRef.current = true;
      dragStartYRef.current = clientY;
      dragStartTargetRef.current = targetRef.current;
      topExitAccumRef.current = 0;
    };
    const onMove = (clientY: number) => {
      if (!isDraggingRef.current) return;
      const deltaY = clientY - dragStartYRef.current;
      speedRef.current += deltaY * 0.0002;
      targetRef.current = dragStartTargetRef.current + deltaY * 0.0018;
    };
    const onUp = () => {
      isDraggingRef.current = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as Element).closest("button, a, dialog")) return;
      onDown(e.clientY);
    };
    const handleMouseMove = (e: MouseEvent) => onMove(e.clientY);
    const handleMouseUp = () => onUp();

    const handleTouchStart = (e: TouchEvent) => onDown(e.touches[0].clientY);
    const handleTouchMove = (e: TouchEvent) => onMove(e.touches[0].clientY);
    const handleTouchEnd = () => onUp();

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [active]);

  // keyboard
  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown" || e.code === "Space") {
        e.preventDefault();
        targetRef.current -= 1;
        speedRef.current -= 0.3;
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        targetRef.current += 1;
        speedRef.current += 0.3;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active]);

  return {
    registerCard,
    registerLayer,
    registerFramesLayer,
    resetTo,
    goToIndex: (index: number) => {
      const currentNorm = -Math.round(targetRef.current);
      let diff = modulo(index, count) - modulo(currentNorm, count);
      if (Math.abs(diff) > count / 2) {
        diff = diff > 0 ? diff - count : diff + count;
      }
      targetRef.current -= diff;
    },
  };
}

export { modulo, wrapOffset };

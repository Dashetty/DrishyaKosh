# ADR-0001: Film-roll settling — Lenis settle-snap, CSS snap on touch, never ScrollTrigger snap

**Status**: Accepted · **Date**: 2026-09-13

## Context

The spec demands both Lenis smooth scrolling and "scroll-snap so frames settle
one at a time like frames through a projector gate". Three mechanisms were in
play:

1. **CSS `scroll-snap-type`** — driven by the browser's native scroller. While
   Lenis is animating `window.scrollTo` on its own rAF loop, CSS snap fights
   it (the browser re-snaps mid-Lenis-tween), producing stutter — exactly the
   jank the film feel forbids. On touch devices, however, Lenis stands down
   (native scrolling) and CSS snap works with the browser, not against it.
2. **ScrollTrigger's `snap` config** — tweens `window.scrollTo` directly while
   Lenis is simultaneously writing scroll position each frame; the two fight
   for the same value.
3. **Lenis's own `scrollTo`** — the only actor Lenis never fights, because it
   *is* the scroll owner.

## Decision

- **Fine pointers (Lenis active)**: custom settle-snap. A debounced listener
  on Lenis's `scroll` event waits ~150ms for the scroll to come to rest, finds
  the Frame center nearest the viewport middle, and if within 45% of a
  viewport height eases to it via `lenis.scrollTo`.
- **Coarse pointers**: native CSS `scroll-snap-type: y proximity` on `<html>`
  with `scroll-snap-align: center` on frames — browser-native, zero JS, works
  because Lenis does not own touch scrolling.
- **`prefers-reduced-motion`**: neither — plain scroll, no snapping, no skew.

## Consequences

- Snap behaviour lives in two places (JS for desktop, CSS for touch) and must
  be kept conceptually in sync; both key off the same `[data-snap-point]`
  wrappers.
- ScrollTrigger remains for velocity skew and per-frame/intertitle reveals —
  just never for snapping.
- If Lenis is ever removed, desktop snapping falls back to the CSS path by
  deleting the settle-snap effect.

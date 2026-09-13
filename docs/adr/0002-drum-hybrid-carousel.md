# ADR-0002: The Drum — infinite virtual carousel behind a pin seam (hybrid)

**Status**: Accepted · **Date**: 2026-09-13 · **Supersedes**: nothing (ADR-0001 still governs the un-mounted scroll paths)

## Context

DrishyaKosh's archive is real document scrolling (Lenis + ScrollTrigger,
ADR-0001). The siena.film replicator (`Inspo/pixel-transition-replicator`)
implements the opposite model: a fixed stage where a *virtual position*
drives cards via `translate3d`, with circular modulo wrap for infinity,
per-tick lerped inertia, snap-to-nearest on release, layered parallax
(120%/150%/25%), and velocity-based motion blur (`min(lspeed × 14, 8)px`).

The user chose **hybrid**: real scroll for hero and footer, a pinned drum
for the archive proper.

## Decision

1. **Loop contents**: Reel intertitles are drum items — the 17-item loop is
   [Reel 01 intertitle, 3 frames, Reel 02 intertitle, 3 frames, Reel 03
   intertitle, 4 frames, Reel 04 intertitle, 2 frames]. Wraps infinitely in
   both directions.
2. **Seam**: scrolling into the archive pins the drum stage (fixed,
   full-viewport, document body height reserved so no scroll jump). On the
   loop's first item, scrolling up unpins back to native scroll (hero).
   Lenis runs for the scroll parts, paused while pinned.
3. **Exit**: an explicit "END OF REEL ↓" control in the drum stage unpins
   and eases to the footer (FLIP IT OVER scrolls back). The loop itself
   never ends.
4. **Inputs**: wheel (`target -= deltaY × 0.0011`), drag (whole stage,
   `target = start + deltaY × 0.0018`), ArrowUp/ArrowDown, Space. Constants
   from the replicator.
5. **Physics per rAF** (replicator values): idle snap-to-nearest factor
   `0.1`; current→target lerp `0.05`; speed decay `×0.85`; smoothed speed
   for blur at `0.1`; blur `min(|v|·14, 8)px` on the frames layer only —
   grain, sprockets, HUD stay crisp.
6. **Parallax** (siena rates, mapped to our frame): poster anchored; catalog
   corner (DK-nnn · REEL nn) 120%; CAPS title + credits 150%; curator quote
   25%; WATCH and other interactive controls anchored (no parallax —
   hit-areas must not drift).
7. **Culling**: cards beyond ±1.7 offsets from centre are unmounted.
8. **Mobile**: same drum; vertical swipe = drag; blur off on touch; quote
   layer parallax simplified (it already lives below the frame on small
   screens).
9. **Reduced motion**: the drum does not mount at all — the archive falls
   back to ADR-0001's real-scroll layout (identical DOM data source).
10. **HUD**: fixed top-centre catalogue readout (DK-nnn — TITLE · n/17 +
    progress ticks) while pinned.

## Consequences

- Two motion models coexist with a guarded boundary; the handoff (pin/unpin)
  is the risk seam and must be feel-checked at both edges.
- The Frame component renders in two modes (scroll-mode and drum-card
  mode); its parallax layers must be cleanly separated so scroll mode keeps
  its current static composition.
- ADR-0001's settle-snap and skew pause while the drum is mounted — the two
  must never both respond to the same wheel event.
- The footer is only reachable via the END control (or unpin-at-top from the
  hero); its "END OF REEL. FLIP IT OVER →" copy gains a companion meaning.

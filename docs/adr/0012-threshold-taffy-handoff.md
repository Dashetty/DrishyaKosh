# ADR-0012: Threshold Pull — the Taffy Word Is Drawn Through the Seam

**Status**: Accepted · **Date**: 2026-11-11 · **Amends**: ADR-0007 §3 (Prelude motion — "the hero's scrub is untouched"; Threshold fade window and drift), ADR-0004 §1 (hero choreography staging)

## Context

ADR-0007 split the wordmark's introduction across the Prelude/hero boundary:
the Prelude's last beat (**Threshold**, "WELCOME TO") completes into the red
hero's DRISHYA / KOSH below the fold. In practice the two never met:

- The Threshold faded out between 10% and 65% of the Prelude's exit — gone
  mid-screen, long before the red field arrived. The sentence completed
  only conceptually, never in the same frame.
- The hero's scrub began at `top top`, so its load state (the full-track
  taffy poster) was applied while the section was still below the fold.
  Since the Prelude shipped, the hero is never the resting view: the poster
  state at load is dead staging, and the word arrived already stretched,
  with no arrival beat of its own.

The Curator asked for a unique movement between the landing section and the
hero wordmark **without scroll-hijacking** — no added pin, no scroll length,
native scrolling untouched.

## Decision

1. **The threshold pull (Hero).** The hero scrub's ScrollTrigger starts one
   viewport early — `start: "top bottom"` — spanning the section's own
   entry travel. During that rise the DRISHYA taffy is animated from a flat
   **entry ribbon** (glyph = 12% of track, gutter above it, lying on the red
   floor) up to the full poster height, landing exactly as the section's
   top reaches the viewport top. The existing pinned choreography (line one
   parks at 40.5%, KOSH opens at 44.3%, tagline, scribble, wedge) is
   rebased into the remaining span — `rest = 1 − entrySpan`, where
   `entrySpan = vh / sectionHeight` (the scrub spans `top bottom` →
   `bottom bottom`, which is exactly the section's height; the entry's
   viewport of travel is that span's `vh` share) — with unchanged relative
   beat positions. No pin is added; the entry spends scroll the section
   already spends rising into view.
2. **The sentence composes across the seam (Prelude).** The Threshold takes
   **no drift** — it rides with the page at the same rate the hero rises,
   holding a roughly constant gap above the inflating DRISHYA cap for the
   whole entry. Its fade window moves from `10%→65%` to `40%→90%` of the
   Prelude's exit: fully legible through the composed mid-entry frame,
   fading only as the taffy locks into the poster state. KOSH still opens
   below in the pinned phase — reading order stays
   WELCOME TO → DRISHYA → KOSH.
3. **One move per handoff.** The angled seam wedges stay static; the pull is
   the only new motion. All animation remains scroll-scrubbed transforms of
   `height` (the established taffy mechanic — `preserveAspectRatio="none"`
   stretches the glyphs with the container), never scroll-hijack or
   scroll-length changes.

## Consequences

**Positive**
- The handoff now has its own beat: the word is *pulled* into the frame on
  entry, then *pressed* into the wall on scrub — two readings of one
  mechanic.
- "WELCOME TO / DRISHYA" is literally on screen together mid-entry; the
  ADR-0007 sentence finally completes in a single frame.
- The dead poster load state becomes the entry's landing state.

**Negative**
- The scrub timeline's phase split (`entrySpan`) is computed once at mount;
  an orientation resize drifts the poster landing by a couple percent of
  scroll — inside the scrub lag, accepted.
- The pre-JS paint still authors the poster height (`h-[100svh]`); the
  entry tween re-arms it to the ribbon immediately after hydration. Below
  the fold either way.

**Neutral**
- Reduced motion is untouched: static parked heights, no timeline, no
  smooth-scroll changes.
- SiteNav zones read live rects, so the earlier trigger start changes no
  dressing behaviour.
- `tests/hero-animation.spec.ts` now locks the ladder: rest ribbon →
  mid-entry pull → poster → pinned squeeze.

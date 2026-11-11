# ADR-0013: Halftone Wall, Tighter KOSH, and the Mark That Rides the Scrub

**Status**: Accepted · **Date**: 2026-11-11 · **Amends**: ADR-0004 §3 (texture treatment on the wall), ADR-0007 §5 (Reel Mark zone ladder), ADR-0012 (wall description), the hero's balanced-wall proportions (measured off the vigilante reference)

## Context

After ADR-0012, the wall reads flat in three ways: the signal field is bare
(the retired shader experiment confirmed a texture was wanted, but its
animated mesh fought the film-stock rules), KOSH parks at 44.3% of track
leaving a dead band between the words — ~80px on mobile, ~20px on desktop
(the 5.6rem gutter inside line one's height eats the slack) — and the reel
mark, the page's one piece of top chrome, fades out for the entire hero
scrub ("parked", from the days its ink dress would have sat on the ink
glyphs).

## Decision

1. **Halftone wall.** The hero carries a static `.hero-halftone` layer — a
   fine ink dot matrix (1.05px dots on a 10px pitch, opacity 0.08) at
   `-z-10` inside the section's isolate: above the red, below the wedge
   and the wordmark. Screen-printed poster tooth; replaces the dead
   `.hero-grain` pattern in `globals.css`. Static per ADR-0004's texture
   rules; reduced motion needs no account (no motion to strip).
2. **KOSH tightened toward DRISHYA.** Line two's glyph fraction becomes
   responsive: `0.452` on `md`+ (gap ~14px — the desktop track has only
   ~20px of slack once the gutter is paid), `0.50` below (mobile's
   structural ~80px gap closes to ~35px). The reduced-motion static
   heights follow (`h-[50svh] md:h-[45.2svh]`). The scrub choreography is
   untouched — KOSH still opens from `0svh`.
3. **The mark rides the scrub.** The `scrub` zone is removed from the
   parked-zone rules (the footer still parks). The mark dresses **bone**
   over the hero — the wall's own tagline grammar — and rolls slowly
   (18s/turn, linear). The spin is declared once with
   `animation-play-state: paused` and only the scrub zone sets it
   `running`, so entering/leaving the zone resumes the angle instead of
   snapping to zero; reduced motion disables it outright.

## Consequences

**Positive**
- The wall reads printed, not flat; the two word-lines compose a denser
  poster; the mark is present for the site's centrepiece beat instead of
  vanishing for it.
- All texture is CSS-only, static, and painted in the hero's own stacking
  context — first paint stays red, no JS, no layout cost.

**Negative**
- The bone mark grazes the glyph caps at the poster state (~6px overlap of
  the mark's row with DRISHYA's cap line) — legible, but intentional
  crowding.
- The tighter desktop gap leaves the tagline overlapping glyph strokes a
  little more (it already did by design).

**Neutral**
- Zone ladder otherwise unchanged: landing → prelude (bone) → scrub (bone,
  spinning) → archive (bone) → footer (parked).
- `tests/hero-animation.spec.ts` now also asserts the mark is visible and
  `data-zone="scrub"` at the poster state.

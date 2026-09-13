# ADR-0003: The Rail — explicit horizontal Reel navigation over the Drum

**Status**: Accepted · **Date**: 2026-09-13 · **Supersedes**: partially amends ADR-0002 (the Drum's vertical loop is now bounded per Reel; everything else in ADR-0002 stands)

## Context

ADR-0002 modeled the archive as one continuous 17-item infinite loop mixing
Intertitles and Frames across all Reels. That works at sample scale (a
handful of Reels, a dozen or so Frames) but breaks down as the archive
grows: a curated collection of 30-40+ videos in a single 1D loop means
reaching a distant category (e.g. jumping from Music to Short Films) could
take dozens of scroll gestures, which defeats the point of a curated,
browsable archive.

The fix: split navigation into two axes. Horizontal moves between Reels
(categories). Vertical is the existing Drum roll, now scoped to browsing
inside whichever Reel is active. This also resolves an unstated
contradiction in ADR-0002, where the loop was described as "infinite in
both directions" while also having a "first item" that unpins to the hero
— that only makes sense if the loop is bounded per Reel, not global.

## Decision

1. **Reel = Category.** Each Reel (Music, Short Films, Design, etc.) is a
   self-contained Drum loop: Intertitle + that Reel's own Frames. No Frame
   or Intertitle from another Reel lives in the same loop.

2. **Vertical axis (Drum, per ADR-0002) is now bounded to the active
   Reel.** It still wraps infinitely — first item to last item and back —
   but the wrap never crosses into another Reel. Nothing about the
   physics, parallax, culling, or motion blur changes; only the loop's
   *contents* are now scoped to one Reel at a time.

3. **Horizontal axis (new — "the Rail") switches between Reels,
   explicit-trigger only.** No auto-continue past the last item of a Reel.
   The user moves to a different category only by using the Rail (tap/swipe
   a Reel tab). This is deliberate: keeps category switches intentional
   rather than accidental.

4. **The Rail lives with the Drum HUD.** Same fixed top-center position as
   the existing HUD (catalog number, title, position in loop, progress
   ticks). The Rail adds a row of Reel names alongside it; the active Reel
   is visually distinct. One continuous readout, not a second floating UI
   element.

5. **Switching Reels via the Rail always lands on that Reel's Intertitle
   (first item).** No "resume last position per Reel" in v1 — simpler
   state, and it matches the film metaphor (a Reel restarts at its title
   card when you put it on).

6. **Hero unpin-on-scroll-up applies only to Reel 01.** Scrolling up on
   Reel 01's first item (the very first card in the whole archive) unpins
   back to native scroll / hero, same as ADR-0002. This does NOT apply to
   any other Reel — Reels 02+ have no vertical path out to the hero; they
   are only reachable and leavable via the Rail.

7. **Footer access is decoupled from Reel order.** ADR-0002 tied the
   footer ("END OF REEL ↓ / FLIP IT OVER") to finishing the sequence.
   Since Reels can now be visited in any order via the Rail, the archive
   has no reliable "last" Reel. Footer access becomes a permanent,
   always-available entry inside the Rail itself (e.g. a "FLIP IT OVER →"
   option alongside the Reel tabs), not something reached only by
   exhausting Frames in sequence.

8. **Reel-switch transition: horizontal wipe/slide of the stage.** Tapping
   a Rail tab slides the current Reel's cards out and the target Reel's
   Intertitle in (direction matches Rail order left-to-right). Ties back
   to the archive's film-reel metaphor — like swapping a canister. Under
   reduced motion this becomes an instant cut, consistent with ADR-0002's
   existing reduced-motion fallback (no Drum motion at all).

9. **Full state reset on Reel switch.** Virtual position, culling window,
   current→target lerp, and smoothed speed for blur all reset when the
   Rail changes Reels — nothing carries over from the previous Reel's Drum
   state. Prevents leftover velocity from Reel A bleeding into Reel B's
   opening Frames.

10. **Open item — flag before implementing.** ADR-0002's sample loop lists
    12 Frames across 4 Reels (3, 3, 4, 2) but calls it a "17-item loop"
    (actual count is 16), and CONTEXT.md separately states "Ten Frames in
    the sample archive." These numbers disagree. Confirm the real per-Reel
    Frame counts before wiring up index math, culling bounds, or the
    Rail's Reel list — this affects Decisions 1 and 2 directly.

## Consequences

- Three navigation seams now exist instead of one: hero ↔ Reel 01
  (vertical, ADR-0002's original), Reel ↔ Reel (horizontal, new), and any
  Reel ↔ footer (via the Rail's permanent exit, new). Each needs its own
  feel-check; none should be assumed to share transition logic with
  another.
- The HUD and Rail together carry all "where am I" information (Reel
  name, Frame position, progress) — they must stay visually and
  semantically in sync.
- ADR-0002's Consequences (Film-roll Scroll and Lenis standing down while
  the Drum is pinned) still hold per Reel, and additionally reset on every
  Rail switch.
- The Frame/Reel count discrepancy (Decision 10) blocks accurate index
  math and must be resolved first — treat it as a blocker, not a polish
  item.

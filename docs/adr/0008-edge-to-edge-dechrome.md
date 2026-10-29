# ADR-0008: Edge-to-Edge Dechrome — Sprockets Removed, Chooser Unwired

**Status**: Accepted · **Date**: 2026-10-29 · **Amends**: ADR-0004 (texture), ADR-0006 §3 (page composition), ADR-0001 (unwired linear strip precedent)

## Context

Two visual edits requested after the Prelude landed:

1. **The sprocket rails** — the photographed film strip framing both viewport
   edges on desktop — cut into the composition now that the edge-to-edge
   grids carry the film language themselves (wedge, grain, ticket chrome).
2. **The page-level Category chooser** ("PICK A CATEGORY" typographic cards
   between hero and stage) read as filler on the path the new story creates:
   DRISHYAKOSH → archive, with no room between them.

## Decision

1. **Sprockets: full removal.** `<Sprockets />` is unwired from `layout.tsx`;
   the `.sprocket-rail` CSS and the `--rail-w` token (and its 48px lg
   override) are deleted. Every inset that read
   `calc(… + var(--rail-w))` collapses to its base value (Prelude, chooser,
   carousel stage edges). The component file stays in the tree, unwired like
   `ReelStrip`/`Intertitle` — re-wirable but not load-bearing. The
   `film-strip@2x` assets stay in `public/`.
2. **CategoryChooser: unwired, not deleted.** Hero runs straight into the
   carousel stage; the carousel's own heading ("THE ARCHIVE" in the P2 state,
   "NN — CATEGORY" when filtered) is the only section label the archive
   needs. Filtering still lives: the **Footer's "PICK A CATEGORY" rows**
   remain wired and call the same `chooseCategory` (re-key + glide to the
   stage), so the P2/P3 states of ADR-0006 survive without the chooser.
   The chooser file stays in the tree, unwired.

## Consequences

**Positive**
- Desktop content gains 96px of width between the rails' insets; the page is
  one continuous edge-to-edge sheet.
- DRISHYAKOSH → THE ARCHIVE is now a single uninterrupted beat.

**Negative**
- The chooser's large "THE ARCHIVE · N REELS" typographic moment is gone; the
  archive's label is now the carousel's kinetic title only.
- Desktop loses its most literal film-prop texture; grain + the aperture
  cursor carry it.

**Neutral**
- `#section-chooser` and `--rail-w` no longer exist; nothing anchors on them
  (tests verified: 13/13 pass, all anchors dynamic).
- Prelude, hero scrub, mark-zone ladder, footer pick flow: unchanged.

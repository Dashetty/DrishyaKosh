# ADR-0006: Categories Cutover — Reel Means One Video, Linear Strip Replaced by the Category Chooser + Carousel

**Status**: Accepted · **Date**: 2026-10-24 · **Supersedes**: ADR-0005's "the archive is the
linear strip, full stop" (decision 4); **redefines** the domain words in CONTEXT.md
(terminology change noted at the top of that glossary).

## Context

The Curator approved porting the Dokmeh-style horizontal 3D carousel
(reference: `Inspo/aistudio-carousel/`, plan: `plans/0006-categories-carousel-cutover.md`). Two
requirements came with it:

1. **Words change.** A **Category** is a thematic group of videos ("01 — Design"); a **Reel** is
   *one specific video*. The old sense of "Reel" (a themed group) is retired. Older docs
   (ADR-0001…0005) still read with the old sense in mind; legacy component names
   (`ReelStrip`, the `reel-mark` CSS class, `SiteNav` "Reel Mark") keep their code names.
2. **The page changes.** The site becomes a single page: Hero → Category chooser → horizontal
   carousel of the chosen Category's Reels → footer. The vertical film-roll strip is unwired
   (sources kept in the repo, not deleted). The strip-only behaviours — Film-roll Scroll,
   Intertitle cards, the strip's settle-snap gate, "END OF REEL." — are retired with it.

## Decision

1. **Types & data (P1, done at this ADR's commit)**: `Reel`→`Category` interface, `ReelSlug`→
   `CategorySlug` (`category-01…04`), `Video.reel`→`Video.category`, `reels: [...]`→
   `categories: [...]` in `src/data/videos.ts`, `REEL_SPINE`→`CATEGORY_SPINE`.
   `TicketFrame`, `Intertitle`, `ReelStrip`, `Footer`, `page.tsx` re-pointed; TypeScript and
   ESLint green.
2. **Visible copy follows the new vocabulary at the surfaces the Curator touches**: the ticket
   spine reads `CATEGORY 01 · DESIGN`, the catalog corner `DK-001 · CATEGORY 01`, intertitle
   chips `CATEGORY 01`. Legacy flank copy that dies at the cutover anyway ("GET THE REEL —",
   "END OF REEL.", the layout description "one continuous reel") converts in P3 when the page
   is recomposed.
3. **Carousel control model**: movement is **scroll-driven only** — the carousel section maps
   scroll progress through its virtual stage (`100 + (n-1)·60` svh) to sideways travel of the
   ticket row. No keyboard-first, no scroll-hijack beyond the sticky stage. Round prev/next
   arrows appear as **secondary controls on touch devices only**. Clicking a front (focused)
   ticket opens the existing Watch lightbox (Projector Hold applies as today); a non-front
   click first brings that card to the front.
4. **The moving card is the Ticket** from day one (Curator decision (a) in the plan), rendering
   through `TicketFrame` inside the carousel slots; the deck transform lives on the slot
   wrapper, so the Ticket's inner parallax layers are unaffected.
5. **Award content does not carry over**: the reference's awards/recognitions rows map to the
   Curator's Note (one text, two renderings per CONTEXT.md). No awards data model is created.
6. **Reel Mark (decorative chrome)** is retained and re-zoned at P4 polish for the new page
   composition; it still never navigates.

## Consequences

- The Archive is no longer "one continuous film reel" end-to-end; it is browsed through the
  Carousel within a Category. CONTEXT.md's Archive/Intertitle/Film-roll Scroll/Ticket entries
  update at P3/P4 alongside the code they describe.
- `Vite`/AI Studio source stays in `Inspo/` as reference only; nothing there is imported by
  the app.
- Success criteria and the port's exact equations live in
  `plans/0006-categories-carousel-cutover.md` §1 and §6.

## Amendment — 2026-10-27 (catalog plate retired)

The artwork no longer carries the `DK-001 · CATEGORY 01` plate at its
top-left. The Curator retired it: the ticket spine already names the Category
in the same eyeline, and the number still travels with the Reel as ticket
metadata (the carousel's logistics rows, the compact mobile category bar and
the Watch lightbox). This narrows decision 2's visible-copy list; the spine
copy stands.

## Amendment — 2026-10-27 (hint line retired)

The deck's bottom hint is now the progress gauge alone. The Curator retired
the "SCROLL TO MOVE THE REEL · ← → KEYS" line and its pulsing dot (they read
as clutter); the keyboard step remains, and is still described to assistive
tech from the stage, while the round arrows remain the visible control on
coarse pointers. This reverses the plan's "Progress bar + hint line: keep"
call, not the control model.

## Amendment — 2026-10-25 (deck pacing + proximity settle)

The deck engine now maps the sticky stage to `100 + (n-1)·52` svh (was 60)
and, once scroll input has been idle for ~240 ms while the stage is pinned,
eases the page to the nearest Reel so a ticket always lands centred. Both
are tuning of decision 3, not a new control model: movement remains
scroll-driven, the round arrows remain touch-only, and a front click still
opens the Watch lightbox. The shorter track keeps the 1-Reel-to-1-panel
mapping with less empty scroll; the settle is the carousel-level successor
to the retired strip's settle-snap gate.

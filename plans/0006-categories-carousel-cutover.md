# Categories + Carousel Cutover — Port of the AI Studio "Dokmeh Awards" Carousel

**Status**: Approved plan (Terminal round with the Curator, 2026-10-24)
**Source**: `Inspo/aistudio-carousel/` (AI Studio export, Vite/React/Tailwind — reference only, not run)
**Result**: `/` becomes **Hero → Category chooser → horizontal Carousel of Tickets → footer**. The
linear film-roll strip is unwired (kept in repo). The user-facing word **Reel = one video**;
**Category = thematic group** (glossary updated in CONTEXT.md 2026-10-24; old sense survives in
pre-cutover docs/ADRs and legacy component names (`ReelStrip`, `Reel Mark`)).

---

## 1. What we keep from the source (the engine values — port verbatim, adapted only where the
layout structurally differs)

### Stage & scroll (`.awards-section` / `.awards-stage`)
- Section height = `100 + (n-1)·60` svh (`getAwardsScrollHeight`), `n` = number of Reels in the
  active Category.
- Stage = `100svh`, `position: sticky; top: 0; overflow: clip`.
- Driver: rAF-throttled `scroll` + `resize` listeners (same scheme as the strip's parallax driver —
  no ScrollTrigger). Progress = `clamp(-rect.top / (scrollHeight - innerHeight), 0, 1)`;
  float index `e = progress · (n-1)`. Lenis drives the underlying native scroll, so `rect.top`
  math is unchanged; the rAF loop stays authored by us, not by Lenis callbacks.

### Card transforms (per slot `s` of `n + 12` slots, anchor card index 6)
`l = s - 6 - e`, `d = |l|`, `o = min(d,1)`, `u = max(0, d-1)`, `sign = Math.sign(l)`
- lateral `c = sign·(o·stageW·(isMobile ? 0.69 : 0.315) + u·stageW·0.1)`
- vertical `g = -sign·(o·stageH·0.215 + u·stageH·0.034)`  ← the parabolic Y-offset
- rotateY `f = reduced ? 0 : -sin(min(d,1)·π)·sign·48` (deg)  ← the 48° curve
- translateZ `-(10·min(d,5))px`.
- scale `1 - 0.09·min(d,1)`; z-index `30 - round(2d)`; hidden past `d > 6`; opacity fade `d > 5`.
- Card box: `width: min(25.16vw, 35.8svh)`, centered at `top: 49%; left: 48.8%`,
  `translate(-50%, -50%)`. Mobile lateral factor 0.69.

### Kinetic text (0px → 8px blur law)
For item `t` vs `e`: `factor = max(0, 1 - |t - e|)`
- Title block: opacity `factor`, blur `(1-factor)·8px`, translateY `12·diff`.
- Detail block: opacity `factor`, blur `(1-factor)·6px`, translateY `16·diff`.
- `pointer-events: factor > 0.5`. In reduced motion: only the active item render, zero blur.

### Controls
- Counter `01 / n` (tabular-nums, mono), prev/next round buttons, disabled at the ends
  (source design; ours: shown on touch only per decision).
- Keyboard: ArrowLeft/Right/Up/Down → `navigateToProject(±1)` (preventDefault).
- `navigateToProject(i)`: smooth-scroll to `sectionTop + (i/(n-1))·(scrollHeight - innerHeight)`.
- Card click: navigate to that card (source). **Ours (decision)**: a front (active) ticket opens
  the existing Watch lightbox; a non-front click focuses it — then WATCH opens the lightbox.
- Progress bar + hint line: keep, restyled to theme.
- No category chips *inside* the stage — chooser moves out of the carousel (see §3).

### What is deliberately discarded from the source
Header/nav bar, "Dokmeh Honors / 45+ awards" chrome, award-provider rows & icons, the bottom
"Featured Awarded Works" catalog grid, footer links, Satoshi font, the white/light theme, and
`AwardsSection`'s in-stage category tabs+platform filters (superseded by the page-level chooser).
The **content slot** formerly occupied by "awards" is mapped to the **Curator's Note**
(the existing one-text-two-renderings rule; no new awards model).

---

## 2. Data & domain renames

- `src/types.ts`: `Reel` (group sense) → **`Category`**; `ReelSlug` → `CategorySlug`
  (slugs re-pointed to per-life semantics below). `Video` stays the type name for a **Reel**
  (code identifier for the curated video unit; copy/aria labels say "Reel").
- `videos.ts`: `reels: [` array → `categories: [` (same slugs re-authored as
  `category-01` "Design", `category-02` "Music", `category-03` "Cinema", `category-04`
  "Short Films"); `Video.reel` field → `Video.category`. `catalogNumber` stays `DK-001…,
  curator-assigned, per Reel, printed with its Category number.
- `pnpm verify:videos` and all YouTube ids untouched.

## 3. New page composition (`src/app/page.tsx`)

1. LoadingScreen + Intro Sequence (unchanged, kept).
2. Hero (kept; its squeeze-scrub beat stays `[data-hero-scrub]`).
3. **Category chooser section** (new `CategoryChooser.tsx`): theme wordmark row
   (displayed large, typographic card treatment; no "Intertitle strip" pattern), one selectable
   chip/label per Category with its Reel count. Selecting a category: updates the Carousel's
   data, resets its float index to 0, smooth-scrolls the page to the carousel section top
   (source `handleSelectCategory` behaviour, adapted to Lenis `scrollTo`). Chooser stays
   visible; returning to it re-picks freely (decision: no extra "all categories" chip).
4. **Carousel section** (new `ReelCarousel.tsx`, client component): sticky stage as per §1.
   Heading "ARCHIVE" (or Category label, per theme treatment chosen at build) replaces "Awards".
5. Footer + FLIP IT OVER (kept; "END OF REEL." copy retired with the strip).

Unwired (files remain): `ReelStrip.tsx`, `Intertitle.tsx`, `WatchModal` stays (reused),
`SiteNav`/`Sprockets`/`Grain`/`Cursor` (chrome) — keep `Sprockets` (desktop) and dark palette.
`Reel Mark` (fixed chrome) is re-zoned rather than deleted later in the polish pass — its
zone predicates currently read: archive = carousel section.

## 4. The moving card is a Ticket (decision (a) — from day one)

`TicketFrame` is the only renderer (per glossary). Cards inside the carousel render
`<TicketFrame video={…}>` inside the transform slot; the baked paper asset, catalog corner,
genre tag, overlapped title, credits row, and WATCH stub are all present; the layered
parallax driver is harmless at-rest in the deck (p≈0 for the focused card; other cards
are round-off-hidden — no double-transform conflict since the deck owns
`transform` on the *slot* wrapper, parallax lives on inner layers only).
Poster artwork: `thumbnailUrl(youtubeId)` + Duotone Grade + hover-lift-to-color as everywhere.

## 5. Styling retheme (dark archive, not Dokmeh light)

- Palette: near-black base, warm off-white text, matte gold accent (existing tokens in
  `globals.css`).
- Type: Maghfirea display / NeueBrucke body (not Satoshi).
- Title row clamp size `clamp(18px, 1.875vw, 36px)` is kept as a motion-geometry constant but
  set in NeueBrucke; card shadows/restraints adapted to the dark stage.
- Reduced-motion: single-frame static rendering (matches source's mode + `useReducedMotion`).

## 6. Build order (each step leaves `pnpm dev` and `pnpm build` green)

- **P1 — Domain**: types.ts + videos.ts renames; upstream references re-pointed (`Reel``
  group-sense consumers: ReelStrip comp files, reelTokens, glue). ADR-0006 written
  (cutover supersedes ADR-0005's "linear strip, full stop"; records word change
  Reel↔Category and the scroll-only control model). Code can run pre- and post-cutover
  via a momentary page composition during the P1→P3 gap.
- **P2 — Engine**: `ReelCarousel.tsx` + `categoryCarousel.css` ported per §1 with the existing
  12 videos mapped in as data (using existing `thumbnailUrl`, Duotone Grade), keyboard +
  counter + progress bar wired, TicketFrame slot integration, no chooser yet.
- **P3 — Page assembly**: `CategoryChooser.tsx` + page.tsx recomposition (strip unwired),
  footer/Ruler copy adjustments, "END OF REEL." retired; smooth-scroll provider covers
  chooser→carousel handoff.
- **P4 — Polish**: Reel Mark re-zoning; touch-only prev/next; reduced-motion pass; resize
  `isMobile` recompute; hover lift↔focus interplay; a11y live region copying the source's
  `aria-live` pattern with Reel title + curatorial lines.
- **P5 — QA**: lint + build + `verify:videos` untouched-pass; manual matrix at 1440/1024/768/390:

| Check | Expected |
| --- | --- |
| Scroll rate | (n-1) stops across `100+(n-1)·60` svh; counter matches stops |
| 3D values | 48° Y curves, parabolic rise/fall ±0.215·stageH, 0-8px blur ramps |
| Focus click | front ticket opens Watch lightbox; non-front first scroll-focus |
| Keyboard | ← → move exactly one stop under Lenis |
| Touch | arrows visible/usable only on touch; scroll capture never strands the page |
| Reduced motion | static focused-frame mode, no blur/rotation |
| Category pick | chooser swap resets to index 0 and glide-scrolls to section top |

## 7. Verification + handoff

- Playwright smoke test: stop alignment at category count, keyboard step count, focus click
  opens lightbox (extends existing tests/).
- `pnpm dev --turbo`? no — plain `pnpm dev`; review the app in the Review pane browser at
  1440×900 and 390×844; screenshots to `screenshots/` per prior workflow.

**Definition of done**: all six matrix rows pass, plan-composition matches §3, and the
Curator confirms the feel in the Review pane browser.

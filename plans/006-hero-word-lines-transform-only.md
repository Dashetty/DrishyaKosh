# 006 — Hero word-lines: convert scroll compression to transform-only motion

- **Status**: TODO
- **Commit**: `5377e5f` (working tree: plan written against the uncommitted
  post-"breathe + poster" hero — DRISHYA loads as a breathing tall poster
  (~2.4× natural, inline aspect `1000 / 336`), the scrub compresses it to
  78% of natural while KOSH opens. Since stamping, the root `<section>` also
  gained a `data-hero-scrub` attribute for SiteNav (+1 line drift, content
  of every excerpt below unchanged). If the code at the cited lines doesn't
  match that state, STOP and report)
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 1 file — `src/components/Hero.tsx`, ~60 lines

## Problem

The hero's pinned scrub animation drives both word-lines by animating
**`height`** on two containers holding full-width SVG text
(`preserveAspectRatio="none"`, ~1100px wide at REST, ~1300px on desktop).
Every frame of the ~100svh scrub triggers layout + paint + composite on
massive type — while `lenis` is smooth-scrolling the whole page. AUDIT.md
§5: *"Animate `transform` and `opacity` only. `width`/`height`… trigger
layout + paint + composite."*

Because the SVGs use `preserveAspectRatio="none"`, vertical `scaleY` on the
wrapper produces **pixel-identical glyph distortion** to an animated height —
so the entire mechanism converts losslessly to transforms (GPU-only:
composite, no layout). Only the initial state respects `height` semantics;
everything scrubbed becomes `transform`.

Current code, `src/components/Hero.tsx` (effect body, then JSX):

```tsx
// src/components/Hero.tsx:42-53 — current
// natural (condensed) height of a word-line: padded width × 140/1000
const naturalHeight = () => first.offsetWidth * (140 / 1000);
// scroll squeeze: line one compresses from its landing stretch (~2.4×
// natural, mirrored in the inline aspect ratio below) to ~78% of
// natural; line two opens to fill the rest of the track — both stay
const squeezeFactor = 0.78;
const loadStretch = 2.4;
const track = second.parentElement;
const openHeight = () =>
  track
    ? track.offsetHeight - naturalHeight() * squeezeFactor
    : naturalHeight();
const scribbleLength = scribble.getTotalLength();
```

```tsx
// src/components/Hero.tsx:61-74 — current (height-driven tweens)
tl.fromTo(
  first,
  { height: () => naturalHeight() * loadStretch },
  {
    height: () => naturalHeight() * squeezeFactor,
    duration: 0.4,
    ease: "none",
  },
  0
)
  .fromTo(
    second,
    { height: "0svh" },
    { height: openHeight, duration: 0.55, ease: "none" },
    0.15
  )
```

```tsx
// src/components/Hero.tsx:~140-150 — current (flex layout, line one)
<div
  aria-hidden
  className="flex h-full w-full flex-col justify-between overflow-hidden"
>
  <div
    ref={firstLineRef}
    className="w-full shrink-0 overflow-hidden"
    // keep in sync with loadStretch above: 140 × 2.4 = 336
    style={{ aspectRatio: "1000 / 336" }}
  >
```

```tsx
// src/components/Hero.tsx:~172-181 — current (line two)
<div
  ref={secondLineRef}
  className="w-full shrink-0 overflow-hidden"
  style={{
    aspectRatio: "1000 / 140",
    height: reduced ? undefined : "0svh",
  }}
>
```

The composition contract that MUST survive the conversion (feel-reference):

- Load: DRISHYA as a tall poster (≈2.4× its natural serif proportion,
  ≈36–39svh depending on viewport) at the top, idly breathing on its `<svg>`
  child; KOSH invisible; tagline hidden.
- Scrolled to pin end: DRISHYA compressed to `0.78 × natural` (natural =
  width × 140/1000; top edge fixed), KOSH stretched from the bottom to meet
  it exactly (no gap, no overlap — the KOSH `<text>` baseline `y="152"`
  seam fix is what makes it ink-flush; boxes meet at `0.78n`), both fully
  on screen, tagline overlaid.
- Timeline order and scrub positions unchanged: line one `0→0.4`, line two
  `0.15→0.75`, tagline `0.72`, scribble `0.78`, wedge `0.82`; `scrub: 0.6`,
  `invalidateOnRefresh: true`, trigger `start "top top"` /
  `end "bottom bottom"`.

## Target

Both word-line wrappers become **absolutely positioned at fixed aspect-driven
heights** and are driven exclusively by `transform: scaleY()`:

```tsx
// target — container
<div aria-hidden className="relative h-full w-full overflow-hidden">
  {/* line one: fixed landing-stretch box, top-anchored, squeezes via scaleY */}
  <div
    ref={firstLineRef}
    className="absolute inset-x-0 top-0 overflow-hidden"
    // keep in sync with loadStretch above: 140 × 2.4 = 336
    style={{ aspectRatio: "1000 / 336" }}
  >
    …svg unchanged… (line one)
  </div>
  {/* line two: fixed natural box, bottom-anchored, opens via scaleY */}
  <div
    ref={secondLineRef}
    className="absolute inset-x-0 bottom-0 overflow-hidden"
    style={{
      aspectRatio: "1000 / 140",
      transform: reduced ? undefined : "scaleY(0)",
      transformOrigin: "50% 100%",
    }}
  >
    …svg unchanged EXCEPT the KOSH baseline seam fix already in the tree:
    the <text> is y="152" (cap-top flush with viewBox top, y=30) with a
    short comment above it — preserve that, don't revert to y="165"…
  </div>
</div>
```

```tsx
// target — tweens (replace the two height tween blocks)
const naturalHeight = () => first.offsetWidth * (140 / 1000);
const squeezeFactor = 0.78;
const loadStretch = 2.4;
const track = second.parentElement;
// line two's final vertical stretch, as a scale factor (not a px height)
const openScale = () => {
  if (!track) return 0;
  return (track.offsetHeight - naturalHeight() * squeezeFactor) / naturalHeight();
};

tl.fromTo(
  first,
  { scaleY: 1, transformOrigin: "50% 0%" },
  { scaleY: squeezeFactor / loadStretch, duration: 0.4, ease: "none" },
  0
)
  .fromTo(
    second,
    { scaleY: 0, transformOrigin: "50% 100%" },
    { scaleY: openScale, duration: 0.55, ease: "none" },
    0.15
  )
```

Math:

- Line one's box is fixed at the landing stretch, `h_box = naturalHeight() ×
  loadStretch` (aspect ratio `1000 / 336`, shared with the pre-hydration
  inline style). Scaling it by `squeezeFactor / loadStretch = 0.78 / 2.4 =
  0.325` yields a visual height of exactly `0.78 × naturalHeight()` — the
  same final height the tween version animates to.
- Line two's box is fixed at natural (`1000 / 140`), bottom-anchored; scale
  `m = (track − 0.78·n) / n` where `n = naturalHeight()`. Its visual
  occupies `[track − m·n, track]`; line one's visual occupies
  `[0, 0.78·n]`. Since `m·n = track − 0.78·n`, the visuals meet **exactly**
  with no gap and no overlap — the same meeting condition the height
  version enforced through flex layout.
- Line two's box top edge sits at `track − n`, NOT at the visual meeting
  point `0.78·n` — fine: nothing occupies `[track − n, 0.78·n]` visually
  except line two once stretched; before the scrub runs (`scaleY: 0`) line
  two is a fully collapsed sliver on the bottom edge.
- Pre-hydration (`transform: scaleY(0)` inline, no JS yet) matches the
  previous `height: 0svh` initial state: only the DRISHYA poster visible.
- Reduced motion: no transforms are applied (`reduced ? undefined`); the
  composition is identical to the current reduced state (stretched DRISHYA
  at aspect defaults, natural KOSH at the bottom, tagline visible).

## Repo conventions to follow

- Motion lives in client components via GSAP timelines; scrubbed
  scroll-driven tweens use `ease: "none"`. Exemplar:
  `src/components/Hero.tsx` timeline construction (~lines 41-60) and
  `src/components/DrumStage.tsx` / `src/components/ReelStrip.tsx` for GSAP
  usage patterns.
- Reduced-motion branches via `useReducedMotion()` from
  `src/lib/useReducedMotion.ts` — already used by this component; keep it.
- No easing/duration tokens apply here: every tween is part of the scrubbed
  timeline and must stay `ease: "none"` (position-mapped). Do not introduce
  token bezier curves into the scrubbed timeline.
- The idle breathe pulse (`gsap.fromTo` on the **`<svg>` child** of line
  one: `scaleY 1 ↔ 1.03`, `transformOrigin: "50% 0%"`, killed on first
  scroll) sits on a different element than the scrub's wrapper-div `scaleY`
  — leave it exactly as is; no transform fight is possible.

## Steps

1. **`src/components/Hero.tsx` — container + line JSX (two edits).**
   Replace the flex container and both line wrapper classes/styles per the
   "Target" JSX: container `flex h-full w-full flex-col justify-between
   overflow-hidden` → `relative h-full w-full overflow-hidden`; line one
   gains `absolute inset-x-0 top-0` (drop `w-full shrink-0`); line two:
   `w-full shrink-0` → `absolute inset-x-0 bottom-0`, inline style drops
   `height: reduced ? undefined : "0svh"` and gains
   `transform: reduced ? undefined : "scaleY(0)"` plus
   `transformOrigin: "50% 100%"`.

2. **Same file — effect helpers.** Delete `openHeight`; add `openScale`
   (code in "Target"). Keep `naturalHeight`, `squeezeFactor`,
   `loadStretch`, `track`, `scribbleLength` as-is.

3. **Same file — the two tweens.** Replace the pair (~lines 61-74) with the
   `scaleY` fromTo pair from "Target" (same positions `0` / `0.15`, same
   durations `0.4` / `0.55`, still `ease: "none"`). Line one's end scale is
   the constant `squeezeFactor / loadStretch` (= 0.325). Do not change any
   later tween (tagline `0.72`, scribble `0.78`, wedge `0.82`).

4. **Same file — comment.** Update the helper comment above
   `squeezeFactor` to say "compresses via scaleY from the landing stretch
   to 78% of natural at the top while line two scales open from the bottom
   — both stay; fixed boxes, transform-only (no per-frame layout)".

That is all. Everything else in the component (refs, cleanup, breathe pulse,
`document.fonts.ready` refresh, wedge, tagline, scribble, sr-only h1 — and
both SVGs, including the KOSH baseline seam fix at `y="152"`) stays
byte-identical.

## Boundaries

- Do NOT touch: the tagline block, scribble SVG, wedge div, sr-only h1,
  breathe pulse wiring, cleanup function, `document.fonts.ready` listener,
  the timeline's ScrollTrigger config.
- Do NOT touch `src/app/globals.css`, `LoadingScreen`, `ReelStrip`,
  `SmoothScroll` or any other file.
- Do NOT change markup structure beyond the class/style edits in Step 1
  (same elements, same refs).
- Do NOT add new dependencies; GSAP is already registered in this file.
- Do NOT restage the idle breathe pulse or add stagger anywhere.
- If cited code doesn't match (the working tree has committed since
  `5377e5f`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` → zero errors; `npx eslint
  src/components/Hero.tsx` → zero errors; dev server `pnpm dev` renders
  without console errors.
- **Feel check** (dev server, desktop ≥1280px, scroll slowly through the red
  section, then again fast, then with trackpad momentum):
  - Load state unchanged: DRISHYA as a tall breathing poster; breathe dies
    on first scroll (never visibly "pops" off).
  - Scrub journey identical to before: DRISHYA compresses while KOSH opens;
    meeting line is clean — no gap, no overlap, no clipped glyphs at pin
    end; tagline/scribble/wedge hand-off unchanged.
  - Resize the viewport (width and height) mid-session, then scroll: the
    meeting point is still exact (function-based `openScale` +
    `invalidateOnRefresh` recomputed).
  - Touch viewport (emulation or real device): same behavior; sticky pin
    intact.
- **Performance (should feel different — that's the point)**:
  - DevTools → Performance → record a scroll pass through the hero →
    Layout count during scrolling ≈ 0 for the hero frames (the height
    version showed per-frame layout).
  - DevTools → Rendering → Paint flashing: while scrubbing, no full-viewport
    green flashes from the word-lines themselves (wedge/tagline composite
    flashes acceptable).
- **Reduced motion**: Rendering panel → emulate `prefers-reduced-motion:
  reduce` → static composition, tagline visible, scribble drawn, no pin,
  no breathe pulse.
- **Done when**: visuals are indistinguishable from the height-driven
  version across the full scrub, and a Performance recording of the scrub
  shows no per-frame layout triggered by the word-lines.

## Notes for the executor

This is a feel-preserving refactor: the ONLY observable difference is
smoothness under load (no layout work per frame). If any state of the scrub
differs visibly (meeting line, squeeze amount, timings), fix the numbers to
match the math above rather than eyeballing new values.

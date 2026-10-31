# 008 — Loading screen: the Kosh counts, then the chest flies home

Replaces the timed "projector beam + wordmark" intro (`LoadingScreen.tsx`).

## Concept

Server-rendered mark on ink (ring track + chest + rays + `000` + दृश्यकोश), so
the first paint is never blank. A frame counter `000 → 100` climbs from real
signals; the rope oval fills clockwise as the progress ring. At 100 the counter
drops, the chest FLIPs (transform-only) onto the Reel Mark's exact rect, the ink
fades, and `dk:intro:done` fires mid-flight so the Prelude starts underneath.

## Pieces

- `design-src/HighestQuality.png` — master art (2528×1696). Kept locally, **not committed** (5 MB); drop it there to re-run the script.
- `scripts/build-loader-mark.mjs` — crop → Otsu → autotrace → evenodd contour soup split into ring / rays / chest by geometry. Writes `public/loader/mark-{ring,chest}.svg` and `src/components/loader-mark-rays.ts` (generated; do not hand-edit). Needs `magick` + `autotrace`.
- Fonts: `public/fonts/brahmos-bold-digits.woff2` (0–9, Brahmos Latin Bold) and `brahmos-devanagari-medium-subset.woff2` (दृश्यकोश only), via `pyftsubset`. **Web licence must cover self-hosting + subsetting.**
- Colour is CSS: bone chest, 16 % bone ring track, amber rays (no signal red — that's the hero's).

## Timing (adaptive)

- Progress = fonts 30 % + loader art 15 % + curator portrait decode 25 % + window load 30 %.
- Brand beat ≥ 1.2 s, hard cap 2.8 s. `saveData` / 2g: 0.6 s / 1.6 s.
- Once per session; reduced-motion skips straight to done.

## Responsive / a11y

- Mark width `min(76vw, 50svh × aspect, 520px)`; counter font `min(21vw, 24svh)`; caption hidden under 480 px tall.
- `role="status"` + sr-only "Loading Drishyakosh"; page `inert` meanwhile; Esc / click / Skip all exit. Skip copy: "Tap to skip" vs "Click or Esc to skip" by input type.

## Not done / ideas

- Layered art (lid, spinning reel) — not available; rays + ring are the animated parts.
- `.reel-mark` still masks `mark-treasure.png`; could switch to `mark-chest+ring` SVG for crispness.
- No Playwright spec yet for the intro (screenshot-verified manually at 1440×900, 390×844, 844×390).

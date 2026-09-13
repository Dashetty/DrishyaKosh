# 003 — Introduce easing tokens and consolidate hand-typed curves

- **Status**: TODO
- **Commit**: 4740f20
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens (audit cat 7)
- **Estimated scope**: 1 file, ~8 lines (globals.css)

## Problem

The site has no easing tokens; near-identical curves are hand-typed in four
places. Any future motion (including plans 001/002, which reference
`var(--ease-out)`) will invent yet another variant instead of extending a
scale.

Current code (all in `src/app/globals.css` unless noted):

```css
/* :151 — duotone hover reveal */
.duotone img {
  filter: grayscale(1) sepia(0.32) contrast(1.05) brightness(0.8) saturate(0.92);
  transition: filter 0.55s ease, transform 0.8s cubic-bezier(0.2, 0.6, 0.2, 1);
}
```

```css
/* :68 — scroll cue keyframe timing */
@keyframes cue {
  0%   { transform: scale(0.6); opacity: 0.9; }
  70%  { transform: scale(1.5); opacity: 0; }
  100% { transform: scale(1.5); opacity: 0; }
}
.anim-cue { animation: cue 2.2s cubic-bezier(0.2, 0.6, 0.3, 1) infinite; }
```

```tsx
/* src/components/ReelStrip.tsx:84 — settle-snap easing */
lenis.scrollTo(window.scrollY + dist, {
  duration: 0.65,
  easing: (t: number) => 1 - Math.pow(1 - t, 3),
});
```

Also `hover` color transitions use bare Tailwind `duration-300` (default
ease) across Frame.tsx, Footer.tsx, WatchModal.tsx.

## Target

Two motion tokens in the existing `@theme` block, following AUDIT.md values
exactly:

```css
/* target — add inside the existing @theme block in globals.css */
@theme {
  /* …existing color/font tokens stay… */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* strong ease-out for UI */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* on-screen movement */
}
```

Then replace hand-typed occurrences so there is one curve per purpose:

1. `.duotone img` transform transition → `cubic-bezier(0.77, 0, 0.175, 1)`
   (= `var(--ease-in-out)`): the thumbnail scale is on-screen movement.

```css
.duotone img {
  filter: grayscale(1) sepia(0.32) contrast(1.05) brightness(0.8) saturate(0.92);
  transition: filter 0.55s ease, transform 0.8s var(--ease-in-out);
}
```

2. `.anim-cue` → `var(--ease-out)` (an entrance-style pulse).

```css
.anim-cue { animation: cue 2.2s var(--ease-out) infinite; }
```

3. ReelStrip settle-snap JS easing: replace the cubic with the same curve
   sampled numerically (JS can't read the CSS var without plumbing). Keep it
   simple and equivalent:

```ts
easing: (t: number) => 1 - Math.pow(1 - t, 4),
```

   (A quartic out matches `cubic-bezier(0.23, 1, 0.32, 1)`'s character closely
   enough for a 650ms settle; do not import a bezier library.)

4. Leave bare Tailwind `duration-300` color hovers as-is in this plan — they
   are color changes where `ease` is the correct choice (AUDIT.md cat 2), and
   changing them is churn, not consolidation.

## Repo conventions to follow

- Tokens live in the `@theme` block in `src/app/globals.css` beside
  `--color-ink` etc. — that is where Tailwind v4 reads design tokens.
- Reference in plain CSS as `var(--ease-out)` — Tailwind v4 `@theme` vars are
  emitted as plain CSS custom properties.

## Steps

1. Add the two `--ease-*` tokens to the `@theme` block.
2. Swap `.duotone img`'s transform curve to `var(--ease-in-out)` (keep the
   0.8s duration — the slow grade-lift is a settled design decision).
3. Swap `.anim-cue` to `var(--ease-out)`.
4. In `src/components/ReelStrip.tsx`, change the settle-snap `easing` to the
   quartic function above.
5. Update plans 001/002 if executed after this plan: they should use
   `var(--ease-out)` (already written to).

## Boundaries

- Do NOT touch durations; this plan is curves only.
- Do NOT re-theme the GSAP loader/intertitle/hero eases (`power2.out`,
   `power3.out`, `power4.inOut` are GSAP-native and fine).
- Do NOT add Tailwind arbitrary-value classes like `ease-[cubic-bezier(...)]`.

## Verification

- **Mechanical**: `pnpm lint` (0 errors), `pnpm build` clean.
- **Feel check**: `pnpm dev`:
  - hover a frame — the color flood still eases with the same slow-lift
    character, now slightly more decisive at the end (ease-in-out).
  - the hero SCROLL pulse still breathes smoothly.
  - wheel-scroll and release — the settle still lands dead-center (dist 0
    per the drift-bug fix) with the same calm deceleration.
- **Done when**: `grep -c "cubic-bezier" src/app/globals.css` shows only the
  two token definitions (plus the loader/gsap none), and nothing feels
  different enough to notice unprompted.

# 002 — Press feedback on all pressable elements

- **Status**: TODO
- **Commit**: 4740f20
- **Severity**: MEDIUM
- **Category**: Physicality & origin (audit cat 3)
- **Estimated scope**: 1 file, ~10 lines (globals.css only)

## Problem

None of the site's pressable elements give press feedback — the WATCH
ticket-stub, FLIP IT OVER, CLOSE, and the YouTube link all fire with no
physical response to the click itself. In a site whose whole conceit is
tactile film hardware, buttons that don't react to the finger break the
metaphor.

Current code (all verified at 4740f20):

```tsx
/* src/components/Frame.tsx:104 — WATCH button */
className="ticket-stub absolute bottom-6 right-5 z-10 border border-bone/30 bg-ink/60 px-5 py-2.5 font-meta text-[0.6rem] tracking-[0.35em] text-bone backdrop-blur-sm transition-colors duration-300 hover:border-amber hover:bg-amber hover:text-ink md:bottom-9 md:right-7"

/* src/components/Footer.tsx:17 — FLIP IT OVER */
className="ticket-stub border border-bone/30 px-7 py-3 font-meta text-[0.65rem] tracking-[0.4em] text-bone transition-colors duration-300 hover:border-amber hover:bg-amber hover:text-ink"

/* src/components/WatchModal.tsx:37 — CLOSE, :47 — OPEN ON YOUTUBE ↗ */
className="font-meta text-[0.6rem] tracking-[0.35em] text-bone-dim transition-colors hover:text-amber"
className="font-meta text-[0.6rem] tracking-[0.3em] text-amber underline-offset-4 hover:underline"
```

## Target

A single global press rule: 160ms ease-out scale-down to 0.97 while pressed.
The two ticket-stub buttons additionally stop scaling on pointer-release via
the same transition (retargeting, not keyframes, so spam-clicking never
restarts).

```css
/* target — add to globals.css near the :focus-visible block */

/* Press feedback — everything pressable dips slightly under the finger */
button:active,
a:active {
  transform: scale(0.97);
  transition: transform 160ms var(--ease-out);
}
```

Note the site's `:hover` color transitions already use `transition-colors
duration-300` on the same elements; adding `transition: transform …` in the
`:active` rule above applies only while active — acceptable, since the
release is covered by the color transition already declared on the element.
If any flicker of the color transition is observed during press, instead
extend the element classes from `transition-colors duration-300` to
`transition-[color,border-color,background-color,transform] duration-300`
— decide by looking, not by default.

## Repo conventions to follow

- Interactive-styles rules live together in globals.css (`:focus-visible`,
  `::selection`, aperture-cursor block). Add the press rule beside them.
- After plan 003 lands, `var(--ease-out)` exists; until then use
  `cubic-bezier(0.23, 1, 0.32, 1)`.

## Steps

1. Add the `button:active, a:active` block to globals.css after the
   `::selection` rule.
2. Feel-check each of the four surfaces (WATCH, FLIP IT OVER, CLOSE, YouTube
   link); adjust per the note above only if a color/transform transition
   conflict is visible.

## Boundaries

- Do NOT add per-component press classes; one global rule.
- Do NOT change hover styles, easing, or durations of existing transitions.
- Do NOT touch Cursor.tsx (the aperture ring already contracts on hover).

## Verification

- **Mechanical**: `pnpm lint` (0 errors), `pnpm build` clean.
- **Feel check**: run `pnpm dev`, click-and-hold each button:
  - WATCH dips to 97% while held, springs back on release.
  - FLIP IT OVER dips while held — the long scroll-to-top starts only on
    release.
  - Rapid-click WATCH 10× — no animation restarts, each press responds
    immediately (transition retargeting).
  - Keyboard: Tab to WATCH, press Enter/Space — no visual conflict; the
    lightbox open animation (plan 001) still plays.
- **Done when**: every pressable element visibly responds to the press
  itself, and nothing else changed.

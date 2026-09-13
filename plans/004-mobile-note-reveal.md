# 004 — Animate the mobile curator's-note reveal

- **Status**: TODO
- **Commit**: 4740f20
- **Severity**: LOW
- **Category**: Missed opportunity (audit cat 8)
- **Estimated scope**: 1 file, ~15 lines (globals.css)

## Problem

On mobile, the curator's note lives below the frame in a `<details>` that pops
open instantly — a jarring height jump for what is meant to be the site's
most intimate line of text. Every other reveal on the site eases; this one
teleports.

Current code (`src/components/Frame.tsx:108`):

```tsx
<details className="group/note mt-4 lg:hidden">
  <summary className="flex w-fit list-none items-center gap-3 font-meta text-[0.58rem] tracking-[0.35em] text-smoke transition-colors group-open/note:text-amber [&::-webkit-details-marker]:hidden">
    CURATOR&apos;S NOTE · {video.duration}
    <span aria-hidden className="transition-transform group-open/note:rotate-45">
      +
    </span>
  </summary>
  <p className="mt-3 max-w-md border-l border-amber/40 pl-4 font-quote text-sm italic leading-relaxed text-bone-dim">
    {video.curatorNote}
  </p>
</details>
```

## Target

Height transition on the details content using `::details-content` +
`@starting-style` (baseline 2024+ in Chromium/Firefox; Safari 18+; unsupported
browsers get the current instant open — acceptable graceful degradation for a
progressive enhancement). The `+` → `×` rotation already transitions and is
untouched.

```css
/* target — add to globals.css */

/* Mobile curator's note — unrolls like a film lead, not a pop */
details::details-content {
  block-size: 0;
  overflow: hidden;
  transition:
    block-size 250ms var(--ease-out),
    content-visibility 250ms allow-discrete;
}
details[open]::details-content {
  block-size: auto;
}
@starting-style {
  details[open]::details-content {
    block-size: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  details::details-content {
    transition: none;
  }
}
```

Also fade the paragraph in as it unrolls — add to the existing `<p>` class
list in Frame.tsx: `opacity-0 transition-opacity duration-300 group-open/note:opacity-100`
(uses the Tailwind group variant already present; keep 300ms > the 250ms
height so text never appears faster than space exists).

If `var(--ease-out)` is unavailable (plan 003 not yet executed), inline
`cubic-bezier(0.23, 1, 0.32, 1)`.

## Repo conventions to follow

- Structural CSS goes in globals.css; the component keeps its Tailwind
  utilities for layout. The one class-list edit in Frame.tsx follows the
  existing `group-open/note:` variant pattern already on the summary.
- Reduced-motion: extend the existing media block pattern (see plans 001).

## Steps

1. Add the `details::details-content` block to globals.css (anywhere near the
   dialog rules).
2. Edit the `<p>` class in Frame.tsx per above (one line).
3. Check the desktop `lg:hidden` means no desktop impact.

## Boundaries

- Do NOT replace `<details>` with JS state (it is the accessible, no-JS
  reveal).
- Do NOT animate the summary's color transition further.
- Do NOT add keyframes.

## Verification

- **Mechanical**: `pnpm lint`, `pnpm build` clean.
- **Feel check**: `pnpm dev`, viewport ≤ 768px (or DevTools responsive 390px):
  - tap CURATOR'S NOTE — the note unrolls over ~250ms; the + rotates to ×.
  - tap again — it rolls back up smoothly (interruptible: mid-open tap
    reverses from current height, no jump).
  - emulate `prefers-reduced-motion: reduce` — opens instantly.
  - at ≥1024px the details is hidden — confirm nothing regressed.
- **Done when**: the reveal eases on open and close on a phone-width
  viewport, with graceful instant fallback in old browsers.

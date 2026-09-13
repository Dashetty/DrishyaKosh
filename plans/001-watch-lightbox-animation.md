# 001 — Animate the Watch lightbox open/close

- **Status**: TODO
- **Commit**: 4740f20
- **Severity**: HIGH
- **Category**: Physicality & origin (audit cat 3) + interruptibility (cat 4)
- **Estimated scope**: 2 files, ~30 lines (globals.css, WatchModal.tsx)

## Problem

The WATCH lightbox — the primary action on the site — appears instantly with no
transition. It is the only state change in the whole archive that teleports,
inside an otherwise fully cinematic experience. Clicking WATCH cuts hard to the
modal; ESC/backdrop-close cuts hard back. The backdrop also snaps from nothing
to full darkness.

Current code (`src/components/WatchModal.tsx`, the dialog element):

```tsx
<dialog
  ref={dialogRef}
  onCancel={onClose}
  onClick={(e) => {
    if (e.target === dialogRef.current) onClose();
  }}
  aria-label={video ? `Watching ${video.title}` : undefined}
  className="w-[min(64rem,92vw)] rounded-2xl border border-hairline bg-ink-2 p-4 text-bone shadow-[0_40px_120px_rgba(0,0,0,0.9)] backdrop:bg-ink/85 backdrop:backdrop-blur-sm md:p-6"
>
```

And in `src/app/globals.css`:

```css
/* Watch lightbox backdrop */
dialog::backdrop {
  background: rgba(10, 9, 8, 0.85);
  backdrop-filter: blur(4px);
}
```

`dialog` uses display:none → open, so the browser gives no transition by
default; none was added.

## Target

Modal fades + scales from 0.96 with a strong ease-out on open; reverses on
close; the backdrop crossfades. All CSS-only via `@starting-style` +
`allow-discrete` — no JS timeline, and closing still works because
`display` transitions discretely.

```css
/* target — add to globals.css near the dialog::backdrop block */

/* Watch lightbox — cinematic fade/scale through the projector hold */
dialog {
  opacity: 0;
  transform: scale(0.96);
  transition:
    opacity 240ms var(--ease-out),
    transform 240ms var(--ease-out),
    overlay 240ms allow-discrete,
    display 240ms allow-discrete;
}
dialog[open] {
  opacity: 1;
  transform: scale(1);
}
dialog::backdrop {
  background: rgba(10, 9, 8, 0.85);
  backdrop-filter: blur(4px);
  opacity: 0;
  transition:
    opacity 240ms var(--ease-out),
    overlay 240ms allow-discrete,
    display 240ms allow-discrete;
}
dialog[open]::backdrop {
  opacity: 1;
}
@starting-style {
  dialog[open] {
    opacity: 0;
    transform: scale(0.96);
  }
  dialog[open]::backdrop {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  dialog,
  dialog::backdrop {
    transition-duration: 0.01ms;
  }
}
```

Modals are exempt from trigger-anchored origin rules — scale from center is
correct here. Do not move the `transition` onto the Tailwind class line; keep
motion CSS in globals.css where the other motion lives.

## Repo conventions to follow

- Motion CSS lives in `src/app/globals.css` (keyframes, transitions, duotone
  rules); components stay logic-only.
- Reduced-motion handling: a single `@media (prefers-reduced-motion: reduce)`
  block in globals.css, like the existing one that disables `.anim-*`.
- After plan 003 lands, `var(--ease-out)` exists; until then inline
  `cubic-bezier(0.23, 1, 0.32, 1)` so this plan can execute independently.

## Steps

1. In `src/app/globals.css`, extend the existing `dialog::backdrop` block to
   the target CSS above (dialog + backdrop transition rules, `[open]` states,
   `@starting-style` block, reduced-motion override).
2. No changes to `WatchModal.tsx` markup or logic — `showModal()`/`close()`
   already produce the display-change these transitions hook into.
3. Verify ESC still closes: `allow-discrete` keeps `display: none` applied
   until the transition ends.

## Boundaries

- Do NOT touch WatchModal.tsx (no JS animation, no gsap import).
- Do NOT change durations beyond the values above; do NOT add `will-change`.
- Do NOT add new dependencies.

## Verification

- **Mechanical**: `pnpm lint` (0 errors) and `pnpm build` (compiles, static
  pages generate).
- **Feel check**: run `pnpm dev`, open a frame's WATCH:
  - modal fades + grows from 96% — no hard cut; backdrop fades in with it.
  - press ESC — modal scales down + fades with the backdrop fading out; no
    blink.
  - open it ten times rapidly — each open starts from the closed state, never
    restarts mid-flight visible state (transitions, not keyframes).
  - DevTools Rendering panel → emulate `prefers-reduced-motion: reduce`:
    open/close is instant but still works.
- **Done when**: open and close are both visible 240ms fades with scale, ESC
  and backdrop-click still work, reduced-motion users get instant toggles.

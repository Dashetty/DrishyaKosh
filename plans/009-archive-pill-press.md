# 009 — ARCHIVE pill: faster, ease-out press (split feel from hover comfort)

- **Status**: DONE (executed at working tree; see note below)
- **Commit**: 4e3fdba
- **Severity**: MEDIUM
- **Category**: Easing & duration + Physicality & origin (audit cats 2, 3)
- **Estimated scope**: 1 file, 2 class edits (Prelude.tsx)

## Problem

The Prelude header's ARCHIVE pill is the site's primary action. Its press
and hover motion share one declaration on Tailwind's default ease
(`cubic-bezier(.4, 0, .2, 1)` — a symmetric ease-in-out-flavored curve):

```tsx
/* src/components/Prelude.tsx:274 — current */
className="group inline-flex h-11 items-center gap-2 rounded-full bg-bone ps-3.5 pe-1.5 font-display text-[0.64rem] leading-none font-medium tracking-[0.16em] text-ink uppercase transition-[background-color,scale] duration-200 hover:bg-signal active:scale-[0.97] md:h-12 md:gap-4 md:ps-6 md:pe-1.5 md:text-[0.82rem] md:tracking-[0.22em]"
```

Per the audit playbook (AUDIT.md cat 2 "Easing & duration"):

1. **Press feedback budget = 100–160ms with ease-out; this press runs
   200ms on a symmetric curve.** The dip is the system's response to the
   finger — it must start fast and settle (ease-out), not ease *into* motion.
2. The hover arrow one line below animates a *movement* on the same default
   ease — movements read best on ease-out as well:

```tsx
/* src/components/Prelude.tsx:283 — current */
className="size-4 transition-transform duration-200 group-hover:translate-y-0.5"
```

## Target

```tsx
/* target — Prelude.tsx:274 (button) */
className="group inline-flex h-11 items-center gap-2 rounded-full bg-bone ps-3.5 pe-1.5 font-display text-[0.64rem] leading-none font-medium tracking-[0.16em] text-ink uppercase transition-[background-color,scale] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-signal active:scale-[0.97] md:h-12 md:gap-4 md:ps-6 md:pe-1.5 md:text-[0.82rem] md:tracking-[0.22em]"
```

```tsx
/* target — Prelude.tsx:283 (arrow svg) */
className="size-4 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-y-0.5"
```

Exact values and why:

- **Scale press: `0.97`, 180ms, `cubic-bezier(0.23, 1, 0.32, 1)`** — the
  house ease-out. Top of the press budget so dip and release can share one
  duration (the transition retargets on release — no keyframe restart), while
  the strong ease-out front-loads the response so the held press reads ~150ms.
- **Hover stays inside the same declaration**: a strong ease-out on a color
  change satisfies the audit's "enter → ease-out" rule; no second utility
  needed.
- **Arrow: 200ms kept, curve to the same house ease-out.**

## Repo conventions to follow

- The site already uses `cubic-bezier(0.23, 1, 0.32, 1)` verbatim in
  `src/app/globals.css:762` (`.dk-mark` transitions) and the dialog lift
  rules — one house ease-out, copy it byte-for-byte.
- Plan 003 (easing tokens) will define this curve as `--ease-out` in the
  `@theme` block. If 003 has landed, write `ease-(--ease-out)` (Tailwind v4
  variable-ease syntax) instead of the literal bezier. If not, use the
  literal as shown. Decide by grepping `src/app/globals.css` for
  `--ease-out`.
- Tailwind arbitrary `duration-[…]` / `ease-[…]` utilities exist nowhere yet;
  this plan introduces them in one file so 003's later token migration stays
  small.

## Steps

1. `src/components/Prelude.tsx:274` — inside the button's className replace
   `duration-200` with
   `duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]`. The rest of the
   line stays byte-identical.
2. `src/components/Prelude.tsx:283` — on the arrow svg's className, replace
   `transition-transform duration-200` with
   `transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]`.
3. Feel-check (below). If the press still reads late, change `180ms` →
   `150ms` (step 1 only) and re-check; do not touch anything else.

## Boundaries

- Do NOT touch `LoadingScreen.tsx`, `TicketFrame.tsx:110`, `WatchModal.tsx:59`
  or `Footer.tsx:66` — press harmonization there is plan 002's revised scope.
- Do NOT change `hover:bg-signal`, the `group-hover:*` values, layout,
  spacing, or the `data-prelude-*` reveal animation — motion tuning only.
- Do NOT switch to `transform: scale()` — the site's transitions use the
  independent `scale` property; keep it.
- Do NOT add easing tokens (plan 003 owns that); if they already exist, use
  them per the conventions section.
- If the code at these lines no longer matches the excerpts above, STOP and
  report instead of improvising.

## Verification

- **Mechanical**: `pnpm lint` (0 errors), `pnpm build` clean.
- **Feel check** (run `pnpm dev`, open the Prelude):
  - Press and hold ARCHIVE — the dip starts within ~1–2 frames and
    decelerates into 0.97; release springs back 1:1 — no ease-in hesitation
    at the start of either direction.
  - Hover (no click) — the bone→signal flood keeps its character; no flash
    or overshoot.
  - Spam-click 10× — every press responds immediately with no restart from
    zero (transition retargeting; if it snaps, STOP — a keyframe got in).
  - DevTools → Animations panel → playback 10%: dip begins immediately after
    mousedown and eases out toward 0.97.
  - Toggle `prefers-reduced-motion`: the pill reveal stays static (reduced
    path) and the press scale still works — scale feedback is exempt from
    reduction.
- **Done when**: the pill's press reads decisively faster than before and
  nothing else moved.

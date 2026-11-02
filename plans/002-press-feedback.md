# 002 — Press feedback harmonization across pressables

- **Status**: DONE (executed at working tree; see note below)
- **Commit**: 4e3fdba *(revised at same commit; original premise stale)*
>
> **Execution note.** Executed on the working tree together with plan 009:
> TicketFrame / WatchModal / Footer / `.loader-skip` are committed; the
> ARCHIVE pill edit (`Prelude.tsx:274,283`) is applied but lives inside the
> uncommitted Prelude/hero/words-stagger WIP, so it lands with that commit.
> Verified live: `scale 0.18s cubic-bezier(0.23, 1, 0.32, 1)`; 13/13
> playwright tests green at baseline AND after.
- **Severity**: MEDIUM
- **Category**: Physicality & origin + Cohesion & tokens (audit cats 3, 7)
- **Estimated scope**: 4 files, ~4 class edits + 1 CSS block

> **Revision note (4e3fdba).** The original plan (commit `4740f20`) targeted
> "no press feedback anywhere". Since then every pressable grew its own
> `active:scale-[0.9x]` and `scale` in the transition list — the *introduction*
> is done, per-component. What remains is **harmonization**: one depth, one
> duration, one curve, everywhere.

## Problem

Press feedback exists but disagrees with itself (all verified at `4e3fdba`):

```tsx
/* src/components/Prelude.tsx:274 — depth 0.97, 200ms, default ease */
transition-[background-color,scale] duration-200 … active:scale-[0.97]

/* src/components/TicketFrame.tsx:110 — depth 0.96, 200ms, default ease */
transition-[color,background-color,border-color,scale] duration-200 … active:scale-[0.96]

/* src/components/WatchModal.tsx:59 — depth 0.96, 200ms, default ease */
transition-[color,scale] duration-200 … active:scale-[0.96]

/* src/components/Footer.tsx:66 — depth 0.96, 200ms, default ease */
transition-[color,background-color,border-color,scale] duration-200 … active:scale-[0.96]
```

```css
/* src/app/globals.css:586 — loader skip button: depth 0.96, 200ms, bare ease */
.loader-skip:active {
  scale: 0.96;
}
.loader-skip {
  …
  transition:
    color 0.2s ease,
    scale 0.2s ease;
}
```

Two divergences from the audit playbook (AUDIT.md cat 2 / cat 7):

1. **All presses run 200ms on the default symmetric ease** — the budget for
   press feedback is 100–160ms ease-out; the response should start on
   mousedown and settle, not ease in.
2. **One depth per purpose**: `0.97` vs `0.96` for the same gesture.
   The audit target band is 0.95–0.98, but a site with one press gesture
   should have one value.

(Youtube link `WatchModal.tsx:87` has underline-only hover — an exit affordance
to an external target; leave it out-of-scope.)

## Target

Every press: **scale 0.97, 180ms, `cubic-bezier(0.23, 1, 0.32, 1)`**
(the house ease-out — same pair plan 009 lands on the ARCHIVE pill).

- `Prelude.tsx:274` — depth already 0.97; becomes the reference once its
  duration/ease land (plan 009). No change in THIS plan.
- `TicketFrame.tsx:110` — `active:scale-[0.96]` → `active:scale-[0.97]`,
  `duration-200` → `duration-[180ms]`, and
  `ease-[cubic-bezier(0.23,1,0.32,1)]` appended to the transition utilities.
- `WatchModal.tsx:59` — same three-part swap (depth 0.96 → 0.97, →
  180ms, + house ease-out).
- `Footer.tsx:66` — same three-part swap.
- `globals.css` `.loader-skip` — `scale: 0.96` → `scale: 0.97`; in the
  transition list `scale 0.2s ease` → `scale 180ms cubic-bezier(0.23, 1, 0.32, 1)`
  (keep the `color 0.2s ease` line untouched).

## Repo conventions to follow

- House ease-out appears verbatim in `src/app/globals.css:762` (`.dk-mark`)
  and the dialog lifts — copy it byte-for-byte.
- After plan 003 lands, express the curve as `var(--ease-out)` in the CSS
  block and `ease-(--ease-out)` in Tailwind classes; until then inline the
  literal bezier.
- `LoadingScreen.tsx`'s skip button styles live in globals.css
  (`.loader-skip`), not in the component — edit the CSS block, not the TSX.

## Steps

1. `src/components/TicketFrame.tsx:110` — replace
   `transition-[color,background-color,border-color,scale] duration-200` with
   `transition-[color,background-color,border-color,scale] duration-[180ms]
   ease-[cubic-bezier(0.23,1,0.32,1)]`, and `active:scale-[0.96]` with
   `active:scale-[0.97]`.
2. `src/components/WatchModal.tsx:59` — replace
   `transition-[color,scale] duration-200` with
   `transition-[color,scale] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]`,
   and `active:scale-[0.96]` with `active:scale-[0.97]`.
3. `src/components/Footer.tsx:66` — same swap as step 1 (identical strings).
4. `src/app/globals.css` `.loader-skip` — in the base block's transition
   list, change `scale 0.2s ease` to
   `scale 180ms cubic-bezier(0.23, 1, 0.32, 1)`; in the `:active` block,
   `scale: 0.96` → `scale: 0.97`.
5. Confirm `Prelude.tsx:274` already matches plan 009's landed values
   (`0.97` / `180ms` / house ease-out); if 009 has not run, note it and leave
   the pill consistent with this plan's values in a follow-up of 009 only.

## Boundaries

- Do NOT add new per-component press targets (YouTube link, category rows,
  CategoryChooser chips — their background-flash feedback is a different,
  intentional register; rows/chips should not scale).
- Do NOT change hover colors, reveals, or the loading-screen counter.
- Do NOT touch `Cursor.tsx` (aperture ring contracts on press by design).
- Depth/duration/curve ONLY — no markup, no extra properties.
- If any excerpt no longer matches the code found, STOP and report.

## Verification

- **Mechanical**: `pnpm lint` (0 errors), `pnpm build` clean;
  `grep -rn "scale-\[0.96\]" src/components` returns nothing.
- **Feel check** (run `pnpm dev`):
  - Press-and-hold each of WATCH (ticket), ✕ CLOSE (lightbox), FLIP IT OVER
    (footer), and the loader's SKIP: all four dip to the same depth at the
    same speed; none feels measurably snappier or mushier than another.
  - Spam-click each 10× — immediate response every time, no restarts.
  - Loader: trigger SKIP mid-load — same dip character as the site's other
    buttons (it now uses the house ease-out).
- **Done when**: every pressable dips to 0.97 at the same speed with the
  same curve; nothing else changed.

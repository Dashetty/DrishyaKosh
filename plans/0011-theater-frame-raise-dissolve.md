# 0011 — The frame dissolves with the raise: architecture leaves with its fabric

- **Status**: TODO
- **Commit**: 41e8b32
- **Severity**: MEDIUM
- **Category**: Physicality & origin (audit cat 3)
- **Estimated scope**: 1 file, 1 tween edit + 2 constants
- **Revision 2** (post Curator review): explicit `fromTo` with
  `immediateRender: false` (no mid-arrival capture), `power1.in` hold,
  named constants, drift rule.

## Problem

The raise completes at progress 0.92 (`RAISE_END`): the drape's
clip-path reaches `inset(0% 0% 100% 0%)` and the curtain is fully gone.
The proscenium frame fades *after* that:

```tsx
/* src/components/Theater.tsx — current (match by content; 0010 has
   shifted the lines) */
// the architecture clears the stage last
.to(frame, { autoAlpha: 0, duration: 0.04, ease: "none" }, RAISE_END);
```

The fade starts at 0.92 with duration 0.04 — so for a visible beat a
lone gold arch floats over the bare stage, then vanishes. Architecture
leaving *after* the fabric it framed reads as an afterthought; the
visitor sees the stage empty out twice.

**Capture risk (Curator review):** written as a plain `.to`, this tween
reads the frame's current value when it first runs — and since 0010, the
arrival can still be mid-flight when the scrub starts, so it could
capture a half-faded frame (say opacity 0.3) and the raise would fade
0.3 → 0, never showing the arch whole. The frame's opacity is owned by
*both* the arrival and the scrub, so the scrub must pin its own start
value explicitly.

## Target

Named constants (next to `SETTLE` / `LIGHTS_DOWN` / `RAISE_END`):

```tsx
/* target — src/components/Theater.tsx, constants block */
const SETTLE = 0.3;
const LIGHTS_DOWN = 0.62;
const RAISE_START = 0.7; // the raise begins — drape clip starts growing
const RAISE_END = 0.92; // the raise is complete — the stage rests bare
const FRAME_START = RAISE_START + 0.04; // the arch holds one beat, then
// dissolves with the fabric
```

(Rename the drape's two hardcoded `0.7` positions to `RAISE_START` while
touching the block — optional but keeps the constants honest.)

The tween:

```tsx
/* target — src/components/Theater.tsx, replacing the old frame tween */
// the architecture dissolves with the fabric it frames — one motion,
// both gone by RAISE_END (a late lone-frame fade read as an afterthought)
.fromTo(
  frame,
  // explicit from + immediateRender:false: never capture a mid-arrival
  // opacity, and never stomp the arrival's hidden state at build time
  { autoAlpha: 1 },
  {
    autoAlpha: 0,
    duration: RAISE_END - FRAME_START,
    ease: "power1.in",
    immediateRender: false,
  },
  FRAME_START
)
```

Values and why:

- **`FRAME_START = 0.74`**: the arch holds through the first instant of
  the fabric gathering, then dissolves across the motion — at the moment
  the drape is half-risen the frame is half-faded (and with `power1.in`,
  still ~90% present at half-time), so the eye reads one combined exit
  instead of two.
- **`ease: "power1.in"`**: a linear fade reads slow-then-sudden; the
  gentle in-curve makes the arch hold a little longer before going. It
  only shapes the fade's *perceived* speed — the dissolve still lands
  exactly at `RAISE_END` with the fabric, so nothing desyncs.
- **`immediateRender: false`**: without it, a timeline `fromTo` could
  apply its `from` state at build time — stomping the arrival's hidden
  frame state (`opacity: 0` SSR inline) and flashing the arch before the
  arrival fades it in.
- **Duration ends exactly at `RAISE_END`** — nothing lingers past the
  raise.

**Design question, answered:** why does the arch leave at all — real
curtains rise and the proscenium stays? That was the Curator's own feel
decision this screening ("frame dissolves with the raise" over "frame
stays forever"); the stills may yet reverse it, and the alternative is a
one-tween change (delete this fade, keep the arch through the pin). Not
re-litigated here.

## Repo conventions to follow

- The raise is clip-path + opacity only, compositor-safe (ADR-0014).
- Single-writer: the arrival owns `frame`'s opacity until the visitor
  scrolls; this scrub tween takes over from an **explicit** value, never
  a captured one.

## Steps

1. `src/components/Theater.tsx` — add `RAISE_START` and `FRAME_START` to
   the constants block; replace the old frame tween with the target
   above (comment included).
2. `npx tsc --noEmit` must pass.

## Boundaries

- Do NOT touch the drape's clip-path or yPercent tweens, `LIGHTS_DOWN`,
  the snap logic, or the dim/pool/spot-relight beats (beyond the
  optional `RAISE_START` rename of the drape positions).
- Do NOT touch the arrival's frame fade (it is correct).
- **Drift rule**: match by code content — 0010 has already shifted line
  numbers in this file, and 0012 will shift them again.
- If code content doesn't match, STOP and report.

## Verification

- **Mechanical**: `npx tsc --noEmit` clean; `npx playwright test` — all
  11 pass.
- **Feel check** (dev server; `node scripts/theater-shots.mjs` beats
  05–07, or browse live):
  - Scroll through the raise slowly: curtain and arch leave **together**
    — no moment where the arch stands alone over the bare stage.
  - The arch visibly *holds* through the first beat of the gather
    (power1.in), then goes.
  - At `RAISE_END` nothing fades after the fact.
  - Reverse-scroll: arch and curtain return together, no ghosting, and
    the arrival's fade-in still works when scrolling back to the top.
- **Done when**: no lone-frame state exists anywhere in the raise's
  scrub range.

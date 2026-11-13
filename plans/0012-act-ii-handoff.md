# 0012 — ACT II handoff: the pin prints "ACT II —", the Archive completes it

- **Status**: TODO
- **Commit**: 41e8b32
- **Severity**: MEDIUM
- **Category**: Cohesion + Missed opportunity (audit cats 7, 8)
- **Estimated scope**: 3 files, ~50 lines added
- **Revision 2** (post Curator review): label prints 0.86 → 0.92 (fully
  printed at the snap's rest state), anchored near the bottom of the pin
  above the seam, right rule dropped for a seam-pointing tick, tracking
  compensation, 0.95rem minimum, SSR-hidden stage + no-JS rule, and the
  stage's leftover transform cleared on complete.

## Problem

Act I ends and Act II just exists. The raise completes on a bare ink
stage; the very next scroll lands in the ReelCarousel:

```tsx
/* src/components/ReelCarousel.tsx:570-575 — current */
<section
  ref={sectionRef}
  id="section-carousel"
  className="deg-section"
  style={{ height: trackHeight(total) }}
  aria-label={heading}
>
```

…whose "THE ARCHIVE" heading and deck have **no entrance at all** — the
only motion in the section is the drag-physics ticker
(`ReelCarousel.tsx:322`). The theater-to-Archive seam is a hard cut into
a static dashboard. The curtain metaphor sets up an entrance that never
happens.

The Prelude already demonstrates the fix's grammar — a sentence composed
across a section boundary ("WELCOME TO" rides glued to the seam,
`Prelude.tsx:109-114`, completing into the card's marquee). The outro
gets the same treatment: the theater prints "ACT II —", the Archive's
own heading completes it with "THE ARCHIVE".

**But placement is everything (Curator review):** printed at the pin's
*center* in its final 8%, the label gets ~17svh of scroll before the pin
releases and it scrolls away — nobody reads it, and "THE ARCHIVE" is a
full screen below, so the two halves never share the screen. The label
must sit **near the bottom of the pin, above the seam** (like the
Prelude's Threshold), and be **already printed at the snap's rest
state** (0.92) so a mid-raise snap lands on a closing act, not a bare
pause.

## Target

### 1. The intertitle beat inside the pin (Theater.tsx)

New markup inside the sticky container, after the type block and before
the container's closing `</div>`:

```tsx
{/* ACT II — the intertitle printed on the bare stage above the seam;
    the Archive's own heading completes the sentence across the boundary
    ("ACT II — / THE ARCHIVE"). One rule + a seam-pointing tick — the
    phrase must read as continued, not closed. Hidden rest state owned
    by the class (clearProps trap — see .theater-dim). */}
<div
  ref={actTwoRef}
  aria-hidden
  className="theater-act2 absolute inset-0 z-[38] flex flex-col items-center justify-end pb-[14svh]"
>
  <div className="flex items-center gap-[1.4em] px-[8vw]">
    <span aria-hidden className="h-px w-14 border-t border-hairline" />
    {/* -mr compensates tracking-[0.5em]'s trailing space so the glyphs
        sit centred; 0.95rem floor keeps it readable */}
    <span className="theater-caslon theater-type text-smoke -mr-[0.5em] text-[clamp(0.95rem,1.5vw,1.2rem)] tracking-[0.5em]">
      ACT II
    </span>
  </div>
  {/* the tick pointing down at the seam — the sentence continues */}
  <span aria-hidden className="mt-[1.6em] block h-8 w-px border-l border-hairline" />
</div>
```

`z-[38]` matches the type layer (the dim z-36 has already lifted by
then). `theater-caslon` / `theater-type` / `text-smoke` /
`border-hairline` are existing utilities — confirm `text-smoke` and
`border-hairline` exist (used at `ReelCarousel.tsx:582,585`); if
`theater-type` sets a color that fights `text-smoke`, put the color
*after* it so it wins the cascade. Contrast:
`--color-smoke oklch(0.65 0.05 75)` on `--color-ink oklch(0.148 0.009 65)`
is ≈4.8:1 — passes 4.5:1; confirm by eye in the stills.

New ref with the others, grabbed in the effect, added to the null-guard
and the teardown `clearProps` array:

```tsx
/* target — with the other refs */
const actTwoRef = useRef<HTMLDivElement>(null);
```

The beat — prints **0.86 → 0.92**, so it is fully settled at the snap's
`RAISE_END` rest state and holds through the pin's last stretch:

```tsx
/* target — src/components/Theater.tsx, in the rise timeline, after the
   frame dissolve tween (see plans/0011) */
// ACT II — the next act's label prints above the seam as the raise
// completes; the Archive's heading completes the sentence across it
.fromTo(
  actTwo,
  { autoAlpha: 0, y: 24 },
  { autoAlpha: 1, y: 0, duration: 0.06, ease: "power1.out" },
  0.86
)
```

(0.86 + 0.06 = 0.92: settled exactly at `RAISE_END`. The snap's rest
states stay `LIGHTS_DOWN` and `RAISE_END` — stopping mid-raise at ≥0.77
snaps to 0.92 where the label is already printed; stopping anywhere
above 0.92 never snaps, so the label holds and scrolls away. Do NOT add
a third rest state.)

CSS — hidden rest state owned by the class (the `clearProps` /
unchanged-style-prop trap; same pattern as `.theater-dim`):

```css
/* target — src/app/globals.css, next to .theater-dim */
/* ACT II intertitle — prints on the bare stage above the seam in the
   pin's final stretch; the class owns the hidden rest state. */
.theater-act2 {
  opacity: 0;
}
```

Reduced motion: `staticCard` never reaches the rise timeline; the class
default (0) keeps the still clean — no JSX style needed.

### 2. The deck's entrance (ReelCarousel.tsx)

The stage wrapper (`ref={stageRef}` → `.deg-stage`,
`categoryCarousel.css:27` — sticky top-0, h-100svh) rises and un-fades
as its section enters. The engine (`paint()`, `ReelCarousel.tsx:163`)
writes transforms only to **slots** and `fillRef` — never to
`stageRef` — so the wrapper is free for an entrance (single-writer
respected). Slots keep the engine as their only writer.

**SSR-hidden state (ADR-0011):** the stage hides in the markup, not
post-hydration — with a class, plus a no-JS rule and a reduced-motion
opt-out (the class must not hide the deck from people who get no
entrance).

Markup change:

```tsx
/* src/components/ReelCarousel.tsx:577 — current */
<div ref={stageRef} className="deg-stage">
```

```tsx
/* target */
<div ref={stageRef} className="deg-stage deg-stage-enter">
```

```css
/* target — src/components/categoryCarousel.css, after .deg-stage */
/* ACT II entrance — SSR-hidden until the entrance scrub reveals it
   (ADR-0011: hidden states in SSR markup, not post-hydration hiding).
   Reduced motion removes the class (below); no-JS overrides it. */
.deg-stage-enter {
  opacity: 0;
}
```

The effect (place after the reduced-motion effect at ~line 459):

```tsx
/* target — src/components/ReelCarousel.tsx, new effect after line 459 */
// ACT II entrance — the stage rises out of the theater's seam as the
// section enters. The wrapper only: the slot engine owns the cards'
// transforms (single writer); paint() never touches the stage.
useEffect(() => {
  const stage = stageRef.current;
  const section = sectionRef.current;
  if (!stage || !section) return;

  // reduced motion gets the deck immediately — lift the SSR-hidden class
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    stage.classList.remove("deg-stage-enter");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const enter = gsap.fromTo(
    stage,
    { y: 64, autoAlpha: 0 },
    {
      y: 0,
      autoAlpha: 1,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top 88%",
        end: "top 48%",
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
      // GSAP must not leave a lingering transform on the stage: it
      // changes how the slots' 3D, fixed children and z-ordering resolve
      // inside it. Scrubbing backward re-applies it — this only cleans
      // the settled end state.
      onComplete: () => gsap.set(stage, { clearProps: "transform" }),
    },
  );
  return () => {
    enter.scrollTrigger?.kill();
    enter.kill();
    gsap.set(stage, { clearProps: "all" });
  };
}, []);
```

```tsx
/* target — src/components/ReelCarousel.tsx imports (~line 3-4) */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
```

And the no-JS rule, inside the section's JSX:

```tsx
{/* target — src/components/ReelCarousel.tsx, inside the section root */}
<noscript>
  <style>{`.deg-stage-enter{opacity:1 !important}`}</style>
</noscript>
```

Values (unchanged from revision 1 — Curator accepted):

- **y 64 → 0, autoAlpha 0 → 1** — the cast walks up into the house light
  the pool bloom just switched on.
- **`start "top 88%" / end "top 48%"`** — completes before the sticky
  stage catches at the viewport top.
- **`scrub: 0.5`** — matches the theater's single-lag rule under Lenis.
- **`ease: "none"`** — scrubbed tweens ride the scroll.

## Repo conventions to follow

- Sentence-across-the-seam: `Prelude.tsx:109-114` is the exemplar.
- Hidden rest states owned by CSS classes: `.theater-dim` /
  `.theater-ignition` in `globals.css` (ADR-0014, second screening).
- Reduced-motion guard by matchMedia: `Intertitle.tsx:25`,
  `ReelCarousel.tsx:448`.
- Kill ScrollTriggers + `clearProps` on cleanup: `Intertitle.tsx:43-46`.

## Steps

1. `src/app/globals.css` — add `.theater-act2 { opacity: 0; }`.
2. `src/components/categoryCarousel.css` — add `.deg-stage-enter`.
3. `src/components/Theater.tsx` — add `actTwoRef`; render the intertitle
   block (exact JSX above); grab `actTwo` in the effect, add it to the
   null-guard and the teardown `clearProps` array; add the
   `.fromTo(actTwo, ...)` beat at 0.86.
4. `src/components/ReelCarousel.tsx` — extend imports with
   `ScrollTrigger`; add the `deg-stage-enter` class to the stage div and
   the `<noscript>` rule; add the entrance effect (exact code above).
5. `npx tsc --noEmit` must pass.

## Boundaries

- Do NOT touch the slot engine (`paint`, the drag ticker, `slotRefs`) —
  the cards keep exactly one writer.
- Do NOT touch the theater's acts 1–2, the snap, or the pin length.
- Do NOT change the carousel heading text ("THE ARCHIVE" stays; it
  completes the sentence — the pin prints only "ACT II").
- Do NOT add a third snap rest state.
- **Drift rule**: match by code content — 0010 and 0011 have shifted
  line numbers in `Theater.tsx` already.
- If code content doesn't match, STOP and report.

## Verification

- **Mechanical**: `npx tsc --noEmit` clean; `pnpm build` clean;
  `npx playwright test` — all 11 pass.
- **Feel check** (dev server; browse extension live, or
  `node scripts/theater-shots.mjs` — beats 06–07 show the label
  printing):
  - Scroll through the raise: the stage rests bare, then "ACT II"
    settles up **near the bottom of the pin, above the seam** — one
    rule + a tick pointing down, smoke-grey not gold.
  - **Stop mid-raise past ~0.8**: the snap lands on 0.92 with the raise
    complete AND the label already printed — the act closes, no bare
    pause.
  - Keep scrolling: the theater scrolls away and "THE ARCHIVE" + the
    deck rise into view, completing the sentence. The entrance finishes
    before the sticky stage catches.
  - Reverse-scroll: the deck sinks and fades back; "ACT II" un-prints.
    The stage is truly invisible at entrance-progress 0 (autoAlpha
    sets visibility).
  - After the entrance completes, drag the deck / arrow-key it: the
    engine behaves exactly as before, and DevTools shows **no
    lingering transform** on `.deg-stage` (cleared on complete).
  - Emulate `prefers-reduced-motion`: the theater shows the finished
    card; the carousel shows the deck immediately (the SSR-hidden class
    is removed); "ACT II" never visible.
  - Disable JS: the deck is visible (noscript rule); "ACT II" is not.
  - Check the label colour against the ink by eye — should read at
    4.5:1 comfortably at 0.95rem.
- **Done when**: the pin closes on "ACT II" above the seam and the
  Archive arrives as the sentence's completion with a populated deck.

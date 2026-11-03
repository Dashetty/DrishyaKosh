# ADR-0011: Spell UI Recipes Are Ported to GSAP, Not Installed

**Status**: Accepted · **Date**: 2026-10-31 · **Refines**: ADR-0007 (Prelude motion)

## Context

Spell UI (spell.sh) is the reference library for text animation. Its
components depend on `motion`; this site's whole motion layer (loader, Prelude,
Hero scrub, carousel, Lenis) is GSAP + ScrollTrigger. Spell's *Words Stagger*
is ~60 lines: per word, `opacity 0→1`, `y 10→0`, `blur(10px)→0`, 0.5s easeOut,
0.1s stagger. It is MIT licensed and copy-paste by design.

Two defects in how the Prelude used the idea:

1. **Arrow arrived first.** Hidden states were applied by `gsap.set` after
   hydration. The SSR paint therefore showed the arrow; and its arrowhead
   `<path>` was never hidden or animated at all, so it sat on screen from first
   paint until the end.
2. **Prose animated as blocks**, not word by word, so it never actually used
   the Words Stagger technique.

## Decision

- **Port the recipe, don't install the dependency.** `WordsStagger.tsx` keeps
  Spell's API (`delay`, `stagger`, `speed`, `inView`, `once`, `onStart`,
  `onComplete`) on GSAP. One engine, no `motion` in the bundle, no two engines
  fighting over one element's `transform`/`filter`.
- **Hidden state lives in the server markup** (inline style on each word, the
  arrow's svg opacity and a normalised `pathLength=1` dash). Nothing is hidden
  by post-hydration JS.
- **House additions over Spell:** `gate` (waits for `dk:intro:done` via
  `lib/introGate.ts`), `startOnScroll` (holds the reveal until the user first
  scrolls past a `window.scrollY` threshold in px; Prelude passes 6 for the
  "Welcome to" line), rich children (styled spans and `<br />` survive —
  Spell drops every non-string child), clears inline styles when finished,
  reduced motion renders plain text.
- Arrow order is now: "Hello", "there" → shaft draws → head draws → portrait.

## Consequences

- New Spell recipes (Blur Reveal, Slide Up Text) should follow the same route:
  copy the recipe, re-express in GSAP, credit Spell (MIT) in the file header.
- Use `WordsStagger` for any landing prose; keep scroll-scrubbed type (Hero)
  on ScrollTrigger timelines.
- Rule for any new reveal: if it starts hidden, it must be hidden in SSR markup.

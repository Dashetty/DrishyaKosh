# ADR-0007: Prelude Above the Hero — Editorial Introduction Panel

**Status**: Accepted · **Date**: 2026-10-29 · **Amends**: ADR-0006 §3 (page composition), ADR-0004 §1 (hero as first curator presence), ADR-0005 §1 (navigation story amendment)

## Context

The landing read as **Landing → Archive**: the red hero presented the wordmark
before the visitor knew who was speaking. The curator asked for a story-first
opening — **Introduction → Story → Realization → Transition → Archive** — in an
editorial, handcrafted register (direction from the Bruno Grazina-style
reference: collage-within-a-rigid-grid, facts as marginalia, one accent colour
owning the chaos; explicitly NOT a portfolio).

Sketch-confirmed compression: the whole story runs as **one beat panel** above
the intact red hero. The wordmark stays the punchline: the panel's last line,
"WELCOME TO", completes into the hero's DRISHYA / KOSH below the fold.

## Decision

1. **A `Prelude` section renders between `SiteNav` and `Hero`** (`page.tsx`).
   Ink ground; nothing below the hero moved.
2. **Composition**: corner chrome (decorative `DRISHYAKOSH` wordmark left, the
   page's one navigation shortcut right — see §4), hand-set "Hello there →
   i am — Hardeep Dilip Shetty" left of a graded curator portrait dead-centre,
   body copy right, reel-ring sprite concentric behind the portrait, tape
   strips + hand-drawn star as collage nodes, "WELCOME TO" + scroll cue last.
3. **Motion**: one GSAP master timeline gated on the intro overlay's
   `dk:intro:done` (started directly on session replays). Techniques are
   Spell UI's blur-reveal / words-stagger, re-implemented on the house GSAP
   engine (no `motion` dependency; one animation system). Beats land at
   ≈0.0 / 0.45 / 1.05–1.1 / 1.55 / 2.15 / 2.5 s. Per-element scroll drift
   (`data-prelude-drift`, differential yPercent over the hero's entry span)
   hands the panel off to the hero; the hero's scrub is untouched.
   `prefers-reduced-motion`: static accounting — everything visible; a
   committed pre-reduced pass wipes its gsap state (`clearProps`), because
   hydration can run the effect once with the server snapshot.
4. **Navigation amendment**: the Prelude carries the page's one shortcut —
   an **ARCHIVE** button top-right that Lenis-glides to `main` (native
   fallback). It is the only exception to ADR-0005's "one navigation story";
   the reel mark remains purely decorative and FLIP IT OVER remains the only
   return-to-top.
5. **Mark dressing (SiteNav)**: new zone `prelude` — bone-dressed while the
   hero's red edge is still below the mark's row (`heroRect.top > 0` and not
   in scrub); otherwise the unchanged zone ladder applies.
6. **Seam**: the Prelude's bottom carries a static angled signal wedge
   (`polygon` heavily mirroring the hero's own wedge) so the ink→red cut reads
   as the same move the hero uses into the archive.
7. **Assets**: curator portrait is graded to the one film stock (static warm
   grade — no full-colour reveal) and served as
   `curator-portrait@2x.avif` + `@2x.webp`; the reel ring reuses the existing
   `Capital letter D@2x.avif` sprite (actually the sprocket ring) as an
   amber alpha-masked `prelude-d`, spinning slowly (reduce: off).

## Consequences

**Positive**
- The visitor meets the curator before the wordmark; the hero's red block
  lands as an arrival, not an opening.
- One implementation of motion timing; the loading handoff, beats, and
  scroll-out are tuned on a single timeline.

**Negative**
- The page gained ~100svh before the archive; the ARCHIVE shortcut exists to
  pay for that.
- The prelude's inline `opacity: 0` pre-paint creates a dark-first-paint on
  landing sessions (mirrors the Hero tagline compromise).

**Neutral**
- Full ADR-0006 theatre below `main` unchanged; CategoryChooser/ReelCarousel/
  Footer untouched.
- Glossary: **Prelude** (the introduction panel), **Threshold**
  (the "WELCOME TO" beat that completes into the wordmark).

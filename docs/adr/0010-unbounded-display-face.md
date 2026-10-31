# ADR-0010: Unbounded Is the Display Face — Maghfirea Retired

**Status**: Accepted · **Date**: 2026-10-30 · **Amends**: ADR-0004 (typography), ADR-0009 (Unbounded as wired hero face)

## Context

The hero glyph wall was set in Unbounded variable (ADR-0009), reverse-engineered
from vigilante.group's LAWLESS/CREATIVITY block. The rest of the display
surfaces — loading wordmark, kinetic intertitles, carousel stage headings,
prelude chrome, ticket quote marks — still used Maghfirea, a serif display
face. The result was a serif/sans split across one design language: the red
statement wall spoke in Unbounded's chunky rounded caps while every other
title spoke serif.

## Decision

**Maghfirea is retired; Unbounded takes every display role.** The
`--font-display` token repoints to `"Unbounded", sans-serif`, so every
ex-Maghfirea surface (Intertitle, LoadingScreen, CategoryChooser,
categoryCarousel stage headings, TicketFrame quote marks, Prelude chrome)
follows the token unchanged — no per-component edits. The Maghfirea
`@font-face`, its preload in `layout.tsx`, and `public/fonts/maghfirea.woff2`
are deleted; the `--font-unbounded` alias was folded out (one token for the
one display role). The hero SVG text now reads `var(--font-display)`.

Unbounded is preloaded alone (it is the LCP face AND the face of every title
on first paint). Its variable `wght` axis (200–900) is available to later
weight tuning; current roles render at 400.

## Consequences

**Positive**
- One display voice across the site: loader → prelude → red wall → kinetic
  titles are the same face.
- One fewer font file, one fewer preload, one display token.
- Every display surface inherits future Unbounded tuning (weight, axes)
  from a single `@font-face`.

**Negative**
- Unbounded is materially wider than Maghfirea. Long kinetic titles
  ("DOCUMENTARY", "SHORT FILMS") and the loader wordmark render wider at the
  same font sizes; `clamp()` sizes and tracking were serif-tuned and may need
  optical passes per surface (visual QA, not geometry — nothing is `1px`
  measured).

**Neutral**
- Unwired components (CategoryChooser) follow the token automatically, so a
  future rewire won't resurrect serif.
- Weight 400 is vigilante's choice for the wall; body faces untouched.

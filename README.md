# DrishyaKosh

**A personal archive of moving pictures — handpicked, not algorithmic.**

A curated film archive presented with the quiet confidence of a professional portfolio. Every video is a **Frame** (graded thumbnail with curator's note); frames are grouped into themed **Reels** that open on an **Intertitle** like a silent-film title card. The experience unfolds in three acts:

1. **The Intro** — a brief "threading the projector" sequence that signals the start of the film
2. **The Curator's Portrait** — the hero section introducing Hardeep Dilip Shetty and the archive's purpose
3. **The Projection** — the Drum stage where frames roll through the gate with cinematic physics

Stack: Next.js (App Router) · React · TypeScript · GSAP + ScrollTrigger · Lenis · Tailwind v4. No UI component libraries (BeUI is an approved copy-paste source for later motion primitives — see below).

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build
```

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` / `pnpm build` | dev server / production build |
| `pnpm verify:videos` | checks every `youtubeId` in `src/data/videos.ts` against YouTube's oEmbed endpoint. **Standalone — never part of the build.** |
| `pnpm make:og` | regenerates `public/og.jpg` (1200×630 duotone-graded still + wordmark). One-off, run manually. |

## Fonts

The four faces live in `public/fonts/` as woff2 (converted from the TTFs in
`DrishyaFonts/`), loaded via `@font-face` with `font-display: swap`:

| Face | Role |
|---|---|
| Maghfirea | wordmark, reel titles, frame titles — never body text |
| NeueBrucke | metadata: catalog numbers, credits rows, tags, buttons |
| NB International | body: notes, nav, durations |
| P22 Parrish Roman | curator's pull-quote (italic is synthesized — only the roman face exists) |

## Data

`src/data/videos.ts` holds the archive: `{ id, youtubeId, title, creator,
year, genre, reel, duration, curatorNote, catalogNumber }` plus a `reels`
array. Structured for a future CMS swap — replace the array's source with a
fetch, keep the shape.

**The curator's notes are placeholders**, written to keep frames legible
during the build. They are the soul of the site — replace each one in
`videos.ts` (clearly marked at the top of the file).

## Behaviour notes

- **The Drum (ADR-0002/0003)**: scrolling into the archive crossfades in a
  full-viewport stage — a pinned sentinel (one viewport-height) at the
  archive start drives a scroll-mapped fade-in (opacity + scale) over the
  hero, then pins when fully covered, handing input to wheel/drag/arrow keys
  that roll the active Reel's loop (its Intertitle + Frames) with infinite
  wrap, lerped inertia (siena.film constants), siena parallax layers
  (catalog corner 120%, title+credits 150%, curator quote 25%, poster +
  WATCH anchored), and velocity motion blur on the frames layer (≤8px,
  off on touch). Exiting downward (scroll past the sentinel, or the END OF
  REEL footer jump) crossfades the stage back out to opacity 0 — the stage
  stays mounted throughout, only Lenis scroll locks/unlocks.
- **The Rail** (fixed top-center, fused with the HUD): Reel tabs switch
  reels — landing on the target Reel's Intertitle with a full physics reset.
  The HUD shows the current card's catalog number and position with
  progress ticks. "END OF REEL ↓" exits to the footer from any reel;
  scrolling up on Reel 01's Intertitle unpins back to the hero.
- **Reduced motion**: the drum never mounts — the real-scrolling archive
  (Lenis + settle-snap, ADR-0001) serves instead. Discrete mouse-wheel
  notches get a 0.0032 multiplier (vs siena's 0.0011 for continuous
  trackpads) so ~3 clicks advance one card.
- **Watch = embed modal** (`youtube-nocookie`, paused until play, ESC/backdrop
  closes, "open on YouTube ↗" inside). While open the site enters a
  **projector hold**: grain and flicker pause, scroll locks.
- **Mobile**: same drum — vertical swipe rolls it; blur off; curator's note
  tap-to-reveal below the frame.
- Verify all of the above: `node scripts/drum-regression.mjs` (needs the dev
  server running; uses headless Chromium via @playwright/test).

## Decisions log

- BeUI (beui.dev) approved as a **copy-paste source only** (via shadcn CLI,
  imported per-component) for three named primitives when needed: Morphing
  Modal (watch lightbox), text reveal (loader), magnetic button (WATCH CTA).
  Never a blanket dependency.
- Domain vocabulary: `CONTEXT.md`. Decisions: `docs/adr/`.

# DrishyaKosh

**A personal archive of moving pictures — handpicked, not algorithmic.**

A curated archive of YouTube videos presented as one continuous film reel:
near-black, grainy, warm, archival. Every video is a **Frame** (film-poster
treatment with a curator's pull-quote); frames are grouped into themed
**Reels** introduced by silent-film **Intertitles**. Loading threads the
projector once per session; scrolling pulls the film through the gate.

Stack: Next.js (App Router) · React · TypeScript · GSAP + ScrollTrigger ·
Lenis · Tailwind v4. No UI component libraries (BeUI is an approved
copy-paste source for later motion primitives — see below).

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

- **Watch = embed modal** (`youtube-nocookie`, paused until play, ESC/backdrop
  closes, "open on YouTube ↗" inside). While open the site enters a
  **projector hold**: grain and flicker pause, scroll locks.
- **Film-roll scroll**: velocity skews the strip ±1.5°; on fine pointers the
  strip settles to the nearest frame via Lenis `scrollTo` after rest. Touch
  devices use native CSS scroll-snap. Rationale: `docs/adr/0001-film-roll-settling.md`.
- **Loading intro** runs once per session (`sessionStorage`), click skips it,
  and `prefers-reduced-motion` disables it plus skew, flicker, and grain
  animation.
- **Mobile**: frames near-full-width, sprockets/cursor hidden, curator's note
  tap-to-reveal below the frame.

## Decisions log

- BeUI (beui.dev) approved as a **copy-paste source only** (via shadcn CLI,
  imported per-component) for three named primitives when needed: Morphing
  Modal (watch lightbox), text reveal (loader), magnetic button (WATCH CTA).
  Never a blanket dependency.
- Domain vocabulary: `CONTEXT.md`. Decisions: `docs/adr/`.

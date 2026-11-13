# The Theater card — a title-card hero replaces the taffy wall

The landing was redesigned around a golden-age title card ("ACT I"): closed
red velvet curtains inside an ornate gold proscenium filling the viewport
edge to edge, the DRISHYAKOSH marquee arched in Broadway over it, and the
playbill block in Caslon Antique ("curated by Hardeep Dilip Shetty /
estb. MMXXVI / the tagline"). The taffy hero (ADR-0012/0013), its threshold
pull, and the tagline/scribble wall are retired; the Prelude stays and now
hands off to the card. The
scroll is the act itself: the card arrives once (gated on the intro), the
pin's scrub drifts the lamp and the velvet, and the last third **raises the
whole drape from the bottom** (clip-path inset wipe — the curtain's baked
fringe carries the edge) to reveal the bare stage the carousel enters on.

Revisions from the first screening (the Curator, same session): the card
fills the viewport with **no letterbox bars**; the Cast/Music playbill
lines are dropped in favour of "estb. MMXXVI" + the tagline; and the
floating SiteNav mark no longer rides the scrub (ADR-0013 superseded) —
it parks through the theater and is **printed on the card itself** as the
gold crest between the marquee and the credits. The Prelude's red wedge
at its bottom edge is removed too: the ink→curtain seam is a hard cut,
the way one title card follows another.

## Considered Options

- **A centerpiece on the stage** (portrait / projector / mascot, per the
  NMIXX "cat on a table" reference) — rejected by the Curator: the scene
  stays an empty stage; the type is the star and the curtain is the object.
- **Broadway with baked-in 3D variants** (`Broadway3D`, `Shadow`, `Gradient`)
  — rejected: the bevels' light direction is painted into the glyphs and
  fights the scene's spotlight; the depth is painted in CSS (drop-shadow
  chain + gradient text) so it matches the lamp and survives the per-letter
  arc animation. The flat `Broadway` face is used.
- **A script face for the wordmark** (Yellowtail prototype) — superseded by
  the Curator's choice of Broadway, set in caps (its lowercase is awkward).
- **SVG-traced versions of the photographic assets** — rejected: velvet and
  cast metal lose their texture to vectorization; raster AVIF/WebP is the
  correct format. SVG stays reserved for crisp/repeating ornament (none
  needed — the curtain asset carries its own valance and bottom fringe).

## Consequences

- `Hero.tsx` is unwired (file kept, like the other retired components);
  `tests/hero-animation.spec.ts` and `animation-capture.spec.ts` are
  retired with it (`.retired` extension), `flash-detection.spec.ts` is
  rewritten against the card.
- New faces ship: **Broadway** (Vladimir Nikolic's 1001fonts revival, FFC
  license — not the Monotype original) and **Caslon Antique** (Berthold),
  both subset to basic latin woff2. `--font-broadway` / `--font-caslon`
  tokens; the marquee gold gets its own `--color-marquee` scale (brighter
  than the `--color-amber` UI accent — lit metal, not interface gold).
- Assets live in `public/HeroSection/` (raw generations) and
  `public/HeroSection/opt/` (AVIF/WebP delivery files, ~450 KB total,
  emitted by `scripts/optimize-theater.mjs`; the curtain is preloaded).
- The card owns `[data-hero-scrub]`, so the Reel Mark's zone ladder carries
  over — but the `scrub` zone parks again (like the footer), and the mark's
  home over the theater is the card's own crest (`.theater-crest`, same
  alpha-mask technique, dressed in `--color-marquee` gold).
- CSS pipeline hazard worth remembering: Lightning CSS hoists oklch()
  **shorthand**s into a trailing `@supports` block, whose shorthand reset
  un-clips `background-clip: text` — gradient text must use the
  `background-image` longhand. Hit once, documented in globals.css.

## Second screening — the three-act choreography

The first scrub had a dead zone: ~62% of the pin's travel went to
imperceptible drifts (lamp 50%→46%, curtain 2.5%, type −4%) and all the
visible change compressed into the last 38%. It also smoothed twice —
Lenis (`lerp 0.09`) *and* the timeline (`scrub 1.1`) each lag the scroll,
and two lags read floaty, not cinematic. The pin was re-choreographed as
three acts on a single timeline, each third one idea:

1. **House settles** (0–0.3) — the lamp finds its mark, the velvet eases.
2. **Lights down** (0.3–0.62) — the room darkens around the lit card: a
   `.theater-dim` overlay (z-36, above the vignette, below the type so
   the marquee keeps glowing) fades to 0.65 and the spotlight *narrows*
   onto the card via a new `--spot-r` custom property (46%→33%).
3. **The raise** (0.7–0.92) — the type exits in reading order
   (corp → crest → credits → marquee last), then the drape rises
   (clip-path + a slightly faster fabric translate for tension); the
   motes die with the lamp, the dim lifts, the spotlight widens (54%),
   the stage pool blooms, and the frame fades last.

Consequences and traps hit along the way:

- **Scrub 0.55, not the house 1.1** — under Lenis, one lag is cinematic
  and two is mush. The house `scrub: 1.1` convention was written for
  native scroll; a Lenis page should scrub tighter. Deviation documented
  here and in the Theater header.
- **Snap by hand, not ScrollTrigger's `snap`** — the built-in snap tweens
  `scrollTop`, which Lenis's ticker overwrites every frame; the engines
  fight. The raise instead snaps on a 200 ms idle debounce through
  `lenis.scrollTo` (Lenis's own target, so they agree), to the nearer of
  the two rest states (LIGHTS_DOWN / RAISE_END) when progress is caught
  between them. `?no-snap` opts out for QA sampling.
- **CSS keyframes beat GSAP inline styles** — the halo's opacity is owned
  by its CSS breathe animation, so GSAP's halo fade was a dead write
  (removed); the motes' opacity likewise, so the raise kills them via the
  `--o` var the keyframes read — on each mote **span**, not the container
  (the spans' inline `--o` override the container's). Two dead writes,
  both caught in screenshot QA.
- **Blend isolation**: an ancestor with `opacity < 1` isolates its
  descendants' `mix-blend-mode: screen` — the ignition flicker is its own
  overlay (keyed off the same `--spot-x/--spot-y`), not a wrapper around
  the halo.
- **clearProps vs React-owned inline styles**: the teardown's
  `clearProps: "all"` strips styles React set too, and React won't
  rewrite an unchanged style prop on re-render — so (a) the stage pool's
  gradient moved from inline style to a `.theater-stage-pool` class, and
  (b) the dim/ignition overlays' hidden rest state (`opacity: 0`) moved
  from inline style into their classes. Under reduced motion the still
  was rendering the dim and ignition fully on until this fix.
- **QA**: `scripts/theater-shots.mjs` samples 8 beats of the pin
  (`?no-snap` so the raw scrub states are captured) plus two frames of
  the ignition flicker; the flicker was verified numerically (opacity
  samples 0 → 0.466 → 0.757 → 0). All 11 Playwright tests stay green.

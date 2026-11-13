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

## Third screening — the seams (plans 0010–0012)

The internal choreography was right; the *transitions* weren't. The
Curator's review, vetted in code:

- **ACT I never played in view.** The arrival fired on `onIntroDone`
  — the moment the loader's exit *begins*, while the visitor was still
  at the Prelude — and worse, the strike was invisible: the curtain
  asset has baked-in lighting, and a screen-blend flicker cannot read
  over an already-bright velvet. Fix (plan 0010): a `.theater-house`
  dark overlay SSR-renders the room near-black (inside the drape, below
  the screen-blend layers so the strike erupts out of black), and the
  arrival now waits for the intro **and** the theater entering view
  (`top 45%`, once) — with a `timeScale(4)` fast-forward if the pin
  engages mid-arrival (never a jump-cut), a 4s failsafe, and a
  `<noscript>` rule. The flicker was re-keyed to one dip + burn-off
  (≤3 flashes/sec). The flash-detection tests now assert the new
  contract: unlit letters at the Prelude, settled after scrolling in.
- **The frame lingered alone** after the drape cleared. Fix (plan 0011):
  the arch dissolves *with* the fabric — `fromTo` with an explicit
  `autoAlpha: 1` start and `immediateRender: false` (no mid-arrival
  capture, no stomp of the arrival's hidden state), `power1.in` so it
  holds a beat, ending exactly at `RAISE_END`. (`FRAME_START` constant
  beside the others.)
- **The outro led nowhere.** Fix (plan 0012): the pin's final stretch
  prints **"ACT II"** above the seam (smoke, not gold; one hairline + a
  seam-pointing tick — the phrase reads as continued), settling
  0.86 → 0.92 so it is fully printed **at the snap's rest state** (the
  snap only ever fires between 0.62 and 0.92 — nothing pulls back from
  beyond the raise). The Archive completes the sentence: the
  carousel's stage rises out of the seam (`y 64 / autoAlpha` scrub,
  `top 88%→48%`, scrub 0.5) on the **wrapper only** — the slot engine
  keeps single-writer ownership of the cards — SSR-hidden via a
  `.deg-stage-enter` class (removed under reduced motion, overridden by
  `<noscript>`), and its settled transform is `clearProps`'d so the
  stage's stacking context returns to normal.
- Trap added to the ledger: stylesheet order beats class-attribute
  order — `.theater-type`'s colour overrode the `text-smoke` utility;
  the intertitle's colour is an inline `var(--color-smoke)`.
- Plans live in `plans/0010-0012`; stills in `screenshots/`.

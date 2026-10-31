# DrishyaKosh — Domain Glossary

Terms of art for the archive. Use these exact words in issues, code names, and
copy; do not drift to synonyms.

## Glossary

> **Terminology change (2026-10-24)** — approved by the Curator: **Reel** now
> means *one specific video* (was: a themed group of videos), and the new word
> for that group is **Category**. Docs written before this date (ADR-0001…0005)
> and legacy code names (`ReelStrip`, `Reel Mark`, "Reel number") still use the
> old sense; read them through that lens until their entries below are updated
> by the Categories cutover. The linear film-roll strip is being replaced by
> Categories + the curved carousel (Hero → carousel → footer; ADR-0008 unwired
> the page-level Category chooser — picks happen from the footer rows);
> entries that describe strip-only behaviour (Film-roll Scroll,
> Intertitle, Layered Parallax trigger, Reel Mark zones) describe current code
> and are retired with the strip at cutover.

**Archive** — the entire site: the collection of Frames organised into
**Categories**, each holding multiple **Reels** (videos). Browsing = pick a
Category (footer rows, ADR-0008) and move through its Reels in the curved
carousel. The archive opens on all Categories ("THE ARCHIVE").
Not a "gallery", not a "feed" — it is handpicked, not algorithmic.

**Category** — a curated thematic grouping of videos ("Design", "Animation",
…). Picking one swaps in that group's Reels in the carousel section above
(picks originate from the footer rows, ADR-0008). Not a "genre tag"
on a ticket and not a playlist — it is the top-level taxonomy of the Archive.

**Curator** — Hardeep Dilip Shetty, the person whose personal taste the archive
expresses. Every Curator's Note is in the curator's voice.

**Curator's Note** — the one-line reason a video was saved. Also rendered as
the **Pull-quote**: the P22 Parrish Roman italic quote block on the right side
of a Frame (below the frame on mobile). One text, two renderings — the data
field is `curatorNote`; do not introduce a separate "quote" concept.

**Frame** — the core unit: one Reel (video) presented as a Ticket (graded
thumbnail, overlapped title, credits row, genre tag, Pull-quote, WATCH ticket
stub). Twelve Frames in the sample archive, spread across the Categories.

**Reel** — one specific video: a single curated video in the Archive. A
Category holds multiple Reels; a Frame renders a Reel as a Ticket. (Before
2026-10-24 "Reel" meant the *group* now called a Category — see the note at
the top of this glossary.) Not a "clip" and not a "post" — the word carries
the film-reel metaphor for a single video.

**Intertitle** — the large typographic card ("REEL 01 — DESIGN") that opens a
Reel, styled after silent-film title cards.

**Catalog Number** — the curator-assigned permanent id of a Frame
(`DK-001`…). Assigned by a human, never derived at runtime; survives
reordering and CMS swaps. Rendered as ticket metadata, never overprinted on
the artwork.

**Duotone Grade** — the desaturated/warm CSS treatment applied to every
thumbnail so the whole archive reads as one film stock. Lifts on hover to
reveal original color. Do not apply per-video filters — one stock, everywhere.

**Carousel** — the curved horizontal row of Tickets that a Category's Reels
render in, winding between the hero wedge and the footer. It does not spin;
it *moves
horizontally*, driven by scrolling (its section maps scroll progress to
sideways travel). Scrolling works everywhere; on touch, where scroll capture
fights the page, round Arrow buttons appear as secondary controls. Clicking a
front (focused) Ticket opens the Watch lightbox. Ported from the Dokmeh-style
reference in `Inspo/` (build pending).

**Film-roll Scroll** — the signature scroll behaviour: velocity-driven
skew (±0.6°) and rotation (±0.25°) of the strip — film pulling through the
gate — easing to rest through power3 curves, then settling one Frame at a
time through the "gate" (settle-snap via Lenis on fine pointers; native CSS
snap on touch where Lenis stands down).

**Ticket** — the MUMO-style paper ticket card a Frame renders as in the
linear strip (desktop wears the designed paper asset with the reel's spine
multiplied over the baked stub; the artwork fills the body panel flush).
Mobile keeps the compact card. `TicketFrame.tsx` is the only renderer.

**Layered Parallax** — inside a Ticket, the type layers slide a few pixels
against the paper as the card drifts past centre: title/credits 26px
counter-direction, quote 10px, poster and controls anchored. Driven by a
rAF window-scroll compute (not ScrollTrigger); p is 0 exactly when a card is
centered, so layers always settle flush against the baked perforations.
Rates are px of card offset (`data-parallax-rate`).

**Reel Mark** — the fixed top-centre reel-sprite chrome (ADR-0005). Purely
decorative: it takes no input, never navigates, and only dresses for the
film — ink over the hero, parked during the hero scrub, bone over the ink
archive, gone past "END OF REEL.". The footer's **FLIP IT OVER** is the page's
only return-to-top control.

**Projector Hold** — the paused state while the Watch lightbox is open: grain
and flicker freeze, scroll locks. The projector has stopped; the film is
being inspected.

**Intro Sequence** — the "threading the projector" animation that runs once per
session before the hero. A beam rises, the wordmark appears at its center,
then the intro slides out to reveal the hero. Click to skip.

**Hero Presentation** — the curator portrait section that introduces the
archive. Contains the wordmark "Drishyakosh", the curator's name, and the
tagline. Scrolls straight into the archive strip (its squeeze-scrub is the
`[data-hero-scrub]` beat the Reel Mark parks through). Preceded by the
**Prelude** (ADR-0007).

**Prelude** — the pre-hero introduction panel (ADR-0007): corner chrome
(site wordmark left, the page's one ARCHIVE shortcut right), a graded
curator portrait dead-centre with collage chrome, the curator's
introduction copy, and the **Threshold** beat. GSAP arrival beats on a
single master timeline; per-element scroll drift hands it off to the hero.

**Threshold** — the Prelude's last beat: "WELCOME TO", which completes into
the red hero's DRISHYA/KOSH wordmark below the fold.

**Sprockets** — *unwired (ADR-0008).* The photographed film strip that ran
down both viewport edges (desktop only, cut from
`public/film-strip@2x.avif`). Removed from the page: the rails, the
`--rail-w` token, and the edge-inset math built on it are gone; content now
runs edge-to-edge. The component file remains in the tree, ready to be
re-wired.

**Light Leak** — a subtle radial gradient that adds warmth to the hero and
intro. Static, not drifting.

**Aperture Cursor** — the custom cursor (center dot + ring) that contracts
over interactive elements. Hidden on fine pointers.

**Grain** — a constant 4% film wash over the whole viewport. Static; there is
no hover reveal (the layer takes no pointer input), and it is off on mobile.

## Style Guide

Visual treatment follows a professional film archive aesthetic:

- **Palette**: warm film-stock charcoal base (`oklch(0.148 0.009 65)`),
  cotton-paper text (`oklch(0.915 0.04 88)`), antique-gold accent
  (`oklch(0.775 0.13 78)`), all defined in oklch in `globals.css`. Four
  saturated category spines (signal red · gold · teal · terracotta rust) at
  one lightness so they read equally vivid; ticket shadows are a cooler
  black than the page so paper floats above the charcoal.
- **Typography**: Unbounded for display (wordmark, intertitles, titles —
  Maghfirea retired, ADR-0010), NeueBrucke for metadata, NB International
  for body, P22 Parrish for pull-quotes, Litterbox for handwriting
- **Transitions**: Subtle, purposeful — siena.film-inspired physics, but never distracting
- **Texture**: Grain (and formerly the sprocket rails, ADR-0008) is present but
  unobtrusive; texture enhances, not competes

See ADR-0004 for the visual direction and ADR-0005 for the current
navigation architecture (decorative mark, linear strip, drum removal).

# DrishyaKosh — Domain Glossary

Terms of art for the archive. Use these exact words in issues, code names, and
copy; do not drift to synonyms.

## Glossary

**Archive** — the entire site: the collection of Frames organised into Reels,
presented as one continuous film reel. Not a "gallery", not a "feed" — it is
handpicked, not algorithmic.

**Curator** — Hardeep Dilip Shetty, the person whose personal taste the archive
expresses. Every Curator's Note is in the curator's voice.

**Curator's Note** — the one-line reason a video was saved. Also rendered as
the **Pull-quote**: the P22 Parrish Roman italic quote block on the right side
of a Frame (below the frame on mobile). One text, two renderings — the data
field is `curatorNote`; do not introduce a separate "quote" concept.

**Frame** — the core unit: one video presented as a film poster (graded
thumbnail, overlapped title, credits row, catalog corner, genre tag,
Pull-quote, WATCH ticket stub). Ten Frames in the sample archive.

**Reel** — a curated group of Frames with a theme ("Reel 01 — Design"). A
Reel opens with an Intertitle card. Not a "category" or "playlist" — the word
carries the film-reel metaphor.

**Intertitle** — the large typographic card ("REEL 01 — DESIGN") that opens a
Reel, styled after silent-film title cards.

**Catalog Number** — the curator-assigned permanent id of a Frame
(`DK-001`…), printed top-left with its Reel number. Assigned by a human, never
derived at runtime; survives reordering and CMS swaps.

**Duotone Grade** — the desaturated/warm CSS treatment applied to every
thumbnail so the whole archive reads as one film stock. Lifts on hover to
reveal original color. Do not apply per-video filters — one stock, everywhere.

**Film-roll Scroll** — the signature scroll behaviour: velocity-driven
skew/rotation of the strip, settling one Frame at a time through the "gate"
(settle-snap on fine pointers, native CSS snap on touch).

**Projector Hold** — the paused state while the Watch lightbox is open: grain
and flicker freeze, scroll locks. The projector has stopped; the film is
being inspected.

**Sprockets** — the small rounded film perforations running down both
viewport edges (desktop only) and along the intro screen.

**Aperture Cursor** — the custom cursor (center dot + ring) that contracts
over interactive elements. Native cursor is hidden on fine pointers.

**Thread / Threading** — loading the film: the intro sequence (beam →
sprockets → wordmark → wipe). Runs once per session; clicking skips it.

# ADR-0009: Emblem Swap — Treasure-Deck Identity, New Favicon Set, New Faces

**Status**: Accepted · **Date**: 2026-10-30 · **Amends**: ADR-0005 (the mark), ADR-0006 §2 (terminology), ADR-0007 §7 (the Prelude's ring sprite)

## Context

The brand's hand-cut identity moved off the curator-portrait emblem
("Vintage Treasure Scout Emblem" — the man, the torch, the chest) to an
object-only emblem: an open treasure chest with a film reel peeking out and
a strip trailing off, ringed by rope. The face left the mark; the torch left
with him. The new art is on-theme by construction — *Kosh* is a treasure
chest, the reel and the strip are the moving pictures — and keeps the
woodcut-on-bone stock the site's ink/bone palette was tuned to.

Two font files also landed as part of the rebrand, ahead of their wiring.

## Decision

1. **Favicon set: full/full.** `public/favicons/` carries the new emblem at
   16→512 plus a multi-size `favicon.ico` (16/32/48) built from the set.
   `layout.tsx` icons and `manifest.ts` point at the folder; the root-level
   legacy favicons and the old `favicon.ico` are deleted.
2. **The site's mark: same alpha-mask trick, new asset.** The nav mark's
   ink silhouette is now `public/mark-treasure.png` — the emblem converted
   to ink-on-transparency and tight-cropped — replacing the retired
   `mark-reel.avif`. The mask mechanism is unchanged; **the glossary term is
   unchanged with it: the surface stays the "Reel Mark" and the `.reel-mark`
   class stays its name**, because the ADR-0006/0007 vocabulary travels with
   the role, not the artwork. The asset filename may say treasure; the word
   on the page still says Reel Mark.
3. **The full portrait emblem is retired, not deleted everywhere.** The
   curator remains in the Prelude copy ("Hardeep Dilip Shetty" and the
   portrait card); only the emblem artwork is retired as a mark. The old
   emblem file need not be kept in the tree.
4. **The Prelude's spinning "Capital letter D" ring sprite is retired.**
   `.prelude-d`, `.prelude-spin`, the `Capital letter D@2x.avif` asset and
   its `prelude-spin` reduced-motion clause are removed from
   `globals.css`/`Prelude.tsx`. A replacement ring sprite in the new
   identity may follow as a separate decision — the Prelude's collage
   (tape strips, 8-point star) stands on its own meanwhile.
5. **New faces adopted, not yet wired.** `public/fonts/GalgoVF.woff` +
   `public/fonts/Unbounded-Variable.woff2` are the next display voices of
   the rebrand and live in the tree ahead of wiring; they are **not** yet
   referenced by any `@font-face` and must not be purged as orphans until
   this ADR is superseded by the wiring commit.

## Consequences

**Positive**
- The identity survives thumbnail scale: a chest, a reel, light rays read
  at 16px where a face never did.
- The archive keeps its one mark, one mechanism, one word.

**Negative**
- The Prelude loses its idle spin until (or unless) the replacement ring
  sprite lands.
- The old D-mark sprite's use is gone (ADR-0007 §7 no longer holds verbatim);
  this ADR is the amendment.

**Neutral**
- Browsers cache favicons aggressively; hard refresh after deploy.

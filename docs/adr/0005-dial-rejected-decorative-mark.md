# ADR-0005: View-Master Dial Rejected — Decorative Reel Mark, Linear-Only Archive

**Status**: Accepted · **Date**: 2026-10-24 · **Supersedes**: the dial portions of the
View-Master dial revamp plan (P1 chrome + dial interaction); **amends** ADR-0002/0003 (Drum removed outright) and ADR-0004 §2/§5 (Drum transition and presentation)

## Context

The approved dial revamp rebuilt the top chrome as a View-Master dial: the fixed
reel mark became a button that opened a rotating reel ring for Reel navigation.
P1 was implemented and live-verified (rotation math, menu semantics, settle
wobble, snap/parallax drivers all worked).

Mid-P2, the user tested the build and reported:

> "the navigation with the help of the logo isnt working, remove that.
> STRIP IT AWAY."

On clarification, the user chose: **make the logo purely decorative** — it shows,
but only the cards/intertitles navigate. The dial (which existed solely to be
opened by the logo) loses its trigger and its reason to exist.

## Decision

1. **The reel mark is chrome, not navigation.** It never takes input
   (`pointer-events: none` always, no button/role, `aria-hidden` inner mark),
   never opens anything, and never navigates. The only return-to-top control on
   the page is the footer's **FLIP IT OVER** button.
2. **The dial is deleted** — component, CSS block, motion tokens
   (`--ease-cine-out/…` curve set, `--dur-dial-*`), and all trigger/slot/backdrop
   wiring. Not gated off; gone.
3. **What the mark keeps**: its zone dressing, driven by a rAF-throttled
   window-`scroll` compute over live rects (same driver scheme as the strip's
   parallax driver — no ScrollTrigger toggles, so nothing can go stale between
   Lenis updates):
   - ink over the red hero (landing)
   - parked (fades/rises away) while the hero scrub fills the viewport
   - bone over the ink archive (`.over-archive`)
   - gone past "END OF REEL." (footer)
   - entrance fade (`.dk-mark-in`), CSS-only; effectively instant under
     reduced motion.
4. **The Drum is removed outright** in the same cutover (P2): component files,
   pin/unpin listeners in the Lenis provider, `DIAL_OFF` gate, drum CSS, and the
   mount sentinel. The archive is the linear strip, full stop.
5. **Zone predicates reflected as plain rect math** (documented so the CSS and
   driver stay in sync):
   - `inFooter = footerTop < vh·0.85`
   - `inArchive = mainTop < 72`
   - `inHeroScrub = heroTop < 24 && heroBottom > vh`
   - between hero-exit and archive-at-mark-row there is a landing band where the
     mark shows ink over ink — matches the previous ScrollTrigger semantics;
     visually it reads as "parked" either way.

## Consequences

**Positive:**
- The fixed top band can no longer intercept clicks (the dial's collapsed band
  used to sit in the hit-test path).
- The archive has exactly one navigation story: scroll, cards, footer return.
  This is the simplicity the user asked for.
- A large surface of bespoke motion code (dial + drum) walked out of the tree.

**Negative:**
- Reel-to-Reel navigation now has no shortcut; the strip must be scrolled.
- The spent P1 dial QA (rotation math, WAAPI settle wobble, individual-property
  `rotate` trick) is reference-only knowledge; don't re-add dial-shaped chrome
  without a new ask.

**Neutral:**
- Watch/projector-hold, Film-roll Scroll, settle-snap, and Layered Parallax are
  untouched and remain the signature motion.
- See ADR-0002/0003 for the drum/rail designs they once described; those are
  historical records now.

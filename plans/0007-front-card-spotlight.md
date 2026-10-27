# Front-Card Spotlight — the centered ticket reads wide and proud

**Status**: Approved (Terminal round with the Curator, 2026-10-24) —
Option **B (Spotlight)**, arrival law **both** (sharper focus curve + stage
light), mobile **left as is** (§3(i); no spacing change on ≤767px).
**As built**: the approved size re-rounded — the size approved later in the
same round — to **Option D (HUGE)**: `--deck-card-w: min(58vw, 76svh)`,
focal spacing **0.54** desktop (mobile keeps 0.69), focus halves derived
from the one width token (`0.625·w` / `0.21862·w`), and the deck ticket
recomposed in **container-query units (cqw)** under `[data-deck-paper]` —
stub type, quote, meta grid and WATCH all scale with the card so nothing
can spill at any deck size. The overlapped video title (desktop paper +
mobile ticket) is removed on the Curator's call — the stage's kinetic
title is the only title. The artwork's catalog plate (`DK-001 · CATEGORY 01`)
is likewise retired (2026-10-27): the spine already names the Category, and
the number stays in the ticket's metadata.
**Supersedes**: nothing; **amends** ADR-0006 §1 (card-box constants only — the
engine law, scroll driver, and control decisions stay untouched).
**Motive**: with the deck live and a +25% `FOCUS_SCALE` in, the front ticket
still reads 28% of the stage width — related, not hero. The center card should
own the room: wide, close to full-bleed on mobile, and lit.

---

## 1. Master decision (Flagged — pick A, B, or C)

One knob drives everything: the **base card box** in `.deg-slot` — today
`min(25.16vw, 35.8svh)`. The paper ticket's aspect is 2.86:1
(`aspect-[3182/1113]`), so `width = min(vw-term, svh-term)` and every derived
anchor (titles, spacing) is re-derived from it. Three targets at 1440×900:

| Option | Base box | Front card w × (F=1.25) | Front = % stageW | Neighbour spacing | Read |
| --- | --- | --- | --- | --- | --- |
| **A Modest** | `min(34vw, 46svh)` → 414px | 517 × 181 | 36% | 0.315 → **0.36** | "related" → "present" |
| **B Spotlight (recommended)** | `min(38vw, 52svh)` → 468px | 585 × 205 | **41%** | 0.315 → **0.38** | the room is built around it |
| **C Full-bleed pull** | `min(46vw, 62svh)` → 547px | 684 × 239 | 47.5% | 0.315 → **0.44** | neighbours become barely-visible ghosts |

**Recommendation: B.** At C the deck's depth-reading dies (neighbour cards
slide almost fully behind the front), and the 3D curve — the thing that makes
this carousel worth porting — flattens into a "one card per screen" pager, which
is not the design. B keeps three shelves of cards readable behind the focus.

**Derived values to re-derive in one place (CSS custom properties, not magic
numbers):** `--deck-card-w` (the base box), `--deck-card-half-h` =
`card-w × 0.17498` (paper aspect), used by `.deg-titles` (top anchor) and the
mobile block — replacing the inspo's poster-proportion constants
(`min(12.58vw, 17.9svh)`, `min(9.435vw, 13.425svh)`) that no longer describe our
ticket's shape.

Clearance audit at B (stage 1440×900; heading top 10.2% + ~110px display block
ends ≈ y=202; front card top edge = 49%·900 − 205/2 ≈ **y=338**; titles land
≈ y=441+114; notes bottom 8%; controls bottom 6%): no collisions; title column
gets pushed down by the re-derived half-height constant accordingly.

## 2. Arrival law — "the card lands" (Flagged — include or skip)

The focus boost currently fades over a full depth of travel, so a card is
mid-grown as it arrives. Spotlight behaviour sharpens the beat:

- **2a. Sharper focus curve**: boost falloff `max(0, 1 − d)` → `max(0, 1 − d/0.65)`.
  The card reaches full size by ~65% of the way in — an arrival, not a gradient.
  Same one-line change class as the existing FOCUS_SCALE; keeps continuity at d=0.
- **2b. Stage light on the focus card** (recommended adjunct): interpolate a
  slot-level shadow/glow with the same factor — a warm amber rim
  (`0 30px 80px -20px rgba(201,162,106,0.35)` mixed with the existing black
  drop) plus a hair lighter paper (`filter: brightness(1.06)`) that eases off
  as the card recedes. Purely driven from `updateTransforms` (slot inline
  styles, like z-index today) — no hover-state machine, works with scroll and
  keyboard alike, and holds the static single-frame state under reduced motion.

## 3. Mobile (Flagged — touch the ticket or leave it)

Desktop gets the rework; on ≤767px the compact ticket is a vertical stack.
Options: (i) leave mobile as is; (ii) **near-full-bleed focus** — base
`min(66vw, 38svh)` → front ≈ **82vw** with neighbour spacing 0.69 → 0.78, so the
front ticket nearly fills the pocket and neighbours peek as thin spines.
Recommended (ii): on a phone, "widely and proudly" *is* near-bleed; the svh cap
(38svh) keeps the stack's note section co-planar with the deck chrome.

## 4. Implementation steps

1. **CSS — single source of truth** (`categoryCarousel.css`): define
   `--deck-card-w`, `--deck-card-half-h` tokens on `.deg-section`; `.deg-slot`
   wears `width: var(--deck-card-w)`; re-derive `.deg-titles` top/left,
   `.deg-controls` left, mobile media block from the tokens (delete the stale
   inspo poster constants). Title clamp up one notch:
   `clamp(18px, 1.875vw, 36px)` → `clamp(20px, 2.4vw, 46px)`.
2. **Engine — ReelCarousel.tsx**: adopt `DECK_GEOMETRY` (spacing fractions
   0.36/0.38 or per option), sharpen/keep the focus curve (§2a), and if §2b
   approved, interpolate slot `boxShadow`/`filter` with the focus factor in the
   same per-slot loop (string interpolation is the existing per-slot style
   path; no new effect, no render thrash — all in `updateTransforms`).
3. **TicketFrame** — no changes: the deck variant already spans its slot
   (`w-full max-w-none`); shadows ride the existing baked treatment. The §2b
   glow hangs on the *slot*, not the ticket, so strip flow is untouched.
4. **P5 additions** (QA): extend the matrix with "front card width ≥ target %
   of stageW at rest", "neighbour reveal readable at depth 1", "no clip under
   heading at 1440/1024/768/390", "glow present at focus (also under reduced
   motion — it is a lighting state, not motion: the static frame renders the
   focused state)".

## 5. Definition of done

- Front card at rest ≥ the chosen target's % of stageW at 1440 and 1024, and ≥
  ~78–82vw on mobile if §3(ii).
- Deck depth still reads: neighbour spines visible left/right at depth 1–2.
- Kinetic title columns sit flush under the bigger paper (re-derived anchors).
- Build + lint + the (now-green) hero suite stay green; deck measure script
  snapshot updated in the run log.
- Curator confirms the feel in the browser at 1440×900 and 390×844.

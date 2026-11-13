# 0010 — The house goes dark: the arrival must play in view, out of black

- **Status**: TODO
- **Commit**: 41e8b32
- **Severity**: HIGH
- **Category**: Purpose & frequency + Physicality & origin (audit cats 1, 3)
- **Estimated scope**: 2 files, 1 new CSS class + ~25 lines in Theater.tsx
- **Revision 2** (post Curator review): gate moved to `top 45%`; arrival
  fast-forwards if the pin engages mid-arrival; 4s failsafe + no-JS rule;
  flicker capped ≤3 flashes/sec; cross-plan drift rule added.

## Problem

**Part 1 — ACT I never plays in view.**

The arrival timeline (lamp strike → spotlight bloom → marquee letters →
credits, ~3s) is gated only on the intro overlay:

```tsx
/* src/components/Theater.tsx:208 — current */
const cancelIntroGate = onIntroDone(() => arrive.play());
```

`onIntroDone` fires the moment the LoadingScreen's *exit begins*
(`src/components/LoadingScreen.tsx:58` dispatches `dk:intro:done` as its
exit starts) — while the visitor is still looking at the Prelude, a full
viewport away from the theater. On session replays the overlay never
runs, so it fires at hydration. Either way the arrival completes
off-screen: scrolling from the Prelude into the theater, the card is
already fully assembled, already pinned, already lit. The act never
plays.

**Part 2 — the strike has no darkness to strike out of.**

The pre-arrival state hides the spot, ignition, halo, swag, frame and
type (all `opacity: 0` inline in the JSX), but the curtain image itself
(`public/HeroSection/opt/curtain-desktop.avif`) has baked-in stage
lighting and renders fully bright from the first paint. The ignition
flicker is `mix-blend-mode: screen` (`src/app/globals.css` —
`.theater-ignition`), so it can only *add* light over an already-bright
velvet — it reads as nothing. A projector strike is only visible when
the room is dark.

## Target

1. **A dark-house overlay** that SSR-renders the theater near-black and
   the arrival lifts as the lamp strikes.
2. **A double gate** — the arrival plays only when *both* the intro is
   done *and* the theater has entered the viewport — plus a fast-forward
   if the visitor is already pinned, a failsafe timer, and a no-JS rule.

### 1. The dark house

New element inside the drape, ordered between the curtain image and the
spot so the strike blooms *through* the dark (screen-blend children of
the drape must sit above it), and so it clips away with the raise (it is
opacity 0 long before the raise):

```tsx
/* target — src/components/Theater.tsx, inside the drape (ref drapeRef),
   immediately after the .theater-breathe img block and BEFORE the
   data-theater-spot div */
{/* the dark house — SSR-renders the room near-black (ADR-0011: hidden
    states in SSR markup); the arrival lifts it as the lamp strikes.
    Inside the drape so the strike's screen-blend sits above it and the
    raise clips it away with the fabric (it rests at opacity 0). */}
<div ref={houseRef} className="theater-house" style={staticCard ? undefined : { opacity: 0.88 }} />
```

New ref alongside the others:

```tsx
/* target — src/components/Theater.tsx, with the other refs (~line 86) */
const houseRef = useRef<HTMLDivElement>(null);
```

New CSS class (follows the `.theater-dim` ownership rule — the class owns
the hidden rest state, because GSAP's `clearProps` strips inline styles
and React won't rewrite an unchanged style prop; see ADR-0014 "second
screening"):

```css
/* target — src/app/globals.css, next to .theater-ignition */
/* the dark house — the unlit room the visitor scrolls into. Solid ink,
   inside the drape so the lamp's screen-blend layers sit above it. The
   class owns the lit rest state (opacity 0); the SSR inline 0.88 is the
   dark state the arrival lifts. */
.theater-house {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background: oklch(0.09 0.012 55 / 1);
}
```

Note `background` shorthand is fine here (solid color, no oklch
gradient — the Lightning CSS hoisting trap only bites gradient
shorthands; see ADR-0014).

No-JS failsafe — GSAP never runs, so the dark house would never lift.
Inside the section's root JSX:

```tsx
{/* target — src/components/Theater.tsx, inside the section root */}
<noscript>
  <style>{`.theater-house{opacity:0 !important}`}</style>
</noscript>
```

The arrival gains one tween, placed right after the ignition keyframes
block — the strike fires *while the room is still dark*, then the dark
lifts as the spotlight blooms:

```tsx
/* target — src/components/Theater.tsx, in the arrive timeline, after the
   ignition .to(ignition, { keyframes: ... }) block */
.fromTo(
  house,
  // the house was dark; the strike brings the light up. Runs under the
  // flicker so the flashes erupt out of black.
  { opacity: 0.88 },
  { opacity: 0, duration: 1.6, ease: "power2.inOut" },
  0.2
)
```

Grab `house` with the other elements at the top of the effect, add it to
the null-guard condition, and add `house` to the teardown `clearProps`
array.

### 2. The triple-gated arrival (view + intro + pin fast-forward)

Replace the single intro gate:

```tsx
/* src/components/Theater.tsx:208 — current */
const cancelIntroGate = onIntroDone(() => arrive.play());
```

with:

```tsx
/* target */
/* ACT I plays in view: the intro must be done AND the theater in view
   (once). Either can open first; the arrival fires when the second
   does. */
let inView = false;
let introOver = introDone();
const maybePlay = () => {
  if (inView && introOver) arrive.play();
};
const cancelIntroGate = onIntroDone(() => {
  introOver = true;
  maybePlay();
});
// failsafe: if the intro never reports done (a stuck overlay, slow JS),
// the house must not stay dark — light it ~4s after entering view
let failsafe: ReturnType<typeof setTimeout> | undefined;
const arrivalGate = ScrollTrigger.create({
  trigger: root,
  start: "top 45%", // most of the theater on screen when the show starts
  once: true,
  onEnter: () => {
    inView = true;
    maybePlay();
    failsafe = setTimeout(() => {
      introOver = true;
      maybePlay();
    }, 4000);
  },
});
// the arrival and the scrub can now overlap: if the pin engages while
// the arrival is still playing, fast-forward it — do NOT jump it to the
// end, a cut to the finished card would pop
const pinGate = ScrollTrigger.create({
  trigger: root,
  start: "top top",
  once: true,
  onEnter: () => {
    if (arrive.progress() < 1) arrive.timeScale(4);
  },
});
```

`introDone` is already exported from `@/lib/introGate` — extend the
import at line 7:

```tsx
/* target — src/components/Theater.tsx:7 */
import { introDone, onIntroDone } from "@/lib/introGate";
```

Cleanup additions: `arrivalGate.kill()`, `pinGate.kill()`,
`clearTimeout(failsafe)`.

Behaviour notes:

- If the visitor is already past `start` when a ScrollTrigger is created
  (deep-link, restored scroll), it fires `onEnter` on its initial
  refresh — correct in both cases.
- The fast-forward keeps the scrub safe: the pin's scrub tweens that
  read arrival-owned properties are given explicit start values
  (see plans/0011 for the frame — the only such overlap).
- The pin and the three-act scrub are untouched otherwise.
- The motes' CSS keyframes own their opacity (ADR-0014), so faint motes
  drift over the dark house before the strike. Acceptable — dust in a
  dark theater; do not fix here.

### 3. The flicker, capped at the flashing limit

The strike becomes far more visible against black, so its keyframes must
respect the ≤3 flashes/second accessibility limit. The current six
keyframes (two full bright/dip cycles in ~0.5s ≈ 4 flashes/sec) are
over. Replace the keyframes array with a single dip + burn-off
(~2 flashes/sec):

```tsx
/* target — src/components/Theater.tsx, replacing the ignition keyframes */
{
  keyframes: [
    { opacity: 0.9, duration: 0.18 },
    { opacity: 0.12, duration: 0.15 },
    { opacity: 0.85, duration: 0.2 },
    { opacity: 0, duration: 0.55, ease: "power2.in" },
  ],
},
```

(The surrounding `.to(ignition, ..., 0.05)` call is unchanged.)

## Repo conventions to follow

- Hidden states in SSR markup, no post-hydration hiding — ADR-0011.
- `clearProps` vs React-owned inline styles — `.theater-dim` /
  `.theater-ignition` in `globals.css` are the exemplars of "class owns
  the rest state".
- Single-writer rule: the arrival owns the house overlay's opacity; no
  CSS animation may target `.theater-house`.
- Screen-blend isolation: never wrap `.theater-ignition` /
  `.theater-spot` in an element with `opacity < 1`. The house overlay is
  a *sibling beneath them*, not a wrapper.

## Steps

1. `src/app/globals.css` — add the `.theater-house` class.
2. `src/components/Theater.tsx` — add `houseRef`; render the overlay
   inside the drape between the curtain image and the spot, plus the
   `<noscript>` rule in the section root; grab `house` in the effect and
   add it to the null-guard and the teardown `clearProps` array.
3. `src/components/Theater.tsx` — add the `.fromTo(house, ...)` tween at
   position 0.2; replace the ignition keyframes with the capped set.
4. `src/components/Theater.tsx` — extend the introGate import with
   `introDone`; replace the line-208 gate with the triple gate (view +
   intro + failsafe + pin fast-forward); add the cleanup kills.
5. `npx tsc --noEmit` must pass.
6. **Run `npx playwright test` now, before the other plans** — the
   flash-detection tests were written when the arrival played at load;
   if a theater test expects the settled card at first paint, scroll the
   theater into view first in that test (or assert the dark state) and
   report what changed.

## Boundaries

- Do NOT touch the three-act rise timeline, the snap logic, or the pin
  length (250svh is settled, ADR-0014).
- Do NOT touch the Prelude, the LoadingScreen, or `introGate.ts`.
- Do NOT change the spotlight/halo CSS.
- Under `staticCard` the JSX renders the overlay without inline opacity,
  so the class default (0, lit room) shows the finished card — verify in
  the feel check; no extra reduced-motion code needed.
- **Cross-plan drift rule**: later plans (0011, 0012) cite this file —
  after executing this plan they must match by code *content*, not line
  numbers.
- If code content doesn't match this plan's cites, STOP and report.

## Verification

- **Mechanical**: `npx tsc --noEmit` clean; `pnpm build` clean;
  `npx playwright test` — all 11 pass (see step 6).
- **Feel check** (dev server + browse extension live, or
  `node scripts/theater-shots.mjs`):
  - Scroll slowly from the Prelude: the theater enters as **near-black
    velvet** — dark but clearly velvet, not a broken page. Tune the
    0.88 start by eye if needed.
  - The strike reads unmistakably out of black; count the flashes — at
    most 3 per second.
  - The dark lifts as the spotlight blooms; the whole arrival happens
    on screen.
  - Flick the page down fast so the pin catches early: the arrival
    speeds up (never a visible jump-cut).
  - Block the intro event (or just wait): ~4s after entering view the
    house lights regardless.
  - Disable JS: the house overlay is lifted by the noscript rule.
  - Scroll back up and down: no replay (once-gates).
  - Emulate `prefers-reduced-motion`: finished card, fully lit.
  - Numeric: `.theater-house` ~0.88 pre-strike → 0 post-arrival.
- **Done when**: scrolling in from the Prelude, the visitor sees a dark
  house, a strike that reads, and the card printing — all on screen.

# 005 — Footer reveal on scroll ("END OF REEL" deserves one)

- **Status**: TODO
- **Commit**: 4740f20
- **Severity**: LOW
- **Category**: Missed opportunity (audit cat 8)
- **Estimated scope**: 1 file, ~20 lines (Footer.tsx)

## Problem

After ~10,000px of carefully eased film-roll journey, the footer — the
emotional punchline ("END OF REEL. FLIP IT OVER →") — is already sitting
there fully visible when it scrolls into view. Every frame and intertitle
above it rises into place; the ending just… exists. It is the one high-value
reveal moment the reel forgot.

Current code (`src/components/Footer.tsx`): a plain server component with no
motion (uses `useLenisInstance` for the flip, so it is already a client
component).

## Target

A one-time fade-up on scroll into view, exactly following the Frame reveal
pattern already in the codebase (`src/components/Frame.tsx:39`):

```tsx
useEffect(() => {
  const el = ref.current;
  if (!el) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const tween = gsap.fromTo(
    el,
    { y: 60 },
    {
      y: 0,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
    }
  );
  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}, []);
```

with `ref={ref}` on the root `<footer>`, `import { useEffect, useRef } from
"react"` and `import gsap from "gsap"` added. Distance 60px matches the
Frame reveal for cohesion (same rise-in vocabulary), `once: true` means it
never replays, and the reduced-motion guard matches every other component.

Fade as well as rise: add `opacity: 0` to the from-state and `opacity: 1`
(implied) in the to-state inside the same tween:

```tsx
gsap.fromTo(
  el,
  { y: 60, opacity: 0 },
  { y: 0, opacity: 1, ease: "power2.out", duration: 0.8,
    scrollTrigger: { trigger: el, start: "top 92%", once: true } }
)
```

(Duration needed once opacity is in the tween — GSAP defaults to 0.5s
otherwise; 0.8s keeps it in family with the hero reveal.)

## Repo conventions to follow

- One-component-one-effect GSAP pattern with cleanup, exemplar:
  `src/components/Frame.tsx:30-55` (guard → fromTo → scrollTrigger →
  cleanup on unmount).
- Reduced-motion guard via `window.matchMedia` at effect top — the repo does
  not use the `useReducedMotion` hook in effects that also gate
  ScrollTriggers; match the exemplar.

## Steps

1. Add the imports and `useRef` to Footer.tsx.
2. Attach `ref` to the root `<footer>` element.
3. Add the effect above.
4. No CSS changes.

## Boundaries

- Do NOT add parallax or scrub to the footer (a once-only reveal, not a
  scroll-linked effect — FLIP IT OVER must sit still to be clickable).
- Do NOT touch the flip-to-top logic.
- Do NOT make the reveal replayable.

## Verification

- **Mechanical**: `pnpm lint`, `pnpm build` clean.
- **Feel check**: `pnpm dev`, scroll to the bottom:
  - the footer rises ~60px and fades in once, settling before FLIP IT OVER
    is within comfortable reach; it never re-animates on scroll-up/down.
  - click FLIP IT OVER immediately after it settles — scroll-to-top still
    works (the drift-fix regression test).
  - emulate reduced-motion: footer simply appears, no rise.
- **Done when**: the ending reveals like the rest of the reel, exactly once.

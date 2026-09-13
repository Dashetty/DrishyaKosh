# Animation improvement plans — DrishyaKosh

Audit of the film-reel archive's motion at commit `4740f20`, per the
`improve-animations` skill. Ambient film effects (grain `steps()`, flicker,
1.2s loader, 0.55s duotone grade-lift, 0.65s frame settle) are spec-mandated
and exempt from UI-speed rules; interactive controls are not.

## Plans

| # | Title | Severity | Status |
|---|-------|----------|--------|
| 003 | Easing tokens + consolidate hand-typed curves | MEDIUM | TODO |
| 001 | Watch lightbox open/close animation | HIGH | TODO |
| 002 | Press feedback on all pressables | MEDIUM | TODO |
| 004 | Mobile curator's-note reveal transition | LOW | TODO |
| 005 | Footer reveal on scroll | LOW | TODO |

## Recommended execution order

1. **003 first** — it defines `--ease-out`/`--ease-in-out`, which 001, 002
   and 004 reference. (They inline the bezier if run standalone, so this is
   a convenience ordering, not a hard dependency.)
2. **001** — highest leverage: the primary action's teleport in/out.
3. **002** — tactile press; independent.
4. **004**, **005** — polish, independent, any order.

## Dependencies

- 003 → soft dependency of 001, 002, 004 (token availability only).
- All others independent of each other.

## Verification after any plan

`pnpm lint` + `pnpm build` clean; feel-check per each plan's Verification
section in the running dev server; reduced-motion emulation pass.

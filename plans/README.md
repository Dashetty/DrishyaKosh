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
| 002 | Press feedback harmonization on all pressables *(revised at `4e3fdba` — introduction already landed per-component; remaining work is depth/duration/curve alignment)* | MEDIUM | **DONE** |
| 004 | Mobile curator's-note reveal transition | LOW | TODO |
| 005 | Footer reveal on scroll | LOW | TODO |
| 006 | Hero word-lines: transform-only scroll compression | HIGH | TODO |
| 009 | ARCHIVE pill: faster, ease-out press | MEDIUM | **DONE** |

*(009's pill lines sit in the uncommitted Prelude/hero/words-stagger WIP —
the edit is on the working tree and commits with that work.)*

## Recommended execution order

1. **003 first** — it defines `--ease-out`/`--ease-in-out`, which 001, 002,
   009 and 004 reference. (They inline the bezier if run standalone, so this
   is a convenience ordering, not a hard dependency.)
2. **009** — the primary action's press feel; lands the 0.97 / 180ms /
   house-ease-out pair that 002 then harmonizes everywhere.
3. **002** — spread 009's press pair across WATCH / CLOSE / FLIP IT OVER /
   loader SKIP.
4. **001** — highest remaining leverage: the watch dialog's open/exit.
5. **004**, **005** — polish, independent, any order.
6. **006** — hero scrub refactor; independent of all others, target code
   written at the post-"breathe" hero state (see its Commit stamp). Run it
   after any future hero work has landed, so its cites don't drift.

## Dependencies

- 003 → soft dependency of 001, 002, 009, 004 (token availability only).
- 009 → soft dependency of 002 (002 verifies the pill already matches; run
  009 first, or edit 002's step 5 note accordingly).
- 006 → no dependency on other plans; **code dependency on the uncommitted
  "breathe + poster-stretch" hero state** (stamp `5377e5f`). Land/rebase the
  hero first or the plan's STOP-guard will trip.
- All others independent of each other.

## Verification after any plan

`pnpm lint` + `pnpm build` clean; feel-check per each plan's Verification
section in the running dev server; reduced-motion emulation pass.

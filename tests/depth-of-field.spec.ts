import { test, expect, type Page } from "@playwright/test";
/**
 * Depth-of-field deck tests — for the ReelCarousel's receding-card defocus:
 *
 * - Desktop rest: the front slot always stays crisp (filter none), its
 *   neighbours defocus with saturate fog paired to the blur.
 * - Hysteresis: the bucket cache holds its bucket at a settled deck, so the
 *   filter never flip-flops while the stage is pinned and idle.
 * - Mobile: blur is skipped entirely (the ink-dark ticket gives the blur
 *   nothing visible to recede, and mobile already dims via opacity).
 * - Edge frost: the static progressive-blur side bands are painted only on
 *   desktop (backdrop-filter present, masked); on mobile they're display:none.
 */

/** anchor the deck so the settled position is fraction e of the max Reel e */
const anchorDeck = (page: Page, fraction: number) =>
  page.evaluate((f) => {
    const sec = document.querySelector("#section-carousel") as HTMLElement;
    const top = window.scrollY + sec.getBoundingClientRect().top;
    const scrollable = sec.scrollHeight - window.innerHeight;
    window.scrollTo(0, top + f * scrollable);
  }, fraction);

const slotFilters = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".deg-slot")].map(
      (s) => (s as HTMLElement).style.filter || "-",
    ),
  );

/** wait (poll) until the deck's paint output is stable across two
    consecutive 600ms windows — the proximity-ease can micro-drift past the
    first quiet span, so one equal check isn't enough */
const awaitStableDeck = async (page: Page) => {
  await expect
    .poll(async () => {
      const a = JSON.stringify(await slotFilters(page));
      await page.waitForTimeout(600);
      const b = JSON.stringify(await slotFilters(page));
      await page.waitForTimeout(600);
      const c = JSON.stringify(await slotFilters(page));
      return a === b && b === c;
    }, { timeout: 14_000, intervals: [400] })
    .toBe(true);
};

test.describe("Depth-of-field deck", () => {
  test("desktop rest: front crisp, neighbours defocused with fog", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // e = 0.03 → deck settles on Reel 0 (front slot crisp, neighbours below).
    // Asserted by polling (not one-shot): slow settles must still converge to
    // the exact bucket + fog pairings quantised at rest depths (d=1 → 6px,
    // fog 0.923; d≥2 → 14px, fog 0.82), never approximations of them.
    await anchorDeck(page, 0.03);
    await expect
      .poll(async () => {
        const filters = await slotFilters(page);
        return [
          filters.some((f) => f === "none"),
          filters.some((f) => f === "blur(6px) saturate(0.923)"),
          filters.some((f) => f === "blur(14px) saturate(0.82)"),
        ].join(",");
      }, { timeout: 14_000, intervals: [400] })
      .toBe("true,true,true");
  });

  test("hysteresis: settled buckets never flip-flop", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await anchorDeck(page, 0.03);
    await awaitStableDeck(page);

    // stable at rest means stable at rest, and stable means the held bucket
    // doesn't move: two further samples 800ms apart must still be identical
    const second = await slotFilters(page);
    await page.waitForTimeout(800);
    const third = await slotFilters(page);
    expect(third).toEqual(second);
  });

  test("mobile: no blur, no frost", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await anchorDeck(page, 0.03);
    await awaitStableDeck(page);

    const filters = await slotFilters(page);
    for (const f of filters) {
      expect(f === "none" || f === "-" || f === "").toBe(true);
    }

    // frost bands are display:none on the mobile stage
    const frostHidden = await page.evaluate(() => {
      const el = document.querySelector(".deg-frost-l") as HTMLElement | null;
      if (!el) return false;
      return getComputedStyle(el).display === "none";
    });
    expect(frostHidden).toBe(true);
  });

  test("desktop: frost bands are painted", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const frost = await page.evaluate(() => {
      const el = document.querySelector(".deg-frost-l") as HTMLElement | null;
      if (!el) return { present: false, filter: "", mask: "" };
      return {
        present: true,
        filter: getComputedStyle(el).backdropFilter,
        mask: getComputedStyle(el).maskImage,
      };
    });
    expect(frost.present).toBe(true);
    expect(frost.filter).toContain("blur");
    expect(frost.mask).toContain("linear-gradient");
  });
});

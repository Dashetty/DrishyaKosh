import { test, expect, type Page } from "@playwright/test";

/**
 * Watch lightbox scroll lock.
 *
 * With Lenis running, `lenis.stop()` freezes the page; the lightbox adds
 * `html.projector-hold` so the CSS film treatments pause too. Reduced motion
 * runs native scroll — SmoothScroll never constructs Lenis — so `lenis.stop()`
 * is a no-op there and the dialog must lock the document itself. Without the
 * native lock the wheel scrolls the deck behind the lightbox.
 */

const scrollToDeck = async (page: Page) => {
  await page.evaluate(() => {
    const section = document.getElementById("section-carousel");
    if (!section) throw new Error("archive stage missing");
    const top = window.scrollY + section.getBoundingClientRect().top;
    const scrollable = section.scrollHeight - window.innerHeight;
    window.scrollTo(0, top + 0.03 * scrollable);
  });
  await page.waitForTimeout(1600);
};

const openFrontReel = async (page: Page) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600); // reduced motion finishes the intro on mount
  await scrollToDeck(page);
  await page.locator('.deg-slot button[aria-label^="Watch"]').first().click();
  await expect(page.locator("dialog[open]")).toBeVisible();
};

const scrollY = (page: Page) => page.evaluate(() => window.scrollY);
const hasClass = (page: Page, name: string) =>
  page.evaluate((c) => document.documentElement.classList.contains(c), name);

test.describe("Watch lightbox scroll lock", () => {
  test.describe("reduced motion (native scroll)", () => {
    test.use({ reducedMotion: "reduce" });

    test("wheel cannot scroll the page behind the lightbox", async ({ page }) => {
      await openFrontReel(page);
      const before = await scrollY(page);

      await page.mouse.move(720, 450);
      await page.mouse.wheel(0, 1600);
      await page.waitForTimeout(400);

      expect(await scrollY(page)).toBe(before);
      // the document-level fallback is the no-Lenis path only
      expect(await hasClass(page, "projector-hold-native")).toBe(true);
      // ...and it really puts the document in a non-scrollable state while
      // reserving the scrollbar gutter (no sideways stage shift on close)
      expect(
        await page.evaluate(() => {
          const style = getComputedStyle(document.documentElement);
          return { overflow: style.overflow, gutter: style.scrollbarGutter };
        }),
      ).toEqual({ overflow: "hidden", gutter: "stable" });
    });

    test("closing restores native scrolling", async ({ page }) => {
      await openFrontReel(page);
      await page.keyboard.press("Escape");
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      expect(await hasClass(page, "projector-hold-native")).toBe(false);
      expect(
        await page.evaluate(
          () => getComputedStyle(document.documentElement).overflow,
        ),
      ).not.toBe("hidden");

      const before = await scrollY(page);
      await page.mouse.move(720, 450);
      await page.mouse.wheel(0, 1200);
      await page.waitForTimeout(400);
      expect(await scrollY(page)).not.toBe(before);
    });
  });

  test("Lenis keeps owning the lock", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000); // intro overlay exit

    await scrollToDeck(page);
    await page.locator('.deg-slot button[aria-label^="Watch"]').first().click();
    await expect(page.locator("dialog[open]")).toBeVisible();

    expect(await hasClass(page, "projector-hold")).toBe(true);
    expect(await hasClass(page, "projector-hold-native")).toBe(false);
  });
});

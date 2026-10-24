import { test, expect, type Page } from '@playwright/test';

/**
 * Hero Animation Capture Tests — against the pinned-scrub hero (rebuilt
 * c795d3b; the [data-hero-reveal].hero-* entrance markup is retired).
 *
 * Current stages: projector intro → sticky hero at poster state (DRISHYA
 * stretched, KOSH at 0svh, tagline held) → scroll scrub opens KOSH and
 * squeezes DRISHYA → tagline + wedge reveal at the end of the range.
 */

/** line wrappers: [0] DRISHYA, [1] KOSH — with their GSAP-driven heights */
const lines = (page: Page) =>
  page.evaluate(() => {
    const texts = document.querySelectorAll('[data-hero-scrub] svg text');
    return Array.from(texts).map((t) => ({
      text: t.textContent,
      height: (t.parentElement as Element)?.getBoundingClientRect().height ?? -1,
    }));
  });

/** the hero's tagline overlay opacity (0 until the end of the scrub) */
const taglineOpacity = (page: Page) =>
  page.evaluate(() => {
    const el = document.querySelector(
      '[data-hero-scrub] .pointer-events-none.inset-0',
    ) as Element | null;
    return el ? parseFloat(getComputedStyle(el).opacity) : -1;
  });

test.describe('Hero Animation Capture Tests', () => {
  test('Capture intro and hero states', async ({ page }) => {
    // Fresh visit
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Stage 1: Initial Load (projector intro running)
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/01-initial-load.png', fullPage: false });
    console.log('Stage 1: Initial load - LoadingScreen visible');

    // Stage 2: After Intro Beam Animation (wordmark appears, beam rises)
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshots/02-beam-animated.png', fullPage: false });
    console.log('Stage 2: Beam animated, wordmark appears');

    // Stage 3: After Intro Complete (clip-path animation pushes LoadingScreen away)
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/03-after-intro.png', fullPage: false });
    console.log('Stage 3: Intro complete, clip-path hides LoadingScreen');

    // Stage 4: Hero settled at poster state (scroll untouched)
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/04-hero-poster-state.png', fullPage: false });
    console.log('Stage 4: Hero at poster state');

    // Verify intro-pending is gone
    const hasIntroPending = await page.evaluate(() => {
      return document.documentElement.classList.contains('intro-pending');
    });
    console.log('Intro pending class present:', hasIntroPending);
    expect(hasIntroPending).toBe(false);

    // Verify the pinned hero's word-lines
    const heroLines = await lines(page);
    console.log('Word-lines:', heroLines);
    expect(heroLines[0]?.text).toBe('DRISHYA');
    expect(heroLines[0]?.height ?? 0).toBeGreaterThan(100);
    expect(heroLines[1]?.text).toBe('KOSH');
    expect(heroLines[1]?.height ?? -1).toBeLessThan(4);
    console.log('Tagline held at poster state:', await taglineOpacity(page));
  });

  test('Return visitor experience', async ({ page }) => {
    // Simulate returning visitor by setting sessionStorage before page load
    // Since we can't do this directly, we'll reload and observe behavior
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);

    // Now set the sessionStorage and reload
    await page.evaluate(() => {
      sessionStorage.setItem('dk-intro', '1');
    });

    // Reload - should skip intro but show hero
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/09-return-visitor.png', fullPage: false });
    console.log('Screenshot 9: Return visitor (simulated)');

    const hasIntroPending = await page.evaluate(() => {
      return document.documentElement.classList.contains('intro-pending');
    });
    console.log('Intro pending after return visit:', hasIntroPending);
    expect(hasIntroPending).toBe(false);

    await expect(page.locator('[data-hero-scrub] svg text').first()).toBeVisible();
  });

  test('Verify no flash on hero elements', async ({ page }) => {
    // Fresh visit
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait for everything to settle
    await page.waitForTimeout(3500);

    // The pinned hero at rest: DRISHYA stretched and visible, KOSH present
    // but still closed, tagline held off (opacity 0) — no double-run
    const heroLines = await lines(page);
    console.log('Word-lines at rest:', heroLines);

    await expect(page.locator('[data-hero-scrub] svg text').first()).toBeVisible();
    await expect(page.locator('[data-hero-scrub] svg text').first()).toHaveText('DRISHYA');
    expect(heroLines[0]?.height ?? 0).toBeGreaterThan(100);
    expect(heroLines[1]?.text).toBe('KOSH');
    expect(heroLines[1]?.height ?? -1).toBeLessThan(4);

    // tagline lives in the hero, holding its beat — text present, opacity 0
    const tagline = page.locator('[data-hero-scrub] .pointer-events-none.inset-0');
    await expect(tagline).toContainText('Curated');
    const held = await taglineOpacity(page);
    console.log('Tagline held opacity:', held);
    expect(held).toBeLessThan(0.05);

    await page.screenshot({ path: 'screenshots/10-no-flash-final.png', fullPage: false });
    console.log('Screenshot 10: No flash - hero stable at poster state');

    // Idle: nothing re-runs — DRISHYA carries its deliberate idle breathe
    // (scaleY yoyo ≤ 3% until the first scroll), so bound that; a real
    // flash/double-run would move KOSH or the tagline off their held beat
    await page.waitForTimeout(2000);
    const settled = await lines(page);
    console.log('Word-lines after idle:', settled);
    expect(Math.abs(settled[0].height - heroLines[0].height)).toBeLessThan(heroLines[0].height * 0.05);
    expect(Math.abs(settled[1].height - heroLines[1].height)).toBeLessThan(2);
    expect(await taglineOpacity(page)).toBeLessThan(0.05);
  });
});

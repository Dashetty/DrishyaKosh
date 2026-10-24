import { test, expect, type Page } from '@playwright/test';

/**
 * Animation Flash Detection — against the pinned-scrub hero (rebuilt
 * c795d3b; the [data-hero-reveal].hero-* entrance markup is retired).
 *
 * "Flash" in the new design = the intro overlay lingering past the
 * session intro, the word-lines double-running (heights changing with
 * scroll untouched), or the tagline revealing before its timeline beat.
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

const tagline = (page: Page) =>
  page.evaluate(() => {
    const el = document.querySelector(
      '[data-hero-scrub] .pointer-events-none.inset-0',
    ) as Element | null;
    return el ? parseFloat(getComputedStyle(el).opacity) : -1;
  });

test.describe('Animation Flash Detection', () => {
  test('Detect flash or double animation on initial load', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    // intro alone takes ~2.2s; settle well past it
    await page.waitForTimeout(4000);

    const hasIntroPendingNow = await page.evaluate(() =>
      document.documentElement.classList.contains('intro-pending'),
    );
    const loadingScreenVisible = await page
      .locator('[data-intro-overlay]')
      .isVisible()
      .catch(() => false);

    // Hero present and at its poster state (no scroll has occurred)
    const heroLines = await lines(page);
    console.log('Results after 4s wait:');
    console.log('  - intro-pending present:', hasIntroPendingNow);
    console.log('  - LoadingScreen visible:', loadingScreenVisible);
    console.log('  - word-lines:', heroLines);

    await page.screenshot({ path: 'screenshots/20-flash-test.png', fullPage: false });
    console.log('Screenshot 20: Flash test result');

    expect(hasIntroPendingNow).toBe(false);
    expect(loadingScreenVisible).toBe(false);
    // DRISHYA visible with real height; KOSH still closed (no scroll)
    expect(heroLines[0]?.text).toBe('DRISHYA');
    expect(heroLines[0]?.height ?? 0).toBeGreaterThan(100);
    expect(heroLines[1]?.text).toBe('KOSH');
    expect(heroLines[1]?.height ?? -1).toBeLessThan(4);
    // tagline held until the scrub brings it (beat timeline ≥ 0.72)
    expect(await tagline(page)).toBeLessThan(0.05);
  });

  test('Check animation timestamps for double execution', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const initial = await lines(page);
    const initialTagline = await tagline(page);
    console.log('GSAP/Animation info (initial):', { initial, initialTagline });

    await page.screenshot({ path: 'screenshots/21-gsap-check.png', fullPage: false });
    console.log('Screenshot 21: GSAP animation check');

    // No scroll, no interaction: a double-run would show up as motion.
    // DRISHYA's idle breathe (scaleY yoyo ≤ 3% until first scroll) is the
    // only sanctioned drift — KOSH and the tagline must hold exactly.
    await page.waitForTimeout(3000);
    const rested = await lines(page);
    console.log('Word-lines after idle:', rested);
    expect(Math.abs(rested[0].height - initial[0].height)).toBeLessThan(initial[0].height * 0.05);
    expect(Math.abs(rested[1].height - initial[1].height)).toBeLessThan(2);
    expect(await tagline(page)).toBe(initialTagline);

    // scroll through the scrub range, then settle (scrub 0.6 catch-up)
    await page.evaluate(() => {
      const root = document.querySelector('[data-hero-scrub]') as HTMLElement;
      const top = root.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top + root.offsetHeight - window.innerHeight);
    });
    await page.waitForTimeout(3000);

    // Final scrub state: KOSH open, DRISHYA squeezed to ~78% of natural
    const finalState = await lines(page);
    console.log('Final element states:', finalState);
    expect(finalState[1].height).toBeGreaterThan(
      page.viewportSize()!.height * 0.2,
    );
    expect(finalState[0].height).toBeLessThan(initial[0].height);
    // and the tagline is revealed exactly once (full opacity, stays)
    expect(await tagline(page)).toBeGreaterThan(0.9);
  });

  test('Full animation flow timing', async ({ page }) => {
    // unchanged: phase-by-phase screenshot walk (no markup assertions)
    const timings: Record<string, number> = {};

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    timings.initial = Date.now();
    await page.screenshot({ path: 'screenshots/22-timeline-0-initial.png', fullPage: false });

    await page.waitForTimeout(300);
    timings.beamStart = Date.now();
    await page.screenshot({ path: 'screenshots/23-timeline-300-beam.png', fullPage: false });

    await page.waitForTimeout(500);
    timings.wordmark = Date.now();
    await page.screenshot({ path: 'screenshots/24-timeline-800-wordmark.png', fullPage: false });

    await page.waitForTimeout(700);
    timings.introEnd = Date.now();
    await page.screenshot({ path: 'screenshots/25-timeline-1500-intro.png', fullPage: false });

    await page.waitForTimeout(500);
    timings.heroStart = Date.now();
    await page.screenshot({ path: 'screenshots/26-timeline-2000-hero.png', fullPage: false });

    await page.waitForTimeout(500);
    timings.nameAnimating = Date.now();
    await page.screenshot({ path: 'screenshots/27-timeline-2500-name.png', fullPage: false });

    await page.waitForTimeout(500);
    timings.taglineAnimating = Date.now();
    await page.screenshot({ path: 'screenshots/28-timeline-3000-tagline.png', fullPage: false });

    await page.waitForTimeout(500);
    timings.cueAnimating = Date.now();
    await page.screenshot({ path: 'screenshots/29-timeline-3500-cue.png', fullPage: false });

    await page.waitForTimeout(500);
    timings.complete = Date.now();
    await page.screenshot({ path: 'screenshots/30-final-complete.png', fullPage: false });

    console.log('Timeline measurement (ms):');
    Object.entries(timings).forEach(([key, value]) => {
      console.log(`  ${key}: ${value - timings.initial}`);
    });

    const sessionState = await page.evaluate(() => ({
      hasIntroPending: document.documentElement.classList.contains('intro-pending'),
    }));
    console.log('Session state:', sessionState);
    expect(sessionState.hasIntroPending).toBe(false);
  });

  test('Refresh behavior check', async ({ page }) => {
    // First visit — intro plays and marks the session
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.evaluate(() => {
      sessionStorage.setItem('dk-intro', '1');
    });

    // Refresh — the inline pre-paint script skips the intro this time
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const afterRefresh = await page.evaluate(() => ({
      introPending: document.documentElement.classList.contains('intro-pending'),
      overlayDisplay: getComputedStyle(
        document.querySelector('[data-intro-overlay]') as Element,
      ).display,
      heroWordmarks: document.querySelectorAll('[data-hero-scrub] svg text').length,
    }));
    console.log('After refresh:', afterRefresh);

    await page.screenshot({ path: 'screenshots/31-refresh-check.png', fullPage: false });
    console.log('Screenshot 31: Refresh behavior check');

    // no intro replay (no flash), hero present from the first paint
    expect(afterRefresh.introPending).toBe(false);
    expect(afterRefresh.overlayDisplay).toBe('none');
    expect(afterRefresh.heroWordmarks).toBe(2);
  });
});

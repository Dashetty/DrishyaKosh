import { test, expect } from '@playwright/test';

/**
 * Pinned-scrub hero (rebuilt c795d3b, "LAWLESS CREATIVITY" port):
 * a sticky 100svh viewport inside a ≥200svh signal-red section holding two
 * SVG word-lines — DRISHYA (poster-stretched at load) and KOSH (opens from
 * 0svh as you scroll). The tagline (Litterbox hand type) fades over the
 * final state near the end of the scrub; a red wedge clips in at the
 * hand-off into the ink archive. The retired one-shot entrance
 * ([data-hero-reveal].hero-title/name/tagline/cue) no longer exists.
 *
 * Session intro: `html.intro-pending` pre-paint flag (layout.tsx script,
 * keyed by sessionStorage `dk-intro`); LoadingScreen clears it when done.
 */

const HERO = '[data-hero-scrub]';
const INTRO_OVERLAY = '[data-intro-overlay]';
/** the word-line `<text>`s: [0] DRISHYA, [1] KOSH — [1] stays 0-height until scroll */
const HERO_LINES = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const lines = document.querySelectorAll('[data-hero-scrub] svg text');
    const first = lines[0] as SVGTextElement;
    const second = lines[1] as SVGTextElement | undefined;
    return {
      count: lines.length,
      firstText: first?.textContent ?? null,
      secondText: second?.textContent ?? null,
      firstHeight: first?.parentElement?.getBoundingClientRect().height ?? -1,
      secondHeight: second?.parentElement?.getBoundingClientRect().height ?? -1,
    };
  });

test('homepage animation behavior', async ({ page }) => {
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Stage 1: the projector intro is running (screenshot for the review log)
  await page.screenshot({ path: '/tmp/test-1-page-loaded.png', fullPage: false });
  console.log('Screenshot 1: Page loaded state (intro running)');

  // The intro alone takes ~2.2s; wait past it, then screenshot the settled hero
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/test-2-after-intro.png', fullPage: false });
  console.log('Screenshot 2: After intro');
  await page.waitForTimeout(500); // flicker check pass
  await page.screenshot({ path: '/tmp/test-3-stable.png', fullPage: false });
  console.log('Screenshot 3: Stable state');

  // Intro lifecycle: flag consumed, session marked, overlay gone
  const afterIntro = await page.evaluate(() => ({
    introPending: document.documentElement.classList.contains('intro-pending'),
    dkIntro: sessionStorage.getItem('dk-intro'),
    overlayDisplay: getComputedStyle(
      document.querySelector('[data-intro-overlay]') as Element,
    ).display,
  }));
  console.log('After intro:', afterIntro);
  expect(afterIntro.introPending).toBe(false);
  expect(afterIntro.dkIntro).toBe('1');
  expect(afterIntro.overlayDisplay).toBe('none');

  // The pinned hero: wordmark lines + accessible title
  await expect(page.locator(`${HERO} svg text`).first()).toBeVisible();
  await expect(page.locator(`${HERO} svg text`).first()).toHaveText('DRISHYA');
  const title = await page.textContent(`${HERO} h1`);
  console.log('Hero title (sr-only):', title);
  expect(title).toContain('DrishyaKosh');

  // Returning-visit path: after a reload the intro must not replay
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/test-4-after-refresh.png', fullPage: false });
  console.log('Screenshot 4: After refresh (repeat visit)');
  const afterReload = await page.evaluate(() => ({
    introPending: document.documentElement.classList.contains('intro-pending'),
    overlayDisplay: getComputedStyle(
      document.querySelector('[data-intro-overlay]') as Element,
    ).display,
  }));
  console.log('Intro element state:', afterReload);
  expect(afterReload.introPending).toBe(false);
  expect(afterReload.overlayDisplay).toBe('none');

  // Hero still there and settled on the repeat visit
  await expect(page.locator(`${HERO} svg text`).first()).toBeVisible();
});

test('scroll behavior', async ({ page }) => {
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000); // intro done; hero at its poster state

  // At rest (scroll 0): DRISHYA stretched, KOSH not yet opened, tagline held
  const atRest = await HERO_LINES(page);
  console.log('Word-lines at rest:', atRest);
  expect(atRest.count).toBe(2);
  expect(atRest.firstText).toBe('DRISHYA');
  expect(atRest.secondText).toBe('KOSH');
  expect(atRest.firstHeight).toBeGreaterThan(100);
  expect(atRest.secondHeight).toBeLessThan(4);

  // Scroll to the very end of the hero's scrub range (section bottom at
  // viewport bottom → progress 1; scrub 0.6 catch-up needs a settle)
  await page.evaluate(() => {
    const root = document.querySelector('[data-hero-scrub]') as HTMLElement;
    const top = root.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top + root.offsetHeight - window.innerHeight);
  });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: '/tmp/test-scroll.png', fullPage: false });
  console.log('Screenshot: After scroll to hero end');

  // Final scrub state: KOSH opened, DRISHYA squeezed, tagline revealed
  const atEnd = await HERO_LINES(page);
  console.log('Word-lines at hero end:', atEnd);
  expect(atEnd.secondHeight).toBeGreaterThan(page.viewportSize()!.height * 0.2);
  expect(atEnd.firstHeight).toBeLessThan(atRest.firstHeight);

  // The tagline overlay rides the end of the timeline
  const tagline = page.locator(`${HERO} .pointer-events-none.inset-0`);
  await expect(tagline).toContainText('Curated');
  const taglineOpacity = await tagline.evaluate(
    (el) => parseFloat(getComputedStyle(el).opacity),
  );
  console.log('Tagline opacity at hero end:', taglineOpacity);
  expect(taglineOpacity).toBeGreaterThan(0.9);
});

import { test, expect, type Page } from '@playwright/test';

/**
 * Animation Flash Detection — against the Theater card (ACT I), which
 * replaced the pinned taffy hero (specs retired alongside the cutover).
 *
 * "Flash" here = the intro overlay lingering past the session intro, the
 * arrival timeline double-running (letters/type moving with scroll
 * untouched), or the card's server-hidden states leaking before their
 * beat. The theater keeps the old contract: hidden states live in the
 * server markup, GSAP only ever animates to visible.
 */

const THEATER = '[data-hero-scrub]';

/** the marquee letters' settled transform + the type layer's opacity */
const cardState = (page: Page) =>
  page.evaluate(() => {
    const root = document.querySelector('[data-hero-scrub]') as HTMLElement;
    const letters = Array.from(
      root.querySelectorAll<HTMLElement>('[data-arch-letter]'),
    ).map((l) => ({
      opacity: parseFloat(getComputedStyle(l).opacity),
      transform: getComputedStyle(l).transform,
    }));
    const type = root.querySelector('[data-hero-scrub] .z-\\[38\\]') as HTMLElement | null;
    const drape = root.querySelector('.theater-drape') as HTMLElement | null;
    return {
      letters,
      typeOpacity: type ? parseFloat(getComputedStyle(type).opacity) : -1,
      drapeClip: drape ? getComputedStyle(drape).clipPath : 'none',
    };
  });

test.describe('Animation Flash Detection — Theater', () => {
  test('no flash on initial load; the card arrives once', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    // the intro alone takes ~2.2s; settle well past the arrival timeline
    await page.waitForTimeout(5500);

    const hasIntroPendingNow = await page.evaluate(() =>
      document.documentElement.classList.contains('intro-pending'),
    );
    const loadingScreenVisible = await page
      .locator('[data-intro-overlay]')
      .isVisible()
      .catch(() => false);

    const state = await cardState(page);
    console.log('Results after 5.5s wait:');
    console.log('  - intro-pending present:', hasIntroPendingNow);
    console.log('  - LoadingScreen visible:', loadingScreenVisible);
    console.log('  - letters settled:', state.letters.every((l) => l.opacity === 1));
    console.log('  - drape clip:', state.drapeClip);

    await page.screenshot({ path: 'screenshots/20-flash-test.png', fullPage: false });

    expect(hasIntroPendingNow).toBe(false);
    expect(loadingScreenVisible).toBe(false);
    // every marquee letter landed at full opacity — the arrival ran once
    expect(state.letters.length).toBe(11);
    state.letters.forEach((l) => expect(l.opacity).toBe(1));
    // the drape is still down at scroll 0 (the act has not begun)
    expect(state.drapeClip).not.toContain('100%');
  });

  test('no double execution while idle; the raise completes once', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5500);

    const initial = await cardState(page);

    // idle: the sanctioned drifts are CSS (breathe ≤ 0.8%, motes, halo) —
    // the letters' own transforms must hold exactly
    await page.waitForTimeout(3000);
    const rested = await cardState(page);
    rested.letters.forEach((l, i) => {
      expect(l.transform).toBe(initial.letters[i].transform);
      expect(l.opacity).toBe(1);
    });

    // scroll through the pin's range, then settle (scrub 1.1 catch-up)
    await page.evaluate(() => {
      const root = document.querySelector('[data-hero-scrub]') as HTMLElement;
      const top = root.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top + root.offsetHeight - window.innerHeight);
    });
    await page.waitForTimeout(3000);

    // final scrub state: the drape fully risen (clip bottom inset 100%)
    const finalState = await cardState(page);
    console.log('Final drape clip:', finalState.drapeClip);
    expect(finalState.drapeClip).toContain('100%');
    expect(finalState.letters.every((l) => l.opacity === 1)).toBe(true);
  });

  test('refresh behavior check — no intro replay, card present from first paint', async ({
    page,
  }) => {
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
      archLetters: document.querySelectorAll('[data-hero-scrub] [data-arch-letter]')
        .length,
    }));
    console.log('After refresh:', afterRefresh);

    await page.screenshot({ path: 'screenshots/31-refresh-check.png', fullPage: false });

    // no intro replay (no flash), the marquee is in the markup from SSR
    expect(afterRefresh.introPending).toBe(false);
    expect(afterRefresh.overlayDisplay).toBe('none');
    expect(afterRefresh.archLetters).toBe(11);
  });
});

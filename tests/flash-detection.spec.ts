import { test, expect, Page } from '@playwright/test';

test.describe('Animation Flash Detection', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
  });

  test('Detect flash or double animation on initial load', async () => {
    // Start with completely fresh context (no localStorage/sessionStorage)
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait for potential animations to complete
    await page.waitForTimeout(4000);

    // Check if intro-pending was removed
    const hasIntroPendingNow = await page.evaluate(() => {
      return document.documentElement.classList.contains('intro-pending');
    });

    // Check LoadingScreen visibility
    const loadingScreenVisible = await page.locator('[data-intro-overlay]').isVisible().catch(() => false);

    // Check hero visibility
    const heroTitleVisible = await page.locator('[data-hero-reveal].hero-title').isVisible();

    console.log('Results after 4s wait:');
    console.log('  - intro-pending present:', hasIntroPendingNow);
    console.log('  - LoadingScreen visible:', loadingScreenVisible);
    console.log('  - Hero title visible:', heroTitleVisible);

    await page.screenshot({ path: 'screenshots/20-flash-test.png', fullPage: true });
    console.log('Screenshot 20: Flash test result');

    // Verify no flash - LoadingScreen should not be visible after 4s
    expect(hasIntroPendingNow).toBe(false);
    expect(loadingScreenVisible).toBe(false);
    expect(heroTitleVisible).toBe(true);
  });

  test('Check animation timestamps for double execution', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Capture GSAP timeline info after animation setup
    const gsapInfo = await page.evaluate(() => {
      // Check if GSAP timelines exist
      const timelinesExist = typeof window !== 'undefined' && Boolean((window as Window & { gsap?: { timeline?: unknown } }).gsap?.timeline);

      // Check animation state from DOM
      const title = document.querySelector('[data-hero-reveal].hero-title') as HTMLElement;

      if (title) {
        const style = window.getComputedStyle(title);
        return {
          timelineReady: timelinesExist,
          titleOpacity: style.opacity,
          titleTransform: style.transform,
          titleVisible: parseFloat(style.opacity) > 0.1
        };
      }

      return { timelineReady: timelinesExist, titleVisible: false };
    });

    console.log('GSAP/Animation info:', gsapInfo);

    await page.screenshot({ path: 'screenshots/21-gsap-check.png', fullPage: true });
    console.log('Screenshot 21: GSAP animation check');

    // Wait for animations
    await page.waitForTimeout(3000);

    // Check final state
    const finalState = await page.evaluate(() => {
      const elements = ['hero-title', 'hero-name', 'hero-tagline', 'hero-cue'];
      return elements.map((cls) => {
        const el = document.querySelector(`[data-hero-reveal].${cls}`) as HTMLElement;
        if (!el) return { name: cls, visible: false };
        const style = window.getComputedStyle(el);
        return {
          name: cls,
          opacity: parseFloat(style.opacity),
          visible: parseFloat(style.opacity) > 0.5
        };
      });
    });

    console.log('Final element states:', finalState);

    // All should be visible
    expect(finalState.every(e => e.visible)).toBe(true);
  });

  test('Full animation flow timing', async ({ page }) => {
    // Track timing of each animation phase
    const timings: Record<string, number> = {};

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Time 0 - Initial load
    timings.initial = Date.now();
    await page.screenshot({ path: 'screenshots/22-timeline-0-initial.png', fullPage: true });

    // Wait 300ms - LoadingScreen beam rising
    await page.waitForTimeout(300);
    timings.beamStart = Date.now();
    await page.screenshot({ path: 'screenshots/23-timeline-300-beam.png', fullPage: true });

    // Wait 800ms - Wordmark appears
    await page.waitForTimeout(500);
    timings.wordmark = Date.now();
    await page.screenshot({ path: 'screenshots/24-timeline-800-wordmark.png', fullPage: true });

    // Wait 1.5s - Intro clip-path animation
    await page.waitForTimeout(700);
    timings.introEnd = Date.now();
    await page.screenshot({ path: 'screenshots/25-timeline-1500-intro.png', fullPage: true });

    // Wait 2s - Hero animations start
    await page.waitForTimeout(500);
    timings.heroStart = Date.now();
    await page.screenshot({ path: 'screenshots/26-timeline-2000-hero.png', fullPage: true });

    // Wait 2.5s - Hero name animating
    await page.waitForTimeout(500);
    timings.nameAnimating = Date.now();
    await page.screenshot({ path: 'screenshots/27-timeline-2500-name.png', fullPage: true });

    // Wait 3s - Tagline animating
    await page.waitForTimeout(500);
    timings.taglineAnimating = Date.now();
    await page.screenshot({ path: 'screenshots/28-timeline-3000-tagline.png', fullPage: true });

    // Wait 3.5s - Cue animating
    await page.waitForTimeout(500);
    timings.cueAnimating = Date.now();
    await page.screenshot({ path: 'screenshots/29-timeline-3500-cue.png', fullPage: true });

    // Final - All animations complete
    await page.waitForTimeout(500);
    timings.complete = Date.now();
    await page.screenshot({ path: 'screenshots/30-final-complete.png', fullPage: true });

    console.log('Timeline measurement (ms):');
    Object.entries(timings).forEach(([key, value]) => {
      console.log(`  ${key}: ${value - timings.initial}`);
    });

    // Verify session state
    const sessionState = await page.evaluate(() => {
      const html = document.documentElement;
      return {
        hasIntroPending: html.classList.contains('intro-pending'),
      };
    });

    console.log('Session state:', sessionState);
  });

  test('Refresh behavior check', async ({ page }) => {
    // First visit
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Set session storage as if visited before (simulating return visitor)
    await page.evaluate(() => {
      sessionStorage.setItem('dk-intro', '1');
    });

    // Refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check state after refresh
    const afterRefresh = await page.evaluate(() => ({
      introPending: document.documentElement.classList.contains('intro-pending'),
      heroTitleVisible: !!document.querySelector('[data-hero-reveal].hero-title')
    }));
    console.log('After refresh:', afterRefresh);

    await page.screenshot({ path: 'screenshots/31-refresh-check.png', fullPage: true });
    console.log('Screenshot 31: Refresh behavior check');

    // After refresh with session storage set, intro should not replay
    expect(afterRefresh.introPending).toBe(false);
    expect(afterRefresh.heroTitleVisible).toBe(true);
  });
});
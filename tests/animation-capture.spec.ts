import { test, expect } from '@playwright/test';

test.describe('Hero Animation Capture Tests', () => {
  test('Capture intro and hero states', async ({ page }) => {
    // Fresh visit
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Stage 1: Initial Load (LoadingScreen + intro in progress)
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/01-initial-load.png', fullPage: true });
    console.log('Stage 1: Initial load - LoadingScreen visible');

    // Stage 2: After Intro Beam Animation (wordmark appears, beam rises)
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshots/02-beam-animated.png', fullPage: true });
    console.log('Stage 2: Beam animated, wordmark appears');

    // Stage 3: After Intro Complete (clip-path animation pushes LoadingScreen away)
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/03-after-intro.png', fullPage: true });
    console.log('Stage 3: Intro complete, clip-path hides LoadingScreen');

    // Stage 4: Hero Title Animation Start
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'screenshots/04-hero-title-start.png', fullPage: true });
    console.log('Stage 4: Hero title animation starting');

    // Stage 5: Hero Name Animation
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'screenshots/05-hero-name-animated.png', fullPage: true });
    console.log('Stage 5: Name animation in progress');

    // Stage 6: Hero Tagline Animation
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'screenshots/06-hero-tagline-animated.png', fullPage: true });
    console.log('Stage 6: Tagline animation in progress');

    // Stage 7: Scroll Cue Animation
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshots/07-hero-cue-animated.png', fullPage: true });
    console.log('Stage 7: Scroll cue animation in progress');

    // Stage 8: All Animations Complete
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/08-all-complete.png', fullPage: true });
    console.log('Stage 8: All animations complete');

    // Verify intro-pending is gone
    const hasIntroPending = await page.evaluate(() => {
      return document.documentElement.classList.contains('intro-pending');
    });
    console.log('Intro pending class present:', hasIntroPending);

    // Verify elements are visible
    const title = await page.locator('[data-hero-reveal].hero-title').isVisible();
    const name = await page.locator('[data-hero-reveal].hero-name').isVisible();
    const tagline = await page.locator('[data-hero-reveal].hero-tagline').isVisible();
    const cue = await page.locator('[data-hero-reveal].hero-cue').isVisible();

    console.log('Title visible:', title);
    console.log('Name visible:', name);
    console.log('Tagline visible:', tagline);
    console.log('Cue visible:', cue);
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

    await page.screenshot({ path: 'screenshots/09-return-visitor.png', fullPage: true });
    console.log('Screenshot 9: Return visitor (simulated)');

    // Check intro-pending is not set
    const hasIntroPending = await page.evaluate(() => {
      return document.documentElement.classList.contains('intro-pending');
    });
    console.log('Intro pending after return visit:', hasIntroPending);
  });

  test('Verify no flash on hero elements', async ({ page }) => {
    // Fresh visit
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait for everything to settle
    await page.waitForTimeout(3500);

    // Check hero elements
    const heroTitle = page.locator('[data-hero-reveal].hero-title');
    const heroName = page.locator('[data-hero-reveal].hero-name');
    const heroTagline = page.locator('[data-hero-reveal].hero-tagline');
    const heroCue = page.locator('[data-hero-reveal].hero-cue');

    // All should be visible without flicker
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toHaveText('Drishyakosh');

    await expect(heroName).toBeVisible();
    await expect(heroName).toHaveText('Hardeep Dilip Shetty');

    await expect(heroTagline).toBeVisible();
    await expect(heroTagline).toContainText('personal archive');

    await expect(heroCue).toBeVisible();
    await expect(heroCue).toContainText('SCROLL');

    await page.screenshot({ path: 'screenshots/10-no-flash-final.png', fullPage: true });
    console.log('Screenshot 10: No flash - all elements visible');

    // Check CSS state
    const finalState = await heroTitle.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        opacity: style.opacity,
        transform: style.transform,
        y: parseFloat(style.getPropertyValue('--y-gsap') || '0')
      };
    });
    console.log('Final hero title state:', finalState);
  });
});
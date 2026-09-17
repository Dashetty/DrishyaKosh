import { test } from '@playwright/test';

test('homepage animation behavior', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  // Take initial screenshot
  await page.screenshot({ path: '/tmp/test-1-page-loaded.png', fullPage: true });
  console.log('Screenshot 1: Page loaded state');
  
  // Wait for intro animation to complete
  await page.waitForTimeout(3000);
  
  // Take screenshot after intro
  await page.screenshot({ path: '/tmp/test-2-after-intro.png', fullPage: true });
  console.log('Screenshot 2: After intro animation');
  
  // Check for flickering - another screenshot
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/test-3-stable.png', fullPage: true });
  console.log('Screenshot 3: Stable state');
  
  // Check localStorage
  const ls = await page.evaluate(() => localStorage.getItem('introComplete'));
  console.log('introComplete in localStorage:', ls);
  
  // Check sessionStorage
  const ss = await page.evaluate(() => Object.keys(sessionStorage).length);
  console.log('SessionStorage keys count:', ss);
  
  // Refresh to test repeat visit
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: '/tmp/test-4-after-refresh.png', fullPage: true });
  console.log('Screenshot 4: After refresh (repeat visit)');
  
  // Check if intro element is hidden
  const introState = await page.evaluate(() => {
    const intro = document.querySelector('[data-intro], .intro');
    if (!intro) return { found: false };
    const styles = window.getComputedStyle(intro);
    return {
      found: true,
      opacity: styles.opacity,
      visibility: styles.visibility,
      display: styles.display,
      hidden: styles.display === 'none' || styles.visibility === 'hidden'
    };
  });
  console.log('Intro element state:', introState);
  
  // Check hero elements
  await page.waitForSelector('h1, .title, [data-name], .tagline', { timeout: 5000 });
  const title = await page.textContent('h1, .title, [data-name]');
  console.log('Title text:', title?.substring(0, 50));
});

test('scroll behavior', async ({ page }) => {
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  // Wait for animations
  await page.waitForTimeout(4000);
  
  // Scroll down
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: '/tmp/test-scroll.png', fullPage: true });
  console.log('Screenshot: After scroll');
  
  // Check for drum pin transition
  const drumPin = await page.evaluate(() => {
    const el = document.querySelector('[data-drum], .drum, .pin');
    if (!el) return null;
    const styles = window.getComputedStyle(el);
    return {
      found: true,
      opacity: styles.opacity,
      transform: styles.transform,
      display: styles.display
    };
  });
  console.log('Drum pin state:', drumPin);
});

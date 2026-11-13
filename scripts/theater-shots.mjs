/**
 * Theater QA shots — desktop + mobile, intro skipped, sampling the pin's
 * three acts (settle → lights down → raise) plus the arrival's ignition.
 * `?no-snap` disables the raise's idle snap so the RAW scrub states are
 * captured at each beat rather than the snapped rest states.
 * Usage: node scripts/theater-shots.mjs
 */
import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const errors = [];

/* fractions of the pin's scroll travel — the three acts + the raise */
const BEATS = [0, 0.15, 0.32, 0.47, 0.62, 0.75, 0.85, 1];

async function shot(name, viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[${name}] ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`[${name}] pageerror: ${e.message}`));
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("dk-intro", "1");
    } catch (e) {}
  });
  await page.goto("http://localhost:3000/?no-snap", { waitUntil: "domcontentloaded" });

  // the arrival starts the moment the section hydrates (session intro is
  // skipped), so poll for it and scroll into view on the same tick — then
  // shoot fast enough to catch the lamp strike's dips
  for (let i = 0; i < 120; i++) {
    const found = await page
      .evaluate(() => {
        const el = document.querySelector("[data-hero-scrub]");
        if (!el) return false;
        el.scrollIntoView({ behavior: "instant", block: "start" });
        return true;
      })
      .catch(() => false);
    if (found) break;
    await page.waitForTimeout(40);
  }
  await page.screenshot({ path: `screenshots/theater-${name}-ignition.png` });
  await page.waitForTimeout(260);
  await page.screenshot({ path: `screenshots/theater-${name}-ignition-2.png` });
  await page.waitForTimeout(4000); // let the arrival settle

  const { top, travel } = await page.evaluate(() => {
    const el = document.querySelector("[data-hero-scrub]");
    return { top: el.offsetTop, travel: el.offsetHeight - window.innerHeight };
  });

  for (let i = 0; i < BEATS.length; i++) {
    const y = Math.round(top + travel * BEATS[i]) + 1;
    await page.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
    // scrub 0.55 catch-up + Lenis settle
    await page.waitForTimeout(1400);
    await page.screenshot({
      path: `screenshots/theater-${name}-beat-${String(i).padStart(2, "0")}.png`,
    });
  }

  await ctx.close();
}

await shot("desktop", { width: 1440, height: 900 });
await shot("mobile", { width: 390, height: 844 });
await browser.close();
console.log(errors.length ? errors.join("\n") : "no console errors");

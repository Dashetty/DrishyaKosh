/**
 * Theater QA shots — desktop + mobile, with the intro skipped.
 * Usage: node scripts/theater-shots.mjs
 */
import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const errors = [];

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
  await page.goto("http://localhost:3000", { waitUntil: "load" });
  await page.evaluate(() => document.querySelector("[data-hero-scrub]")?.scrollIntoView({ behavior: "instant", block: "start" }));
  // let the arrival timeline play out (~3.2s total) plus settle
  await page.waitForTimeout(4500);
  await page.screenshot({ path: `screenshots/theater-${name}.png` });

  // mid-scrub: scroll into the pin's middle
  const h = await page.evaluate(() => document.querySelector("[data-hero-scrub]").offsetHeight);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(h * 0.45) + 10);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `screenshots/theater-${name}-mid.png` });

  // the rise: late in the pin
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(h * 0.86) + 10);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `screenshots/theater-${name}-rise.png` });

  // past the pin — the bare stage / handoff
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), h + 10);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `screenshots/theater-${name}-after.png` });
  await ctx.close();
}

await shot("desktop", { width: 1440, height: 900 });
await shot("mobile", { width: 390, height: 844 });
await browser.close();
console.log(errors.length ? errors.join("\n") : "no console errors");

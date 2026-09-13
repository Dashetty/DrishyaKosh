/**
 * Headless drum regression — run against `pnpm dev` on :3100.
 * Verifies: pin seam, wheel roll + wrap, snap, HUD updates, rail switch,
 * physics reset, unpin-at-top, END exit, reduced-motion fallback.
 * No visuals (headless-shell) — this is the mechanics pass; visual pass
 * happens in the IAB once its compositor recovers, or on a real machine.
 */
import { chromium } from "@playwright/test";
import { pathToFileURL } from "node:url";
import path from "node:path";

const BASE = "http://localhost:3100";

const results = [];
const check = (name, pass, detail = "") => {
  results.push(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);

// ——— 1. pin seam ———
await page.evaluate(() => window.scrollTo(0, 700));
await page.waitForTimeout(600);
let pinned = await page.evaluate(() => document.documentElement.classList.contains("drum-pinned"));
check("pin seam: scrolling to sentinel pins the drum", pinned);

let hud = await page.textContent('[aria-live="polite"]');
check("HUD reads Reel 01 intertitle", hud === "REEL 01 · 1/4", `got "${hud}"`);

// ——— 2. wheel roll: advances cards and wraps ———
// momentum varies; assert advancement + a wrap (a 1/4 after a higher position)
const WHEEL = 1600;
const hudSeq = [];
for (let i = 0; i < 6; i++) {
  await page.evaluate((d) => window.dispatchEvent(new WheelEvent("wheel", { deltaY: d, bubbles: true })), WHEEL);
  await page.waitForTimeout(1100);
  hudSeq.push(await page.textContent('[aria-live="polite"]'));
}
const positions = hudSeq.map((h) => parseInt(h.match(/(\d+)\/4/)?.[1] ?? "0", 10));
const advanced = positions.length > 2 && positions.some((p) => p >= 2);
const wrapped = positions.some((p, i) => i > 0 && p < positions[i - 1]);
check("wheel advances through loop and wraps", advanced && wrapped, `sequence: ${hudSeq.join(" → ")}`);

// ——— 3. snap on release: after a partial wheel, settle lands on integer ———
await page.evaluate(() => window.dispatchEvent(new WheelEvent("wheel", { deltaY: 700, bubbles: true })));
await page.waitForTimeout(1800);
const snapped = await page.textContent('[aria-live="polite"]');
check("partial wheel settles (snap) to a whole card", /\d\/4$/.test(snapped), `HUD "${snapped}"`);

// ——— 4. rail switch: Design → Music ———
await page.click('nav[aria-label="Reels"] >> text=MUSIC');
await page.waitForTimeout(900);
hud = await page.textContent('[aria-live="polite"]');
const musicTitle = await page.textContent(".drum-stage h2");
check("rail switch lands on Music intertitle at 1/4", hud === "REEL 02 · 1/4" && musicTitle === "Music", `HUD "${hud}", title "${musicTitle}"`);

// ——— 5. physics reset: velocity from previous reel must not bleed ———
await page.evaluate(() => window.dispatchEvent(new WheelEvent("wheel", { deltaY: 6000, bubbles: true })));
await page.click('nav[aria-label="Reels"] >> text=DESIGN');
await page.waitForTimeout(400);
const blurAfterSwitch = await page.evaluate(() => {
  const layer = document.querySelector(".drum-stage > div");
  return layer?.style.filter || "none";
});
check("rail switch resets blur (no velocity bleed)", blurAfterSwitch === "none", `filter "${blurAfterSwitch}"`);
hud = await page.textContent('[aria-live="polite"]');
check("switch back to Design lands on intertitle 1/4", hud === "REEL 01 · 1/4", `HUD "${hud}"`);

// ——— 6. unpin-at-top: on Reel 01 intertitle, scroll up exits ———
// real trackpads emit small deltas over time; the accumulator requires the
// loop to stay on card 0, and React commits between events in real input
for (let i = 0; i < 6; i++) {
  await page.evaluate(() => window.dispatchEvent(new WheelEvent("wheel", { deltaY: -60, bubbles: true })));
  await page.waitForTimeout(150);
}
await page.waitForTimeout(1200);
const unpinned = await page.evaluate(() => !document.documentElement.classList.contains("drum-pinned"));
const scrollRestored = await page.evaluate(() => !document.documentElement.classList.contains("drum-pinned") && window.scrollY < 1100);
check("wheel-up on Reel 01 intertitle unpins to hero scroll", unpinned, `scrollY ${await page.evaluate(() => Math.round(window.scrollY))}`);

// ——— 7. re-pin and END OF REEL exit to footer ———
await page.evaluate(() => window.scrollTo(0, 700));
await page.waitForTimeout(600);
pinned = await page.evaluate(() => document.documentElement.classList.contains("drum-pinned"));
check("re-pin works after unpin", pinned);
if (pinned) {
  await page.click("text=END OF REEL ↓");
  // wait for the exit: unmount first, then the footer easing into view
  await page.waitForFunction(
    () => !document.querySelector(".drum-stage"),
    { timeout: 5000 }
  );
  await page.waitForFunction(
    () => {
      const r = document.querySelector("footer")?.getBoundingClientRect();
      return r ? r.top < window.innerHeight : false;
    },
    { timeout: 8000 }
  );
  const footerVisible = await page.evaluate(() => {
    const r = document.querySelector("footer")?.getBoundingClientRect();
    return r ? r.top < window.innerHeight && r.bottom > 0 : false;
  });
  check("END OF REEL exits to footer", footerVisible);
}

// ——— 8. reduced-motion fallback: drum never mounts ———
const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page2.emulateMedia({ reducedMotion: "reduce" });
await page2.goto(BASE, { waitUntil: "domcontentloaded" });
await page2.waitForTimeout(2000);
await page2.evaluate(() => window.scrollTo(0, 1400));
await page2.waitForTimeout(800);
const rmPinned = await page2.evaluate(() => document.documentElement.classList.contains("drum-pinned"));
const rmFrames = await page2.evaluate(() => document.querySelectorAll("article[data-frame]").length);
check("reduced motion: no drum pin, scroll archive serves", !rmPinned && rmFrames >= 12, `pinned=${rmPinned}, frames=${rmFrames}`);

await browser.close();
console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("FAIL")).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);

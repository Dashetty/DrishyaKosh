import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (msg) => console.log("BROWSER:", msg.text()));
page.on("pageerror", (err) => console.log("ERROR:", err.message));
await page.goto("http://localhost:3100", { waitUntil: "networkidle" });
await page.waitForTimeout(5000);
const main = await page.$("main");
console.log("main found:", !!main);
if (main) {
  console.log("main html:", (await main.getAttribute("innerHTML"))?.slice(0, 500));
}
const strip = await page.$(".snap-strip");
console.log("snap-strip found:", !!strip);
const stageArea = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll('[class*="drum"], [class*="Drum"]'));
  return els.map((e) => e.className + ":" + e.getBoundingClientRect().top).slice(0, 10);
});
console.log("drum-ish elements:", stageArea);
await browser.close();
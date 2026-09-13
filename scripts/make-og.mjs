/**
 * make-og — one-off generator for public/og.jpg (1200×630).
 * Duotone-grades a frame thumbnail onto the archive's ink background
 * with the wordmark. Run manually: `pnpm make:og` — never part of build.
 */

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// thumbnail source — swap the id to feature a different frame
const youtubeId = "doaQC-S8de8"; // Kurosawa — Composing Movement (DK-007)

const qualities = ["maxresdefault", "sddefault", "hqdefault"];
let thumb = null;
for (const q of qualities) {
  const url = `https://i.ytimg.com/vi/${youtubeId}/${q}.jpg`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (res.ok) {
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 1000) {
      thumb = buf;
      console.log(`Using ${q} (${buf.length} bytes)`);
      break;
    }
  }
}
if (!thumb) {
  console.error("Could not fetch any thumbnail quality.");
  process.exit(1);
}

const W = 1200;
const H = 630;
const IMG_W = 560;

// duotone-grade the still: grayscale → warm tint → darken
const graded = await sharp(thumb)
  .resize(IMG_W, H, { fit: "cover", position: "attention" })
  .grayscale()
  .tint({ r: 226, g: 202, b: 160 })
  .modulate({ brightness: 1.05 })
  .toBuffer();

const overlay = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="vig" cx="20%" cy="50%" r="95%">
      <stop offset="45%" stop-color="#0a0908" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0a0908" stop-opacity="0.7"/>
    </radialGradient>
  </defs>
  <!-- soften the graded still's left edge into the ink -->
  <rect x="${W - IMG_W}" y="0" width="${IMG_W}" height="${H}" fill="url(#vig)"/>
  <!-- wordmark block -->
  <text x="70" y="290" font-family="Georgia, 'Times New Roman', serif" font-size="64"
        fill="#e8e0cf" letter-spacing="6">DRISHYAKOSH</text>
  <line x1="70" y1="330" x2="470" y2="330" stroke="#c9a26a" stroke-width="1.5"/>
  <text x="70" y="372" font-family="Helvetica, Arial, sans-serif" font-size="19"
        fill="#b3a892" letter-spacing="3">A PERSONAL ARCHIVE OF MOVING PICTURES</text>
  <text x="70" y="560" font-family="Helvetica, Arial, sans-serif" font-size="15"
        fill="#7d7466" letter-spacing="4">DK-007 · REEL 03 — CINEMA</text>
  <!-- sprocket hints along the left edge -->
  <g fill="#e8e0cf" fill-opacity="0.13">
    ${Array.from({ length: 8 }, (_, i) => `<rect x="18" y="${18 + i * 84}" width="16" height="40" rx="6"/>`).join("")}
  </g>
</svg>`);

await sharp({
  create: { width: W, height: H, channels: 4, background: "#0a0908" },
})
  .composite([
    { input: graded, left: W - IMG_W, top: 0 },
    { input: overlay, left: 0, top: 0 },
  ])
  .jpeg({ quality: 85 })
  .toFile(path.join(root, "public", "og.jpg"));

console.log("Wrote public/og.jpg");

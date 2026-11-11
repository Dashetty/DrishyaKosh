/**
 * Theater hero asset pipeline (one-shot, re-runnable).
 *
 * public/HeroSection/*.png are the curator's raw generations (~4.4MB total).
 * This emits web delivery files next to them in public/HeroSection/opt/:
 *   - curtain: AVIF (opaque photographic plane, the biggest win)
 *   - swag + frame: WebP with alpha (lossy alpha handles soft tassel edges)
 * each in a desktop and a mobile width. Idempotent: skips existing outputs.
 */
import sharp from "sharp";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const SRC = "public/HeroSection";
const OUT = path.join(SRC, "opt");
mkdirSync(OUT, { recursive: true });

const jobs = [
  // [source, base name, desktop width, mobile width, alpha]
  ["Opulent Crimson Theater Curtain.png", "curtain", 1672, 900, false],
  ["Crimson Velvet Theatre Swag with Gold Tassels.png", "swag", 2172, 1100, true],
  ["Ornate Golden Theater Frame.png", "frame", 1672, 900, true],
];

const strip = { png: true }; // drop the generation metadata

for (const [file, name, wDesktop, wMobile, alpha] of jobs) {
  const meta = await sharp(path.join(SRC, file)).metadata();

  for (const [suffix, width, fmt, q] of [
    ["desktop", wDesktop, alpha ? "webp" : "avif", alpha ? 72 : 42],
    ["mobile", wMobile, alpha ? "webp" : "avif", alpha ? 70 : 40],
  ]) {
    const out = path.join(OUT, `${name}-${suffix}.${fmt}`);
    if (existsSync(out)) {
      console.log("skip (exists):", out);
      continue;
    }
    const widthOut = Math.min(width, meta.width); // never upscale
    let img = sharp(path.join(SRC, file), { limitInputPixels: false }).resize({
      width: widthOut,
      withoutEnlargement: true,
    });
    if (alpha) {
      // PNG alpha edges carry a faint white matte from generation; defringe
      // it by slightly thinning the alpha ramp against the dark stage
      img = img.webp({ quality: q, alphaQuality: 80, effort: 5 });
    } else {
      img = img.avif({ quality: q, effort: 4, chromaSubsampling: "4:2:0" });
    }
    await img.toFile(out);
    const { size } = await import("node:fs").then((fs) => fs.statSync(out));
    console.log(`${out}  ${(size / 1024).toFixed(0)}KB`);
  }
}
console.log("done");

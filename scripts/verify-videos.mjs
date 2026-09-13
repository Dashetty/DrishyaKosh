/**
 * verify-videos — standalone YouTube id checker. NEVER part of the build.
 *
 *   pnpm verify:videos
 *
 * Reads every youtubeId from src/data/videos.ts and asks YouTube's public
 * oEmbed endpoint whether the video exists and is embeddable. Prints a
 * table; exits 1 if anything failed so it can gate a commit if desired.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(path.join(root, "src/data/videos.ts"), "utf8");

const entries = [...source.matchAll(/youtubeId:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"/g)].map(
  ([, youtubeId, title]) => ({ youtubeId, title: title.trim() })
);

if (entries.length === 0) {
  console.error("No videos found in src/data/videos.ts");
  process.exit(1);
}

console.log(`Checking ${entries.length} videos against YouTube oEmbed…\n`);

let failures = 0;
for (const { youtubeId, title } of entries) {
  const url = `https://www.youtube.com/oembed?url=https%3A//www.youtube.com/watch%3Fv%3D${youtubeId}&format=json`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "DrishyaKosh-verify/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`  OK    ${youtubeId}  ${title}  →  ${data.title.slice(0, 60)}`);
    } else {
      failures++;
      console.log(`  FAIL  ${youtubeId}  ${title}  (HTTP ${res.status})`);
    }
  } catch (err) {
    failures++;
    console.log(`  ERR   ${youtubeId}  ${title}  (${err.message})`);
  }
}

console.log(
  failures === 0
    ? `\nAll ${entries.length} ids verified.`
    : `\n${failures} of ${entries.length} ids failed — swap them out.`
);
process.exit(failures === 0 ? 0 : 1);

/**
 * verify-videos — standalone YouTube id checker. NEVER part of the build.
 *
 *   pnpm verify:videos
 *
 * Checks every video in the archive against YouTube's public oEmbed
 * endpoint (existence + embeddability). Prints a table; exits 1 if
 * anything failed so it can gate a commit if desired.
 */

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// evaluate the TS data module in a loader-free way: strip types and import,
// then run it as ESM with a stub for the types import
const tsSource = execFileSync(
  "node",
  [
    "--experimental-strip-types",
    "-e",
    `const m = await import("file://" + ${JSON.stringify(
      path.join(root, "src/data/videos.ts")
    )}); console.log(JSON.stringify(m.videos));`,
  ],
  { cwd: root, encoding: "utf8" }
).toString();

const videos = JSON.parse(tsSource.trim().split("\n").filter(Boolean).pop());

if (!Array.isArray(videos) || videos.length === 0) {
  console.error("No videos found in src/data/videos.ts");
  process.exit(1);
}

console.log(`Checking ${videos.length} videos against YouTube oEmbed…\n`);

let failures = 0;
for (const v of videos) {
  const url = `https://www.youtube.com/oembed?url=https%3A//www.youtube.com/watch%3Fv%3D${v.youtubeId}&format=json`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "DrishyaKosh-verify/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const data = await res.json();
      console.log(
        `  OK    ${v.youtubeId}  ${v.title}  →  ${data.title.slice(0, 60)}`
      );
    } else {
      failures++;
      console.log(`  FAIL  ${v.youtubeId}  ${v.title}  (HTTP ${res.status})`);
    }
  } catch (err) {
    failures++;
    console.log(`  ERR   ${v.youtubeId}  ${v.title}  (${err.message})`);
  }
}

console.log(
  failures === 0
    ? `\nAll ${videos.length} ids verified.`
    : `\n${failures} of ${videos.length} ids failed — swap them out.`
);
process.exit(failures === 0 ? 0 : 1);

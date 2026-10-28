import type { CategorySlug } from "@/types";

/**
 * Category color chips (MUMO ticket treatment): one saturated spine per
 * Category, mixed multiply over the cream paper. Chip type rides on
 * `chipText` (all chips are light enough for ink type). 2026-10-28 Option B
 * palette: signal red / antique gold / teal / terracotta rust — one hue per
 * Category at the same L (0.66), so the four read as equally vivid.
 *
 * (Was REEL_SPINE keyed by the group sense of "Reel"; renamed with the
 * 2026-10-24 terminology change — see ADR-0006.)
 */
export const CATEGORY_SPINE: Record<
  CategorySlug,
  { chip: string; chipText: string; accent: string }
> = {
  "category-01": { chip: "bg-signal", chipText: "text-ink", accent: "text-signal" },
  "category-02": { chip: "bg-amber", chipText: "text-ink", accent: "text-amber" },
  "category-03": { chip: "bg-teal", chipText: "text-ink", accent: "text-teal" },
  "category-04": { chip: "bg-rust", chipText: "text-ink", accent: "text-rust" },
};

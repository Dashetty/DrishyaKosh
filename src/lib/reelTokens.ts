import type { CategorySlug } from "@/types";

/**
 * Category color chips (MUMO ticket treatment): one saturated spine per
 * Category, mixed multiply over the cream paper. Chip type rides on
 * `chipText` (all chips are light enough for ink type except the ink chip).
 * NOTE category-03: bone-on-bone is invisible on the cream paper asset — it
 * wears an ink chip instead.
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
  "category-03": { chip: "bg-ink", chipText: "text-bone", accent: "text-bone" },
  "category-04": { chip: "bg-smoke", chipText: "text-ink", accent: "text-smoke" },
};

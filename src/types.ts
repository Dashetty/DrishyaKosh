/**
 * Domain words follow CONTEXT.md (terminology change, 2026-10-24):
 *   Reel     = one specific video (the type name for it stays `Video`)
 *   Category = a thematic group of Reels
 * Docs/platforms written before that date may use "Reel" for the group
 * sense now called `Category` (see ADR-0006).
 */

export type CategorySlug = "category-01" | "category-02" | "category-03" | "category-04";

export interface Category {
  slug: CategorySlug;
  number: string; // "01"
  title: string; // "Design"
}

/** One Reel — a single curated video in the Archive. */
export interface Video {
  /** stable id — survives CMS swaps, curator-assigned order */
  id: string;
  youtubeId: string;
  title: string;
  creator: string;
  year: number;
  genre: string;
  /** the Category this Reel belongs to */
  category: CategorySlug;
  /** m:ss as displayed on the frame */
  duration: string;
  /** the curator's one-line reason this was saved (the pull-quote) */
  curatorNote: string;
  /** DK-001 … — printed on the frame, never derived at runtime */
  catalogNumber: string;
}

export function thumbnailUrl(youtubeId: string, quality: "maxres" | "hq" = "maxres") {
  return `https://i.ytimg.com/vi/${youtubeId}/${quality}default.jpg`;
}

export function youtubeUrl(youtubeId: string) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

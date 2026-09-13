export type ReelSlug = "reel-01" | "reel-02" | "reel-03" | "reel-04";

export interface Reel {
  slug: ReelSlug;
  number: string; // "01"
  title: string; // "Design"
}

export interface Video {
  /** stable id — survives CMS swaps, curator-assigned order */
  id: string;
  youtubeId: string;
  title: string;
  creator: string;
  year: number;
  genre: string;
  reel: ReelSlug;
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

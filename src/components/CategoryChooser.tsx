"use client";

import type { Category, Video } from "@/types";
import { CATEGORY_SPINE } from "@/lib/reelTokens";

/**
 * CategoryChooser — the page-level pick for the carousel (ADR-0006 §3).
 * Theme wordmark + one typographic card per Category (bordered type, no
 * imagery, no "all categories" chip — the decision). Picking a card re-keys
 * the deck and glides the page to the stage; the chooser stays up here so
 * the Curator can re-pick freely. The archive starts unfiltered (P2 state).
 */
export function CategoryChooser({
  categories,
  videos,
  active,
  onSelect,
}: {
  categories: Category[];
  /** the whole archive — for the reel counts + totals */
  videos: Video[];
  /** currently displayed Category; null → whole archive still on stage */
  active: Category | null;
  onSelect: (category: Category) => void;
}) {
  const countFor = (slug: Category["slug"]) =>
    videos.filter((v) => v.category === slug).length;

  return (
    <section
      id="section-chooser"
      aria-label="Choose a Category"
      className="relative flex flex-col gap-12 px-6 pt-28 pb-16 md:px-10 md:pt-40 md:pb-24 lg:px-[calc(2.5rem+var(--rail-w))]"
    >
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-5">
          <span aria-hidden className="block w-14 border-t border-hairline" />
          <p className="font-meta text-[0.6rem] tracking-[0.5em] text-smoke">
            THE ARCHIVE · {videos.length} REELS · {categories.length} CATEGORIES
          </p>
        </div>
        <h2 className="font-display text-[clamp(2.75rem,7vw,6.5rem)] uppercase leading-none tracking-[0.04em] text-bone [text-wrap:balance]">
          Pick a Category
        </h2>
      </header>

      {/* typographic cards — one per Category, spine accent on the number */}
      {/* four across only once the film rails have room for it; 1024–1279
          keeps two up so the category labels never wrap */}
      <div className="grid grid-cols-1 gap-px border border-hairline bg-hairline sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => {
          const isActive = active?.slug === category.slug;
          const spine = CATEGORY_SPINE[category.slug];
          return (
            <button
              key={category.slug}
              type="button"
              onClick={() => onSelect(category)}
              aria-pressed={isActive}
              className={`group relative flex flex-col gap-8 p-6 text-left transition-colors duration-300 ${
                isActive
                  ? "bg-bone/[0.07] hover:bg-bone/[0.1] active:bg-bone/[0.16]"
                  : "bg-ink-2 hover:bg-bone/5 active:bg-bone/10"
              }`}
            >
              <span className="flex items-baseline justify-between gap-4">
                <span
                  className={`font-meta text-[0.65rem] tracking-[0.55em] ${spine.accent}`}
                >
                  CATEGORY {category.number}
                </span>
                <span className="font-meta text-[0.55rem] tracking-[0.3em] text-smoke tabular-nums">
                  {countFor(category.slug)} REELS
                </span>
              </span>

              <span className="font-display text-[clamp(1.75rem,3vw,2.75rem)] uppercase leading-none tracking-[0.04em] text-bone">
                {category.title}
              </span>

              <span className="flex items-center gap-3 font-meta text-[0.55rem] tracking-[0.4em] text-smoke transition-colors duration-300 group-hover:text-amber">
                <span
                  aria-hidden
                  className={`block h-px w-8 transition-colors duration-300 ${
                    isActive ? "w-14 bg-amber" : "bg-hairline"
                  }`}
                />
                {isActive ? "ON STAGE" : "PUT ON STAGE"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

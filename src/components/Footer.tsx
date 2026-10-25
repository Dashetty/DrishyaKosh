"use client";

import type { Category } from "@/types";
import { CATEGORY_SPINE } from "@/lib/reelTokens";
import { useLenisInstance } from "@/lib/smooth-scroll";

/**
 * Footer — FLIP IT OVER (the only return-to-top) + one direct line per
 * Category. Post-cutover (ADR-0006): the rows drive the carousel through the
 * page's pick handler (same reset + glide as the chooser) when one is
 * provided; without a handler they fall back to legacy anchor scrolling.
 * "END OF REEL." copy retired with the strip.
 */
export function Footer({
  categories,
  onPickCategory,
}: {
  categories: Category[];
  /** drives CategoryChooser's pick — re-keys the deck and glides to it */
  onPickCategory?: (category: Category) => void;
}) {
  const lenis = useLenisInstance();

  const flipItOver = () => {
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.6 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // one direct line per Category — a fast hand to the carousel pick (the
  // same reset + glide as the chooser) when the page provides the handler
  const toCategory = (
    e: React.MouseEvent<HTMLAnchorElement>,
    category: Category,
  ) => {
    e.preventDefault();
    if (onPickCategory) {
      onPickCategory(category);
      return;
    }
    if (lenis) {
      lenis.scrollTo("#section-carousel", { duration: 1.4 });
    } else {
      document
        .getElementById("section-carousel")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="relative flex flex-col items-center gap-10 px-6 pb-20 pt-28 text-center">
      <p aria-hidden className="block w-24 border-t border-hairline" />
      <button
        type="button"
        onClick={flipItOver}
        className="ticket-stub inline-flex min-h-11 items-center justify-center border border-bone/30 px-7 py-3 font-meta text-[0.65rem] tracking-[0.4em] text-bone transition-colors duration-300 hover:border-amber hover:bg-amber hover:text-ink"
      >
        FLIP IT OVER →
      </button>

      {/* GET THE REEL — one direct line per Category (reel counts live in
          the chooser); spine color on the category number */}
      <nav aria-label="Pick a Category" className="w-full max-w-sm">
        <p className="font-meta text-[0.6rem] tracking-[0.5em] text-smoke">
          GET THE REEL —
        </p>
        <ul className="mt-4 divide-y divide-hairline border-y border-hairline">
          {categories.map((category) => (
            <li key={category.slug}>
              <a
                href="#section-carousel"
                onClick={(e) => toCategory(e, category)}
                className="group flex min-h-11 items-center justify-between gap-4 px-2 py-3 font-meta text-[0.7rem] tracking-[0.35em] transition-colors duration-300 hover:bg-bone/5"
              >
                <span className={`${CATEGORY_SPINE[category.slug].accent}`}>
                  CATEGORY {category.number}
                </span>
                <span className="text-bone transition-colors duration-300 group-hover:text-bone">
                  {category.title.toUpperCase()}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <p className="font-body text-[0.7rem] text-smoke">
        A personal archive curated by Hardeep Dilip Shetty · {new Date().getFullYear()}
      </p>
    </footer>
  );
}

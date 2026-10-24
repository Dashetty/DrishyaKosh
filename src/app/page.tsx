"use client";

import { useState } from "react";
import { Hero } from "@/components/Hero";
import { SiteNav } from "@/components/SiteNav";
import { CategoryChooser } from "@/components/CategoryChooser";
import { ReelCarousel } from "@/components/ReelCarousel";
import { Footer } from "@/components/Footer";
import { useLenisInstance } from "@/lib/smooth-scroll";
import { categories, videos } from "@/data/videos";
import type { Category } from "@/types";

/**
 * The page composition post-cutover (ADR-0006 §3):
 * Hero → CategoryChooser → ReelCarousel stage → Footer.
 * The linear strip (ReelStrip/Intertitle) is unwired; files remain.
 * Selection state lives here so Footer rows can drive the same pick:
 * re-key the deck (index resets to 0), then glide to the stage top.
 */
export default function Home() {
  const [active, setActive] = useState<Category | null>(null);
  const lenis = useLenisInstance();

  const chooseCategory = (category: Category) => {
    setActive(category);
    // glide to the stage — the section's top never moves, so the numeric
    // target stays valid while the deck's own height re-keys
    const stage = document.getElementById("section-carousel");
    if (!stage) return;
    const top = window.scrollY + stage.getBoundingClientRect().top;
    if (lenis) {
      lenis.scrollTo(top, { duration: 1.4 });
    } else {
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const shown = active ? videos.filter((v) => v.category === active.slug) : videos;

  return (
    <>
      <SiteNav />
      <Hero />
      <main>
        <CategoryChooser
          categories={categories}
          videos={videos}
          active={active}
          onSelect={chooseCategory}
        />
        <ReelCarousel videos={shown} category={active} />
      </main>
      <Footer categories={categories} onPickCategory={chooseCategory} />
    </>
  );
}

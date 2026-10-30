"use client";

import { useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { Prelude } from "@/components/Prelude";
import { SiteNav } from "@/components/SiteNav";
import { ReelCarousel } from "@/components/ReelCarousel";
import { Footer } from "@/components/Footer";
import { useLenisInstance } from "@/lib/smooth-scroll";
import { categories, videos } from "@/data/videos";
import type { Category } from "@/types";

/**
 * The page composition (ADR-0007 above the hero; ADR-0006's chooser is
 * unwired — the hero runs straight into the archive stage, and the
 * Footer's category rows remain the way to filter the deck).
 * Prelude → Hero → ReelCarousel stage → Footer.
 * The linear strip (ReelStrip/Intertitle) and CategoryChooser are unwired;
 * files remain.
 * Selection state lives here so Footer rows can drive the same pick:
 * re-key the deck (index resets to 0), then glide to the stage top.
 */
export default function Home() {
  const [active, setActive] = useState<Category | null>(null);
  const lenis = useLenisInstance();

  // Deep link the active Category (?category=slug) — read on mount only,
  // since this route is statically prerendered (no URL at HTML-build time).
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("category");
    if (!slug) return;
    setActive(categories.find((c) => c.slug === slug) ?? null);
  }, []);

  const chooseCategory = (category: Category) => {
    setActive(category);
    history.replaceState(null, "", `?category=${category.slug}`);
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
      <Prelude />
      <Hero />
      <main>
        <ReelCarousel videos={shown} category={active} />
      </main>
      <Footer categories={categories} onPickCategory={chooseCategory} />
    </>
  );
}

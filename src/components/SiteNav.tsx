"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Chrome zone SiteNav reports so the mark can dress for the film.
 */
export type MarkZone = "landing" | "scrub" | "archive" | "footer";

/**
 * SiteNav — fixed top-center reel mark, purely decorative (ADR-0004).
 *
 * The mark is NOT navigation and takes no input: it only wears the film —
 * ink over the red hero (landing), parked while the hero scrub runs
 * (ink-on-ink would look broken), bone over the ink archive, faded out
 * past "END OF REEL.". The archive scrolls itself; the footer's FLIP IT
 * OVER is the only return-to-top control on the page.
 */
export function SiteNav() {
  const navRef = useRef<HTMLDivElement>(null);
  const [zone, setZone] = useState<MarkZone>("landing");

  useEffect(() => {
    if (!navRef.current) return;

    // Zones come straight from live rects on a rAF-throttled scroll driver
    // (same scheme as the strip's parallax driver): no ScrollTriggers, so
    // nothing can go stale between Lenis updates, and the state the page
    // is born in is computed on the first tick.
    let raf = 0;
    const compute = () => {
      raf = 0;
      const vh = window.innerHeight;
      const mainTop =
        document.querySelector("main")?.getBoundingClientRect().top ??
        Number.POSITIVE_INFINITY;
      const heroRect = document
        .querySelector("[data-hero-scrub]")
        ?.getBoundingClientRect();
      const footerTop =
        document.querySelector("footer")?.getBoundingClientRect().top ??
        Number.POSITIVE_INFINITY;

      const inFooter = footerTop < vh * 0.85; // END OF REEL takes the screen
      const inArchive = mainTop < 72; // archive reaches the mark's row
      // parked while the hero scrub fills the viewport (ink-on-ink)
      const inHeroScrub = !!heroRect && heroRect.top < 24 && heroRect.bottom > vh;

      setZone(
        inFooter ? "footer" : inArchive ? "archive" : inHeroScrub ? "scrub" : "landing",
      );
      // ink over the red hero → bone over the ink archive and footer;
      // recolors the mark via the CSS cascade (.over-archive .reel-mark)
      navRef.current?.classList.toggle("over-archive", inArchive);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(compute, 120);
    };
    window.addEventListener("resize", onResize, { passive: true });

    raf = requestAnimationFrame(compute);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={navRef}
      className="dk-mark"
      data-zone={zone}
    >
      <span className="reel-mark block size-16 md:size-24" aria-hidden="true" />
    </div>
  );
}

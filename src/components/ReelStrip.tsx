"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Category, Video } from "@/types";
import { useLenisInstance } from "@/lib/smooth-scroll";
import { Intertitle } from "./Intertitle";
import { WatchModal } from "./WatchModal";
import { TicketFrame } from "./TicketFrame";

/**
 * The film reel — all categories and frames in one vertical strip. (Legacy
 * piece: retired at the categories cutover, ADR-0006.)
 * Scroll velocity skews the strip (film pulling through the gate). On fine
 * pointers, when the scroll comes to rest the strip ease-settles to the
 * nearest frame via Lenis — CSS scroll-snap fights Lenis, so it's reserved
 * for touch devices where Lenis stands down (see globals.css).
 */
export function ReelStrip({
  videos,
  categories,
}: {
  videos: Video[];
  categories: Category[];
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const lenis = useLenisInstance();
  const [watching, setWatching] = useState<Video | null>(null);

  // velocity → skew/rotate (film pulling through the gate)
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const skewTo = gsap.quickTo(strip, "skewY", { duration: 0.6, ease: "power3.out" });
    const rotateTo = gsap.quickTo(strip, "rotation", { duration: 0.7, ease: "power3.out" });
    const st = ScrollTrigger.create({
      trigger: strip,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const v = self.getVelocity();
        skewTo(gsap.utils.clamp(-0.6, 0.6, v / -380));
        rotateTo(gsap.utils.clamp(-0.25, 0.25, v / -900));
      },
    });
    return () => st.kill();
  }, []);

  // parallax — layered drift on the ticket's type layers; p is 0 exactly
  // when a card is centered (settle-snap guarantees that at rest), so the
  // layers always settle flush against the baked perforations/creases.
  // Rate codes map to plan §6 drift bases: title 26px counter-direction,
  // quote 10px (the artwork's catalog plate was retired 2026-10-27). Layers
  // re-queried per tick so refreshes never orphan the list.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const PX: Record<number, number> = { 150: -26, 25: 10 };
    let raf = 0;
    const tick = () => {
      raf = 0;
      const mid = window.innerHeight / 2;
      const vh = window.innerHeight;
      strip.querySelectorAll<HTMLElement>("[data-parallax-rate]").forEach((el) => {
        const base = PX[parseFloat(el.dataset.parallaxRate ?? "0")] ?? 0;
        if (!base) return;
        const card = el.closest("[data-snap-point]");
        if (!card) return;
        const r = card.getBoundingClientRect();
        const p = gsap.utils.clamp(-0.5, 0.5, (r.top + r.height / 2 - mid) / vh);
        el.style.transform = `translate3d(0, ${(p * base * 2).toFixed(2)}px, 0)`;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(tick, 120);
    };
    window.addEventListener("resize", onResize, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // settle-snap: after the scroll truly comes to rest, ease to the nearest frame (Lenis only)
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || !lenis) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let snapping = false;

    const onScroll = () => {
      if (snapping) return; // our own scrollTo must not re-arm the debounce
      if (timer) clearTimeout(timer);
      // only snap once Lenis reports a full stop — not mid-glide
      timer = setTimeout(() => {
        if (
          document.documentElement.classList.contains("projector-hold") ||
          lenis.isScrolling
        ) {
          return;
        }
        const mid = window.innerHeight / 2;
        let best: { dist: number } | null = null;
        strip.querySelectorAll<HTMLElement>("[data-snap-point]").forEach((el) => {
          // viewport-relative geometry — offsetTop is strip-relative, not document-relative
          const center = el.getBoundingClientRect().top + el.offsetHeight / 2;
          const dist = center - mid;
          if (!best || Math.abs(dist) < Math.abs(best.dist)) {
            best = { dist };
          }
        });
        if (!best) return;
        const { dist } = best;
        if (Math.abs(dist) > 8 && Math.abs(dist) < window.innerHeight * 0.45) {
          snapping = true;
          lenis.scrollTo(window.scrollY + dist, {
            duration: 0.65,
            easing: (t: number) => 1 - Math.pow(1 - t, 3),
            // re-arm on completion; user input clears the flag immediately
            onComplete: () => {
              snapping = false;
            },
          });
        }
      }, 150);
    };

    const onUserInput = () => {
      snapping = false;
      lenis.off("scroll", onScroll);
      lenis.on("scroll", onScroll);
    };

    lenis.on("scroll", onScroll);
    window.addEventListener("wheel", onUserInput, { passive: true });
    return () => {
      lenis.off("scroll", onScroll);
      window.removeEventListener("wheel", onUserInput);
      if (timer) clearTimeout(timer);
    };
  }, [lenis]);

  return (
    <>
      <div
        ref={stripRef}
        className="snap-strip relative will-change-transform"
        style={{ transformOrigin: "50% 50%" }}
      >
        {categories.map((category) => (
          <Fragment key={category.slug}>
            <Intertitle category={category} />
            {videos
              .filter((v) => v.category === category.slug)
              .map((video) => (
                <div
                  key={video.id}
                  data-snap-point
                  className="flex justify-center py-[6vh] md:py-[8vh]"
                >
                  <TicketFrame
                    video={video}
                    category={category}
                    onWatch={setWatching}
                  />
                </div>
              ))}
          </Fragment>
        ))}
      </div>

      <WatchModal video={watching} onClose={() => setWatching(null)} />
    </>
  );
}

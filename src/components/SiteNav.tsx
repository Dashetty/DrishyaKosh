"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useLenisInstance } from "@/lib/smooth-scroll";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * SiteNav — fixed top-center reel-mark logo.
 *
 * The mark (public/mark-reel.avif) is ink-black on transparency; it wears
 * whichever token color we need via CSS mask (globals.css `.reel-mark`),
 * so the same file works over every section:
 *   - over the signal-red hero  → ink
 *   - over the ink archive      → bone (flipped by a ScrollTrigger on <main>)
 * Click flips the projector back to reel one (scroll to top), same as the
 * footer's FLIP IT OVER. Recolors (and hides/parks) with scroll — a film
 * mark threaded to the film, not pasted on top of it.
 */
export function SiteNav() {
  const navRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const lenis = useLenisInstance();
  const reduced = useReducedMotion();

  useEffect(() => {
    // Register - both here and in the files that own their own scrub timelines.
    gsap.registerPlugin(ScrollTrigger);

    if (!navRef.current) return;

    const fadeDur = reduced ? 0 : 0.45;

    // Resolve triggers at DOCUMENT scope: gsap.context scopes selector
    // STRINGS to the given element (the tiny nav) and they would silently
    // match nothing — hand ScrollTrigger live elements instead.
    const mainEl = document.querySelector("main");
    const heroEl = document.querySelector("[data-hero-scrub]");
    const mark = markRef.current;
    if (!mark) return;
    const cleanupFns: Array<() => void> = [];

    // ink over the red hero → bone over the ink archive and footer.
    // ReelStrip and Footer both sit on the body's ink background (no
    // per-section backgrounds), so a single <main> trigger covers both.
    // Archive entry is also where the mark returns from hiding.
    const flipST = ScrollTrigger.create({
      trigger: mainEl,
      start: "top 72px", // when the archive reaches the nav's row
      end: 99999,
      onToggle: (self) => {
        navRef.current?.classList.toggle("over-archive", self.isActive);
        // show only on entry; hiding on the way back up belongs to the
        // hero-zone trigger below — don't fight it here
        if (self.isActive) {
          gsap.to(mark, {
            opacity: 1,
            y: 0,
            duration: fadeDur,
            ease: "power2.out",
            overwrite: "auto",
          });
        }
      },
    });

    // hidden while the hero scrub runs — the mark would sit ink-on-ink
    // over the squeezed DRISHYA band. Returns at the archive (flip above)
    // or back at the landing (onLeaveBack below).
    const parkST = heroEl
      ? ScrollTrigger.create({
          trigger: heroEl,
          start: "top+=24px top", // keep the landing beat before hiding
          end: "bottom bottom",
          onToggle: (self) => {
            gsap.to(mark, {
              opacity: self.isActive ? 0 : 1,
              y: self.isActive ? -8 : 0,
              duration: fadeDur,
              ease: "power2.out",
              overwrite: "auto",
            });
          },
        })
      : null;

    // initial visibility sync: ScrollTrigger doesn't call onToggle for the
    // state the page is born in (e.g. reload mid-scrub or mid-archive) —
    // set the mark to match. The entry tween only runs for the "born
    // visible" cases (landing / archive), never mid-scrub.
    if (parkST?.isActive && !flipST.isActive) {
      gsap.set(mark, { opacity: 0, y: -8 });
    } else {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          mark,
          { opacity: 0 },
          {
            opacity: 1,
            y: 0,
            duration: reduced ? 0 : 0.7,
            ease: "power2.out",
            delay: reduced ? 0 : 0.2,
          }
        );
      }, navRef);
      cleanupFns.push(() => ctx.revert());
    }

    return () => {
      flipST.kill();
      parkST?.kill();
      for (const fn of cleanupFns) fn();
    };
  }, [reduced]);

  // hover: the reel rolls a quarter-turn each pass — restraint everywhere
  // else, but a rotating object begs to be spun. Reduced motion: none.
  const onEnter = () => {
    if (reduced || !markRef.current) return;
    gsap.to(markRef.current, {
      rotate: gsap.getProperty(markRef.current, "rotate") as number + 90,
      duration: 0.55,
      ease: "power2.inOut",
      overwrite: "auto",
    });
  };

  return (
    <div ref={navRef} className="fixed inset-x-0 top-0 z-40 flex justify-center">
      <Link
        href="/"
        onClick={(e) => {
          e.preventDefault();
          if (lenis) lenis.scrollTo(0, { duration: 1.6 });
          else window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        aria-label="DrishyaKosh — back to top"
        className="block touch-manipulation px-6 py-4 md:py-5"
        onMouseEnter={onEnter}
      >
        <span
          ref={markRef}
          className="reel-mark block size-16 md:size-24 will-change-transform"
        />
      </Link>
    </div>
  );
}

"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Reel, Video } from "@/types";
import { useLenisInstance } from "@/lib/smooth-scroll";
import { Intertitle } from "./Intertitle";
import { Frame } from "./Frame";
import { WatchModal } from "./WatchModal";
import { DrumStage } from "./DrumStage";

/**
 * The film reel — all reels and frames in one vertical strip.
 * Scroll velocity skews the strip (film pulling through the gate). On fine
 * pointers, when the scroll comes to rest the strip ease-settles to the
 * nearest frame via Lenis — CSS scroll-snap fights Lenis, so it's reserved
 * for touch devices where Lenis stands down (see globals.css).
 */
export function ReelStrip({ videos, reels }: { videos: Video[]; reels: Reel[] }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const drumAnchorRef = useRef<HTMLElement>(null);
  const lenis = useLenisInstance();
  const [watching, setWatching] = useState<Video | null>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);

  // the Drum only mounts when motion is allowed (ADR-0002 D9 fallback)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionAllowed(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // velocity → skew/rotate (film pulling through the gate)
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const skewTo = gsap.quickTo(strip, "skewY", { duration: 0.8, ease: "power3" });
    const rotateTo = gsap.quickTo(strip, "rotate", { duration: 0.9, ease: "power3" });
    const st = ScrollTrigger.create({
      trigger: strip,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const v = self.getVelocity();
        skewTo(gsap.utils.clamp(-1.5, 1.5, v / -400));
        rotateTo(gsap.utils.clamp(-0.6, 0.6, v / -1200));
      },
    });
    return () => st.kill();
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
        strip.querySelectorAll<HTMLElement>("[data-frame]").forEach((el) => {
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

  // the scroll-mode archive stands down while the drum is pinned
  // (gsap skew + settle-snap stop responding; the DOM stays for fallback)
  useEffect(() => {
    const deactivate = () => stripRef.current?.classList.add("drum-standby");
    const activate = () => stripRef.current?.classList.remove("drum-standby");
    window.addEventListener("dk:drum:pin", deactivate);
    window.addEventListener("dk:drum:unpin", activate);
    return () => {
      window.removeEventListener("dk:drum:pin", deactivate);
      window.removeEventListener("dk:drum:unpin", activate);
    };
  }, []);

  // clear the re-pin suppression flag once we're past the pin zone
  // (the sentinel's bottom has scrolled completely off screen)
  useEffect(() => {
    const anchor = drumAnchorRef.current;
    if (!anchor) return;
    const clearOnUnpin = () => {
      const rect = anchor.getBoundingClientRect();
      if (rect.bottom < 0) {
        window.dispatchEvent(new CustomEvent("dk:drum:clear-suppress"));
      }
    };
    window.addEventListener("dk:drum:unpin", clearOnUnpin);
    return () => window.removeEventListener("dk:drum:unpin", clearOnUnpin);
  }, []);

  const unpinDrum = () => {
    window.dispatchEvent(new CustomEvent("dk:drum:unpin"));
    lenis?.start();
  };

  // the stage's footer exit asks the host to ease down once it has unpinned
  useEffect(() => {
    const onScrollTo = (e: Event) => {
      const target = (e as CustomEvent<number>).detail ?? document.body.scrollHeight;
      if (lenis) {
        lenis.scrollTo(target, { duration: 1.2 });
      } else {
        window.scrollTo({ top: target, behavior: "smooth" });
      }
    };
    window.addEventListener("dk:drum:scroll-to", onScrollTo);
    return () => window.removeEventListener("dk:drum:scroll-to", onScrollTo);
  }, [lenis]);

  return (
    <>
      {/* drum mount anchor: a full-viewport sentinel at the archive's start —
          scrolling from the hero crosses it and pins the drum */}
      <section
        ref={drumAnchorRef}
        aria-hidden
        className="h-[100svh] w-full"
      />

      <div
        ref={stripRef}
        className="snap-strip relative will-change-transform"
        style={{ transformOrigin: "50% 50%" }}
      >
        {reels.map((reel) => (
          <Fragment key={reel.slug}>
            <Intertitle reel={reel} />
            {videos
              .filter((v) => v.reel === reel.slug)
              .map((video) => (
                <div
                  key={video.id}
                  data-snap-point
                  className="flex justify-center py-[6vh] md:py-[8vh]"
                >
                  <Frame
                    video={video}
                    reelNumber={reel.number}
                    onWatch={setWatching}
                  />
                </div>
              ))}
          </Fragment>
        ))}
      </div>

      {motionAllowed && (
        <DrumStage
          anchorRef={drumAnchorRef}
          onUnpin={unpinDrum}
          onExitToFooter={() => {
            /* handled inside the stage via dk:drum:scroll-to */
          }}
          onWatch={setWatching}
        />
      )}

      <WatchModal video={watching} onClose={() => setWatching(null)} />
    </>
  );
}

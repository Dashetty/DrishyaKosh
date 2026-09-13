"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

function subscribePointerMedia(onChange: () => void) {
  const mq = window.matchMedia("(pointer: fine)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
import { reels, videos } from "@/data/videos";
import type { Reel, Video } from "@/types";
import { useDrum } from "@/lib/useDrum";
import { DrumFrameCard } from "./DrumFrameCard";
import { DrumIntertitleCard } from "./DrumIntertitleCard";
import { DrumRail } from "./DrumRail";

/**
 * The Drum (ADR-0002 + ADR-0003): a pinned full-viewport stage the archive
 * scrolls into. Vertical roll is bounded to the active Reel's loop
 * (Intertitle + that Reel's Frames); the Rail switches Reels with a full
 * physics reset. Unpin-at-top applies only to Reel 01's Intertitle.
 */
export function DrumStage({
  anchorRef,
  onUnpin,
  onExitToFooter,
  onWatch,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  onUnpin: () => void;
  onExitToFooter: () => void;
  onWatch: (video: Video) => void;
}) {
  const [pinned, setPinned] = useState(false);
  const [activeReel, setActiveReel] = useState<Reel>(reels[0]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  // resetTo ref: the seam listener stays unbound from `drum` identity churn
  const drumResetRef = useRef<(() => void) | null>(null);

  // active reel's loop: [intertitle, ...frames] — derived state, not ref.
  // activeIndex clamped to the loop: a reel switch resets it in the same
  // render, but the engine may report a stale index first — never trust it
  // beyond the loop's bounds.
  const reelVideos = videos.filter((v) => v.reel === activeReel.slug);
  const loopItems: (Reel | Video)[] = [activeReel, ...reelVideos];
  const count = loopItems.length;
  const safeIndex = Math.min(activeIndex, count - 1);
  const safeActiveIndex = Math.max(0, safeIndex);

  // touch detection: blur off on coarse pointers (ADR-0002 D5) —
  // external-store read, no effect setState
  const isTouch = useSyncExternalStore(
    subscribePointerMedia,
    () => !window.matchMedia("(pointer: fine)").matches,
    () => false
  );

  // projector hold: the drum stands down while the lightbox is open
  useEffect(() => {
    let frame = 0;
    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setModalOpen(
          document.documentElement.classList.contains("projector-hold")
        )
      );
    };
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    check();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const drum = useDrum({
    count,
    onActiveChange: setActiveIndex,
    blurEnabled: !isTouch,
    active: pinned && !modalOpen,
  });
  useEffect(() => {
    drumResetRef.current = drum.resetTo;
  }, [drum]);

  // the engine's unpin-at-top boundary: wheel-up past the loop's first card.
  // Event-based (not a ref-threaded callback) so the freshest listener always
  // handles it, regardless of StrictMode remounts.
  useEffect(() => {
    const onUnpinAtTop = () => {
      setPinned(false);
      onUnpin();
    };
    window.addEventListener("dk:drum:unpin-at-top", onUnpinAtTop);
    return () => window.removeEventListener("dk:drum:unpin-at-top", onUnpinAtTop);
  }, [onUnpin]);

  // pin seam: pin when the sentinel ENTERS from below — its top crosses
  // above the 62% line while its bottom is still below the viewport top
  // (an exit scroll passing the sentinel must NOT re-pin).
  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const check = () => {
      if (document.documentElement.classList.contains("drum-pinned")) return;
      const rect = anchor.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.62 && rect.bottom > 0) {
        setPinned(true);
        drumResetRef.current?.(0);
      }
    };
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
    // deliberately NOT depending on `drum` or `pinned` (the class check guards)
  }, [anchorRef]);

  // while pinned: lock document scroll. No restore-on-cleanup: the unpin
  // boundary effect below repositions the page deliberately, and a restore
  // scroll here would hand a scroll event to the re-pin listener mid-flip.
  useEffect(() => {
    if (!pinned) return;
    document.documentElement.classList.add("drum-pinned");
    return () => {
      document.documentElement.classList.remove("drum-pinned");
    };
  }, [pinned]);

  // the unpin boundary: leaving the drum must also leave the pin zone —
  // the pin scroll-listener would otherwise re-pin on the same position.
  // Park the page above the sentinel's 62% line with half a viewport spare.
  useEffect(() => {
    if (pinned) return;
    const sentinel = anchorRef.current;
    if (!sentinel) return;
    const sentinelTop = sentinel.getBoundingClientRect().top + window.scrollY;
    const safeTop = sentinelTop - window.innerHeight * 0.62 - window.innerHeight * 0.5;
    if (window.scrollY > safeTop) {
      window.scrollTo({ top: Math.max(0, safeTop) });
    }
  }, [pinned, anchorRef]);

  // notify Lenis of the pin state change
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(pinned ? "dk:drum:pin" : "dk:drum:unpin")
    );
  }, [pinned]);

  const switchReel = (reel: Reel) => {
    if (reel.slug === activeReel.slug) return;
    setActiveReel(reel);
    // full reset — ADR-0003 D9: nothing carries over between reels
    drum.resetTo(0);
    setActiveIndex(0);
  };

  // the engine's unpin boundary and the Rail's footer exit both route here;
  // unmounting the stage restores scroll exactly (effect cleanup)
  const unpin = () => setPinned(false);
  const exitToFooter = () => {
    setPinned(false);
    // let the stage unmount and scroll unlock before easing down
    requestAnimationFrame(() => {
      const target = document.body.scrollHeight;
      window.dispatchEvent(new CustomEvent("dk:drum:scroll-to", { detail: target }));
    });
  };

  const currentCard: Reel | Video = loopItems[safeActiveIndex] ?? activeReel;
  const isReelOne = activeReel.slug === "reel-01";

  if (!pinned) return null;

  return (
    <div
      className="drum-stage fixed inset-0 z-20 flex items-center justify-center overflow-hidden select-none"
      aria-label={`${activeReel.title} reel, card ${safeActiveIndex + 1} of ${count}`}
    >
      <div
        ref={(el) => {
          drum.registerFramesLayer(el);
        }}
        className="relative flex h-full w-full items-center justify-center"
      >
        {loopItems.map((item, index) => {
          const isCenter = index === safeActiveIndex;
          if ("slug" in item) {
            return (
              <DrumIntertitleCard
                key={`${item.slug}-${index}`}
                reel={item}
                isActive={isCenter}
                showScrollUpCue={isCenter && isReelOne}
                registerCard={(el) => drum.registerCard(index, el)}
              />
            );
          }
          return (
            <DrumFrameCard
              key={`${item.id}-${index}`}
              video={item}
              reelNumber={activeReel.number}
              isActive={isCenter}
              registerCard={(el) => drum.registerCard(index, el)}
              registerLayer={(el, rate) => drum.registerLayer(index, el, rate)}
              onWatch={onWatch}
            />
          );
        })}
      </div>

      <DrumRail
        reels={reels}
        activeReel={activeReel}
        onSwitch={switchReel}
        currentCard={currentCard}
        position={{ index: safeActiveIndex, count }}
        onExitToFooter={exitToFooter}
      />
    </div>
  );
}

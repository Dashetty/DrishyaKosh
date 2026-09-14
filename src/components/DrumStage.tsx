"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

function subscribePointerMedia(onChange: () => void) {
  const mq = window.matchMedia("(pointer: fine)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * Seam crossfade progress p ∈ [0,1] — continuous everywhere. Approaching from
 * above (rect.top: vh → 0) and exiting downward (rect.bottom: vh → 0) share
 * one cubic ease-in, so the stage is imperceptible while the page owns
 * the screen, hands off gradually mid-scroll, and hits full opacity exactly
 * when the sentinel covers the viewport. Pinned forces 1. The old gated
 * version (opacity 0 until 0.6vh, then a jump to `entered`) popped in a
 * single frame — this replaces it with no discontinuity at any boundary.
 */
function seamProgress(rect: DOMRect, vh: number, pinnedNow: boolean): number {
  if (pinnedNow) return 1;
  const x = rect.top >= 0 ? 1 - rect.top / vh : rect.bottom / vh;
  return Math.min(1, Math.max(0, x)) ** 3;
}

function applySeamProgress(stage: HTMLElement, p: number) {
  stage.style.opacity = String(p);
  stage.style.transform = `scale(${(0.96 + 0.04 * p).toFixed(4)})`;
  stage.style.pointerEvents = p >= 0.96 ? "auto" : "none";
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
  const drumResetRef = useRef<((index?: number) => void) | null>(null);

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
  // handles it, regardless of StrictMode remounts. Arms the suppression
  // flag so the seam listener does not re-pin during the unpin glide.
  useEffect(() => {
    const onUnpinAtTop = () => {
      window.dispatchEvent(new CustomEvent("dk:drum:intentional-unpin"));
      setPinned(false);
      onUnpin();
    };
    window.addEventListener("dk:drum:unpin-at-top", onUnpinAtTop);
    return () => window.removeEventListener("dk:drum:unpin-at-top", onUnpinAtTop);
  }, [onUnpin]);

  // pin + crossfade seam: coverage-based opacity and guard flags.
  // When the sentinel fully covers the viewport from above, the drum pins
  // with a crossfade (scale 0.96→1, opacity 0→1). When exiting downward
  // the sentinel leaves the viewport, the stage fades out and unpins.
  // An intentional unpin (unpin-at-top or exit-to-footer) arms a
  // suppression flag to block auto-re-pin while gliding past.
  const stageRef = useRef<HTMLDivElement>(null);
  const suppressRePinRef = useRef(false);

  // arm on intentional unpin: prevents deadlock on footer glide.
  // auto-clears after 200ms so a fresh scroll re-entry can re-pin; the footer
  // glide (1.2s) is protected because the stage is mid-fade-out during it.
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const arm = () => {
      suppressRePinRef.current = true;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => { suppressRePinRef.current = false; }, 200);
    };
    window.addEventListener("dk:drum:intentional-unpin", arm);
    return () => {
      window.removeEventListener("dk:drum:intentional-unpin", arm);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const apply = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const pinnedNow = document.documentElement.classList.contains("drum-pinned");
      const rect = anchor.getBoundingClientRect();
      const vh = window.innerHeight;

      const p = seamProgress(rect, vh, pinnedNow);
      applySeamProgress(stage, p);

      // pin once the sentinel fully covers the viewport from above
      // (and we're not suppressing re-pin from a prior intentional unpin)
      if (!pinnedNow && !suppressRePinRef.current && rect.top <= 2 && rect.bottom > 0) {
        setPinned(true);
        drumResetRef.current?.(0);
      }

      // unpin once the sentinel has fully left the viewport downward
      if (pinnedNow && rect.bottom <= 0) {
        setPinned(false);
      }
    };
    apply();
    window.addEventListener("scroll", apply, { passive: true });
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
    };
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

  // unpin-at-top park: smooth glide back up to the hero viewport (replaces
  // the old hard cut), and arm the suppression flag so the seam listener
  // does not re-pin during the glide.
  useEffect(() => {
    if (pinned) return;
    const sentinel = anchorRef.current;
    if (!sentinel) return;
    const sentinelAbs = sentinel.getBoundingClientRect().top + window.scrollY;
    const parkTop = Math.max(0, sentinelAbs - window.innerHeight * 0.62 - window.innerHeight * 0.5);
    if (window.scrollY > parkTop) {
      window.dispatchEvent(new CustomEvent("dk:drum:intentional-unpin"));
      window.dispatchEvent(new CustomEvent("dk:drum:scroll-to", { detail: parkTop }));
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

  // the engine's unpin-at-top boundary and the Rail's footer exit both
  // route here. Unpin arms the suppression flag so the seam listener
  // does not re-pin while Lenis glides us out of the pin zone.
  const unpin = () => {
    window.dispatchEvent(new CustomEvent("dk:drum:intentional-unpin"));
    setPinned(false);
  };
  const exitToFooter = () => {
    window.dispatchEvent(new CustomEvent("dk:drum:intentional-unpin"));
    setPinned(false);
    // let Lenis ease down to the footer; the crossfade seam will fade out
    // as we scroll through the pin zone
    requestAnimationFrame(() => {
      const target = document.body.scrollHeight;
      window.dispatchEvent(new CustomEvent("dk:drum:scroll-to", { detail: target }));
    });
  };

  // During Lenis-powered scrolls (footer exit), native scroll events are
  // throttled/delayed, so drive the crossfade opacity via a rAF loop that
  // recomputes the seam state each frame until we're clear of the pin zone.
  useEffect(() => {
    if (pinned) return;
    const anchor = anchorRef.current;
    if (!anchor) return;
    let rafId = 0;
    const tick = () => {
      const stage = stageRef.current;
      const anchorEl = anchorRef.current;
      if (!stage || !anchorEl) return;
      const pinnedNow = document.documentElement.classList.contains("drum-pinned");
      const rect = anchorEl.getBoundingClientRect();
      const vh = window.innerHeight;

      const p = seamProgress(rect, vh, pinnedNow);
      applySeamProgress(stage, p);

      // keep ticking until the stage has fully faded (Lenis-powered glides
      // may not emit a native scroll event every frame, so the scroll
      // listener alone can miss frames)
      if (!pinnedNow && p > 0) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [pinned, anchorRef]);

  const currentCard: Reel | Video = loopItems[safeActiveIndex] ?? activeReel;
  const isReelOne = activeReel.slug === "reel-01";

  // always mounted: the seam crossfades this element via inline opacity/
  // transform as the sentinel scrolls through the viewport. It only unmounts
  // when reduced-motion disables the drum entirely.
  return (
    <div
      ref={stageRef}
      className="drum-stage fixed inset-0 z-20 flex items-center justify-center overflow-hidden select-none"
      style={{ opacity: 0, pointerEvents: "none" }}
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

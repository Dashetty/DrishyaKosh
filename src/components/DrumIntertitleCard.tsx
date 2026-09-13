"use client";

import type { Reel } from "@/types";

/** A Reel's title card as a drum item — the silent-film intertitle. */
export function DrumIntertitleCard({
  reel,
  isActive,
  showScrollUpCue,
  registerCard,
}: {
  reel: Reel;
  isActive: boolean;
  showScrollUpCue: boolean;
  registerCard: (el: HTMLElement | null) => void;
}) {
  return (
    <div
      ref={registerCard}
      className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center justify-center px-6 will-change-transform"
      aria-hidden={!isActive}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-5">
          <span aria-hidden className="block w-14 border-t border-hairline" />
          <span className="font-meta text-[0.65rem] tracking-[0.55em] text-amber">
            REEL {reel.number}
          </span>
          <span aria-hidden className="block w-14 border-t border-hairline" />
        </div>
        <h2 className="font-display text-[clamp(3.5rem,12vw,9rem)] uppercase leading-none tracking-[0.06em] text-bone">
          {reel.title}
        </h2>
        {showScrollUpCue && (
          <p className="mt-6 font-meta text-[0.55rem] tracking-[0.4em] text-smoke">
            SCROLL UP TO LEAVE THE ARCHIVE
          </p>
        )}
      </div>
    </div>
  );
}

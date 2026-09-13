"use client";

import type { Reel, Video } from "@/types";

/**
 * The Rail + HUD (ADR-0003 D4): Reel tabs, catalog readout, progress ticks,
 * and the permanent footer exit — one fixed top-center readout.
 */
export function DrumRail({
  reels,
  activeReel,
  onSwitch,
  currentCard,
  position,
  onExitToFooter,
}: {
  reels: Reel[];
  activeReel: Reel;
  onSwitch: (reel: Reel) => void;
  currentCard: Reel | Video;
  position: { index: number; count: number };
  onExitToFooter: () => void;
}) {
  const isIntertitle = "slug" in currentCard;
  const cardLabel = isIntertitle
    ? "REEL " + ("number" in currentCard ? currentCard.number : "")
    : `${currentCard.catalogNumber} — ${currentCard.title.toUpperCase()}`;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-6 z-30 flex flex-col items-center gap-3">
      {/* Reel tabs — the Rail */}
      <nav
        aria-label="Reels"
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-hairline bg-ink/70 px-2 py-1.5 backdrop-blur-sm"
      >
        {reels.map((reel) => {
          const isActive = reel.slug === activeReel.slug;
          return (
            <button
              key={reel.slug}
              type="button"
              onClick={() => onSwitch(reel)}
              aria-current={isActive ? "true" : undefined}
              className={`rounded-full px-3.5 py-1.5 font-meta text-[0.55rem] tracking-[0.3em] transition-colors duration-200 ${
                isActive
                  ? "bg-bone text-ink"
                  : "text-bone-dim hover:text-bone"
              }`}
            >
              {reel.title.toUpperCase()}
            </button>
          );
        })}
      </nav>

      {/* catalog readout + progress ticks + footer exit */}
      <div className="flex items-center gap-4">
        <p
          aria-live="polite"
          className="font-meta text-[0.55rem] tracking-[0.35em] text-bone-dim"
        >
          {cardLabel} · {position.index + 1}/{position.count}
        </p>
        <div aria-hidden className="flex items-center gap-1">
          {Array.from({ length: position.count }, (_, i) => (
            <span
              key={i}
              className={`h-px w-3 transition-colors duration-200 ${
                i === position.index ? "bg-amber" : "bg-hairline"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onExitToFooter}
          className="pointer-events-auto font-meta text-[0.55rem] tracking-[0.3em] text-smoke underline-offset-4 transition-colors hover:text-amber"
        >
          END OF REEL ↓
        </button>
      </div>
    </div>
  );
}

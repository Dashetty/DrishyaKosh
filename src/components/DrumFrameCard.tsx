"use client";

import { useState } from "react";
import { thumbnailUrl, type Video } from "@/types";

/**
 * A Frame as a drum card (ADR-0002 D6, siena mapping): poster anchored,
 * catalog corner 120%, CAPS title + credits 150%, curator quote 25%,
 * WATCH anchored. Only the centered card accepts interaction.
 */
export function DrumFrameCard({
  video,
  reelNumber,
  isActive,
  registerCard,
  registerLayer,
  onWatch,
}: {
  video: Video;
  reelNumber: string;
  isActive: boolean;
  registerCard: (el: HTMLElement | null) => void;
  registerLayer: (el: HTMLElement | null, rate: number) => void;
  onWatch: (video: Video) => void;
}) {
  const [src] = useState(thumbnailUrl(video.youtubeId));

  return (
    <article
      ref={registerCard}
      className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center px-6 will-change-transform md:px-16"
      aria-hidden={!isActive}
      aria-label={isActive ? `${video.title} — ${video.creator}, ${video.year}` : undefined}
    >
      <div className="relative w-full max-w-[1200px]">
        {/* poster — the anchored layer (whole-card motion only) */}
        <div className="duotone relative mx-auto aspect-[16/10] w-full max-w-[860px] overflow-hidden rounded-[1.25rem] border border-hairline bg-ink-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={isActive ? `Thumbnail for ${video.title}` : ""}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>

        {/* catalog corner — 120% parallax */}
        <p
          ref={(el) => registerLayer(el, 120)}
          className="absolute left-0 top-0 z-10 font-meta text-[0.6rem] tracking-[0.35em] text-bone-dim will-change-transform"
        >
          {video.catalogNumber} · REEL {reelNumber}
        </p>

        {/* title + credits — 150% parallax */}
        <div
          ref={(el) => registerLayer(el, 150)}
          className="absolute bottom-0 left-0 z-10 max-w-[60%] pb-2 will-change-transform"
        >
          <h3 className="font-meta text-[clamp(1.6rem,4vw,3.2rem)] uppercase leading-[1.1] tracking-[0.04em] text-bone [text-wrap:balance] [text-shadow:0_2px_18px_rgba(10,9,8,0.8)]">
            {video.title}
          </h3>
          <ul className="mt-2 flex flex-wrap items-center gap-x-0 gap-y-1 font-meta text-[0.58rem] tracking-[0.3em] text-bone-dim [text-shadow:0_2px_12px_rgba(10,9,8,0.9)]">
            <li className="uppercase">{video.creator}</li>
            <li aria-hidden className="mx-3 h-3 w-px bg-hairline" />
            <li className="tabular-nums">{video.year}</li>
            <li aria-hidden className="mx-3 h-3 w-px bg-hairline" />
            <li className="uppercase">{video.genre}</li>
          </ul>
        </div>

        {/* curator's quote — 25% parallax (desktop only) */}
        <blockquote
          ref={(el) => registerLayer(el, 25)}
          className="absolute right-0 top-1/2 z-10 hidden max-w-[15rem] -translate-y-1/2 border-l border-amber/40 pl-5 will-change-transform lg:block"
        >
          <span aria-hidden className="font-display text-3xl leading-none text-amber/70">
            &ldquo;
          </span>
          <p className="font-quote text-[0.95rem] italic leading-relaxed text-bone/90 [text-shadow:0_2px_12px_rgba(10,9,8,0.9)]">
            {video.curatorNote}
          </p>
        </blockquote>

        {/* WATCH — anchored (interactive, never parallaxes) */}
        {isActive && (
          <button
            type="button"
            onClick={() => onWatch(video)}
            className="ticket-stub absolute -bottom-2 right-0 border border-bone/30 bg-ink/60 px-5 py-2.5 font-meta text-[0.6rem] tracking-[0.35em] text-bone backdrop-blur-sm transition-colors duration-300 hover:border-amber hover:bg-amber hover:text-ink active:scale-[0.96] active:transition-transform active:duration-150"
            aria-label={`Watch ${video.title} (${video.duration})`}
          >
            ▶ WATCH
          </button>
        )}

        {/* mobile curator's note below the card */}
        {isActive && (
          <details className="group/note mt-3 lg:hidden">
            <summary className="flex w-fit list-none items-center gap-3 font-meta text-[0.58rem] tracking-[0.35em] text-smoke transition-colors group-open/note:text-amber [&::-webkit-details-marker]:hidden">
              CURATOR&apos;S NOTE · {video.duration}
              <span aria-hidden className="transition-transform group-open/note:rotate-45">+</span>
            </summary>
            <p className="mt-2 max-w-md border-l border-amber/40 pl-4 font-quote text-sm italic leading-relaxed text-bone-dim">
              {video.curatorNote}
            </p>
          </details>
        )}
      </div>
    </article>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { thumbnailUrl, type Video } from "@/types";

/**
 * The Frame — one video as a film poster: duotone-graded thumbnail,
 * overlapped title, credits row, catalog corner, curator's pull-quote,
 * ticket-stub WATCH button.
 */
export function Frame({
  video,
  reelNumber,
  onWatch,
}: {
  video: Video;
  reelNumber: string;
  onWatch: (video: Video) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const [src, setSrc] = useState(thumbnailUrl(video.youtubeId));

  // maxresdefault 404s on some uploads — fall back once, then stop trying
  const onError = () => {
    if (src.includes("maxres")) setSrc(thumbnailUrl(video.youtubeId, "hq"));
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tween = gsap.fromTo(
      el,
      { y: 60 },
      {
        y: 0,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
      }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <article
      ref={ref}
      data-frame
      className="group relative mx-auto w-[calc(100vw-2.5rem)] lg:w-[calc(100vw-7rem)] will-change-transform"
      aria-label={`${video.title} — ${video.creator}, ${video.year}`}
    >
      <div className="duotone relative aspect-[2/1] overflow-hidden rounded-[1.25rem] border border-hairline bg-ink-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          onError={onError}
          alt={`Thumbnail for ${video.title}`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />

        {/* catalog number · top-left */}
        <p className="absolute left-5 top-5 z-10 font-meta text-[0.6rem] tracking-[0.35em] text-bone-dim md:left-7 md:top-7">
          {video.catalogNumber} · REEL {reelNumber}
        </p>

        {/* curator's pull-quote · right side (desktop) */}
        <blockquote className="absolute right-7 top-1/2 z-10 hidden max-w-[15rem] -translate-y-1/2 border-l border-amber/40 pl-5 lg:block">
          <span aria-hidden className="font-display text-3xl leading-none text-amber/70">
            &ldquo;
          </span>
          <p className="font-quote text-[0.95rem] italic leading-relaxed text-bone/90">
            {video.curatorNote}
          </p>
        </blockquote>

        {/* title scrim + credits · bottom */}
        <div
          aria-hidden
          className="frame-scrim pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[42%]"
        />
        <div className="absolute bottom-6 left-5 right-5 z-10 md:bottom-9 md:left-7">
          <h3 className="font-meta text-[clamp(1.35rem,2.8vw,2.4rem)] uppercase leading-[1.15] tracking-[0.04em] text-bone [text-wrap:balance] [text-shadow:0_2px_18px_rgba(10,9,8,0.8)]">
            {video.title}
          </h3>
          <ul className="mt-3 flex flex-wrap items-center gap-x-0 gap-y-1 font-meta text-[0.58rem] tracking-[0.3em] text-bone-dim">
            <li className="uppercase">{video.creator}</li>
            <li aria-hidden className="mx-3 h-3 w-px bg-hairline" />
            <li className="tabular-nums">{video.year}</li>
            <li aria-hidden className="mx-3 h-3 w-px bg-hairline" />
            <li className="uppercase">{video.genre}</li>
          </ul>
        </div>

        {/* WATCH ticket stub · bottom-right */}
        <button
          type="button"
          onClick={() => onWatch(video)}
          className="ticket-stub absolute bottom-6 right-5 z-10 border border-bone/30 bg-ink/60 px-5 py-2.5 font-meta text-[0.6rem] tracking-[0.35em] text-bone backdrop-blur-sm transition-colors duration-300 hover:border-amber hover:bg-amber hover:text-ink md:bottom-9 md:right-7"
          aria-label={`Watch ${video.title} (${video.duration})`}
        >
          ▶ WATCH
        </button>
      </div>

      {/* curator's note below the frame on small screens — tap to reveal */}
      <details className="group/note mt-4 lg:hidden">
        <summary className="flex w-fit list-none items-center gap-3 font-meta text-[0.58rem] tracking-[0.35em] text-smoke transition-colors group-open/note:text-amber [&::-webkit-details-marker]:hidden">
          CURATOR&apos;S NOTE · {video.duration}
          <span aria-hidden className="transition-transform group-open/note:rotate-45">
            +
          </span>
        </summary>
        <p className="mt-3 max-w-md border-l border-amber/40 pl-4 font-quote text-sm italic leading-relaxed text-bone-dim">
          {video.curatorNote}
        </p>
      </details>
    </article>
  );
}

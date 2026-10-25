"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { thumbnailUrl, type Category, type Video } from "@/types";
import { categories } from "@/data/videos";
import { CATEGORY_SPINE } from "@/lib/reelTokens";

/**
 * TicketFrame — a Frame rendered as the MUMO-style ticket, in linear flow.
 * Desktop wears the designed paper asset (public/card/better-card.webp,
 * aspect 3182/1113 @2×) with the category's spine multiplied over the baked
 * stub; the artwork fills the body panel flush (fold → die-cut wedges), full
 * bleed; the right stub carries caption/quote/meta/WATCH. Mobile keeps the
 * compact dark ticket. Parallax layers carry data-parallax-rate (inactive
 * until a driver mounts — §6 of the dial revamp plan); they sit at rest
 * offsets here. Entrance: the old Frame's one-shot rise (reduced-motion
 * gated).
 */

const PAPER = "/card/better-card.webp";

/** Maxresdefault 404s on some uploads — fall back once, then stop. */
function useThumbFallback(youtubeId: string) {
  const first = thumbnailUrl(youtubeId);
  const [src, setSrc] = useState(first);
  const onError = () => {
    if (src.includes("maxres")) setSrc(thumbnailUrl(youtubeId, "hq"));
  };
  return { src, onError };
}

export function TicketFrame({
  video,
  variant = "strip",
  category,
  onWatch,
  tabbable = true,
}: {
  video: Video;
  /** "strip" = linear flow; "deck" = carousel slot (slot owns the box) */
  variant?: "strip" | "deck";
  /** the ticket's category — resolved from the archive when omitted */
  category?: Category;
  onWatch: (video: Video) => void;
  /** false for deck tickets behind the front card, which are out of reach */
  tabbable?: boolean;
}) {
  const isDeck = variant === "deck";
  const { src, onError } = useThumbFallback(video.youtubeId);
  const spine = CATEGORY_SPINE[video.category];
  const cat =
    category ?? categories.find((c) => c.slug === video.category) ?? categories[0];
  const ref = useRef<HTMLElement>(null);

  /**
   * Deck variant marks the paper shell `data-deck-paper` + `container-type:
   * inline-size`: every deck-only hook class (tk-*) is then sized in cqw in
   * categoryCarousel.css, so the ticket's inner composition is locked to its
   * box at ANY deck size (plans/0007). The strip variant keeps its rem sizes.
   */

  // one-shot rise on first view (was Frame's entrance) — strip flow only:
  // the deck's slots are already inside the sticky stage when it mounts
  useEffect(() => {
    if (isDeck) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const tween = gsap.fromTo(
      el,
      { y: 60 },
      {
        y: 0,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
      },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [isDeck]);

  const watchBtn = (extra: string, label: string) => {
    const stub = `ticket-stub inline-block border border-bone/30 bg-ink/60 font-meta tracking-[0.35em] text-bone ${extra}`;

    // Deck tickets behind the front card: the stub is a printed mark, not a
    // control. A background click is the "bring this ticket forward" gesture,
    // and a focusable button here would put N ghost stops in the tab order
    // (its slot is aria-hidden, so it must not contain anything focusable).
    if (!tabbable) {
      return (
        <span aria-hidden className={`${stub} select-none`}>
          <span className="-me-[0.35em]">▶ WATCH</span>
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={(e) => {
          if (isDeck) e.stopPropagation();
          onWatch(video);
        }}
        className={`${stub} transition-[color,background-color,border-color,scale] duration-200 hover:border-amber hover:bg-amber hover:text-ink active:scale-[0.96]`}
        aria-label={label}
      >
        <span className="-me-[0.35em]">▶ WATCH</span>
      </button>
    );
  };

  return (
    <article
      ref={ref}
      className={`relative mx-auto flex justify-center ${
        isDeck
          ? "w-full"
          : "w-[calc(100vw-2.5rem)] md:w-[calc(100vw-5rem)]"
      }`}
      aria-label={`${video.title} — ${video.creator}, ${video.year}`}
    >
      {/* ── desktop: designed paper ticket ─────────────────────────────── */}
      {/* Baked-asset geometry (measured @2×, % of 3182×1113):
          stub/crease 0–8.2/8.8%, punch-hole centers −0.66%W @ 12.1/87.0%H
          (r 1.62%W × 4.63%H), perforation slot center 67.3%W, wedge span
          65.9–68.6%W, corners ~square (≤2px @1×) */}
      <div
        className={`relative hidden md:block md:aspect-[3182/1113] ${
          isDeck
            ? "w-full max-w-none shadow-[0_44px_90px_-26px_rgba(0,0,0,0.92),0_14px_38px_-14px_rgba(0,0,0,0.72)]"
            : "w-full max-w-[min(1420px,calc((100svh-11.5rem)*2.8589))] shadow-[0_44px_90px_-26px_rgba(0,0,0,0.92),0_14px_38px_-14px_rgba(0,0,0,0.72)]"
        }`}
        data-deck-paper={isDeck ? "" : undefined}
        style={isDeck ? { containerType: "inline-size" } : undefined}
      >
        {/* paper (die-cut silhouette, perforation slots + wedge cuts baked) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PAPER}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
        />

        {/* category color spine — multiply tint exactly over the baked stub
            column, masked with the punch holes. Hole mask is % of this
            wrapper's own box (wrapper = stub) so registration holds at any
            card width; this wrapper is ~8.17% of the shell's width, so
            hole radii rescale: 1.62/8.17 ≈ 19.8% of wrapper width */}
        <div
          className="absolute inset-y-0 left-0 w-[8.17%]"
          style={{
            maskImage:
              "radial-gradient(19.8% 4.63% at -8.1% 12.1%, transparent 98%, black 100%), radial-gradient(19.8% 4.63% at -8.1% 87%, transparent 98%, black 100%)",
            maskComposite: "intersect",
            WebkitMaskImage:
              "radial-gradient(19.8% 4.63% at -8.1% 12.1%, transparent 98%, black 100%), radial-gradient(19.8% 4.63% at -8.1% 87%, transparent 98%, black 100%)",
            WebkitMaskComposite: "source-in",
          }}
        >
          <div className={`${spine.chip} absolute inset-0 mix-blend-multiply`} />
          {/* live spine type — ink on chip, reads bottom-to-top like the inspo */}
          <span
            className={`tk-spine-type absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-meta tracking-[0.35em] ${spine.chipText} [writing-mode:vertical-rl] rotate-180 tabular-nums`}
          >
            CATEGORY {cat.number} · {cat.title.toUpperCase()}
          </span>
        </div>

        {/* artwork — full-bleed across the body panel: the panel IS the
            frame. Bounds: the stub crease (left, ~8.8%, the dark seam stays
            visible as the fold), the die-cut wedge slots (right, 65.9%+),
            full height. duotone-paper vignette separates on the cream edges */}
        <div className="absolute inset-y-0 left-[8.8%] right-[34.5%]">
          <div className="duotone-paper relative h-full w-full overflow-hidden outline outline-1 -outline-offset-1 outline-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              onError={onError}
              alt={`Thumbnail for ${video.title}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>

          {/* catalog corner — layer class for the future parallax driver */}
          <p
            data-parallax-rate="120"
            className="tk-catalog absolute left-3 top-3 z-10 font-meta tracking-[0.35em] text-bone-dim [text-shadow:0_2px_12px_rgba(10,9,8,0.9)]"
          >
            {video.catalogNumber} · CATEGORY {cat.number}
          </p>
        </div>

        {/* stub — right of the baked perforation */}
        <div className="tk-stub absolute bottom-0 left-[67.9%] right-0 top-0 flex flex-col gap-3 py-[3%] pl-[2%] pr-[1.4%]">
          <p className="tk-archive font-meta text-[0.5rem] tracking-[0.35em] text-smoke">
            DRISHYAKOSH · ARCHIVE
          </p>

          {/* curator's quote */}
          <blockquote data-parallax-rate="25" className="tk-quote-block border-l border-amber/60 pl-4">
            <span aria-hidden className="tk-quote-mark font-display text-2xl leading-none text-amber/80">
              &ldquo;
            </span>
            <p className="tk-quote mt-1 font-quote text-[0.88rem] italic leading-relaxed text-ink/85">
              {video.curatorNote}
            </p>
          </blockquote>

          {/* meta grid — MUMO's logistics rows */}
          <dl className="tk-meta mt-auto grid grid-cols-2 gap-x-4 gap-y-2">
            {[
              ["ARTIST", video.creator],
              ["YEAR", String(video.year)],
              ["GENRE", video.genre],
              ["RUNTIME", video.duration],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="tk-meta-dt font-meta text-[0.45rem] tracking-[0.3em] text-smoke">{k}</dt>
                <dd className="tk-meta-dd truncate font-meta text-[0.6rem] tracking-[0.2em] text-ink/85 uppercase tabular-nums">
                  {v}
                </dd>
              </div>
            ))}
          </dl>

          {/* WATCH — the price tab. Deliberately type-small on the paper
              ticket: the whole card is the click target (a front press opens
              the lightbox, see ReelCarousel.onSlotClick), so this stub is an
              affordance rather than a 44px hit area. The compact mobile
              ticket, which has no card-level press of its own, carries
              min-h-11 on the stub instead. */}
          {watchBtn("mt-3 self-end px-4 py-2 text-[0.58rem]", `Watch ${video.title} (${video.duration})`)}
        </div>
      </div>

      {/* ── mobile: compact dark ticket (landscape asset can't fold) ────── */}
      <div className="relative flex w-full flex-col rounded-[1rem] border border-hairline bg-ink-2 shadow-[0_30px_70px_-22px_rgba(0,0,0,0.9)] md:hidden">
        <div
          className={`${spine.chip} relative flex h-9 w-full shrink-0 items-center justify-between rounded-[0.9rem] px-4`}
        >
          <span className="font-meta text-[0.55rem] tracking-[0.3em] text-ink tabular-nums">
            CATEGORY {cat.number} · {cat.title.toUpperCase()}
          </span>
          <span className="font-meta text-[0.55rem] tracking-[0.3em] text-ink tabular-nums">
            {video.catalogNumber}
          </span>
        </div>

        <div className="relative min-w-0 flex-1 p-2">
          <div className="relative w-full">
            <div className="duotone relative aspect-[16/10] w-full overflow-hidden rounded-[0.35rem] bg-ink outline outline-1 -outline-offset-1 outline-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                onError={onError}
                alt={`Thumbnail for ${video.title}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>

            <p
              data-parallax-rate="120"
              className="absolute left-2 top-2 z-10 font-meta text-[0.6rem] tracking-[0.35em] text-bone-dim [text-shadow:0_2px_12px_rgba(10,9,8,0.9)]"
            >
              {video.catalogNumber} · CATEGORY {cat.number}
            </p>

            {watchBtn(
              "absolute bottom-3 right-3 z-10 min-h-11 px-4 py-2 text-[0.58rem]",
              `Watch ${video.title} (${video.duration})`,
            )}
          </div>
        </div>

        <div className="relative flex shrink-0 flex-col gap-2 border-bone/25 px-4 pb-4 pt-3 max-md:border-dashed max-md:border-t">
          <p className="font-meta text-[0.5rem] tracking-[0.35em] text-smoke">
            DRISHYAKOSH · ARCHIVE
          </p>

          <details className="group/note">
            <summary className="flex w-fit list-none items-center gap-2 font-meta text-[0.55rem] tracking-[0.3em] text-smoke transition-colors group-open/note:text-amber [&::-webkit-details-marker]:hidden">
              CURATOR&apos;S NOTE <span aria-hidden className="transition-transform group-open/note:rotate-45">+</span>
            </summary>
            <p className="mt-2 font-quote text-sm italic leading-relaxed text-bone-dim">
              {video.curatorNote}
            </p>
          </details>

          <dl className="flex flex-col gap-1.5">
            {[
              ["ARTIST", video.creator],
              ["YEAR", String(video.year)],
              ["GENRE", video.genre],
              ["RUNTIME", video.duration],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3">
                <dt className="font-meta text-[0.5rem] tracking-[0.3em] text-smoke">{k}</dt>
                <dd className="max-w-[60%] truncate font-meta text-[0.58rem] tracking-[0.25em] text-bone-dim uppercase tabular-nums">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </article>
  );
}

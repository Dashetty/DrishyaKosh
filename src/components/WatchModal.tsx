"use client";

import { useEffect, useRef } from "react";
import { youtubeUrl, type Video } from "@/types";
import { useLenisInstance } from "@/lib/smooth-scroll";

/**
 * The Watch lightbox — a projector hold: grain and flicker pause behind the
 * open dialog, scroll locks, the iframe mounts only while open (paused
 * until the viewer presses play — no autoplaying audio).
 */
export function WatchModal({
  video,
  onClose,
}: {
  video: Video | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const lenis = useLenisInstance();

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg || !video) return;

    returnFocus.current = document.activeElement as HTMLElement | null;
    dlg.showModal();
    document.documentElement.classList.add("projector-hold");
    lenis?.stop();

    return () => {
      if (dlg.open) dlg.close();
      document.documentElement.classList.remove("projector-hold");
      lenis?.start();
      returnFocus.current?.focus?.();
    };
  }, [video, lenis]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      aria-label={video ? `Watching ${video.title}` : undefined}
      className="w-[min(64rem,92vw)] rounded-3xl border border-hairline bg-ink-2 p-4 text-bone shadow-[0_40px_120px_oklch(0_0_0/0.9)] backdrop:bg-ink/85 backdrop:backdrop-blur-sm"
    >
      {video && (
        <div>
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <p className="font-meta text-[0.6rem] tracking-[0.35em] text-smoke">
              {video.catalogNumber} · {video.duration}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="relative inline-flex items-center font-meta text-[0.6rem] tracking-[0.35em] text-bone-dim transition-[color,scale] duration-200 before:absolute before:-inset-x-3 before:-inset-y-[15px] before:content-[''] hover:text-amber active:scale-[0.96]"
              aria-label="Close"
            >
              <span className="-me-[0.35em]">✕ CLOSE</span>
            </button>
          </div>

          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0`}
            title={video.title}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="aspect-video w-full rounded-lg bg-black outline outline-1 -outline-offset-1 outline-white/10"
          />

          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h3 className="font-meta text-xl uppercase tracking-[0.02em] leading-tight [text-wrap:balance]">
                {video.title}
              </h3>
              <p className="mt-1 font-meta text-[0.55rem] tracking-[0.3em] text-smoke">
                {video.creator.toUpperCase()} · {video.year}
              </p>
            </div>
            <a
              href={youtubeUrl(video.youtubeId)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center font-meta text-[0.6rem] tracking-[0.3em] text-amber underline-offset-4 hover:underline"
            >
              OPEN ON YOUTUBE ↗
            </a>
          </div>
        </div>
      )}
    </dialog>
  );
}

"use client";

import { useLenisInstance } from "@/lib/smooth-scroll";

export function Footer() {
  const lenis = useLenisInstance();

  const flipItOver = () => {
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.6 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="relative flex flex-col items-center gap-10 px-6 pb-20 pt-28 text-center">
      <p aria-hidden className="block w-24 border-t border-hairline" />
      <p className="font-meta text-xs tracking-[0.5em] text-bone-dim md:text-sm">
        END OF REEL.
      </p>
      <button
        type="button"
        onClick={flipItOver}
        className="ticket-stub border border-bone/30 px-7 py-3 font-meta text-[0.65rem] tracking-[0.4em] text-bone transition-colors duration-300 hover:border-amber hover:bg-amber hover:text-ink"
      >
        FLIP IT OVER →
      </button>
      <p className="font-body text-[0.7rem] text-smoke">
        A personal archive curated by Hardeep Dilip Shetty · {new Date().getFullYear()}
      </p>
    </footer>
  );
}

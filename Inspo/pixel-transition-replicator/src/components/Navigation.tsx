interface NavigationProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
  currentFilmIndex: number;
  totalFilms: number;
  currentFilmTitle: string;
}

export function Navigation({
  onMenuToggle,
  isMenuOpen,
  currentFilmIndex,
  totalFilms,
  currentFilmTitle,
}: NavigationProps) {
  return (
    <header className="fixed top-0 inset-x-0 z-40 pointer-events-none pt-7 px-6 sm:px-12 flex justify-between items-start">
      {/* Brand logo */}
      <div className="pointer-events-auto flex flex-col items-start select-none cursor-pointer group">
        <span className="font-parrish text-2xl sm:text-3xl tracking-[0.28em] text-[#faf7ef] leading-none transition-opacity duration-300 group-hover:opacity-80">
          SIENA
        </span>
        <span className="font-nb text-[7px] sm:text-[8px] tracking-[0.42em] uppercase text-[#faf7ef]/70 mt-1 pl-0.5">
          FILM FOUNDATION
        </span>
      </div>

      {/* Center Film indicator */}
      <div className="hidden md:flex pointer-events-auto items-center gap-3 px-4 py-1.5 rounded-full bg-black/40 border border-[#faf7ef]/15 backdrop-blur-md text-[#faf7ef]/80 text-xs">
        <span className="font-neue text-xs text-[#faf7ef] tracking-wider">
          {String(currentFilmIndex + 1).padStart(2, '0')} / {String(totalFilms).padStart(2, '0')}
        </span>
        <span className="w-1 h-1 rounded-full bg-[#faf7ef]/40" />
        <span className="font-nb text-[11px] uppercase tracking-wider text-[#faf7ef]/90 max-w-[200px] truncate">
          {currentFilmTitle}
        </span>
      </div>

      {/* Top right hamburger button */}
      <button
        type="button"
        onClick={onMenuToggle}
        aria-label="Toggle navigation menu"
        className="pointer-events-auto w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#faf7ef] text-black flex flex-col items-center justify-center gap-1.5 shadow-xl hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
      >
        <span
          className={`w-5 h-[2px] bg-black transition-transform duration-300 ${
            isMenuOpen ? 'rotate-45 translate-y-[4px]' : ''
          }`}
        />
        <span
          className={`w-5 h-[2px] bg-black transition-transform duration-300 ${
            isMenuOpen ? '-rotate-45 -translate-y-[4px]' : ''
          }`}
        />
      </button>
    </header>
  );
}

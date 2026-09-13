import { Film } from '../types';
import { X, ArrowRight, Film as FilmIcon } from 'lucide-react';

interface FilmDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  films: Film[];
  currentIndex: number;
  onSelectFilm: (index: number) => void;
}

export function FilmDrawer({
  isOpen,
  onClose,
  films,
  currentIndex,
  onSelectFilm,
}: FilmDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md transition-all duration-300">
      <div className="w-full max-w-md bg-[#0d0d0d] border-l border-[#faf7ef]/15 h-full p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
        {/* Top header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#faf7ef]/15">
          <div>
            <span className="font-parrish text-xl tracking-[0.2em] text-[#faf7ef] block">
              SIENA ARCHIVE
            </span>
            <span className="font-nb text-[9px] uppercase tracking-widest text-[#faf7ef]/60">
              Selected Works & Documentaries
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-neutral-900 border border-[#faf7ef]/20 flex items-center justify-center text-[#faf7ef] hover:bg-neutral-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Film list */}
        <div className="py-6 space-y-2 flex-1 overflow-y-auto">
          {films.map((film, index) => {
            const isSelected = index === currentIndex;
            return (
              <button
                key={film.id}
                type="button"
                onClick={() => {
                  onSelectFilm(index);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 flex items-center justify-between group ${
                  isSelected
                    ? 'bg-[#faf7ef] text-black shadow-lg'
                    : 'bg-neutral-950/70 text-[#faf7ef] hover:bg-neutral-900 border border-[#faf7ef]/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-nb text-xs font-mono tracking-wider ${
                      isSelected ? 'text-black/60' : 'text-[#faf7ef]/40'
                    }`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h4 className="font-neue text-base sm:text-lg font-bold uppercase tracking-tight line-clamp-1">
                      {film.title}
                    </h4>
                    <p
                      className={`text-[10px] uppercase tracking-wider ${
                        isSelected ? 'text-black/70' : 'text-[#faf7ef]/60'
                      }`}
                    >
                      {film.details.director} • {film.details.year}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    isSelected
                      ? 'bg-black text-white'
                      : 'text-[#faf7ef]/40 group-hover:text-[#faf7ef] group-hover:translate-x-1'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-[#faf7ef]/15 space-y-3 text-[#faf7ef]/60 text-xs">
          <div className="flex items-center gap-2">
            <FilmIcon className="w-4 h-4 text-[#faf7ef]" />
            <span className="font-nb uppercase tracking-wider text-[10px]">
              Cinema Film Reel Experience
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#faf7ef]/50">
            Navigate by scrolling mouse wheel, dragging vertically, or using Up/Down keys.
          </p>
        </div>
      </div>
    </div>
  );
}

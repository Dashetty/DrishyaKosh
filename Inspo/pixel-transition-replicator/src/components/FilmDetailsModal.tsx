import { Film } from '../types';
import { X, Award as AwardIcon, Calendar, Clapperboard, Star } from 'lucide-react';
import { TicketButton } from './TicketButton';

interface FilmDetailsModalProps {
  film: Film | null;
  onClose: () => void;
}

export function FilmDetailsModal({ film, onClose }: FilmDetailsModalProps) {
  if (!film) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#111111] border border-[#faf7ef]/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Poster Header */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-black">
          <img
            src={film.image}
            alt={film.title}
            className="w-full h-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-black/40 to-transparent" />
          
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 border border-white/20 text-[#faf7ef] flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
            <div>
              <span className="font-nb text-[10px] tracking-[0.25em] uppercase text-[#faf7ef]/70">
                {film.eyebrow}
              </span>
              <h2 className="font-neue text-3xl sm:text-5xl font-bold uppercase tracking-tight text-[#faf7ef] leading-none mt-1">
                {film.title}
              </h2>
            </div>
            {film.award.headline && (
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="font-nb text-xs text-[#faf7ef]/70">
                  {film.award.year}
                </span>
                <span className="font-nb text-xs font-semibold uppercase tracking-wider text-[#faf7ef]">
                  {film.award.headline}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* Metadata chips */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-neutral-900/60 border border-[#faf7ef]/10 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-[10px] uppercase text-[#faf7ef]/60">
                <Clapperboard className="w-3 h-3" />
                <span>Director</span>
              </div>
              <p className="font-nb text-xs sm:text-sm font-semibold text-[#faf7ef]">
                {film.details.director}
              </p>
            </div>
            <div className="space-y-1 border-x border-[#faf7ef]/10">
              <div className="flex items-center justify-center gap-1 text-[10px] uppercase text-[#faf7ef]/60">
                <Calendar className="w-3 h-3" />
                <span>Release</span>
              </div>
              <p className="font-nb text-xs sm:text-sm font-semibold text-[#faf7ef]">
                {film.details.year}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-[10px] uppercase text-[#faf7ef]/60">
                <AwardIcon className="w-3 h-3" />
                <span>Category</span>
              </div>
              <p className="font-nb text-xs sm:text-sm font-semibold text-[#faf7ef]">
                {film.details.category}
              </p>
            </div>
          </div>

          {/* Quotes and reviews */}
          <div className="space-y-3">
            <h4 className="font-parrish text-sm tracking-widest text-[#faf7ef]/80 uppercase">
              Critical Acclaim
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {film.reviews.map((rev, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-lg bg-neutral-950/80 border border-[#faf7ef]/10 space-y-2"
                >
                  <div className="flex gap-0.5 text-[#ffc700]">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                  <p className="font-neue text-xs sm:text-sm font-bold uppercase tracking-tight text-[#faf7ef] leading-snug">
                    {rev}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action footer */}
          <div className="pt-4 border-t border-[#faf7ef]/15 flex items-center justify-between">
            <span className="font-nb text-xs text-[#faf7ef]/50">
              Siena Film Foundation Production
            </span>
            <TicketButton label="CLOSE" onClick={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}

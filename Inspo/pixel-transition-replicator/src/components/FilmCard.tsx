import type React from 'react';
import { useState } from 'react';
import { Film } from '../types';
import { StarsSvg } from './StarsSvg';
import { TicketButton } from './TicketButton';

interface FilmCardProps {
  key?: React.Key;
  film: Film;
  offset: number; // distance in card units from center (e.g. -1, 0, 1)
  onExplore: (film: Film) => void;
  viewportHeight: number;
}

export function FilmCard({
  film,
  offset,
  onExplore,
  viewportHeight,
}: FilmCardProps) {
  const [isTitleHovered, setIsTitleHovered] = useState(false);

  // Parallax offsets matching siena.film:
  // o = relative card offset from viewport center
  // data-parallax="2" -> o * 2 * 10% = 20%
  // data-parallax="12" -> o * 12 * 10% = 120%
  // data-parallax="15" -> o * 15 * 10% = 150%
  const contentParallaxY = offset * 20; // in %
  const awardParallaxY = offset * 120; // in %
  const titleParallaxY = offset * 150; // in %
  const reviewsParallaxY = offset * 25; // in %

  // Formatted title lines for high-impact cinematic typographic scale
  const renderTitle = (rawTitle: string) => {
    let lines: string[] = [];
    if (rawTitle.toLowerCase().includes("kafka")) {
      lines = ["KAFKA'S", "LAST", "TRIAL"];
    } else if (rawTitle.toLowerCase().includes("moon in the")) {
      lines = ["MOON IN THE", "12TH HOUSE"];
    } else if (rawTitle.toLowerCase().includes("project x")) {
      lines = ["MY", "PROJECT X"];
    } else if (rawTitle.toLowerCase().includes("by any means")) {
      lines = ["BY ANY", "MEANS"];
    } else if (rawTitle.toLowerCase().includes("outsider freud")) {
      lines = ["OUTSIDER", "FREUD"];
    } else if (rawTitle.toLowerCase().includes("ana maxim")) {
      lines = ["ANA", "MAXIM"];
    } else {
      lines = [rawTitle.toUpperCase()];
    }

    return (
      <div
        onMouseEnter={() => setIsTitleHovered(true)}
        onMouseLeave={() => setIsTitleHovered(false)}
        className="font-neue font-extrabold uppercase text-[2.8rem] sm:text-[4.2rem] md:text-[5.4rem] lg:text-[6.2rem] leading-[0.78] tracking-[-0.035em] text-[#faf7ef] max-w-[12ch] select-none cursor-default mb-4 sm:mb-6"
      >
        {lines.map((line, idx) => (
          <div
            key={idx}
            className={`overflow-hidden transition-transform duration-300 ${
              idx === 1 && lines.length === 3 ? 'sm:-translate-x-3' : ''
            }`}
          >
            <div
              className={`flex flex-wrap transition-transform duration-500 ease-out ${
                isTitleHovered ? '-translate-y-1' : 'translate-y-0'
              }`}
            >
              {line}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Card vertical position based on viewport
  const cardY = offset * (viewportHeight * 0.88);

  return (
    <div
      className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full flex items-center justify-center pointer-events-none"
      style={{
        transform: `translate3d(0px, ${cardY}px, 0px)`,
        willChange: 'transform',
      }}
    >
      <div className="relative w-full max-w-[1600px] h-[86vh] px-4 sm:px-8 md:px-14 flex items-center justify-center">
        {/* Background Film Artwork / Poster */}
        <div className="relative w-full max-w-[780px] lg:max-w-[860px] h-[72vh] sm:h-[78vh] flex items-center justify-center overflow-hidden rounded-md shadow-2xl bg-black">
          <img
            src={film.image}
            alt={film.title}
            className="w-full h-full object-cover select-none pointer-events-none brightness-95 contrast-105 transition-transform duration-700"
            loading="eager"
          />

          {/* Vignette Gradients over poster */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />
          <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/80 pointer-events-none" />
        </div>

        {/* Parallax Content Floating Over Artwork */}
        <div
          className="absolute inset-0 px-6 sm:px-12 md:px-16 py-8 sm:py-12 flex justify-between pointer-events-none"
          style={{
            transform: `translate3d(0px, ${contentParallaxY}%, 0px)`,
            willChange: 'transform',
          }}
        >
          {/* Left Column: Festival Award (Top) & Title + Specs (Bottom) */}
          <div className="flex flex-col justify-between items-start h-full max-w-[620px] pointer-events-auto">
            {/* Festival Award Block (data-parallax="12") */}
            <div
              className="space-y-1 transition-transform"
              style={{
                transform: `translate3d(0px, ${awardParallaxY}%, 0px)`,
                willChange: 'transform',
              }}
            >
              {film.award.year && (
                <div className="space-y-1">
                  <div className="font-nb text-2xl sm:text-3xl font-bold tracking-tight text-[#faf7ef]">
                    {film.award.year}
                  </div>
                  <div className="font-nb text-[10px] sm:text-xs tracking-[0.16em] uppercase font-semibold text-[#faf7ef]/90 max-w-[18ch]">
                    {film.award.headline}
                  </div>
                </div>
              )}

              {film.award.logo && (
                <div className="pt-2">
                  <img
                    src={film.award.logo}
                    alt={film.award.headline || "Festival award"}
                    className="w-14 sm:w-18 h-auto object-contain brightness-125 filter drop-shadow-md select-none pointer-events-none"
                  />
                </div>
              )}
            </div>

            {/* Title & Metadata Details (data-parallax="15") */}
            <div
              className="space-y-2 sm:space-y-4 transition-transform"
              style={{
                transform: `translate3d(0px, ${titleParallaxY}%, 0px)`,
                willChange: 'transform',
              }}
            >
              {/* Category Eyebrow */}
              <div className="font-parrish text-[10px] sm:text-xs tracking-[0.22em] uppercase text-[#faf7ef]/75">
                {film.eyebrow}
              </div>

              {/* Main Film Title */}
              {renderTitle(film.title)}

              {/* Metadata Callout Table */}
              <div className="w-full max-w-[340px] sm:max-w-[380px] border-t border-[#faf7ef]/30 pt-1">
                {/* Director */}
                <div className="flex justify-between items-center py-1.5 border-b border-[#faf7ef]/20 text-[10px] sm:text-[11px] font-nb tracking-wider">
                  <span className="uppercase text-[#faf7ef]/60">DIRECTOR</span>
                  <span className="uppercase font-medium text-[#faf7ef]">
                    {film.details.director}
                  </span>
                </div>

                {/* Year */}
                <div className="flex justify-between items-center py-1.5 border-b border-[#faf7ef]/20 text-[10px] sm:text-[11px] font-nb tracking-wider">
                  <span className="uppercase text-[#faf7ef]/60">YEAR</span>
                  <span className="uppercase font-medium text-[#faf7ef]">
                    {film.details.year}
                  </span>
                </div>

                {/* Category */}
                <div className="flex justify-between items-center py-1.5 border-b border-[#faf7ef]/20 text-[10px] sm:text-[11px] font-nb tracking-wider">
                  <span className="uppercase text-[#faf7ef]/60">CATEGORY</span>
                  <span className="uppercase font-medium text-[#faf7ef]">
                    {film.details.category}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Reviews & Explore CTA (data-parallax="2") */}
          <div
            className="hidden md:flex flex-col justify-between items-end h-full pointer-events-auto"
            style={{
              transform: `translate3d(0px, ${reviewsParallaxY}%, 0px)`,
              willChange: 'transform',
            }}
          >
            {/* Reviews list */}
            <div className="space-y-6 lg:space-y-8 flex flex-col items-center text-center max-w-[240px]">
              {film.reviews.slice(0, 3).map((review, rIdx) => (
                <div key={rIdx} className="space-y-1.5 flex flex-col items-center">
                  {/* 5-star rating SVG */}
                  <StarsSvg className="w-20 lg:w-24 h-3.5 text-[#faf7ef]" />

                  {/* Critical Acclaim Eyebrow */}
                  <div className="font-parrish text-[8px] lg:text-[9px] tracking-[0.24em] uppercase text-[#faf7ef]/70">
                    CRITICAL ACCLAIM
                  </div>

                  {/* Quote Headline */}
                  <h3 className="font-neue text-base lg:text-lg font-bold uppercase tracking-tight text-[#faf7ef] leading-tight">
                    {review}
                  </h3>
                </div>
              ))}
            </div>

            {/* Explore Ticket Stub Button */}
            <div className="pt-6">
              <TicketButton
                label="EXPLORE"
                onClick={() => onExplore(film)}
              />
            </div>
          </div>
        </div>

        {/* Mobile Explore Button at bottom */}
        <div className="md:hidden absolute bottom-4 right-4 pointer-events-auto">
          <TicketButton
            label="EXPLORE"
            onClick={() => onExplore(film)}
          />
        </div>
      </div>
    </div>
  );
}

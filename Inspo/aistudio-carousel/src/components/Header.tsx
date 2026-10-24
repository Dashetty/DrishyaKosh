import React from 'react';

interface HeaderProps {
  onScrollToAwards?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onScrollToAwards }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-12 py-5 transition-all duration-300 pointer-events-auto backdrop-blur-xs bg-white/80">
      {/* Zone 1: Dokmeh Brand Wordmark */}
      <div className="flex items-center gap-3">
        <a 
          href="#section-awards" 
          onClick={(e) => {
            e.preventDefault();
            onScrollToAwards?.();
          }}
          className="flex items-center gap-2 group text-inherit no-underline"
          aria-label="Dokmeh Agency Home"
        >
          {/* Dokmeh Button Mark */}
          <span className="w-6 h-6 rounded-sm border-[2.5px] border-black flex items-center justify-center transition-transform duration-300 group-hover:rotate-45">
            <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
          </span>
          <span className="text-xl font-bold tracking-tight text-neutral-900 uppercase">
            Dokmeh
          </span>
        </a>
      </div>

      {/* Zone 2: Navigation Links (Clean 3-Zone Contract) */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
        <a 
          href="#section-awards" 
          onClick={(e) => {
            e.preventDefault();
            onScrollToAwards?.();
          }}
          className="text-neutral-950 font-bold transition-colors underline underline-offset-8 decoration-2 decoration-neutral-900"
        >
          Awards
        </a>
        <a 
          href="https://hidokmeh.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-neutral-950 transition-colors"
        >
          Work
        </a>
        <a 
          href="https://hidokmeh.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-neutral-950 transition-colors"
        >
          Services
        </a>
        <a 
          href="https://hidokmeh.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-neutral-950 transition-colors"
        >
          Agency
        </a>
      </nav>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="https://hidokmeh.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs uppercase tracking-wider font-bold px-4 py-2 bg-neutral-950 text-white rounded-full hover:bg-neutral-800 transition-colors whitespace-nowrap"
        >
          Contact Studio
        </a>
      </div>
    </header>
  );
};

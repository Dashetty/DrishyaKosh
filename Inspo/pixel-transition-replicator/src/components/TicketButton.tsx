import { useState } from 'react';

interface TicketButtonProps {
  label?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'light' | 'dark';
}

export function TicketButton({
  label = "EXPLORE",
  onClick,
  className = "",
  variant = 'light'
}: TicketButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const strokeColor = variant === 'light' ? '#faf7ef' : '#000000';
  const textColor = variant === 'light' ? 'text-[#faf7ef]' : 'text-black';

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative inline-flex items-center justify-between w-[158px] h-[44px] px-4 cursor-pointer focus:outline-none select-none transition-transform duration-300 ${className}`}
      aria-label={label}
    >
      {/* Ticket notched background outline SVG */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <svg
          viewBox="0 0 142 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Outer notched perimeter */}
          <path
            d="M5 1h90c0 1 .6 3 3 3s3-2 3-3h36c0 3.2 2.667 4.144 4 4.216V39c-3.2 0-4 2.667-4 4h-35c0-1.333-.8-4-4-4s-4 2.667-4 4H5c0-3.6-2.667-4.167-4-4V5c3.2 0 4-2.667 4-4Z"
            stroke={strokeColor}
            strokeWidth="1.2"
            className="transition-colors duration-300"
          />
          {/* Dashed divider seam */}
          <path
            d="M98 4.5v34"
            stroke={strokeColor}
            strokeDasharray="3 3"
            strokeWidth="1"
            className="transition-colors duration-300 opacity-80"
          />
        </svg>
      </div>

      {/* Label section */}
      <div className="relative z-10 overflow-hidden pr-3">
        <div
          className={`font-neue tracking-widest text-xs font-bold uppercase transition-transform duration-300 ${textColor} ${
            isHovered ? '-translate-y-full' : 'translate-y-0'
          }`}
        >
          {label}
        </div>
        <div
          className={`absolute top-full left-0 font-neue tracking-widest text-xs font-bold uppercase transition-transform duration-300 ${textColor} ${
            isHovered ? '-translate-y-full' : 'translate-y-0'
          }`}
        >
          {label}
        </div>
      </div>

      {/* Arrow section */}
      <div className="relative z-10 w-5 flex items-center justify-center overflow-hidden">
        <div
          className={`transition-transform duration-300 flex items-center justify-center ${
            isHovered ? 'translate-x-1' : 'translate-x-0'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 11 10"
            className={`w-3 h-3 ${textColor}`}
          >
            <path
              fill="currentColor"
              d="M4.481.005a6.65 6.65 0 0 1 6.46 4.659c.078.229.08.479-.003.706C10.302 7.105 8.318 10 4.48 10V8.39c.941.127 2.922-.257 4.442-2.603H0V4.208h8.938c-.756-1.229-2.216-2.78-4.457-2.78V.006Z"
            />
          </svg>
        </div>
      </div>
    </button>
  );
}

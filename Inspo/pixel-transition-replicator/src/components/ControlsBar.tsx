import { ChevronUp, ChevronDown, Sliders, Play, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface ControlsBarProps {
  onPrev: () => void;
  onNext: () => void;
  onResetToKafka: () => void;
  speedMultiplier: number;
  onSpeedChange: (speed: number) => void;
  motionBlurEnabled: boolean;
  onToggleMotionBlur: () => void;
  currentIndex: number;
  totalFilms: number;
}

export function ControlsBar({
  onPrev,
  onNext,
  onResetToKafka,
  speedMultiplier,
  onSpeedChange,
  motionBlurEnabled,
  onToggleMotionBlur,
  currentIndex,
  totalFilms,
}: ControlsBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-auto">
      {/* Expanded settings drawer */}
      {isExpanded && (
        <div className="mb-3 p-4 rounded-2xl bg-black/85 border border-[#faf7ef]/20 backdrop-blur-xl text-[#faf7ef] shadow-2xl flex flex-wrap items-center gap-4 text-xs font-nb animate-fadeIn">
          {/* Transition speed selector */}
          <div className="flex items-center gap-2">
            <span className="text-[#faf7ef]/60 uppercase text-[10px] tracking-wider">
              Transition Speed:
            </span>
            <div className="flex items-center rounded-lg bg-neutral-900 p-1 border border-[#faf7ef]/10">
              <button
                type="button"
                onClick={() => onSpeedChange(1)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  speedMultiplier === 1
                    ? 'bg-[#faf7ef] text-black font-semibold'
                    : 'text-[#faf7ef]/70 hover:text-white'
                }`}
              >
                1.0x (Real)
              </button>
              <button
                type="button"
                onClick={() => onSpeedChange(0.4)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  speedMultiplier === 0.4
                    ? 'bg-[#faf7ef] text-black font-semibold'
                    : 'text-[#faf7ef]/70 hover:text-white'
                }`}
              >
                0.4x (Slow-Mo)
              </button>
              <button
                type="button"
                onClick={() => onSpeedChange(0.15)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  speedMultiplier === 0.15
                    ? 'bg-[#faf7ef] text-black font-semibold'
                    : 'text-[#faf7ef]/70 hover:text-white'
                }`}
              >
                0.15x (Inspect)
              </button>
            </div>
          </div>

          {/* Motion blur toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[#faf7ef]/60 uppercase text-[10px] tracking-wider">
              Velocity Blur:
            </span>
            <button
              type="button"
              onClick={onToggleMotionBlur}
              className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                motionBlurEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800'
              }`}
            >
              {motionBlurEnabled ? 'ON (Original)' : 'OFF'}
            </button>
          </div>

          {/* Reset to Kafka's Last Trial */}
          <button
            type="button"
            onClick={onResetToKafka}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-[#faf7ef] border border-[#faf7ef]/15 text-[11px]"
          >
            <RotateCcw className="w-3 h-3 text-[#faf7ef]/70" />
            <span>Jump to Kafka</span>
          </button>
        </div>
      )}

      {/* Main floating control pill */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/75 border border-[#faf7ef]/20 backdrop-blur-xl shadow-2xl">
        {/* Prev Card Button */}
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous film card"
          className="w-8 h-8 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-[#faf7ef] flex items-center justify-center transition-transform active:scale-90"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        {/* Counter indicator */}
        <div className="px-3 font-nb text-xs tracking-wider text-[#faf7ef]/80 flex items-center gap-2 select-none">
          <span className="font-neue text-sm text-[#faf7ef]">
            {String(currentIndex + 1).padStart(2, '0')}
          </span>
          <span className="text-[#faf7ef]/40">/</span>
          <span className="text-[#faf7ef]/60">
            {String(totalFilms).padStart(2, '0')}
          </span>
        </div>

        {/* Next Card Button */}
        <button
          type="button"
          onClick={onNext}
          aria-label="Next film card"
          className="w-8 h-8 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-[#faf7ef] flex items-center justify-center transition-transform active:scale-90"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-[#faf7ef]/20 mx-1" />

        {/* Settings Toggle */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-3 py-1 rounded-full text-xs font-nb uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
            isExpanded
              ? 'bg-[#faf7ef] text-black font-semibold'
              : 'text-[#faf7ef]/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Inspector</span>
        </button>
      </div>
    </div>
  );
}

import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { FILMS } from './filmsData';
import { Film } from './types';
import { FilmCard } from './components/FilmCard';
import { Navigation } from './components/Navigation';
import { FilmDrawer } from './components/FilmDrawer';
import { FilmDetailsModal } from './components/FilmDetailsModal';
import { ControlsBar } from './components/ControlsBar';
import { CustomCursor } from './components/CustomCursor';

// Mathematical wrapping function from siena.film
function modulo(s: number, e: number): number {
  return ((s % e) + e) % e;
}

function wrapOffset(s: number, halfLength: number): number {
  let t = modulo(s, 2 * halfLength);
  if (t >= halfLength) {
    t -= 2 * halfLength;
  }
  return t;
}

export default function App() {
  // Start centered on Kafka's Last Trial (index 3)
  const initialIndex = 3;
  const targetRef = useRef<number>(-initialIndex);
  const currentRef = useRef<number>(-initialIndex);
  const speedRef = useRef<number>(0);
  const lspeedRef = useRef<number>(0);

  const [currentVal, setCurrentVal] = useState<number>(-initialIndex);
  const [blurAmount, setBlurAmount] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [motionBlurEnabled, setMotionBlurEnabled] = useState<boolean>(true);
  const [viewportHeight, setViewportHeight] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight : 900
  );

  const isDraggingRef = useRef<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const dragStartTargetRef = useRef<number>(-initialIndex);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isWheelingRef = useRef<boolean>(false);

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main 60fps physics & lerping animation loop
  useEffect(() => {
    let rafId: number;

    const tick = () => {
      const lerpFactor = 0.05 * speedMultiplier;
      const snapFactor = 0.1 * speedMultiplier;

      // When user is not actively dragging or scrolling, gently snap target to closest integer
      if (!isDraggingRef.current && !isWheelingRef.current) {
        const rounded = Math.round(targetRef.current);
        targetRef.current = targetRef.current + (rounded - targetRef.current) * snapFactor;
      }

      // Smooth lerp current -> target
      currentRef.current =
        currentRef.current + (targetRef.current - currentRef.current) * lerpFactor;

      // Speed decay and smoothed lspeed for motion blur
      speedRef.current *= 0.85;
      lspeedRef.current =
        lspeedRef.current + (Math.abs(speedRef.current) - lspeedRef.current) * 0.1;

      setCurrentVal(currentRef.current);

      if (motionBlurEnabled) {
        setBlurAmount(Math.min(lspeedRef.current * 14, 8));
      } else {
        setBlurAmount(0);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [speedMultiplier, motionBlurEnabled]);

  // Navigate to specific index
  const goToIndex = useCallback((index: number) => {
    const total = FILMS.length;
    const currentNorm = -Math.round(targetRef.current);
    let diff = (index % total) - (currentNorm % total);

    // Shortest direction on circular drum
    if (Math.abs(diff) > total / 2) {
      diff = diff > 0 ? diff - total : diff + total;
    }
    targetRef.current -= diff;
  }, []);

  const goToPrev = useCallback(() => {
    targetRef.current += 1;
    speedRef.current += 0.3;
  }, []);

  const goToNext = useCallback(() => {
    targetRef.current -= 1;
    speedRef.current -= 0.3;
  }, []);

  // Mouse wheel listener
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isMenuOpen || selectedFilm) return;

      isWheelingRef.current = true;
      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
      wheelTimeoutRef.current = setTimeout(() => {
        isWheelingRef.current = false;
      }, 150);

      const delta = e.deltaY;
      speedRef.current += delta * 0.0006;
      targetRef.current -= delta * 0.0011 * speedMultiplier;
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
    };
  }, [isMenuOpen, selectedFilm, speedMultiplier]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedFilm || isMenuOpen) return;

      if (e.code === 'ArrowDown' || e.code === 'Space') {
        e.preventDefault();
        goToNext();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, selectedFilm, isMenuOpen]);

  // Drag interaction handlers
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (selectedFilm || isMenuOpen) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartYRef.current = clientY;
    dragStartTargetRef.current = targetRef.current;
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - dragStartYRef.current;

    speedRef.current += deltaY * 0.0002;
    targetRef.current = dragStartTargetRef.current + deltaY * 0.0018 * speedMultiplier;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const activeIndex = modulo(Math.round(-currentVal), FILMS.length);
  const currentFilm = FILMS[activeIndex];

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      className={`relative w-full h-screen overflow-hidden bg-black text-[#faf7ef] select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Top and Bottom Vignette Gradients */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[18vh] bg-gradient-to-b from-black via-black/80 to-transparent z-20" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-[18vh] bg-gradient-to-t from-black via-black/80 to-transparent z-20" />

      {/* Top and Bottom Quick Navigation Hitboxes */}
      <div
        onClick={goToPrev}
        className="fixed inset-x-0 top-0 h-[12vh] z-30 cursor-pointer pointer-events-auto opacity-0 hover:opacity-10 transition-opacity bg-white/5"
        title="Previous Film"
      />
      <div
        onClick={goToNext}
        className="fixed inset-x-0 bottom-0 h-[12vh] z-30 cursor-pointer pointer-events-auto opacity-0 hover:opacity-10 transition-opacity bg-white/5"
        title="Next Film"
      />

      {/* Top Navigation Bar */}
      <Navigation
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        isMenuOpen={isMenuOpen}
        currentFilmIndex={activeIndex}
        totalFilms={FILMS.length}
        currentFilmTitle={currentFilm?.title || ''}
      />

      {/* The Film Reel Drum Container */}
      <main
        className="relative w-full h-full flex items-center justify-center overflow-hidden transition-all duration-75"
        style={{
          filter: blurAmount > 0.05 ? `blur(${blurAmount}px)` : 'none',
        }}
      >
        {FILMS.map((film, index) => {
          // Circular offset calculation for infinite reel
          const r = currentVal + index;
          const offset = wrapOffset(r, FILMS.length / 2);

          // Culling: only render cards that are in or near viewport [-1.6, 1.6]
          if (Math.abs(offset) > 1.7) return null;

          return (
            <FilmCard
              key={film.id}
              film={film}
              offset={offset}
              viewportHeight={viewportHeight}
              onExplore={(f) => setSelectedFilm(f)}
            />
          );
        })}
      </main>

      {/* Interactive Controls & Speed Inspector Bar */}
      <ControlsBar
        onPrev={goToPrev}
        onNext={goToNext}
        onResetToKafka={() => goToIndex(3)}
        speedMultiplier={speedMultiplier}
        onSpeedChange={setSpeedMultiplier}
        motionBlurEnabled={motionBlurEnabled}
        onToggleMotionBlur={() => setMotionBlurEnabled(!motionBlurEnabled)}
        currentIndex={activeIndex}
        totalFilms={FILMS.length}
      />

      {/* Interactive Custom Floating Cursor */}
      <CustomCursor isDragging={isDragging} />

      {/* Case Study Details Modal */}
      <FilmDetailsModal
        film={selectedFilm}
        onClose={() => setSelectedFilm(null)}
      />

      {/* Side Archive Drawer */}
      <FilmDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        films={FILMS}
        currentIndex={activeIndex}
        onSelectFilm={goToIndex}
      />
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';

interface CustomCursorProps {
  isDragging: boolean;
}

export function CustomCursor({ isDragging }: CustomCursorProps) {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);
  const targetPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    let rafId: number;
    const animate = () => {
      setPos((prev) => ({
        x: prev.x + (targetPos.current.x - prev.x) * 0.25,
        y: prev.y + (targetPos.current.y - prev.y) * 0.25,
      }));
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(rafId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="hidden lg:flex fixed top-0 left-0 pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-opacity duration-300"
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0px) translate(-50%, -50%)`,
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div
        className={`px-3 py-1.5 rounded-full border border-[#faf7ef]/30 bg-black/60 backdrop-blur-md text-[#faf7ef] flex items-center gap-2 shadow-2xl transition-all duration-200 ${
          isDragging ? 'scale-90 bg-black/90 border-[#faf7ef]/60' : 'scale-100'
        }`}
      >
        {/* Up arrow */}
        <svg
          viewBox="0 0 35 23"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-2 text-[#faf7ef]/80"
        >
          <path
            fill="currentColor"
            d="M20.108.974C32.215 5.824 34.855 16.886 34.59 22.15h-4.924c0-9.384-8.278-14.7-12.417-16.462C6.759 10.924 5.099 18.66 5.58 22.15H.015C-.423 10.453 8.293 3.74 14.419 1.034c1.806-.798 3.857-.794 5.69-.06Z"
          />
        </svg>

        {/* Word */}
        <span className="font-neue text-[10px] tracking-widest font-bold uppercase select-none">
          {isDragging ? 'DRAG' : 'SCROLL'}
        </span>

        {/* Down arrow */}
        <svg
          viewBox="0 0 35 23"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-2 text-[#faf7ef]/80 rotate-180"
        >
          <path
            fill="currentColor"
            d="M20.108.974C32.215 5.824 34.855 16.886 34.59 22.15h-4.924c0-9.384-8.278-14.7-12.417-16.462C6.759 10.924 5.099 18.66 5.58 22.15H.015C-.423 10.453 8.293 3.74 14.419 1.034c1.806-.798 3.857-.794 5.69-.06Z"
          />
        </svg>
      </div>
    </div>
  );
}

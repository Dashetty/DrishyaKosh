"use client";

import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const LenisContext = createContext<Lenis | null>(null);

/** Access the live Lenis instance (null under reduced motion — native scroll). */
export function useLenisInstance() {
  return useContext(LenisContext);
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis({ lerp: 0.09 });
    instance.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    // publish async so children re-render with the instance in hand
    const id = setTimeout(() => setLenis(instance), 0);

    // the Drum pins → Lenis stands down; unpins → resumes (ADR-0002)
    const onPin = () => instance.stop();
    const onUnpin = () => instance.start();
    window.addEventListener("dk:drum:pin", onPin);
    window.addEventListener("dk:drum:unpin", onUnpin);

    return () => {
      clearTimeout(id);
      window.removeEventListener("dk:drum:pin", onPin);
      window.removeEventListener("dk:drum:unpin", onUnpin);
      gsap.ticker.remove(raf);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
  );
}

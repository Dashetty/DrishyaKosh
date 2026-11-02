"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { onIntroDone } from "@/lib/introGate";

/**
 * WordsStagger — Spell UI's "Words Stagger" (MIT, spell.sh), re-implemented
 * on GSAP so the site keeps ONE animation engine (no `motion` dependency).
 *
 * Same recipe: each word rises 10px, un-blurs 10px → 0 and fades in, one
 * after another. API mirrors Spell's (`delay`, `stagger`, `speed`, `inView`,
 * `once`, `onStart`, `onComplete`) with three house additions:
 *
 *  - `gate` (default true): wait for the loading screen's `dk:intro:done`
 *    before starting, so the words never play underneath the overlay.
 *  - `startOnScroll` (px): hold the reveal until the user's first scroll.
 *  - children may be rich: strings are split into words, elements (a styled
 *    <span>, <br />) are kept and their text split in place. Spell's original
 *    silently drops every non-string child.
 *
 * Flash-proofing: the hidden state is rendered into the server markup as an
 * inline style, so there is no paint where words exist before the animation
 * claims them (the bug that let Prelude's arrow appear first). Reduced
 * motion renders plain text — no hidden state, no timeline.
 *
 * On complete the inline transform/filter/opacity are cleared so finished
 * text isn't left as per-word blur layers.
 */

type WordsStaggerProps = {
  children: ReactNode;
  /** wrapper tag; defaults to an inline span (pass `block` via className) */
  as?: ElementType;
  className?: string;
  /** seconds before the first word starts */
  delay?: number;
  /** seconds between words */
  stagger?: number;
  /** seconds each word takes */
  speed?: number;
  /** wait until scrolled into view (instead of starting on mount) */
  inView?: boolean;
  /** with inView: only the first entry plays */
  once?: boolean;
  /** hold the reveal until the page has scrolled past this many px (the
   *  user's first scroll); plays at once if it already has */
  startOnScroll?: number;
  /** wait for the loading screen to finish first */
  gate?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
};

const HIDDEN: CSSProperties = {
  opacity: 0,
  transform: "translateY(10px)",
  filter: "blur(10px)",
};

function splitWords(
  node: ReactNode,
  style: CSSProperties | undefined,
  path = "w",
): ReactNode {
  if (typeof node === "number") node = String(node);

  if (typeof node === "string") {
    // split on breakable whitespace only — a non-breaking space (\u00A0)
    // glues two words into one animated unit (keeps a lone "I" off a line end)
    return node.split(/([ \t\r\n]+)/).map((part, i) =>
      part === "" ? null : /^[ \t\r\n]+$/.test(part) ? (
        part
      ) : (
        <span
          key={`${path}-${i}`}
          data-word=""
          className="inline-block"
          style={style}
        >
          {part}
        </span>
      ),
    );
  }

  if (Array.isArray(node)) {
    return Children.toArray(node).map((child, i) =>
      isValidElement(child) ? (
        splitWords(child, style, `${path}-${i}`)
      ) : (
        <span key={`${path}-${i}`}>
          {splitWords(child, style, `${path}-${i}`)}
        </span>
      ),
    );
  }

  if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    if (el.type === "br" || el.props.children == null) return el;
    return cloneElement(
      el,
      undefined,
      splitWords(el.props.children, style, path),
    );
  }

  return node;
}

export function WordsStagger({
  children,
  as: Tag = "span",
  className,
  delay = 0,
  stagger = 0.1,
  speed = 0.5,
  inView = false,
  once = true,
  startOnScroll,
  gate = true,
  onStart,
  onComplete,
}: WordsStaggerProps) {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // latest callbacks without re-running the effect
  const callbacks = useRef({ onStart, onComplete });
  useEffect(() => {
    callbacks.current = { onStart, onComplete };
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const words = root.querySelectorAll<HTMLElement>("[data-word]");

    if (reduced) {
      // wipe residue from a pre-reduced hydration pass; render static
      gsap.set(words, { clearProps: "all" });
      return;
    }

    const cleanups: Array<() => void> = [];
    gsap.set(words, { opacity: 0, y: 10, filter: "blur(10px)" });

    const tl = gsap.timeline({ paused: true });
    tl.to(
      words,
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: speed,
        ease: "power2.out",
        stagger,
        onStart: () => callbacks.current.onStart?.(),
        onComplete: () => {
          gsap.set(words, { clearProps: "opacity,transform,filter" });
          callbacks.current.onComplete?.();
        },
      },
      delay,
    );
    cleanups.push(() => tl.kill());

    const play = () => {
      if (tl.progress() === 0) tl.play();
    };
    const arm = () => {
      if (startOnScroll != null) {
        if (window.scrollY > startOnScroll) return play();
        const onScroll = () => {
          if (window.scrollY <= startOnScroll) return;
          window.removeEventListener("scroll", onScroll);
          play();
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        cleanups.push(() => window.removeEventListener("scroll", onScroll));
        return;
      }
      if (!inView) return play();
      gsap.registerPlugin(ScrollTrigger);
      const st = ScrollTrigger.create({
        trigger: root,
        start: "top 88%",
        once,
        onEnter: play,
      });
      cleanups.push(() => st.kill());
    };

    cleanups.push(gate ? onIntroDone(arm) : (arm(), () => {}));

    return () => cleanups.forEach((fn) => fn());
  }, [reduced, delay, stagger, speed, inView, once, startOnScroll, gate]);

  const Root = Tag as ElementType<{
    ref?: Ref<HTMLElement>;
    className?: string;
  }>;

  return (
    <Root ref={rootRef} className={className}>
      {splitWords(children, reduced ? undefined : HIDDEN)}
    </Root>
  );
}

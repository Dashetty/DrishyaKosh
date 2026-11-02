/**
 * Intro gate — landing animations wait for the loading screen to hand over.
 *
 * LoadingScreen dispatches `dk:intro:done` as its exit begins and drops
 * `html.intro-pending` right after. On session replays (and reduced motion)
 * the overlay never runs, so the class is absent and callers start at once.
 *
 * Returns a cleanup that cancels a pending callback.
 */
export function introDone() {
  return !document.documentElement.classList.contains("intro-pending");
}

export function onIntroDone(cb: () => void): () => void {
  if (introDone()) {
    cb();
    return () => {};
  }

  let fired = false;

  const cancel = () => {
    window.removeEventListener("dk:intro:done", run);
    clearTimeout(poll);
  };
  const run = () => {
    if (fired) return;
    fired = true;
    cancel();
    cb();
  };

  window.addEventListener("dk:intro:done", run, { once: true });
  // safety net if the event fired between hydration passes
  const poll = setTimeout(() => {
    if (introDone()) run();
  }, 250);

  return cancel;
}

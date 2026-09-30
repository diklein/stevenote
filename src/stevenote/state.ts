import type { DeckState } from "./types";

/** Hash format: #/3 is slide 3, #/3/2 is slide 3 at step 2. Slides are 1-based, steps 0-based. */
export function parseHash(hash: string, slideCount: number): { slide: number; step: number } | null {
  const m = /^#\/(\d+)(?:\/(\d+))?/.exec(hash);
  if (!m) return null;
  const slide = clamp(parseInt(m[1], 10) - 1, 0, Math.max(slideCount - 1, 0));
  const step = Math.max(parseInt(m[2] ?? "0", 10), 0);
  return { slide, step };
}

export function formatHash(state: Pick<DeckState, "slide" | "step">): string {
  return state.step > 0 ? `#/${state.slide + 1}/${state.step}` : `#/${state.slide + 1}`;
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(Math.max(n, lo), hi);
}

export function sameState(a: DeckState, b: DeckState) {
  return a.slide === b.slide && a.step === b.step && a.blank === b.blank;
}

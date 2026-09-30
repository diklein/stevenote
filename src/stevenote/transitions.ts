import { flushSync } from "react-dom";
import type { TransitionName } from "./types";

export type Direction = "forward" | "back";

/**
 * Run a DOM update as a view transition. CSS in stevenote.css animates
 * ::view-transition-old/new(sn-slide) by the transition name and direction set on <html>.
 * Falls back to a plain update when the API is missing, motion is reduced, or the tab is hidden.
 */
export function runTransition(name: TransitionName, direction: Direction, commit: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduced || document.visibilityState !== "visible" || name === "cut") {
    commit();
    return;
  }
  const html = document.documentElement;
  html.dataset.snTransition = name;
  html.dataset.snDirection = direction;
  const vt = doc.startViewTransition(() => flushSync(commit));
  vt.finished.finally(() => {
    delete html.dataset.snTransition;
    delete html.dataset.snDirection;
  });
}

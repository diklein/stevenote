"use client";

import { createContext, useContext } from "react";
import type { DeckDef, DeckState } from "./types";

/** What a slide's components can know about where they are being rendered. */
export type SlideContextValue = {
  /** True when this slide is the one on screen (not a preloaded neighbour). */
  active: boolean;
  /** True inside the notes window's thumbnails. Effects, autoplay and fetches should stay quiet. */
  preview: boolean;
  /**
   * True in the notes window's live view of the current slide: it animates, plays video and takes clicks like
   * the stage, and a click that steps the deck goes to the deck. Anything that talks to a server stays quiet.
   */
  mirror: boolean;
  index: number;
  /** Dim everything on the slide except the element marked data-focus-target. */
  setFocus: (on: boolean) => void;
};

export const SlideContext = createContext<SlideContextValue>({ active: true, preview: false, mirror: false, index: 0, setFocus: () => {} });

export function useSlide() {
  return useContext(SlideContext);
}

export type DeckContextValue = {
  deck: DeckDef;
  state: DeckState;
  /** Step counts reported by mounted slides, keyed by slide index. */
  stepCounts: Record<number, number>;
};

export const DeckContext = createContext<DeckContextValue | null>(null);

export function useDeck() {
  const v = useContext(DeckContext);
  if (!v) throw new Error("useDeck must be used inside a Deck");
  return v;
}

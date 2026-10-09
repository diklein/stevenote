import type { CSSProperties, ReactNode } from "react";

export type Theme = "light" | "dark";

/** Slide transition styles. Chosen per deck, overridable per slide. */
export type TransitionName = "cut" | "fade" | "push" | "rise" | "zoom" | "wipe" | "blur" | "morph" | "cube";

export const TRANSITIONS: TransitionName[] = ["cut", "fade", "push", "rise", "zoom", "wipe", "blur", "morph", "cube"];

export type SlideNotes = {
  /** What you say. First person, plain. */
  say?: string;
  /** Stage direction. Imperative. Mention the click by name. */
  do?: string;
  /** Budget in seconds. */
  time?: number;
  /** Optional per-step chunks of "say", index 0 is before the first click. */
  steps?: string[];
};

export type SlideDef = {
  id: string;
  content: ReactNode;
  /** Shown in the notes window as "On screen". Defaults to the id. */
  title?: string;
  theme?: Theme;
  transition?: TransitionName;
  notes?: SlideNotes;
  /** Hidden when the deck is in hurry mode (minus key). */
  skippable?: boolean;
  /** Kept after the end for questions; next() stops before it. */
  bonus?: boolean;
  /** Section name; consecutive slides with the same section are grouped in the overview. */
  section?: string;
  /** Token overrides, e.g. { "--sn-bg": "oklch(30% 0.1 250)" }. */
  style?: CSSProperties;
};

export type DeckDef = {
  id: string;
  title: string;
  slides: SlideDef[];
  theme?: Theme;
  transition?: TransitionName;
  style?: CSSProperties;
  /** What surrounds the 16:9 stage on a wider screen: black, or the current slide's own background. Default black. */
  letterbox?: "black" | "stage";
  /** Whole-talk budget in seconds, for the pace indicator. */
  totalTime?: number;
};

export type Blank = null | "black" | "white";

export type DeckState = {
  slide: number;
  step: number;
  blank: Blank;
};

export const initialState: DeckState = { slide: 0, step: 0, blank: null };

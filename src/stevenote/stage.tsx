"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { DeckContext, SlideContext } from "./context";
import { StepProvider } from "./steps";
import type { DeckDef, DeckState } from "./types";
import type { Prefs } from "./prefs";

/**
 * The 16:9 stage. Pure render of a deck at a given state, so the notes window can show the same
 * components at thumbnail size. The current slide plus one neighbour each side are mounted; the
 * neighbours are hidden and inert so heavy content (video, sandboxes) is ready before it is shown.
 */
export function Stage({
  deck,
  state,
  stepCounts,
  onStepCount,
  preview = false,
  chrome = false,
  embedded = false,
  animate = false,
  prefs,
  children,
}: {
  deck: DeckDef;
  state: DeckState;
  stepCounts: Record<number, number>;
  onStepCount?: (slide: number, count: number) => void;
  preview?: boolean;
  chrome?: boolean;
  /** Render inside the page flow instead of filling the viewport. */
  embedded?: boolean;
  /** Keep view-transition names on an embedded stage (only one per document may). */
  animate?: boolean;
  /** Presenter preferences; only the presenting deck passes them. */
  prefs?: Prefs;
  children?: React.ReactNode;
}) {
  const current = deck.slides[state.slide];
  const authoredTheme = current?.theme ?? deck.theme ?? "light";
  const theme = prefs && prefs.theme !== "deck" ? prefs.theme : authoredTheme;
  const style = { ...(deck.style ?? {}), ...(current?.style ?? {}), ...(prefs ? { "--sn-type-scale": prefs.typeScale } : {}) } as CSSProperties;
  const window = preview ? [state.slide] : [state.slide - 1, state.slide, state.slide + 1];

  return (
    <DeckContext.Provider value={{ deck, state, stepCounts }}>
      <div className="sn-viewport" data-preview={preview || undefined} data-embedded={embedded || undefined} data-animate={animate || undefined} data-letterbox={prefs?.letterbox}>
        <div className="sn-stage" data-theme={theme} data-chrome={chrome || undefined} data-counter={prefs?.counter} data-dim={prefs ? String(prefs.dimVideo) : undefined} style={style}>
          {window.map((i) => {
            const slide = deck.slides[i];
            if (!slide) return null;
            const active = i === state.slide;
            return (
              <SlideFrame key={slide.id} index={i} active={active} preview={preview} step={active ? state.step : i < state.slide ? (stepCounts[i] ?? 0) : 0} onStepCount={onStepCount}>
                {slide.content}
              </SlideFrame>
            );
          })}
          {chrome && (
            <>
              {prefs?.progress && <div className="sn-progress" style={{ width: `${((state.slide + 1) / deck.slides.length) * 100}%` }} />}
              <div className="sn-counter">
                {state.slide + 1} / {deck.slides.length}
              </div>
            </>
          )}
          {prefs?.gridOverlay && <div className="sn-gridlines" aria-hidden><i /></div>}
          {state.blank && <div className="sn-blank" data-color={state.blank} />}
          {children}
        </div>
      </div>
    </DeckContext.Provider>
  );
}

function SlideFrame({
  index,
  active,
  preview,
  step,
  onStepCount,
  children,
}: {
  index: number;
  active: boolean;
  preview: boolean;
  step: number;
  onStepCount?: (slide: number, count: number) => void;
  children: React.ReactNode;
}) {
  const onCount = useCallback((count: number) => onStepCount?.(index, count), [index, onStepCount]);
  const [focus, setFocus] = useState(false);
  const ctx = useMemo(() => ({ active, preview, index, setFocus }), [active, preview, index]);
  return (
    <SlideContext.Provider value={ctx}>
      <section className="sn-slide" data-active={active} data-index={index} data-focus={focus && active ? "true" : undefined} inert={!active || preview} aria-hidden={!active}>
        <div className="sn-slide-inner">
          <StepProvider step={step} onCount={onCount}>
            {children}
          </StepProvider>
        </div>
      </section>
    </SlideContext.Provider>
  );
}

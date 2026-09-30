"use client";

import { useCallback, type CSSProperties } from "react";
import { DeckContext, SlideContext } from "./context";
import { StepProvider } from "./steps";
import type { DeckDef, DeckState } from "./types";

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
  children,
}: {
  deck: DeckDef;
  state: DeckState;
  stepCounts: Record<number, number>;
  onStepCount?: (slide: number, count: number) => void;
  preview?: boolean;
  chrome?: boolean;
  children?: React.ReactNode;
}) {
  const current = deck.slides[state.slide];
  const theme = current?.theme ?? deck.theme ?? "light";
  const style = { ...(deck.style ?? {}), ...(current?.style ?? {}) } as CSSProperties;
  const window = preview ? [state.slide] : [state.slide - 1, state.slide, state.slide + 1];

  return (
    <DeckContext.Provider value={{ deck, state, stepCounts }}>
      <div className="sn-viewport" data-preview={preview || undefined}>
        <div className="sn-stage" data-theme={theme} data-chrome={chrome || undefined} style={style}>
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
              <div className="sn-progress" style={{ width: `${((state.slide + 1) / deck.slides.length) * 100}%` }} />
              <div className="sn-counter">
                {state.slide + 1} / {deck.slides.length}
              </div>
            </>
          )}
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
  return (
    <SlideContext.Provider value={{ active, preview, index }}>
      <section className="sn-slide" data-active={active} data-index={index} inert={!active || preview} aria-hidden={!active}>
        <div className="sn-slide-inner">
          <StepProvider step={step} onCount={onCount}>
            {children}
          </StepProvider>
        </div>
      </section>
    </SlideContext.Provider>
  );
}

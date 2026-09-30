"use client";

import { createContext, useCallback, useContext, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";

/**
 * Builds. A step is a click. Step 0 is the slide's first state; step k reveals everything at index <= k.
 * Components register in a layout effect so the count is right before first paint, and so no
 * entrance animation plays when a slide is entered at a later step or revisited.
 *
 * Positions follow Slidev's vocabulary: absolute (at={3}), relative to document order (omitted), or a span
 * (a component that owns several clicks, like a video with chapters).
 */

type Entry = { key: string; el: Element | null; at?: number; span: number };

type Registry = {
  step: number;
  register: (entry: Entry) => void;
  unregister: (key: string) => void;
  assigned: Map<string, number>;
};

const StepRegistryContext = createContext<Registry | null>(null);

export function StepProvider({ step, onCount, children }: { step: number; onCount?: (count: number) => void; children: ReactNode }) {
  const entries = useRef(new Map<string, Entry>());
  const [assigned, setAssigned] = useState<Map<string, number>>(() => new Map());
  const [count, setCount] = useState(0);
  const dirty = useRef(false);

  const recompute = () => {
    const all = [...entries.current.values()];
    const autos = all.filter((e) => e.at === undefined);
    autos.sort((a, b) => {
      if (!a.el || !b.el) return 0;
      const pos = a.el.compareDocumentPosition(b.el);
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : pos & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
    });
    const next = new Map<string, number>();
    let cursor = 1;
    for (const e of autos) {
      next.set(e.key, cursor);
      cursor += e.span;
    }
    let max = cursor - 1;
    for (const e of all) {
      if (e.at !== undefined) {
        next.set(e.key, e.at);
        max = Math.max(max, e.at + e.span - 1);
      }
    }
    setAssigned(next);
    setCount(max);
  };

  const register = useCallback((entry: Entry) => {
    entries.current.set(entry.key, entry);
    dirty.current = true;
  }, []);
  const unregister = useCallback((key: string) => {
    entries.current.delete(key);
    dirty.current = true;
  }, []);

  // Children's layout effects run before this one, so every registration for this commit is in by now.
  useLayoutEffect(() => {
    if (dirty.current) {
      dirty.current = false;
      recompute();
    }
  });

  useLayoutEffect(() => {
    onCount?.(count);
  }, [count, onCount]);

  const value = useMemo<Registry>(() => ({ step, assigned, register, unregister }), [step, assigned, register, unregister]);
  return <StepRegistryContext.Provider value={value}>{children}</StepRegistryContext.Provider>;
}

export type StepState = "pending" | "active" | "past";

/**
 * Register one step and learn its state. `at` is an absolute click index; omit it for document order.
 * `ref` is the element used for document-order sorting (only needed when `at` is omitted).
 */
export function useStep(at?: number, ref?: RefObject<Element | null>): { index: number; state: StepState; step: number } {
  const ctx = useContext(StepRegistryContext);
  const key = useId();
  useLayoutEffect(() => {
    if (!ctx) return;
    ctx.register({ key, el: ref?.current ?? null, at, span: 1 });
    return () => ctx.unregister(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.register, at]);
  const index = ctx?.assigned.get(key) ?? at ?? Number.POSITIVE_INFINITY;
  const step = ctx?.step ?? Number.POSITIVE_INFINITY;
  const state: StepState = step < index ? "pending" : step === index ? "active" : "past";
  return { index, state, step };
}

/**
 * Register a span of `count` consecutive steps owned by one component (a video with chapters, a code
 * walkthrough). Returns the local step: 0 before the span starts, 1..count inside it, count after.
 */
export function useStepSpan(count: number, at?: number, ref?: RefObject<Element | null>): { start: number; local: number } {
  const ctx = useContext(StepRegistryContext);
  const key = useId();
  useLayoutEffect(() => {
    if (!ctx || count <= 0) return;
    ctx.register({ key, el: ref?.current ?? null, at, span: count });
    return () => ctx.unregister(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.register, at, count]);
  const start = ctx?.assigned.get(key) ?? at ?? Number.POSITIVE_INFINITY;
  const step = ctx?.step ?? 0;
  const local = Math.max(0, Math.min(count, step - start + 1));
  return { start, local };
}

export function useCurrentStep() {
  return useContext(StepRegistryContext)?.step ?? 0;
}

"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Baseline snapping. A line box can sit on the grid while its glyphs float inside it, by an amount that
 * depends on the font and the size. This measures where the first line's baseline actually is and nudges
 * the block (a transform, so nothing else moves) onto the nearest baseline of the slide grid.
 * Later lines follow because line heights are whole baselines. Re-measures on resize and font load.
 */
const canvas = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;

function firstTextNode(root: Node): Text | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
  return walker.nextNode() as Text | null;
}

export function useBaselineSnap<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const slide = el?.closest<HTMLElement>(".sn-slide");
    if (!el || !slide || !canvas) return;
    const probe = document.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:absolute;left:0;top:0;width:0;height:var(--sn-base);visibility:hidden;pointer-events:none";
    slide.appendChild(probe);

    const snap = () => {
      el.style.translate = "";
      const text = firstTextNode(el);
      const base = probe.getBoundingClientRect().height; // rendered px, so thumbnails and scaling just work
      const local = probe.offsetHeight;
      if (!text || !base || !local) return;
      const range = document.createRange();
      range.setStart(text, text.textContent!.search(/\S/));
      range.setEnd(text, text.textContent!.search(/\S/) + 1);
      const rect = range.getClientRects()[0];
      if (!rect) return;
      const parent = text.parentElement!;
      const cs = getComputedStyle(parent);
      canvas.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const m = canvas.measureText("H");
      const ascent = m.fontBoundingBoxAscent;
      const descent = m.fontBoundingBoxDescent;
      const scale = rect.height / (ascent + descent || 1);
      const baseline = rect.bottom - descent * scale;
      const origin = slide.getBoundingClientRect().top + 4 * base; // grid lines start at the top margin, four baselines down
      const off = (((baseline - origin) % base) + base) % base;
      const nudge = off < base / 2 ? -off : base - off;
      if (Math.abs(nudge) > 0.25) el.style.translate = `0 ${(nudge * local) / base}px`;
    };

    snap();
    const ro = new ResizeObserver(snap);
    ro.observe(slide);
    document.fonts?.ready.then(snap).catch(() => {});
    return () => {
      ro.disconnect();
      probe.remove();
      el.style.translate = "";
    };
  }, []);
  return ref;
}

/** Wrap a block of text whose first baseline should sit on the grid. */
export function Baseline({ children, style, className }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  const ref = useBaselineSnap<HTMLDivElement>();
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

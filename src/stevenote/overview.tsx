"use client";

import { useEffect, useRef, useState } from "react";
import { Stage } from "./stage";
import type { DeckReview } from "./review";
import type { DeckDef as Deck } from "./types";

/**
 * The overview: every slide as a thumbnail in a scrolling grid, with its review state.
 * Click or Enter jumps there; arrows move the selection; O or Esc closes.
 * Thumbnails mount only when scrolled near, and render as previews (no live calls, no playback).
 */
export function Overview({ deck, current, stepCounts, review, onJump, onClose }: { deck: Deck; current: number; stepCounts: Record<number, number>; review: DeckReview; onJump: (i: number) => void; onClose: () => void }) {
  const [sel, setSel] = useState(current);
  const [filter, setFilter] = useState<"all" | "open">("all");
  const grid = useRef<HTMLDivElement>(null);
  const approvedCount = deck.slides.filter((s) => review[s.id]?.approved).length;
  const shown = deck.slides.map((s, i) => ({ s, i })).filter(({ s }) => filter === "all" || !review[s.id]?.approved);

  useEffect(() => {
    grid.current?.querySelector<HTMLElement>(`[data-i="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cols = grid.current ? getComputedStyle(grid.current).gridTemplateColumns.split(" ").length : 4;
      const pos = Math.max(0, shown.findIndex(({ i }) => i === sel));
      const move = (d: number) => setSel(shown[Math.min(shown.length - 1, Math.max(0, pos + d))]?.i ?? sel);
      const k = e.key;
      if (k === "Escape" || k === "o" || k === "O") onClose();
      else if (k === "Enter" || k === " ") onJump(sel);
      else if (k === "ArrowRight") move(1);
      else if (k === "ArrowLeft") move(-1);
      else if (k === "ArrowDown") move(cols);
      else if (k === "ArrowUp") move(-cols);
      else if (k === "Home") move(-Infinity);
      else if (k === "End") move(Infinity);
      else if (k === "u" || k === "U") setFilter((f) => (f === "all" ? "open" : "all"));
      else return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [shown, sel, onClose, onJump]);

  return (
    <div className="sn-overview" role="dialog" aria-label="All slides">
      <header className="sn-overview-head">
        <strong>Slides</strong>
        <span className="muted">
          {approvedCount} of {deck.slides.length} approved
        </span>
        <span className="sn-overview-bar" aria-hidden>
          <i style={{ width: `${(approvedCount / Math.max(1, deck.slides.length)) * 100}%` }} />
        </span>
        <button type="button" className="sn-overview-filter" data-on={filter === "open" || undefined} onClick={() => setFilter((f) => (f === "all" ? "open" : "all"))}>
          {filter === "open" ? "Showing not approved" : "Show not approved"} <kbd>U</kbd>
        </button>
        <span className="muted sn-overview-keys">Click or Enter to jump. O or Esc closes.</span>
      </header>
      <div ref={grid} className="sn-overview-grid">
        {shown.map(({ s, i }) => {
          const r = review[s.id];
          const busy = r?.status === "submitted" || r?.status === "updating";
          return (
            <button key={s.id} type="button" data-i={i} className="sn-overview-tile" data-current={i === current || undefined} data-selected={i === sel || undefined} onClick={() => onJump(i)} onMouseEnter={() => setSel(i)}>
              <Thumb deck={deck} index={i} step={stepCounts[i] ?? 0} />
              <span className="sn-overview-meta">
                <span className="sn-overview-num">{i + 1}</span>
                <span className="sn-overview-title">{s.title ?? s.id}</span>
                {r?.approved && <span className="sn-overview-tag" data-kind="approved">✓ Approved</span>}
                {busy && <span className="sn-overview-tag" data-kind="busy">{r?.status === "updating" ? "Updating" : "Submitted"}</span>}
                {!busy && r?.feedback?.trim() && <span className="sn-overview-tag" data-kind="feedback">Feedback</span>}
              </span>
            </button>
          );
        })}
        {shown.length === 0 && <p className="muted">Every slide is approved.</p>}
      </div>
    </div>
  );
}

/** One slide, rendered small, mounted when it scrolls near the viewport. */
function Thumb({ deck, index, step }: { deck: Deck; index: number; step: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="sn-overview-thumb">
      {near && <Stage deck={deck} state={{ slide: index, step, blank: null }} stepCounts={{}} preview />}
    </div>
  );
}

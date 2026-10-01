"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Stage } from "./stage";
import { Shortcuts } from "./shortcuts";
import type { DeckReview } from "./review";
import type { DeckDef as Deck } from "./types";

type Filter = "all" | "open" | "feedback";

/**
 * The overview: every slide as a thumbnail, grouped by section, with its review state.
 * Click or Enter closes it and goes to the slide. Arrows move the selection; / searches titles;
 * U and F filter to slides not approved or with feedback; ? shows the keys; O or Esc closes.
 * Thumbnails mount only when scrolled near, and render as previews (no live calls, no playback).
 */
export function Overview({ deck, current, stepCounts, review, onJump, onClose }: { deck: Deck; current: number; stepCounts: Record<number, number>; review: DeckReview; onJump: (i: number) => void; onClose: () => void }) {
  const [sel, setSel] = useState(current);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [keysOpen, setKeysOpen] = useState(false);
  const grid = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);

  const approvedCount = deck.slides.filter((s) => review[s.id]?.approved).length;
  const feedbackCount = deck.slides.filter((s) => review[s.id]?.feedback?.trim()).length;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deck.slides
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => filter !== "open" || !review[s.id]?.approved)
      .filter(({ s }) => filter !== "feedback" || !!review[s.id]?.feedback?.trim())
      .filter(({ s, i }) => !q || (s.title ?? s.id).toLowerCase().includes(q) || String(i + 1) === q);
  }, [deck.slides, review, filter, query]);

  // Group consecutive slides by section, keeping counts for each header.
  const sections = useMemo(() => {
    const out: { name?: string; items: typeof shown }[] = [];
    for (const it of shown) {
      const last = out[out.length - 1];
      if (last && last.name === it.s.section) last.items.push(it);
      else out.push({ name: it.s.section, items: [it] });
    }
    return out;
  }, [shown]);
  const sectionTotals = useMemo(() => {
    const t: Record<string, { all: number; approved: number }> = {};
    for (const s of deck.slides) {
      if (!s.section) continue;
      t[s.section] ??= { all: 0, approved: 0 };
      t[s.section].all++;
      if (review[s.id]?.approved) t[s.section].approved++;
    }
    return t;
  }, [deck.slides, review]);

  useEffect(() => {
    grid.current?.querySelector<HTMLElement>(`[data-i="${sel}"]`)?.scrollIntoView({ block: sel === current ? "center" : "nearest" });
  }, [sel, current]);

  useEffect(() => {
    // Arrow keys move by position on screen, so section headers don't throw off up and down.
    const moveSpatial = (dx: number, dy: number) => {
      const tiles = [...(grid.current?.querySelectorAll<HTMLElement>(".sn-overview-tile") ?? [])];
      const from = tiles.find((t) => Number(t.dataset.i) === sel);
      if (!from) return setSel(shown[0]?.i ?? sel);
      const a = from.getBoundingClientRect();
      let best: HTMLElement | undefined;
      let bestScore = Infinity;
      for (const t of tiles) {
        if (t === from) continue;
        const b = t.getBoundingClientRect();
        const ddx = b.left - a.left;
        const ddy = b.top - a.top;
        if (dy !== 0 && Math.sign(Math.round(ddy / 4)) !== dy) continue;
        if (dx !== 0 && (Math.abs(ddy) > 4 || Math.sign(ddx) !== dx)) continue;
        const score = dy !== 0 ? Math.abs(ddy) * 10 + Math.abs(ddx) : Math.abs(ddx);
        if (score < bestScore) {
          bestScore = score;
          best = t;
        }
      }
      if (best) setSel(Number(best.dataset.i));
      else if (dx !== 0) {
        // Wrap left and right across rows and sections.
        const pos = shown.findIndex(({ i }) => i === sel);
        const next = shown[pos + dx];
        if (next) setSel(next.i);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      const typing = document.activeElement === search.current;
      if (keysOpen) {
        if (k === "?" || k === "Escape") {
          setKeysOpen(false);
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        return; // the sheet handles its own tab keys
      }
      if (typing) {
        if (k === "Escape") {
          if (query) setQuery("");
          else search.current?.blur();
        } else if (k === "Enter") {
          if (shown[0]) onJump(shown.some(({ i }) => i === sel) ? sel : shown[0].i);
        } else if (k === "ArrowDown") search.current?.blur();
        else return;
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (k === "Escape" || k === "o" || k === "O") onClose();
      else if (k === "Enter" || k === " ") onJump(sel);
      else if (k === "ArrowRight") moveSpatial(1, 0);
      else if (k === "ArrowLeft") moveSpatial(-1, 0);
      else if (k === "ArrowDown") moveSpatial(0, 1);
      else if (k === "ArrowUp") moveSpatial(0, -1);
      else if (k === "Home") setSel(shown[0]?.i ?? sel);
      else if (k === "End") setSel(shown[shown.length - 1]?.i ?? sel);
      else if (k === "u" || k === "U") setFilter((f) => (f === "open" ? "all" : "open"));
      else if (k === "f" || k === "F") setFilter((f) => (f === "feedback" ? "all" : "feedback"));
      else if (k === "/") search.current?.focus();
      else if (k === "?") setKeysOpen(true);
      else return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [shown, sel, query, keysOpen, onClose, onJump]);

  const tabs: { id: Filter; label: string; count: number; key: string }[] = [
    { id: "all", label: "All", count: deck.slides.length, key: "" },
    { id: "open", label: "Not approved", count: deck.slides.length - approvedCount, key: "U" },
    { id: "feedback", label: "Feedback", count: feedbackCount, key: "F" },
  ];

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
        <div className="sn-overview-filters" role="tablist">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={filter === t.id} onClick={() => setFilter(t.id)}>
              {t.label} <span className="sn-overview-count">{t.count}</span>
              {t.key && <kbd>{t.key}</kbd>}
            </button>
          ))}
        </div>
        <label className="sn-overview-search">
          <input ref={search} type="search" placeholder="Search titles" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search slide titles" />
          {!query && <kbd>/</kbd>}
        </label>
        <span className="muted sn-overview-keys">
          <kbd>?</kbd> keys
        </span>
      </header>
      <div ref={grid} className="sn-overview-grid">
        {sections.map((sec, si) => (
          <section key={`${sec.name ?? "none"}-${si}`} className="sn-overview-section">
            {sec.name && (
              <h2 className="sn-overview-section-head">
                {sec.name}
                <span className="muted">
                  {sectionTotals[sec.name]?.approved ?? 0} of {sectionTotals[sec.name]?.all ?? sec.items.length} approved
                </span>
              </h2>
            )}
            <div className="sn-overview-tiles">
              {sec.items.map(({ s, i }) => {
                const r = review[s.id];
                const busy = r?.status === "submitted" || r?.status === "updating";
                return (
                  <div key={s.id} data-i={i} className="sn-overview-tile" data-current={i === current || undefined} data-selected={i === sel || undefined} onMouseEnter={() => setSel(i)}>
                    {/* One click target over the whole tile; the thumbnail inside is inert, so its own buttons never nest in this one. */}
                    <button type="button" className="sn-overview-hit" aria-label={`Slide ${i + 1}: ${s.title ?? s.id}`} onClick={() => onJump(i)} />
                    <Thumb deck={deck} index={i} step={stepCounts[i] ?? 0} />
                    <span className="sn-overview-meta">
                      <span className="sn-overview-num">{i + 1}</span>
                      <span className="sn-overview-title">{s.title ?? s.id}</span>
                      {r?.approved && <span className="sn-overview-tag" data-kind="approved">✓ Approved</span>}
                      {busy && <span className="sn-overview-tag" data-kind="busy">{r?.status === "updating" ? "Updating" : "Submitted"}</span>}
                      {!busy && r?.feedback?.trim() && <span className="sn-overview-tag" data-kind="feedback">Feedback</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {shown.length === 0 && <p className="muted sn-overview-empty">{query ? `No slide titles match "${query}".` : filter === "open" ? "Every slide is approved." : "No slides have feedback."}</p>}
      </div>
      {keysOpen && (
        <div className="sn-overview-keysheet">
          <Shortcuts initial="grid" />
        </div>
      )}
    </div>
  );
}

/**
 * One slide, mounted when it scrolls near the viewport. It renders at presentation size and is scaled
 * down as a picture, so components sized in pixels look the way they do on the real slide.
 */
const RENDER_W = 1600;
function Thumb({ deck, index, step }: { deck: Deck; index: number; step: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "400px" });
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / RENDER_W));
    io.observe(el);
    ro.observe(el);
    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, []);
  return (
    <div ref={ref} className="sn-overview-thumb">
      {near && scale > 0 && (
        <div className="sn-overview-render" style={{ width: RENDER_W, height: (RENDER_W * 9) / 16, transform: `scale(${scale})` }}>
          <Stage deck={deck} state={{ slide: index, step, blank: null }} stepCounts={{}} preview />
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage } from "./stage";
import { parseHash } from "./state";
import { openChannel, readSnapshot, type NavAction, type SyncMessage } from "./sync";
import { initialState, type DeckDef, type DeckState } from "./types";
import { useReview } from "./review";

/**
 * The notes window. Follows the deck over its channel, drives it with the keyboard, and shows what
 * Keynote's presenter display shows: current slide, next build state, notes for this step, step count,
 * elapsed time against the budget, and a clock.
 */
export function Notes({ deck }: { deck: DeckDef }) {
  const snap = useMemo(() => readSnapshot(deck.id), [deck.id]);
  const [state, setState] = useState<DeckState>(() => snap?.state ?? { ...initialState, ...(parseHash(window.location.hash, deck.slides.length) ?? {}) });
  const [stepCounts, setStepCounts] = useState<Record<number, number>>(() => snap?.stepCounts ?? {});
  const [startedAt, setStartedAt] = useState<number | null>(() => snap?.startedAt ?? null);
  const [now, setNow] = useState(() => Date.now());
  const [scale, setScale] = useState(() => {
    try {
      const v = parseFloat(localStorage.getItem("stevenote:notes-scale") ?? "");
      if (v >= 0.6 && v <= 2.2) return v;
    } catch {}
    return 1;
  });
  const [connected, setConnected] = useState(false);
  const [alerts, setAlerts] = useState<Record<number, string>>({});
  const [backups, setBackups] = useState<Record<number, boolean>>({});
  const { review } = useReview(deck.id);
  const channel = useRef<BroadcastChannel | null>(null);
  const seq = useRef(snap?.seq ?? 0);

  const bump = useCallback((d: number) => {
    setScale((v) => {
      const n = Math.min(2.2, Math.max(0.6, Math.round((v + d) * 10) / 10));
      try {
        localStorage.setItem("stevenote:notes-scale", String(n));
      } catch {}
      return n;
    });
  }, []);

  const send = useCallback((nav: NavAction) => channel.current?.postMessage({ type: "nav", nav } satisfies SyncMessage), []);

  useEffect(() => {
    const ch = openChannel(deck.id);
    channel.current = ch;
    if (!ch) return;
    ch.onmessage = (e: MessageEvent<SyncMessage>) => {
      const m = e.data;
      if (m.type === "state") {
        if (m.seq < seq.current) return;
        seq.current = m.seq;
        setState(m.state);
        setStepCounts(m.stepCounts);
        setStartedAt(m.startedAt);
        setAlerts(m.alerts ?? {});
        setBackups(m.backups ?? {});
        setConnected(true);
      } else if (m.type === "hello" && m.from === "deck") {
        ch.postMessage({ type: "hello", from: "notes" } satisfies SyncMessage);
      }
    };
    ch.postMessage({ type: "hello", from: "notes" } satisfies SyncMessage);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      ch.close();
      channel.current = null;
      window.clearInterval(tick);
    };
  }, [deck.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (["ArrowRight", "PageDown", "Enter"].includes(e.key) || (e.key === " " && !e.shiftKey)) {
        e.preventDefault();
        send({ action: "next" });
      } else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key) || (e.key === " " && e.shiftKey)) {
        e.preventDefault();
        send({ action: "prev" });
      } else if (e.key === "b" || e.key === "B" || e.key === ".") send({ action: "toggleBlank" });
      else if (e.key === "+" || e.key === "=") bump(0.1);
      else if (e.key === "-" || e.key === "_") bump(-0.1);
      else if (e.key === "r" || e.key === "R") {
        const t0 = Date.now();
        setStartedAt(t0);
        channel.current?.postMessage({ type: "timer", startedAt: t0 } satisfies SyncMessage);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bump, send]);

  const slide = deck.slides[state.slide];
  const count = stepCounts[state.slide] ?? 0;
  const nextState: DeckState | null = useMemo(() => {
    if (state.step < count) return { ...state, step: state.step + 1 };
    if (state.slide + 1 < deck.slides.length) return { slide: state.slide + 1, step: 0, blank: null };
    return null;
  }, [state, count, deck.slides.length]);
  const nextSlide = nextState ? deck.slides[nextState.slide] : null;

  const budget = useMemo(() => deck.slides.slice(0, state.slide).reduce((a, s) => a + (s.notes?.time ?? 0), 0), [deck, state.slide]);
  const elapsed = startedAt ? Math.floor((now - startedAt) / 1000) : 0;
  const pace = startedAt && budget > 0 ? elapsed - budget : 0;
  const paceColor = !startedAt ? "oklch(70% 0 0)" : pace > 45 ? "oklch(75% 0.18 25)" : pace < -45 ? "oklch(75% 0.12 240)" : "oklch(80% 0.17 150)";
  const clock = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const say = slide?.notes?.steps?.[state.step] ?? slide?.notes?.say;

  return (
    <main className="sn-notes" style={{ fontSize: `${scale}rem` }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem", color: "oklch(70% 0 0)" }}>
        <span style={{ fontFamily: "var(--sn-font-mono)", fontVariantNumeric: "tabular-nums" }}>
          {state.slide + 1} / {deck.slides.length}
          {count > 0 && <span style={{ marginLeft: "1em" }}>step {state.step} of {count}</span>}
          {state.blank && <span style={{ marginLeft: "1em", color: "oklch(80% 0.17 60)" }}>BLANKED</span>}
          {backups[state.slide] && !alerts[state.slide] && <span style={{ marginLeft: "1em", color: "oklch(70% 0.12 150)" }}>backup ready: X</span>}
          {alerts[state.slide] && <span style={{ marginLeft: "1em", color: "oklch(75% 0.18 25)" }}>{alerts[state.slide]}</span>}
          {!connected && <span style={{ marginLeft: "1em", color: "oklch(75% 0.18 25)" }}>waiting for the deck</span>}
        </span>
        <span style={{ fontFamily: "var(--sn-font-mono)", fontVariantNumeric: "tabular-nums", fontSize: "1.6em", color: paceColor }}>
          {fmt(elapsed)}
          {budget > 0 && <span style={{ fontSize: "0.5em", marginLeft: "0.8em", color: "oklch(60% 0 0)" }}>plan {fmt(budget)}</span>}
        </span>
        <span style={{ fontFamily: "var(--sn-font-mono)", fontVariantNumeric: "tabular-nums" }}>{clock}</span>
        <span style={{ display: "flex", gap: "0.5rem" }}>
          <button type="button" onClick={() => bump(-0.1)} aria-label="Smaller text" style={btn}>A−</button>
          <button type="button" onClick={() => bump(0.1)} aria-label="Larger text" style={btn}>A+</button>
        </span>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "1.5rem", minHeight: 0 }}>
        <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: "1rem", minHeight: 0 }}>
          <div className="preview">
            <Stage deck={deck} state={{ ...state, blank: null }} stepCounts={stepCounts} preview />
          </div>
          <div style={{ overflowY: "auto" }}>
            <p style={{ fontSize: "0.85em", color: "oklch(55% 0 0)" }}>Say</p>
            <p style={{ fontSize: "1.9em", lineHeight: 1.3, letterSpacing: "-0.01em", marginTop: "0.3em" }}>{say ?? <span style={{ color: "oklch(45% 0 0)" }}>No notes for this slide.</span>}</p>
            {slide?.notes?.do && (
              <>
                <p style={{ fontSize: "0.85em", color: "oklch(55% 0 0)", marginTop: "1.2em" }}>Do</p>
                <p style={{ fontSize: "1.5em", lineHeight: 1.3, marginTop: "0.3em", color: /click/i.test(slide.notes.do) ? "oklch(85% 0.16 80)" : "oklch(88% 0 0)" }}>{slide.notes.do}</p>
              </>
            )}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateRows: "auto auto 1fr", gap: "0.6rem", alignContent: "start" }}>
          <p style={{ fontSize: "0.85em", color: "oklch(55% 0 0)" }}>Next{nextState && nextState.slide === state.slide ? " (step)" : ""}</p>
          <div className="preview" style={{ opacity: 0.85 }}>
            {nextState ? <Stage deck={deck} state={nextState} stepCounts={stepCounts} preview /> : <div style={{ display: "grid", placeItems: "center", height: "100%", color: "oklch(50% 0 0)" }}>End of deck</div>}
          </div>
          <div>
            <p style={{ fontSize: "0.85em", color: "oklch(55% 0 0)" }}>On screen</p>
            <p style={{ fontSize: "1.1em", color: "oklch(85% 0 0)", marginTop: "0.2em" }}>{slide?.title ?? slide?.id}</p>
            {slide?.notes?.time && <p style={{ fontSize: "0.9em", color: "oklch(60% 0 0)", marginTop: "0.4em" }}>about {slide.notes.time}s</p>}
            {slide && review[slide.id]?.approved && <p style={{ fontSize: "0.9em", color: "oklch(75% 0.15 150)", marginTop: "0.4em" }}>✓ approved</p>}
            {slide && review[slide.id]?.feedback?.trim() && (
              <>
                <p style={{ fontSize: "0.85em", color: "oklch(55% 0 0)", marginTop: "1em" }}>Feedback</p>
                <p style={{ fontSize: "0.95em", color: "oklch(85% 0.12 80)", marginTop: "0.2em", whiteSpace: "pre-wrap" }}>{review[slide.id].feedback}</p>
              </>
            )}
            {nextSlide && (
              <>
                <p style={{ fontSize: "0.85em", color: "oklch(55% 0 0)", marginTop: "1em" }}>Then</p>
                <p style={{ fontSize: "1em", color: "oklch(75% 0 0)", marginTop: "0.2em" }}>{nextSlide.title ?? nextSlide.id}</p>
              </>
            )}
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid oklch(25% 0 0)", paddingTop: "0.8rem", fontSize: "0.8em", color: "oklch(50% 0 0)" }}>
        Arrows and Space move the deck. B blanks it. R resets the timer. Plus and minus change the text size.
      </footer>
    </main>
  );
}

const btn: React.CSSProperties = { border: "1px solid oklch(35% 0 0)", borderRadius: "0.4rem", padding: "0.2rem 0.7rem", background: "transparent", color: "inherit", cursor: "pointer" };

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

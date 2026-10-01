"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { commandForKey, targetOwnsKey } from "./keyboard";
import { Stage } from "./stage";
import { clamp, formatHash, parseHash } from "./state";
import { openChannel, readSnapshot, writeSnapshot, type NavAction, type SyncMessage } from "./sync";
import { runTransition, type Direction } from "./transitions";
import { cyclePref, PrefsPanel, PREF_ROWS, usePrefs, type Prefs } from "./prefs";
import { ReviewFlag, ReviewPanel, useReview } from "./review";
import { initialState, type DeckDef, type DeckState, type TransitionName } from "./types";

/**
 * The deck. Owns state, the URL hash, the keyboard, the notes-window channel and slide transitions.
 * Transitions run through the View Transitions API: the DOM update is a state change inside
 * startViewTransition, and CSS in globals.css animates ::view-transition-old/new(sn-slide) by the
 * transition name and direction set on <html>.
 */
export function Deck({ deck, notesPath }: { deck: DeckDef; notesPath: string }) {
  const [state, setState] = useState<DeckState>(() => ({ ...initialState, ...(parseHash(window.location.hash, deck.slides.length) ?? {}) }));
  const [stepCounts, setStepCounts] = useState<Record<number, number>>({});
  const [help, setHelp] = useState(false);
  const [prefs, setPrefs] = usePrefs();
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("grid") === "1") setPrefs((p) => ({ ...p, gridOverlay: true }));
  }, [setPrefs]);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const { review, source: reviewSource, save: saveReview } = useReview(deck.id, reviewOpen ? deck.slides[state.slide]?.id : null);
  const [prefsRow, setPrefsRow] = useState(0);
  const hurry = prefs.hurry;
  const setHurry = useCallback((v: boolean | ((h: boolean) => boolean)) => setPrefs((p) => ({ ...p, hurry: typeof v === "function" ? v(p.hurry) : v })), [setPrefs]);
  const prefsRef = useRef(prefs);
  const [jump, setJump] = useState<string | null>(null);
  const [cursorHidden, setCursorHidden] = useState(false);
  const [alerts, setAlerts] = useState<Record<number, string>>({});
  const alertsRef = useRef(alerts);
  const [backups, setBackups] = useState<Record<number, boolean>>({});
  const backupsRef = useRef(backups);
  const stateRef = useRef(state);
  const countsRef = useRef(stepCounts);
  useLayoutEffect(() => {
    stateRef.current = state;
    countsRef.current = stepCounts;
    alertsRef.current = alerts;
    backupsRef.current = backups;
    prefsRef.current = prefs;
  }, [state, stepCounts, alerts, backups, prefs]);

  // Live components raise alerts (backup video on, health check failed); the notes window shows them.
  useEffect(() => {
    const onAlert = (e: Event) => {
      const { slide, message } = (e as CustomEvent<{ slide: number; message: string | null }>).detail;
      setAlerts((a) => {
        const next = { ...a };
        if (message) next[slide] = message;
        else delete next[slide];
        return next;
      });
    };
    const onBackup = (e: Event) => {
      const { slide, available } = (e as CustomEvent<{ slide: number; available: boolean }>).detail;
      setBackups((b) => (b[slide] === available ? b : { ...b, [slide]: available }));
    };
    window.addEventListener("stevenote:alert", onAlert);
    window.addEventListener("stevenote:backup-available", onBackup);
    return () => {
      window.removeEventListener("stevenote:alert", onAlert);
      window.removeEventListener("stevenote:backup-available", onBackup);
    };
  }, []);
  const seq = useRef(0);
  const startedAt = useRef<number | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  const lastNav = useRef(0);

  const lastIndex = (() => {
    let i = deck.slides.length - 1;
    while (i > 0 && deck.slides[i].bonus) i--;
    return i;
  })();

  const onStepCount = useCallback((slide: number, count: number) => {
    setStepCounts((prev) => (prev[slide] === count ? prev : { ...prev, [slide]: count }));
  }, []);

  /* ---- apply a state, with a view transition when the slide changes ---- */
  const apply = useCallback(
    (next: DeckState, opts: { push?: boolean } = {}) => {
      const prev = stateRef.current;
      next = { ...next, slide: clamp(next.slide, 0, deck.slides.length - 1), step: Math.max(0, next.step) };
      if (next.slide === prev.slide && next.step === prev.step && next.blank === prev.blank) return;
      const slideChanged = next.slide !== prev.slide;
      const direction: Direction = next.slide > prev.slide || (next.slide === prev.slide && next.step > prev.step) ? "forward" : "back";

      const commit = () => {
        setState(next);
        const hash = formatHash(next);
        if (slideChanged && opts.push !== false) window.history.pushState(null, "", hash);
        else window.history.replaceState(null, "", hash);
      };

      if (slideChanged) {
        const authored: TransitionName = deck.slides[next.slide].transition ?? deck.transition ?? "fade";
        const name = prefsRef.current.transition === "deck" ? authored : prefsRef.current.transition;
        runTransition(name, direction, commit, prefsRef.current.motion);
      } else {
        commit();
      }
    },
    [deck],
  );

  /* ---- navigation ---- */
  const next = useCallback(() => {
    const s = stateRef.current;
    if (s.blank) return apply({ ...s, blank: null });
    const count = countsRef.current[s.slide] ?? 0;
    if (s.step < count) return apply({ ...s, step: s.step + 1 });
    let target = s.slide + 1;
    while (hurry && target <= lastIndex && deck.slides[target].skippable) target++;
    if (target > lastIndex) return;
    apply({ ...s, slide: target, step: 0 });
  }, [apply, deck, hurry, lastIndex]);

  const prev = useCallback(() => {
    const s = stateRef.current;
    if (s.blank) return apply({ ...s, blank: null });
    if (s.step > 0) return apply({ ...s, step: s.step - 1 });
    let target = s.slide - 1;
    while (hurry && target > 0 && deck.slides[target].skippable) target--;
    if (target < 0) return;
    // Land on the previous slide's final build state, as Keynote does.
    apply({ ...s, slide: target, step: countsRef.current[target] ?? 0 });
  }, [apply, deck, hurry]);

  const goto = useCallback(
    (slide: number, step = 0) => {
      apply({ ...stateRef.current, slide, step, blank: null });
    },
    [apply],
  );

  const runNav = useCallback(
    (nav: NavAction) => {
      switch (nav.action) {
        case "next":
          return next();
        case "prev":
          return prev();
        case "goto":
          return goto(nav.slide, nav.step ?? 0);
        case "blank":
          return apply({ ...stateRef.current, blank: nav.color });
        case "toggleBlank":
          return apply({ ...stateRef.current, blank: stateRef.current.blank ? null : "black" });
      }
    },
    [apply, goto, next, prev],
  );

  /* ---- hash: initial read, and browser back/forward ---- */
  useEffect(() => {
    const snap = readSnapshot(deck.id);
    if (snap?.startedAt) startedAt.current = snap.startedAt;
    const onPop = () => {
      const h = parseHash(window.location.hash, deck.slides.length);
      if (h) apply({ ...stateRef.current, ...h }, { push: false });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [apply, deck]);

  /* ---- notes window channel ---- */
  const broadcast = useCallback(() => {
    const msg: SyncMessage = { type: "state", state: stateRef.current, stepCounts: countsRef.current, seq: ++seq.current, startedAt: startedAt.current, alerts: alertsRef.current, backups: backupsRef.current };
    channel.current?.postMessage(msg);
    writeSnapshot(deck.id, { state: msg.state, stepCounts: msg.stepCounts, seq: msg.seq, startedAt: msg.startedAt });
  }, [deck.id]);

  useEffect(() => {
    const ch = openChannel(deck.id);
    channel.current = ch;
    if (!ch) return;
    ch.onmessage = (e: MessageEvent<SyncMessage>) => {
      const m = e.data;
      if (m.type === "hello") broadcast();
      else if (m.type === "nav") runNav(m.nav);
      else if (m.type === "timer") {
        startedAt.current = m.startedAt;
        broadcast();
      }
    };
    ch.postMessage({ type: "hello", from: "deck" } satisfies SyncMessage);
    return () => {
      ch.close();
      channel.current = null;
    };
  }, [deck.id, broadcast, runNav]);

  useEffect(() => {
    if (startedAt.current === null && (state.slide > 0 || state.step > 0)) startedAt.current = Date.now();
    broadcast();
  }, [state, stepCounts, alerts, backups, broadcast]);

  /* ---- keyboard ---- */
  const openNotes = useCallback(() => {
    const url = `${notesPath}${formatHash(stateRef.current)}`;
    window.open(url, `stevenote-notes-${deck.id}`, "popup,width=1280,height=840");
  }, [deck.id, notesPath]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target !== null && targetOwnsKey(e)) return;
      if (prefsOpen) {
        const rows = PREF_ROWS.length + 1;
        if (e.key === "ArrowDown" || e.key === "Tab") setPrefsRow((r) => (r + 1) % rows);
        else if (e.key === "ArrowUp") setPrefsRow((r) => (r - 1 + rows) % rows);
        else if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
          if (prefsRow === PREF_ROWS.length) setPrefsOpen(false);
          else setPrefs((p) => cyclePref(p, PREF_ROWS[prefsRow].key, 1));
        } else if (e.key === "ArrowLeft") {
          if (prefsRow < PREF_ROWS.length) setPrefs((p) => cyclePref(p, PREF_ROWS[prefsRow].key, -1));
        } else if (e.key === "Escape" || e.key === ",") setPrefsOpen(false);
        e.preventDefault();
        return;
      }
      if (reviewOpen && e.key === "Escape") {
        setReviewOpen(false);
        e.preventDefault();
        return;
      }
      if (e.key === "," && !e.metaKey && !e.ctrlKey) {
        setPrefsOpen(true);
        setHelp(false);
        e.preventDefault();
        return;
      }
      // Type a slide number, then Enter, to jump (as in Keynote).
      if (jump === null && /^\d$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setJump(e.key);
        e.preventDefault();
        return;
      }
      if (jump !== null) {
        if (/^\d$/.test(e.key)) {
          setJump(jump + e.key);
          e.preventDefault();
          return;
        }
        if (e.key === "Enter") {
          const n = parseInt(jump, 10);
          if (Number.isFinite(n)) goto(clamp(n - 1, 0, deck.slides.length - 1));
          setJump(null);
          e.preventDefault();
          return;
        }
        if (e.key === "Escape") {
          setJump(null);
          e.preventDefault();
          return;
        }
      }
      const cmd = commandForKey(e);
      if (!cmd) return;
      e.preventDefault();
      // Remotes double fire; ignore a second navigation inside 80ms.
      if ((cmd === "next" || cmd === "prev") && performance.now() - lastNav.current < 80) return;
      if (cmd === "next" || cmd === "prev") lastNav.current = performance.now();
      switch (cmd) {
        case "next":
          return next();
        case "prev":
          return prev();
        case "first":
          return goto(0);
        case "last":
          return goto(lastIndex);
        case "blankBlack":
          return apply({ ...stateRef.current, blank: stateRef.current.blank === "black" ? null : "black" });
        case "blankWhite":
          return apply({ ...stateRef.current, blank: stateRef.current.blank === "white" ? null : "white" });
        case "fullscreen":
          return document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
        case "notes":
          return openNotes();
        case "help":
          return setHelp((v) => !v);
        case "hurry":
          return setHurry((v: boolean) => !v);
        case "backup":
          return window.dispatchEvent(new CustomEvent("stevenote:toggle-backup"));
        case "review":
          return setReviewOpen((v) => !v);
        case "approve": {
          const id = deck.slides[stateRef.current.slide].id;
          return saveReview(id, { approved: !review[id]?.approved });
        }
        case "flags":
          return setPrefs((p) => ({ ...p, reviewFlags: !p.reviewFlags }));
        case "grid":
          return setPrefs((p) => ({ ...p, gridOverlay: !p.gridOverlay }));
        case "escape":
          if (help) return setHelp(false);
          if (stateRef.current.blank) return apply({ ...stateRef.current, blank: null });
          return;
      }
    };
    // Keys pressed inside an embedded iframe (a live component on another origin) arrive as messages.
    const onMessage = (e: MessageEvent) => {
      const m = e.data as { source?: string; type?: string; key?: string; shiftKey?: boolean } | null;
      if (!m || m.source !== "stevenote-embed" || m.type !== "key" || typeof m.key !== "string") return;
      onKey(new KeyboardEvent("keydown", { key: m.key, shiftKey: !!m.shiftKey }));
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("message", onMessage);
    };
  }, [apply, deck.slides, goto, help, jump, lastIndex, next, openNotes, prev, prefsOpen, prefsRow, setPrefs, setHurry, reviewOpen, review, saveReview]);

  /* ---- cursor: hide after two seconds still ---- */
  useEffect(() => {
    let t = 0;
    const wake = () => {
      setCursorHidden(false);
      window.clearTimeout(t);
      t = window.setTimeout(() => setCursorHidden(true), 2000);
    };
    wake();
    window.addEventListener("pointermove", wake);
    return () => {
      window.removeEventListener("pointermove", wake);
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("sn-cursor-hidden", cursorHidden && prefs.hideCursor);
    return () => document.documentElement.classList.remove("sn-cursor-hidden");
  }, [cursorHidden, prefs.hideCursor]);

  // Preferences that CSS reads.
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.snMotion = prefs.motion;
    return () => {
      delete html.dataset.snMotion;
    };
  }, [prefs.motion]);

  return (
    <Stage deck={deck} state={state} stepCounts={stepCounts} onStepCount={onStepCount} chrome prefs={prefs}>
      {prefs.reviewFlags && <ReviewFlag approved={!!review[deck.slides[state.slide]?.id]?.approved} hasFeedback={!!review[deck.slides[state.slide]?.id]?.feedback?.trim()} status={review[deck.slides[state.slide]?.id]?.status} updatedAt={review[deck.slides[state.slide]?.id]?.updatedAt} />}
      {reviewOpen && (
        <ReviewPanel
          slideId={deck.slides[state.slide].id}
          title={deck.slides[state.slide].title ?? deck.slides[state.slide].id}
          index={state.slide}
          value={review[deck.slides[state.slide].id]?.feedback ?? ""}
          approved={!!review[deck.slides[state.slide].id]?.approved}
          status={review[deck.slides[state.slide].id]?.status}
          reply={review[deck.slides[state.slide].id]?.reply}
          canSubmit={reviewSource === "private"}
          onChange={(text) => saveReview(deck.slides[state.slide].id, { feedback: text, ...(review[deck.slides[state.slide].id]?.status === "done" ? { status: null, reply: null } : {}) })}
          onToggleApproved={() => saveReview(deck.slides[state.slide].id, { approved: !review[deck.slides[state.slide].id]?.approved })}
          onSubmit={() => {
            saveReview(deck.slides[state.slide].id, { status: "submitted", reply: null });
            setReviewOpen(false);
          }}
          onClose={() => setReviewOpen(false)}
        />
      )}
      {prefsOpen && (
        <PrefsPanel
          prefs={prefs}
          selected={prefsRow}
          onSelect={setPrefsRow}
          onCycle={(key: keyof Prefs, dir) => setPrefs((p) => cyclePref(p, key, dir))}
          onClose={() => setPrefsOpen(false)}
        />
      )}
      {jump !== null && (
        <div className="sn-help" role="status">
          Go to slide <strong>{jump || "…"}</strong>
        </div>
      )}
      {hurry && !help && !prefsOpen && jump === null && (
        <div className="sn-help" role="status">
          Hurry mode: skipping marked slides
        </div>
      )}
      {help && !prefsOpen && (
        <div className="sn-help" role="dialog" aria-label="Keyboard shortcuts">
          <div className="muted" style={{ marginBottom: "0.8cqi", fontSize: "0.85em" }}>
            View transitions: {"startViewTransition" in document ? "supported" : "not supported in this browser"}. OS reduce motion: {window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "on" : "off"}. Motion preference: {prefs.motion}.
          </div>
          <div><kbd>→</kbd><kbd>Space</kbd> next step or slide</div>
          <div><kbd>←</kbd><kbd>⇧Space</kbd> back</div>
          <div><kbd>B</kbd><kbd>.</kbd> black <kbd>W</kbd> white</div>
          <div><kbd>S</kbd> notes window <kbd>F</kbd> fullscreen</div>
          <div>A slide number then <kbd>Enter</kbd> to jump</div>
          <div><kbd>-</kbd> hurry mode <kbd>Home</kbd><kbd>End</kbd> ends</div>
          <div><kbd>X</kbd> swap a live component for its backup video</div>
          <div><kbd>/</kbd> feedback on this slide <kbd>A</kbd> approve <kbd>⇧A</kbd> show or hide flags</div>
          <div><kbd>G</kbd> grid overlay</div>
          <div><kbd>,</kbd> preferences</div>
          <div><kbd>?</kbd> this help <kbd>Esc</kbd> close</div>
        </div>
      )}
    </Stage>
  );
}

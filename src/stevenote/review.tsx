"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Review: feedback and an approval flag per slide, for iterating on a deck with someone else
 * (or with an agent) between rehearsals. The deck stores nothing itself: it reads and writes
 * through /api/private/review, which a private decks repo implements against its own files (a journal
 * of every change plus a snapshot folded from it). Without that route, the browser's localStorage holds
 * the review for the machine you are on; with it, localStorage still keeps a mirror as one more copy.
 */
/**
 * The submit loop: Cmd+Enter in the panel marks a slide "submitted". Whoever is editing the deck
 * (a person, or an agent watching the review file) sets "updating" while they work, then clears the
 * feedback and sets "done" with a short reply. The page polls, so the flag follows along live.
 */
export type ReviewStatus = "submitted" | "updating" | "done";
export type SlideReview = { feedback?: string; approved?: boolean; status?: ReviewStatus | null; reply?: string | null; updatedAt?: string };
export type DeckReview = Record<string, SlideReview>;

const KEY = (deckId: string) => `stevenote:review:${deckId}`;
const POLL_MS = 1500;

export function useReview(deckId: string, editing?: string | null) {
  const [review, setReview] = useState<DeckReview>({});
  const [source, setSource] = useState<"private" | "local" | "loading">("loading");
  const remote = useRef(false);
  const editingRef = useRef(editing);
  useEffect(() => {
    editingRef.current = editing;
  }, [editing]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const url = `/api/private/review?deck=${encodeURIComponent(deckId)}`;
    // Remote wins, except the text of the slide being typed into right now.
    const merge = (data: DeckReview) =>
      setReview((prev) => {
        const id = editingRef.current;
        if (!id || !prev[id]) return data;
        return { ...data, [id]: { ...data[id], feedback: prev[id].feedback } };
      });
    const poll = async () => {
      if (cancelled) return;
      if (document.visibilityState === "visible") {
        try {
          const r = await fetch(url, { cache: "no-store" });
          if (r.ok && !cancelled) merge(((await r.json()) as DeckReview) ?? {});
        } catch {}
      }
      timer = setTimeout(poll, POLL_MS);
    };
    (async () => {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (r.ok) {
          const data = (await r.json()) as DeckReview;
          if (!cancelled) {
            remote.current = true;
            setReview(data ?? {});
            setSource("private");
            timer = setTimeout(poll, POLL_MS);
          }
          return;
        }
      } catch {}
      try {
        const raw = localStorage.getItem(KEY(deckId));
        if (!cancelled) {
          setReview(raw ? (JSON.parse(raw) as DeckReview) : {});
          setSource("local");
        }
      } catch {
        if (!cancelled) setSource("local");
      }
    })();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [deckId]);

  // Patches waiting to go to the server. Typing coalesces per slide; anything else goes at once.
  const pending = useRef<Record<string, SlideReview>>({});
  const flushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flush = useCallback(() => {
    flushTimer.current = undefined;
    const body = pending.current;
    pending.current = {};
    if (!Object.keys(body).length) return;
    const send = () =>
      fetch(`/api/private/review?deck=${encodeURIComponent(deckId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      });
    // One retry, then the browser mirror still has it (see below) and the next edit carries it along.
    send().then((r) => (r.ok ? undefined : Promise.reject())).catch(() => send().catch(() => {}));
  }, [deckId]);
  useEffect(() => {
    // Leaving the page flushes what is still coalescing, so a draft typed just before closing is kept.
    const onHide = () => {
      if (document.visibilityState === "hidden" && flushTimer.current) {
        clearTimeout(flushTimer.current);
        flush();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [flush]);

  const save = useCallback(
    (slideId: string, patch: SlideReview) => {
      const stamped = { ...patch, updatedAt: new Date().toISOString() };
      setReview((prev) => {
        const next = { ...prev, [slideId]: { ...prev[slideId], ...stamped } };
        // Always keep a copy in this browser, even when the server is the store: one more place it survives.
        try {
          localStorage.setItem(KEY(deckId), JSON.stringify(next));
        } catch {}
        return next;
      });
      // Send only the patch, so a stale copy never writes back text someone else already cleared.
      if (remote.current) {
        pending.current[slideId] = { ...pending.current[slideId], ...stamped };
        const typingOnly = Object.keys(patch).every((k) => k === "feedback");
        if (flushTimer.current) clearTimeout(flushTimer.current);
        if (typingOnly) flushTimer.current = setTimeout(flush, 500);
        else flush();
      }
    },
    [deckId, flush],
  );

  return { review, source, save };
}

/** The feedback panel for one slide. Opens on the slash key. Esc closes and keeps the draft; Cmd+Enter submits it. */
export function ReviewPanel({ slideId, title, index, value, approved, status, reply, canSubmit, onChange, onToggleApproved, onSubmit, onClose }: { slideId: string; title: string; index: number; value: string; approved: boolean; status?: ReviewStatus | null; reply?: string | null; canSubmit: boolean; onChange: (text: string) => void; onToggleApproved: () => void; onSubmit: () => void; onClose: () => void }) {
  const busy = status === "submitted" || status === "updating";
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.setSelectionRange(ref.current.value.length, ref.current.value.length);
  }, [slideId]);
  return (
    <div className="sn-review" role="dialog" aria-label="Slide feedback">
      <div className="sn-review-head">
        <span>
          <strong>Feedback</strong> <span className="muted">slide {index + 1}: {title}</span>
        </span>
        <button type="button" className="sn-review-approve" data-on={approved || undefined} onClick={onToggleApproved}>
          {approved ? "✓ Approved" : "Approve"}
        </button>
      </div>
      {status === "done" && reply && <p className="sn-review-reply">{reply}</p>}
      {busy && <StatusPill status={status} />}
      <textarea
        ref={ref}
        value={value}
        readOnly={busy}
        placeholder="What should change on this slide?"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            if (canSubmit && !busy && value.trim()) onSubmit();
            else onClose();
          }
          e.stopPropagation();
        }}
        rows={5}
      />
      <div className="sn-review-foot muted">
        {canSubmit ? "⌘Enter submits. Esc closes and keeps the draft." : "Esc or ⌘Enter closes. Feedback stays in this browser."} A toggles approval. Shift+A hides the flags.
      </div>
    </div>
  );
}

function StatusPill({ status }: { status?: ReviewStatus | null }) {
  const label = status === "updating" ? "Updating" : status === "submitted" ? "Submitted" : "Updated";
  return (
    <span className="sn-status" data-status={status ?? undefined} role="status">
      {status === "done" ? "✓" : <span className="sn-spinner" aria-hidden />}
      {label}
    </span>
  );
}

/** The always-on badge: Approved or Not approved on every slide, until the option is turned off. A submit in flight shows instead. */
export function ApprovalBadge({ approved, status }: { approved: boolean; status?: ReviewStatus | null }) {
  if (status === "submitted" || status === "updating") return <div className="sn-flag-status"><StatusPill status={status} /></div>;
  return (
    <div className="sn-flag-status">
      <span className="sn-badge" data-approved={approved || undefined}>{approved ? "✓ Approved" : "Not approved"}</span>
    </div>
  );
}

const FLAG_VISIBLE_MS = 10_000;

/**
 * A small flag in the corner of the stage, confirming a change: the submit status while one is in flight,
 * then "Updated" or the approval check, each for ten seconds after it happened. The panel keeps the record.
 */
export function ReviewFlag({ approved, status, updatedAt }: { approved: boolean; hasFeedback?: boolean; status?: ReviewStatus | null; updatedAt?: string }) {
  // Anything already older than the window starts expired, so returning to an old slide shows nothing.
  const [expired, setExpired] = useState<string | null>(() => (updatedAt && Date.now() - Date.parse(updatedAt) > FLAG_VISIBLE_MS ? updatedAt : null));
  const settled = status === "done" || (!status && approved);
  useEffect(() => {
    if (!settled || !updatedAt) return;
    const left = FLAG_VISIBLE_MS - (Date.now() - Date.parse(updatedAt));
    const t = setTimeout(() => setExpired(updatedAt), Math.max(0, left));
    return () => clearTimeout(t);
  }, [settled, updatedAt]);
  if (settled && expired === updatedAt) return null;
  if (status) return <div className="sn-flag-status"><StatusPill status={status} /></div>;
  if (!approved) return null;
  return (
    <div className="sn-flag" data-approved aria-label="Approved">
      ✓
    </div>
  );
}

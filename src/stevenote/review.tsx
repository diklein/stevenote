"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Review: feedback and an approval flag per slide, for iterating on a deck with someone else
 * (or with an agent) between rehearsals. The deck stores nothing itself: it reads and writes
 * through /api/private/review, which a private decks repo implements against its own files.
 * Without that route, the browser's localStorage holds the review for the machine you are on.
 */
export type SlideReview = { feedback?: string; approved?: boolean; updatedAt?: string };
export type DeckReview = Record<string, SlideReview>;

const KEY = (deckId: string) => `stevenote:review:${deckId}`;

export function useReview(deckId: string) {
  const [review, setReview] = useState<DeckReview>({});
  const [source, setSource] = useState<"private" | "local" | "loading">("loading");
  const remote = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/private/review?deck=${encodeURIComponent(deckId)}`, { cache: "no-store" });
        if (r.ok) {
          const data = (await r.json()) as DeckReview;
          if (!cancelled) {
            remote.current = true;
            setReview(data ?? {});
            setSource("private");
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
    };
  }, [deckId]);

  const save = useCallback(
    (slideId: string, patch: SlideReview) => {
      setReview((prev) => {
        const next = { ...prev, [slideId]: { ...prev[slideId], ...patch, updatedAt: new Date().toISOString() } };
        if (remote.current) {
          fetch(`/api/private/review?deck=${encodeURIComponent(deckId)}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ [slideId]: next[slideId] }),
          }).catch(() => {});
        } else {
          try {
            localStorage.setItem(KEY(deckId), JSON.stringify(next));
          } catch {}
        }
        return next;
      });
    },
    [deckId],
  );

  return { review, source, save };
}

/** The feedback panel for one slide. Opens on the slash key; Esc or Cmd+Enter closes and keeps the text. */
export function ReviewPanel({ slideId, title, index, value, approved, onChange, onToggleApproved, onClose }: { slideId: string; title: string; index: number; value: string; approved: boolean; onChange: (text: string) => void; onToggleApproved: () => void; onClose: () => void }) {
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
      <textarea
        ref={ref}
        value={value}
        placeholder="What should change on this slide?"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" || ((e.metaKey || e.ctrlKey) && e.key === "Enter")) {
            e.preventDefault();
            onClose();
          }
          e.stopPropagation();
        }}
        rows={5}
      />
      <div className="sn-review-foot muted">Esc or ⌘Enter closes. A toggles approval. Shift+A hides the flags.</div>
    </div>
  );
}

/** A small flag in the corner of the stage: approved, or has feedback. */
export function ReviewFlag({ approved, hasFeedback }: { approved: boolean; hasFeedback: boolean }) {
  if (!approved && !hasFeedback) return null;
  return (
    <div className="sn-flag" data-approved={approved || undefined} data-feedback={hasFeedback || undefined} aria-label={approved ? "Approved" : "Has feedback"}>
      {approved ? "✓" : "…"}
    </div>
  );
}

import type { DeckState } from "./types";

/**
 * Two-window sync. The deck is the leader; the notes window follows and may ask to navigate.
 * Transport is BroadcastChannel keyed by deck id, mirrored to localStorage so a window that
 * opens late hydrates at once. Messages carry a sequence number so stale ones are ignored.
 */

export type NavAction =
  | { action: "next" }
  | { action: "prev" }
  | { action: "goto"; slide: number; step?: number }
  | { action: "blank"; color: "black" | "white" | null }
  | { action: "toggleBlank" };

export type SyncMessage =
  | { type: "hello"; from: "notes" | "deck" }
  | { type: "state"; state: DeckState; stepCounts: Record<number, number>; seq: number; startedAt: number | null; alerts?: Record<number, string> }
  | { type: "nav"; nav: NavAction }
  | { type: "timer"; startedAt: number | null };

export type Snapshot = { state: DeckState; stepCounts: Record<number, number>; seq: number; startedAt: number | null };

export function channelName(deckId: string) {
  return `stevenote:${deckId}`;
}

export function storageKey(deckId: string) {
  return `stevenote:${deckId}:state`;
}

export function readSnapshot(deckId: string): Snapshot | null {
  try {
    const raw = localStorage.getItem(storageKey(deckId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Snapshot;
    if (typeof parsed?.state?.slide !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSnapshot(deckId: string, snap: Snapshot) {
  try {
    localStorage.setItem(storageKey(deckId), JSON.stringify(snap));
  } catch {
    /* private mode or quota: the channel still works */
  }
}

export function openChannel(deckId: string): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  return new BroadcastChannel(channelName(deckId));
}

"use client";

import { useEffect, useState } from "react";
import { TRANSITIONS, type Theme, type TransitionName } from "./types";

/**
 * Presenter preferences. Opened with the comma key, driven with the arrows, saved in localStorage.
 * They override what a deck authored, so a presenter can flatten every transition to a crossfade
 * in a bad room or force a dark theme on a bright projector without touching the deck.
 */
export type Prefs = {
  transition: "deck" | TransitionName;
  theme: "deck" | Theme;
  motion: "auto" | "full" | "reduced";
  dimVideo: boolean;
  counter: "hover" | "always" | "never";
  hideCursor: boolean;
  letterbox: "black" | "stage";
  typeScale: 0.9 | 1 | 1.1 | 1.2;
  hurry: boolean;
  reviewFlags: boolean;
  gridOverlay: boolean;
};

export const defaultPrefs: Prefs = {
  transition: "deck",
  theme: "deck",
  motion: "auto",
  dimVideo: true,
  counter: "hover",
  hideCursor: true,
  letterbox: "black",
  typeScale: 1,
  hurry: false,
  reviewFlags: true,
  gridOverlay: false,
};

const KEY = "stevenote:prefs";

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultPrefs;
    return { ...defaultPrefs, ...(JSON.parse(raw) as Partial<Prefs>), hurry: false, gridOverlay: false };
  } catch {
    return defaultPrefs;
  }
}

export function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...p, hurry: undefined, gridOverlay: undefined }));
  } catch {}
}

type Row<K extends keyof Prefs = keyof Prefs> = { key: K; label: string; values: Prefs[K][]; show: (v: Prefs[K]) => string };

export const PREF_ROWS: Row[] = [
  { key: "transition", label: "Transition", values: ["deck", ...TRANSITIONS], show: (v) => (v === "deck" ? "as authored" : String(v)) } as Row<"transition">,
  { key: "theme", label: "Theme", values: ["deck", "light", "dark"], show: (v) => (v === "deck" ? "as authored" : String(v)) } as Row<"theme">,
  { key: "motion", label: "Motion", values: ["auto", "full", "reduced"], show: (v) => (v === "reduced" ? "reduced: 120ms crossfades" : v === "full" ? "full, even if the OS says reduce" : "follow the OS setting") } as Row<"motion">,
  { key: "dimVideo", label: "Dim around playing video", values: [true, false], show: (v) => (v ? "on" : "off") } as Row<"dimVideo">,
  { key: "counter", label: "Slide counter", values: ["hover", "always", "never"], show: (v) => String(v) } as Row<"counter">,
  { key: "hideCursor", label: "Hide idle cursor", values: [true, false], show: (v) => (v ? "on" : "off") } as Row<"hideCursor">,
  { key: "letterbox", label: "Letterbox", values: ["black", "stage"], show: (v) => (v === "stage" ? "stage colour" : "black") } as Row<"letterbox">,
  { key: "typeScale", label: "Type size", values: [0.9, 1, 1.1, 1.2], show: (v) => `${Math.round(Number(v) * 100)}%` } as Row<"typeScale">,
  { key: "hurry", label: "Hurry mode", values: [false, true], show: (v) => (v ? "on: skipping marked slides" : "off") } as Row<"hurry">,
  { key: "reviewFlags", label: "Review flags", values: [true, false], show: (v) => (v ? "shown" : "hidden") } as Row<"reviewFlags">,
  { key: "gridOverlay", label: "Grid overlay", values: [false, true], show: (v) => (v ? "shown: 12 columns and the baseline" : "hidden") } as Row<"gridOverlay">,
] as Row[];

export function cyclePref(p: Prefs, key: keyof Prefs, dir: 1 | -1): Prefs {
  const row = PREF_ROWS.find((r) => r.key === key)!;
  const values = row.values as Prefs[typeof key][];
  const i = values.indexOf(p[key]);
  const next = values[(i + dir + values.length) % values.length];
  return { ...p, [key]: next };
}

export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(() => (typeof window === "undefined" ? defaultPrefs : loadPrefs()));
  useEffect(() => savePrefs(prefs), [prefs]);
  return [prefs, setPrefs] as const;
}

export function PrefsPanel({ prefs, selected, onSelect, onCycle, onClose }: { prefs: Prefs; selected: number; onSelect: (i: number) => void; onCycle: (key: keyof Prefs, dir: 1 | -1) => void; onClose: () => void }) {
  return (
    <div className="sn-prefs" role="dialog" aria-label="Preferences">
      <div className="sn-prefs-title">
        Preferences <span className="muted">arrows to move and change, Esc to close</span>
      </div>
      {PREF_ROWS.map((row, i) => (
        <div
          key={row.key}
          className="sn-prefs-row"
          data-selected={i === selected || undefined}
          onMouseEnter={() => onSelect(i)}
          onClick={() => onCycle(row.key, 1)}
        >
          <span>{row.label}</span>
          <span className="sn-prefs-value">
            <button type="button" aria-label={`${row.label}: previous`} onClick={(e) => { e.stopPropagation(); onCycle(row.key, -1); }}>‹</button>
            {row.show(prefs[row.key] as never)}
            <button type="button" aria-label={`${row.label}: next`} onClick={(e) => { e.stopPropagation(); onCycle(row.key, 1); }}>›</button>
          </span>
        </div>
      ))}
      <div className="sn-prefs-row" data-selected={selected === PREF_ROWS.length || undefined} onMouseEnter={() => onSelect(PREF_ROWS.length)} onClick={onClose}>
        <span>Close</span>
        <span className="sn-prefs-value">Esc</span>
      </div>
    </div>
  );
}

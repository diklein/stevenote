/**
 * Key map. The union of reveal.js, Slidev and clicker conventions. Logitech presenters send
 * PageUp and PageDown; some send arrows. Shift is the universal "back" modifier.
 */

export type DeckCommand =
  | "next"
  | "prev"
  | "first"
  | "last"
  | "blankBlack"
  | "blankWhite"
  | "fullscreen"
  | "notes"
  | "help"
  | "escape"
  | "hurry"
  | "backup"
  | "review"
  | "approve"
  | "flags"
  | "grid"
  | "overview";

/**
 * One table drives both the key handling and the shortcuts sheet, so the sheet can never drift.
 * `keys` are what the handler matches (shift: true or false narrows it; omitted means either).
 * `show` is how the sheet draws it: each inner array is one chord (caps drawn tight together);
 * several chords are alternatives, or a sequence when `then` is set.
 */
export type SheetGroup = "present" | "review" | "grid" | "always";
type Match = { key: string; shift?: boolean };
export type Binding = { command?: DeckCommand; keys?: Match[]; show: string[][]; then?: boolean; label: string; group: SheetGroup };

const k = (...keys: string[]): Match[] => keys.map((key) => ({ key }));

export const BINDINGS: Binding[] = [
  { command: "next", keys: [...k("ArrowRight", "PageDown", "n", "Enter"), { key: " ", shift: false }], show: [["→"], ["Space"]], label: "Next build or slide", group: "present" },
  { command: "prev", keys: [...k("ArrowLeft", "PageUp", "Backspace", "p"), { key: " ", shift: true }], show: [["←"], ["⇧", "Space"]], label: "Back", group: "present" },
  { command: "first", keys: k("Home"), show: [["Home"]], label: "First slide", group: "present" },
  { command: "last", keys: k("End"), show: [["End"]], label: "Last slide", group: "present" },
  { show: [["1–9"], ["Enter"]], then: true, label: "Jump to a slide by number", group: "present" },
  { command: "blankBlack", keys: k("b", "B", "."), show: [["B"]], label: "Black screen", group: "present" },
  { command: "blankWhite", keys: k("w", "W"), show: [["W"]], label: "White screen", group: "present" },
  { command: "fullscreen", keys: k("f", "F"), show: [["F"]], label: "Fullscreen", group: "present" },
  { command: "notes", keys: k("s", "S", "N"), show: [["S"]], label: "Speaker notes window", group: "present" },
  { command: "hurry", keys: k("-", "_"), show: [["-"]], label: "Hurry mode: skip marked slides", group: "present" },
  { command: "backup", keys: k("x", "X"), show: [["X"]], label: "Swap a live demo for its backup video", group: "present" },

  { command: "overview", keys: k("o", "O"), show: [["O"]], label: "All slides", group: "review" },
  { command: "review", keys: k("/"), show: [["/"]], label: "Feedback on this slide", group: "review" },
  { show: [["⌘", "Enter"]], label: "Submit feedback (in the feedback box)", group: "review" },
  { command: "approve", keys: k("a"), show: [["A"]], label: "Approve this slide", group: "review" },
  { command: "flags", keys: k("A"), show: [["⇧", "A"]], label: "Show or hide the corner flags", group: "review" },
  { command: "grid", keys: k("g", "G"), show: [["G"]], label: "Grid overlay", group: "review" },

  { show: [["←"], ["→"], ["↑"], ["↓"]], label: "Move between slides", group: "grid" },
  { show: [["Enter"]], label: "Go to the selected slide (or click it)", group: "grid" },
  { show: [["/"]], label: "Search titles", group: "grid" },
  { show: [["U"]], label: "Only slides not approved", group: "grid" },
  { show: [["F"]], label: "Only slides with feedback", group: "grid" },
  { show: [["O"]], label: "Close", group: "grid" },

  { command: "help", keys: k("?"), show: [["?"]], label: "Shortcuts", group: "always" },
  { show: [[","]], label: "Preferences", group: "always" },
  { command: "escape", keys: k("Escape"), show: [["Esc"]], label: "Close whatever is open", group: "always" },
];

export function commandForKey(e: KeyboardEvent): DeckCommand | null {
  const { key, shiftKey, metaKey, ctrlKey, altKey } = e;
  if (metaKey || ctrlKey || altKey) return null;
  for (const b of BINDINGS) {
    if (b.command && b.keys?.some((m) => m.key === key && (m.shift === undefined || m.shift === shiftKey))) return b.command;
  }
  return null;
}

/** True when the event target owns the keyboard (an input, a button that Space should click, an editor). */
export function targetOwnsKey(e: KeyboardEvent): boolean {
  const t = e.target instanceof HTMLElement ? e.target : null;
  if (!t) return false;
  if (t.closest("[data-keyboard-owner]")) return e.key !== "Escape";
  const tag = t.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable) return true;
  // A focused button, link or slider inside a live slide keeps Space and Enter.
  if ((tag === "BUTTON" || tag === "A" || t.getAttribute("role") === "button") && (e.key === " " || e.key === "Enter")) return true;
  if (t.closest("video") && (e.key === " " || e.key === "ArrowLeft" || e.key === "ArrowRight")) return true;
  return false;
}

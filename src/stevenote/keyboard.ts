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
  | "jumpStart";

export function commandForKey(e: KeyboardEvent): DeckCommand | null {
  const { key, shiftKey, metaKey, ctrlKey, altKey } = e;
  if (metaKey || ctrlKey || altKey) return null;
  switch (key) {
    case "ArrowRight":
    case "PageDown":
    case "n":
    case "Enter":
      return "next";
    case " ":
      return shiftKey ? "prev" : "next";
    case "ArrowLeft":
    case "PageUp":
    case "Backspace":
    case "p":
      return "prev";
    case "Home":
      return "first";
    case "End":
      return "last";
    case "b":
    case "B":
    case ".":
      return "blankBlack";
    case "w":
    case "W":
      return "blankWhite";
    case "f":
    case "F":
      return "fullscreen";
    case "s":
    case "S":
    case "N":
      return "notes";
    case "?":
      return "help";
    case "Escape":
      return "escape";
    case "-":
    case "_":
      return "hurry";
    case "g":
    case "G":
      return "jumpStart";
    default:
      return null;
  }
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
